const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Ambil token dari localStorage
export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

// Simpan token ke localStorage
export function saveTokens(access, refresh) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

// Hapus semua token (misalnya saat logout)
export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
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
    throw new Error("Refresh token tidak tersedia.");
  }

  const response = await fetch(`${BASE_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ refresh })
  });

  const data = await response.json();

  if (!response.ok) {
    clearTokens();
    throw new Error("Gagal refresh token");
  }

  // Simpan access token baru
  saveTokens(data.access, refresh);
  return data.access;
}
