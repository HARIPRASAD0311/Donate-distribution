import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  ShieldCheck,
  Building,
  CheckCircle2,
  Clock,
  Layers,
  Utensils,
  Droplets,
  HeartPulse,
  Filter,
  CheckCircle,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { useAppStore } from '../../store/useAppStore.js';
import { EmptyState } from '../../components/ui/EmptyState.jsx';

import { getDemandModuleData } from './data/demandData.js';

import { DemandKpis } from './components/DemandKpis.jsx';
import { DemandMap } from './components/DemandMap.jsx';
import { DemandVisualizations } from './components/DemandVisualizations.jsx';
import { DemandTable } from './components/DemandTable.jsx';
import { VerificationQueue } from './components/VerificationQueue.jsx';
import { DemandDetailsDrawer } from './components/DemandDetailsDrawer.jsx';
import { DemandActionModals } from './components/DemandActionModals.jsx';

/**
 * ResQNet Demand & Beneficiaries Dashboard Page
 * Visualizes who needs aid, where they are, what they require,
 * how much they need, and evidence-based verification states.
 */
export default function DemandPage() {
  const navigate = useNavigate();
  const selectedRegion = useAppStore(state => state.selectedRegion);
  const setSelectedRegion = useAppStore(state => state.setSelectedRegion);
  const demandRecords = useAppStore(state => state.demandRecords);
  const groupList = useAppStore(state => state.beneficiaryGroups);
  const demandList = useMemo(() => demandRecords.map(d => ({...d, commodity:d.commodityId||d.commodity, remainingQuantity:Math.max(0,d.quantity-(d.fulfilledQuantity||0))})), [demandRecords]);
  const setDemandList = (updater) => { const current=useAppStore.getState().demandRecords.map(d=>({...d,commodity:d.commodityId||d.commodity,remainingQuantity:Math.max(0,d.quantity-(d.fulfilledQuantity||0))})); const next=typeof updater==='function'?updater(current):updater; next.forEach(record=>{const prior=useAppStore.getState().demandRecords.find(d=>d.id===record.id); const normalized={...record,fulfilledQuantity:prior?.fulfilledQuantity||record.fulfilledQuantity||0,commodityId:record.commodityId||record.commodity}; if(!prior||JSON.stringify({...prior,remainingQuantity:undefined})!==JSON.stringify({...normalized,remainingQuantity:undefined})) useAppStore.getState().upsertDemandRecord(normalized);}); };
  const setGroupList = (updater) => { const current=useAppStore.getState().beneficiaryGroups; const next=typeof updater==='function'?updater(current):updater; next.forEach(group=>{const prior=useAppStore.getState().beneficiaryGroups.find(g=>g.id===group.id); if(!prior||JSON.stringify(prior)!==JSON.stringify(group)) useAppStore.getState().upsertBeneficiaryGroup(group);}); };

  // Local state for interactive mutations


  // Filters
  const [localRegion, setLocalRegion] = useState('ALL');
  const [selectedCommodity, setSelectedCommodity] = useState('ALL');
  const [activeViewTab, setActiveViewTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'VERIFICATION_DESK'

  // Selected entities for inspection
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Action Modals: { isOpen: boolean, type: string, demand?: object }
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    demand: null,
  });

  // Calculate dynamic data based on current state and filters
  const {
    filteredItems,
    filteredGroups,
    pendingItems,
    disputedItems,
    metrics,
    commodityDistribution,
    beneficiaryGroupDistribution,
    priorityBreakdown,
    demandTrend,
    regionalComparison,
  } = useMemo(() => {
    let items = [...demandList];
    let groups = [...groupList];

    if (localRegion !== 'ALL') {
      items = items.filter((d) => d.region === localRegion);
      groups = groups.filter((g) => g.region === localRegion);
    }

    if (selectedCommodity !== 'ALL') {
      items = items.filter((d) => d.commodity === selectedCommodity);
    }

    // Pending and Disputed collections for verification queue
    const pendingItems = items.filter((d) => d.verificationStatus === 'PENDING');
    const disputedItems = items.filter((d) => d.verificationStatus === 'DISPUTED');
    const verifiedItems = items.filter((d) => d.verificationStatus === 'VERIFIED');

    // Metrics
    const totalAffectedPopulation = groups.reduce((acc, g) => acc + (g.population || 0), 0);
    const totalRegisteredGroups = groups.length;
    const totalVerifiedCount = verifiedItems.length;
    const totalPendingCount = pendingItems.length;
    const totalDisputedCount = disputedItems.length;
    const totalRejectedCount = items.filter((d) => d.verificationStatus === 'REJECTED').length;

    const criticalUnmetCount = verifiedItems.filter(
      (d) => d.priority === 'CRITICAL' && d.remainingQuantity > 0
    ).length;

    // Calculate line-level average fulfilment rate to prevent summing incompatible units
    const fulfilmentPct =
      verifiedItems.length > 0
        ? Math.round(
            (verifiedItems.reduce(
              (acc, d) => acc + (d.quantity > 0 ? Math.min(1, (d.fulfilledQuantity || 0) / d.quantity) : 0),
              0
            ) /
              verifiedItems.length) *
              100
          )
        : 0;

    const totalVerifiedFulfilledLots = verifiedItems.filter(
      (d) => (d.fulfilledQuantity || 0) > 0
    ).length;

    // Call base dataset for chart timelines & aggregations
    const baseData = getDemandModuleData(localRegion, selectedCommodity);

    return {
      filteredItems: items,
      filteredGroups: groups,
      pendingItems,
      disputedItems,
      metrics: {
        totalAffectedPopulation,
        totalRegisteredGroups,
        totalVerifiedCount,
        criticalUnmetCount,
        totalPendingCount,
        totalDisputedCount,
        totalRejectedCount,
        totalVerifiedFulfilled: totalVerifiedFulfilledLots,
        fulfilmentPct,
      },
      // Distinct request counts per stream to prevent summing heterogeneous units
      commodityDistribution: ['FOOD', 'WATER', 'MEDICAL'].map((key) => ({
        name: key,
        value: items.filter((d) => d.commodity === key).length,
      })),
      beneficiaryGroupDistribution: groups.map((g) => ({
        name: g.name,
        value: items.filter((d) => d.beneficiaryGroupId === g.id).length,
      })),
      priorityBreakdown: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((key) => ({
        name: key,
        value: items.filter((d) => d.priority === key).length,
      })),
      demandTrend: baseData.demandTrend,
      regionalComparison: groups.reduce((a, g) => {
        const found = a.find((x) => x.name === g.region);
        if (found) found.value += g.population || 0;
        else a.push({ name: g.region, value: g.population || 0 });
        return a;
      }, []),
    };
  }, [demandList, groupList, localRegion, selectedCommodity]);

  // Handle Form / Action Submissions
  const handleModalSubmit = ({ actionType, data, demand }) => {
    if (actionType === 'ADD_DEMAND') {
      const newDemand = {
        id: data.id,
        incidentId: data.incidentId,
        region: data.region,
        location: data.location,
        coordinates: [-19.789, 34.821],
        beneficiaryGroupId: data.beneficiaryGroupId,
        beneficiaryGroup: data.beneficiaryGroup,
        commodity: data.commodity,
        item: data.item,
        quantity: data.quantity,
        fulfilledQuantity: 0,
        remainingQuantity: data.quantity,
        unit: data.unit,
        priority: data.priority,
        requiredByDate: data.requiredByDate,
        reportingSource: data.reportingSource,
        verificationStatus: data.verificationStatus,
        verificationDetails: {
          verifiedBy: data.verificationStatus === 'VERIFIED' ? 'Field Coordinator Rapid Verification' : null,
          verifiedAt: data.verificationStatus === 'VERIFIED' ? new Date().toISOString() : null,
          evidenceRef: data.verificationStatus === 'VERIFIED' ? 'RAPID-FIELD-SIGNOFF' : 'PENDING-RECON',
          evidenceType: 'Direct Field Input',
          notes: data.notes,
        },
        notes: data.notes,
        isSimulated: true,
      };

      setDemandList((prev) => [newDemand, ...prev]);
    } else if (actionType === 'REGISTER_BENEFICIARY_GROUP') {
      const newGroup = {
        id: data.id,
        code: data.code,
        name: data.name,
        region: data.region,
        coordinates: [-19.825, 34.860],
        category: data.category,
        population: data.population,
        households: Math.round(data.population / 5),
        vulnerabilities: {
          underFivePercent: data.underFivePercent || 35,
          pregnantLactatingPercent: data.pregnantLactatingPercent || 20,
          elderlyDisabledPercent: 15,
          waterborneDiseaseRisk: 'MODERATE',
        },
        focalPoint: data.focalPoint,
        status: 'ACTIVE_ASSISTANCE_REQUIRED',
        accessCondition: data.accessCondition,
        isSimulated: true,
      };

      setGroupList((prev) => [newGroup, ...prev]);
    } else if (actionType === 'VERIFY_DEMAND' && demand) {
      setDemandList((prev) =>
        prev.map((item) =>
          item.id === demand.id
            ? {
                ...item,
                verificationStatus: 'VERIFIED',
                verificationDetails: {
                  verifiedBy: data.verifiedBy,
                  verifiedAt: new Date().toISOString().split('T')[0],
                  evidenceRef: data.evidenceRef,
                  evidenceType: data.evidenceType,
                  notes: data.notes,
                },
              }
            : item
        )
      );
      if (selectedDemand?.id === demand.id) {
        setSelectedDemand((prev) => ({
          ...prev,
          verificationStatus: 'VERIFIED',
          verificationDetails: {
            verifiedBy: data.verifiedBy,
            verifiedAt: new Date().toISOString().split('T')[0],
            evidenceRef: data.evidenceRef,
            evidenceType: data.evidenceType,
            notes: data.notes,
          },
        }));
      }
    } else if (actionType === 'DISPUTE_DEMAND' && demand) {
      setDemandList((prev) =>
        prev.map((item) =>
          item.id === demand.id
            ? {
                ...item,
                verificationStatus: 'DISPUTED',
                verificationDetails: {
                  verifiedBy: data.disputedBy,
                  verifiedAt: new Date().toISOString().split('T')[0],
                  evidenceRef: data.evidenceRef,
                  evidenceType: 'Disputed Claim Audit',
                  notes: data.reason,
                },
              }
            : item
        )
      );
      if (selectedDemand?.id === demand.id) {
        setSelectedDemand((prev) => ({
          ...prev,
          verificationStatus: 'DISPUTED',
          verificationDetails: {
            verifiedBy: data.disputedBy,
            verifiedAt: new Date().toISOString().split('T')[0],
            evidenceRef: data.evidenceRef,
            evidenceType: 'Disputed Claim Audit',
            notes: data.reason,
          },
        }));
      }
    } else if (actionType === 'EDIT_DEMAND' && demand) {
      setDemandList((prev) =>
        prev.map((item) =>
          item.id === demand.id
            ? {
                ...item,
                item: data.item,
                quantity: data.quantity,
                remainingQuantity: Math.max(0, data.quantity - item.fulfilledQuantity),
                priority: data.priority,
                requiredByDate: data.requiredByDate,
                notes: data.notes,
              }
            : item
        )
      );
    }
  };

  // Commodity Tabs
  const commodityTabs = [
    { id: 'ALL', label: 'All Commodities', icon: Layers, count: demandList.length },
    {
      id: 'FOOD',
      label: 'Food Supplies',
      icon: Utensils,
      count: demandList.filter((d) => d.commodity === 'FOOD').length,
    },
    {
      id: 'WATER',
      label: 'Safe Water',
      icon: Droplets,
      count: demandList.filter((d) => d.commodity === 'WATER').length,
    },
    {
      id: 'MEDICAL',
      label: 'Medical Supplies',
      icon: HeartPulse,
      count: demandList.filter((d) => d.commodity === 'MEDICAL').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header with Filters & Actions */}
      <PageHeader
        title="Demand & Beneficiaries"
        subtitle="Community distress requirements and evidence-based needs verification"
        icon={Users}
        badge={<StatusBadge variant="teal" size="xs">SIMULATED LEDGER</StatusBadge>}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Region Selector */}
            <Select
              value={localRegion}
              onChange={(val) => {
                setLocalRegion(val);
                if (val !== 'ALL') setSelectedRegion(val);
              }}
              options={[
                { value: 'ALL', label: 'All Incident Sectors' },
                { value: 'Buzi District', label: 'Buzi District' },
                { value: 'Manga IDP Hub', label: 'Manga IDP Hub' },
                { value: 'Chibabava Basin', label: 'Chibabava Basin' },
                { value: 'Nhamatanda Corridor', label: 'Nhamatanda Corridor' },
              ]}
            />

            {/* Action Buttons */}
            <Button
              size="sm"
              variant="secondary"
              icon={Building}
              onClick={() => setModalState({ isOpen: true, type: 'REGISTER_BENEFICIARY_GROUP' })}
            >
              Register Group
            </Button>

            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() =>
                setModalState({
                  isOpen: true,
                  type: 'ADD_DEMAND',
                })
              }
            >
              Add Demand
            </Button>
          </div>
        }
      />

      {/* 2. Top Commodity Stream Tabs & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-brand-border">
        <Tabs
          tabs={commodityTabs}
          activeTab={selectedCommodity}
          onChange={setSelectedCommodity}
          variant="pills"
        />

        {/* View Switcher: Overview vs Verification Desk */}
        <div className="flex items-center gap-1.5 p-1 bg-brand-bg border border-brand-border rounded-lg">
          <button
            type="button"
            onClick={() => setActiveViewTab('OVERVIEW')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              activeViewTab === 'OVERVIEW'
                ? 'bg-white text-navy-primary font-semibold shadow-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Hotspots &amp; Analytics
          </button>
          <button
            type="button"
            onClick={() => setActiveViewTab('VERIFICATION_DESK')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5 ${
              activeViewTab === 'VERIFICATION_DESK'
                ? 'bg-white text-navy-primary font-semibold shadow-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>Verification Queue</span>
            {pendingItems.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-status-warning text-white text-[10px] font-mono font-bold flex items-center justify-center">
                {pendingItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 3. Six Enterprise Demand KPI Cards */}
      <DemandKpis
        metrics={metrics}
        activeRegion={localRegion}
        activeCommodity={selectedCommodity}
      />

      {/* 4. Tab Conditional View */}
      {activeViewTab === 'VERIFICATION_DESK' ? (
        /* Dedicated Verification Queue Desk */
        <VerificationQueue
          pendingItems={pendingItems}
          disputedItems={disputedItems}
          onVerify={(item) => setModalState({ isOpen: true, type: 'VERIFY_DEMAND', demand: item })}
          onDispute={(item) => setModalState({ isOpen: true, type: 'DISPUTE_DEMAND', demand: item })}
          onReject={(item) => {
            setDemandList((prev) =>
              prev.map((d) => (d.id === item.id ? { ...d, verificationStatus: 'REJECTED' } : d))
            );
          }}
          onInspect={(item) => setSelectedDemand(item)}
        />
      ) : (
        /* Main Analytics & GIS Hotspot View */
        <div className="space-y-6">
          {/* A. Geographic Demand Map */}
          <DemandMap
            groups={filteredGroups}
            demands={filteredItems}
            activeRegion={localRegion}
            selectedGroupId={selectedGroupId}
            onSelectGroup={(grp) => {
              setSelectedGroupId(grp.id);
              const matchingDemand = filteredItems.find((d) => d.beneficiaryGroupId === grp.id);
              if (matchingDemand) setSelectedDemand(matchingDemand);
            }}
            onInspectDemand={(dem) => setSelectedDemand(dem)}
          />

          {/* B - F. Demand Visualizations Suite */}
          <DemandVisualizations
            commodityDistribution={commodityDistribution}
            beneficiaryGroupDistribution={beneficiaryGroupDistribution}
            priorityBreakdown={priorityBreakdown}
            demandTrend={demandTrend}
            regionalComparison={regionalComparison}
          />
        </div>
      )}

      {/* 5. Master Demand Requirements Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-section-title text-text-primary">
              Master Demand Register
            </h3>
            <StatusBadge variant="neutral" size="xs">
              {filteredItems.length} REQUESTS
            </StatusBadge>
          </div>

          <Button
            size="xs"
            variant="ghost"
            icon={FileCheck}
            onClick={() => setActiveViewTab(activeViewTab === 'OVERVIEW' ? 'VERIFICATION_DESK' : 'OVERVIEW')}
          >
            {activeViewTab === 'OVERVIEW' ? 'View Verification Desk' : 'Back to Analytics'}
          </Button>
        </div>

        <DemandTable
          items={filteredItems}
          selectedId={selectedDemand?.id}
          onSelectDemand={(dem) => setSelectedDemand(dem)}
          onQuickVerify={(dem) => setModalState({ isOpen: true, type: 'VERIFY_DEMAND', demand: dem })}
        />

        {filteredItems.length === 0 && (
          <EmptyState
            title="No demand requests match your filters"
            description="Adjust the region, commodity type, or status filter to find matching beneficiary demand records."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSelectedCommodity('ALL');
                  setSelectedRegion('ALL');
                }}
              >
                Reset Filters
              </Button>
            }
          />
        )}
      </div>

      {/* 6. Demand Details Dossier Drawer */}
      <DemandDetailsDrawer
        demand={selectedDemand}
        isOpen={Boolean(selectedDemand)}
        onClose={() => setSelectedDemand(null)}
        onActionTrigger={(actionType, dem) => {
          if (actionType === 'VERIFY') {
            setModalState({ isOpen: true, type: 'VERIFY_DEMAND', demand: dem });
          } else if (actionType === 'DISPUTE') {
            setModalState({ isOpen: true, type: 'DISPUTE_DEMAND', demand: dem });
          } else if (actionType === 'EDIT') {
            setModalState({ isOpen: true, type: 'EDIT_DEMAND', demand: dem });
          }
        }}
        onNavigateToAllocation={() => {
          setSelectedDemand(null);
          navigate('/allocation');
        }}
      />

      {/* 7. Action Modals (Add, Register Group, Edit, Verify, Dispute) */}
      <DemandActionModals
        modalState={modalState}
        groups={groupList}
        onClose={() => setModalState({ isOpen: false, type: null, demand: null })}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
