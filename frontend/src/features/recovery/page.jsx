import React, { useState, useRef, useCallback } from 'react';
import {
  GitBranch,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Cpu,
  Layers,
  Sparkles,
  Sliders,
  BarChart3,
  Network,
  ShieldAlert,
  Server,
  StopCircle,
  Clock,
  History,
  XCircle,
  WrenchIcon,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAppStore } from '../../store/useAppStore.js';
import { API_BASE_URL } from '../../services/apiClient.js';

import {
  BASELINE_PLAN,
  DISRUPTION_TEMPLATES,
  MOCK_RECOVERY_STRATEGIES,
  RECOVERY_ANALYTICS,
} from './data/recoveryData.js';

import {
  runRecoverySimulation,
  approveRecoveryPlan,
} from './services/recoveryService.js';

import { BaselineSelector } from './components/BaselineSelector.jsx';
import { DisruptionScenarioBuilder } from './components/DisruptionScenarioBuilder.jsx';
import { StateTransitionDiagram } from './components/StateTransitionDiagram.jsx';
import { BeforeAfterNetworkView } from './components/BeforeAfterNetworkView.jsx';
import { RecoveryStrategyCards } from './components/RecoveryStrategyCards.jsx';
import { AdvancedRecoveryAnalytics } from './components/AdvancedRecoveryAnalytics.jsx';
import { SimulationConfigModal } from './components/SimulationConfigModal.jsx';
import { RecoveryApprovalModal } from './components/RecoveryApprovalModal.jsx';

// ─── Simulation State Machine ────────────────────────────────────────────────
const SIM_STATE = {
  NOT_STARTED: 'NOT_STARTED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  INFEASIBLE: 'INFEASIBLE',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

/**
 * ResQNet Recovery Simulator Module Page
 * Strictly separated Demo Mode and Live API Mode.
 */
export default function RecoveryPage() {
  const selectedIncident = useAppStore(state => state.selectedIncident);
  const isDemoMode = useAppStore(state => state.isDemoMode);
  const dataMode = useAppStore(state => state.dataMode);
  const setDataMode = useAppStore(state => state.setDataMode);
  const addAuditEvent = useAppStore(state => state.addAuditEvent);
  const recordRecoveryResult = useAppStore(state => state.recordRecoveryResult);
  const recordRecoveryDecision = useAppStore(state => state.recordRecoveryDecision);

  // 1. Baseline Selection State
  const [selectedPlan, setSelectedPlan] = useState('PLAN-ALPHA');
  const [selectedHorizon, setSelectedHorizon] = useState('72h');

  // 2. Disruption Scenario State
  const [activeScenarioKey, setActiveScenarioKey] = useState('FLOOD');
  const [scenarioData, setScenarioData] = useState(DISRUPTION_TEMPLATES['FLOOD']);

  // 3. Simulation State Machine
  const [simState, setSimState] = useState(SIM_STATE.NOT_STARTED);
  const [simError, setSimError] = useState(null);
  const [lastSimResult, setLastSimResult] = useState(null);
  const [previousValidSim, setPreviousValidSim] = useState(null);

  // 4. Simulation History (compact run log)
  // Each entry: { simId, timestamp, scenarioName, numRuns, status, isDemo }
  const [simHistory, setSimHistory] = useState([]);

  const abortControllerRef = useRef(null);

  // ── Strategy Resolution (single source of truth) ────────────────────────────
  const resolvedStrategies = (() => {
    if (isDemoMode) {
      return lastSimResult?.strategies || MOCK_RECOVERY_STRATEGIES;
    }
    if (simState === SIM_STATE.COMPLETED && lastSimResult?.strategies) {
      return lastSimResult.strategies;
    }
    if (previousValidSim?.strategies) {
      return previousValidSim.strategies;
    }
    return null;
  })();

  // ── Strategy Selection State ────────────────────────────────────────────────
  const [selectedStrategyId, setSelectedStrategyId] = useState('STRAT-ALPHA');
  const activeStrategy =
    resolvedStrategies?.find((s) => s.id === selectedStrategyId) ||
    resolvedStrategies?.[0] ||
    null;

  // ── Analytics Resolution (always from same sim result as strategies) ────────
  const activeAnalytics = isDemoMode
    ? lastSimResult?.analytics || RECOVERY_ANALYTICS
    : lastSimResult?.analytics || previousValidSim?.analytics || null;

  // ── Outcome score derived from active strategy (never hardcoded) ────────────
  const derivedOutcomeScore = (() => {
    if (!activeStrategy) return '— / 100';
    // Prefer explicit welfare score from result, fallback to coverage-based estimate
    if (activeStrategy.humanitarianWelfareScore !== undefined) {
      return `${activeStrategy.humanitarianWelfareScore} / 100`;
    }
    // Derive a composite score: weight coverage 60%, equity 20%, speed 20%
    const coverage = activeStrategy.criticalCoveragePct ?? 0;
    const equity = activeStrategy.serviceEquityGini !== undefined
      ? Math.round((1 - activeStrategy.serviceEquityGini) * 100)
      : 80;
    const speedIndex = activeStrategy.expectedRecoveryTimeHours
      ? Math.max(0, Math.round(100 - activeStrategy.expectedRecoveryTimeHours))
      : 80;
    const composite = ((coverage * 0.6) + (equity * 0.2) + (speedIndex * 0.2)).toFixed(2);
    return `${composite} / 100`;
  })();

  // ── Strategy Action State (approve / reject / modify) ──────────────────────
  const [strategyActionState, setStrategyActionState] = useState({
    approvedStrategyId: null,
    rejectedStrategyId: null,
    rejectionReason: null,
    modificationRequest: null,
    actionTimestamp: null,
    actionedBy: null,
    decisionType: null, // 'APPROVED' | 'REJECTED' | 'MODIFICATION_REQUESTED'
    isDemo: false,
  });

  // Modals & Panels
  const [isSimConfigOpen, setIsSimConfigOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'ANALYTICS'

  const analyticsRef = useRef(null);

  // ── Scenario Handlers ───────────────────────────────────────────────────────
  const handleScenarioChange = (key) => {
    setActiveScenarioKey(key);
    setScenarioData(DISRUPTION_TEMPLATES[key]);
  };

  const handleParameterChange = (idx, val) => {
    setScenarioData((prev) => {
      const nextParams = [...prev.parameters];
      nextParams[idx] = { ...nextParams[idx], value: val };
      return { ...prev, parameters: nextParams };
    });
  };

  const handleResetScenario = () => {
    setScenarioData(DISRUPTION_TEMPLATES[activeScenarioKey]);
  };

  // ── Simulation Execution ────────────────────────────────────────────────────
  const handleRunSimulation = async (simParams) => {
    setSimState(SIM_STATE.RUNNING);
    setSimError(null);

    const ctrl = new AbortController();
    abortControllerRef.current = ctrl;

    const currentOperationalState = useAppStore.getState();
    const operationalSnapshot = JSON.parse(JSON.stringify({inventoryLots:currentOperationalState.inventoryLots,demandRecords:currentOperationalState.demandRecords,allocationPlans:currentOperationalState.allocationPlans,dispatchOrders:currentOperationalState.dispatchOrders,deliveryRecords:currentOperationalState.deliveryRecords}));
    const result = await runRecoverySimulation(
      {
        operationalSnapshot,
        baselinePlanId: selectedPlan,
        disruptionScenario: scenarioData,
        numRuns: simParams?.numRuns || 500,
        timeHorizonHours: simParams?.timeHorizon || 72,
      },
      { isDemoMode, signal: ctrl.signal }
    );

    abortControllerRef.current = null;
    setLastSimResult(result);
    if (result?.category === 'SUCCESS') recordRecoveryResult({simulationId:result.simulationId || `SIM-${Date.now()}`,incidentId:selectedIncident?.id,baselinePlanId:selectedPlan,operationalSnapshot,result});

    // Append to history regardless of outcome
    const historyEntry = {
      simId: result.simulationId || `SIM-${Date.now()}`,
      timestamp: result.timestamp || new Date().toISOString(),
      scenarioName: scenarioData.name,
      numRuns: simParams?.numRuns || 500,
      status: result.category,
      isDemo: result.isDemo ?? isDemoMode,
    };
    setSimHistory((prev) => [historyEntry, ...prev].slice(0, 10)); // keep last 10

    if (result.category === 'SUCCESS') {
      setSimState(SIM_STATE.COMPLETED);
      setSimError(null);
      // If the first strategy selection is stale, reset to first returned strategy
      if (result.strategies && result.strategies.length > 0) {
        const still = result.strategies.find((s) => s.id === selectedStrategyId);
        if (!still) setSelectedStrategyId(result.strategies[0].id);
      }
      setPreviousValidSim({
        strategies: result.strategies,
        analytics: result.analytics,
        timestamp: result.timestamp || new Date().toISOString(),
        isDemo: result.isDemo,
      });
    } else {
      const isInfeasible = result.category === 'INFEASIBLE' || result.category === 'SOLVER_INFEASIBLE';
      setSimState(isInfeasible ? SIM_STATE.INFEASIBLE : SIM_STATE.FAILED);
      setSimError(
        result.error || {
          category: result.category,
          title: 'Simulation Request Failed',
          message: 'The recovery simulation service did not return a valid result.',
        }
      );
    }
  };

  const handleCancelSimulation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSimState(SIM_STATE.CANCELLED);
  };

  // ── Approval / Reject / Modify Handlers ────────────────────────────────────
  const handleApproveStrategy = useCallback(async (strategyId, reviewPayload) => {
    const snapshot = useAppStore.getState().recoveryResults.find(r=>r.simulationId===(lastSimResult?.simulationId));
    if (!snapshot) return {success:false,category:'VALIDATION_ERROR',error:'No recorded simulation snapshot is available for approval'};
    const currentState = useAppStore.getState();
    const currentSnapshot = JSON.parse(JSON.stringify({inventoryLots:currentState.inventoryLots,demandRecords:currentState.demandRecords,allocationPlans:currentState.allocationPlans,dispatchOrders:currentState.dispatchOrders,deliveryRecords:currentState.deliveryRecords}));
    if (JSON.stringify(snapshot.operationalSnapshot)!==JSON.stringify(currentSnapshot)) return {success:false,category:'VALIDATION_ERROR',error:'Simulation is stale; rerun against current operational state'};
    const approvalResult = await approveRecoveryPlan(strategyId, reviewPayload, { isDemoMode });
    if (!approvalResult || approvalResult.success === false || approvalResult.category === 'API_UNAVAILABLE' || approvalResult.category === 'VALIDATION_ERROR') return approvalResult;
    const now = new Date().toISOString();
    const decision = recordRecoveryDecision({simulationId:snapshot.simulationId,status:'APPROVED',actor:reviewPayload.reviewerName||'SIMULATED_REVIEWER',reason:reviewPayload.reason||'Strategy approved after review'});
    if (!decision?.ok) return {success:false,category:'VALIDATION_ERROR',error:decision?.error||'Recovery baseline validation failed'};

    setStrategyActionState({
      approvedStrategyId: strategyId,
      rejectedStrategyId: null,
      rejectionReason: null,
      modificationRequest: null,
      actionTimestamp: now,
      actionedBy: reviewPayload.reviewerName || 'Operational Coordinator',
      decisionType: 'APPROVED',
      isDemo: isDemoMode,
    });

    // Record in global audit log
    addAuditEvent({
      action: 'RECOVERY_STRATEGY_APPROVED',
      module: 'Recovery Simulator',
      user: reviewPayload.reviewerName || 'Operational Coordinator',
      role: reviewPayload.role || 'Crisis Response Director',
      details: `Recovery strategy ${strategyId} authorized. ${reviewPayload.reason || ''}`,
      simulationId: lastSimResult?.simulationId,
      isDemo: isDemoMode,
    });

    return approvalResult;
  }, [isDemoMode, addAuditEvent, lastSimResult, recordRecoveryDecision]);

  const handleRejectStrategy = useCallback((strategyId, payload) => {
    const now = new Date().toISOString();
    const snapshot=useAppStore.getState().recoveryResults.find(r=>r.simulationId===lastSimResult?.simulationId);
    if(snapshot) { const decision=recordRecoveryDecision({simulationId:snapshot.simulationId,status:'REJECTED',actor:payload.reviewerName||'SIMULATED_REVIEWER',reason:payload.reason||'Strategy rejected'}); if(!decision?.ok) return decision; }

    setStrategyActionState({
      approvedStrategyId: null,
      rejectedStrategyId: strategyId,
      rejectionReason: payload.reason || 'No reason provided',
      modificationRequest: null,
      actionTimestamp: now,
      actionedBy: payload.reviewerName || 'Operational Coordinator',
      decisionType: 'REJECTED',
      isDemo: isDemoMode,
    });

    addAuditEvent({
      action: 'RECOVERY_STRATEGY_REJECTED',
      module: 'Recovery Simulator',
      user: payload.reviewerName || 'Operational Coordinator',
      role: payload.role || 'Crisis Response Director',
      details: `Recovery strategy ${strategyId} rejected. Reason: ${payload.reason || 'None'}`,
      simulationId: lastSimResult?.simulationId,
      isDemo: isDemoMode,
    });

    setIsApprovalModalOpen(false);
  }, [isDemoMode, addAuditEvent, lastSimResult, recordRecoveryDecision]);

  const handleRequestModification = useCallback((strategyId, payload) => {
    const now = new Date().toISOString();

    setStrategyActionState({
      approvedStrategyId: null,
      rejectedStrategyId: null,
      rejectionReason: null,
      modificationRequest: payload.reason || payload.modificationDetails || 'Modification requested',
      actionTimestamp: now,
      actionedBy: payload.reviewerName || 'Operational Coordinator',
      decisionType: 'MODIFICATION_REQUESTED',
      isDemo: isDemoMode,
    });

    addAuditEvent({
      action: 'RECOVERY_MODIFICATION_REQUESTED',
      module: 'Recovery Simulator',
      user: payload.reviewerName || 'Operational Coordinator',
      role: payload.role || 'Crisis Response Director',
      details: `Modification requested for strategy ${strategyId}: ${payload.reason || 'No details provided'}`,
      simulationId: lastSimResult?.simulationId,
      isDemo: isDemoMode,
    });

    // Return to scenario view so user can reconfigure
    setIsApprovalModalOpen(false);
    setActiveTab('OVERVIEW');
  }, [isDemoMode, addAuditEvent, lastSimResult]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Recovery Simulator &amp; Disruption Response"
        subtitle="Stochastic shock modeling, rerouting trade-offs, and contingency authorization"
        icon={GitBranch}
        badge={
          isDemoMode ? (
            <StatusBadge variant="warning" size="xs">
              DEMO SIMULATION (SYNTHETIC)
            </StatusBadge>
          ) : (
            <StatusBadge variant="teal" size="xs">
              LIVE SIMULATION BACKEND
            </StatusBadge>
          )
        }
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              variant="secondary"
              icon={Sliders}
              onClick={() => setIsSimConfigOpen(true)}
            >
              Sim Parameters
            </Button>

            <Button
              size="sm"
              variant="secondary"
              icon={UserCheck}
              onClick={() => setIsApprovalModalOpen(true)}
              disabled={!activeStrategy}
            >
              Authorize Strategy
            </Button>

            {simState === SIM_STATE.RUNNING ? (
              <Button
                size="sm"
                variant="danger"
                icon={StopCircle}
                onClick={handleCancelSimulation}
              >
                Cancel Sim
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                icon={Play}
                onClick={() => handleRunSimulation()}
                disabled={simState === SIM_STATE.RUNNING}
              >
                {simState === SIM_STATE.NOT_STARTED ? 'Run Monte Carlo Sim' : 'Re-run Simulation'}
              </Button>
            )}
          </div>
        }
      />

      {/* 2. Visible Data Mode Informative Strip */}
      {isDemoMode ? (
        <div className="p-3 bg-status-warning-bg border border-status-warning-border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-status-warning shrink-0" />
            <div>
              <span className="font-bold text-text-primary">DEMO MODE ACTIVE:</span>
              <span className="text-text-secondary ml-1.5">
                Synthetic Monte Carlo &amp; CVaR estimates are pre-computed. No live simulation engine was invoked.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDataMode('live')}
            className="text-[11px] font-bold text-status-warning hover:underline shrink-0"
          >
            Switch to Live API Mode →
          </button>
        </div>
      ) : (
        <div className="p-3 bg-teal-light/40 border border-teal/30 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-teal shrink-0" />
            <div>
              <span className="font-bold text-navy-primary">LIVE API MODE ACTIVE:</span>
              <span className="text-text-secondary ml-1.5">
                Direct Python simulation backend integration ({API_BASE_URL}). Mock fallback is strictly disabled.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDataMode('demo')}
            className="text-[11px] font-bold text-teal hover:underline shrink-0"
          >
            Switch to Demo Mode →
          </button>
        </div>
      )}

      {/* 3. Live Service Failure / Error Banner */}
      {simError && (
        <div className="p-4 bg-status-critical-bg/40 border border-status-critical-border rounded-xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-status-critical text-white shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-status-critical">
                    {simError.title || 'Simulation Service Error'}
                  </span>
                  <StatusBadge variant="critical" size="xs">
                    CATEGORY: {simError.category || 'REQUEST_FAILED'}
                  </StatusBadge>
                  {simError.status > 0 && (
                    <span className="text-[10px] font-mono text-text-secondary">
                      HTTP {simError.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {simError.message}
                </p>
                {simError.details && (
                  <div className="mt-2 p-2 bg-white/90 rounded border border-status-critical-border/50 font-mono text-[11px] text-text-secondary max-h-24 overflow-auto">
                    {typeof simError.details === 'object'
                      ? JSON.stringify(simError.details, null, 2)
                      : String(simError.details)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <Button size="xs" variant="primary" onClick={() => handleRunSimulation()}>
                Retry Live Sim
              </Button>
              <Button size="xs" variant="secondary" onClick={() => setDataMode('demo')}>
                Switch to Demo
              </Button>
            </div>
          </div>

          {previousValidSim && (
            <div className="pt-2 border-t border-status-critical-border/40 flex items-center justify-between text-[11px] text-text-secondary">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-warning" />
                <strong>PREVIOUS SIMULATION PRESERVED:</strong> Displaying snapshot from{' '}
                {new Date(previousValidSim.timestamp).toLocaleTimeString()}. Current sim failed.
              </span>
              <StatusBadge variant="warning" size="xs">
                STALE SIMULATION
              </StatusBadge>
            </div>
          )}
        </div>
      )}

      {/* Strategy Action Outcome Banner */}
      {strategyActionState.decisionType && (
        <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
          strategyActionState.decisionType === 'APPROVED'
            ? 'bg-status-success-bg border-status-success-border'
            : strategyActionState.decisionType === 'REJECTED'
            ? 'bg-status-critical-bg/30 border-status-critical-border'
            : 'bg-status-warning-bg border-status-warning-border'
        }`}>
          <div className="flex items-center gap-2">
            {strategyActionState.decisionType === 'APPROVED' && <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />}
            {strategyActionState.decisionType === 'REJECTED' && <XCircle className="w-4 h-4 text-status-critical shrink-0" />}
            {strategyActionState.decisionType === 'MODIFICATION_REQUESTED' && <WrenchIcon className="w-4 h-4 text-status-warning shrink-0" />}
            <div>
              <span className="font-bold text-text-primary">
                {strategyActionState.decisionType === 'APPROVED' && 'Strategy Authorized'}
                {strategyActionState.decisionType === 'REJECTED' && 'Strategy Rejected'}
                {strategyActionState.decisionType === 'MODIFICATION_REQUESTED' && 'Modification Requested'}
              </span>
              <span className="text-text-secondary ml-2 font-mono">
                {strategyActionState.approvedStrategyId || strategyActionState.rejectedStrategyId || selectedStrategyId}
              </span>
              {strategyActionState.decisionType === 'APPROVED' && (
                <span className="block mt-1 text-status-warning">Decision approved · Operational action pending implementation. No operational resource transaction has been applied.</span>
              )}
              {strategyActionState.rejectionReason && (
                <span className="text-text-secondary ml-2">— {strategyActionState.rejectionReason}</span>
              )}
              {strategyActionState.modificationRequest && (
                <span className="text-text-secondary ml-2">— {strategyActionState.modificationRequest}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary">
            <span>By: {strategyActionState.actionedBy}</span>
            <span>{strategyActionState.actionTimestamp ? new Date(strategyActionState.actionTimestamp).toLocaleTimeString() : ''}</span>
            {strategyActionState.isDemo && <StatusBadge variant="warning" size="xs">DEMO</StatusBadge>}
          </div>
        </div>
      )}

      {/* Simulation History Panel (compact, last 10 runs) */}
      {simHistory.length > 0 && (
        <div className="bg-white border border-brand-border rounded-xl overflow-hidden shadow-subtle">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-brand-border bg-brand-surface">
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-text-secondary" />
              <span className="text-xs font-semibold text-text-primary">Simulation Run History</span>
            </div>
            <span className="text-[10px] font-mono text-text-secondary">{simHistory.length} run{simHistory.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-brand-border-light">
            {simHistory.map((entry) => (
              <div key={entry.simId} className="flex items-center justify-between px-4 py-2 text-[11px]">
                <div className="flex items-center gap-3">
                  <Clock className="w-3 h-3 text-text-secondary shrink-0" />
                  <span className="font-mono text-text-secondary">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <span className="font-medium text-text-primary truncate max-w-[200px]">{entry.scenarioName}</span>
                  <span className="font-mono text-text-secondary">{entry.numRuns} runs</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {entry.isDemo && <StatusBadge variant="warning" size="xs">DEMO</StatusBadge>}
                  <StatusBadge
                    variant={entry.status === 'SUCCESS' ? 'success' : entry.status === 'INFEASIBLE' ? 'warning' : 'critical'}
                    size="xs"
                  >
                    {entry.status}
                  </StatusBadge>
                  <span className="font-mono text-[10px] text-text-secondary">{entry.simId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top View Switcher (Overview & Flow vs In-Depth Advanced Analytics) */}
      <div className="flex items-center justify-between pb-1 border-b border-brand-border">
        <div className="flex items-center gap-1.5 p-1 bg-brand-bg border border-brand-border rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              activeTab === 'OVERVIEW'
                ? 'bg-white text-navy-primary font-semibold shadow-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Disruption Modeling &amp; Strategy Evaluation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'ANALYTICS'
                ? 'bg-white text-navy-primary font-semibold shadow-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>8 Advanced Analytics (Monte Carlo &amp; CVaR)</span>
          </button>
        </div>

        <div className="text-xs font-mono text-text-secondary">
          RESULT INTEGRITY:{' '}
          <strong className={isDemoMode ? 'text-status-warning' : 'text-teal'}>
            {isDemoMode ? 'SIMULATED DEMO' : 'LIVE BACKEND'}
          </strong>
        </div>
      </div>

      {/* Area 1: Baseline Selection */}
      <BaselineSelector
        selectedPlan={selectedPlan}
        onSelectPlan={setSelectedPlan}
        selectedHorizon={selectedHorizon}
        onSelectHorizon={setSelectedHorizon}
      />

      {/* Mathematical Markov State Transition Visualizer */}
      {activeStrategy ? (
        <StateTransitionDiagram
          selectedStrategyName={activeStrategy.name}
          activeScenarioName={scenarioData.name}
          expectedOutcomeScore={derivedOutcomeScore}
          recoveryTimeHours={activeStrategy.expectedRecoveryTimeHours}
        />
      ) : (
        <div className="p-4 bg-white border border-dashed border-brand-border rounded-xl text-center text-xs text-text-secondary">
          No active strategy data to visualize state transition. Run simulation or switch to Demo Mode.
        </div>
      )}

      {activeTab === 'OVERVIEW' ? (
        <div className="space-y-6">
          {/* Area 2: Disruption Scenario Builder */}
          <DisruptionScenarioBuilder
            activeScenarioKey={activeScenarioKey}
            onSelectScenarioKey={handleScenarioChange}
            scenarioData={scenarioData}
            onChangeParameter={handleParameterChange}
            onResetScenario={handleResetScenario}
          />

          {/* Area 3 & 6: Before-and-After Network Topology View */}
          <BeforeAfterNetworkView />

          {/* Area 4 & 7: Candidate Recovery Strategy Cards & Trade-Offs */}
          {resolvedStrategies && resolvedStrategies.length > 0 ? (
            <RecoveryStrategyCards
              strategies={resolvedStrategies}
              selectedStrategyId={selectedStrategyId}
              onSelectStrategy={setSelectedStrategyId}
              onProceedToAnalytics={() => setActiveTab('ANALYTICS')}
              onOpenApproval={() => setIsApprovalModalOpen(true)}
            />
          ) : (
            <div className="p-8 bg-white border border-brand-border rounded-xl text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-status-warning mx-auto" />
              <div className="font-bold text-sm text-text-primary">No Live Recovery Strategies Available</div>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                In Live API Mode, candidate recovery strategies require output from the external Python simulation engine.
                Start the backend server or switch to Demo Mode to explore demonstration strategies.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button size="sm" variant="primary" onClick={() => handleRunSimulation()}>
                  Run Live Simulation
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setDataMode('demo')}>
                  Switch to Demo Mode
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Area 8: Advanced Stochastic Analytics */
        <div className="space-y-6" ref={analyticsRef}>
          {activeAnalytics ? (
            <>
              <AdvancedRecoveryAnalytics analytics={activeAnalytics} />
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={UserCheck}
                  onClick={() => setIsApprovalModalOpen(true)}
                  disabled={!activeStrategy}
                >
                  Proceed to Strategy Authorization →
                </Button>
              </div>
            </>
          ) : (
            <div className="p-8 bg-white border border-brand-border rounded-xl text-center space-y-3">
              <BarChart3 className="w-8 h-8 text-text-secondary mx-auto" />
              <div className="font-bold text-sm text-text-primary">No Analytics Telemetry Available</div>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Monte Carlo distributions and CVaR metrics will populate once a live simulation completes.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Area 9: Simulation Configuration Modal */}
      <SimulationConfigModal
        isOpen={isSimConfigOpen}
        onClose={() => setIsSimConfigOpen(false)}
        config={{ numRuns: 500, timeHorizon: 72 }}
        onRunSimulation={handleRunSimulation}
      />

      {/* Area 5 & 11: Human Recovery Approval Workflow Modal */}
      {activeStrategy && (
        <RecoveryApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={() => setIsApprovalModalOpen(false)}
          strategy={activeStrategy}
          onApprove={handleApproveStrategy}
          onReject={handleRejectStrategy}
          onRequestModification={handleRequestModification}
        />
      )}
    </div>
  );
}
