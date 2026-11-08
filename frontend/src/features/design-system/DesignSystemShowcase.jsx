import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  AlertTriangle,
  CheckCircle,
  Truck,
  Package,
  Users,
  Shield,
  Download,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';

import {
  Button,
  IconButton,
  KpiCard,
  StatusBadge,
  SectionHeader,
  Card,
  SearchInput,
  Select,
  DateFilter,
  Tabs,
  Tooltip,
  Dropdown,
  EmptyState,
  Skeleton,
  ErrorState,
  ConfirmationDialog,
  FilterPanel,
} from '../../components/ui/index.js';
import { DataTable } from '../../components/tables/index.js';
import { SideDrawer } from '../../components/drawers/index.js';
import { ChartContainer, ChartTooltip, CHART_THEME } from '../../components/charts/index.js';
import { MapLegend } from '../../components/maps/index.js';

// Demo Recharts data
const CHART_DATA = [
  { day: 'Mon', dispatched: 120, delivered: 110 },
  { day: 'Tue', dispatched: 200, delivered: 180 },
  { day: 'Wed', dispatched: 150, delivered: 145 },
  { day: 'Thu', dispatched: 280, delivered: 260 },
  { day: 'Fri', dispatched: 320, delivered: 300 },
  { day: 'Sat', dispatched: 210, delivered: 200 },
  { day: 'Sun', dispatched: 180, delivered: 175 },
];

// Demo table data
const TABLE_SAMPLE_DATA = [
  {
    id: 'SHP-1048',
    facility: 'Central Staging Depot',
    destination: 'Sector 2 Distribution Hub',
    commodity: 'High-Energy Biscuits',
    quantity: 350,
    unit: 'pkts',
    status: 'IN_TRANSIT',
    priority: 'HIGH',
    eta: 'Today 14:00',
  },
  {
    id: 'SHP-1043',
    facility: 'North Logistics Base',
    destination: 'Riverdale Basin Zone',
    commodity: 'Cholera Kits',
    quantity: 40,
    unit: 'kits',
    status: 'EXCEPTION',
    priority: 'CRITICAL',
    eta: 'Delayed (Mud)',
  },
  {
    id: 'SHP-1041',
    facility: 'Central Staging Depot',
    destination: 'Delta Settlement',
    commodity: 'Water Bladders (10L)',
    quantity: 300,
    unit: 'cntr',
    status: 'DELIVERED',
    priority: 'CRITICAL',
    eta: 'Completed',
  },
  {
    id: 'SHP-1039',
    facility: 'Southern Reserve Depot',
    destination: 'East Coastal Village',
    commodity: 'Trauma Packs',
    quantity: 120,
    unit: 'kits',
    status: 'AWAITING',
    priority: 'MEDIUM',
    eta: 'Pending Loading',
  },
];

export default function DesignSystemShowcase() {
  const [activeTab, setActiveTab] = useState('components');
  const [selectedPill, setSelectedPill] = useState('all');
  const [datePreset, setDatePreset] = useState('today');
  const [searchValue, setSearchValue] = useState('');
  const [selectValue, setSelectValue] = useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState('SHP-1043');

  // Columns for demo data table
  const tableColumns = [
    {
      key: 'id',
      header: 'Shipment ID',
      render: (val) => <span className="font-mono font-semibold text-navy-primary">{val}</span>,
      sortable: true,
      width: '120px',
    },
    {
      key: 'commodity',
      header: 'Commodity',
      render: (val, row) => (
        <div>
          <div className="font-medium text-text-primary">{val}</div>
          <div className="text-[11px] text-text-secondary">{row.facility}</div>
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (val) => <span className="text-text-primary">{val}</span>,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      render: (val, row) => (
        <span className="font-mono font-bold text-text-primary text-tabular">
          {val} <span className="text-[11px] font-normal text-text-secondary">{row.unit}</span>
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      align: 'center',
      render: (val) => (
        <StatusBadge
          variant={val === 'CRITICAL' ? 'critical' : val === 'HIGH' ? 'warning' : 'neutral'}
          size="xs"
        >
          {val}
        </StatusBadge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (val) => (
        <StatusBadge
          variant={val === 'DELIVERED' ? 'success' : val === 'EXCEPTION' ? 'critical' : val === 'IN_TRANSIT' ? 'teal' : 'neutral'}
          pulse={val === 'EXCEPTION'}
          size="sm"
        >
          {val}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <IconButton
            icon={Eye}
            size="xs"
            variant="ghost"
            label="Inspect Details"
            onClick={() => {
              setSelectedRowId(row.id);
              setIsDrawerOpen(true);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Showcase Page Header */}
      <div className="pb-4 border-b border-brand-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold text-teal uppercase tracking-wider">
              PHASE 1 SPECIFICATION
            </span>
            <StatusBadge variant="teal" size="xs">
              SHOWCASE ENVIRONMENT
            </StatusBadge>
          </div>
          <h1 className="text-page-title text-text-primary tracking-tight">
            ResQNet Design System & Component Library
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Light enterprise interface tokens, deep navy navigation, white analytical surfaces, and restrained interactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => window.location.reload()}
          >
            Reset Tokens
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={ExternalLink}
            onClick={() => setIsDrawerOpen(true)}
          >
            Test Drawer
          </Button>
        </div>
      </div>

      {/* Tabs navigation */}
      <Tabs
        tabs={[
          { id: 'components', label: 'All Components', count: 20 },
          { id: 'tokens', label: 'Color & Typography Tokens' },
          { id: 'interactions', label: 'Modals & Drawers' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* SECTION 1: DESIGN TOKENS & PALETTE */}
      {(activeTab === 'components' || activeTab === 'tokens') && (
        <section className="space-y-4">
          <SectionHeader
            title="Design System Color Tokens"
            subtitle="Strict semantic color tokens mapped to Tailwind config and CSS variables."
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { name: 'Primary Navy', hex: '#142B43', token: 'bg-navy-primary', text: 'text-white' },
              { name: 'Secondary Navy', hex: '#1D3B56', token: 'bg-navy-secondary', text: 'text-white' },
              { name: 'Teal Accent', hex: '#176B76', token: 'bg-teal', text: 'text-white' },
              { name: 'Steel Blue', hex: '#60758A', token: 'bg-steel', text: 'text-white' },
              { name: 'Surface (Card)', hex: '#FFFFFF', token: 'bg-white border border-brand-border', text: 'text-text-primary' },
              { name: 'Canvas Background', hex: '#F4F6F8', token: 'bg-brand-bg border border-brand-border', text: 'text-text-primary' },
              { name: 'Border Default', hex: '#DCE3E9', token: 'bg-brand-border', text: 'text-text-primary' },
              { name: 'Text Primary', hex: '#1D2939', token: 'bg-text-primary', text: 'text-white' },
              { name: 'Text Secondary', hex: '#667085', token: 'bg-text-secondary', text: 'text-white' },
              { name: 'Status Success', hex: '#27856F', token: 'bg-status-success', text: 'text-white' },
              { name: 'Status Warning', hex: '#D99A35', token: 'bg-status-warning', text: 'text-white' },
              { name: 'Status Critical', hex: '#C94C4C', token: 'bg-status-critical', text: 'text-white' },
            ].map((c) => (
              <div key={c.name} className="p-3 bg-white border border-brand-border rounded-lg shadow-subtle flex flex-col justify-between">
                <div className={`h-12 w-full rounded-md ${c.token} mb-2 shadow-xs flex items-end p-1.5`}>
                  <span className={`text-[10px] font-mono font-bold ${c.text}`}>{c.hex}</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-text-primary truncate">{c.name}</div>
                  <div className="text-[10px] font-mono text-text-secondary">{c.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: TELEMETRY KPI CARDS */}
      {(activeTab === 'components' || activeTab === 'tokens') && (
        <section className="space-y-4">
          <SectionHeader
            title="Compact Numerical KPI Telemetry"
            subtitle="Visually prominent tabular values without oversized font scales."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Active Demands"
              value="485"
              unit="requests"
              status="critical"
              icon={Users}
              trend={{ value: '+14%', isPositive: false, direction: 'up', label: 'vs last shift' }}
            />
            <KpiCard
              title="FEFO Compliance"
              value="98.4%"
              status="success"
              icon={Package}
              trend={{ value: '+2.1%', isPositive: true, direction: 'up', label: 'target 95%' }}
            />
            <KpiCard
              title="Dispatches in Transit"
              value="18"
              unit="convoys"
              status="teal"
              icon={Truck}
              subtext="4 river barges, 14 road trucks"
            />
            <KpiCard
              title="Active Exceptions"
              value="2"
              unit="impasse"
              status="warning"
              icon={AlertTriangle}
              trend={{ value: '-1', isPositive: true, direction: 'down', label: 'scout deployed' }}
            />
          </div>
        </section>
      )}

      {/* SECTION 3: BUTTONS & ICON BUTTONS */}
      {activeTab === 'components' && (
        <section className="space-y-4">
          <SectionHeader
            title="Action Buttons & Icon Triggers"
            subtitle="Standardized variants: primary teal, secondary, navy, critical, outline, and ghost."
          />

          <Card>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" icon={Plus}>Primary Teal</Button>
                <Button variant="secondary" icon={Download}>Secondary Border</Button>
                <Button variant="navy" icon={Shield}>Navy Operations</Button>
                <Button variant="outline-teal">Outline Teal</Button>
                <Button variant="critical" icon={AlertTriangle}>Critical Alert</Button>
                <Button variant="ghost">Ghost Plain</Button>
                <Button variant="primary" isLoading>Processing</Button>
                <Button variant="secondary" disabled>Disabled State</Button>
              </div>

              <div className="pt-3 border-t border-brand-border-light flex items-center gap-3">
                <span className="text-xs text-text-secondary font-medium mr-2">Sizes:</span>
                <Button size="xs" variant="primary">XS (24px)</Button>
                <Button size="sm" variant="primary">SM (32px)</Button>
                <Button size="md" variant="primary">MD (36px)</Button>
                <Button size="lg" variant="primary">LG (40px)</Button>
              </div>

              <div className="pt-3 border-t border-brand-border-light flex items-center gap-3">
                <span className="text-xs text-text-secondary font-medium mr-2">Icon Buttons:</span>
                <IconButton icon={Eye} variant="secondary" size="sm" label="Inspect" />
                <IconButton icon={Edit} variant="ghost" size="sm" label="Edit" />
                <IconButton icon={RefreshCw} variant="teal" size="sm" label="Sync" />
                <IconButton icon={Trash2} variant="critical" size="sm" label="Delete" />
                <IconButton icon={MoreVertical} variant="secondary" size="xs" label="More" />
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* SECTION 4: FORM CONTROLS & FILTERS */}
      {activeTab === 'components' && (
        <section className="space-y-4">
          <SectionHeader
            title="Form Controls & Filter Toolbars"
            subtitle="High density search, selects, date filters, and multi-parameter bars."
          />

          <FilterPanel
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onSearchClear={() => setSearchValue('')}
            searchPlaceholder="Filter convoys, items, or locations..."
            filters={
              <>
                <Select
                  value={selectValue}
                  onChange={setSelectValue}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    { value: 'food', label: 'Food (BP-5)' },
                    { value: 'water', label: 'Clean Water' },
                    { value: 'medical', label: 'Medical Kits' },
                  ]}
                />
                <DateFilter
                  selected={datePreset}
                  onChange={setDatePreset}
                />
              </>
            }
            onReset={() => {
              setSearchValue('');
              setSelectValue('all');
              setDatePreset('today');
            }}
            activeFilterCount={searchValue || selectValue !== 'all' ? 1 : 0}
            extraActions={
              <Button size="sm" variant="primary" icon={Plus}>
                New Dispatch
              </Button>
            }
          />

          {/* Segmented Pills and Tooltips */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-brand-border rounded-lg shadow-subtle">
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary font-medium">Segmented Tabs:</span>
              <Tabs
                variant="pills"
                tabs={[
                  { id: 'all', label: 'All Demands', count: 48 },
                  { id: 'critical', label: 'Critical Only', count: 8 },
                  { id: 'verified', label: 'Field Verified', count: 32 },
                ]}
                activeTab={selectedPill}
                onChange={setSelectedPill}
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary font-medium">Tooltips & Context Menus:</span>
              <Tooltip content="Latitude: -19.832, Longitude: 34.856" position="top">
                <Button size="xs" variant="secondary">Hover for Coordinates</Button>
              </Tooltip>

              <Dropdown
                trigger={<Button size="xs" variant="secondary" rightIcon={MoreVertical}>Actions</Button>}
                items={[
                  { id: 'exp', label: 'Export to CSV', icon: Download, onClick: () => alert('Exporting CSV') },
                  { id: 'view', label: 'Inspect Telemetry', icon: Eye, onClick: () => setIsDrawerOpen(true) },
                  { divider: true },
                  { id: 'del', label: 'Cancel Shipment', icon: Trash2, destructive: true, onClick: () => setIsDialogOpen(true) },
                ]}
              />
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5: DATA TABLE & MAP LEGEND */}
      {activeTab === 'components' && (
        <section className="space-y-4">
          <SectionHeader
            title="Operational High-Density Data Table"
            subtitle="Click row to open inspector drawer. Tabular typography and row highlighting."
            actions={
              <Button size="xs" variant="secondary" icon={Download}>
                Export Table
              </Button>
            }
          />

          <DataTable
            columns={tableColumns}
            data={TABLE_SAMPLE_DATA}
            selectedId={selectedRowId}
            onRowClick={(row) => {
              setSelectedRowId(row.id);
              setIsDrawerOpen(true);
            }}
            pagination={{
              currentPage: 1,
              totalPages: 4,
              totalCount: 38,
              onPageChange: (p) => console.log('Page change', p),
            }}
          />
        </section>
      )}

      {/* SECTION 6: CHARTS & MAP LEGEND */}
      {activeTab === 'components' && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <ChartContainer
              title="Daily Convoy Throughput"
              subtitle="Planned dispatches vs confirmed deliveries (UTC)"
              height={240}
              action={
                <StatusBadge variant="teal" size="xs">
                  REAL-TIME TELEMETRY
                </StatusBadge>
              }
            >
              <BarChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
                <XAxis dataKey="day" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
                <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
                <RechartsTooltip content={<ChartTooltip unit="convoys" />} />
                <Bar dataKey="dispatched" name="Dispatched" fill={CHART_THEME.colors.navySecondary} radius={[3, 3, 0, 0]} />
                <Bar dataKey="delivered" name="Delivered" fill={CHART_THEME.colors.teal} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="space-y-4">
            <Card title="Geospatial Map Layers" subtitle="Symbology tokens">
              <MapLegend
                title="Active Layers & Nodes"
                items={[
                  { label: 'Central Staging Depot', color: '#142B43', type: 'circle', count: 3 },
                  { label: 'Critical Demand Pockets', color: '#C94C4C', type: 'circle', count: 2 },
                  { label: 'Passable Corridors', color: '#27856F', type: 'line', count: 5 },
                  { label: 'Impasse / Washed Out', color: '#D99A35', type: 'dashed', count: 1 },
                  { label: 'In-Transit Convoys', color: '#176B76', type: 'circle', count: 18 },
                ]}
              />
            </Card>
          </div>
        </section>
      )}

      {/* SECTION 7: INTERACTION DEMOS (DRAWER & MODAL) */}
      {(activeTab === 'components' || activeTab === 'interactions') && (
        <section className="space-y-4">
          <SectionHeader
            title="Interaction States: Drawers & Confirmation Modals"
            subtitle="Zero-modal slide-over pattern and high-impact decision dialogues."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Side Drawer Trigger" subtitle="Context inspector">
              <p className="text-xs text-text-secondary mb-4">
                Slides in from the right edge with detailed entity payload, without obstructing navigation.
              </p>
              <Button
                variant="primary"
                fullWidth
                onClick={() => setIsDrawerOpen(true)}
              >
                Open Side Drawer
              </Button>
            </Card>

            <Card title="Authorization Modal" subtitle="Audit sign-off">
              <p className="text-xs text-text-secondary mb-4">
                Accessible modal dialogue for destructive operations and emergency coordinator sign-off.
              </p>
              <Button
                variant="critical"
                fullWidth
                onClick={() => setIsDialogOpen(true)}
              >
                Trigger Confirm Modal
              </Button>
            </Card>

            <Card title="Feedback & Error States" subtitle="Graceful fallbacks">
              <div className="space-y-2">
                <ErrorState
                  compact
                  title="Radio telemetry offline"
                  onRetry={() => alert('Retrying link...')}
                />
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Interactive Side Drawer Demo */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={`Shipment Inspection: ${selectedRowId}`}
        subtitle="Consignment ledger and route verification"
        badge={<StatusBadge variant="critical">ACTIVE EXCEPTION</StatusBadge>}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsDrawerOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="sm" onClick={() => { alert('Verified'); setIsDrawerOpen(false); }}>
              Authorize Re-route
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-status-critical-bg border border-status-critical-border rounded-lg text-xs">
            <div className="font-semibold text-status-critical mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Route Disruption at km 42 Culvert
            </div>
            <p className="text-text-primary">
              Severe mud accumulation and washout. Scout winch unit deployed. Expected clearance: 4.5 hours.
            </p>
          </div>

          <div className="p-4 bg-brand-bg border border-brand-border rounded-lg space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-brand-border-light">
              <span className="text-text-secondary">Assigned Transport:</span>
              <span className="font-medium text-text-primary">10-Ton Medium Cargo Truck (FLT-04)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-brand-border-light">
              <span className="text-text-secondary">Planned Cargo:</span>
              <span className="font-medium text-text-primary">500 pkts High-Energy Biscuits</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-secondary">Target Beneficiaries:</span>
              <span className="font-medium text-text-primary">East Coastal Communities (2,200 pop)</span>
            </div>
          </div>
        </div>
      </SideDrawer>

      {/* Interactive Confirmation Dialog Demo */}
      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          alert('Action authorized and logged to immutable audit trail.');
          setIsDialogOpen(false);
        }}
        title="Authorize Emergency Reroute"
        description="Are you sure you want to bypass Route rt-1 and divert convoys via Highland Corridor bypass? This decision incurs an estimated +2.5 hrs transit delay and will be recorded in the audit trail."
        confirmText="Authorize Divert"
        isDestructive={false}
      />
    </div>
  );
}
