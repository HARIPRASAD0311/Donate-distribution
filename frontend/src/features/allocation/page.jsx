import React, { useState, useRef, useEffect } from 'react';
import {
  Scale,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Cpu,
  Layers,
  Sparkles,
  FileCheck2,
  ShieldAlert,
  Server,
  StopCircle,
  PlusCircle,
  BookmarkCheck,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAppStore } from '../../store/useAppStore.js';
import { API_BASE_URL } from '../../services/apiClient.js';

import {
  MOCK_PLANS,
  MOCK_PLAN_HISTORY,
  SUPPLY_CHAIN_NETWORK,
  ALLOCATION_ANALYTICS,
  derivePlanAnalytics,
} from './data/allocationData.js';

import {
  validateOptimizationInputs,
  executeOptimization,
  approvePlan,
  rejectPlan,
} from './services/optimizationService.js';

import { PlanningStepper } from './components/PlanningStepper.jsx';
import { AllocationKpis } from './components/AllocationKpis.jsx';
import { ScopeAndInputReadiness } from './components/ScopeAndInputReadiness.jsx';
import { ConstraintConfigPanel } from './components/ConstraintConfigPanel.jsx';
import { SupplyChainFlowDiagram } from './components/SupplyChainFlowDiagram.jsx';
import { SolverControlPanel } from './components/SolverControlPanel.jsx';
import { AllocationVisualizations } from './components/AllocationVisualizations.jsx';
import { AllocationTableAndExplanation } from './components/AllocationTableAndExplanation.jsx';
import { HumanApprovalModal } from './components/HumanApprovalModal.jsx';

/**
 * ResQNet Allocation Planning & Optimization Interface
 * Fully connected, multi-stage planning workflow with input validation,
 * request cancellation, and actual result-driven telemetry rendering.
 */
export default function AllocationPage() {
  const selectedIncident = useAppStore(state => state.selectedIncident);
  const isDemoMode = useAppStore(state => state.isDemoMode);
  const dataMode = useAppStore(state => state.dataMode);
  const setDataMode = useAppStore(state => state.setDataMode);
  const upsertAllocationPlan = useAppStore(state => state.upsertAllocationPlan);
  const approveOperationalAllocation = useAppStore(state => state.approveOperationalAllocation);
  const cancelAllocation = useAppStore(state => state.cancelAllocation);

  // Part A: Workflow Initialization
  // A new plan MUST begin at Stage 1 with NO stages prematurely marked complete.
  const [activeStage, setActiveStage] = useState(1);
  const [completedStages, setCompletedStages] = useState([]);
  const [isPlanResumed, setIsPlanResumed] = useState(false);

  // Active Plan State (strictly driven by optimization response or explicit resume)
  const [activePlan, setActivePlan] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('PLAN-ALPHA');
  const [selectedAllocation, setSelectedAllocation] = useState(null);

  // Pre-flight Validation State
  const [validationReport, setValidationReport] = useState(null);

  // Solving and Execution State
  const [isSolving, setIsSolving] = useState(false);
  const [solveError, setSolveError] = useState(null);
  const [cancellationNotice, setCancellationNotice] = useState(null);
  const [previousValidPlan, setPreviousValidPlan] = useState(null);

  const abortControllerRef = useRef(null);

  // Modal State
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  // Supply chain flow diagram — selected node for cross-panel awareness
  const [selectedFlowNode, setSelectedFlowNode] = useState(null);

  // Scope Configuration State
  const [scopeConfig, setScopeConfig] = useState({
    incident: selectedIncident?.name || 'Cyclone Idai II (INC-2026-0412)',
    planningPeriod: '72h',
    commodities: ['FOOD', 'WATER', 'MEDICAL'],
    sourceFacilities: ['CSD-01', 'NLB-02', 'SRD-03'],
    destinationRegions: ['Buzi District', 'Manga IDP Hub', 'Chibabava Basin', 'Nhamatanda Corridor'],
    transportModes: ['Secured Convoy', 'Shallow Barge Flotilla', 'Air Cargo Shuttle'],
    reserveMarginPct: 15,
    budgetCapUSD: 250000,
  });

  // Constraints Configuration State
  const [constraints, setConstraints] = useState({
    enforceHardSupplyCap: true,
    mustFulfillCriticalDemand: true,
    allowPartialFulfillment: true,
    enforceVehicleWeightLimits: true,
    avoidRestrictedRoutes: true,
    allowAirLiftOverride: true,
    isolateHazardousCommodities: true,
    strictlyEnforceWaterPotabilityQC: true,
    fefoWeightingPct: 95,
    minimumEquityCoveragePct: 40,
    equityGiniMaxThreshold: 0.25,
    sphereMinimumWaterLpd: 15,
    sphereMinimumFoodKcal: 2100,
  });

  // Keep incident synchronized
  useEffect(() => {
    if (selectedIncident?.name) {
      setScopeConfig((prev) => ({ ...prev, incident: selectedIncident.name }));
    }
  }, [selectedIncident]);

  const handleScopeChange = (field, val) => {
    setScopeConfig((prev) => ({ ...prev, [field]: val }));
    // Invalidate stale validation report on modification
    setValidationReport(null);
  };

  const handleConstraintChange = (field, val) => {
    setConstraints((prev) => ({ ...prev, [field]: val }));
  };

  const handleResetConstraints = () => {
    setConstraints({
      enforceHardSupplyCap: true,
      mustFulfillCriticalDemand: true,
      allowPartialFulfillment: true,
      enforceVehicleWeightLimits: true,
      avoidRestrictedRoutes: true,
      allowAirLiftOverride: true,
      isolateHazardousCommodities: true,
      strictlyEnforceWaterPotabilityQC: true,
      fefoWeightingPct: 95,
      minimumEquityCoveragePct: 40,
      equityGiniMaxThreshold: 0.25,
      sphereMinimumWaterLpd: 15,
      sphereMinimumFoodKcal: 2100,
    });
  };

  // 1. Reset / Start a New Allocation Plan
  const handleStartNewPlan = () => {
    setActiveStage(1);
    setCompletedStages([]);
    setIsPlanResumed(false);
    setActivePlan(null);
    setSelectedAllocation(null);
    setValidationReport(null);
    setSolveError(null);
    setCancellationNotice(null);
  };

  // 2. Explicitly Resume a Saved Benchmark Plan
  const handleResumeSavedPlan = (planId = 'PLAN-ALPHA') => {
    const plan = MOCK_PLANS[planId] || MOCK_PLANS['PLAN-ALPHA'];
    setSelectedPlanId(planId);
    setActivePlan(plan);
    setSelectedAllocation(plan.allocations?.[0] || null);
    setIsPlanResumed(true);
    setCompletedStages([1, 2, 3, 4]);
    setActiveStage(5);
    setSolveError(null);
    setCancellationNotice(null);
  };

  // 3. Workflow Progression: Stage 1 -> Stage 2
  const handleProceedToValidation = async () => {
    const report = await validateOptimizationInputs(
      { ...scopeConfig, constraints },
      { isDemoMode }
    );
    setValidationReport(report);
    if (!completedStages.includes(1)) {
      setCompletedStages((prev) => [...prev, 1]);
    }
    setActiveStage(2);
  };

  // 4. Workflow Progression: Stage 2 -> Stage 3
  const handleProceedToConstraints = () => {
    if (validationReport && !validationReport.isValid) return;
    if (!completedStages.includes(2)) {
      setCompletedStages((prev) => [...prev, 2]);
    }
    setActiveStage(3);
  };

  // 5. Workflow Progression: Stage 3 -> Stage 4
  const handleProceedToExecution = () => {
    if (!completedStages.includes(3)) {
      setCompletedStages((prev) => [...prev, 3]);
    }
    setActiveStage(4);
  };

  // 6. Optimization Execution with Pre-Flight Validation & Cancellation
  const handleRunOptimization = async () => {
    // Step B: Input validation before running optimization
    const validation = await validateOptimizationInputs(
      { ...scopeConfig, constraints },
      { isDemoMode }
    );
    setValidationReport(validation);

    if (!validation.isValid) {
      setSolveError({
        category: 'VALIDATION_ERROR',
        title: 'Input Validation Failed',
        message: `Cannot execute optimization. Required planning inputs are missing or invalid: ${validation.errors.join('; ')}`,
        details: validation.errors,
      });
      setActiveStage(2); // Direct user to Stage 2 to review validation failures
      return;
    }

    // Step C: Loading state & Request setup
    setIsSolving(true);
    setSolveError(null);
    setCancellationNotice(null);

    // Step E: Actual Request Cancellation with AbortController
    const ctrl = new AbortController();
    abortControllerRef.current = ctrl;

    try {
      const result = await executeOptimization(
        {
          planId: selectedPlanId,
          scope: scopeConfig,
          constraints,
        },
        { isDemoMode, signal: ctrl.signal }
      );

      setIsSolving(false);
      abortControllerRef.current = null;

      // Handle Cancellation response
      if (result.category === 'CANCELLED') {
        setCancellationNotice('Solver execution was cancelled by the operator.');
        return;
      }

      // Handle Errors (API_UNAVAILABLE, INFEASIBLE, VALIDATION_ERROR, REQUEST_FAILED)
      if (result.category !== 'SUCCESS') {
        setSolveError(
          result.error || {
            category: result.category,
            title: 'Optimization Request Failed',
            message: 'The optimization solver did not return a successful feasible outcome.',
            status: result.status,
          }
        );
        return;
      }

      // Validate response structure
      const returnedPlan = result.plan;
      if (!returnedPlan) {
        setSolveError({
          category: 'REQUEST_FAILED',
          title: 'Empty Solver Response',
          message: 'The solver service returned SUCCESS but no allocation plan was provided in the payload.',
        });
        return;
      }

      // Step D: Results rendering driven strictly by returned response
      setActivePlan(returnedPlan);
      upsertAllocationPlan(returnedPlan, 'SOLVED');
      setSelectedAllocation(returnedPlan.allocations?.[0] || null);
      setPreviousValidPlan({
        plan: returnedPlan,
        timestamp: result.timestamp || new Date().toISOString(),
        isDemo: result.isDemo,
      });

      // Advance workflow to Stage 5 (Results)
      setCompletedStages((prev) => Array.from(new Set([...prev, 1, 2, 3, 4, 5])));
      setActiveStage(5);
    } catch (err) {
      setIsSolving(false);
      abortControllerRef.current = null;

      if (err.name === 'AbortError' || err.code === 'CANCELLED') {
        setCancellationNotice('Solver execution was cancelled by the operator.');
      } else {
        setSolveError({
          category: 'REQUEST_FAILED',
          title: 'Unexpected Execution Error',
          message: err.message,
        });
      }
    }
  };

  // Step E: Cancellation trigger
  const handleCancelOptimization = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsSolving(false);
    setCancellationNotice('Cancelling solver execution...');
  };

  // Derive dynamic analytics directly from actual activePlan allocations
  const planAnalytics = derivePlanAnalytics(activePlan) || ALLOCATION_ANALYTICS;

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Lifecycle Controls */}
      <PageHeader
        title="Allocation Planning & Optimization"
        subtitle="Mathematical optimization, multi-echelon flow, and human sign-off"
        icon={Scale}
        badge={
          isDemoMode ? (
            <StatusBadge variant="warning" size="xs">
              DEMO SOLVER (SYNTHETIC)
            </StatusBadge>
          ) : (
            <StatusBadge variant="teal" size="xs">
              LIVE MILP BACKEND
            </StatusBadge>
          )
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={PlusCircle}
              onClick={handleStartNewPlan}
            >
              New Plan
            </Button>

            {!isPlanResumed && !activePlan && (
              <Button
                size="sm"
                variant="secondary"
                icon={BookmarkCheck}
                onClick={() => handleResumeSavedPlan('PLAN-ALPHA')}
                title="Resume pre-computed benchmark plan"
              >
                Resume Saved Plan
              </Button>
            )}

            <Button
              size="sm"
              variant="secondary"
              icon={UserCheck}
              onClick={() => setIsApprovalModalOpen(true)}
              disabled={!activePlan}
            >
              Human Signoff
            </Button>

            {isSolving ? (
              <Button
                size="sm"
                variant="danger"
                icon={StopCircle}
                onClick={handleCancelOptimization}
              >
                Cancel Solver
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                icon={Play}
                onClick={handleRunOptimization}
              >
                Run Optimization
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
                Using pre-computed synthetic demonstration benchmark results. No external Python solver was invoked.
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
                Strict backend verification enabled ({API_BASE_URL}). Mock fallback is strictly disabled.
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

      {/* 3. Cancellation Notice */}
      {cancellationNotice && (
        <div className="p-3 bg-brand-bg border border-brand-border rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-text-secondary">
            <StopCircle className="w-4 h-4 text-status-warning shrink-0" />
            <span>{cancellationNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setCancellationNotice(null)}
            className="text-text-secondary hover:text-text-primary font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. Live Service Failure / Validation Error Banner */}
      {solveError && (
        <div className="p-4 bg-status-critical-bg/40 border border-status-critical-border rounded-xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-status-critical text-white shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-status-critical">
                    {solveError.title || 'Optimization Error'}
                  </span>
                  <StatusBadge variant="critical" size="xs">
                    CATEGORY: {solveError.category || 'REQUEST_FAILED'}
                  </StatusBadge>
                  {solveError.status > 0 && (
                    <span className="text-[10px] font-mono text-text-secondary">
                      HTTP {solveError.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {solveError.message}
                </p>
                {solveError.details && (
                  <div className="mt-2 p-2 bg-white/90 rounded border border-status-critical-border/50 font-mono text-[11px] text-text-secondary max-h-24 overflow-auto">
                    {Array.isArray(solveError.details)
                      ? solveError.details.join('\n')
                      : typeof solveError.details === 'object'
                      ? JSON.stringify(solveError.details, null, 2)
                      : String(solveError.details)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <Button size="xs" variant="primary" onClick={handleRunOptimization}>
                Retry Live Solve
              </Button>
              <Button size="xs" variant="secondary" onClick={() => setDataMode('demo')}>
                Switch to Demo
              </Button>
            </div>
          </div>

          {previousValidPlan && (
            <div className="pt-2 border-t border-status-critical-border/40 flex items-center justify-between text-[11px] text-text-secondary">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-warning" />
                <strong>PREVIOUS RESULT PRESERVED:</strong> Displaying snapshot from{' '}
                {new Date(previousValidPlan.timestamp).toLocaleTimeString()}. Current solve failed.
              </span>
              <StatusBadge variant="warning" size="xs">
                STALE SNAPSHOT
              </StatusBadge>
            </div>
          )}
        </div>
      )}

      {/* 5. Compact 6-Stage Planning Stepper */}
      <PlanningStepper
        activeStep={activeStage}
        onStepClick={(step) => setActiveStage(step)}
        completedSteps={completedStages}
      />

      {/* 6. Six Enterprise KPI Metrics Cards */}
      {activePlan ? (
        <div className="relative">
          {activePlan.isStale && (
            <div className="mb-2 p-1.5 bg-status-warning-bg border border-status-warning-border rounded-lg text-center text-xs font-semibold text-status-warning flex items-center justify-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                PREVIOUS PLAN SNAPSHOT ({new Date(previousValidPlan?.timestamp).toLocaleTimeString()}) — Preserved following live solver failure.
              </span>
            </div>
          )}
          <AllocationKpis plan={activePlan} />
        </div>
      ) : (
        <div className="p-4 bg-white border border-dashed border-brand-border rounded-xl text-center space-y-1">
          <div className="font-bold text-xs text-text-primary">No Active Allocation Plan Generated</div>
          <p className="text-[11px] text-text-secondary max-w-md mx-auto">
            {activeStage < 4
              ? 'Complete planning scope, input readiness audit, and policy constraints before executing solver.'
              : 'Execute the solver in Stage 4 to compute optimal allocation flows.'}
          </p>
        </div>
      )}

      {/* 7. Active Workflow Stage View */}
      {/* Stage 1: Planning Scope Configuration */}
      {activeStage === 1 && (
        <ScopeAndInputReadiness
          scopeConfig={scopeConfig}
          onChangeScope={handleScopeChange}
          validationReport={validationReport}
          onValidate={async () => {
            const report = await validateOptimizationInputs(
              { ...scopeConfig, constraints },
              { isDemoMode }
            );
            setValidationReport(report);
          }}
          onProceedToConstraints={handleProceedToValidation}
          activeStage={1}
        />
      )}

      {/* Stage 2: Direct Input Readiness Audit & Validation */}
      {activeStage === 2 && (
        <ScopeAndInputReadiness
          scopeConfig={scopeConfig}
          onChangeScope={handleScopeChange}
          validationReport={validationReport}
          onValidate={async () => {
            const report = await validateOptimizationInputs(
              { ...scopeConfig, constraints },
              { isDemoMode }
            );
            setValidationReport(report);
          }}
          onProceedToConstraints={handleProceedToConstraints}
          activeStage={2}
        />
      )}

      {/* Stage 3: Constraints & Policy Bounds */}
      {activeStage === 3 && (
        <ConstraintConfigPanel
          constraints={constraints}
          onChangeConstraint={handleConstraintChange}
          onResetDefaults={handleResetConstraints}
          onProceedToExecution={handleProceedToExecution}
        />
      )}

      {/* Stage 4: Multi-Echelon Network Flow & Solver Execution */}
      {activeStage === 4 && (
        <div className="space-y-6">
          <SupplyChainFlowDiagram
            network={SUPPLY_CHAIN_NETWORK}
            onSelectNode={(node) => setSelectedFlowNode(node)}
          />

          <SolverControlPanel
            selectedPlanId={selectedPlanId}
            onSelectPlan={(id) => {
              setSelectedPlanId(id);
              if (isDemoMode && MOCK_PLANS[id]) {
                const p = MOCK_PLANS[id];
                setActivePlan(p);
                if (p?.allocations?.[0]) setSelectedAllocation(p.allocations[0]);
              }
            }}
            isSolving={isSolving}
            onRunOptimization={handleRunOptimization}
            onCancelOptimization={handleCancelOptimization}
            onValidateInputs={() => setActiveStage(2)}
            onProceedToResults={() => {
              setActiveStage(5);
              if (!completedStages.includes(4)) {
                setCompletedStages((prev) => [...prev, 4]);
              }
            }}
            hasResults={!!activePlan}
            activePlan={activePlan}
            isDemoMode={isDemoMode}
          />
        </div>
      )}

      {/* Stage 5: Results & Analytics (Driven by Actual Service Response) */}
      {activeStage === 5 && (
        <div className="space-y-6">
          {activePlan ? (
            <>
              <AllocationVisualizations analytics={planAnalytics} />

              <AllocationTableAndExplanation
                allocations={activePlan.allocations || []}
                selectedAllocation={selectedAllocation}
                onSelectAllocation={(alc) => setSelectedAllocation(alc)}
              />

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={UserCheck}
                  onClick={() => setIsApprovalModalOpen(true)}
                >
                  Proceed to Human Review &amp; Approval →
                </Button>
              </div>
            </>
          ) : (
            <div className="p-8 bg-white border border-brand-border rounded-xl text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-status-warning mx-auto" />
              <h3 className="text-base font-bold text-text-primary">
                No Solver Results Available
              </h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                No active optimization plan has been computed yet. Execute the solver from Stage 4 or resume a saved plan.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button size="sm" variant="primary" onClick={() => setActiveStage(4)}>
                  Go to Stage 04: Execution
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleResumeSavedPlan('PLAN-ALPHA')}>
                  Resume Saved Benchmark
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stage 6: Human Review & Approval Dossier Section */}
      {activeStage === 6 && (
        <div className="p-6 bg-white border border-brand-border rounded-xl text-center space-y-3">
          <UserCheck className="w-12 h-12 text-teal mx-auto" />
          <h3 className="text-base font-bold text-navy-primary">Stage 06: Human Oversight &amp; Governance</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Operational commanders retain constitutional decision authority before dispatch generation.
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsApprovalModalOpen(true)}
            disabled={!activePlan}
          >
            Open Approval Dossier &amp; Signoff
          </Button>
        </div>
      )}

      {/* Human Approval Modal */}
      {activePlan && (
        <HumanApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={() => setIsApprovalModalOpen(false)}
          plan={activePlan}
          history={MOCK_PLAN_HISTORY}
          onApprove={(planId, reviewPayload) => {
            const result = approveOperationalAllocation(activePlan, reviewPayload?.reviewerName || 'SIMULATED_OPERATOR');
            if (!result.ok) { setSolveError(result.error); return; }
            if (!completedStages.includes(6)) setCompletedStages((prev) => [...prev, 6]);
          }}
          onReject={(planId, reviewPayload) => {
            const rejection = rejectPlan(planId, reviewPayload, { isDemoMode });
            if (rejection && typeof rejection.then === 'function') rejection.then(result => { if (result?.success !== false) cancelAllocation(planId, reviewPayload?.reason || 'Allocation rejected'); });
            else if (rejection?.success !== false) cancelAllocation(planId, reviewPayload?.reason || 'Allocation rejected');
          }}
          onRequestModification={() => {
            setActiveStage(3);
          }}
        />
      )}
    </div>
  );
}
