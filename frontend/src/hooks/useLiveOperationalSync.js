import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import {
  fetchIncidents,
  fetchFacilities,
  fetchInventoryLots,
  fetchDemandRecords,
  fetchBeneficiaryGroups,
  fetchDispatchOrders,
  fetchAuditEvents,
  fetchLocations,
  fetchZones,
  fetchScenarioStatus,
} from '../services/operationalSyncService.js';

/**
 * Hook to synchronize authoritative operational state from live FastAPI backend into Zustand store.
 * Active whenever dataMode === 'live' or isDemoMode === false.
 */
export function useLiveOperationalSync() {
  const isDemoMode = useAppStore((state) => state.isDemoMode);
  const dataMode = useAppStore((state) => state.dataMode);
  const syncLiveOperationalState = useAppStore((state) => state.syncLiveOperationalState);
  const setBackendStatus = useAppStore((state) => state.setBackendStatus);

  const [isLoading, setIsLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [error, setError] = useState(null);

  const syncNow = useCallback(async () => {
    if (isDemoMode && dataMode !== 'live') return;

    setIsLoading(true);
    setError(null);

    try {
      const [
        incidentsRes,
        facilitiesRes,
        lotsRes,
        demandsRes,
        groupsRes,
        dispatchesRes,
        auditsRes,
        locationsRes,
        zonesRes,
        scenarioRes,
      ] = await Promise.allSettled([
        fetchIncidents(),
        fetchFacilities(),
        fetchInventoryLots(),
        fetchDemandRecords(),
        fetchBeneficiaryGroups(),
        fetchDispatchOrders(),
        fetchAuditEvents(),
        fetchLocations(),
        fetchZones(),
        fetchScenarioStatus(),
      ]);

      const payload = {};

      if (incidentsRes.status === 'fulfilled' && Array.isArray(incidentsRes.value)) {
        payload.incidents = incidentsRes.value;
        if (incidentsRes.value.length > 0) {
          payload.selectedIncident = incidentsRes.value[0];
        }
      }

      if (facilitiesRes.status === 'fulfilled' && Array.isArray(facilitiesRes.value)) {
        payload.facilities = facilitiesRes.value.map((f) => ({
          ...f,
          coordinates: { lat: f.latitude, lng: f.longitude },
        }));
      }

      if (lotsRes.status === 'fulfilled' && Array.isArray(lotsRes.value)) {
        payload.inventoryLots = lotsRes.value.map((l) => ({
          ...l,
          commodityId: l.commodity,
          reservations: l.reservedQty > 0 ? [{ lineId: `RES-${l.id}`, quantity: l.reservedQty, status: 'ACTIVE' }] : [],
          transactions: [
            {
              id: `TX-${l.id}-LIVE`,
              type: 'RECEIPT',
              quantity: l.totalQty,
              unit: l.unit,
              commodityId: l.commodity,
              at: l.receivedDate || new Date().toISOString(),
            },
          ],
        }));
      }

      if (demandsRes.status === 'fulfilled' && Array.isArray(demandsRes.value)) {
        payload.demandRecords = demandsRes.value.map((d) => ({
          ...d,
          commodityId: d.commodity,
        }));
      }

      if (groupsRes.status === 'fulfilled' && Array.isArray(groupsRes.value)) {
        payload.beneficiaryGroups = groupsRes.value;
      }

      if (dispatchesRes.status === 'fulfilled' && Array.isArray(dispatchesRes.value)) {
        payload.dispatchOrders = dispatchesRes.value.map((disp) => ({
          ...disp,
          destinationFacilityId: disp.destinationId,
          lines: [{ commodity: disp.commodity, item: disp.item, unit: disp.unit, quantity: disp.quantity }],
        }));
      }

      if (auditsRes.status === 'fulfilled' && Array.isArray(auditsRes.value)) {
        payload.auditEvents = auditsRes.value.map((evt) => ({
          ...evt,
          actor: evt.user || 'SYSTEM',
        }));
      }

      if (locationsRes.status === 'fulfilled' && Array.isArray(locationsRes.value)) {
        payload.geographicLocations = locationsRes.value;
      }

      if (zonesRes.status === 'fulfilled' && Array.isArray(zonesRes.value)) {
        payload.disasterZones = zonesRes.value;
      }

      const isBackendLive = scenarioRes.status === 'fulfilled' || incidentsRes.status === 'fulfilled';
      
      if (isBackendLive) {
        setBackendStatus({
          isConnected: true,
          checkedAt: new Date().toISOString(),
          error: null,
          scenario: scenarioRes.value?.scenarioScope || 'ASSAM_BRAHMAPUTRA_VALLEY_FLOOD_2024',
          clock: scenarioRes.value?.scenarioNow || '2024-07-05T09:30:00Z',
        });
      } else {
        setBackendStatus({
          isConnected: false,
          checkedAt: new Date().toISOString(),
          error: scenarioRes.reason?.message || 'FastAPI backend offline at http://localhost:8000/api/v1',
          scenario: null,
          clock: null,
        });
      }

      const syncTimeStr = scenarioRes.status === 'fulfilled' && scenarioRes.value?.scenarioNow
        ? `Live Backend: ${scenarioRes.value.scenarioNow.substring(0, 19).replace('T', ' ')} UTC`
        : isBackendLive
        ? `Live Backend Synced ${new Date().toLocaleTimeString()}`
        : 'Backend Offline (Demo Fallback)';

      payload.lastDataFreshness = syncTimeStr;

      if (isBackendLive) {
        syncLiveOperationalState(payload);
      }
      setLastSynced(new Date());
    } catch (err) {
      console.error('Live operational sync error:', err);
      setError(err);
      setBackendStatus({
        isConnected: false,
        checkedAt: new Date().toISOString(),
        error: err.message || 'Connection failed',
        scenario: null,
        clock: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode, dataMode, syncLiveOperationalState]);

  useEffect(() => {
    if (!isDemoMode || dataMode === 'live') {
      syncNow();
    }
  }, [isDemoMode, dataMode, syncNow]);

  return { isLoading, lastSynced, error, syncNow };
}

