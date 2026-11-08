from typing import Dict, List, Any, Optional
from pydantic import Field
from backend.app.schemas.common import BaseSchema

# --- Audit & Metadata ---
class AuditMetadataSchema(BaseSchema):
    source: str = "ASDMA_SYNTHETIC_FIXTURE"
    observed_at: Optional[str] = None
    received_at: Optional[str] = None
    verification_status: str = "VERIFIED"
    submitted_by: str = "SYSTEM_IMPORTER"
    is_simulated: bool = True

# --- Incidents ---
class IncidentSchema(AuditMetadataSchema):
    id: str
    code: str
    name: str
    region: str
    crisis_type: str
    severity: str
    type: str
    declared_at: str
    is_supported: bool
    center_json: List[float]
    zoom: int
    active_dispatches_count: int
    critical_pockets_count: int

# --- Facilities ---
class FacilitySchema(AuditMetadataSchema):
    id: str
    code: str
    name: str
    location_name: Optional[str] = None
    latitude: float
    longitude: float
    coordinates_json: Dict[str, Any]
    total_capacity_m3: float
    utilized_capacity_m3: float
    capacity_measurement_json: Optional[Dict[str, Any]] = None
    status: str

# --- Geography ---
class GeographicLocationSchema(AuditMetadataSchema):
    id: str
    code: str
    name: str
    type: str
    latitude: float
    longitude: float
    region: str
    address: Optional[str] = None
    operational_status: str
    capacity_json: Optional[Dict[str, Any]] = None
    related_facility_id: Optional[str] = None
    notes: Optional[str] = None
    is_demo: bool
    related_beneficiary_group_id: Optional[str] = None
    related_demand_ids_json: Optional[List[str]] = None
    radius_meters: Optional[float] = None
    capacity: Optional[str] = None

class TransportRouteSchema(AuditMetadataSchema):
    id: str
    name: str
    origin_facility_id: str
    destination_facility_id: str
    distance_km: float
    transit_mode: str
    status: str
    waypoints_json: List[List[float]]
    travel_time_hours: Optional[float] = None
    is_blocked: bool
    blockage_reason: Optional[str] = None

class DisasterZoneSchema(AuditMetadataSchema):
    id: str
    name: str
    disaster_type: str
    severity: str
    status: str
    source: str
    last_updated: str
    is_demo: bool
    data_classification: str
    description: Optional[str] = None
    notes: Optional[str] = None
    geometry_json: Dict[str, Any]

# --- Inventory ---
class InventoryLotSchema(AuditMetadataSchema):
    id: str
    name: str
    commodity: str
    category: str
    batch_id: str
    facility_id: str
    facility_name: str
    total_qty: float
    reserved_qty: float
    usable_qty: float
    quarantined_qty: float
    unit: str
    expiry_date: Optional[str] = None
    days_to_expiry: Optional[int] = None
    quality_status: str
    storage_location: Optional[str] = None
    received_date: str
    received_qty: Optional[float] = None
    fefo_eligible: bool
    quality_record_json: Optional[Dict[str, Any]] = None
    movement_history_json: Optional[List[Dict[str, Any]]] = None
    cold_chain_required: bool = False
    current_temp_celsius: Optional[float] = None
    temp_excursion_flag: bool = False

class ReceiveStockRequest(BaseSchema):
    id: Optional[str] = None
    name: str
    commodity: str
    category: str = "General Aid"
    batch_id: str
    facility_id: str
    facility_name: Optional[str] = None
    quantity: float
    unit: str
    expiry_date: Optional[str] = None
    quality_status: str = "AWAITING_QC"
    storage_location: Optional[str] = None
    source: str = "Local Supplier"
    actor: str = "Logistics Intake Officer"
    reason: str = "Inbound humanitarian stock receipt"

class QuarantineLotRequest(BaseSchema):
    lot_id: str
    actor: str = "QA / Health Inspector"
    reason: str = "Suspected moisture damage or packaging breach"

# --- Demands & Beneficiaries ---
class BeneficiaryGroupSchema(AuditMetadataSchema):
    id: str
    code: str
    name: str
    region: str
    latitude: float
    longitude: float
    coordinates_json: List[float]
    category: str
    population: int
    households: int
    vulnerabilities_json: Optional[Dict[str, Any]] = None
    focal_point: Optional[str] = None
    status: str
    access_condition: str

class DemandRecordSchema(AuditMetadataSchema):
    id: str
    incident_id: str
    region: str
    location: str
    latitude: float
    longitude: float
    coordinates_json: List[float]
    beneficiary_group_id: str
    beneficiary_group_name: str
    commodity: str
    item: str
    quantity: float
    fulfilled_quantity: float
    remaining_quantity: float
    unit: str
    priority: str
    required_by_date: str
    reporting_source: str
    verification_status: str
    verification_details_json: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class VerifyDemandRequest(BaseSchema):
    demand_id: str
    verified_by: str = "Field Verification Officer"
    evidence_ref: str
    notes: str = "Field visit and beneficiary verification completed"

# --- Dispatches & POD ---
class DispatchOrderSchema(AuditMetadataSchema):
    id: str
    plan_id: Optional[str] = None
    allocation_id: Optional[str] = None
    source_facility_name: str
    source_id: str
    source_coords_json: List[float]
    destination_name: str
    destination_id: str
    dest_coords_json: List[float]
    current_coords_json: Optional[List[float]] = None
    commodity: str
    item: str
    batch_id: str
    quantity: float
    unit: str
    vehicle: str
    vehicle_type: str
    carrier: str
    driver: str
    route_name: str
    route_status: str
    dispatched_at: str
    expected_arrival: str
    actual_arrival: Optional[str] = None
    delivered_at: Optional[str] = None
    verified_at: Optional[str] = None
    status: str
    progress_pct: float
    pod_json: Optional[Dict[str, Any]] = None
    exception_reason: Optional[str] = None
    notes: Optional[str] = None

class CreateDispatchOrderRequest(BaseSchema):
    id: Optional[str] = None
    plan_id: str
    allocation_id: Optional[str] = None
    destination_id: str
    destination_name: Optional[str] = None
    vehicle: str
    vehicle_type: str = "RIVER_BARGE"
    carrier: str
    driver: str
    route_name: str
    expected_arrival: str
    actor: str = "Dispatch Coordinator"
    notes: Optional[str] = None

class VerifyPodRequest(BaseSchema):
    dispatch_id: str
    delivery_id: Optional[str] = None
    received_quantity: float
    accepted_quantity: float
    damaged_quantity: float = 0.0
    rejected_quantity: float = 0.0
    adjusted_quantity: float = 0.0
    adjustment_reason: Optional[str] = None
    verified_by: str = "Destination Reception Officer"
    evidence_ref: str
    notes: Optional[str] = None

class DepartDispatchRequest(BaseSchema):
    actor: str = "Convoy Commander"
    notes: Optional[str] = None

class RecordArrivalRequest(BaseSchema):
    actor: str = "Destination Receptionist"
    notes: Optional[str] = None

class RerouteDispatchRequest(BaseSchema):
    new_route_name: str
    justification: str
    actor: str = "Dispatch Operator"


# --- Audit Events ---
class AuditEventSchema(BaseSchema):
    id: str
    timestamp: str
    user: str
    role: str
    action: str
    module: str
    entity_id: str
    status: str
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    reason: str
    approval_ref: Optional[str] = None
    evidence_ref: Optional[str] = None
    related_events_json: List[str] = Field(default_factory=list)
    is_simulated: bool = True

