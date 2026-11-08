/**
 * ResQNet TypeScript Type Definitions
 * Integrated Humanitarian Crisis Operations and Resource Allocation Platform
 */

export type SeverityLevel = 'LEVEL_1_MONITORING' | 'LEVEL_2_ELEVATED' | 'LEVEL_3_EMERGENCY' | 'LEVEL_4_CATASTROPHIC';

export type DemandPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING_RECON' | 'VERIFIED' | 'REJECTED';

export type CommodityCategory = 'FOOD' | 'WATER' | 'MEDICAL' | 'SHELTER' | 'HYGIENE' | 'LOGISTICS';

export type DispatchStatus = 'AWAITING_DISPATCH' | 'IN_TRANSIT' | 'DELIVERED' | 'EXCEPTION';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ActiveIncident {
  id: string;
  code: string;
  name: string;
  region: string;
  severity: SeverityLevel;
  type: string;
  declaredAt: string;
  isSimulated: boolean;
  activeDispatchesCount: number;
  criticalPocketsCount: number;
}

export interface WarehouseFacility {
  id: string;
  name: string;
  code: string;
  locationName: string;
  coordinates: Coordinates;
  totalCapacityM3: number;
  utilizedCapacityM3: number;
  status: 'OPERATIONAL' | 'CONSTRAINED' | 'OFFLINE';
  isSimulated: boolean;
}

export interface InventoryBatch {
  id: string;
  warehouseId: string;
  itemCode: string;
  itemName: string;
  category: CommodityCategory;
  batchNumber: string;
  quantityOnHand: number;
  unitOfMeasure: string;
  expiryDate: string;
  daysToExpiry: number;
  fefoPriority: 'CRITICAL' | 'ELEVATED' | 'STABLE';
  isSimulated: boolean;
}

export interface CommunityDemand {
  id: string;
  incidentId: string;
  communityName: string;
  sector: string;
  coordinates: Coordinates;
  resourceCategory: CommodityCategory;
  commodityName: string;
  requiredQuantity: number;
  unitOfMeasure: string;
  priority: DemandPriority;
  reportedBy: string;
  reportedVia: string;
  reportedAt: string;
  verificationStatus: VerificationStatus;
  isSimulated: boolean;
}

export interface AllocationProposal {
  id: string;
  sourceFacilityId: string;
  sourceFacilityName: string;
  targetCommunityId: string;
  targetCommunityName: string;
  commodityName: string;
  allocatedQuantity: number;
  unitOfMeasure: string;
  feasibilityStatus: 'FEASIBLE' | 'PARTIALLY_CONSTRAINED' | 'INFEASIBLE';
  routeFeasible: boolean;
  coordinatorAuthorized: boolean;
  isSimulated: boolean;
}

export interface CandidateStrategy {
  id: string;
  code: string;
  name: string;
  description: string;
  feasibility: 'FEASIBLE' | 'HIGH_RISK' | 'INFEASIBLE';
  quantityDelivered: number;
  remainingShortage: number;
  deliveryDelayHours: number;
  estimatedCostUsd: number;
  criticalDemandCoveragePct: number;
  infeasibilityReason?: string;
  isSimulated: boolean;
}

export interface DispatchRecord {
  id: string;
  shipmentCode: string;
  allocationPlanId: string;
  originFacility: string;
  destination: string;
  commodity: string;
  quantity: number;
  unitOfMeasure: string;
  transportMode: string;
  vehicleRegistration: string;
  driverName?: string;
  status: DispatchStatus;
  dispatchedAt?: string;
  estimatedDelivery?: string;
  hasException: boolean;
  exceptionDetails?: {
    type: string;
    description: string;
    reportedAt: string;
    actionRequired: string;
  };
  isSimulated: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: 'CREATE' | 'UPDATE' | 'AUTHORIZE' | 'OVERRIDE' | 'DISPATCH' | 'EXCEPTION_RESOLVE';
  entityType: string;
  entityId: string;
  details: string;
  isSimulated: boolean;
}
