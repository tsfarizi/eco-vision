import { authHeader, refreshAccessToken } from './token.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fungsi untuk ambil data leaderboard
export async function fetchLeaderboard() {
  try {
    const res = await fetch(`${BASE_URL}/leaderboard/`, {
      headers: {
        ...authHeader(),
        'Content-Type': 'application/json',
      }
    });

    // Jika token kadaluarsa → refresh dan ulangi fetch
    if (res.status === 401) {
      await refreshAccessToken();

      const retryRes = await fetch(`${BASE_URL}/leaderboard/`, {
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json',
        }
      });

      if (!retryRes.ok) throw new Error('Gagal ambil leaderboard setelah refresh');
      return retryRes.json();
    }

    if (!res.ok) throw new Error('Gagal mengambil data leaderboard');

    return res.json();

  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    throw err;
  }
}
