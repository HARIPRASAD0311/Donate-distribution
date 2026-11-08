from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        serialize_by_alias=True
    )

class TrendSchema(CamelModel):
    value: str
    is_positive: bool = Field(default=True, alias="isPositive")
    direction: str = Field(default="neutral")
    label: Optional[str] = None

class CommandCenterKpiCard(CamelModel):
    id: str
    title: str
    value: str
    unit: str
    status: str = "teal" # teal, warning, critical, neutral
    icon: Optional[str] = None
    subtext: Optional[str] = None
    tooltip: Optional[str] = None
    trend: Optional[TrendSchema] = None

class CommandCenterKpiSection(CamelModel):
    id: str
    code: str
    title: str
    subtitle: Optional[str] = None
    cards: List[CommandCenterKpiCard]

class FacilityMapEntity(CamelModel):
    id: str
    code: str
    name: str
    type: str
    location_name: str = Field(alias="locationName")
    coordinates: List[float] # [lat, lon]
    total_capacity_m3: float = Field(alias="totalCapacityM3")
    utilized_capacity_m3: float = Field(alias="utilizedCapacityM3")
    utilization_pct: float = Field(alias="utilizationPct")
    status: str
    stock_summary: str = Field(alias="stockSummary")
    contact: Optional[str] = None
    is_simulated: bool = Field(default=True, alias="isSimulated")

class CommunityMapEntity(CamelModel):
    id: str
    name: str
    sector: str
    coordinates: List[float] # [lat, lon]
    population: int
    priority: str
    accessibility: str
    access_method: str = Field(alias="accessMethod")
    primary_need: str = Field(alias="primaryNeed")
    required_qty: float = Field(alias="requiredQty")
    unit: str
    unmet_qty: float = Field(alias="unmetQty")
    verification_status: str = Field(alias="verificationStatus")
    reported_by: Optional[str] = Field(default=None, alias="reportedBy")
    is_simulated: bool = Field(default=True, alias="isSimulated")

class DisruptionMapEntity(CamelModel):
    id: str
    code: str
    title: str
    coordinates: List[float] # [lat, lon]
    severity: str
    corridor: str
    impact: str
    delay: str
    suggested_bypass: Optional[str] = Field(default=None, alias="suggestedBypass")
    status: str
    is_simulated: bool = Field(default=True, alias="isSimulated")

class RouteMapEntity(CamelModel):
    id: str
    name: str
    status: str
    color: str
    dash_array: str = Field(alias="dashArray")
    points: List[List[float]] # [[lat, lon], ...]

class MapEntitiesPayload(CamelModel):
    center: List[float] # [lat, lon]
    zoom: int = 11
    scope_label: str = Field(alias="scopeLabel")
    is_supported: bool = Field(default=True, alias="isSupported")
    facilities: List[FacilityMapEntity]
    communities: List[CommunityMapEntity]
    disruptions: List[DisruptionMapEntity]
    routes: List[RouteMapEntity]

# Chart Schemas
class CommodityAvailabilityItem(CamelModel):
    commodity: str
    on_hand: float = Field(alias="onHand")
    dispatched: float
    unmet: float

class RegionalCoverageItem(CamelModel):
    zone: str
    coverage: float
    unmet_count: float = Field(alias="unmetCount")

class CriticalDemandDonutItem(CamelModel):
    name: str
    value: float
    color: str

class ActivityTimelineItem(CamelModel):
    day: str
    distress_calls: int = Field(alias="distressCalls")
    dispatches: int

class FacilityReadinessItem(CamelModel):
    code: str
    name: str
    capacity_pct: float = Field(alias="capacityPct")
    status: str
    available_m3: float = Field(alias="availableM3")

class ChartsPayload(CamelModel):
    commodity_availability: List[CommodityAvailabilityItem] = Field(alias="commodityAvailability")
    regional_coverage: List[RegionalCoverageItem] = Field(alias="regionalCoverage")
    critical_demand_donut: List[CriticalDemandDonutItem] = Field(alias="criticalDemandDonut")
    activity_timeline: List[ActivityTimelineItem] = Field(alias="activityTimeline")
    facility_readiness: List[FacilityReadinessItem] = Field(alias="facilityReadiness")

# Operational Panels
class CriticalIncidentPanelItem(CamelModel):
    id: str
    title: str
    time: str
    summary: str

class ActiveDisruptionPanelItem(CamelModel):
    id: str
    name: str
    delay: str
    corridor: str
    status: str

class FacilityStatusPanelItem(CamelModel):
    code: str
    name: str
    util: float

class PendingDecisionPanelItem(CamelModel):
    id: str
    title: str
    consequence: str

class RecentEventPanelItem(CamelModel):
    id: str
    time: str
    text: str

class OperationalPanelsPayload(CamelModel):
    critical_incidents: List[CriticalIncidentPanelItem] = Field(alias="criticalIncidents")
    active_disruptions: List[ActiveDisruptionPanelItem] = Field(alias="activeDisruptions")
    facility_status: List[FacilityStatusPanelItem] = Field(alias="facilityStatus")
    pending_decisions: List[PendingDecisionPanelItem] = Field(alias="pendingDecisions")
    recent_events: List[RecentEventPanelItem] = Field(alias="recentEvents")

class PriorityDemandItem(CamelModel):
    id: str
    region: str
    commodity: str
    required_qty: float = Field(alias="requiredQty")
    available_qty: float = Field(alias="availableQty")
    unmet_qty: float = Field(alias="unmetQty")
    unit: str
    priority: str
    verification_status: str = Field(alias="verificationStatus")
    action_needed: str = Field(alias="actionNeeded")

class CommandCenterPayloadSchema(CamelModel):
    is_supported: bool = Field(default=True, alias="isSupported")
    region_name: str = Field(alias="regionName")
    scope_label: str = Field(alias="scopeLabel")
    kpis: List[CommandCenterKpiCard]
    sections: List[CommandCenterKpiSection]
    map_entities: MapEntitiesPayload = Field(alias="mapEntities")
    charts: ChartsPayload
    operational_panels: OperationalPanelsPayload = Field(alias="operationalPanels")
    priority_demands: List[PriorityDemandItem] = Field(alias="priorityDemands")
