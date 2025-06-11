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

    // FIXED: Cek apakah response kosong atau error jaringan
    if (!response.ok) {
      let errorMessage = "Login gagal";
      
      try {
        const data = await response.json();
        errorMessage = data.detail || data.message || data.error || 
                      (data.non_field_errors && data.non_field_errors[0]) ||
                      `Server error: ${response.status}`;
      } catch (parseError) {
        // Jika response tidak bisa di-parse sebagai JSON
        errorMessage = `Network error: ${response.status} - ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Login error:", error);
    
    // FIXED: Berikan pesan error yang lebih jelas
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.");
    } else if (error.message.includes('ERR_EMPTY_RESPONSE')) {
      throw new Error("Server tidak merespons. Cek koneksi Docker backend.");
    }
    
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

    // FIXED: Handle network errors dan empty response
    if (!registerResponse.ok) {
      let errorMessage = "Registrasi gagal";
      
      try {
        const registerData = await registerResponse.json();
        
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
        } else {
          errorMessage = `Server error: ${registerResponse.status}`;
        }
      } catch (parseError) {
        errorMessage = `Network error: ${registerResponse.status} - ${registerResponse.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const registerData = await registerResponse.json();

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
    
    // FIXED: Berikan pesan error yang lebih jelas
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.");
    } else if (error.message.includes('ERR_EMPTY_RESPONSE')) {
      throw new Error("Server tidak merespons. Cek koneksi Docker backend.");
    }
    
    throw error;
  }
}

// TAMBAHAN: Function untuk test koneksi backend
export async function testBackendConnection() {
  try {
    const response = await fetch(`${BASE_URL}/health/`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error("Backend connection test failed:", error);
    return false;
  }
}
