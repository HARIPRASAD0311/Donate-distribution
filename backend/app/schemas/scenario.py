from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        serialize_by_alias=True
    )

class ScenarioStatusSchema(CamelModel):
    scenario_now: str = Field(alias="scenarioNow")
    active_incident_id: str = Field(alias="activeIncidentId")
    active_incident_name: str = Field(alias="activeIncidentName")
    crisis_type: str = Field(alias="crisisType")
    region: str
    is_supported: bool = Field(default=True, alias="isSupported")
    data_freshness: str = Field(default="SYNCHRONIZED_WITH_SCENARIO_CLOCK", alias="dataFreshness")
    demo_watermark: str = Field(default="SYNTHETIC BENCHMARK DATA — FLOOD EMERGENCY RESPONSE", alias="demoWatermark")
    system_version: str = Field(default="2.5.0-HiGHS-SimPy", alias="systemVersion")
    supported_commodities: List[str] = Field(default_factory=lambda: ["FOOD"], alias="supportedCommodities")
    commodity_validation_scope: str = Field(
        default="FOOD certified; WATER and MEDICAL stored and visible but marked 'not validated'.",
        alias="commodityValidationScope"
    )
    optimization_engine: str = Field(default="Pyomo 6.10 + HiGHS 1.15", alias="optimizationEngine")
    simulation_engine: str = Field(default="SimPy 4.1 + Monte Carlo & CVaR (95%)", alias="simulationEngine")
    last_data_import: Optional[str] = Field(default=None, alias="lastDataImport")

class ScenarioClockSchema(CamelModel):
    scenario_now: str = Field(alias="scenarioNow")
