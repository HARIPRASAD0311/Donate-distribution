import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Truck,
  Ship,
  Plane,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Compass,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { ChartContainer, ChartTooltip, CHART_THEME } from '../../../components/charts/index.js';
import { Card } from '../../../components/ui/Card.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { DISPATCH_ANALYTICS } from '../data/dispatchData.js';

/** Custom DivIcon for Moving Shipments & Waypoints */
function createShipmentIcon(type, status) {
  const isException = status === 'FAILED_DISRUPTED';
  let symbol = '🚛';
  if (type === 'RIVER_BARGE') symbol = '🚢';
  else if (type === 'AIR_SLING') symbol = '🚁';
  else if (type === '4WD_COLD_BOX') symbol = '🚑';

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      ${isException ? '<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(201, 76, 76, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background-color: ${isException ? '#C94C4C' : '#142B43'};
        border: 2px solid ${isException ? '#FFFFFF' : '#176B76'};
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        color: white;
      ">
        ${symbol}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-shipment-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

/**
 * Enterprise Dispatch Visualizations Suite
 * Implements:
 * - Shipment geographical map
 * - Dispatch status distribution
 * - Delivery completion progress
 * - Planned vs received quantities
 * - Delivery timeline
 * - Exception queue
 */
export function DispatchVisualizations({
  dispatches = [],
  onSelectDispatch,
  onResolveException,
}) {
  const exceptions = dispatches.filter((d) => d.status === 'FAILED_DISRUPTED');
  const deliveredCount = dispatches.filter((d) => d.status === 'DELIVERED' || d.status === 'VERIFIED').length;
  const progressPct = Math.round((deliveredCount / Math.max(1, dispatches.length)) * 100);

  return (
    <div className="space-y-4">
      {/* Top Row: Geographical Dispatch Map & Live Exception Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Shipment Geographical Map (2 Cols) */}
        <div className="lg:col-span-2">
          <Card
            title="Active Humanitarian Fleet &amp; Transit Corridors"
            subtitle="Geographical transit tracking across barges, convoys, and aerial drops"
            badge={<StatusBadge variant="teal" size="xs">CORRIDOR MONITOR</StatusBadge>}
            noPadding
          >
            <div className="relative w-full h-[360px]">
              <MapContainer
                center={[-19.785, 34.820]}
                zoom={10}
                scrollWheelZoom={false}
                className="w-full h-full z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  maxZoom={18}
                />

                {/* Connecting Transit Vectors */}
                {dispatches.map((dsp) => (
                  <Polyline
                    key={`line-${dsp.id}`}
                    positions={[dsp.sourceCoords, dsp.destCoords]}
                    pathOptions={{
                      color: dsp.status === 'FAILED_DISRUPTED' ? '#C94C4C' : '#176B76',
                      weight: 2,
                      dashArray: dsp.status === 'FAILED_DISRUPTED' ? '4, 4' : '2, 6',
                      opacity: 0.8,
                    }}
                  />
                ))}

                {/* Shipment Markers */}
                {dispatches.map((dsp) => (
                  <Marker
                    key={dsp.id}
                    position={dsp.currentCoords}
                    icon={createShipmentIcon(dsp.vehicleType, dsp.status)}
                    eventHandlers={{
                      click: () => onSelectDispatch?.(dsp),
                    }}
                  >
                    <Popup className="resqnet-map-popup">
                      <div className="p-1 space-y-1.5 text-xs max-w-xs">
                        <div className="flex items-center justify-between border-b pb-1">
                          <span className="font-mono font-bold text-navy-primary">{dsp.id}</span>
                          <StatusBadge
                            variant={dsp.status === 'FAILED_DISRUPTED' ? 'critical' : 'teal'}
                            size="xs"
                          >
                            {dsp.status.replace('_', ' ')}
                          </StatusBadge>
                        </div>
                        <div className="font-semibold text-text-primary">{dsp.item}</div>
                        <div className="text-[10px] text-text-secondary font-mono">
                          {dsp.source} → {dsp.destination}
                        </div>
                        <div className="flex justify-between text-[11px] bg-brand-bg p-1.5 rounded">
                          <span>Payload:</span>
                          <strong className="text-teal font-mono">{dsp.quantity} {dsp.unit}</strong>
                        </div>
                        {dsp.status === 'FAILED_DISRUPTED' && (
                          <div className="text-[10px] text-status-critical font-bold">
                            ⚠ Exception: {dsp.exceptionReason}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Map Legend */}
              <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-brand-border shadow-subtle text-xs space-y-1">
                <div className="font-bold text-navy-primary text-[11px] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-teal" /> Fleet Asset Key
                </div>
                <div className="flex items-center gap-3 text-[10px] text-text-secondary font-mono">
                  <span>🚢 Shallow Barge</span>
                  <span>🚁 Air Sling</span>
                  <span>🚛 Heavy Truck</span>
                  <span>🚑 4WD Medical</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Live Exception & Alert Queue (1 Col) */}
        <div className="space-y-4">
          <Card
            title="Transit Exception Queue"
            subtitle="Consignments halted by flood breaches or route disruptions"
            badge={<StatusBadge variant="critical" size="xs">{exceptions.length} HALTED</StatusBadge>}
            noPadding
          >
            <div className="p-3 space-y-2.5">
              {exceptions.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-secondary">
                  <CheckCircle2 className="w-6 h-6 text-status-success mx-auto mb-1" />
                  All active convoys moving without incident.
                </div>
              ) : (
                exceptions.map((exc) => (
                  <div
                    key={exc.id}
                    className="p-3 rounded-lg bg-status-critical-bg/30 border border-status-critical-border text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-navy-primary">{exc.id}</span>
                      <StatusBadge variant="critical" size="xs">WASHOUT HALT</StatusBadge>
                    </div>

                    <div className="font-semibold text-text-primary text-[11px]">{exc.item}</div>
                    <div className="text-[10px] text-text-secondary font-mono">
                      Carrier: {exc.carrier} ({exc.vehicle})
                    </div>

                    <p className="text-[11px] text-status-critical leading-tight">
                      {exc.exceptionReason}
                    </p>

                    <div className="pt-1.5 border-t border-status-critical-border/40 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onSelectDispatch?.(exc)}
                        className="text-teal font-medium hover:underline text-[11px]"
                      >
                        Inspect Location
                      </button>

                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => onResolveException?.(exc)}
                      >
                        Reroute Convoy
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Delivery Completion Progress Meter */}
          <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy-primary uppercase tracking-wider font-mono text-[11px]">
                Overall Delivery Completion
              </span>
              <StatusBadge variant="teal" size="xs">{progressPct}% DELIVERED</StatusBadge>
            </div>

            <div className="w-full h-2 rounded-full bg-steel-light overflow-hidden">
              <div
                className="h-full bg-teal rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-text-secondary">
              <span>{deliveredCount} of {dispatches.length} orders delivered</span>
              <span>Target: 100% in 48h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Planned vs Received Quantities + Delivery Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Planned versus Received Quantities */}
        <ChartContainer
          title="Planned Allocation vs Received at Destination"
          subtitle="Consignment receipt progress across target settlements"
          height={210}
        >
          <BarChart data={DISPATCH_ANALYTICS.plannedVsReceived} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={CHART_THEME.grid.stroke} strokeDasharray={CHART_THEME.grid.strokeDasharray} vertical={false} />
            <XAxis dataKey="destination" stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <YAxis stroke={CHART_THEME.axis.stroke} tick={CHART_THEME.axis.tick} tickLine={false} />
            <RechartsTooltip content={<ChartTooltip unit="items" />} />
            <Bar dataKey="planned" name="Planned Quota" fill={CHART_THEME.colors.navySecondary} radius={[3, 3, 0, 0]} />
            <Bar dataKey="received" name="Received &amp; Accepted" fill={CHART_THEME.colors.teal} radius={[3, 3, 0, 0]} />
            <Bar dataKey="inTransit" name="En Route" fill={CHART_THEME.colors.warning} radius={[3, 3, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
          </BarChart>
        </ChartContainer>

        {/* Delivery Timeline Milestones */}
        <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-4 flex flex-col justify-between text-xs">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-brand-border-light">
              <span className="text-card-title text-text-primary">Operational Delivery Timeline</span>
              <StatusBadge variant="teal" size="xs">LIVE LOG</StatusBadge>
            </div>

            <div className="space-y-2 max-h-[145px] overflow-y-auto pr-1">
              {DISPATCH_ANALYTICS.deliveryTimeline.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <span className="font-mono text-[10px] text-text-secondary shrink-0 pt-0.5">
                    {item.time}
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    item.status === 'EXCEPTION' ? 'bg-status-critical' : 'bg-teal'
                  }`} />
                  <p className="text-[11px] text-text-primary leading-tight">
                    {item.event}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-brand-border-light text-[10px] text-text-secondary font-mono flex justify-between">
            <span>DISPATCH AUDIT: GPS SYNCHRONIZED</span>
            <span className="text-status-success font-bold">ALL TIMESTAMPS RECORDED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
