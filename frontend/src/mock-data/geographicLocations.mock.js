/**
 * ResQNet Geographic Intelligence Sample DEMO Locations Dataset
 * Demonstrates all seven required geographic entities for humanitarian crisis command:
 * 1. Warehouses
 * 2. Distribution centres
 * 3. Food banks
 * 4. Hospitals
 * 5. Relief camps
 * 6. Beneficiary locations
 * 7. Disaster-affected zones
 *
 * All records strictly validated within WGS-84 boundaries and labeled as DEMO.
 */

import {
  GEOGRAPHIC_LOCATION_TYPE,
  LOCATION_OPERATIONAL_STATUS,
} from '../domain/geographicModel.js';

export const DEMO_GEOGRAPHIC_LOCATIONS = [
  // 1. Warehouse
  {
    id: 'GEO-WH-01',
    code: 'CSD-01',
    name: 'Central Staging Depot Alpha',
    type: GEOGRAPHIC_LOCATION_TYPE.WAREHOUSE,
    latitude: -19.832,
    longitude: 34.856,
    region: 'Beira Port Logistics Corridor',
    address: 'Port Access Sector Alpha, Gate 4',
    operationalStatus: LOCATION_OPERATIONAL_STATUS.OPERATIONAL,
    capacity: {
      max: 5000,
      occupied: 3850,
      unit: 'm³ storage',
    },
    relatedFacilityId: 'CSD-01',
    notes: 'Main regional consolidation depot with heavy vehicle loading bays and cold room.',
    isDemo: true,
  },

  // 2. Distribution Centre
  {
    id: 'GEO-DC-01',
    code: 'DC-01',
    name: 'Sector 2 Rapid Distribution Hub',
    type: GEOGRAPHIC_LOCATION_TYPE.DISTRIBUTION_CENTRE,
    latitude: -19.845,
    longitude: 34.872,
    region: 'Urban Triage Sector',
    address: 'Urban Sector 2 Community Sports Ground',
    operationalStatus: LOCATION_OPERATIONAL_STATUS.OPERATIONAL,
    capacity: {
      max: 800,
      occupied: 600,
      unit: 'm³ buffer',
    },
    relatedFacilityId: 'DC-01',
    notes: 'Forward distribution post serving displaced families in municipal sectors.',
    isDemo: true,
  },

  // 3. Food Bank
  {
    id: 'GEO-FB-01',
    code: 'NLB-02',
    name: 'North Logistics Base Regional Food Bank',
    type: GEOGRAPHIC_LOCATION_TYPE.FOOD_BANK,
    latitude: -19.745,
    longitude: 34.912,
    region: 'Highland Dry Sector',
    address: 'Highland Route km 18, Staging Compound',
    operationalStatus: LOCATION_OPERATIONAL_STATUS.CONSTRAINED,
    capacity: {
      max: 3500,
      occupied: 3100,
      unit: 'm³ grain storage',
    },
    relatedFacilityId: 'NLB-02',
    notes: 'Grain silo and high-energy biscuit stockpile. Southward road constrained at km 42.',
    isDemo: true,
  },

  // 4. Hospital
  {
    id: 'GEO-HOSP-01',
    code: 'HOSP-CHIB',
    name: 'Chibabava Field Triage Clinic & Maternity Ward',
    type: GEOGRAPHIC_LOCATION_TYPE.HOSPITAL,
    latitude: -19.715,
    longitude: 34.690,
    region: 'Chibabava Basin',
    address: 'Chibabava District Health Post Compound',
    operationalStatus: LOCATION_OPERATIONAL_STATUS.CRITICAL,
    capacity: {
      max: 120,
      occupied: 115,
      unit: 'inpatient beds',
    },
    relatedBeneficiaryGroupId: 'GRP-04',
    relatedDemandIds: ['DEM-2026-083'],
    notes: 'Acute surgical, post-flood cholera containment, and cold-chain vaccine intake.',
    isDemo: true,
  },

  // 5. Relief Camp
  {
    id: 'GEO-CAMP-01',
    code: 'CAMP-DELTA',
    name: 'Delta Estuary Evacuation Settlement Camp',
    type: GEOGRAPHIC_LOCATION_TYPE.RELIEF_CAMP,
    latitude: -19.789,
    longitude: 34.821,
    region: 'Buzi District',
    address: 'Sector 2 Flood Mound High Ground',
    operationalStatus: LOCATION_OPERATIONAL_STATUS.CRITICAL,
    capacity: {
      max: 15000,
      occupied: 14200,
      unit: 'displaced individuals',
    },
    relatedBeneficiaryGroupId: 'GRP-01',
    relatedDemandIds: ['DEM-2026-081'],
    notes: 'Accessible solely via shallow river barge. Severe waterborne epidemic alert active.',
    isDemo: true,
  },

  // 6. Beneficiary Location
  {
    id: 'GEO-BEN-01',
    code: 'CAMP-MANGA',
    name: 'Manga Camp Rapid Relocation Site',
    type: GEOGRAPHIC_LOCATION_TYPE.BENEFICIARY_LOCATION,
    latitude: -19.835,
    longitude: 34.882,
    region: 'Manga IDP Hub',
    address: 'Highway Transit Camp Sector 4',
    operationalStatus: LOCATION_OPERATIONAL_STATUS.CONSTRAINED,
    capacity: {
      max: 30000,
      occupied: 26500,
      unit: 'displaced individuals',
    },
    relatedBeneficiaryGroupId: 'GRP-02',
    relatedDemandIds: ['DEM-2026-084', 'DEM-2026-085'],
    notes: 'Rapid transit cluster; heavy truck convoy access cleared with security escort.',
    isDemo: true,
  },

  // 7. Disaster-Affected Zone
  {
    id: 'GEO-ZONE-01',
    code: 'ZONE-BUZI-FLOOD',
    name: 'Buzi Estuary Flash Inundation Zone',
    type: GEOGRAPHIC_LOCATION_TYPE.DISASTER_ZONE,
    latitude: -19.860,
    longitude: 34.780,
    radiusMeters: 4500,
    region: 'Buzi River Lower Basin',
    address: 'Low-Lying Alluvial River Delta',
    operationalStatus: LOCATION_OPERATIONAL_STATUS.AFFECTED,
    capacity: null,
    notes: 'Severe silt inundation. Overland road corridors impassable; water depth up to 1.8m.',
    isDemo: true,
  },
];

