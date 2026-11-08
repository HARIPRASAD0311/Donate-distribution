from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict, Field

class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        serialize_by_alias=True
    )

class StrategyComparisonItem(CamelModel):
    metric: str
    baseline: float
    disrupted: float
    strat_alpha: float = Field(alias="stratAlpha")
    strat_beta: float = Field(alias="stratBeta")
    strat_gamma: float = Field(alias="stratGamma")

class MonteCarloDistributionItem(CamelModel):
    bin: str
    runs_disrupted: int = Field(alias="runsDisrupted")
    runs_alpha: int = Field(alias="runsAlpha")
    runs_beta: int = Field(alias="runsBeta")

class RecoveryTimeDistributionItem(CamelModel):
    strategy: str
    min: float
    q1: float
    median: float
    q3: float
    max: float

class ShortageDistributionItem(CamelModel):
    group: str
    disrupted_shortage: float = Field(alias="disruptedShortage")
    recovered_shortage: float = Field(alias="recoveredShortage")
    unit: str

class CvarComparisonItem(CamelModel):
    strategy: str
    expected_loss: float = Field(alias="expectedLoss")
    cvar95: float
    risk_tier: str = Field(alias="riskTier")

class ScenarioComparisonItem(CamelModel):
    scenario: str
    demand_coverage: float = Field(alias="demandCoverage")
    recovery_hours: float = Field(alias="recoveryHours")
    cost_usd: float = Field(alias="costUSD")

class RecoveryTimelineItem(CamelModel):
    hour: str
    baseline: float
    disrupted: float
    strat_alpha: float = Field(alias="stratAlpha")
    strat_beta: float = Field(alias="stratBeta")

class ResourceUtilizationItem(CamelModel):
    asset: str
    before: float
    after: float
    unit: str

class RecoveryAnalyticsSchema(CamelModel):
    strategy_comparison: List[StrategyComparisonItem] = Field(alias="strategyComparison")
    monte_carlo_distribution: List[MonteCarloDistributionItem] = Field(alias="monteCarloDistribution")
    recovery_time_distribution: List[RecoveryTimeDistributionItem] = Field(alias="recoveryTimeDistribution")
    shortage_distribution: List[ShortageDistributionItem] = Field(alias="shortageDistribution")
    cvar_comparison: List[CvarComparisonItem] = Field(alias="cvarComparison")
    scenario_comparison: List[ScenarioComparisonItem] = Field(alias="scenarioComparison")
    recovery_timeline: List[RecoveryTimelineItem] = Field(alias="recoveryTimeline")
    resource_utilization_after_recovery: List[ResourceUtilizationItem] = Field(alias="resourceUtilizationAfterRecovery")

class RecoveryStrategySchema(CamelModel):
    id: str
    name: str
    description: str
    is_recommended: bool = Field(default=False, alias="isRecommended")
    feasibility: str = "FEASIBLE"
    risk_level: str = Field(default="LOW", alias="riskLevel")
    critical_coverage_pct: float = Field(alias="criticalCoveragePct")
    remaining_unmet_demand: float = Field(alias="remainingUnmetDemand")
    worst_normalized_shortage_pct: float = Field(default=4.8, alias="worstNormalizedShortagePct")
    service_equity_gini: float = Field(default=0.19, alias="serviceEquityGini")
    expected_recovery_time_hours: float = Field(alias="expectedRecoveryTimeHours")
    resource_wastage_units: float = Field(default=45.0, alias="resourceWastageUnits")
    operating_cost_usd: float = Field(alias="operatingCostUSD")
    cost_delta_usd: str = Field(alias="costDeltaUSD")
    time_delta_hours: str = Field(alias="timeDeltaHours")
    actions_applied: List[str] = Field(default_factory=list, alias="actionsApplied")
    status: str = "CANDIDATE"
    computed_by: str = Field(default="seed", alias="computedBy")
    approved_at: Optional[str] = Field(default=None, alias="approvedAt")
    approved_by: Optional[str] = Field(default=None, alias="approvedBy")

class SimulationConfigSchema(CamelModel):
    baseline_plan_id: str = Field(default="PLAN-ALPHA", alias="baselinePlanId")
    disruption_scenario: Optional[Dict[str, Any]] = Field(default=None, alias="disruptionScenario")
    candidate_actions: Optional[List[str]] = Field(default=None, alias="candidateActions")
    num_runs: int = Field(default=500, alias="numRuns")
    time_horizon_hours: float = Field(default=72.0, alias="timeHorizonHours")

class SimulationResponseSchema(CamelModel):
    status: str = "SUCCESS"
    category: str = "SUCCESS"
    is_demo: bool = Field(default=False, alias="isDemo")
    is_simulated: bool = Field(default=False, alias="isSimulated")
    simulation_id: str = Field(alias="simulationId")
    status_label: str = Field(alias="statusLabel")
    engine: str
    num_runs: int = Field(alias="numRuns")
    time_horizon_hours: float = Field(alias="timeHorizonHours")
    scenario_applied: str = Field(alias="scenarioApplied")
    computed_by: str = Field(alias="computedBy")
    strategies: List[RecoveryStrategySchema]
    analytics: RecoveryAnalyticsSchema
    timestamp: str
    error: Optional[str] = None

class ActionValidationRequestSchema(CamelModel):
    action_type: str = Field(alias="actionType") # e.g. REROUTE_CORRIDOR, ACTIVATE_BARGE, AIR_SLING
    target_route_id: Optional[str] = Field(default=None, alias="targetRouteId")
    alternative_route_id: Optional[str] = Field(default=None, alias="alternativeRouteId")
    target_facility_id: Optional[str] = Field(default=None, alias="targetFacilityId")
    assigned_vehicles: Optional[List[str]] = Field(default=None, alias="assignedVehicles")

class ActionValidationResponseSchema(CamelModel):
    status: str = "SUCCESS"
    is_valid: bool = Field(alias="isValid")
    action_type: str = Field(alias="actionType")
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    throughput_impact: str = Field(alias="throughputImpact")
    estimated_delay_delta_hours: float = Field(alias="estimatedDelayDeltaHours")
    timestamp: str

class StrategyApprovalRequestSchema(CamelModel):
    approved_by: str = Field(alias="approvedBy")
    baseline_snapshot_id: Optional[str] = Field(default=None, alias="baselineSnapshotId")
    notes: Optional[str] = None
