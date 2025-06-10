import { authHeader, refreshAccessToken } from './token.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fungsi untuk klasifikasi gambar
export async function classifyImage(file) {
  const formData = new FormData();
  formData.append('image', file); // pastikan backend pakai key `image`

  async function sendRequest() {
    return await fetch(`${BASE_URL}/predict/`, {
      method: 'POST',
      headers: {
        ...authHeader(), // pakai Authorization Bearer token
        // jangan set Content-Type! Browser akan otomatis karena pakai FormData
      },
      body: formData
    });
  }

  try {
    let res = await sendRequest();

    // Cek kalau token expired
    if (res.status === 401) {
      await refreshAccessToken();
      res = await sendRequest(); // ulangi request setelah refresh
    }

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Gagal klasifikasi gambar');
    }

    const data = await res.json();
    return data; // hasil klasifikasi & rekomendasi

  } catch (err) {
    console.error('Error klasifikasi gambar:', err);
    throw err;
  }
}
