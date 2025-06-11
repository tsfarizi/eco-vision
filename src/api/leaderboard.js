import { fetchWithAuth, handleResponse } from './fetchWithAuth.js';

export async function fetchLeaderboard() {
  try {
    const response = await fetchWithAuth('/leaderboard/', {
      method: 'GET'
      });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching leaderboard:", error.message); 
    throw error;
  }
}
