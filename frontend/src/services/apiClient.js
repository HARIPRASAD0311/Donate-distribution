/**
 * ResQNet Central HTTP & Service Gateway
 * Categorized error handling and strict boundary between Live Backend and Demo Mode.
 */

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_BASE_URL) ||
  'http://localhost:8000/api/v1';

/** Standardized Service Response Categories */
export const ServiceResponseCategory = {
  SUCCESS: 'SUCCESS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INFEASIBLE: 'INFEASIBLE',
  API_UNAVAILABLE: 'API_UNAVAILABLE',
  REQUEST_FAILED: 'REQUEST_FAILED',
  CANCELLED: 'CANCELLED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SERVER_ERROR: 'SERVER_ERROR',
};

/**
 * Classifies any fetch error or HTTP status code into standardized response categories.
 * Provides human-understandable explanations for crisis coordinators.
 *
 * @param {Error|Object} error
 * @returns {Object} Structured error report
 */
export function classifyApiError(error) {
  // 1. User Cancellation
  if (
    error?.name === 'AbortError' ||
    error?.code === 'CANCELLED' ||
    error?.category === ServiceResponseCategory.CANCELLED
  ) {
    return {
      category: ServiceResponseCategory.CANCELLED,
      status: 0,
      title: 'Execution Cancelled',
      message: 'The mathematical solver or simulation job was cancelled by the operator.',
      details: error.message || 'Operation aborted.',
      isRecoverable: true,
    };
  }

  // 2. Network offline, Connection Refused, DNS failure, or 502/503/504 Bad Gateway
  const isNetworkFailure =
    error instanceof TypeError ||
    error?.message?.toLowerCase().includes('failed to fetch') ||
    error?.message?.toLowerCase().includes('networkerror') ||
    error?.message?.toLowerCase().includes('econnrefused') ||
    error?.message?.toLowerCase().includes('load failed') ||
    error?.status === 502 ||
    error?.status === 503 ||
    error?.status === 504;

  if (isNetworkFailure) {
    return {
      category: ServiceResponseCategory.API_UNAVAILABLE,
      status: error?.status || 503,
      title: 'Backend Solver Service Unavailable',
      message: `The external Python optimization service is offline or unreachable at ${API_BASE_URL}. In Live API Mode, ResQNet strictly requires an active backend solver and rejects synthetic fallback results.`,
      details: error?.message || 'Connection refused or host unreachable.',
      endpoint: API_BASE_URL,
      isRecoverable: true,
    };
  }

  // 3. Unauthorized / Forbidden
  if (error?.status === 401 || error?.status === 403) {
    return {
      category: ServiceResponseCategory.UNAUTHORIZED,
      status: error.status,
      title: 'Authorization Required',
      message: 'Operator credentials or API token missing or expired. Cannot execute live solver jobs without clearance.',
      details: error?.body?.message || error?.body?.detail || error.message,
      isRecoverable: false,
    };
  }

  // 4. Mathematical Infeasibility (Solver returned INFEASIBLE or 422 with infeasibility body)
  const isExplicitInfeasible =
    error?.body?.status === 'INFEASIBLE' ||
    error?.body?.feasibility === 'INFEASIBLE' ||
    error?.body?.feasibility_status === 'INFEASIBLE' ||
    (typeof error?.body?.detail === 'string' &&
      error.body.detail.toLowerCase().includes('infeasible'));

  if (isExplicitInfeasible) {
    return {
      category: ServiceResponseCategory.INFEASIBLE,
      status: error.status || 422,
      title: 'Mathematical Solver Infeasible',
      message: 'The solver proved mathematical infeasibility: the specified physical capacity, route restrictions, and resource bounds cannot satisfy all mandatory critical demands.',
      details: error?.body?.detail || error?.body?.diagnostics || error.message,
      isRecoverable: true,
    };
  }

  // 5. Input Validation Error (HTTP 400 or HTTP 422)
  if (error?.status === 400 || error?.status === 422) {
    return {
      category: ServiceResponseCategory.VALIDATION_ERROR,
      status: error.status,
      title: 'Optimization Input Validation Failure',
      message: 'The submitted model parameters failed schema validation or boundary checks on the backend.',
      details: error?.body?.detail || error?.body?.errors || error.message,
      isRecoverable: true,
    };
  }

  // 6. Internal Server Error (HTTP 500)
  if (error?.status >= 500) {
    return {
      category: ServiceResponseCategory.SERVER_ERROR,
      status: error.status,
      title: 'Backend Server Exception',
      message: 'An unexpected runtime exception occurred inside the Python mathematical solver engine.',
      details: error?.body?.detail || error?.body?.message || error.message,
      isRecoverable: true,
    };
  }

  // 7. Generic Request Failure
  return {
    category: ServiceResponseCategory.REQUEST_FAILED,
    status: error?.status || 0,
    title: 'Live Service Request Failed',
    message: error?.message || 'An unexpected failure occurred while communicating with the live backend.',
    details: error?.body || error?.message,
    isRecoverable: true,
  };
}

/**
 * Standard central fetch gateway
 */
export async function apiClient(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const error = new Error(
        errorBody.message ||
          errorBody.detail ||
          `API request failed with HTTP status ${response.status}`
      );
      error.status = response.status;
      error.body = errorBody;
      throw error;
    }

    return await response.json();
  } catch (err) {
    const classification = classifyApiError(err);
    err.category = classification.category;
    err.classification = classification;
    throw err;
  }
}
