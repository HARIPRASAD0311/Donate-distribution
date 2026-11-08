import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  RefreshCw,
  Download,
  AlertTriangle,
  Compass,
  CheckCircle,
  Clock,
  Sparkles,
  Package,
  Droplets,
  HeartPulse,
  ShieldAlert,
  Archive,
  Truck,
  CheckCircle2,
  AlertOctagon,
  Users,
  MapPin,
  Utensils,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SectionHeader } from '../../components/ui/SectionHeader.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { useQuery } from '@tanstack/react-query';
import { fetchLiveCommandCenter } from '../../services/commandCenterService.js';

import { getCommandCenterData } from './data/commandCenterData.js';
import { lotBalances } from '../../domain/operationalLedger.js';
import { CommandCenterKpis } from './components/CommandCenterKpis.jsx';
import { CrisisMap } from './components/CrisisMap.jsx';
import { OperationalPanels } from './components/OperationalPanels.jsx';
import { CommandCenterCharts } from './components/CommandCenterCharts.jsx';
import { PriorityDemandTable } from './components/PriorityDemandTable.jsx';
import { LocationDetailDrawer } from './components/LocationDetailDrawer.jsx';

export default function CommandCenterPage() {
  const {
    selectedIncident,
    selectedCrisisType,
    selectedRegion,
    reportingPeriod,
    lastDataFreshness,
    openDrawer,
    addAuditEvent,
  } = useAppStore();

  const [activeKpiFilter, setActiveKpiFilter] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [pendingDecisionModal, setPendingDecisionModal] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Active chart filter chips (commodity / zone cross-filter)
  const [activeCommodityFilter, setActiveCommodityFilter] = useState(null);
  const [activeZoneFilter, setActiveZoneFilter] = useState(null);
  // Decision authorization confirmation toast
  const [authorizedDecision, setAuthorizedDecision] = useState(null);
  const inventoryLots = useAppStore(state => state.inventoryLots);
  const demandRecords = useAppStore(state => state.demandRecords);
  const allocationLines = useAppStore(state => state.allocationLines);
  const stockReservations = useAppStore(state => state.stockReservations);
  const dispatchOrders = useAppStore(state => state.dispatchOrders);
  const deliveryRecords = useAppStore(state => state.deliveryRecords);
  const getGeographicAlerts = useAppStore(state => state.getGeographicAlerts);
  const dismissedGeographicAlertIds = useAppStore(state => state.dismissedGeographicAlertIds);
  const disasterZones = useAppStore(state => state.disasterZones);
  const geographicLocations = useAppStore(state => state.geographicLocations);
  const isDemoMode = useAppStore(state => state.isDemoMode);
  const incidentId = selectedIncident?.id;

  const { data: liveCommandCenter, refetch: refetchLive } = useQuery({
    queryKey: ['command-center', incidentId],
    queryFn: () => fetchLiveCommandCenter(incidentId),
    enabled: !isDemoMode,
    staleTime: 30000,
  });

  // Stage 4.5 Geographic Hazard Telemetry
  const geoAlerts = useMemo(() => {
    try {
      return typeof getGeographicAlerts === 'function' ? getGeographicAlerts() : [];
    } catch {
      return [];
    }
  }, [getGeographicAlerts, dismissedGeographicAlertIds, disasterZones, geographicLocations]);

  const exposedFacilitiesCount = useMemo(() => {
    return geoAlerts.filter((a) => a.category === 'FACILITY_IN_DISASTER_ZONE').length;
  }, [geoAlerts]);

  const blockedCorridorsCount = useMemo(() => {
    return geoAlerts.filter((a) => a.category === 'BLOCKED_ROUTE').length;
  }, [geoAlerts]);

  // Commodity matching helper to map each operational ledger entry to one of the 5 standard metrics
  const matchCommodity = (item) => {
    const comm = String(item.commodityId || item.commodity || '').toUpperCase();
    const unit = String(item.unit || item.unitOfMeasure || '').toLowerCase();
    const name = String(item.name || item.itemName || '').toLowerCase();

    if (comm === 'FOOD') return 'food';
    if (comm === 'WATER') {
      if (unit.includes('tablet') || name.includes('tablet')) return 'water-tablets';
      return 'water';
    }
    if (comm === 'MEDICAL') {
      if (unit.includes('vial') || name.includes('vial')) return 'medical-vials';
      return 'medical-kits';
    }
    return 'other';
  };

  const kpiSections = useMemo(() => {
    if (!isDemoMode && liveCommandCenter?.sections?.length > 0) {
      return liveCommandCenter.sections;
    }
    const scenario = getCommandCenterData(selectedIncident, selectedCrisisType, selectedRegion);

    // 1. Available Usable Inventory (from inventoryLots & lotBalances)
    const invTotals = { food: 0, water: 0, 'water-tablets': 0, 'medical-kits': 0, 'medical-vials': 0 };
    for (const lot of inventoryLots) {
      const key = matchCommodity(lot);
      if (invTotals[key] !== undefined) {
        invTotals[key] += lotBalances(lot).available;
      }
    }

    // 2. Active Stock Reservations (from inventoryLots & stockReservations)
    const resTotals = { food: 0, water: 0, 'water-tablets': 0, 'medical-kits': 0, 'medical-vials': 0, total: 0 };
    for (const lot of inventoryLots) {
      const key = matchCommodity(lot);
      const lotRes = (lot.reservations || [])
        .filter(r => r.status === 'ACTIVE')
        .reduce((sum, r) => sum + Number(r.quantity || 0), 0);
      if (resTotals[key] !== undefined) {
        resTotals[key] += lotRes;
      }
      resTotals.total += lotRes;
    }
    const activeResCount = (stockReservations || []).filter(r => r.status === 'ACTIVE').length ||
      inventoryLots.reduce((acc, l) => acc + (l.reservations || []).filter(r => r.status === 'ACTIVE').length, 0);

    // 3. In-Transit Stock (from dispatchOrders)
    const transitOrders = dispatchOrders.filter(d =>
      ['IN_TRANSIT', 'PARTIALLY_VERIFIED', 'ARRIVED_AWAITING_POD'].includes(d.status)
    );
    let transitTotalQty = 0;
    for (const order of transitOrders) {
      transitTotalQty += Number(order.inTransitQuantity || order.quantity || 0);
    }

    // 4. Verified Fulfilment (from demandRecords verified)
    const fulTotals = { food: 0, water: 0, 'water-tablets': 0, 'medical-kits': 0, 'medical-vials': 0 };
    for (const d of demandRecords.filter(item => item.verificationStatus === 'VERIFIED')) {
      const key = matchCommodity(d);
      if (fulTotals[key] !== undefined) {
        fulTotals[key] += Number(d.fulfilledQuantity || 0);
      }
    }

    // 5. Remaining Verified Demand (from demandRecords verified)
    const remTotals = { food: 0, water: 0, 'water-tablets': 0, 'medical-kits': 0, 'medical-vials': 0 };
    for (const d of demandRecords.filter(item => item.verificationStatus === 'VERIFIED')) {
      const key = matchCommodity(d);
      if (remTotals[key] !== undefined) {
        const rem = Math.max(0, Number(d.quantity || 0) - Number(d.fulfilledQuantity || 0));
        remTotals[key] += rem;
      }
    }

    const pendingOrders = transitOrders.filter(
      d => (d.inTransitQuantity || 0) > 0 || d.status === 'ARRIVED_AWAITING_POD'
    );

    const affectedPop = scenario.kpis.find(k => k.id === 'kpi-affected-pop');
    const affectedLocs = scenario.kpis.find(k => k.id === 'kpi-affected-locations');
    const inaccLocs = scenario.kpis.find(k => k.id === 'kpi-inaccessible-locations');

    return [
      {
        id: 'sec-inventory',
        code: 'A',
        title: 'Inventory Availability',
        subtitle: 'Live stockpile certified usable across warehouses and forward bases',
        cards: [
          {
            id: 'kpi-inv-food',
            title: 'Food',
            value: new Intl.NumberFormat().format(invTotals.food),
            unit: 'Packets',
            status: 'teal',
            icon: Utensils,
            subtext: 'High-energy rations & flour',
            tooltip: 'Live available stockpile of emergency food rations after active reservations.',
          },
          {
            id: 'kpi-inv-water',
            title: 'Water',
            value: new Intl.NumberFormat().format(invTotals.water),
            unit: 'Containers',
            status: 'teal',
            icon: Droplets,
            subtext: '10L bladders & containers',
            tooltip: 'Certified potable drinking water bladders ready for distribution.',
          },
          {
            id: 'kpi-inv-water-tablets',
            title: 'Water Tablets',
            value: new Intl.NumberFormat().format(invTotals['water-tablets']),
            unit: 'Tablets',
            status: 'teal',
            icon: Sparkles,
            subtext: 'Aquatabs 67mg purification',
            tooltip: 'Chlorine purification tablets staged for point-of-use disinfection.',
          },
          {
            id: 'kpi-inv-medical-kits',
            title: 'Medical Kits',
            value: new Intl.NumberFormat().format(invTotals['medical-kits']),
            unit: 'Kits',
            status: 'teal',
            icon: HeartPulse,
            subtext: 'Cholera & trauma modules',
            tooltip: 'Field hospital medical and cholera response modules ready for deployment.',
          },
          {
            id: 'kpi-inv-medical-vials',
            title: 'Medical Vials',
            value: new Intl.NumberFormat().format(invTotals['medical-vials']),
            unit: 'Vials',
            status: 'teal',
            icon: ShieldAlert,
            subtext: 'Cold-chain verified vaccines',
            tooltip: 'Oral cholera and critical vaccine doses stored in temperature-monitored cold chain.',
          },
        ],
      },
      {
        id: 'sec-movement',
        code: 'B',
        title: 'Resource Movement & Reservations',
        subtitle: 'Live quantities held by active allocation commitments and dispatches in transit',
        cards: [
          {
            id: 'ops-reserved',
            title: 'Reserved Stock',
            value: new Intl.NumberFormat().format(resTotals.total),
            unit: `${activeResCount} active hold${activeResCount === 1 ? '' : 's'}`,
            status: 'warning',
            icon: Archive,
            trend: {
              value: `${activeResCount} active hold${activeResCount === 1 ? '' : 's'}`,
              isPositive: true,
              direction: 'neutral',
            },
            subtext: 'Committed to active allocations',
            tooltip: 'Total humanitarian stock earmarked and locked for approved allocation plans.',
          },
          {
            id: 'ops-transit',
            title: 'In-Transit Stock',
            value: new Intl.NumberFormat().format(transitTotalQty),
            unit: `${transitOrders.length} active order${transitOrders.length === 1 ? '' : 's'}`,
            status: 'warning',
            icon: Truck,
            trend: {
              value: transitOrders.length > 0 ? 'En route' : 'No movements',
              isPositive: true,
              direction: 'neutral',
            },
            subtext: `${transitOrders.length} dispatch convoys en route`,
            tooltip: 'Relief shipments currently departed from staging bases en route to distribution points.',
          },
        ],
      },
      {
        id: 'sec-fulfilment',
        code: 'C',
        title: 'Verified Fulfilment',
        subtitle: 'Confirmed quantities delivered with completed and verified Proof of Delivery',
        cards: [
          {
            id: 'kpi-ful-food',
            title: 'Food',
            value: new Intl.NumberFormat().format(fulTotals.food),
            unit: 'Packets',
            status: 'teal',
            icon: Utensils,
            subtext: 'Accepted at distribution points',
            tooltip: 'Verified food quantities formally received and accepted by authorized receivers.',
          },
          {
            id: 'kpi-ful-water',
            title: 'Water',
            value: new Intl.NumberFormat().format(fulTotals.water),
            unit: 'Containers',
            status: 'teal',
            icon: Droplets,
            subtext: 'Accepted at distribution points',
            tooltip: 'Verified drinking water bladders accepted and distributed to beneficiary clusters.',
          },
          {
            id: 'kpi-ful-water-tablets',
            title: 'Water Tablets',
            value: new Intl.NumberFormat().format(fulTotals['water-tablets']),
            unit: 'Tablets',
            status: fulTotals['water-tablets'] > 0 ? 'teal' : 'neutral',
            icon: Sparkles,
            subtext: fulTotals['water-tablets'] > 0 ? 'Delivered & verified' : 'No deliveries recorded',
            tooltip: 'Verified purification tablets accepted at distribution sites.',
          },
          {
            id: 'kpi-ful-medical-kits',
            title: 'Medical Kits',
            value: new Intl.NumberFormat().format(fulTotals['medical-kits']),
            unit: 'Kits',
            status: 'teal',
            icon: HeartPulse,
            subtext: 'Accepted at field clinics',
            tooltip: 'Emergency treatment kits formally accepted by clinical intake teams.',
          },
          {
            id: 'kpi-ful-medical-vials',
            title: 'Medical Vials',
            value: new Intl.NumberFormat().format(fulTotals['medical-vials']),
            unit: 'Vials',
            status: fulTotals['medical-vials'] > 0 ? 'teal' : 'neutral',
            icon: ShieldAlert,
            subtext: fulTotals['medical-vials'] > 0 ? 'Delivered & verified' : 'No deliveries recorded',
            tooltip: 'Cold-chain vaccine vials verified and accepted at vaccination centers.',
          },
        ],
      },
      {
        id: 'sec-remaining',
        code: 'D',
        title: 'Remaining Verified Demand',
        subtitle: 'Outstanding community requirements after deducting accepted verified fulfilment',
        cards: [
          {
            id: 'kpi-rem-food',
            title: 'Food',
            value: new Intl.NumberFormat().format(remTotals.food),
            unit: 'Packets',
            status: remTotals.food > 0 ? 'critical' : 'neutral',
            icon: Utensils,
            subtext: remTotals.food > 0 ? 'Urgent unmet deficit' : 'Demand fully met',
            tooltip: 'Remaining verified demand for food rations awaiting dispatch and receipt.',
          },
          {
            id: 'kpi-rem-water',
            title: 'Water',
            value: new Intl.NumberFormat().format(remTotals.water),
            unit: 'Containers',
            status: remTotals.water > 0 ? 'critical' : 'neutral',
            icon: Droplets,
            subtext: remTotals.water > 0 ? 'Urgent unmet deficit' : 'Demand fully met',
            tooltip: 'Remaining verified demand for clean water containers in flood sectors.',
          },
          {
            id: 'kpi-rem-water-tablets',
            title: 'Water Tablets',
            value: new Intl.NumberFormat().format(remTotals['water-tablets']),
            unit: 'Tablets',
            status: remTotals['water-tablets'] > 0 ? 'critical' : 'neutral',
            icon: Sparkles,
            subtext: remTotals['water-tablets'] > 0 ? 'Urgent unmet deficit' : 'No unmet demand logged',
            tooltip: 'Remaining verified demand for water purification tablets.',
          },
          {
            id: 'kpi-rem-medical-kits',
            title: 'Medical Kits',
            value: new Intl.NumberFormat().format(remTotals['medical-kits']),
            unit: 'Kits',
            status: remTotals['medical-kits'] > 0 ? 'critical' : 'neutral',
            icon: HeartPulse,
            subtext: remTotals['medical-kits'] > 0 ? 'Priority clinic shortage' : 'Demand fully met',
            tooltip: 'Remaining verified demand for cholera and trauma medical kits.',
          },
          {
            id: 'kpi-rem-medical-vials',
            title: 'Medical Vials',
            value: new Intl.NumberFormat().format(remTotals['medical-vials']),
            unit: 'Vials',
            status: remTotals['medical-vials'] > 0 ? 'critical' : 'neutral',
            icon: ShieldAlert,
            subtext: remTotals['medical-vials'] > 0 ? 'Vaccine deficit' : 'No unmet demand logged',
            tooltip: 'Remaining verified demand for vaccine doses in containment corridors.',
          },
        ],
      },
      {
        id: 'sec-performance',
        code: 'E',
        title: 'Operational Impact & Performance',
        subtitle: 'Logistics operations tempo and disaster zone situational awareness',
        cards: [
          {
            id: 'ops-dispatches',
            title: 'Active Dispatch Orders',
            value: String(transitOrders.length),
            unit: 'Orders',
            status: 'teal',
            icon: Truck,
            subtext: `${transitOrders.length} convoy movements`,
            tooltip: 'Active dispatch orders currently executing across transport corridors.',
          },
          {
            id: 'ops-pending-pod',
            title: 'Pending Delivery Verification',
            value: String(pendingOrders.length),
            unit: 'Orders',
            status: 'warning',
            icon: Clock,
            subtext: 'Awaiting verified receipt',
            tooltip: 'Dispatches physically arrived or in-transit awaiting signed proof of delivery.',
          },
          {
            id: 'kpi-affected-pop',
            title: 'Affected Population',
            value: affectedPop?.value || '248,500',
            unit: affectedPop?.unit || 'People',
            status: affectedPop?.status || 'critical',
            icon: Users,
            trend: affectedPop?.trend,
            subtext: '+12.4% vs initial census',
            tooltip: affectedPop?.tooltip || 'Estimated individuals affected by estuary surge and river flooding.',
          },
          {
            id: 'kpi-affected-locations',
            title: 'Affected Locations',
            value: affectedLocs?.value || '14',
            unit: affectedLocs?.unit || 'Sectors',
            status: affectedLocs?.status || 'warning',
            icon: MapPin,
            trend: affectedLocs?.trend,
            subtext: '4 priority disaster zones',
            tooltip: affectedLocs?.tooltip || 'Settlements reporting infrastructure deficit or rising flood waters.',
          },
          {
            id: 'kpi-inaccessible-locations',
            title: 'Inaccessible Locations',
            value: inaccLocs?.value || '3',
            unit: inaccLocs?.unit || 'Cut-off pockets',
            status: inaccLocs?.status || 'critical',
            icon: ShieldAlert,
            trend: inaccLocs?.trend,
            subtext: 'Barge / Air only access',
            tooltip: inaccLocs?.tooltip || 'Communities cut off by destroyed culverts or high flood currents.',
          },
        ],
      },
    ];
  }, [inventoryLots, demandRecords, allocationLines, stockReservations, dispatchOrders, deliveryRecords, selectedIncident, selectedCrisisType, selectedRegion]);

  // Synchronized telemetry dataset
  const data = useMemo(() => {
    if (!isDemoMode && liveCommandCenter) {
      return {
        ...liveCommandCenter,
        kpis: liveCommandCenter.kpis || liveCommandCenter.sections?.flatMap((s) => s.cards) || [],
        priorityDemands: liveCommandCenter.priorityDemands || [],
      };
    }
    const scenario = getCommandCenterData(selectedIncident, selectedCrisisType, selectedRegion);
    const flatKpis = kpiSections.flatMap((s) => s.cards);

    // Map authoritative store demandRecords and live available stock to priorityDemands
    const priorityDemands = demandRecords.map((d) => {
      const unmet = Math.max(0, Number(d.quantity || 0) - Number(d.fulfilledQuantity || 0));
      const matchingAvailable = inventoryLots
        .filter((lot) => lot.commodityId === (d.commodityId || d.commodity) && lot.unit === d.unit)
        .reduce((sum, lot) => sum + lotBalances(lot).available, 0);

      return {
        id: d.id,
        region: d.region || d.location || 'Operation Sector',
        actionNeeded: unmet > 0 ? `Unmet deficit: ${new Intl.NumberFormat().format(unmet)} ${d.unit}` : 'Fully fulfilled',
        commodity: d.item || d.commodityId || d.commodity,
        requiredQty: d.quantity,
        availableQty: matchingAvailable,
        unmetQty: unmet,
        unit: d.unit,
        priority: d.priority || 'HIGH',
        verificationStatus: d.verificationStatus,
      };
    });

    return { ...scenario, kpis: flatKpis, priorityDemands };
  }, [selectedIncident, selectedCrisisType, selectedRegion, kpiSections, demandRecords, inventoryLots]);

  // Handle marker / row entity inspection
  const handleSelectEntity = (entity) => {
    setSelectedEntity(entity);
    setIsDetailDrawerOpen(true);
  };

  // Handle KPI card click interaction
  const handleKpiClick = (kpiId) => {
    if (activeKpiFilter === kpiId) {
      setActiveKpiFilter(null);
    } else {
      setActiveKpiFilter(kpiId);
      // If inaccessible locations clicked, open the first cut-off community
      if (kpiId === 'kpi-inaccessible-locations') {
        const cutOff = data.mapEntities.communities.find((c) => c.accessibility.includes('INACCESSIBLE'));
        if (cutOff) handleSelectEntity({ ...cutOff, entityKind: 'COMMUNITY' });
      } else if (kpiId === 'kpi-active-disruptions') {
        const disr = data.mapEntities.disruptions[0];
        if (disr) handleSelectEntity({ ...disr, entityKind: 'DISRUPTION' });
      }
    }
  };

  // Live or simulation refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (!isDemoMode && typeof refetchLive === 'function') {
      try {
        await refetchLive();
      } catch (e) {
        console.error('Failed to refresh live command center', e);
      }
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Chart commodity bar click → cross-filter and open relevant community
  const handleCommodityClick = (payload) => {
    if (!payload) return;
    const commodityName = payload.commodity || payload.name || payload.label;
    if (activeCommodityFilter === commodityName) {
      setActiveCommodityFilter(null);
      return;
    }
    setActiveCommodityFilter(commodityName);
    // Open first community with a matching deficit for that commodity
    const match = data.priorityDemands?.find(
      (d) => d.commodity && String(d.commodity).toLowerCase().includes(String(commodityName).toLowerCase())
    );
    if (match) handleSelectEntity({ ...match, entityKind: 'COMMUNITY' });
  };

  // Chart zone bar click → cross-filter and open relevant community
  const handleZoneClick = (payload) => {
    if (!payload) return;
    const zoneName = payload.zone || payload.name || payload.community;
    if (activeZoneFilter === zoneName) {
      setActiveZoneFilter(null);
      return;
    }
    setActiveZoneFilter(zoneName);
    const match = data.mapEntities?.communities?.find(
      (c) => c.name && String(c.name).toLowerCase().includes(String(zoneName).toLowerCase())
    );
    if (match) handleSelectEntity({ ...match, entityKind: 'COMMUNITY' });
  };

  // Decision authorization — log to audit trail, show inline confirmation banner
  const handleAuthorizeDecision = () => {
    if (!pendingDecisionModal) return;
    addAuditEvent({
      action: 'OPERATIONAL_DECISION_AUTHORIZED',
      module: 'Command Centre',
      user: 'Operational Commander',
      role: 'Crisis Response Director',
      details: `Decision authorized: ${pendingDecisionModal.title}. ${pendingDecisionModal.consequence || ''}`,
      severity: 'HIGH',
    });
    setAuthorizedDecision({
      title: pendingDecisionModal.title,
      timestamp: new Date().toLocaleTimeString(),
    });
    setPendingDecisionModal(null);
    // Clear confirmation banner after 5 seconds
    setTimeout(() => setAuthorizedDecision(null), 5000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header with Compact Telemetry Context */}
      <PageHeader
        title="Command Centre"
        subtitle={`${selectedIncident?.code || 'CYC-IDAI-2'} • ${selectedIncident?.name}`}
        icon={LayoutDashboard}
        badge={
          <StatusBadge variant="critical" pulse size="xs">
            LEVEL 3 EMERGENCY
          </StatusBadge>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-brand-border text-xs font-mono text-text-secondary shadow-subtle">
              <Clock className="w-3.5 h-3.5 text-steel" />
              <span>{lastDataFreshness}</span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              isLoading={isRefreshing}
              onClick={handleRefresh}
            >
              Sync Telemetry
            </Button>
          </div>
        }
      />

      {/* Decision Authorization Confirmation Banner */}
      {authorizedDecision && (
        <div className="p-3 bg-status-success-bg border border-status-success-border rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-status-success shrink-0" />
            <div>
              <span className="font-bold text-text-primary">Decision Authorized & Logged:</span>
              <span className="text-text-secondary ml-2">{authorizedDecision.title}</span>
            </div>
          </div>
          <span className="font-mono text-[10px] text-text-secondary shrink-0">{authorizedDecision.timestamp} — recorded to audit trail</span>
        </div>
      )}

      {/* Active Chart Filter Chips */}
      {(activeCommodityFilter || activeZoneFilter) && (
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-text-secondary font-mono">Active filters:</span>
          {activeCommodityFilter && (
            <button
              type="button"
              onClick={() => setActiveCommodityFilter(null)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-light text-teal border border-teal/30 font-semibold hover:bg-teal/20 transition-colors"
            >
              Commodity: {activeCommodityFilter}
              <span className="text-teal/60 ml-1">×</span>
            </button>
          )}
          {activeZoneFilter && (
            <button
              type="button"
              onClick={() => setActiveZoneFilter(null)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-surface text-navy-primary border border-brand-border font-semibold hover:bg-brand-bg transition-colors"
            >
              Zone: {activeZoneFilter}
              <span className="text-text-secondary ml-1">×</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Operational ledger KPIs are live; remaining scenario context is synthetic. */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-text-secondary">
            Ledger-derived operational KPIs update from shared inventory, reservation, dispatch, delivery and demand records. Other incident/scenario metrics remain simulated context.
          </p>
        </div>
        {isRefreshing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <Skeleton variant="kpi" count={5} />
          </div>
        ) : (
          <CommandCenterKpis
            sections={kpiSections}
            onKpiClick={handleKpiClick}
            activeFilter={activeKpiFilter}
          />
        )}
      </section>

      {/* Stage 4.5 Geographic Hazard Telemetry Banner */}
      {geoAlerts.length > 0 && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs shadow-subtle">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-text-primary">
                Geographic Hazard Telemetry:
              </span>
              <span className="text-text-secondary ml-1.5">
                {exposedFacilitiesCount} facilities with hazard exposure notices • {blockedCorridorsCount} confirmed blocked corridors • {geoAlerts.length} total spatial alerts active
              </span>
            </div>
          </div>
          <Link
            to="/network-map"
            className="inline-flex items-center gap-1 font-semibold text-teal hover:text-navy-primary hover:underline transition-colors text-xs shrink-0"
          >
            <span>View Interactive GIS Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 3. Central Dominant Geographical Crisis Map */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionHeader
            title="Operational Crisis Map & Corridors"
            badge={
              <StatusBadge variant="teal" size="xs">
                COMMON OPERATING PICTURE
              </StatusBadge>
            }
            compact
          />
        </div>

        <CrisisMap
          mapEntities={data.mapEntities}
          onSelectEntity={handleSelectEntity}
        />
      </section>

      {/* 4. Five Compact Tactical Operational Panels */}
      <section className="space-y-2">
        <SectionHeader
          title="Tactical Status & Decision Radar"
          badge={
            <StatusBadge variant="navy" size="xs">
              SCENARIO / SYNTHETIC
            </StatusBadge>
          }
          compact
        />

        <OperationalPanels
          panelsData={data.operationalPanels}
          onInspectDisruption={(disr) => handleSelectEntity({ ...disr, entityKind: 'DISRUPTION' })}
          onInspectIncident={(inc) => handleSelectEntity({ ...inc, entityKind: 'DISRUPTION' })}
          onAuthorizeDecision={(dec) => setPendingDecisionModal(dec)}
        />
      </section>

      {/* 5. Five Visual Analytics Visualizations (Recharts) */}
      <section className="space-y-2">
        <SectionHeader
          title="Resource & Demand Analytics"
          badge={
            <StatusBadge variant="teal" size="xs">
              SCENARIO / SYNTHETIC
            </StatusBadge>
          }
          compact
        />

        <CommandCenterCharts
          chartsData={data.charts}
          onCommodityClick={handleCommodityClick}
          onZoneClick={handleZoneClick}
        />
      </section>

      {/* 6. Priority-Demand Table (Sortable & Filterable) */}
      <section className="space-y-2">
        <SectionHeader
          title="Critical Community Needs & Deficits"
          badge={
            <StatusBadge variant="critical" size="xs">
              SCENARIO / SYNTHETIC
            </StatusBadge>
          }
          compact
        />

        <PriorityDemandTable
          demands={data.priorityDemands}
          selectedId={selectedEntity?.id}
          onSelectDemand={(demand) => handleSelectEntity({ ...demand, entityKind: 'COMMUNITY' })}
        />
      </section>

      {/* Location Detail Slide-Over Inspector Drawer */}
      <LocationDetailDrawer
        entity={selectedEntity}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        onActionClick={(actionType, entity) => {
          if (actionType === 'REROUTE') {
            setPendingDecisionModal({
              title: `Authorize Contingency Detour for ${entity.code || entity.title}`,
              consequence: 'Diverts cargo convoy via inland bypass. Estimated delay: +4.5 hours.',
            });
          }
        }}
      />

      {/* Decision Authorization Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(pendingDecisionModal)}
        onClose={() => setPendingDecisionModal(null)}
        onConfirm={handleAuthorizeDecision}
        title={pendingDecisionModal?.title || 'Authorize Operational Decision'}
        description={pendingDecisionModal?.consequence || 'Confirming this operational action will dispatch resources or reroute cargo convoys.'}
        confirmText="Authorize & Sign"
        isDestructive={false}
      />
    </div>
  );
}
