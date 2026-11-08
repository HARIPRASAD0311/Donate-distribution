# ResQNet Data Quality & Anomaly Audit Report

**Scope**: Synthetic source data in `data/source/` (Assam Brahmaputra Flood Response scenario).  
**Methodology**: Automated schema inspection, referential integrity verification, arithmetic balance validation, and temporal audit.  
**Constraint**: Per project guidelines, source data files are **never modified silently**. All anomalies, contradictions, and legacy relics identified during ingestion are cataloged below.

---

## Executive Summary of Findings

| Audit Check | Status | Severity | Summary |
| :--- | :--- | :--- | :--- |
| **1. Duplicate Records** | **FAIL** | High | Duplicate primary key in `demands.csv` (`DEM-2024-061` appears twice with conflicting quantities). |
| **2. ID Scheme Divergence** | **FAIL** | High | Facilities use `id` (`FAC-01`) vs `code` (`CSD-01`); dispatches reference unmapped `BEN-*` codes instead of `GRP-*`. |
| **3. Mixed Coordinate Formats & Geo Inconsistency** | **FAIL** | Critical | 4 distinct coordinate encodings; facilities/zones placed in Mozambique ($-19.8^\circ, 34.8^\circ$) while metadata targets Assam ($26.1^\circ, 91.5^\circ$). |
| **4. Nested JSON in CSV Cells** | **FAIL** | Medium | 17 columns store raw JSON strings (arrays/objects) inside flat CSV cells. |
| **5. Relative / Non-ISO Times** | **FAIL** | High | 5 dispatch orders use relative strings like `"Today 17:30 UTC"`; inventory uses relative `"daysToExpiry"`. |
| **6. Arithmetic Inconsistencies** | **FAIL** | High | Water inventory `RES-W02` usableQty mismatch; duplicate demand `DEM-2024-061` remainingQuantity mismatch. |
| **7. Orphan References** | **FAIL** | High | All 6 dispatch destinations (`BEN-01` to `BEN-06`) fail foreign key lookup in `beneficiaries.csv`. |
| **8. Documentation File Name Discrepancies** | **FAIL** | Low | Notes refer to `demand.csv`, `beneficiary-groups.csv`, `dispatch-orders.csv`, and `audit-events.csv`. |

---

## Detailed Anomaly Reports

### 1. Duplicate Records & Primary Key Collisions
* **File**: `data/source/csv/demands.csv`
  * **Record 1 (Row 1)**:
    * `id`: `DEM-2024-061`
    * `beneficiaryGroupId`: `GRP-01`
    * `item`: High-Energy Emergency Food Biscuits (BP-5)
    * `quantity`: `1450`, `fulfilledQuantity`: `450`, `remainingQuantity`: `1000`
  * **Record 2 (Row 11)**:
    * `id`: `DEM-2024-061` (Duplicate ID)
    * `beneficiaryGroupId`: `GRP-05`
    * `item`: Emergency Family Hygiene & Dignity Kits
    * `quantity`: `3500`, `fulfilledQuantity`: `0`, `remainingQuantity`: `0`
  * **Impact**: Database schema enforcement on unique primary key `id` will fail during ingestion unless handled by compound keys or surrogate keys.

---

### 2. Entity ID Scheme Divergence & Conflicting Codes
* **Facility Identifiers**:
  * In `facilities.csv`: primary key is `id` (`FAC-01`, `FAC-02`, `FAC-03`), with natural key `code` (`CSD-01`, `NLB-02`, `SRD-03`).
  * In `inventory.csv`: `facilityId` holds the `code` (`CSD-01`, `NLB-02`, `SRD-03`), bypassing `id`.
  * In `geographicLocations.csv`: `id` is `GEO-WH-01`, but `relatedFacilityId` stores `CSD-01`.
* **Beneficiary vs. Dispatch Site Identifiers**:
  * In `beneficiaries.csv`: groups use `id` (`GRP-01` through `GRP-06`) and `code` (`CAMP-DELTA`, `CAMP-MANGA`, `COMM-ISLAND`, `CLINIC-CENTRAL`, `SHELTER-NORTH`, `ORPHAN-SECTOR4`).
  * In `dispatchOrders.csv`: `destinationId` values are `BEN-01`, `BEN-02`, `BEN-04`, `BEN-03`, `BEN-06`. None of these correspond to `GRP-*` primary keys.
  * In `scenario.json`: network entities use yet another prefix: `BEN-MZ-01`, `COMM-MZ-03`.

---

### 3. Mixed Coordinate Formats & Severe Geographic Transposition
* **Mixed Encodings**:
  1. **JSON Object**: `facilities.csv` stores coordinates as `{"lat": -19.832, "lng": 34.856}`.
  2. **JSON Array `[lat, lng]`**: `beneficiaries.csv`, `demands.csv`, and `dispatchOrders.csv` store coordinates as `[26.11592, 91.51712]`.
  3. **Separate Columns**: `geographicLocations.csv` uses two separate string columns: `latitude: '-19.832'` and `longitude: '34.856'`.
  4. **GeoJSON Standard `[lng, lat]`**: `disasterZones.csv` geometry polygons store vertices as `[[[34.8, -19.77], [34.845, -19.77], ...]]]`.
* **Geographical Transposition Anomaly**:
  * The scenario metadata, names, and beneficiary camps are located in **Assam, India** ($\approx 26.1^\circ\text{N}, 91.5^\circ\text{E}$).
  * However, the coordinates for `facilities.csv`, `geographicLocations.csv`, and `disasterZones.csv` are coordinates in **Beira / Pungwe River estuary, Mozambique** ($\approx -19.8^\circ\text{S}, 34.8^\circ\text{E}$), inherited from an earlier Cyclone Idai scenario template!
  * As a consequence, distance and spatial ray-casting algorithms between facilities (Mozambique) and beneficiary camps (India) span over 7,000 kilometers if calculated as raw WGS84 geodesic coordinates without scenario-layer normalization.

---

### 4. Nested JSON Inside Flat CSV Cells
17 columns across 8 CSV tables serialize structured JSON data into text cells:
* `auditEvents.csv`: `relatedEvents_json`
* `beneficiaries.csv`: `coordinates_json`, `vulnerabilities_json`
* `demands.csv`: `coordinates_json`, `verificationDetails_json`
* `disasterZones.csv`: `geometry_json`
* `dispatchOrders.csv`: `sourceCoords_json`, `destCoords_json`, `currentCoords_json`, `pod_json`
* `facilities.csv`: `coordinates_json`, `capacityMeasurement_json`
* `geographicLocations.csv`: `capacity_json`, `relatedDemandIds_json`
* `incidents.csv`: `center_json`
* `inventory.csv`: `qualityRecord_json`, `movementHistory_json`

*Recommendation*: In SQLite, store these in native `JSON` columns with SQLAlchemy JSON type mapping, rather than unparsed strings.

---

### 5. Relative Times & Non-ISO Timestamp Formats
* In `dispatchOrders.csv`:
  * `DSP-2026-001`: `expectedArrival = "Today 17:30 UTC"`
  * `DSP-2026-002`: `expectedArrival = "Tomorrow 08:00 UTC"`
  * `DSP-2026-003`: `expectedArrival = "Today 11:30 UTC"`
  * `DSP-2026-004`: `expectedArrival = "Tomorrow 10:30 UTC"`
  * `DSP-2026-005`: `expectedArrival = "Today 14:00 UTC"`
* In `inventory.csv`:
  * `daysToExpiry`: stores static relative integers (`15`, `45`, `60`), which drift as wall-clock time elapses.
* **Impact**: Parsing these with standard ISO-8601 parsers throws `ValueError`.
* **Resolution Rule**: The backend must evaluate relative dates and shelf-life against the authoritative **scenario clock** (`SCENARIO_NOW: 2024-07-05T09:30:00Z`), never against the host system wall clock.

---

### 6. Arithmetic Inconsistencies & Balance Discrepancies
* **Inventory Balance Mismatch (`inventory.csv`)**:
  * Item: `RES-W02` (Bulk Tanker Treated Water (Raw Supply))
  * Stored Values: `totalQty = 18000`, `reservedQty = 0`, `quarantinedQty = 0`, but `usableQty = 0`.
  * *Root Cause*: The item's `qualityStatus` is `PENDING_QC`. The double-entry ledger logic dictates that stock is only available for issue once verified usable, resulting in `usableQty = 0` despite zero quarantine/reserve holds.
* **Demand Deficit Mismatch (`demands.csv`)**:
  * Item: `DEM-2024-061` (duplicate record row 11)
  * Stored Values: `quantity = 3500`, `fulfilledQuantity = 0`, but `remainingQuantity = 0`.
  * Expected: `remainingQuantity = quantity - fulfilledQuantity = 3500`.

---

### 7. Orphan Foreign Key References
* In `dispatchOrders.csv`:
  * `destinationId = "BEN-01"` (Destination: Delta Estuary Evacuation Settlement)
  * `destinationId = "BEN-02"` (Destination: Manga Riverine Camp Sector B)
  * `destinationId = "BEN-03"` (Destination: Island Cluster Central Point)
  * `destinationId = "BEN-04"` (Destination: Central District Hospital)
  * `destinationId = "BEN-06"` (Destination: Sector 4 Child Support Compound)
  * None of these IDs exist in `beneficiaries.csv` (which uses `GRP-01` through `GRP-06`).
* In `scenario.json`:
  * `allocation.SUPPLY_CHAIN_NETWORK` refers to nodes `CSD-MZ-01`, `FRRA-MZ-01`, `BEN-MZ-01`, none of which are registered in `facilities.csv` or `beneficiaries.csv`.

---

### 8. Documentation File Name Discrepancies
* Older developer notes (`Synthetic flood scenario data.md`) specify:
  * `demand.csv` (actual file: `demands.csv`)
  * `beneficiary-groups.csv` (actual file: `beneficiaries.csv`)
  * `dispatch-orders.csv` (actual file: `dispatchOrders.csv`)
  * `audit-events.csv` (actual file: `auditEvents.csv`)
* `SYNTHETIC_DATA_PROVENANCE.md` mentions `src/data/assets/*.csv` which were relocated to `data/source/csv/`.

---

## Ingestion Architecture Decisions & Mitigations

To maintain data integrity without altering `data/source/`:
1. **Surrogate Keys**: Use auto-incrementing integer or UUID surrogate keys in SQLite tables, keeping source `id` and `code` as queryable attributes to tolerate duplicate source IDs.
2. **Scenario Clock**: Establish `SCENARIO_NOW = "2024-07-05T09:30:00Z"` in `config/scenario.yaml` as the reference anchor for all relative time conversions and expiry countdowns.
3. **Multi-Key Resolution**: For facility and beneficiary foreign keys, implement a resolver service that checks against both `id` and `code`.
4. **Geo Normalization**: Store standardized `latitude` and `longitude` float columns, preserving the raw GeoJSON/JSON payloads in dedicated JSON columns for map visualization.

