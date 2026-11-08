import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  Scale,
  Clock,
  Truck,
  Building,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Tooltip } from '../../../components/ui/Tooltip.jsx';

/**
 * Visual Constraint & Multi-Objective Policy Configuration Panel
 * Configures hard physical bounds, soft operational preferences,
 * FEFO weighting, equity thresholds, and minimum service levels.
 */
export function ConstraintConfigPanel({
  constraints = {},
  onChangeConstraint,
  onResetDefaults,
  onProceedToExecution,
}) {
  const {
    // 1. Supply & Demand Bounds
    enforceHardSupplyCap = true,
    mustFulfillCriticalDemand = true,
    allowPartialFulfillment = true,

    // 2. Transport & Route Restrictions
    enforceVehicleWeightLimits = true,
    avoidRestrictedRoutes = true,
    allowAirLiftOverride = true,

    // 3. Commodity Compatibility & Safety
    isolateHazardousCommodities = true,
    strictlyEnforceWaterPotabilityQC = true,

    // 4. Shelf-Life & FEFO Policy
    fefoWeightingPct = 95, // 0 to 100%

    // 5. Equity & Human Welfare Standards
    minimumEquityCoveragePct = 40, // Min coverage per cluster
    equityGiniMaxThreshold = 0.25, // Target Gini <= 0.25
    sphereMinimumWaterLpd = 15, // Liters per person per day
    sphereMinimumFoodKcal = 2100, // kcal per person per day
  } = constraints;

  return (
    <div className="space-y-4">
      <Card
        title="Mathematical Constraints & Humanitarian Policy Bounds"
        subtitle="Configure physical reality bounds (hard constraints) and operational value trade-offs (soft weights)"
        badge={<StatusBadge variant="teal" size="xs">STAGE 03</StatusBadge>}
        action={
          <button
            type="button"
            onClick={onResetDefaults}
            className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to UN Defaults
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Card 1: Supply & Demand Bounds */}
          <div className="p-3.5 rounded-lg border border-brand-border bg-brand-surface space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-brand-border-light">
              <span className="font-bold text-navy-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal" />
                1. Supply &amp; Demand Bounds
              </span>
              <StatusBadge variant="navy" size="xs">HARD BOUNDS</StatusBadge>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enforceHardSupplyCap}
                  onChange={(e) => onChangeConstraint?.('enforceHardSupplyCap', e.target.checked)}
                  className="mt-0.5 accent-teal rounded"
                />
                <div>
                  <span className="font-semibold text-text-primary block">Hard Physical Stock Bounds</span>
                  <span className="text-[11px] text-text-secondary">Solver cannot allocate more than verified usable stock.</span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mustFulfillCriticalDemand}
                  onChange={(e) => onChangeConstraint?.('mustFulfillCriticalDemand', e.target.checked)}
                  className="mt-0.5 accent-teal rounded"
                />
                <div>
                  <span className="font-semibold text-text-primary block">Must-Fulfill Critical Priority</span>
                  <span className="text-[11px] text-text-secondary">100% penalty on unmet life-threat (&lt;24h) demand.</span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowPartialFulfillment}
                  onChange={(e) => onChangeConstraint?.('allowPartialFulfillment', e.target.checked)}
                  className="mt-0.5 accent-teal rounded"
                />
                <div>
                  <span className="font-semibold text-text-primary block">Allow Fractional Tranche Fulfillments</span>
                  <span className="text-[11px] text-text-secondary">Permits partial delivery when full consignment is constrained.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Card 2: Transport & Corridors */}
          <div className="p-3.5 rounded-lg border border-brand-border bg-brand-surface space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-brand-border-light">
              <span className="font-bold text-navy-primary flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-teal" />
                2. Transport &amp; Corridors
              </span>
              <StatusBadge variant="navy" size="xs">PHYSICAL BOUNDS</StatusBadge>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enforceVehicleWeightLimits}
                  onChange={(e) => onChangeConstraint?.('enforceVehicleWeightLimits', e.target.checked)}
                  className="mt-0.5 accent-teal rounded"
                />
                <div>
                  <span className="font-semibold text-text-primary block">Vehicle Gross Tonnage Caps</span>
                  <span className="text-[11px] text-text-secondary">Enforce 10-ton truck and 85-ton shallow barge limits.</span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={avoidRestrictedRoutes}
                  onChange={(e) => onChangeConstraint?.('avoidRestrictedRoutes', e.target.checked)}
                  className="mt-0.5 accent-teal rounded"
                />
                <div>
                  <span className="font-semibold text-text-primary block">Prohibit Blocked / Washed Out Roads</span>
                  <span className="text-[11px] text-text-secondary">Reroutes traffic around verified culvert breaches (km 42).</span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowAirLiftOverride}
                  onChange={(e) => onChangeConstraint?.('allowAirLiftOverride', e.target.checked)}
                  className="mt-0.5 accent-teal rounded"
                />
                <div>
                  <span className="font-semibold text-text-primary block">Permit Emergency Air-Drop Sling</span>
                  <span className="text-[11px] text-text-secondary">Authorizes high-cost helicopter winch for cut-off islands.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Card 3: Commodity Compatibility & Safety */}
          <div className="p-3.5 rounded-lg border border-brand-border bg-brand-surface space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-brand-border-light">
              <span className="font-bold text-navy-primary flex items-center gap-1.5">
                <Building className="w-4 h-4 text-teal" />
                3. Quality &amp; Cross-Contamination
              </span>
              <StatusBadge variant="critical" size="xs">SAFETY POLICY</StatusBadge>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isolateHazardousCommodities}
                  onChange={(e) => onChangeConstraint?.('isolateHazardousCommodities', e.target.checked)}
                  className="mt-0.5 accent-teal rounded"
                />
                <div>
                  <span className="font-semibold text-text-primary block">Commodity Segregation Rules</span>
                  <span className="text-[11px] text-text-secondary">Strictly prohibits co-loading chemicals or fuel with food items.</span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={strictlyEnforceWaterPotabilityQC}
                  onChange={(e) => onChangeConstraint?.('strictlyEnforceWaterPotabilityQC', e.target.checked)}
                  className="mt-0.5 accent-teal rounded"
                />
                <div>
                  <span className="font-semibold text-text-primary block">Water Potability QC Lock</span>
                  <span className="text-[11px] text-text-secondary">Blocks unverified raw water from direct distribution without lab pass.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Card 4: Shelf-Life & FEFO Policy Weighting */}
          <div className="p-3.5 rounded-lg border border-brand-border bg-white space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-brand-border-light">
              <span className="font-bold text-navy-primary flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal" />
                4. FEFO Shelf-Life Priority Weight
              </span>
              <StatusBadge variant="teal" size="xs">{fefoWeightingPct}% WEIGHT</StatusBadge>
            </div>

            <p className="text-[11px] text-text-secondary">
              First-Expiry, First-Out weighting in solver cost function to minimize humanitarian warehouse spoilage.
            </p>

            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-xs font-bold text-navy-primary">
                <span>Cost Penalty on Shelf-Life Loss:</span>
                <span>{fefoWeightingPct}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                value={fefoWeightingPct}
                onChange={(e) => onChangeConstraint?.('fefoWeightingPct', parseInt(e.target.value))}
                className="w-full accent-teal"
              />
              <div className="flex justify-between text-[10px] text-text-secondary">
                <span>Standard Rotation (50%)</span>
                <span>Strict FEFO Mandate (100%)</span>
              </div>
            </div>
          </div>

          {/* Card 5: Regional Equity & Gini Index */}
          <div className="p-3.5 rounded-lg border border-brand-border bg-white space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-brand-border-light">
              <span className="font-bold text-navy-primary flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-teal" />
                5. Regional Equity &amp; Fair-Share
              </span>
              <StatusBadge variant="teal" size="xs">SPHERE ETHICS</StatusBadge>
            </div>

            <p className="text-[11px] text-text-secondary">
              Prevents the solver from starving remote, difficult-to-access communities in favor of nearby urban camps.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-text-primary">Min Sector Coverage:</span>
                <span className="font-mono font-bold text-navy-primary">&ge; {minimumEquityCoveragePct}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={70}
                value={minimumEquityCoveragePct}
                onChange={(e) => onChangeConstraint?.('minimumEquityCoveragePct', parseInt(e.target.value))}
                className="w-full accent-teal"
              />

              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-brand-border-light">
                <span className="text-text-primary">Gini Coefficient Ceiling:</span>
                <span className="font-mono font-bold text-teal">&le; {equityGiniMaxThreshold} (Fair)</span>
              </div>
            </div>
          </div>

          {/* Card 6: Sphere Minimum Service Standards */}
          <div className="p-3.5 rounded-lg border border-brand-border bg-white space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-brand-border-light">
              <span className="font-bold text-navy-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal" />
                6. Sphere Minimum Standards
              </span>
              <StatusBadge variant="neutral" size="xs">CONFIGURABLE</StatusBadge>
            </div>

            <p className="text-[11px] text-text-secondary">
              Calibrated emergency survival minimums for human nutrition and sanitation.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-brand-bg border border-brand-border">
                <span className="text-[10px] text-text-secondary block">Food Ration</span>
                <span className="font-bold font-mono text-navy-primary">{sphereMinimumFoodKcal} kcal</span>
                <span className="text-[10px] text-text-secondary block">per person / day</span>
              </div>
              <div className="p-2 rounded bg-brand-bg border border-brand-border">
                <span className="text-[10px] text-text-secondary block">Safe Water</span>
                <span className="font-bold font-mono text-teal">{sphereMinimumWaterLpd} Liters</span>
                <span className="text-[10px] text-text-secondary block">per person / day</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-4 pt-3 border-t border-brand-border flex items-center justify-between">
          <div className="text-xs text-text-secondary font-mono">
            All configured policy thresholds are validated against the HiGHS MILP constraint matrix.
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={onProceedToExecution}
          >
            Review Network Flow &amp; Solve →
          </Button>
        </div>
      </Card>
    </div>
  );
}
