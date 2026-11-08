/**
 * ResQNet Central Data Mode & Demo System Configuration
 * Switch between SIMULATED DEMO mock telemetry and future API integration.
 */

export const DEMO_CONFIG = {
  isDemoMode: (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_DATA_MODE) !== 'live',
  demoWatermark: 'SIMULATED DEMONSTRATION DATA',
  incidentScope: 'Brahmaputra Monsoon Floods — Assam Valley Corridors',
  simulatedTimestamp: '2026-11-05T10:30:00Z',
  defaultIncidentId: 'INC-2026-0412',
  operationalRole: 'Col. S. Vance (Logistics Ops Chief)',
};

export const isSimulatedEnvironment = () => DEMO_CONFIG.isDemoMode;
