import { fetchWithAuth, handleResponse } from './fetchWithAuth.js';

// const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; // No longer needed directly

export async function fetchLeaderboard() {
  try {
    // OpenAPI spec shows /leaderboard/ with a trailing slash
    const response = await fetchWithAuth('/leaderboard/', {
      method: 'GET'
      // authHeader, Content-Type, and Accept are handled by fetchWithAuth
    });
    // Response structure as per OpenAPI: { leaderboard: [], your_rank, total_users, offset, limit }
    return await handleResponse(response);
  } catch (error) {
    // handleResponse will throw an error with a message (e.g., from error.detail or a generic one)
    console.error("Error fetching leaderboard:", error.message); // Log err.message
    // Re-throw the error object itself, which should contain a message
    // UI can then display error.message directly
    throw error;
  }
}
