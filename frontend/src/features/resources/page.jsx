import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { lotBalances } from '../../domain/operationalLedger.js';
import {
  Package,
  Plus,
  ArrowRightLeft,
  ShieldAlert,
  Archive,
  Download,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Building,
  Droplets,
  HeartPulse,
  Utensils,
  Layers,
  Table,
  BarChart3,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { DateFilter } from '../../components/ui/DateFilter.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';

import { getResourcesModuleData } from './data/resourcesData.js';
import { ResourcesKpis } from './components/ResourcesKpis.jsx';
import { FefoPriorityQueue } from './components/FefoPriorityQueue.jsx';
import { CommodityAnalytics } from './components/CommodityAnalytics.jsx';
import { InventoryTable } from './components/InventoryTable.jsx';
import { InventoryVisualAnalytics } from './components/InventoryVisualAnalytics.jsx';
import { BatchDetailDrawer } from './components/BatchDetailDrawer.jsx';
import { ResourceActionModals } from './components/ResourceActionModals.jsx';

/**
 * ResQNet Resources & Inventory Module Page
 * Comprehensive humanitarian resource ledger enforcing strict unit separation,
 * FEFO autonomous queuing, quality verification states, and storage telemetry.
 */
export default function ResourcesPage() {
  // Global & Local Filters
  const [selectedFacility, setSelectedFacility] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedCommodity, setSelectedCommodity] = useState('ALL');

  // View Mode: 'TABLE' | 'VISUAL' (Table View vs Visual Inventory Analytics)
  const [viewMode, setViewMode] = useState('TABLE');

  // Dynamic Item List (allows interactive receive, quarantine, transfer)
  const inventoryLots = useAppStore(state => state.inventoryLots);
  const receiveOperationalStock = useAppStore(state => state.receiveOperationalStock);
  const quarantineOperationalLot = useAppStore(state => state.quarantineOperationalLot);
  const inventoryList = useMemo(() => inventoryLots.map(l => { const balance=lotBalances(l); return {...l,commodity:l.commodityId,totalQty:balance.onHand,receivedQty:balance.received,usableQty:balance.usable,availableQty:balance.available,reservedQty:balance.reserved,inTransitQty:balance.inTransit,quarantinedQty:balance.quarantined,expiredQty:balance.expired,receivedDate:l.receivedAt,fefoEligible:balance.available>0,daysToExpiry:l.expiryDate?Math.ceil((new Date(`${l.expiryDate}T23:59:59`)-new Date())/86400000):null,movementHistory:[]}; }),[inventoryLots]);

  // Selected Batch for Detail Drawer
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Action Modal State: { isOpen: boolean, type: string, batch?: object }
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    batch: null,
  });

  // Re-calculate module telemetry based on current filters and modified items
  const {
    filteredItems,
    fefoQueue,
    metrics,
    foodAnalytics,
    waterAnalytics,
    medicalAnalytics,
  } = useMemo(() => {
    let items = [...inventoryList];

    if (selectedCommodity !== 'ALL') {
      items = items.filter((i) => i.commodity === selectedCommodity);
    }
    if (selectedFacility !== 'ALL') {
      items = items.filter((i) => i.facilityId === selectedFacility);
    }

    // Compute Metrics dynamically
    const totalItemCount = items.length;
    const totalUsableLots = items.filter((i) => i.qualityStatus === 'VERIFIED_USABLE').length;
    const totalQuarantinedLots = items.filter((i) => i.qualityStatus === 'QUARANTINED').length;
    const totalExpiringLots = items.filter((i) => i.expiryDate && new Date(`${i.expiryDate}T23:59:59`) > new Date() && (new Date(i.expiryDate) - new Date()) / 86400000 <= 30).length;
    const totalLowStockLots = items.filter((i) => Number.isFinite(i.lowStockThreshold) && i.unit === i.lowStockThresholdUnit && i.usableQty < i.lowStockThreshold).length;
    const totalReservedLots = items.filter((i) => i.reservedQty > 0).length;

    // FEFO Queue: Filter out expired or quarantined, sort strictly by earliest expiry
    const fefoQueue = items
      .filter((i) => i.fefoEligible && i.qualityStatus === 'VERIFIED_USABLE' && i.expiryDate && new Date(`${i.expiryDate}T23:59:59`) > new Date())
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
      .map((item, idx) => ({
        ...item,
        fefoRank: idx + 1,
        urgencyTier:
          (new Date(item.expiryDate) - new Date()) / 86400000 <= 15
            ? 'CRITICAL_DISPATCH'
            : (new Date(item.expiryDate) - new Date()) / 86400000 <= 45
            ? 'HIGH_PRIORITY'
            : 'STABLE',
      }));

    // Base analytics datasets
    const baseData = getResourcesModuleData(selectedCommodity, selectedFacility);

    return {
      filteredItems: items,
      fefoQueue,
      metrics: {
        totalItemCount,
        totalUsableLots,
        totalQuarantinedLots,
        totalExpiringLots,
        totalLowStockLots,
        totalReservedLots,
      },
      foodAnalytics: baseData.foodAnalytics,
      waterAnalytics: baseData.waterAnalytics,
      medicalAnalytics: baseData.medicalAnalytics,
    };
  }, [inventoryList, selectedCommodity, selectedFacility]);

  // All inventory changes are committed through the shared operational store.
  const handleModalSubmit = ({ actionType, data, batch }) => {
    if (actionType === 'RECEIVE_STOCK') {
      receiveOperationalStock({...data, commodityId:data.commodity, quantity:Number(data.quantity), id:data.id||`LOT-${Date.now()}`});
    } else if (actionType === 'QUARANTINE_STOCK' && batch) {
      quarantineOperationalLot(batch.id);
      if (selectedBatch?.id === batch.id) setSelectedBatch(null);
    } else if (actionType === 'TRANSFER_STOCK') {
      // Transfers require an approved allocation and reservation; page-level subtraction is forbidden.
      window.alert('Create and approve an allocation for this stock before dispatching a transfer.');
    } else if (actionType === 'RESERVE_STOCK') {
      window.alert('Reservations are created only when an allocation is approved.');
    } else if (actionType === 'ADD_RESOURCE') {
      useAppStore.getState().addAuditEvent({
        action: 'RESOURCE_SKU_REGISTERED',
        module: 'Resources & Inventory',
        entityId: data.name || 'NEW-SKU',
        user: 'Logistics Catalog Officer',
        role: 'Catalog Custodian',
        details: `Registered master catalog SKU: ${data.name} (${data.commodity} - ${data.unit})`,
        isDemo: true,
      });
    }
  };

  // Commodity Tabs Definition
  const commodityTabs = [
    { id: 'ALL', label: 'All Commodities', icon: Layers, count: inventoryList.length },
    {
      id: 'FOOD',
      label: 'Food Supplies',
      icon: Utensils,
      count: inventoryList.filter((i) => i.commodity === 'FOOD').length,
    },
    {
      id: 'WATER',
      label: 'Safe Water',
      icon: Droplets,
      count: inventoryList.filter((i) => i.commodity === 'WATER').length,
    },
    {
      id: 'MEDICAL',
      label: 'Medical Supplies',
      icon: HeartPulse,
      count: inventoryList.filter((i) => i.commodity === 'MEDICAL').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header with Filters & Primary Actions */}
      <PageHeader
        title="Resources & Inventory"
        subtitle="Stock usability, FEFO shelf-life, and depot movements"
        icon={Package}
        badge={<StatusBadge variant="teal" size="xs">SIMULATED LEDGER</StatusBadge>}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Facility Selector */}
            <Select
              value={selectedFacility}
              onChange={setSelectedFacility}
              options={[
                { value: 'ALL', label: 'All Depots & Bases' },
                { value: 'CSD-01', label: 'Central Staging Depot (CSD-01)' },
                { value: 'NLB-02', label: 'North Logistics Base (NLB-02)' },
                { value: 'SRD-03', label: 'South Relief Depot (SRD-03)' },
              ]}
            />

            {/* Reporting Time Horizon */}
            <DateFilter
              selected={selectedPeriod}
              onChange={setSelectedPeriod}
              presets={[
                { id: '24h', label: '24h' },
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7d' },
                { id: '30d', label: '30d' },
              ]}
            />

            {/* Action Buttons */}
            <Button
              size="sm"
              variant="secondary"
              icon={Plus}
              onClick={() => setModalState({ isOpen: true, type: 'ADD_RESOURCE' })}
            >
              Add SKU
            </Button>

            <Button
              size="sm"
              variant="primary"
              icon={Package}
              onClick={() => setModalState({ isOpen: true, type: 'RECEIVE_STOCK' })}
            >
              Receive Stock
            </Button>
          </div>
        }
      />

      {/* 2. Commodity Stream Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-brand-border">
        <Tabs
          tabs={commodityTabs}
          activeTab={selectedCommodity}
          onChange={setSelectedCommodity}
          variant="pills"
        />

        <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span>Real-time Lot Usability Enforced</span>
        </div>
      </div>

      {/* 3. Six Enterprise KPI Metrics Strip */}
      <ResourcesKpis
        metrics={metrics}
        activeCommodity={selectedCommodity}
      />

      {/* 4. FEFO Priority Dispatch Queue */}
      <FefoPriorityQueue
        fefoQueue={fefoQueue}
        onSelectBatch={(batch) => setSelectedBatch(batch)}
      />

      {/* 5. Specialized Commodity Analytics Suite */}
      <CommodityAnalytics
        activeCommodity={selectedCommodity}
        foodAnalytics={foodAnalytics}
        waterAnalytics={waterAnalytics}
        medicalAnalytics={medicalAnalytics}
      />

      {/* 6. Master Inventory Ledger & Visual Analytics Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-brand-border">
          <div className="flex items-center gap-2.5">
            <h3 className="text-section-title text-text-primary">
              {viewMode === 'TABLE' ? 'Inventory Batches & Quality Ledger' : 'Visual Inventory Analytics'}
            </h3>
            <StatusBadge variant="neutral" size="xs">
              {filteredItems.length} LOTS
            </StatusBadge>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Segmented Control Toggle */}
            <div className="flex items-center bg-brand-surface-subtle p-0.5 rounded-lg border border-brand-border shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                  viewMode === 'TABLE'
                    ? 'bg-navy-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/50'
                }`}
                title="Switch to detailed batch ledger table view"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('VISUAL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                  viewMode === 'VISUAL'
                    ? 'bg-teal text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/50'
                }`}
                title="Switch to visual analytics, charts, and distribution breakdown"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Visual Analytics</span>
              </button>
            </div>

            {viewMode === 'TABLE' && (
              <>
                <Button
                  size="xs"
                  variant="ghost"
                  icon={ArrowRightLeft}
                  onClick={() => {
                    if (filteredItems.length > 0) {
                      setModalState({
                        isOpen: true,
                        type: 'TRANSFER_STOCK',
                        batch: filteredItems[0],
                      });
                    }
                  }}
                >
                  Transfer Batch
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  icon={ShieldAlert}
                  onClick={() => {
                    if (filteredItems.length > 0) {
                      setModalState({
                        isOpen: true,
                        type: 'QUARANTINE_STOCK',
                        batch: filteredItems[0],
                      });
                    }
                  }}
                  className="text-status-critical hover:bg-status-critical-bg"
                >
                  Quarantine Batch
                </Button>
              </>
            )}
          </div>
        </div>

        {/* View Mode Conditional Rendering */}
        {viewMode === 'TABLE' ? (
          <>
            <InventoryTable
              items={filteredItems}
              selectedId={selectedBatch?.id}
              onSelectBatch={(batch) => setSelectedBatch(batch)}
            />

            {filteredItems.length === 0 && (
              <EmptyState
                title="No inventory records match your filters"
                description="Adjust the commodity type, facility, or reporting period to find matching batches."
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedCommodity('ALL');
                      setSelectedFacility('ALL');
                      setSelectedPeriod('7d');
                    }}
                  >
                    Reset Filters
                  </Button>
                }
              />
            )}
          </>
        ) : (
          <InventoryVisualAnalytics
            items={filteredItems}
            selectedFacility={selectedFacility}
            selectedCommodity={selectedCommodity}
            onSelectBatch={(batch) => setSelectedBatch(batch)}
            selectedBatchId={selectedBatch?.id}
          />
        )}
      </div>

      {/* 7. Batch Detail Inspector Drawer */}
      <BatchDetailDrawer
        batch={selectedBatch}
        isOpen={Boolean(selectedBatch)}
        onClose={() => setSelectedBatch(null)}
        onActionTrigger={(actionType, batch) => {
          if (actionType === 'QUARANTINE') {
            setModalState({ isOpen: true, type: 'QUARANTINE_STOCK', batch });
          } else if (actionType === 'TRANSFER') {
            setModalState({ isOpen: true, type: 'TRANSFER_STOCK', batch });
          } else if (actionType === 'RESERVE') {
            setModalState({ isOpen: true, type: 'RESERVE_STOCK', batch });
          } else if (actionType === 'ADJUST') {
            setModalState({ isOpen: true, type: 'ADJUST_STOCK', batch });
          }
        }}
      />

      {/* 8. Functional Resource Action Modals */}
      <ResourceActionModals
        modalState={modalState}
        onClose={() => setModalState({ isOpen: false, type: null, batch: null })}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
