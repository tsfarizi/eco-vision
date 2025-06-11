import { getAccessToken, refreshAccessToken, clearTokens, authHeader } from './token.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * A wrapper around the native fetch API that handles JWT authentication,
 * token refreshing, and retrying requests.
 *
 * @param {string} resource The URL resource to fetch (e.g., '/users', '/predict/').
 *                          BASE_URL will be prepended.
 * @param {object} options The options object for the fetch API.
 * @param {boolean} isRetry Internal flag to prevent infinite retry loops.
 * @returns {Promise<Response>} A promise that resolves to the fetch Response object.
 */
export async function fetchWithAuth(resource, options = {}, isRetry = false) {
  const url = resource.startsWith('http') ? resource : `${BASE_URL}${resource}`;

  // Ensure headers object exists
  const currentOptions = { ...options };
  if (!currentOptions.headers) {
    currentOptions.headers = {};
  }

  // Add Authorization header
  const tokenHeaders = authHeader(); // Gets { Authorization: `Bearer ${token}` } or {}
  currentOptions.headers = {
    ...currentOptions.headers,
    ...tokenHeaders, // Spread tokenHeaders to include Authorization if present
  };

  // Remove 'Accept' if it's a FormData request, browser will set it.
  // Add 'Accept: application/json' for other requests if not already set.
  if (!(currentOptions.body instanceof FormData)) {
    if (!currentOptions.headers['Accept']) {
      currentOptions.headers['Accept'] = 'application/json';
    }
    // Ensure 'Content-Type' is 'application/json' if there's a body and it's not FormData
    if (currentOptions.body && !currentOptions.headers['Content-Type']) {
        currentOptions.headers['Content-Type'] = 'application/json';
    }
  } else {
    // For FormData, remove Content-Type so browser can set it with boundary
    delete currentOptions.headers['Content-Type'];
  }


  console.log(`[DEBUG] fetchWithAuth: Attempting fetch to ${url} (Retry: ${isRetry})`, currentOptions);
  let response = await fetch(url, currentOptions);
  console.log(`[DEBUG] fetchWithAuth: Response status from ${url} (Retry: ${isRetry}): ${response.status}`);

  if (response.status === 401 && !isRetry) {
    console.log(`[DEBUG] fetchWithAuth: Received 401 from ${url}. Attempting token refresh.`);
    try {
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        console.log(`[DEBUG] fetchWithAuth: Token refreshed successfully for ${url}. Retrying request.`);
        // Retry the request with the new token (recursive call, setting isRetry to true)
        return fetchWithAuth(resource, options, true); // Pass original options, not currentOptions
      } else {
        // This case should ideally be handled by refreshAccessToken throwing an error
        console.error(`[DEBUG] fetchWithAuth: refreshAccessToken returned no new token, but didn't throw. This is unexpected.`);
        clearTokens(); // Ensure tokens are cleared
        // Potentially redirect to login or throw a more specific error
        if (typeof window !== 'undefined') {
           // window.location.href = '/login'; // Or trigger a navigation event
        }
        throw new Error("Session expired. Please login again.");
      }
    } catch (refreshError) {
      console.error(`[DEBUG] fetchWithAuth: Failed to refresh token for ${url}. Error:`, refreshError.message);
      // refreshAccessToken should have called clearTokens() already if refresh failed
      // Propagate the error or throw a new one indicating session termination
      // Optional: redirect to login page
      if (typeof window !== 'undefined' && window.showPage) {
        // Assuming showPage is a global function to change views
        // This is a common pattern in single-page applications (SPAs)
        // If direct navigation is preferred: window.location.href = '/login.html';
        console.log('[DEBUG] fetchWithAuth: Refresh failed, attempting to redirect to landing page for re-login.');
        window.showPage('landing-page'); // Or a specific login page if available
      }
      throw new Error(`Session expired or refresh failed: ${refreshError.message}. Please login again.`);
    }
  }

  return response;
}

// Helper to easily parse JSON or return a structured error
export async function handleResponse(response) {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: `Request failed with status ${response.status} and non-JSON response.` };
    }
    console.error('[DEBUG] handleResponse: API request failed:', response.status, errorData);
    throw new Error(errorData.detail || errorData.message || JSON.stringify(errorData) || `HTTP error ${response.status}`);
  }
  // If response is OK but has no content (e.g., 204 No Content)
  if (response.status === 204) {
    return null;
  }
  try {
    return await response.json();
  } catch (e) {
    // Handle cases where response.ok is true, but body is not JSON (should be rare for a JSON API)
    console.error('[DEBUG] handleResponse: Failed to parse JSON from successful response:', e);
    throw new Error("Response was successful but failed to parse as JSON.");
  }
}
