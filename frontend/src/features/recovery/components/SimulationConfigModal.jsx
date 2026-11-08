import React, { useState } from 'react';
import {
  X,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';

/**
 * Area 9: Monte Carlo Simulation Configuration Modal
 * Configures stochastic iterations, uncertainty assumptions, and evaluation bounds.
 */
export function SimulationConfigModal({
  isOpen,
  onClose,
  config,
  onRunSimulation,
}) {
  const [numRuns, setNumRuns] = useState(config?.numRuns || 500);
  const [timeHorizon, setTimeHorizon] = useState(config?.timeHorizon || 72);
  const [transitVariancePct, setTransitVariancePct] = useState(25);
  const [demandSurgeVariancePct, setDemandSurgeVariancePct] = useState(20);
  const [evalMetric, setEvalMetric] = useState('MIN_CVAR_SHORTAGE');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onRunSimulation?.({
      numRuns,
      timeHorizon,
      transitVariancePct,
      demandSurgeVariancePct,
      evalMetric,
    });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-dark/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-lg bg-white border border-brand-border rounded-xl shadow-dropdown overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-light text-teal">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-navy-primary">
                  Monte Carlo Recovery Simulation Configuration
                </h3>
                <StatusBadge variant="teal" size="xs">STOCHASTIC</StatusBadge>
              </div>
              <p className="text-xs text-text-secondary">
                Configure uncertainty bounds and Monte Carlo sampling parameters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-brand-bg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Number of Iterations */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Number of Monte Carlo Stochastic Runs
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((runs) => (
                  <button
                    key={runs}
                    type="button"
                    onClick={() => setNumRuns(runs)}
                    className={`py-2 rounded border font-mono font-bold transition-colors ${
                      numRuns === runs
                        ? 'bg-navy-primary text-white border-navy-primary'
                        : 'bg-white text-text-secondary border-brand-border hover:bg-brand-bg'
                    }`}
                  >
                    {runs} Runs
                  </button>
                ))}
              </div>
            </div>

            {/* Time Horizon */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Simulation Time Horizon (Hours)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[24, 48, 72].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setTimeHorizon(h)}
                    className={`py-2 rounded border font-mono font-bold transition-colors ${
                      timeHorizon === h
                        ? 'bg-navy-primary text-white border-navy-primary'
                        : 'bg-white text-text-secondary border-brand-border hover:bg-brand-bg'
                    }`}
                  >
                    {h} Hours
                  </button>
                ))}
              </div>
            </div>

            {/* Uncertainty Assumptions */}
            <div className="p-3 bg-brand-bg border border-brand-border rounded-lg space-y-3">
              <span className="font-bold text-navy-primary text-[11px] uppercase tracking-wider font-mono block">
                Stochastic Uncertainty Distributions
              </span>

              <div>
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span>Transit Speed &amp; Road Clearance Variance:</span>
                  <span className="font-mono font-bold text-navy-primary">±{transitVariancePct}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  value={transitVariancePct}
                  onChange={(e) => setTransitVariancePct(parseInt(e.target.value))}
                  className="w-full accent-teal"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span>Demand Surge Volatility:</span>
                  <span className="font-mono font-bold text-navy-primary">±{demandSurgeVariancePct}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  value={demandSurgeVariancePct}
                  onChange={(e) => setDemandSurgeVariancePct(parseInt(e.target.value))}
                  className="w-full accent-teal"
                />
              </div>
            </div>

            {/* Primary Evaluation Objective */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Primary Optimization &amp; Recovery Objective
              </label>
              <select
                value={evalMetric}
                onChange={(e) => setEvalMetric(e.target.value)}
                className="w-full h-8 text-xs px-2.5 rounded border border-brand-border bg-white text-text-primary"
              >
                <option value="MIN_CVAR_SHORTAGE">Minimize Tail Shortage Risk (CVaR 95%)</option>
                <option value="MAX_HUMAN_WELFARE">Maximize Aggregate Human Welfare Score</option>
                <option value="MIN_RECOVERY_TIME">Minimize Time to Full Operational Restoration</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-brand-border bg-brand-surface">
            <span className="text-[11px] text-text-secondary font-mono">
              ENGINE: SIMPY-NUMPY-v1.8
            </span>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" type="submit" icon={Play}>
                Execute Monte Carlo Simulation
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
