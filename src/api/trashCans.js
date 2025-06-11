import { fetchWithAuth, handleResponse } from './fetchWithAuth.js';
export async function fetchTrashCans() {
  try {
    const response = await fetchWithAuth('/trash-cans', {
      method: 'GET'
    });
    return await handleResponse(response);
  } catch (error) {
    
    console.error("Error fetching trash cans:", error.message); 
    throw error;
  }
}
