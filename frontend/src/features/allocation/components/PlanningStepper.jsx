import React from 'react';
import {
  Check,
  Target,
  FileCheck2,
  Sliders,
  Cpu,
  BarChart3,
  UserCheck,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Scope', title: 'Planning Scope', icon: Target },
  { id: 2, label: 'Readiness', title: 'Input Readiness', icon: FileCheck2 },
  { id: 3, label: 'Constraints', title: 'Constraints & Priorities', icon: Sliders },
  { id: 4, label: 'Execution', title: 'Optimization Execution', icon: Cpu },
  { id: 5, label: 'Results', title: 'Results & Analytics', icon: BarChart3 },
  { id: 6, label: 'Approval', title: 'Human Review & Approval', icon: UserCheck },
];

/**
 * Compact Enterprise Planning Workflow Stepper
 * Guides crisis coordinators through the 6-stage mathematical optimization lifecycle.
 */
export function PlanningStepper({ activeStep = 1, onStepClick, completedSteps = [] }) {
  return (
    <div className="bg-white border border-brand-border rounded-xl p-2.5 shadow-subtle">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {STEPS.map((step) => {
          const isActive = activeStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick?.(step.id)}
              className={`
                flex items-center gap-2 p-2 rounded-lg text-left transition-all select-none
                ${isActive
                  ? 'bg-navy-primary text-white shadow-sm ring-1 ring-navy-primary'
                  : isCompleted
                  ? 'bg-brand-bg text-text-primary hover:bg-steel-light/70 border border-brand-border/60'
                  : 'bg-white text-text-secondary hover:bg-brand-bg/60 border border-dashed border-brand-border'
                }
              `}
            >
              <div className={`
                w-6 h-6 rounded-md shrink-0 flex items-center justify-center font-mono text-[11px] font-bold
                ${isActive
                  ? 'bg-teal text-white'
                  : isCompleted
                  ? 'bg-status-success-bg text-status-success'
                  : 'bg-steel-light text-text-secondary'
                }
              `}>
                {isCompleted && !isActive ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : step.id}
              </div>

              <div className="min-w-0 flex-1">
                <div className={`text-[10px] font-mono leading-none ${isActive ? 'text-teal-light' : 'text-text-secondary'}`}>
                  Stage 0{step.id}
                </div>
                <div className={`text-xs font-semibold truncate mt-0.5 ${isActive ? 'text-white' : 'text-text-primary'}`}>
                  {step.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
