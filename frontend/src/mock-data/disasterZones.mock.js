/**
 * ResQNet Disaster Zones & Geographical Risk Layers Mock Dataset
 * Stage 4.4 Implementation: Multi-hazard GeoJSON boundaries for floods, conflicts,
 * pandemics, evacuation perimeters, and restricted access corridors.
 *
 * All records strictly validated within WGS-84 boundaries and labeled as DEMO.
 */

import {
  DISASTER_TYPE,
  RISK_SEVERITY,
  ZONE_STATUS,
  DATA_CLASSIFICATION,
} from '../domain/disasterZoneModel.js';

export const DEMO_DISASTER_ZONES = [
  // 1. Flood Inundation Area — Buzi & Pungue Lower River Delta
  {
    id: 'ZONE-FL-DELTA-01',
    name: 'Buzi & Pungue Estuary Flash Inundation Zone',
    disasterType: DISASTER_TYPE.FLOOD,
    severity: RISK_SEVERITY.CRITICAL,
    status: ZONE_STATUS.ACTIVE,
    source: 'Copernicus EMS Sentinel-1 Radar Satellite (EMSR348)',
    lastUpdated: '2026-11-06T06:30:00Z',
    isDemo: true,
    dataClassification: DATA_CLASSIFICATION.DEMO,
    description: 'River surge overflow reaching 1.8m above seasonal flood baseline. Severe alluvial silt deposition.',
    notes: 'Access strictly limited to shallow-draft river barges and maritime rescue craft.',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [34.800, -19.770],
          [34.845, -19.770],
          [34.850, -19.815],
          [34.810, -19.815],
          [34.790, -19.790],
          [34.800, -19.770],
        ],
      ],
    },
  },

  // 2. Evacuation Warning Zone — Delta Estuary Low-Lying Islands
  {
    id: 'ZONE-EVAC-ESTUARY-02',
    name: 'Lower Buzi Flood Plain Evacuation Perimeter',
    disasterType: DISASTER_TYPE.EVACUATION_ZONE,
    severity: RISK_SEVERITY.HIGH,
    status: ZONE_STATUS.EXPANDING,
    source: 'National Disaster Management Directorate (INGD) Aerial Recon',
    lastUpdated: '2026-11-06T07:15:00Z',
    isDemo: true,
    dataClassification: DATA_CLASSIFICATION.DEMO,
    description: 'Mandatory evacuation order active for vulnerable low-lying alluvial mounds due to forecasted high-tide surge.',
    notes: 'Coordinated relocation towards Manga Highland IDP transit center.',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [34.730, -19.850],
          [34.790, -19.850],
          [34.795, -19.890],
          [34.735, -19.890],
          [34.730, -19.850],
        ],
      ],
    },
  },

  // 3. Restricted Access Corridor — Highway Culvert Washout Sector
  {
    id: 'ZONE-RESTRICT-KM42',
    name: 'Coastal Arterial Highway km 42 Breach Hazard Zone',
    disasterType: DISASTER_TYPE.RESTRICTED_ACCESS,
    severity: RISK_SEVERITY.HIGH,
    status: ZONE_STATUS.ACTIVE,
    source: 'Provincial Department of Public Works Emergency Engineering Log',
    lastUpdated: '2026-11-06T07:45:00Z',
    isDemo: true,
    dataClassification: DATA_CLASSIFICATION.DEMO,
    description: 'Roadbed severed by 6-meter wide washout channel. Heavy vehicles completely blocked.',
    notes: 'Engineers deploying Bailey bridge components; detours routed through Highland Pass rt-3.',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [34.880, -19.830],
          [34.950, -19.830],
          [34.960, -19.870],
          [34.890, -19.870],
          [34.880, -19.830],
        ],
      ],
    },
  },

  // 4. Pandemic / Biosecurity Zone — Chibabava Cholera Containment Ring
  {
    id: 'ZONE-PANDEMIC-SURV',
    name: 'Chibabava Waterborne Epidemic Containment Ring',
    disasterType: DISASTER_TYPE.PANDEMIC,
    severity: RISK_SEVERITY.MODERATE,
    status: ZONE_STATUS.CONTAINED,
    source: 'WHO & District Health Directorate Epidemiological Bulletin #14',
    lastUpdated: '2026-11-06T05:00:00Z',
    isDemo: true,
    dataClassification: DATA_CLASSIFICATION.DEMO,
    description: 'Heightened surveillance perimeter for cholera prevention. Vehicle chlorination wash station active.',
    notes: 'Clean water distribution prioritized; 13,000 purification tablets dispatched.',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [34.665, -19.700],
          [34.720, -19.700],
          [34.725, -19.735],
          [34.670, -19.735],
          [34.665, -19.700],
        ],
      ],
    },
  },

  // 5. Conflict Deconfliction Buffer (MultiPolygon Demonstration)
  {
    id: 'ZONE-CONF-BORDER-01',
    name: 'Security Deconfliction Buffer Enclaves Alpha & Bravo',
    disasterType: DISASTER_TYPE.CONFLICT,
    severity: RISK_SEVERITY.CRITICAL,
    status: ZONE_STATUS.MONITORED,
    source: 'UN Department of Safety & Security (UNDSS) SitRep',
    lastUpdated: '2026-11-06T06:00:00Z',
    isDemo: true,
    dataClassification: DATA_CLASSIFICATION.DEMO,
    description: 'Disputed transit perimeter with reported armed skirmishes. Demarcated dual-enclave corridor.',
    notes: 'All humanitarian relief convoys require 24h prior notification and security escort.',
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        // Enclave Alpha
        [
          [
            [34.890, -19.720],
            [34.935, -19.720],
            [34.940, -19.760],
            [34.895, -19.760],
            [34.890, -19.720],
          ],
        ],
        // Enclave Bravo
        [
          [
            [34.945, -19.720],
            [34.980, -19.720],
            [34.985, -19.760],
            [34.950, -19.760],
            [34.945, -19.720],
          ],
        ],
      ],
    },
  },

  // 6. Low-Risk Monitored Perimeter — Urban Port Access Buffer
  {
    id: 'ZONE-MONITOR-PORT-01',
    name: 'Port Access Drainage & Runoff Monitoring Zone',
    disasterType: DISASTER_TYPE.FLOOD,
    severity: RISK_SEVERITY.LOW,
    status: ZONE_STATUS.MONITORED,
    source: 'Municipal Port Authority Telemetry',
    lastUpdated: '2026-11-06T08:00:00Z',
    isDemo: true,
    dataClassification: DATA_CLASSIFICATION.DEMO,
    description: 'Canal pumps fully operational; water accumulation draining at 12,000 L/min.',
    notes: 'Depot logistics loading bays dry and accessible.',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [34.840, -19.820],
          [34.870, -19.820],
          [34.875, -19.850],
          [34.845, -19.850],
          [34.840, -19.820],
        ],
      ],
    },
  },
];

