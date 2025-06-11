import { saveTokens, clearTokens } from './token.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

    if (!response.ok) {
      let errorMessage = "Login gagal";
      
      try {
        const data = await response.json();
        
        if (data.non_field_errors && data.non_field_errors.length > 0) {
          errorMessage = data.non_field_errors[0];
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else {
          errorMessage = `Server error: ${response.status}`;
        }
      } catch (parseError) {
        errorMessage = `Network error: ${response.status} - ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    
    if (data.access_token && data.refresh_token) {
      saveTokens(data.access_token, data.refresh_token, data.user);
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user
      };
    } else {
      
      throw new Error("Login response did not contain expected tokens.");
    }

  } catch (error) {
    console.error("Login error:", error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.");
    } else if (error.message.includes('ERR_EMPTY_RESPONSE')) {
      throw new Error("Server tidak merespons. Cek koneksi Docker backend.");
    }
    
    throw error;
  }
}

export async function register(name, email, password) {
  try {
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

    if (!registerResponse.ok) {
      let errorMessage = "Registrasi gagal";
      
      try {
        const registerData = await registerResponse.json();
        
        
        
        if (registerData.email && registerData.email.length > 0) {
          errorMessage = `Email: ${registerData.email[0]}`;
        } else if (registerData.username && registerData.username.length > 0) {
          errorMessage = `Username: ${registerData.username[0]}`;
        } else if (registerData.password && registerData.password.length > 0) {
          errorMessage = `Password: ${registerData.password[0]}`;
        } else if (registerData.detail) {
          errorMessage = registerData.detail;
        } else if (registerData.message) {
          errorMessage = registerData.message;
        } else {
          
          const errorKeys = Object.keys(registerData);
          if (errorKeys.length > 0) {
            let messages = [];
            errorKeys.forEach(key => {
              if (Array.isArray(registerData[key]) && registerData[key].length > 0) {
                messages.push(`${key}: ${registerData[key][0]}`);
              }
            });
            if (messages.length > 0) {
              errorMessage = messages.join('; ');
            } else {
              errorMessage = `Server error: ${registerResponse.status}`;
            }
          } else {
            errorMessage = `Server error: ${registerResponse.status}`;
          }
        }
      } catch (parseError) {
        errorMessage = `Network error: ${registerResponse.status} - ${registerResponse.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const registerData = await registerResponse.json();

    
    if (registerData.access_token && registerData.refresh_token && registerData.user) {
      saveTokens(registerData.access_token, registerData.refresh_token, registerData.user);
      return {
        access_token: registerData.access_token,
        refresh_token: registerData.refresh_token,
        user: registerData.user
      };
    } else {
      
      console.error("Registration response did not contain expected tokens or user data.", registerData);
      throw new Error("Registrasi berhasil, tetapi data tidak lengkap. Silakan coba login.");
    }

  } catch (error) {
    console.error("Register error:", error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.");
    } else if (error.message.includes('ERR_EMPTY_RESPONSE')) {
      throw new Error("Server tidak merespons. Cek koneksi Docker backend.");
    }
    
    throw error;
  }
}

export function logout() {
  clearTokens();
  if (typeof window !== 'undefined' && window.showPage) {
    window.showPage('landing-page');
  }
}

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
