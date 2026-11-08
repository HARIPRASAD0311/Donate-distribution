# ResQNet Backend API Contract

This document specifies the REST API contract between the **FastAPI Backend** and the **React Frontend**.

## Standards & Formatting Rules
1. **Case Convention**: Pydantic v2 camelCase serialization aliases (`by_alias=True`).
2. **Timestamps**: All dates and timestamps are ISO-8601 UTC strings (`YYYY-MM-DDTHH:MM:SSZ`).
3. **Scenario Clock**: Relative times and "days to expiry" are calculated against `SCENARIO_NOW` (`2024-07-05T09:30:00Z`), not system wall-clock time.
4. **Three Data Tiers**:
   - **Tier A (Stored)**: Canonical entity representations.
   - **Tier B (Derived)**: Aggregations, KPIs, and chart data computed dynamically from Tier A.
   - **Tier C (Engine Output)**: Optimization plans and simulation results carrying `computedBy` (`"seed"` or `"engine"`).
5. **Commodities**: Stored and returned for all categories (`FOOD`, `WATER`, `MEDICAL`, `SHELTER`), but solver and allocation logic is active for `FOOD` only (others marked `"not validated"`).

---

## Endpoint Catalog

### 1. Incident & Command Center
* `GET /api/v1/incidents`
  * Returns list of supported and simulated crisis scenarios.
* `GET /api/v1/incidents/{incidentId}/command-center`
  * Returns full command center operational payload:
    * `kpis`: 6 core aggregate KPI cards.
    * `charts`: `commodityAvailability`, `regionalCoverage`, `criticalDemandDonut`, `activityTimeline`, `facilityReadiness`.
    * `operationalPanels`: active disruptions, pending decisions, recent events.
    * `priorityDemands`: top unfulfilled urgent demands.

### 2. Geography & Network GIS
* `GET /api/v1/geography/locations`
  * Returns list of points of interest with normalized `latitude`, `longitude`, `type`, and capacity.
* `GET /api/v1/geography/routes`
  * Returns transportation corridors with waypoints, distances, and status (`PASSABLE`, `BLOCKED`, `PASSABLE_WATERWAY`).
* `GET /api/v1/geography/disaster-zones`
  * Returns flood inundation and hazard zones with GeoJSON polygons.

### 3. Inventory & Resources
* `GET /api/v1/inventory/lots`
  * Query parameters: `facilityId`, `commodity`, `qualityStatus`.
  * Returns lot ledger balances (`onHand`, `reserved`, `usable`, `quarantined`, `expired`, `fefoEligible`).
* `POST /api/v1/inventory/receive`
  * Records new inbound stock lot and appends an `AuditEvent`.
* `POST /api/v1/inventory/quarantine`
  * Moves an existing lot into `QUARANTINED` status and appends an `AuditEvent`.

### 4. Demand & Beneficiaries
* `GET /api/v1/beneficiaries`
  * Returns registered settlements, camps, and vulnerable populations.
* `GET /api/v1/demand/records`
  * Query parameters: `priority`, `commodity`, `verificationStatus`.
  * Returns demand records with `remainingQuantity` and verified status.
* `POST /api/v1/demand/verify`
  * Commits verification evidence and appends an `AuditEvent`.

### 5. Allocation Planning & Mathematical Optimization
* `POST /api/v1/optimize/validate`
  * Validates optimization inputs, physical constraints, and feasibility.
* `POST /api/v1/optimize/milp`
  * Executes the Pyomo / HiGHS optimization solver (or returns seeded run with `computedBy: "seed"`).
* `POST /api/v1/optimize/plans/{planId}/approve`
  * Human-in-the-loop approval: creates stock reservations and marks plan `APPROVED`.
* `POST /api/v1/optimize/plans/{planId}/reject`
  * Rejects plan or requests parameter relaxation.
* `GET /api/v1/optimize/plans/history`
  * Returns historical versions and approval logs for an incident.

### 6. Recovery Simulator
* `POST /api/v1/recovery/simulate`
  * Simulates disruption scenarios (Monte Carlo delay distributions, CVaR risk tail, candidate strategies).
  * Returns payload with `computedBy: "seed"` or `"engine"`.
* `POST /api/v1/recovery/validate-action`
  * Validates proposed recovery action feasibility against network topology.
* `POST /api/v1/recovery/strategies/{strategyId}/approve`
  * Human approval for a recovery strategy. Stale check: rejects approval if baseline state changed.

### 7. Dispatch & Verification (POD)
* `GET /api/v1/dispatch/orders`
  * Returns orders in transit with lifecycle progress (`READY` $\to$ `IN_TRANSIT` $\to$ `ARRIVED` $\to$ `VERIFIED`).
* `POST /api/v1/dispatch/create`
  * Generates a new dispatch order against an approved allocation.
* `POST /api/v1/dispatch/verify-pod`
  * Submits physical proof of delivery. Reconciles received stock into *Accepted*, *Damaged*, *Rejected*, and *Adjusted*. Accepted stock flows into destination inventory and fulfils linked demand.

### 8. Audit Trail & Reports
* `GET /api/v1/audit/events`
  * Returns immutable append-only event ledger.
* `GET /api/v1/audit/export`
  * Query parameters: `format=csv` or `format=tsv`.
  * Streams RFC-4180 compliant export.
