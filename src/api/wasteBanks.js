import { authHeader, refreshAccessToken } from './token.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fungsi untuk ambil daftar bank sampah
export async function fetchWasteBanks() {
  async function sendRequest() {
    return await fetch(`${BASE_URL}/waste-banks/`, {
      method: 'GET',
      headers: {
        ...authHeader(),
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    let res = await sendRequest();

    if (res.status === 401) {
      await refreshAccessToken();
      res = await sendRequest();
    }

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Gagal mengambil data bank sampah');
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("Error fetch waste banks:", err);
    throw err;
  }
}
