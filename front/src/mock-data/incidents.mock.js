import { INCIDENT_SEVERITY } from '../types/constants.js';

export const CRISIS_TYPES = [
  { id: 'Flood', label: 'Flood / Cyclone' },
  { id: 'Armed Conflict', label: 'Armed Conflict' },
  { id: 'Pandemic', label: 'Pandemic / Health Outbreak' },
];

export const REGIONS = [
  { id: 'Beira & Zambezia Corridors', label: 'Beira & Zambezia Corridors', isSupported: true, crisisType: 'Flood' },
  { id: 'Middle East / South Corridor', label: 'Middle East / South Corridor', isSupported: true, crisisType: 'Armed Conflict' },
  { id: 'Horn of Africa / Lake Basin', label: 'Horn of Africa / Lake Basin', isSupported: true, crisisType: 'Pandemic' },
  { id: 'Southeast Anatolia', label: 'Southeast Anatolia (Data Unavailable)', isSupported: false },
];

export const MOCK_INCIDENTS = [
  {
    id: 'INC-2026-0412',
    code: 'CYC-IDAI-2',
    name: 'Cyclone Idai II — Coastal & Valley Response',
    region: 'Beira & Zambezia Corridors',
    crisisType: 'Flood',
    severity: INCIDENT_SEVERITY.LEVEL_3_EMERGENCY,
    type: 'Tropical Cyclone (Cat 4)',
    declaredAt: '2026-11-04T02:00:00Z',
    isSimulated: true,
    isSupported: true,
    center: [-19.825, 34.860],
    zoom: 11,
    activeDispatchesCount: 4,
    criticalPocketsCount: 2,
  },
  {
    id: 'INC-2026-0518',
    code: 'ARM-SOUTH-04',
    name: 'Armed Conflict Displaced Population Convoy',
    region: 'Middle East / South Corridor',
    crisisType: 'Armed Conflict',
    severity: INCIDENT_SEVERITY.LEVEL_4_CATASTROPHIC,
    type: 'Complex Humanitarian Emergency',
    declaredAt: '2026-11-01T08:00:00Z',
    isSimulated: true,
    isSupported: true,
    center: [31.350, 34.310],
    zoom: 11,
    activeDispatchesCount: 7,
    criticalPocketsCount: 5,
  },
  {
    id: 'INC-2026-0622',
    code: 'PAN-CHOL-09',
    name: 'Cholera & Waterborne Epidemic Triage',
    region: 'Horn of Africa / Lake Basin',
    crisisType: 'Pandemic',
    severity: INCIDENT_SEVERITY.LEVEL_3_EMERGENCY,
    type: 'Epidemic Outbreak',
    declaredAt: '2026-10-28T14:30:00Z',
    isSimulated: true,
    isSupported: true,
    center: [-0.200, 34.700],
    zoom: 11,
    activeDispatchesCount: 3,
    criticalPocketsCount: 3,
  },
];
