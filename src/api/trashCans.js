import { fetchWithAuth, handleResponse } from './fetchWithAuth.js';

// const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; // No longer needed directly

export async function fetchTrashCans() {
  try {
    const response = await fetchWithAuth('/trash-cans', {
      method: 'GET'
      // authHeader, Content-Type, and Accept are handled by fetchWithAuth
    });
    // OpenAPI spec indicates an array of TrashCan objects
    return await handleResponse(response);
  } catch (error) {
    // handleResponse will throw an error with a message (e.g., from error.detail or a generic one)
    console.error("Error fetching trash cans:", error.message); // Log err.message
    // Re-throw the error object itself, which should contain a message
    // UI can then display error.message directly
    throw error;
  }
}
