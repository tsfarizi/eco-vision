const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fungsi login
export async function login(email, password) {
  try {
    const response = await fetch(`${BASE_URL}/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login gagal");
    }

    // Return data yang berisi access dan refresh token
    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Fungsi register
export async function register(name, email, password) {
  try {
    const response = await fetch(`${BASE_URL}/auth/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registrasi gagal");
    }

    return data;
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
}