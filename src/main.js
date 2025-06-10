import './styles/styles.css';
import { login, register } from './api/auth.js';
import { classifyImage } from './api/predict.js';
import { fetchLeaderboard } from './api/leaderboard.js';
import { fetchWasteBanks } from './api/wasteBanks.js';

window.showPage = showPage;
window.showSection = showSection;

// Navigasi antar halaman
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  } else {
    const fallback = document.getElementById('not-found-page');
    if (fallback) fallback.classList.add('active');
    console.warn(`Page '${pageId}' not found`);
  }
}

function showSection(sectionId) {
  showPage('main-app');
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  if (sectionId === 'leaderboard') {
    loadLeaderboard();
  } else if (sectionId === 'bank-sampah') {
    loadWasteBanks();
  }
}

// Toggle password visibility
function setupPasswordToggle() {
  const toggle = (inputId, iconId) => {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input && icon) {
      icon.parentElement.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        icon.classList.toggle('bi-eye', !isPassword);
        icon.classList.toggle('bi-eye-slash', isPassword);
      });
    }
  };

  toggle('password', 'eye-icon');
  toggle('register-password', 'register-eye-icon');
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.endsWith('@gmail.com');
}

// Login
function setupLoginForm() {
  const form = document.getElementById('signin-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const warning = document.getElementById('emailWarning');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput?.value?.trim() || '';
    const password = passwordInput?.value || '';

    if (!email || !password) {
      warning.textContent = 'Email dan password harus diisi.';
      return;
    }

    if (!isValidEmail(email)) {
      warning.textContent = 'Gunakan email valid yang berakhiran @gmail.com.';
      return;
    }

    try {
      warning.textContent = '';
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Signing in...';
      submitBtn.disabled = true;

      const response = await login(email, password);
      if (response.access && response.refresh) {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        if (response.user) {
          localStorage.setItem('user_info', JSON.stringify(response.user));
        }
      }

      form.reset();
      showPage('main-app');
      showSection('beranda');
    } catch (err) {
      warning.textContent = err.message || 'Email atau password salah.';
      console.error('Login error:', err);
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Sign In';
        submitBtn.disabled = false;
      }
    }
  });
}

// Register
function setupRegisterForm() {
  const form = document.getElementById('register-form');
  const nameInput = document.getElementById('register-name');
  const emailInput = document.getElementById('register-email');
  const passwordInput = document.getElementById('register-password');
  const warning = document.getElementById('register-email-warning');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput?.value?.trim() || '';
    const email = emailInput?.value?.trim() || '';
    const password = passwordInput?.value || '';

    if (!name || !email || !password) {
      warning.textContent = 'Semua field harus diisi.';
      return;
    }

    if (name.length < 2) {
      warning.textContent = 'Nama minimal 2 karakter.';
      return;
    }

    if (!isValidEmail(email)) {
      warning.textContent = 'Gunakan email valid yang berakhiran @gmail.com.';
      return;
    }

    if (password.length < 6) {
      warning.textContent = 'Password minimal 6 karakter.';
      return;
    }

    try {
      warning.textContent = '';
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Creating account...';
      submitBtn.disabled = true;

      await register(name, email, password);

      form.reset();
      alert('Registrasi berhasil! Silakan login.');
      showPage('signin-page');
    } catch (err) {
      warning.textContent = err.message || 'Registrasi gagal.';
      console.error('Register error:', err);
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Sign Up';
        submitBtn.disabled = false;
      }
    }
  });
}

// Upload dan klasifikasi
function setupFileUpload() {
  const fileInput = document.getElementById('fileElem');
  const uploadArea = document.getElementById('upload-area');
  const submitBtn = document.querySelector('.submit-btn');

  if (!fileInput || !submitBtn) return;

  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    updateUploadArea(file);
  });

  if (uploadArea) {
    uploadArea.addEventListener('dragover', e => {
      e.preventDefault();
      uploadArea.style.borderColor = '#4caf50';
      uploadArea.style.backgroundColor = '#f8fff8';
    });

    uploadArea.addEventListener('dragleave', e => {
      e.preventDefault();
      uploadArea.style.borderColor = '#ccc';
      uploadArea.style.backgroundColor = '#fff';
    });

    uploadArea.addEventListener('drop', e => {
      e.preventDefault();
      uploadArea.style.borderColor = '#ccc';
      uploadArea.style.backgroundColor = '#fff';

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          fileInput.files = files;
          updateUploadArea(file);
        } else {
          alert('Harap upload file gambar.');
        }
      }
    });
  }

  submitBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) return alert('Pilih file terlebih dahulu.');
    if (!file.type.startsWith('image/')) return alert('File harus gambar.');
    if (file.size > 10 * 1024 * 1024) return alert('Maksimal 10MB.');

    try {
      submitBtn.textContent = 'Processing...';
      submitBtn.disabled = true;

      const result = await classifyImage(file);
      displayClassificationResult(result);
    } catch (err) {
      console.error('Classification error:', err);
      alert('Gagal klasifikasi gambar.');
    } finally {
      submitBtn.textContent = 'Classify';
      submitBtn.disabled = false;
    }
  });
}

function updateUploadArea(file) {
  const uploadContent = document.querySelector('.upload-content');
  if (uploadContent && file) {
    uploadContent.innerHTML = `
      <div class="upload-icon">✅</div>
      <strong>File selected:</strong><br>
      <span style="color: #4caf50;">${file.name}</span><br>
      <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
    `;
  }
}

function displayClassificationResult(result) {
  const html = `
    <div style="background: #f0fff0; border: 2px solid #4caf50; border-radius: 12px; padding: 20px; margin: 20px auto; max-width: 500px; text-align: center;">
      <h3 style="color: #2e7d32; margin-bottom: 15px;">🎯 Hasil Klasifikasi</h3>
      <strong>Jenis Sampah:</strong><br>
      <span style="font-size: 18px; color: #4caf50; font-weight: bold;">${result.prediction || 'Tidak diketahui'}</span><br>
      ${result.confidence ? `<div>Tingkat Kepercayaan: ${(result.confidence * 100).toFixed(1)}%</div>` : ''}
      ${result.recommendation ? `<p>${result.recommendation}</p>` : ''}
      ${result.points ? `<div style="color: #ff9800; font-weight: bold;">+${result.points} Poin! 🏆</div>` : ''}
    </div>
  `;
  const container = document.querySelector('.klasifikasi-main');
  const old = container.querySelector('.classification-result');
  if (old) old.remove();

  const resultDiv = document.createElement('div');
  resultDiv.className = 'classification-result';
  resultDiv.innerHTML = html;
  container.insertBefore(resultDiv, container.querySelector('.upload-area'));
}

async function loadLeaderboard() {
  const container = document.getElementById('leaderboard-content');
  if (!container) return;

  try {
    container.innerHTML = 'Loading...';
    const data = await fetchLeaderboard();
    if (data && data.length > 0) {
      container.innerHTML = data.map((user, i) => `
        <div>${i + 1}. ${user.name || 'Anon'} - ${user.level || 1} - ${user.exp || 0} pts</div>
      `).join('');
    } else {
      container.innerHTML = 'Belum ada data leaderboard.';
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    container.innerHTML = 'Gagal memuat leaderboard.';
  }
}

async function loadWasteBanks() {
  const container = document.getElementById('bank-sampah-content');
  if (!container) return;

  try {
    container.innerHTML = 'Memuat data...';
    const data = await fetchWasteBanks();
    if (data.length === 0) {
      container.innerHTML = 'Tidak ada data tersedia.';
    } else {
      container.innerHTML = 'Data berhasil dimuat.';
      // Tambahkan render visual di sini
    }
  } catch (error) {
    console.error('Error loading waste banks:', error);
    container.innerHTML = 'Gagal memuat data bank sampah.';
  }
}

function checkAuthStatus() {
  return localStorage.getItem('access_token') && localStorage.getItem('refresh_token');
}

function logout() {
  localStorage.clear();
  showPage('landing-page');
}
window.logout = logout;

document.addEventListener('DOMContentLoaded', () => {
  console.log('EcoVision Frontend initialized');
  setupPasswordToggle();
  setupLoginForm();
  setupRegisterForm();
  setupFileUpload();

  if (checkAuthStatus()) {
    console.log('User already authenticated');
  }

  setupNavigationStates();
});

// Setup active link highlight
function setupNavigationStates() {
  const navLinks = document.querySelectorAll('.main-nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', function () {
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

// Global error fallback (opsional tapi disarankan)
window.addEventListener('error', e => {
  console.error('Unhandled Error:', e.message);
});

window.addEventListener('unhandledrejection', e => {
  console.error('Unhandled Promise:', e.reason);
});
