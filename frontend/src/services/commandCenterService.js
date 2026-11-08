import { apiClient } from './apiClient.js';

/**
 * Fetches dynamic derived Command Center telemetry from live FastAPI backend.
 * Zero hardcoded data: all KPIs, sections, charts, panels, map markers, and priority demands
 * are computed dynamically from stored database state on every request.
 *
 * @param {string} [incidentId] - Incident ID (e.g. 'INC-2024-001')
 * @returns {Promise<Object>} Live Command Center payload
 */
export async function fetchLiveCommandCenter(incidentId) {
  const endpoint = incidentId
    ? `/incidents/${incidentId}/command-center`
    : '/command-center';
  return await apiClient(endpoint);
}
