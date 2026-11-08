import { apiClient } from './apiClient.js';

export async function fetchIncidents() {
  return await apiClient('/incidents');
}

export async function fetchFacilities() {
  return await apiClient('/facilities');
}

export async function fetchInventoryLots() {
  return await apiClient('/inventory/lots');
}

export async function fetchDemandRecords() {
  return await apiClient('/demand/records');
}

export async function fetchBeneficiaryGroups() {
  return await apiClient('/demand/beneficiary-groups');
}

export async function fetchDispatchOrders() {
  return await apiClient('/dispatch/orders');
}

export async function fetchAuditEvents() {
  return await apiClient('/audit/events');
}

export async function fetchLocations() {
  return await apiClient('/geography/locations');
}

export async function fetchZones() {
  return await apiClient('/geography/zones');
}

export async function fetchRoutes() {
  return await apiClient('/geography/routes');
}

export async function fetchScenarioStatus() {
  return await apiClient('/scenario/status');
}

// Operational Mutations
export async function apiReceiveStock(payload) {
  return await apiClient('/inventory/receive', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiQuarantineLot(lotId, payload = {}) {
  return await apiClient(`/inventory/quarantine/${lotId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiVerifyDemand(demandId, payload) {
  return await apiClient(`/demand/records/${demandId}/verify`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiCreateDispatch(payload) {
  return await apiClient('/dispatch/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiDepartDispatch(dispatchId, payload = {}) {
  return await apiClient(`/dispatch/${dispatchId}/depart`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiArriveDispatch(dispatchId, payload = {}) {
  return await apiClient(`/dispatch/${dispatchId}/arrive`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiRerouteDispatch(dispatchId, payload) {
  return await apiClient(`/dispatch/${dispatchId}/reroute`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiVerifyPod(payload) {
  return await apiClient('/dispatch/verify-pod', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

