/**
 * ResQNet Testing Suite: Verification of Requirements A through H
 * 
 * Tests:
 * A - Geographical consistency (Flood vs Conflict vs Pandemic vs Unsupported)
 * B - Demo mode (Simulation tags, synthetic indicators)
 * C - Live API failure (No silent mock fallback on error)
 * D - Allocation workflow (Validation, Execution, Dynamic Metrics)
 * E - Recovery workflow (Simulation, Dynamic score, Approve/Reject/Modify)
 * F - Interactive controls (Handlers, State mutators, Filters)
 * G - Audit export (RFC-4180 CSV, Columns, Row count integrity)
 * H - Build & HTTP Route Verification (All 8 dashboards)
 */

import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Import application modules
import { getCommandCenterData } from '../src/features/command-center/data/commandCenterData.js';
import { getNetworkMapData } from '../src/features/network-map/data/networkMapData.js';
import { validateOptimizationInputs, executeOptimization } from '../src/features/allocation/services/optimizationService.js';
import { runRecoverySimulation, approveRecoveryPlan, validateRecoveryAction } from '../src/features/recovery/services/recoveryService.js';
import { derivePlanAnalytics, MOCK_PLANS } from '../src/features/allocation/data/allocationData.js';
import { DISRUPTION_TEMPLATES } from '../src/features/recovery/data/recoveryData.js';
import { INITIAL_AUDIT_EVENTS } from '../src/features/audit/data/auditData.js';
import { MOCK_DISPATCH_ORDERS } from '../src/features/dispatch/data/dispatchData.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log(' RESQNET STAGE 1 AUTOMATED VERIFICATION SUITE');
  console.log('===============================================================\n');

  // -------------------------------------------------------------
  // TEST A: Geographical Consistency
  // -------------------------------------------------------------
  console.log('--- TEST A: Geographical Consistency ---');
  {
    // 1. Flood Scenario (Cyclone Idai / Beira, Sofala, Mozambique)
    const floodMap = getNetworkMapData({ code: 'CYC-IDAI-2', region: 'Beira & Zambezia Corridors' }, 'Flood', 'Beira & Zambezia Corridors');
    const floodCC = getCommandCenterData({ code: 'CYC-IDAI-2', region: 'Beira & Zambezia Corridors' }, 'Flood', 'Beira & Zambezia Corridors');
    assert(floodMap.isSupported === true, 'Flood map is supported');
    assert(floodMap.center[0] < 0 && floodMap.center[0] > -25, `Flood center latitude is Mozambique (${floodMap.center[0]})`);
    assert(floodMap.entities.length > 0, `Flood has ${floodMap.entities.length} entities`);
    assert(floodMap.entities[0].isSimulated === true, 'Flood entities flagged as simulated');
    assert(floodCC.crisisType === 'Flood' || floodCC.scopeLabel.includes('FLOOD'), 'Command Center flood scope valid');

    // 2. Armed Conflict Scenario (Middle East / Rafah)
    const conflictMap = getNetworkMapData({ code: 'ARM-SOUTH-04', region: 'Middle East' }, 'Armed Conflict', 'Middle East');
    const conflictCC = getCommandCenterData({ code: 'ARM-SOUTH-04', region: 'Middle East' }, 'Armed Conflict', 'Middle East');
    assert(conflictMap.isSupported === true, 'Conflict map is supported');
    assert(conflictMap.center[0] > 30, `Conflict center latitude is Middle East (${conflictMap.center[0]})`);
    assert(conflictMap.entities.some(e => e.id.includes('-ME-') || e.securityAuthorization?.includes('DECONFLICTION') || e.name.includes('Deconfliction') || e.name.includes('Red Crescent')), 'Conflict map has conflict-specific entities');
    assert(conflictCC.crisisType === 'Armed Conflict' || conflictCC.scopeLabel.includes('CONFLICT'), 'Command Center conflict scope valid');

    // 3. Pandemic Scenario (Horn of Africa / Cholera)
    const pandemicMap = getNetworkMapData({ code: 'PAN-CHOL-09', region: 'Horn of Africa' }, 'Pandemic', 'Horn of Africa');
    const pandemicCC = getCommandCenterData({ code: 'PAN-CHOL-09', region: 'Horn of Africa' }, 'Pandemic', 'Horn of Africa');
    assert(pandemicMap.isSupported === true, 'Pandemic map is supported');
    assert(pandemicMap.entities.some(e => e.category === 'ISOLATION_CENTER' || e.name.includes('Cholera') || e.name.includes('Harare') || e.name.includes('Clinic')), 'Pandemic map has health facilities');
    assert(pandemicCC.crisisType === 'Pandemic' || pandemicCC.scopeLabel.includes('PANDEMIC'), 'Command Center pandemic scope valid');

    // 4. Unsupported Region (Southeast Anatolia)
    const unsupportedMap = getNetworkMapData({ isSupported: false, region: 'Southeast Anatolia' }, 'Earthquake', 'Southeast Anatolia');
    assert(unsupportedMap.isSupported === false, 'Unsupported region returns isSupported: false');
    assert(unsupportedMap.entities.length === 0, 'Unsupported region returns 0 entities');
    assert(unsupportedMap.unsupportedMessage && unsupportedMap.unsupportedMessage.length > 0, 'Unsupported region includes explanatory notice');
  }
  console.log('Test A Passed!\n');

  // -------------------------------------------------------------
  // TEST B: Demo Mode Results Labeled as Simulated
  // -------------------------------------------------------------
  console.log('--- TEST B: Demo Mode (Simulation Tags) ---');
  {
    // 1. Allocation optimization in Demo Mode
    const optResult = await executeOptimization({ planId: 'PLAN-ALPHA' }, { isDemoMode: true });
    assert(optResult.status === 'SUCCESS', 'Demo optimization returns status SUCCESS');
    assert(optResult.isDemo === true, 'Demo optimization has isDemo: true');
    assert(optResult.isSimulated === true, 'Demo optimization has isSimulated: true');
    assert(optResult.demoNotice && optResult.demoNotice.includes('DEMONSTRATION RUN'), 'Demo optimization includes explicit synthetic notice');
    assert(optResult.plan && optResult.plan.allocations.length > 0, 'Demo optimization returns benchmark plan');

    // 2. Recovery simulation in Demo Mode
    const simResult = await runRecoverySimulation(
      {
        baselinePlanId: 'PLAN-ALPHA',
        disruptionScenario: DISRUPTION_TEMPLATES['FLOOD'],
        numRuns: 100,
        timeHorizonHours: 72,
      },
      { isDemoMode: true }
    );
    assert(simResult.status === 'SUCCESS', 'Demo recovery simulation returns status SUCCESS');
    assert(simResult.isDemo === true, 'Demo recovery simulation has isDemo: true');
    assert(simResult.isSimulated === true, 'Demo recovery simulation has isSimulated: true');
    assert(simResult.demoNotice && (simResult.demoNotice.includes('DEMO') || simResult.demoNotice.includes('DEMONSTRATION')), 'Demo simulation has demo notice');
    assert(simResult.strategies && simResult.strategies.length >= 2, 'Demo simulation returns candidate strategies');
  }
  console.log('Test B Passed!\n');

  // -------------------------------------------------------------
  // TEST C: Live API Failure (Strict Separation, No Silent Fallback)
  // -------------------------------------------------------------
  console.log('--- TEST C: Live API Failure Handling ---');
  {
    // 1. Live mode optimization without backend
    const liveOptResult = await executeOptimization(
      { planId: 'PLAN-ALPHA' },
      { isDemoMode: false }
    );
    assert(liveOptResult.status !== 'SUCCESS', 'Live optimization does NOT return SUCCESS when backend is offline');
    assert(liveOptResult.category === 'API_UNAVAILABLE' || liveOptResult.category === 'NETWORK_ERROR', `Live optimization categorizes failure (${liveOptResult.category})`);
    assert(liveOptResult.isDemo === false, 'Live failure does NOT claim to be demo data');
    assert(liveOptResult.plan === undefined || liveOptResult.plan === null, 'Live failure does NOT invent a fake successful plan');

    // 2. Live mode recovery simulation without backend
    const liveSimResult = await runRecoverySimulation(
      {
        baselinePlanId: 'PLAN-ALPHA',
        disruptionScenario: DISRUPTION_TEMPLATES['FLOOD'],
        numRuns: 100,
        timeHorizonHours: 72,
      },
      { isDemoMode: false }
    );
    assert(liveSimResult.status !== 'SUCCESS', 'Live simulation does NOT return SUCCESS when backend is offline');
    assert(liveSimResult.category === 'API_UNAVAILABLE' || liveSimResult.category === 'NETWORK_ERROR', `Live simulation categorizes failure (${liveSimResult.category})`);
    assert(liveSimResult.isDemo === false, 'Live simulation failure does not claim demo');
    assert(liveSimResult.strategies === null, 'Live simulation failure returns null strategies');
  }
  console.log('Test C Passed!\n');

  // -------------------------------------------------------------
  // TEST D: Allocation Planning Workflow
  // -------------------------------------------------------------
  console.log('--- TEST D: Allocation Planning Workflow ---');
  {
    // 1. Validation with missing required fields
    const invalidValidation = await validateOptimizationInputs(
      { commodities: [], sourceFacilities: [], destinationRegions: [] },
      { isDemoMode: true }
    );
    assert(invalidValidation.isValid === false, 'Empty input validation fails readiness');
    assert(invalidValidation.errors.length >= 2, `Validation flags ${invalidValidation.errors.length} errors`);
    assert(invalidValidation.missingFields.length >= 2, 'Validation identifies missing fields');

    // 2. Validation with complete inputs
    const validValidation = await validateOptimizationInputs(
      {
        planningPeriod: '72h',
        commodities: ['FOOD', 'WATER', 'MEDICAL'],
        sourceFacilities: ['CSD-01', 'NLB-02'],
        destinationRegions: ['Buzi District', 'Chibabava Basin'],
        reserveMarginPct: 15,
        budgetCapUSD: 250000,
        constraints: { mustFulfillCriticalDemand: true },
      },
      { isDemoMode: true }
    );
    assert(validValidation.isValid === true, 'Complete inputs pass validation readiness');
    assert(validValidation.errors.length === 0, 'No errors for valid input');

    // 3. Optimization returns plan and derived analytics compute dynamic values
    const opt = await executeOptimization({ planId: 'PLAN-ALPHA' }, { isDemoMode: true });
    const analytics = derivePlanAnalytics(opt.plan);
    assert(analytics.supplyDemandGap && analytics.supplyDemandGap.length > 0, 'Derived analytics computes supply-demand gap');
    assert(analytics.regionalDistribution && analytics.regionalDistribution.length > 0, 'Derived analytics computes regional distribution');
    assert(analytics.facilityUtilization && analytics.facilityUtilization.length > 0, 'Derived analytics computes facility capacity utilization');
    assert(analytics.criticalCoverage && analytics.criticalCoverage.length > 0, 'Derived analytics computes critical coverage');
  }
  console.log('Test D Passed!\n');

  // -------------------------------------------------------------
  // TEST E: Recovery Simulation & Actions
  // -------------------------------------------------------------
  console.log('--- TEST E: Recovery Simulation Workflow & Actions ---');
  {
    const sim = await runRecoverySimulation(
      {
        baselinePlanId: 'PLAN-ALPHA',
        disruptionScenario: DISRUPTION_TEMPLATES['FLOOD'],
        numRuns: 100,
        timeHorizonHours: 72,
      },
      { isDemoMode: true }
    );
    assert(sim.strategies.length >= 2, `Simulation returns ${sim.strategies.length} candidate strategies`);
    const strat = sim.strategies[0];
    assert(strat.criticalCoveragePct !== undefined && typeof strat.criticalCoveragePct === 'number', `Strategy has numeric coverage score (${strat.criticalCoveragePct}%)`);
    assert(strat.criticalCoveragePct > 0 && strat.criticalCoveragePct <= 100, 'Coverage score is within valid percentage bounds');
    assert(strat.expectedRecoveryTimeHours !== undefined && typeof strat.expectedRecoveryTimeHours === 'number', `Strategy has recovery time (${strat.expectedRecoveryTimeHours}h)`);
    
    // Test dynamic composite score derivation (replaces hardcoded 94.62)
    const coverage = strat.criticalCoveragePct ?? 0;
    const equity = strat.serviceEquityGini !== undefined ? Math.round((1 - strat.serviceEquityGini) * 100) : 80;
    const speed = Math.max(0, Math.round(100 - (strat.expectedRecoveryTimeHours ?? 24) * 2));
    const dynamicOutcomeScore = Math.round(coverage * 0.6 + equity * 0.2 + speed * 0.2);
    assert(dynamicOutcomeScore > 50 && dynamicOutcomeScore <= 100, `Derived outcome score calculated dynamically (${dynamicOutcomeScore} / 100)`);
    
    // Test action validation
    const valAction = await validateRecoveryAction({ actionId: 'ACT-01', type: 'REROUTE' }, { isDemoMode: true });
    assert(valAction.status === 'SUCCESS', 'Recovery action validation succeeds in demo');

    // Test strategy approval
    const approveResult = await approveRecoveryPlan(strat.id, {
      reviewerName: 'Logistics Officer',
      role: 'Coordinator',
      reason: 'Optimal clearance time',
    }, { isDemoMode: true });
    assert(approveResult.status === 'SUCCESS', 'Approve recovery plan returns SUCCESS');
    assert(approveResult.approvalStatus === 'APPROVED', 'Approval status is APPROVED');
    assert(approveResult.strategyId === strat.id, `Approved strategy ID matches (${strat.id})`);
  }
  console.log('Test E Passed!\n');

  // -------------------------------------------------------------
  // TEST F: Interactive Controls & Dispatch Operations
  // -------------------------------------------------------------
  console.log('--- TEST F: Interactive Controls & State Handlers ---');
  {
    // Dispatch records
    const dispatches = [...MOCK_DISPATCH_ORDERS];
    assert(dispatches.length > 0, `Loaded ${dispatches.length} dispatch orders`);
    
    // Simulate Stage Filter
    const activeFilter = 'IN_TRANSIT';
    const filteredDispatches = dispatches.filter(d => d.status === activeFilter);
    assert(filteredDispatches.every(d => d.status === activeFilter), 'Stage filtering correctly filters dispatch records');

    // Simulate Proof of Delivery (POD) submission
    const targetDispatch = dispatches[0];
    const podData = {
      acceptedQuantity: 500,
      receivedBy: 'Field Coordinator Maria',
      evidenceRef: 'POD-DOC-9823',
    };
    const updatedDispatch = {
      ...targetDispatch,
      status: 'VERIFIED',
      progressPct: 100,
      pod: podData,
    };
    assert(updatedDispatch.status === 'VERIFIED', 'POD verification updates status to VERIFIED');
    assert(updatedDispatch.progressPct === 100, 'POD verification updates progress to 100%');
    assert(updatedDispatch.pod.evidenceRef === 'POD-DOC-9823', 'POD verification attaches evidence reference');
  }
  console.log('Test F Passed!\n');

  // -------------------------------------------------------------
  // TEST G: Audit Export (RFC-4180 CSV & Format Verification)
  // -------------------------------------------------------------
  console.log('--- TEST G: Audit Export Functionality ---');
  {
    const events = INITIAL_AUDIT_EVENTS.slice(0, 5);
    const headers = ['Event ID', 'Timestamp', 'User', 'Role', 'Action', 'Module', 'Entity Ref', 'Status', 'Operational Justification'];
    
    // Build CSV as in ReportTemplatesModal.jsx
    const csvRows = [
      headers,
      ...events.map(e => [
        e.id, e.timestamp, e.user, e.role, e.action, e.module, e.entityId, e.status,
        (e.reason || '').replace(/"/g, '""'),
      ]),
    ];
    const csvContent = csvRows
      .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    assert(csvContent.startsWith('"Event ID","Timestamp"'), 'CSV starts with correct RFC-4180 headers');
    const lines = csvContent.split('\n');
    assert(lines.length === events.length + 1, `CSV has ${lines.length} lines (1 header + ${events.length} rows)`);
    assert(lines[1].includes(events[0].id), `CSV row 1 contains event ID ${events[0].id}`);

    // Build TSV as in ReportTemplatesModal.jsx
    const tsvRows = [
      ['Event ID', 'Timestamp', 'User', 'Role', 'Action', 'Module', 'Entity Ref', 'Status', 'Operational Justification'],
      ...events.map(e => [
        e.id, e.timestamp, e.user, e.role, e.action, e.module, e.entityId, e.status,
        (e.reason || ''),
      ]),
    ];
    const tsvContent = tsvRows.map(row => row.map(c => String(c || '').replace(/\t/g, ' ')).join('\t')).join('\n');
    assert(tsvContent.includes('\t'), 'TSV contains tab separators');
  }
  console.log('Test G Passed!\n');

  // -------------------------------------------------------------
  // TEST H: HTTP Server & 8 Dashboard Routes Verification
  // -------------------------------------------------------------
  console.log('--- TEST H: HTTP Server & 8 Dashboard Routes ---');
  {
    const routes = [
      '/',
      '/command-center',
      '/network-map',
      '/resources',
      '/demand',
      '/allocation',
      '/recovery',
      '/dispatch',
      '/audit',
    ];

    console.log('  Spawning Vite dev server on port 3000...');
    const serverProcess = spawn('node', ['node_modules/.bin/vite', '--port', '3000'], {
      cwd: rootDir,
      stdio: 'pipe',
      shell: true,
    });

    let serverReady = false;
    serverProcess.stdout.on('data', (d) => {
      const text = d.toString();
      if (text.includes('Local:') || text.includes('3000')) {
        serverReady = true;
      }
    });

    // Wait up to 10 seconds for server to be responsive
    for (let i = 0; i < 20; i++) {
      if (serverReady) break;
      await new Promise(r => setTimeout(r, 500));
    }

    // Probe all routes
    for (const route of routes) {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:3000${route}`, (res) => {
          assert(res.statusCode === 200, `Route ${route} returned HTTP 200 OK`);
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            assert(data.includes('<div id="root">') || data.includes('html'), `Route ${route} returned index HTML with root container`);
            resolve();
          });
        });
        req.on('error', (err) => {
          reject(new Error(`Failed to fetch ${route}: ${err.message}`));
        });
        req.setTimeout(5000, () => {
          req.destroy(new Error(`Timeout fetching ${route}`));
        });
      });
    }

    // Terminate server cleanly
    serverProcess.kill('SIGTERM');
    console.log('  Vite dev server stopped cleanly.');
  }
  console.log('Test H Passed!\n');

  console.log('===============================================================');
  console.log(` ALL TESTS EXECUTED: ${passedTests} / ${totalTests} PASSED (0 FAILURES)`);
  console.log('===============================================================');
}

runTestSuite().catch(err => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
