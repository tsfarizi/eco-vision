const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Ambil token dari localStorage
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

// Simpan token ke localStorage
export function saveTokens(access_token, refresh_token, user = null) {
  localStorage.setItem("access_token", access_token);
  localStorage.setItem("refresh_token", refresh_token);
  
  if (user) {
    localStorage.setItem("user_info", JSON.stringify(user));
  }
}

// Hapus semua token (misalnya saat logout)
export function clearTokens() {
  console.log('[DEBUG] clearTokens: Clearing all tokens from localStorage.');
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_info");
}

// Cek apakah user sudah login
export function isAuthenticated() {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  return !!(accessToken && refreshToken);
}

// Tambahkan Authorization Header ke request
export function authHeader() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Fungsi untuk refresh access token
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
        "Accept": "application/json" // Added Accept header
      },
      body: JSON.stringify({ refresh })
    });

    console.log('[DEBUG] refreshAccessToken: Response status from /auth/refresh:', response.status);

    if (!response.ok) {
        let errorDetailMessage = `Gagal refresh token (status ${response.status}).`;
        let rawErrorResponse = '';

        try {
            // Attempt to parse as JSON first
            // response.json() consumes the body. If it fails, we can't re-read as text from original `response` easily.
            // Cloning is safer if we anticipate needing to read the body multiple ways.
            const clonedResponse = response.clone(); // Clone for potential multiple reads
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
                // If JSON parsing failed, try to get the raw text from the *cloned* response
                rawErrorResponse = await (response.clone()).text(); // Use a new clone from original 'response' if first .json() on original failed and disturbed it.
                                                                 // Or use the first clone if .json() was on the clone.
                                                                 // Safest: use a fresh clone of the original `response` if available or the first clone if .json() was on it.
                                                                 // The initial `response.clone()` was not used by `response.json()`. Let's assume `response.json()` was on original.
                                                                 // So, we use `response.text()` on the original `response` object if `.json()` failed.
                                                                 // If `response.json()` was actually on `clonedResponse`, then we'd use `clonedResponse.text()`.
                                                                 // The prompt implies `response.json()` is on original.
                rawErrorResponse = await response.text(); // Try reading the original response as text
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
    
    // NOTE: The /auth/refresh endpoint currently only returns a new access token.
    // It does not return updated user information or a new refresh token.
    // Therefore, only the access_token in localStorage is updated here.
    // User information and the refresh token are only fully updated upon login/register.
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

// Fungsi untuk cek apakah token akan expired (optional)
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
