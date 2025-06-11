const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Fungsi login
export async function login(email, password) {
  try {
    const response = await fetch(`${BASE_URL}/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        email, 
        password 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle different error formats from backend
      const errorMessage = data.detail || data.message || data.error || 
                          (data.non_field_errors && data.non_field_errors[0]) ||
                          "Login gagal";
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Fungsi register dengan auto-login
export async function register(name, email, password) {
  try {
    // Step 1: Register user
    const registerResponse = await fetch(`${BASE_URL}/auth/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        username: name,
        email, 
        password 
      })
    });

    const registerData = await registerResponse.json();

    if (!registerResponse.ok) {
      // Handle registration errors
      let errorMessage = "Registrasi gagal";
      
      if (registerData.username && registerData.username[0]) {
        errorMessage = `Username: ${registerData.username[0]}`;
      } else if (registerData.email && registerData.email[0]) {
        errorMessage = `Email: ${registerData.email[0]}`;
      } else if (registerData.password && registerData.password[0]) {
        errorMessage = `Password: ${registerData.password[0]}`;
      } else if (registerData.detail) {
        errorMessage = registerData.detail;
      } else if (registerData.message) {
        errorMessage = registerData.message;
      }
      
      throw new Error(errorMessage);
    }

    // Step 2: Auto login setelah registrasi berhasil
    try {
      const loginData = await login(email, password);
      return {
        ...registerData,
        access: loginData.access,
        refresh: loginData.refresh,
        user: loginData.user,
        auto_login: true
      };
    } catch (loginError) {
      // Jika auto-login gagal, return data registrasi saja
      console.warn("Auto-login failed after registration:", loginError);
      return {
        ...registerData,
        auto_login: false,
        login_required: true
      };
    }

  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
}
