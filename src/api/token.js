const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
export function saveTokens(access, refresh, user = null) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  
  if (user) {
    localStorage.setItem("user_info", JSON.stringify(user));
  }
}

// Hapus semua token (misalnya saat logout)
export function clearTokens() {
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
    console.warn("Refresh token tidak tersedia");
    clearTokens();
    
    // Safe navigation - check if showPage function exists
    if (typeof window !== 'undefined' && typeof window.showPage === 'function') {
      window.showPage('signin-page');
    } else if (typeof showPage === 'function') {
      showPage('signin-page');
    } else {
      // Fallback - reload page
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh })
    });

    if (!response.ok) {
      console.warn("Refresh token gagal, status:", response.status);
      clearTokens();
      
      // Safe navigation
      if (typeof window !== 'undefined' && typeof window.showPage === 'function') {
        window.showPage('signin-page');
      } else if (typeof showPage === 'function') {
        showPage('signin-page');
      } else {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
      return null;
    }

    const data = await response.json();
    
    // Simpan access token baru, refresh token tetap sama
    localStorage.setItem("access_token", data.access);
    
    return data.access;
  } catch (error) {
    console.error("Error saat refresh token:", error);
    clearTokens();
    
    // Safe navigation
    if (typeof window !== 'undefined' && typeof window.showPage === 'function') {
      window.showPage('signin-page');
    } else if (typeof showPage === 'function') {
      showPage('signin-page');
    } else {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
    return null;
  }
}

// Fungsi untuk cek apakah token akan expired (optional)
export function isTokenExpiring() {
  const token = getAccessToken();
  if (!token) return true;

  try {
    // Decode JWT payload (simple base64 decode)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    // Cek apakah token akan expired dalam 5 menit
    return payload.exp < (currentTime + 300);
  } catch (error) {
    console.error("Error checking token expiry:", error);
    return true; // Anggap expired jika error
  }
}

// Fungsi untuk automatic token refresh
export async function ensureValidToken() {
  if (!isAuthenticated()) {
    return null;
  }

  if (isTokenExpiring()) {
    console.log("Token akan expired, melakukan refresh...");
    return await refreshAccessToken();
  }

  return getAccessToken();
}
