/**
 * ResQNet Optimization Engine Service Adapter
 * Strictly separated Demo Mode and Live API Mode.
 *
 * DEMO MODE:
 * - Returns explicitly labeled synthetic benchmark plans.
 * - Identifies simulated metrics and scenarios.
 * - Never claims a real backend solver executed.
 *
 * LIVE API MODE:
 * - Calls the configured Python backend service (HiGHS / SCIP MILP).
 * - Uses the actual backend response.
 * - Never falls back to mock results on failure.
 * - Never generates synthetic successful outcomes.
 * - Categorizes all failure types (API_UNAVAILABLE, VALIDATION_ERROR, INFEASIBLE, etc.).
 */

import {
  apiClient,
  ServiceResponseCategory,
  classifyApiError,
} from '../../../services/apiClient.js';
import { MOCK_PLANS, MOCK_PLAN_HISTORY } from '../data/allocationData.js';
import { useAppStore } from '../../../store/useAppStore.js';

/**
 * Validates optimization input readiness and physical constraint feasibility.
 *
 * @param {Object} inputPayload - Scope, inventories, demand, and constraints
 * @param {Object} [options] - { isDemoMode, signal }
 * @returns {Promise<Object>} Categorized validation report
 */
export async function validateOptimizationInputs(inputPayload, options = {}) {
  const isDemo =
    options.isDemoMode !== undefined
      ? options.isDemoMode
      : useAppStore.getState().isDemoMode;

  const commodities = inputPayload.commodities || [];
  const sourceFacilities = inputPayload.sourceFacilities || [];
  const destinationRegions = inputPayload.destinationRegions || [];
  const reserveMarginPct = Number(inputPayload.reserveMarginPct ?? 15);
  const budgetCapUSD = Number(inputPayload.budgetCapUSD ?? 250000);
  const constraints = inputPayload.constraints || {};

  if (isDemo) {
    // Demonstration client-side constraint checking
    const warnings = [];
    const errors = [];
    const missingFields = [];

    if (commodities.length === 0) {
      errors.push('At least one commodity stream (Food, Water, or Medical) must be enabled.');
      missingFields.push('Commodity Streams');
    }
    if (sourceFacilities.length === 0) {
      errors.push('At least one operational source staging depot must be selected.');
      missingFields.push('Source Facilities');
    }
    if (destinationRegions.length === 0) {
      errors.push('At least one target destination region must be selected.');
      missingFields.push('Destination Regions');
    }
    if (!inputPayload.planningPeriod) {
      errors.push('Planning time horizon must be defined (24h, 48h, 72h, or 7d).');
      missingFields.push('Planning Horizon');
    }
    if (budgetCapUSD <= 0) {
      errors.push('Operational transport budget cap must be greater than $0.');
      missingFields.push('Budget Cap');
    }
    if (reserveMarginPct < 0 || reserveMarginPct > 50) {
      errors.push('Safety reserve margin must be between 0% and 50%.');
    } else if (reserveMarginPct < 5) {
      warnings.push('Safety reserve margin is below 5%. Higher stockout risk in second-wave surges.');
    }
    if (constraints.minimumEquityCoveragePct > 100) {
      errors.push('Minimum equity coverage target cannot exceed 100%.');
    }
    if (constraints.equityGiniMaxThreshold <= 0.05) {
      warnings.push('Extremely tight Gini equity ceiling (≤0.05) may render linear program infeasible in isolated pockets.');
    }

    const isValid = errors.length === 0;

    const auditChecks = [
      {
        id: 'chk-commodities',
        name: 'Commodity Streams Verification',
        status: commodities.length > 0 ? 'PASS' : 'FAIL',
        detail: commodities.length > 0 ? `${commodities.length} streams selected (${commodities.join(', ')})` : 'No commodity streams active',
      },
      {
        id: 'chk-sources',
        name: 'Operational Staging Depots',
        status: sourceFacilities.length > 0 ? 'PASS' : 'FAIL',
        detail: sourceFacilities.length > 0 ? `${sourceFacilities.length} depots operational` : 'No source facilities selected',
      },
      {
        id: 'chk-destinations',
        name: 'Target Beneficiary Regions',
        status: destinationRegions.length > 0 ? 'PASS' : 'FAIL',
        detail: destinationRegions.length > 0 ? `${destinationRegions.length} regions mapped` : 'No destinations specified',
      },
      {
        id: 'chk-reserve',
        name: 'Safety Reserve Margins',
        status: reserveMarginPct >= 5 ? 'PASS' : 'WARN',
        detail: `${reserveMarginPct}% baseline reserve retention configured`,
      },
      {
        id: 'chk-constraints',
        name: 'Policy & Constraint Boundaries',
        status: isValid ? 'PASS' : 'FAIL',
        detail: isValid ? 'All physical and policy bounds within valid domain' : `${errors.length} constraint violation(s) detected`,
      },
    ];

    return {
      status: isValid ? ServiceResponseCategory.SUCCESS : ServiceResponseCategory.VALIDATION_ERROR,
      category: isValid ? ServiceResponseCategory.SUCCESS : ServiceResponseCategory.VALIDATION_ERROR,
      isValid,
      errors,
      warnings,
      missingFields,
      auditChecks,
      matrixDimensions: {
        decisionVariables: 284,
        constraints: 142,
        integerVariables: 48,
        timeHorizon: inputPayload.planningPeriod || '72h',
      },
      estimatedSolveTimeSeconds: 1.84,
      solverTarget: 'HiGHS Mixed-Integer Linear Program (Simulated Demo Target)',
      modelVersion: 'ResQNet-Opt-v2.4-Sphere-Demo',
      isDemo: true,
      isSimulated: true,
      timestamp: new Date().toISOString(),
    };
  }

  // Live API Mode: Call actual backend endpoint
  try {
    const response = await apiClient('/optimize/validate', {
      method: 'POST',
      body: JSON.stringify(inputPayload),
      signal: options.signal,
    });

    return {
      status: ServiceResponseCategory.SUCCESS,
      category: ServiceResponseCategory.SUCCESS,
      isValid: response.isValid !== false,
      errors: response.errors || [],
      warnings: response.warnings || [],
      missingFields: response.missingFields || [],
      auditChecks: response.auditChecks || [],
      matrixDimensions: response.matrixDimensions || { decisionVariables: 0, constraints: 0 },
      ...response,
      isDemo: false,
      isSimulated: false,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    const errorInfo = classifyApiError(err);
    return {
      status: errorInfo.category,
      category: errorInfo.category,
      isValid: false,
      errors: [errorInfo.message],
      warnings: [],
      missingFields: [],
      auditChecks: [
        {
          id: 'chk-backend',
          name: 'Backend Validation Service Connectivity',
          status: 'FAIL',
          detail: errorInfo.message,
        },
      ],
      error: errorInfo,
      isDemo: false,
      isSimulated: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Triggers optimization solver execution.
 *
 * @param {Object} jobConfig - Model configuration, objective weights, and active plan id
 * @param {Object} [options] - { isDemoMode, signal }
 * @returns {Promise<Object>} Completed optimization result or structured error
 */
export async function executeOptimization(jobConfig, options = {}) {
  const isDemo =
    options.isDemoMode !== undefined
      ? options.isDemoMode
      : useAppStore.getState().isDemoMode;

  if (isDemo) {
    // Demonstration Mode: Return clearly tagged benchmark plan
    const selectedPlanId = jobConfig.planId || 'PLAN-ALPHA';
    const plan = MOCK_PLANS[selectedPlanId] || MOCK_PLANS['PLAN-ALPHA'];

    return {
      status: ServiceResponseCategory.SUCCESS,
      category: ServiceResponseCategory.SUCCESS,
      isDemo: true,
      isSimulated: true,
      demoNotice:
        'DEMONSTRATION RUN: Synthetic allocation generated using pre-computed benchmark dataset. No real backend solver was invoked.',
      jobId: `DEMO-OPT-${Date.now()}`,
      solverName: 'Simulated Benchmark Solver (Demo Mode)',
      modelVersion: 'ResQNet-Opt-v2.4-Sphere-Demo',
      runtimeSeconds: 1.84,
      feasibility: 'OPTIMAL_FEASIBLE',
      optimalityGapPct: 0.02,
      objectiveValue: 94.62,
      humanitarianWelfareScore: 94.62,
      giniCoefficient: 0.18,
      timestamp: new Date().toISOString(),
      plan,
      constraintDiagnostics: {
        totalConstraints: 142,
        hardConstraintsSatisfied: 142,
        softConstraintsRelaxed: 2,
        bindingConstraints: [
          'Buzi River Shallow-Draft Barge Daily Cargo Capacity (85 tons max)',
          'Central Staging Depot Dry Staging Bay A-04 FEFO Expiry Shelf-Life Window',
          'Chibabava Field Triage Clinic Minimum Medical Reserve Mandate',
        ],
      },
      error: null,
    };
  }

  // Live API Mode: strictly call backend
  try {
    const response = await apiClient('/optimize/milp', {
      method: 'POST',
      body: JSON.stringify(jobConfig),
      signal: options.signal,
    });

    return {
      status: ServiceResponseCategory.SUCCESS,
      category: ServiceResponseCategory.SUCCESS,
      isDemo: false,
      isSimulated: false,
      plan: response.plan || response,
      solverName: response.solverName || 'External Python HiGHS Solver (Live)',
      ...response,
      error: null,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    // CRITICAL: In Live API Mode, NEVER return fake successful results on error!
    const errorInfo = classifyApiError(err);
    return {
      status: errorInfo.category,
      category: errorInfo.category,
      isDemo: false,
      isSimulated: false,
      error: errorInfo,
      plan: null,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Submits formal Human Approval of the proposed allocation plan.
 *
 * @param {string} planId
 * @param {Object} reviewData - { reviewerName, role, reason, overrideChanges }
 * @param {Object} [options]
 */
export async function approvePlan(planId, reviewData, options = {}) {
  const isDemo =
    options.isDemoMode !== undefined
      ? options.isDemoMode
      : useAppStore.getState().isDemoMode;

  if (isDemo) {
    return {
      status: ServiceResponseCategory.SUCCESS,
      category: ServiceResponseCategory.SUCCESS,
      success: true,
      planId,
      approvalStatus: 'APPROVED',
      reviewedBy: reviewData.reviewerName || 'Operational Commander S. Vance',
      reviewedAt: new Date().toISOString(),
      reason: reviewData.reason || 'Optimal multi-echelon compromise meeting minimum Sphere standards.',
      isDemo: true,
      isSimulated: true,
    };
  }

  try {
    const response = await apiClient(`/optimize/plans/${planId}/approve`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
      signal: options.signal,
    });

    return {
      status: ServiceResponseCategory.SUCCESS,
      category: ServiceResponseCategory.SUCCESS,
      success: true,
      isDemo: false,
      ...response,
    };
  } catch (err) {
    const errorInfo = classifyApiError(err);
    return {
      status: errorInfo.category,
      category: errorInfo.category,
      success: false,
      error: errorInfo,
      isDemo: false,
    };
  }
}

/**
 * Rejects or requests modification for an allocation plan.
 *
 * @param {string} planId
 * @param {Object} rejectionData - { reviewerName, reason, requestedModifications }
 * @param {Object} [options]
 */
export async function rejectPlan(planId, rejectionData, options = {}) {
  const isDemo =
    options.isDemoMode !== undefined
      ? options.isDemoMode
      : useAppStore.getState().isDemoMode;

  if (isDemo) {
    return {
      status: ServiceResponseCategory.SUCCESS,
      category: ServiceResponseCategory.SUCCESS,
      success: true,
      planId,
      approvalStatus: 'REJECTED',
      reviewedBy: rejectionData.reviewerName || 'Operational Commander S. Vance',
      reviewedAt: new Date().toISOString(),
      reason: rejectionData.reason,
      isDemo: true,
      isSimulated: true,
    };
  }

  try {
    const response = await apiClient(`/optimize/plans/${planId}/reject`, {
      method: 'POST',
      body: JSON.stringify(rejectionData),
      signal: options.signal,
    });

    return {
      status: ServiceResponseCategory.SUCCESS,
      category: ServiceResponseCategory.SUCCESS,
      success: true,
      isDemo: false,
      ...response,
    };
  } catch (err) {
    const errorInfo = classifyApiError(err);
    return {
      status: errorInfo.category,
      category: errorInfo.category,
      success: false,
      error: errorInfo,
      isDemo: false,
    };
  }
}

/**
 * Retrieves historical plan revisions and approval audit logs.
 *
 * @param {string} incidentId
 * @param {Object} [options]
 */
export async function getPlanHistory(incidentId, options = {}) {
  const isDemo =
    options.isDemoMode !== undefined
      ? options.isDemoMode
      : useAppStore.getState().isDemoMode;

  if (isDemo) {
    return {
      status: ServiceResponseCategory.SUCCESS,
      category: ServiceResponseCategory.SUCCESS,
      history: MOCK_PLAN_HISTORY,
      isDemo: true,
      isSimulated: true,
    };
  }

  try {
    const response = await apiClient(`/optimize/plans/history?incidentId=${incidentId}`, {
      signal: options.signal,
    });
    return {
      status: ServiceResponseCategory.SUCCESS,
      category: ServiceResponseCategory.SUCCESS,
      history: response.history || response,
      isDemo: false,
    };
  } catch (err) {
    const errorInfo = classifyApiError(err);
    return {
      status: errorInfo.category,
      category: errorInfo.category,
      history: [],
      error: errorInfo,
      isDemo: false,
    };
  }
}
