const BASE_URL = import.meta.env.VITE_API_BASE_URL;


export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

export function getUserInfo() {
  const userInfo = localStorage.getItem("user_info");
  return userInfo ? JSON.parse(userInfo) : null;
}


export function saveTokens(access_token, refresh_token, user = null) {
  localStorage.setItem("access_token", access_token);
  localStorage.setItem("refresh_token", refresh_token);
  
  if (user) {
    localStorage.setItem("user_info", JSON.stringify(user));
  }
}


export function clearTokens() {
  console.log('[DEBUG] clearTokens: Clearing all tokens from localStorage.');
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_info");
}


export function isAuthenticated() {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  return !!(accessToken && refreshToken);
}


export function authHeader() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}


export async function refreshAccessToken() {
  const refresh = getRefreshToken();

  if (!refresh) {
    console.log('[DEBUG] refreshAccessToken: No refresh token found in localStorage.');
    clearTokens();
    throw new Error("Refresh token tidak tersedia. Silakan login kembali.");
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json" 
      },
      body: JSON.stringify({ refresh })
    });

    console.log('[DEBUG] refreshAccessToken: Response status from /auth/refresh:', response.status);

    if (!response.ok) {
        let errorDetailMessage = `Gagal refresh token (status ${response.status}).`;
        let rawErrorResponse = '';

        try {
            
            
            
            const clonedResponse = response.clone(); 
            const errorData = await response.json();
            console.log('[DEBUG] refreshAccessToken: Parsed JSON error data from /auth/refresh:', errorData);

            if (errorData.detail && errorData.code) {
                errorDetailMessage = `Gagal refresh token: ${errorData.code} - ${errorData.detail}`;
            } else if (errorData.detail) {
                errorDetailMessage = `Gagal refresh token: ${errorData.detail}`;
            } else if (errorData.message) {
                errorDetailMessage = `Gagal refresh token: ${errorData.message}`;
            } else {
                errorDetailMessage = `Gagal refresh token (status ${response.status}). Respons tidak mengandung detail error yang diharapkan.`;
            }
        } catch (jsonError) {
            console.error('[DEBUG] refreshAccessToken: Failed to parse error response from /auth/refresh as JSON.', jsonError);
            try {
                
                rawErrorResponse = await (response.clone()).text(); 
                                                                 
                                                                 
                                                                 
                                                                 
                                                                 
                                                                 
                rawErrorResponse = await response.text(); 
                console.log('[DEBUG] refreshAccessToken: Raw error response text (first 500 chars):', rawErrorResponse.substring(0, 500));
            } catch (textError) {
                console.error('[DEBUG] refreshAccessToken: Failed to get raw text from error response.', textError);
            }
            errorDetailMessage = `Gagal refresh token (status ${response.status}). Server tidak mengembalikan JSON yang valid.`;
            if (rawErrorResponse.toLowerCase().includes("<!doctype html>")) {
                errorDetailMessage += " Respons dari server kemungkinan adalah halaman HTML error.";
            } else if (rawErrorResponse) {
                errorDetailMessage += ` Server response: ${rawErrorResponse.substring(0,100)}...`;
            }
        }

        console.log('[DEBUG] refreshAccessToken: Clearing tokens due to refresh failure. Error: ' + errorDetailMessage);
        clearTokens();
        throw new Error(errorDetailMessage);
    }

    const data = await response.json();
    console.log('[DEBUG] refreshAccessToken: Successfully parsed JSON response from /auth/refresh:', data);

    if (!data.access) {
        console.error('[DEBUG] refreshAccessToken: Response OK, but "access" token not found in response data.', data);
        clearTokens();
        throw new Error("Gagal refresh token: Respons tidak mengandung access token baru.");
    }
    
    
    
    
    
    localStorage.setItem("access_token", data.access);
    console.log('[DEBUG] refreshAccessToken: Token refreshed successfully. New access token obtained.');
    return data.access;

  } catch (error) {
    const finalErrorMessage = error.message || "Terjadi kesalahan saat mencoba refresh token. Silakan login kembali.";
    console.error("[DEBUG] refreshAccessToken: Error during token refresh process. Final error message:", finalErrorMessage, "Original error object:", error);

    console.log('[DEBUG] refreshAccessToken: Clearing tokens in overall catch block due to error.');
    clearTokens();

    throw new Error(finalErrorMessage);
  }
}


export function isTokenExpiring() {
  const token = getAccessToken();
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < (currentTime + 300);
  } catch (error) {
    console.error("[DEBUG] isTokenExpiring: Error decoding token or token invalid.", error);
    return true;
  }
}
