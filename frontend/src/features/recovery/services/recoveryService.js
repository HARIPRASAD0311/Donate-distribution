/**
 * ResQNet Recovery Simulator Service Adapter
 * Strictly separated Demo Mode and Live API Mode.
 *
 * DEMO MODE:
 * - Returns explicitly labeled synthetic Monte Carlo strategies and distributions.
 * - Identifies simulated metrics and scenarios.
 * - Never claims a real backend simulation executed.
 *
 * LIVE API MODE:
 * - Calls the configured Python simulation backend (SimPy / NumPy Monte Carlo & CVaR).
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
import {
  MOCK_RECOVERY_STRATEGIES,
  RECOVERY_ANALYTICS,
} from '../data/recoveryData.js';
import { useAppStore } from '../../../store/useAppStore.js';

/**
 * Triggers a multi-scenario Monte Carlo recovery simulation run.
 *
 * @param {Object} simConfig - { baselinePlanId, disruptionScenario, candidateActions, numRuns, timeHorizonHours }
 * @param {Object} [options] - { isDemoMode, signal }
 * @returns {Promise<Object>} Simulation result payload or categorized error
 */
export async function runRecoverySimulation(simConfig, options = {}) {
  const isDemo =
    options.isDemoMode !== undefined
      ? options.isDemoMode
      : useAppStore.getState().isDemoMode;

  if (isDemo) {
    // Demonstration telemetry: Explicitly tagged as synthetic demo simulation
    return {
      status: ServiceResponseCategory.SUCCESS,
      category: ServiceResponseCategory.SUCCESS,
      isDemo: true,
      isSimulated: true,
      demoNotice:
        'DEMONSTRATION SIMULATION: Synthetic Monte Carlo distribution generated from local scenario baseline. No live simulation engine was invoked.',
      simulationId: `DEMO-SIM-MC-${Date.now()}`,
      statusLabel: 'COMPLETED (DEMO)',
      engine: 'Simulated Monte Carlo Benchmark (Demo Mode)',
      numRuns: simConfig.numRuns || 500,
      timeHorizonHours: simConfig.timeHorizonHours || 72,
      scenarioApplied:
        simConfig.disruptionScenario?.name ||
        'Cyclone Idai II: Major Culvert Washout & Flash Inundation',
      timestamp: new Date().toISOString(),
      strategies: MOCK_RECOVERY_STRATEGIES,
      analytics: RECOVERY_ANALYTICS,
      error: null,
    };
  }

  // Live API Mode: strictly call backend
  try {
    const response = await apiClient('/recovery/simulate', {
      method: 'POST',
      body: JSON.stringify(simConfig),
      signal: options.signal,
    });

    return {
      status: ServiceResponseCategory.SUCCESS,
      category: ServiceResponseCategory.SUCCESS,
      isDemo: false,
      isSimulated: false,
      strategies: response.strategies || response,
      analytics: response.analytics || null,
      engine: response.engine || 'External Python Simulation Engine (Live)',
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
      strategies: null,
      analytics: null,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Validates recovery action feasibility against network topology and vehicle constraints.
 *
 * @param {Object} actionPayload
 * @param {Object} [options]
 */
export async function validateRecoveryAction(actionPayload, options = {}) {
  const isDemo =
    options.isDemoMode !== undefined
      ? options.isDemoMode
      : useAppStore.getState().isDemoMode;

  if (isDemo) {
    return {
      status: ServiceResponseCategory.SUCCESS,
      category: ServiceResponseCategory.SUCCESS,
      isFeasible: true,
      warnings: [
        'River barge turnaround cycle is tide-dependent; high tide transit window restricted to 04:00-08:00 UTC.',
      ],
      estimatedRecoveryDelayHours: 6.5,
      isDemo: true,
      isSimulated: true,
    };
  }

  try {
    const response = await apiClient('/recovery/validate-action', {
      method: 'POST',
      body: JSON.stringify(actionPayload),
      signal: options.signal,
    });

    return {
      status: ServiceResponseCategory.SUCCESS,
      category: ServiceResponseCategory.SUCCESS,
      isDemo: false,
      ...response,
    };
  } catch (err) {
    const errorInfo = classifyApiError(err);
    return {
      status: errorInfo.category,
      category: errorInfo.category,
      isFeasible: false,
      error: errorInfo,
      isDemo: false,
    };
  }
}

/**
 * Commits formal Human Approval for a candidate recovery plan.
 *
 * @param {string} strategyId
 * @param {Object} approvalData - { reviewerName, role, reason, timestamp }
 * @param {Object} [options]
 */
export async function approveRecoveryPlan(strategyId, approvalData, options = {}) {
  const isDemo =
    options.isDemoMode !== undefined
      ? options.isDemoMode
      : useAppStore.getState().isDemoMode;

  if (isDemo) {
    return {
      status: ServiceResponseCategory.SUCCESS,
      category: ServiceResponseCategory.SUCCESS,
      success: true,
      strategyId,
      approvalStatus: 'APPROVED',
      reviewedBy: approvalData.reviewerName || 'Operational Commander S. Vance',
      reviewedAt: new Date().toISOString(),
      reason: approvalData.reason,
      isDemo: true,
      isSimulated: true,
    };
  }

  try {
    const response = await apiClient(`/recovery/strategies/${strategyId}/approve`, {
      method: 'POST',
      body: JSON.stringify(approvalData),
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
