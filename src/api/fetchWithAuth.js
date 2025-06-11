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

  
  const currentOptions = { ...options };
  if (!currentOptions.headers) {
    currentOptions.headers = {};
  }

  
  const tokenHeaders = authHeader(); 
  currentOptions.headers = {
    ...currentOptions.headers,
    ...tokenHeaders, 
  };

  
  
  if (!(currentOptions.body instanceof FormData)) {
    if (!currentOptions.headers['Accept']) {
      currentOptions.headers['Accept'] = 'application/json';
    }
    
    if (currentOptions.body && !currentOptions.headers['Content-Type']) {
        currentOptions.headers['Content-Type'] = 'application/json';
    }
  } else {
    
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
        
        return fetchWithAuth(resource, options, true); 
      } else {
        
        console.error(`[DEBUG] fetchWithAuth: refreshAccessToken returned no new token, but didn't throw. This is unexpected.`);
        clearTokens(); 
        
        if (typeof window !== 'undefined') {
           
        }
        throw new Error("Session expired. Please login again.");
      }
    } catch (refreshError) {
      console.error(`[DEBUG] fetchWithAuth: Failed to refresh token for ${url}. Error:`, refreshError.message);
      
      
      
      if (typeof window !== 'undefined' && window.showPage) {
        
        
        
        console.log('[DEBUG] fetchWithAuth: Refresh failed, attempting to redirect to landing page for re-login.');
        window.showPage('landing-page'); 
      }
      throw new Error(`Session expired or refresh failed: ${refreshError.message}. Please login again.`);
    }
  }

  return response;
}


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
  
  if (response.status === 204) {
    return null;
  }
  try {
    return await response.json();
  } catch (e) {
    
    console.error('[DEBUG] handleResponse: Failed to parse JSON from successful response:', e);
    throw new Error("Response was successful but failed to parse as JSON.");
  }
}
