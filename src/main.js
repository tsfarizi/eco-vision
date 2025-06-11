import './styles/styles.css';
import { login, register } from './api/auth.js';
import { classifyImage } from './api/predict.js';
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
    
    // Load content dinamis sesuai halaman
    if (pageId === 'main-app') {
      loadMainAppContent();
    }
  } else {
    const fallback = document.getElementById('not-found-page');
    if (fallback) fallback.classList.add('active');
    console.warn(`Page '${pageId}' not found`);
  }
}

function showSection(sectionId) {
  showPage('main-app');
  
  // Hide all sections first
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show target section
  let targetSection = document.getElementById(sectionId);
  if (!targetSection) {
    // Create section if not exists
    targetSection = createSection(sectionId);
  }
  
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Load section-specific content
  if (sectionId === 'bank-sampah') {
    loadWasteBanks();
  }
}

// Create dynamic sections
function createSection(sectionId) {
  const mainApp = document.getElementById('main-app');
  if (!mainApp) return null;

  const section = document.createElement('div');
  section.id = sectionId;
  section.className = 'section';
  
  switch(sectionId) {
    case 'beranda':
      section.innerHTML = createBerandaContent();
      break;
    case 'informasi':
      section.innerHTML = createInformasiContent();
      break;
    case 'klasifikasi':
      section.innerHTML = createKlasifikasiContent();
      break;
    case 'bank-sampah':
      section.innerHTML = createBankSampahContent();
      break;
    default:
      section.innerHTML = `<div class="container"><h1>Section ${sectionId}</h1><p>Content will be loaded here.</p></div>`;
  }
  
  mainApp.appendChild(section);
  return section;
}

function createBerandaContent() {
  return `
    <section class="hero-section">
      <div class="hero-left">
        <h1>Selamat Datang di<br><span class="highlight-green">EcoVision</span></h1>
      </div>
      <div class="hero-right">
        <p>Platform cerdas untuk klasifikasi sampah menggunakan teknologi AI dengan pendekatan gamifikasi.</p>
        <p>Mulai kontribusi Anda untuk lingkungan yang lebih bersih!</p>
        <button class="cta-button" onclick="showSection('klasifikasi')">
          Mulai Klasifikasi 🚀
        </button>
      </div>
    </section>

    <div class="hero-illustration">
      <img src="/img/hero.png" alt="EcoVision Hero" />
    </div>

    <section class="tentang-section">
      <div class="tentang-header">
        <img src="/img/recycle.png" alt="Recycle Icon" class="tentang-icon" />
        <h2>Tentang <span>EcoVision</span></h2>
      </div>
      <p class="tentang-desc">
        EcoVision adalah platform inovatif yang menggabungkan teknologi AI dengan gamifikasi 
        untuk memudahkan masyarakat dalam mengelola sampah secara cerdas dan berkelanjutan.
      </p>
      <ul class="tentang-features">
        <li>Klasifikasi sampah otomatis dengan AI</li>
        <li>Sistem poin dan level untuk motivasi</li>
        <li>Lokasi bank sampah terdekat</li>
        <li>Edukasi pengelolaan sampah</li>
        <li>Leaderboard komunitas</li>
      </ul>
    </section>
  `;
}

function createInformasiContent() {
  return `
    <div class="info-main">
      <h1>Panduan Informasi</h1>
      <p class="intro">Pelajari cara mengelola sampah dengan baik untuk lingkungan yang lebih bersih</p>
      
      <div class="icon-list">
        <div class="icon-item">
          <img src="/img/pilah.png" alt="Pilah Sampah" />
          <span>Pilah Sampah</span>
        </div>
        <div class="icon-item">
          <img src="/img/daur.png" alt="Daur Ulang" />
          <span>Daur Ulang</span>
        </div>
        <div class="icon-item">
          <img src="/img/tempat_sampah.png" alt="Buang Sampah" />
          <span>Buang di Tempatnya</span>
        </div>
      </div>

      <div class="card-grid">
        <div class="card">
          <h3>🔄 Sampah Organik</h3>
          <p>Sampah yang berasal dari makhluk hidup seperti sisa makanan, daun, dan buah-buahan. Dapat diolah menjadi kompos.</p>
        </div>
        <div class="card">
          <h3>♻️ Sampah Anorganik</h3>
          <p>Sampah dari bahan non-hayati seperti plastik, kaca, dan logam. Dapat didaur ulang menjadi produk baru.</p>
        </div>
        <div class="card">
          <h3>⚠️ Sampah B3</h3>
          <p>Bahan Berbahaya dan Beracun seperti baterai, lampu neon. Memerlukan penanganan khusus.</p>
        </div>
        <div class="card">
          <h3>🏥 Sampah Medis</h3>
          <p>Limbah dari fasilitas kesehatan yang memerlukan penanganan dan pembuangan khusus.</p>
        </div>
      </div>
    </div>
  `;
}

function createKlasifikasiContent() {
  return `
    <div class="klasifikasi-main">
      <h1>Klasifikasi Sampah</h1>
      <p class="desc">Upload gambar sampah untuk mendapatkan klasifikasi otomatis</p>
      <p class="subdesc">Format: JPG, PNG, WEBP (Max: 10MB)</p>
      
      <div class="upload-area" id="upload-area" onclick="document.getElementById('fileElem').click()">
        <div class="upload-content">
          <div class="upload-icon">📁</div>
          <strong>Klik atau drag & drop gambar di sini</strong><br>
          <small>Pastikan gambar sampah terlihat jelas</small>
        </div>
      </div>
      
      <input type="file" id="fileElem" accept="image/*" style="display: none;" />
      <button class="submit-btn">Classify</button>
    </div>
  `;
}

function createBankSampahContent() {
  return `
    <div class="container-bank">
      <div class="card-full">
        <div class="left">
          <img src="/img/recycle-symbol.png" alt="Bank Sampah" class="icon-image" />
          <h3>Bank Sampah Terdekat</h3>
        </div>
        <div class="right">15</div>
      </div>
      
      <div class="card center">
        <p><strong>Total Poin Anda: 245</strong></p>
        <button class="btn">Setor Sampah</button>
      </div>
      
      <div class="grid-bank">
        <div class="card classification">
          <div class="left">
            <img src="/img/klasifikasi.png" alt="Klasifikasi" />
            <strong>Jenis Sampah yang Diterima</strong>
          </div>
          <div class="tags">
            <button>Plastik</button>
            <button>Kertas</button>
            <button>Logam</button>
            <button>Kaca</button>
          </div>
        </div>
        
        <div class="card map">
          <div class="map-placeholder">
            🗺️ Peta Lokasi<br>
            <small>Loading...</small>
          </div>
          <div id="bank-sampah-content">Memuat lokasi...</div>
        </div>
      </div>
    </div>
  `;
}

function loadMainAppContent() {
  // Set default section to beranda
  showSection('beranda');
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
  return emailRegex.test(email);
}

// Login function
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
      warning.textContent = 'Gunakan email yang valid.';
      return;
    }

    try {
      warning.textContent = '';
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Signing in...';
      submitBtn.disabled = true;

      const response = await login(email, password);
      
      // Store tokens
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

// Register function with auto-login
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

    // Validasi input
    if (!name || !email || !password) {
      warning.textContent = 'Semua field harus diisi.';
      return;
    }

    if (name.length < 2) {
      warning.textContent = 'Nama minimal 2 karakter.';
      return;
    }

    if (!isValidEmail(email)) {
      warning.textContent = 'Gunakan email yang valid.';
      return;
    }

    if (password.length < 8) {
      warning.textContent = 'Password minimal 8 karakter.';
      return;
    }

    try {
      warning.textContent = '';
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Creating account...';
      submitBtn.disabled = true;

      const response = await register(name, email, password);

      form.reset();

      // Check if auto-login successful
      if (response.auto_login && response.access && response.refresh) {
        // Store tokens from auto-login
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        if (response.user) {
          localStorage.setItem('user_info', JSON.stringify(response.user));
        }

        // Show success message and redirect to main app
        alert('🎉 Registrasi berhasil! Selamat datang di EcoVision!');
        showPage('main-app');
        showSection('beranda');
      } else {
        // Manual login required
        alert('Registrasi berhasil! Silakan login untuk melanjutkan.');
        showPage('signin-page');
      }

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
      alert('Gagal klasifikasi gambar. Pastikan Anda sudah login dan backend berjalan.');
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

async function loadWasteBanks() {
  const container = document.getElementById('bank-sampah-content');
  if (!container) return;

  try {
    container.innerHTML = 'Memuat data...';
    const data = await fetchWasteBanks();
    if (data && data.length > 0) {
      container.innerHTML = `
        <div style="font-size: 12px;">
          <strong>Ditemukan ${data.length} lokasi</strong><br>
          ${data.map(bank => `• ${bank.name || 'Bank Sampah'}`).slice(0, 3).join('<br>')}
        </div>
      `;
    } else {
      container.innerHTML = 'Tidak ada data tersedia.';
    }
  } catch (error) {
    console.error('Error loading waste banks:', error);
    container.innerHTML = 'Gagal memuat data.';
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

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  console.log('EcoVision Frontend initialized');
  
  setupPasswordToggle();
  setupLoginForm();
  setupRegisterForm();
  
  // Setup file upload dengan delay untuk memastikan DOM ready
  setTimeout(() => {
    setupFileUpload();
  }, 100);

  if (checkAuthStatus()) {
    console.log('User already authenticated');
    showPage('main-app');
    showSection('beranda');
  } else {
    showPage('landing-page');
  }

  setupNavigationStates();
});

// Global error handlers
window.addEventListener('error', e => {
  console.error('Unhandled Error:', e.message);
});

window.addEventListener('unhandledrejection', e => {
  console.error('Unhandled Promise:', e.reason);
});
