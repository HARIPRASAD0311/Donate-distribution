# ResQNet Data Dictionary

This document provides a comprehensive data dictionary for all synthetic source files located in `data/source/` for the **Assam Brahmaputra Flood Response (FLOOD)** scenario.

---

## 1. File Catalog Overview

| File Path | Type | Record Count / Size | Domain / Entity |
| :--- | :--- | :--- | :--- |
| `data/source/csv/incidents.csv` | CSV | 3 rows | Incident Context & Scenarios |
| `data/source/csv/facilities.csv` | CSV | 3 rows | Warehouses, Staging Depots, Supply Hubs |
| `data/source/csv/geographicLocations.csv` | CSV | 7 rows | GIS Map Points of Interest & Facilities |
| `data/source/csv/disasterZones.csv` | CSV | 6 rows | GIS Hazard Polygons & Impact Perimeters |
| `data/source/csv/inventory.csv` | CSV | 11 rows | Inbound Lots, Batches & Warehouse Stock |
| `data/source/csv/beneficiaries.csv` | CSV | 6 rows | Vulnerable Communities, Settlements & IDP Camps |
| `data/source/csv/demands.csv` | CSV | 11 rows | Urgent Humanitarian Demands & Requisitions |
| `data/source/csv/dispatchOrders.csv` | CSV | 6 rows | In-Transit Freight, Convoys & Barges |
| `data/source/csv/auditEvents.csv` | CSV | 9 rows | Append-Only Operational Action Log |
| `data/source/json/scenario.json` | JSON | 81.6 KB (nested) | Command Center, Network, Allocation & Recovery Precomputed Data |
| `data/source/README.md` | Markdown | 504 bytes | Package overview |
| `data/source/SYNTHETIC_DATA_PROVENANCE.md` | Markdown | 1.87 KB | Scenario provenance and source documentation |

---

## 2. Tabular Entity Specifications (CSV)

### 2.1 `incidents.csv`
Captures disaster operations instances.

| Field Name | Raw Type | Target Type | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | String (PK) | No | Unique incident ID (e.g. `INC-2026-0412`) |
| `code` | String | String | No | Short incident code (e.g. `CYC-IDAI-2`) |
| `name` | String | String | No | Full descriptive title of the crisis |
| `region` | String | String | No | Target region (e.g. `Assam Brahmaputra Flood Response`) |
| `crisisType` | String | Enum / String | No | Disaster classification: `Flood`, `Conflict`, `Pandemic` |
| `severity` | String | Enum / String | No | Severity ranking: `LEVEL_3_EMERGENCY`, etc. |
| `type` | String | String | No | Detailed catastrophe type |
| `declaredAt` | String (ISO) | DateTime UTC | No | Official declaration timestamp |
| `isSimulated` | String ("true"/"false") | Boolean | No | Simulation watermark |
| `isSupported` | String ("true"/"false") | Boolean | No | Whether scenario assets are fully modeled |
| `center_json` | String (JSON Array) | JSON / List[float] | No | `[latitude, longitude]` map center coordinates |
| `zoom` | String (Integer) | Integer | No | Default GIS map zoom level |
| `activeDispatchesCount` | String (Integer) | Integer | No | Precomputed active dispatches counter |
| `criticalPocketsCount` | String (Integer) | Integer | No | Precomputed critical needs pockets |

---

### 2.2 `facilities.csv`
Defines fixed operational physical installations (warehouses, depots, forward bases).

| Field Name | Raw Type | Target Type | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | String (PK) | No | Facility ID (e.g. `FAC-01`, `FAC-02`) |
| `code` | String | String (Unique) | No | Operational code (e.g. `CSD-01`, `NLB-02`, `SRD-03`) |
| `name` | String | String | No | Descriptive facility name |
| `locationName` | String | String | Yes | Sub-sector or neighborhood |
| `coordinates_json` | String (JSON Object) | JSON / Dict | No | `{"lat": float, "lng": float}` coordinates |
| `totalCapacityM3` | String (Float) | Float | No | Total gross volumetric capacity in $m^3$ |
| `utilizedCapacityM3` | String (Float) | Float | No | Currently occupied volumetric capacity in $m^3$ |
| `capacityMeasurement_json`| String (JSON Object) | JSON / Dict | Yes | Detailed telemetry metrics and conversion notes |
| `status` | String | Enum / String | No | Operational status: `OPERATIONAL`, `CONSTRAINED`, etc. |
| `isSimulated` | String ("true"/"false") | Boolean | No | Simulation watermark |

---

### 2.3 `geographicLocations.csv`
Geographic points of interest used by GIS layers.

| Field Name | Raw Type | Target Type | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | String (PK) | No | Geographic entity ID (e.g. `GEO-WH-01`) |
| `code` | String | String | No | Reference code matching facility or group |
| `name` | String | String | No | Point of interest name |
| `type` | String | Enum / String | No | `WAREHOUSE`, `DISTRIBUTION_CENTER`, `FORWARD_BASE`, `HOSPITAL`, `IDP_CAMP`, `COMMUNITY`, `HAZARD_ZONE` |
| `latitude` | String (Float) | Float | No | Latitude coordinate |
| `longitude` | String (Float) | Float | No | Longitude coordinate |
| `region` | String | String | No | Administrative or logistics region |
| `address` | String | String | Yes | Physical street or gate address |
| `operationalStatus` | String | Enum / String | No | `OPERATIONAL`, `SUBMERGED`, `ACCESSIBLE_BY_WATER` |
| `capacity_json` | String (JSON Object) | JSON / Dict | Yes | Capacity specification object |
| `relatedFacilityId` | String | String (FK/Ref) | Yes | Reference to facility code or ID |
| `notes` | String | String | Yes | Operational logistics notes |
| `isDemo` | String ("true"/"false") | Boolean | No | Simulation watermark |
| `relatedBeneficiaryGroupId`| String | String (Ref) | Yes | Linked beneficiary group |
| `relatedDemandIds_json` | String (JSON Array) | JSON / List[str] | Yes | Array of associated demand IDs |
| `radiusMeters` | String (Float) | Float | Yes | Buffer radius for impact zones |
| `capacity` | String | String | Yes | Legacy text capacity field |

---

### 2.4 `disasterZones.csv`
Defines flood inundation and risk perimeters as GeoJSON boundaries.

| Field Name | Raw Type | Target Type | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | String (PK) | No | Zone ID (e.g. `ZONE-FL-DELTA-01`) |
| `name` | String | String | No | Disaster zone descriptive label |
| `disasterType` | String | Enum / String | No | `FLOOD`, `CONFLICT`, `PANDEMIC` |
| `severity` | String | Enum / String | No | `CRITICAL`, `WARNING`, `ADVISORY`, `MONITORING` |
| `status` | String | Enum / String | No | `ACTIVE`, `RECEDING`, `RESOLVED` |
| `source` | String | String | No | Sensor / satellite feed attribution |
| `lastUpdated` | String (ISO) | DateTime UTC | No | Last telemetry update timestamp |
| `isDemo` | String ("true"/"false") | Boolean | No | Simulation watermark |
| `dataClassification` | String | String | No | Security classification (`DEMO`, `UNCLASSIFIED`) |
| `description` | String | String | Yes | Physical hydrology / conflict impact description |
| `notes` | String | String | Yes | Field access constraints |
| `geometry_json` | String (GeoJSON) | JSON / Dict | No | GeoJSON `Polygon` or `MultiPolygon` `[lng, lat]` |

---

### 2.5 `inventory.csv`
Granular warehouse lot balances and batches tracking commodities.

| Field Name | Raw Type | Target Type | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | String (PK) | No | Inventory Lot ID (e.g. `RES-F01`, `RES-W01`) |
| `name` | String | String | No | Commodity item name |
| `commodity` | String | Enum / String | No | Category: `FOOD`, `WATER`, `MEDICAL` |
| `category` | String | String | No | Sub-classification |
| `batchId` | String | String | No | Manufacturer lot/batch ID |
| `facilityId` | String | String (FK/Ref) | No | Warehouse identifier (matches facility code) |
| `facilityName` | String | String | No | Warehouse name |
| `totalQty` | String (Float) | Float | No | Total physical balance on-hand |
| `reservedQty` | String (Float) | Float | No | Allocated quantity committed to approved plans |
| `usableQty` | String (Float) | Float | No | Quality-approved stock available for issue |
| `quarantinedQty` | String (Float) | Float | No | Stock held under quarantine |
| `unit` | String | String | No | Measurement unit: `packets`, `liters`, `kits` |
| `expiryDate` | String (YYYY-MM-DD) | Date | Yes | Shelf-life expiration date |
| `daysToExpiry` | String (Integer) | Integer | Yes | Days remaining relative to scenario clock |
| `qualityStatus` | String | Enum / String | No | `VERIFIED_USABLE`, `PENDING_QC`, `QUARANTINED` |
| `storageLocation` | String | String | Yes | Bay / room position within facility |
| `source` | String | String | No | Supplier / donor entity |
| `receivedDate` | String (YYYY-MM-DD) | Date | No | Inbound intake date |
| `receivedQty` | String (Float) | Float | Yes | Original batch receipt quantity |
| `fefoEligible` | String ("true"/"false") | Boolean | No | Eligible for First-Expired, First-Out queue |
| `qualityRecord_json` | String (JSON Object) | JSON / Dict | Yes | Lab test results and certification |
| `movementHistory_json` | String (JSON Array) | JSON / List[Dict] | Yes | Inbound and outbound stock ledger entries |
| `isSimulated` | String ("true"/"false") | Boolean | No | Simulation watermark |
| `coldChainRequired` | String ("true"/"false") | Boolean | Yes | Refrigeration requirement flag |
| `currentTempCelsius` | String (Float) | Float | Yes | Sensor temperature telemetry |
| `tempExcursionFlag` | String ("true"/"false") | Boolean | Yes | Cold-chain threshold violation alert |

---

### 2.6 `beneficiaries.csv`
Captures vulnerable population groups requiring relief assistance.

| Field Name | Raw Type | Target Type | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | String (PK) | No | Beneficiary Group ID (e.g. `GRP-01`) |
| `code` | String | String (Unique) | No | Settlement identifier (e.g. `CAMP-DELTA`) |
| `name` | String | String | No | Full community or camp title |
| `region` | String | String | No | Administrative district |
| `coordinates_json` | String (JSON Array) | JSON / List[float] | No | `[latitude, longitude]` coordinates |
| `category` | String | String | No | Category: `IDP Camp`, `Isolated Community`, `Clinic` |
| `population` | String (Integer) | Integer | No | Total registered individual count |
| `households` | String (Integer) | Integer | No | Total registered household count |
| `vulnerabilities_json` | String (JSON Object) | JSON / Dict | Yes | Demographic vulnerability percentages |
| `focalPoint` | String | String | Yes | Local liaison or agency lead |
| `status` | String | Enum / String | No | `ACTIVE_ASSISTANCE_REQUIRED`, `MONITORING` |
| `accessCondition` | String | String | No | Field accessibility description |
| `isSimulated` | String ("true"/"false") | Boolean | No | Simulation watermark |

---

### 2.7 `demands.csv`
Urgent requisitions for relief aid.

| Field Name | Raw Type | Target Type | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | String | No | Requisition ID (e.g. `DEM-2024-061`) *(Warning: duplicates exist)* |
| `incidentId` | String | String (FK/Ref) | No | Incident ID (`INC-2026-0412`) |
| `region` | String | String | No | Target district |
| `location` | String | String | No | Specific delivery sector |
| `coordinates_json` | String (JSON Array) | JSON / List[float] | No | `[latitude, longitude]` drop coordinates |
| `beneficiaryGroupId` | String | String (FK/Ref) | No | Reference to `beneficiaries.csv` (`GRP-01`) |
| `beneficiaryGroup` | String | String | No | Name of beneficiary group |
| `commodity` | String | Enum / String | No | `FOOD`, `WATER`, `MEDICAL`, `SHELTER` |
| `item` | String | String | No | Specific aid item description |
| `quantity` | String (Float) | Float | No | Total required quantity |
| `fulfilledQuantity` | String (Float) | Float | No | Verified quantity delivered and accepted |
| `remainingQuantity` | String (Float) | Float | No | Unfulfilled deficit balance |
| `unit` | String | String | No | Units: `packets`, `liters`, `kits`, `tarpaulins` |
| `priority` | String | Enum / String | No | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `requiredByDate` | String (YYYY-MM-DD) | Date | No | Delivery deadline |
| `reportingSource` | String | String | No | Field team or assessment source |
| `verificationStatus` | String | Enum / String | No | `VERIFIED`, `PENDING`, `REJECTED` |
| `verificationDetails_json`| String (JSON Object) | JSON / Dict | Yes | Screening lead, timestamp and notes |
| `notes` | String | String | Yes | Access and priority justifications |
| `isSimulated` | String ("true"/"false") | Boolean | No | Simulation watermark |

---

### 2.8 `dispatchOrders.csv`
Tracking orders in transit through the transportation network.

| Field Name | Raw Type | Target Type | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | String (PK) | No | Dispatch Order ID (e.g. `DSP-2026-001`) |
| `planId` | String | String (Ref) | Yes | Linked Allocation Plan ID (`PLAN-ALPHA`) |
| `allocationId` | String | String (Ref) | Yes | Linked Allocation Line ID (`ALC-001`) |
| `source` | String | String | No | Origin facility name |
| `sourceId` | String | String (Ref) | No | Origin facility code (`CSD-01`) |
| `sourceCoords_json` | String (JSON Array) | JSON / List[float] | No | `[latitude, longitude]` departure point |
| `destination` | String | String | No | Destination site name |
| `destinationId` | String | String (Ref) | No | Destination identifier (divergent: `BEN-01`) |
| `destCoords_json` | String (JSON Array) | JSON / List[float] | No | `[latitude, longitude]` arrival point |
| `currentCoords_json` | String (JSON Array) | JSON / List[float] | Yes | `[latitude, longitude]` live telemetry point |
| `commodity` | String | Enum / String | No | Cargo commodity category |
| `item` | String | String | No | Commodity item name |
| `batchId` | String | String | No | Inventory lot batch reference |
| `quantity` | String (Float) | Float | No | Dispatched quantity |
| `unit` | String | String | No | Measurement unit |
| `vehicle` | String | String | No | Vehicle ID / Call sign |
| `vehicleType` | String | Enum / String | No | `RIVER_BARGE`, `ALL_TERRAIN_TRUCK`, etc. |
| `carrier` | String | String | No | Logistics operator or unit |
| `driver` | String | String | No | Transport convoy lead |
| `route` | String | String | No | Designated transit corridor |
| `routeStatus` | String | Enum / String | No | `PASSABLE_WATERWAY`, `BLOCKED`, `DELAYED` |
| `dispatchedAt` | String (ISO) | DateTime UTC | No | Departure timestamp |
| `expectedArrival` | String (Text) | String / DateTime | No | ETA (includes relative strings like `Today 17:30 UTC`) |
| `actualArrival` | String | DateTime UTC | Yes | Arrival timestamp |
| `deliveredAt` | String | DateTime UTC | Yes | Physical delivery timestamp |
| `verifiedAt` | String | DateTime UTC | Yes | Proof of Delivery verification timestamp |
| `status` | String | Enum / String | No | `READY`, `IN_TRANSIT`, `ARRIVED`, `VERIFIED` |
| `progressPct` | String (Float) | Float | No | Transit completion percentage |
| `pod` | String | String | Yes | Legacy POD reference |
| `notes` | String | String | Yes | Operational convoy notes |
| `isSimulated` | String ("true"/"false") | Boolean | No | Simulation watermark |
| `pod_json` | String (JSON Object) | JSON / Dict | Yes | Proof of delivery inspection record |
| `exceptionReason` | String | String | Yes | Delay or rerouting exception reason |

---

### 2.9 `auditEvents.csv`
Immutable, append-only ledger of actions and administrative approvals.

| Field Name | Raw Type | Target Type | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | String | String (PK) | No | Event ID (e.g. `EVT-2024-0625`) |
| `timestamp` | String (ISO) | DateTime UTC | No | Event occurrence timestamp |
| `user` | String | String | No | Acting officer or system agent |
| `role` | String | String | No | Role of actor |
| `action` | String | Enum / String | No | Operational action code |
| `module` | String | String | No | Source subsystem (`Recovery Simulator`, etc.) |
| `entityId` | String | String | No | Identifier of the affected record |
| `status` | String | Enum / String | No | Resulting state: `VERIFIED`, `APPROVED` |
| `previousValue` | String | String | Yes | State before action |
| `newValue` | String | String | Yes | State after action |
| `reason` | String | String | No | Justification for action |
| `approvalRef` | String | String | Yes | Formal authorization document reference |
| `evidenceRef` | String | String | Yes | Supporting telemetry / field report reference |
| `relatedEvents_json` | String (JSON Array) | JSON / List[str] | Yes | Linked audit events |
| `isSimulated` | String ("true"/"false") | Boolean | No | Simulation watermark |

---

## 3. Nested Scenario Payload Specifications (`scenario.json`)

`scenario.json` contains precomputed operational baselines, GIS geometries, and solver outputs organized into 4 primary modules:

### 3.1 `commandCenter`
* **Metadata**: `isSupported`, `regionName`, `scopeLabel`.
* **`kpis` (Tier B derived)**: Array of 6 aggregate KPI cards:
  1. *Critical Stock on Hand*
  2. *Unfulfilled Priority Demand*
  3. *Active Dispatches in Transit*
  4. *Blocked / Vulnerable Corridors*
  5. *Overall Fleet Operational Readiness*
  6. *Target Population Coverage*
* **`mapEntities`**: Quick-look GIS facilities and communities.
* **`charts` (Tier B derived)**:
  * `commodityAvailability`: Stock breakdown by category.
  * `regionalCoverage`: Percentage coverage by district.
  * `criticalDemandDonut`: Urgency level distribution.
  * `activityTimeline`: Hourly operations intensity.
  * `facilityReadiness`: Storage utilization vs limit.
* **`operationalPanels`**: Critical incidents list, active disruptions, facility status summary, pending human decisions, and recent audit events.
* **`priorityDemands`**: Filtered subset of top 4 critical demands.

### 3.2 `network`
* **Metadata**: `center: [26.09, 91.5452]`, `defaultZoom: 11`.
* **`entities`**: 13 supply chain nodes (Donors, Suppliers, Central Staging Depots, Forward Bases, Distribution Centers, Beneficiary Camps).
* **`routes`**: 7 transportation corridors including waypoints, road status (`PASSABLE`, `BLOCKED`, `PASSABLE_WATERWAY`), distance in km, transit mode, and average travel duration.
* **`crisisOverlays`**:
  * `affectedZones`: Flood polygon coordinates and hazard classes.
  * `infrastructureDamage`: Washed out bridges, road cuts (e.g. km 42 culvert washout).
  * `isolatedCommunities`: Settlements cut off from road transit requiring amphibious/aerial delivery.

### 3.3 `allocation`
* **`SUPPLY_CHAIN_NETWORK`**: Directed network graph representing supply nodes, intermediate staging depots, beneficiary demand sinks, and route capacities.
* **`MOCK_PLANS` (Tier C seeded runs)**:
  * `PLAN-ALPHA`: Primary balanced allocation plan.
  * `PLAN-BETA`: Rapid turnaround prioritising high-severity medical items.
  * `PLAN-GAMMA`: Conservation plan under fuel/barge transport restrictions.
* **`MOCK_PLAN_HISTORY`**: Versioned history of generated allocation plans with approval states.
* **`ALLOCATION_ANALYTICS` (Tier B / C)**:
  * Supply-demand deficit metrics.
  * Gini/fair-share coefficient across vulnerable sectors.
  * Volumetric warehouse capacity utilization rates.

### 3.4 `recovery`
* **`BASELINE_PLAN`**: Operational snapshot baseline prior to disruptive events.
* **`DISRUPTION_TEMPLATES`**: Preconfigured disaster disruption parameters for Floods, Conflicts, and Pandemics.
* **`NETWORK_STATES`**: 3 discrete state snapshots:
  * `BASELINE`: Normal monsoon prepositioning.
  * `DISRUPTED`: Post-inundation with severed bridges and submerged depots.
  * `RECOVERED`: Restored flow using shallow barges and bypass corridors.
* **`MOCK_RECOVERY_STRATEGIES` (Tier C seeded runs)**:
  * `STRAT-ALPHA`: Multimodal river barge + aerial winch contingency.
  * `STRAT-BETA`: Land convoy bypass via Southern secondary unpaved arterial.
  * `STRAT-GAMMA`: Preemptive forward deployment to local school staging sites.
* **`RECOVERY_ANALYTICS` (Tier C engine metrics)**:
  * Multi-attribute strategy comparison matrix (Recovery Time, Cost, Feasibility, Coverage).
  * Monte Carlo probability distribution of transit delays (100 synthetic runs).
  * Conditional Value at Risk (CVaR) evaluating tail-risk shortages.

