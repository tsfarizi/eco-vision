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
    clearTokens(); // Clear semua token jika refresh token tidak ada
    throw new Error("Refresh token tidak tersedia. Silakan login kembali.");
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh })
    });

    const data = await response.json();

    if (!response.ok) {
      clearTokens(); // Clear semua token jika refresh gagal
      throw new Error(data.detail || data.message || "Gagal refresh token. Silakan login kembali.");
    }

    // Simpan access token baru, refresh token tetap sama
    localStorage.setItem("access_token", data.access);
    
    return data.access;
  } catch (error) {
    clearTokens(); // Clear semua token jika ada error
    throw new Error("Gagal refresh token. Silakan login kembali.");
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
