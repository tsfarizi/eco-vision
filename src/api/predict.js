import { authHeader, refreshAccessToken, getRefreshToken } from './token.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Fungsi untuk klasifikasi gambar
export async function classifyImage(file) {
  // Cek token refresh dulu sebelum request
  if (!getRefreshToken()) {
    throw new Error('Sesi Anda telah habis. Silakan login kembali.');
  }

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
      try {
        await refreshAccessToken();
        res = await sendRequest(); // ulangi request setelah refresh
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        throw new Error('Sesi Anda telah habis. Silakan login kembali.');
      }
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errData.message || errData.detail || `HTTP ${res.status}: Gagal klasifikasi gambar`);
    }

    const data = await res.json();
    console.log('Classification response:', data);
    return data; // hasil klasifikasi & rekomendasi

  } catch (err) {
    console.error('Error klasifikasi gambar:', err);
    
    // Handle network errors
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.');
    }
    
    throw err;
  }
}
