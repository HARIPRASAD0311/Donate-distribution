from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict, Field

class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        serialize_by_alias=True
    )

class OptimizationValidationInput(CamelModel):
    incident_id: Optional[str] = Field(default="INC-2026-0412", alias="incidentId")
    commodities: List[str] = Field(default_factory=lambda: ["FOOD"])
    source_facilities: List[str] = Field(default_factory=list, alias="sourceFacilities")
    destination_regions: List[str] = Field(default_factory=list, alias="destinationRegions")
    reserve_margin_pct: float = Field(default=15.0, alias="reserveMarginPct")
    budget_cap_usd: float = Field(default=250000.0, alias="budgetCapUSD")
    planning_period: str = Field(default="72h", alias="planningPeriod")
    constraints: Dict[str, Any] = Field(default_factory=dict)

class AuditCheckItem(CamelModel):
    id: str
    name: str
    status: str # PASS, WARN, FAIL
    detail: str

class MatrixDimensionsSchema(CamelModel):
    decision_variables: int = Field(alias="decisionVariables")
    constraints: int
    integer_variables: int = Field(alias="integerVariables")
    time_horizon: str = Field(alias="timeHorizon")

class ValidationReportSchema(CamelModel):
    status: str = "SUCCESS"
    category: str = "SUCCESS"
    is_valid: bool = Field(alias="isValid")
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    missing_fields: List[str] = Field(default_factory=list, alias="missingFields")
    audit_checks: List[AuditCheckItem] = Field(default_factory=list, alias="auditChecks")
    matrix_dimensions: MatrixDimensionsSchema = Field(alias="matrixDimensions")
    estimated_solve_time_seconds: float = Field(default=1.84, alias="estimatedSolveTimeSeconds")
    solver_target: str = Field(alias="solverTarget")
    model_version: str = Field(alias="modelVersion")
    is_demo: bool = Field(default=False, alias="isDemo")
    is_simulated: bool = Field(default=False, alias="isSimulated")
    timestamp: str

class AllocationItemSchema(CamelModel):
    id: str
    demand_id: str = Field(alias="demandId")
    source_facility: str = Field(alias="sourceFacility")
    source_facility_id: str = Field(alias="sourceFacilityId")
    destination: str
    destination_region: str = Field(alias="destinationRegion")
    commodity: str
    item: str
    allocated_qty: float = Field(alias="allocatedQty")
    required_qty: float = Field(alias="requiredQty")
    remaining_demand: float = Field(alias="remainingDemand")
    unit: str
    route: str
    expected_arrival: str = Field(alias="expectedArrival")
    priority: str
    destination_selected_reason: Optional[str] = Field(default=None, alias="destinationSelectedReason")
    binding_constraints: Optional[str] = Field(default=None, alias="bindingConstraints")
    resources_considered: Optional[str] = Field(default=None, alias="resourcesConsidered")
    unmet_demand_reason: Optional[str] = Field(default=None, alias="unmetDemandReason")
    human_override: bool = Field(default=False, alias="humanOverride")
    status: str = "RESERVED"
    validation_status: str = Field(default="VALIDATED", alias="validationStatus")

class PlanDiagnosticsSchema(CamelModel):
    total_constraints: int = Field(alias="totalConstraints")
    hard_constraints_satisfied: int = Field(alias="hardConstraintsSatisfied")
    soft_constraints_relaxed: int = Field(default=0, alias="softConstraintsRelaxed")
    binding_constraints: List[str] = Field(default_factory=list, alias="bindingConstraints")

class AllocationPlanDetailSchema(CamelModel):
    id: str
    name: str
    description: Optional[str] = None
    incident_id: str = Field(alias="incidentId")
    status: str
    is_recommended: bool = Field(default=True, alias="isRecommended")
    solver_status: str = Field(alias="solverStatus")
    optimality_gap_pct: float = Field(default=0.02, alias="optimalityGapPct")
    runtime_seconds: float = Field(alias="runtimeSeconds")
    objective_value: float = Field(alias="objectiveValue")
    total_allocated_units: float = Field(alias="totalAllocatedUnits")
    total_verified_demand_units: float = Field(alias="totalVerifiedDemandUnits")
    overall_coverage_pct: float = Field(alias="overallCoveragePct")
    critical_coverage_pct: float = Field(alias="criticalCoveragePct")
    gini_coefficient: float = Field(alias="giniCoefficient")
    feasibility_badge: str = Field(default="OPTIMAL", alias="feasibilityBadge")
    computed_by: str = Field(alias="computedBy")
    approved_at: Optional[str] = Field(default=None, alias="approvedAt")
    approved_by: Optional[str] = Field(default=None, alias="approvedBy")
    approval_notes: Optional[str] = Field(default=None, alias="approvalNotes")
    allocations: List[AllocationItemSchema] = Field(default_factory=list)
    constraint_diagnostics: Optional[PlanDiagnosticsSchema] = Field(default=None, alias="constraintDiagnostics")
    created_at: str = Field(alias="createdAt")

class OptimizationJobConfig(CamelModel):
    plan_id: Optional[str] = Field(default="PLAN-ALPHA", alias="planId")
    incident_id: Optional[str] = Field(default="INC-2026-0412", alias="incidentId")
    commodities: List[str] = Field(default_factory=lambda: ["FOOD"])
    reserve_margin_pct: float = Field(default=15.0, alias="reserveMarginPct")
    min_equity_gini: float = Field(default=0.20, alias="minEquityGini")
    objective_weights: Dict[str, float] = Field(default_factory=lambda: {"welfare": 0.5, "equity": 0.3, "cost": 0.2}, alias="objectiveWeights")

class OptimizationExecutionResponse(CamelModel):
    status: str = "SUCCESS"
    category: str = "SUCCESS"
    job_id: str = Field(alias="jobId")
    solver_name: str = Field(alias="solverName")
    model_version: str = Field(alias="modelVersion")
    runtime_seconds: float = Field(alias="runtimeSeconds")
    feasibility: str
    optimality_gap_pct: float = Field(alias="optimalityGapPct")
    objective_value: float = Field(alias="objectiveValue")
    humanitarian_welfare_score: float = Field(alias="humanitarianWelfareScore")
    gini_coefficient: float = Field(alias="giniCoefficient")
    computed_by: str = Field(alias="computedBy")
    is_demo: bool = Field(default=False, alias="isDemo")
    is_simulated: bool = Field(default=False, alias="isSimulated")
    timestamp: str
    plan: AllocationPlanDetailSchema
    constraint_diagnostics: PlanDiagnosticsSchema = Field(alias="constraintDiagnostics")
    error: Optional[str] = None

class PlanApprovalRequest(CamelModel):
    approved_by: str = Field(alias="approvedBy")
    notes: Optional[str] = None

class PlanRejectRequest(CamelModel):
    rejected_by: str = Field(alias="rejectedBy")
    reason: str

