import './styles/styles.css';
import { login, register } from './api/auth.js';
import { handleClassification } from './api/predict.js';
import { fetchWasteBanks } from './api/wasteBanks.js';
import { initializeMap, resizeMap } from './api/wasteBanks.js';

window.showPage = showPage;
window.showSection = showSection;


let isNavigating = false;

function showPage(pageId) {
  console.log('[DEBUG] showPage: Called with pageId:', pageId);
  if (isNavigating) {
    console.log('[DEBUG] showPage: Navigation locked, returning for pageId:', pageId);
    return;
  }
  isNavigating = true;
  
  try {
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      console.log('[DEBUG] showPage: Showing page element:', targetPage);
      targetPage.classList.add('active');
      
      if (pageId === 'main-app') {
        
        loadMainAppContent();
      }
    } else {
      const fallback = document.getElementById('not-found-page');
      if (fallback) fallback.classList.add('active');
      console.warn(`[DEBUG] showPage: Page '${pageId}' not found. Showing fallback.`);
    }
  } finally {
    isNavigating = false;
  }
}

function showSection(sectionId) {
  console.log('[DEBUG] showSection: Called with sectionId:', sectionId);
  if (isNavigating) {
    console.log('[DEBUG] showSection: Navigation locked, returning for sectionId:', sectionId);
    return;
  }
  isNavigating = true;
  
  try {
    const mainApp = document.getElementById('main-app');
    if (!mainApp || !mainApp.classList.contains('active')) {
      console.log('[DEBUG] showSection: main-app page not active, activating it.');
      document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
      });
      if (mainApp) {
        mainApp.classList.add('active');
      }
    }
    
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active');
    });
    
    let targetSection = document.getElementById(sectionId);
    if (!targetSection) {
      console.log(`[DEBUG] showSection: Section '${sectionId}' not found, creating it.`);
      targetSection = createSection(sectionId); 
    }
    
    if (targetSection) {
      console.log('[DEBUG] showSection: Section element to show:', targetSection);
      targetSection.classList.add('active');
      console.log(`[DEBUG] showSection: Section '${sectionId}' is now active.`);

      
      if (sectionId === 'bank-sampah') {
        console.log('[DEBUG] showSection: Initializing map for bank-sampah section.');
        initializeMap(); 
        setTimeout(() => {
          console.log('[DEBUG] showSection: Attempting to resize map for bank-sampah section after short delay.');
          resizeMap(); 
        }, 150);
      } else if (sectionId === 'klasifikasi') {
        console.log('[DEBUG] showSection: Initializing file upload for klasifikasi section.');
        setupFileUpload();
      }
    } else {
      console.warn(`[DEBUG] showSection: Target section '${sectionId}' could not be found or created.`);
    }
  } finally {
    isNavigating = false;
  }
}

function createSection(sectionId) {
  console.log(`[DEBUG] createSection: Called for sectionId: ${sectionId}`);
  const mainApp = document.getElementById('main-app');
  if (!mainApp) {
    console.error("[DEBUG] createSection: main-app element not found!");
    return null;
  }
  const section = document.createElement('div');
  section.id = sectionId;
  section.className = 'section';
  switch(sectionId) {
    case 'beranda': section.innerHTML = createBerandaContent(); break;
    case 'informasi': section.innerHTML = createInformasiContent(); break;
    case 'klasifikasi': section.innerHTML = createKlasifikasiContent(); break;
    case 'bank-sampah': section.innerHTML = createBankSampahContent(); break; 
    default: section.innerHTML = `<div class="container"><h1>Section ${sectionId}</h1><p>Content will be loaded here.</p></div>`;
  }
  mainApp.appendChild(section);
  console.log(`[DEBUG] createSection: Appended new section '${sectionId}' to main-app.`);
  return section;
}

function createBerandaContent() {
  return `
    <section class="hero-section"><div class="hero-left"><h1>Selamat Datang di<br><span class="highlight-green">EcoVision</span></h1></div><div class="hero-right"><p>Platform cerdas untuk klasifikasi sampah menggunakan teknologi AI dengan pendekatan gamifikasi.</p><p>Mulai kontribusi Anda untuk lingkungan yang lebih bersih!</p><button class="cta-button" onclick="showSection('klasifikasi')">Mulai Klasifikasi 🚀</button></div></section>
    <div class="hero-illustration"><img src="img/hero.png" alt="EcoVision Hero" /></div>
    <section class="tentang-section"><div class="tentang-header"><img src="img/recycle.png" alt="Recycle Icon" class="tentang-icon" /><h2>Tentang <span>EcoVision</span></h2></div><p class="tentang-desc">EcoVision adalah platform inovatif yang menggabungkan teknologi AI dengan gamifikasi untuk memudahkan masyarakat dalam mengelola sampah secara cerdas dan berkelanjutan.</p><ul class="tentang-features"><li>Klasifikasi sampah otomatis dengan AI</li><li>Sistem poin dan level untuk motivasi</li><li>Lokasi bank sampah terdekat</li><li>Edukasi pengelolaan sampah</li><li>Leaderboard komunitas</li></ul></section>`;
}
function createInformasiContent() {
  return `
    <div class="info-main"><h1>Panduan Informasi</h1><p class="intro">Pelajari cara mengelola sampah dengan baik untuk lingkungan yang lebih bersih</p><div class="icon-list"><div class="icon-item"><img src="img/pilah.png" alt="Pilah Sampah" /><span>Pilah Sampah</span></div><div class="icon-item"><img src="img/daur.png" alt="Daur Ulang" /><span>Daur Ulang</span></div><div class="icon-item"><img src="img/tempat_sampah.png" alt="Buang Sampah" /><span>Buang di Tempatnya</span></div></div><div class="card-grid"><div class="card"><h3>🔄 Sampah Organik</h3><p>Sampah yang berasal dari makhluk hidup seperti sisa makanan, daun, dan buah-buahan. Dapat diolah menjadi kompos.</p></div><div class="card"><h3>♻️ Sampah Anorganik</h3><p>Sampah dari bahan non-hayati seperti plastik, kaca, dan logam. Dapat didaur ulang menjadi produk baru.</p></div><div class="card"><h3>⚠️ Sampah B3</h3><p>Bahan Berbahaya dan Beracun seperti baterai, lampu neon. Memerlukan penanganan khusus.</p></div><div class="card"><h3>🏥 Sampah Medis</h3><p>Limbah dari fasilitas kesehatan yang memerlukan penanganan dan pembuangan khusus.</p></div></div></div>`;
}
function createKlasifikasiContent() {
  return `
    <div class="klasifikasi-main"><h1>Klasifikasi Sampah</h1><p class="desc">Upload gambar sampah untuk mendapatkan klasifikasi otomatis</p><p class="subdesc">Format: JPG, PNG, WEBP (Max: 10MB)</p><div class="upload-area" id="upload-area" onclick="document.getElementById('fileElem').click()"><div class="upload-content"><div class="upload-icon">📁</div><strong>Klik atau drag & drop gambar di sini</strong><br><small>Pastikan gambar sampah terlihat jelas</small></div></div><input type="file" id="fileElem" accept="image/*" style="display: none;" /><button class="submit-btn">Classify</button></div>`;
}


function createBankSampahContent() {
  return `
    <div class="container-bank">
      <div class="card-full">
      </div>
      <div class="card center">
      </div>
      <div class="grid-bank">
        <div class="card map">
          <div class="map-frame-container">
            <div class="map-placeholder">
              🗺️ Peta Lokasi Bank Sampah & Tempat Sampah<br><small>Loading map...</small>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function loadMainAppContent() {
  console.log('[DEBUG] loadMainAppContent: Called.');
  const activeSections = document.querySelectorAll('#main-app .section.active');
  if (activeSections.length === 0) {
    console.log('[DEBUG] loadMainAppContent: No active section found, showing beranda.');
    showSection('beranda');
  } else {
    console.log('[DEBUG] loadMainAppContent: Active section already exists:', activeSections[0].id);
  }
}

function setupPasswordToggle() {
  const toggle = (inputId, iconId) => {
    const input = document.getElementById(inputId); const icon = document.getElementById(iconId);
    if (input && icon) {
      icon.parentElement.addEventListener('click', () => {
        const isPassword = input.type === 'password'; input.type = isPassword ? 'text' : 'password';
        icon.classList.toggle('bi-eye', !isPassword); icon.classList.toggle('bi-eye-slash', isPassword);
      });}};
  toggle('password', 'eye-icon'); toggle('register-password', 'register-eye-icon');
}
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

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
    if (!email || !password) { warning.textContent = 'Email dan password harus diisi.'; return; }
    if (!isValidEmail(email)) { warning.textContent = 'Gunakan email yang valid.'; return; }

    try {
      warning.textContent = '';
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Signing in...';
      submitBtn.disabled = true;

      const response = await login(email, password);

      console.log('[DEBUG] main.js login success: Login API call successful. Raw response:', response);
      console.log('[DEBUG] main.js login success: Login API call successful. Stringified response:', JSON.stringify(response, null, 2));

      const canProceed = response && response.access_token && response.refresh_token;
      console.log('[DEBUG] main.js login success: Condition for token storage and transition met (access_token exists):', canProceed);

      if (canProceed) {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        if (response.user) {
          localStorage.setItem('user_info', JSON.stringify(response.user));
          console.log('[DEBUG] main.js login success: User info stored:', JSON.stringify(response.user, null, 2));
        }
        console.log('[DEBUG] main.js login success: Tokens stored in localStorage.');
      } else {
        console.warn('[DEBUG] main.js login success: Login response did not contain expected tokens. Transition might fail or lead to auth issues.');
      }

      form.reset();

      console.log('[DEBUG] main.js login success: Tokens presumably stored. Attempting to transition to main-app page...');
      showPage('main-app');

    } catch (err) {
      console.error('[DEBUG] main.js login.catch: Login API call failed:', err.message, 'Full error object:', err);
      warning.textContent = err.message || 'Email atau password salah.';
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Sign In';
        submitBtn.disabled = false;
      }
    }
  });
}

async function setupRegisterForm() {
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
    if (!name || !email || !password) { warning.textContent = 'Semua field harus diisi.'; return; }
    if (!isValidEmail(email)) { warning.textContent = 'Gunakan email yang valid.'; return; }

    try {
      warning.textContent = '';
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Registering...';
      submitBtn.disabled = true;

      const response = await register(name, email, password);

      if (response && response.access_token && response.refresh_token) {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        if (response.user) {
          localStorage.setItem('user_info', JSON.stringify(response.user));
        }
      }

      form.reset();
      showPage('main-app');

    } catch (err) {
      warning.textContent = err.message || 'Registrasi gagal.';
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Sign Up';
        submitBtn.disabled = false;
      }
    }
  });
}

function setupFileUpload() {
  console.log('[DEBUG] main.js setupFileUpload: Called.');
  if (setupFileUpload.initialized) {
    console.log('[DEBUG] main.js setupFileUpload: Already initialized, skipping re-attachment of listeners.');
    return;
  }
  const fileInput = document.getElementById('fileElem');
  const uploadArea = document.getElementById('upload-area');
  const submitBtn = document.querySelector('#klasifikasi .submit-btn');
  let selectedFile = null;
  console.log('[DEBUG] main.js setupFileUpload: fileInput:', fileInput);
  console.log('[DEBUG] main.js setupFileUpload: uploadArea:', uploadArea);
  console.log('[DEBUG] main.js setupFileUpload: submitBtn:', submitBtn);
  if (!fileInput || !uploadArea || !submitBtn) {
    console.warn('[DEBUG] main.js setupFileUpload: Missing one or more elements. This might be normal if klasifikasi section is not the initial view.');
    return;
  }
  fileInput.addEventListener('change', e => { const file = e.target.files[0]; selectedFile = file; updateUploadArea(file); });
  uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.style.borderColor = '#4caf50'; uploadArea.style.backgroundColor = '#f8fff8'; });
  uploadArea.addEventListener('dragleave', e => { e.preventDefault(); uploadArea.style.borderColor = '#ccc'; uploadArea.style.backgroundColor = '#fff'; });
  uploadArea.addEventListener('drop', e => {
    e.preventDefault(); uploadArea.style.borderColor = '#ccc'; uploadArea.style.backgroundColor = '#fff';
    const files = e.dataTransfer.files;
    if (files.length > 0) { const file = files[0]; if (file.type.startsWith('image/')) { selectedFile = file; updateUploadArea(file); } else { alert('Harap upload file gambar.'); } }
  });
  submitBtn.addEventListener('click', async () => {
    console.log('[DEBUG] main.js setupFileUpload: Classification submit button clicked.');
    const file = selectedFile || fileInput.files[0];
    console.log('[DEBUG] main.js setupFileUpload: File to classify:', file ? file.name : 'None');
    if (!file) { alert('Pilih file terlebih dahulu.'); return; }
    if (!file.type.startsWith('image/')) { alert('File harus gambar.'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('Maksimal 10MB.'); return; }

    
    handleClassification(file, '#klasifikasi .submit-btn');
    
    
  });
  setupFileUpload.initialized = true;
  console.log('[DEBUG] main.js setupFileUpload: Event listeners configured.');
}

function updateUploadArea(file) {
  const uploadContent = document.querySelector('#klasifikasi .upload-content');
  if (uploadContent && file) {
    uploadContent.innerHTML = `<div class="upload-icon">✅</div><strong>File selected:</strong><br><span style="color: #4caf50;">${file.name}</span><br><small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>`;
  } else if (uploadContent) {
     uploadContent.innerHTML = `<div class="upload-icon">📁</div><strong>Klik atau drag & drop gambar di sini</strong><br><small>Pastikan gambar sampah terlihat jelas</small>`;
  }
}




function checkAuthStatus() { return !!(localStorage.getItem('access_token') && localStorage.getItem('refresh_token')); }
function logout() {
  console.log('[DEBUG] logout: Called. Clearing localStorage and showing landing-page.');
  localStorage.clear(); showPage('landing-page');
}
window.logout = logout;

function showProfileModal() {
  console.log('[DEBUG] showProfileModal: Called.');
  const user = JSON.parse(localStorage.getItem('user_info') || '{}');
  const name = user.username || user.name || '-';
  const email = user.email || '-';
  const modalHTML = `
    <div class="profile-modal" style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      z-index: 1000;
      text-align: center;
    ">
      <h3 style="margin-bottom:15px;">Data Pengguna</h3>
      <p><strong>Nama:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <button id="logout-btn" style="
        background-color: #4caf50;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 15px;
      ">Logout</button>
      <button id="close-profile-btn" style="
        background-color: #ccc;
        color: #333;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 15px;
        margin-left: 10px;
      ">Tutup</button>
    </div>
    <div class="profile-modal-backdrop" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 999;
    "></div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
    closeProfileModal();
  });
  document.getElementById('close-profile-btn').addEventListener('click', closeProfileModal);
  document.querySelector('.profile-modal-backdrop').addEventListener('click', closeProfileModal);
}
window.showProfileModal = showProfileModal;

function closeProfileModal() {
  console.log('[DEBUG] closeProfileModal: Called.');
  const modal = document.querySelector('.profile-modal');
  const backdrop = document.querySelector('.profile-modal-backdrop');
  if (modal) modal.remove();
  if (backdrop) backdrop.remove();
}
window.closeProfileModal = closeProfileModal;
function setupNavigationStates() {
    const navLinks = document.querySelectorAll('.main-nav a, .mobile-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const section = this.getAttribute('data-section');
            if (section) {
                e.preventDefault();
                showSection(section);
                const mobileNav = document.querySelector('.mobile-nav');
                if (mobileNav && mobileNav.classList.contains('active')) {
                    mobileNav.classList.remove('active');
                }
            }
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[DEBUG] DOMContentLoaded: EcoVision Frontend initialized');
  setupPasswordToggle();
  setupLoginForm();
  setupRegisterForm();
  setupNavigationStates();

  const profileIcon = document.querySelector('.profile-icon');
  if (profileIcon) {
    profileIcon.addEventListener('click', showProfileModal);
  }
  
  const initialSection = document.querySelector('#main-app .section.active')?.id || 'beranda';
  console.log(`[DEBUG] DOMContentLoaded: Initial active section (if any in main-app): ${initialSection}`);

  if (initialSection === 'klasifikasi' || document.getElementById('klasifikasi')?.classList.contains('active')) {
    console.log('[DEBUG] DOMContentLoaded: Klasifikasi section is or will be active, calling setupFileUpload.');
    setupFileUpload();
  }

  if (checkAuthStatus()) {
    console.log('[DEBUG] DOMContentLoaded: User already authenticated. Showing main-app.');
    showPage('main-app');
    if (!document.querySelector('#main-app .section.active')) {
      console.log('[DEBUG] DOMContentLoaded: No section active in main-app, showing beranda.');
      showSection('beranda');
    }
  } else {
    console.log('[DEBUG] DOMContentLoaded: User not authenticated. Showing landing-page.');
    showPage('landing-page');
  }
});

window.addEventListener('error', e => { console.error('[DEBUG] Unhandled Error:', e.error ? e.error.stack : e.message); });
window.addEventListener('unhandledrejection', e => { console.error('[DEBUG] Unhandled Promise Rejection:', e.reason); });
