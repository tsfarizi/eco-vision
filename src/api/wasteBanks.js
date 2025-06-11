import { authHeader, refreshAccessToken, getRefreshToken } from './token.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function fetchWasteBanks() {
  // Cek token refresh dulu sebelum request
  if (!getRefreshToken()) {
    throw new Error('Sesi Anda telah habis. Silakan login kembali.');
  }

  async function sendRequest() {
    return await fetch(`${BASE_URL}/waste-banks/`, {
      method: 'GET',
      headers: {
        ...authHeader(),
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    let res = await sendRequest();

    if (res.status === 401) {
      // Token expired, coba refresh
      try {
        await refreshAccessToken();
        res = await sendRequest();
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        throw new Error('Sesi Anda telah habis. Silakan login kembali.');
      }
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errData.message || `HTTP ${res.status}: Gagal mengambil data bank sampah`);
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("Error fetch waste banks:", err);
    throw err;
  }
}

// ===== DRAG & DROP CLASSIFICATION =====
let selectedFile = null;
let map = null;

// Initialize drag & drop functionality
export function initializeDragAndDrop() {
  const uploadArea = document.querySelector('.upload-area');
  
  if (!uploadArea) {
    console.error('Upload area not found - pastikan element dengan class .upload-area ada di HTML');
    return;
  }

  // Create hidden file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop area when item is dragged over it
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, unhighlight, false);
  });

  // Handle dropped files
  uploadArea.addEventListener('drop', handleDrop, false);
  
  // Handle click to open file dialog
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  // Handle file selection from dialog
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight(e) {
    uploadArea.classList.add('drag-highlight');
  }

  function unhighlight(e) {
    uploadArea.classList.remove('drag-highlight');
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }

  function handleFiles(files) {
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Mohon pilih file gambar (JPG, PNG, dll)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file terlalu besar. Maksimal 5MB');
        return;
      }

      selectedFile = file;
      displayPreview(file);
      console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    }
  }

  function displayPreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadArea.innerHTML = `
        <div class="upload-preview">
          <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 150px; border-radius: 8px; object-fit: cover;">
          <p style="margin-top: 10px; font-size: 14px; color: #333; font-weight: 500;">${file.name}</p>
          <p style="font-size: 12px; color: #666;">Klik "Klasifikasi" untuk menganalisis gambar</p>
          <button onclick="clearSelectedFile()" style="
            margin-top: 8px;
            padding: 5px 10px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
          ">Hapus</button>
        </div>
      `;
    };
    reader.readAsDataURL(file);
  }

  // Global function to clear selected file
  window.clearSelectedFile = function() {
    selectedFile = null;
    uploadArea.innerHTML = `
      <div class="upload-content">
        <i class="bi bi-cloud-upload" style="font-size: 2rem; color: #4caf50;"></i>
        <p>Drop gambar disini atau klik untuk memilih</p>
        <p style="font-size: 12px; color: #666;">Mendukung JPG, PNG (Max 5MB)</p>
      </div>
    `;
  };
}

// Handle classification submission
export async function handleClassification() {
  if (!selectedFile) {
    alert('Mohon pilih gambar terlebih dahulu');
    return;
  }

  // Cek token dulu sebelum upload
  if (!getRefreshToken()) {
    alert('Sesi Anda telah habis. Silakan login kembali.');
    if (window.logout) window.logout();
    return;
  }

  const submitBtn = document.querySelector('.submit-btn');
  if (!submitBtn) {
    console.error('Submit button not found');
    return;
  }

  const originalText = submitBtn.textContent;
  
  try {
    // Show loading state
    submitBtn.textContent = 'Memproses...';
    submitBtn.disabled = true;

    // Create FormData
    const formData = new FormData();
    formData.append('image', selectedFile);

    console.log('Sending classification request...');

    // Send to prediction API with retry logic
    async function sendPredictionRequest() {
      return await fetch(`${BASE_URL}/predict/`, {
        method: 'POST',
        headers: {
          ...authHeader()
          // Don't set Content-Type - let browser set it for FormData
        },
        body: formData
      });
    }

    let response = await sendPredictionRequest();

    if (response.status === 401) {
      console.log('Token expired, refreshing...');
      try {
        await refreshAccessToken();
        response = await sendPredictionRequest();
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        alert('Sesi Anda telah habis. Silakan login kembali.');
        if (window.logout) window.logout();
        return;
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: Gagal melakukan klasifikasi`);
    }

    const result = await response.json();
    console.log('Classification result:', result);
    displayClassificationResult(result);

  } catch (error) {
    console.error('Classification error:', error);
    alert('Terjadi kesalahan saat mengklasifikasi gambar: ' + error.message);
  } finally {
    // Restore button state
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

function displayClassificationResult(result) {
  // Remove existing modal if any
  const existingResult = document.querySelector('.classification-result');
  const existingBackdrop = document.querySelector('.modal-backdrop');
  if (existingResult) existingResult.remove();
  if (existingBackdrop) existingBackdrop.remove();

  // Create result modal
  const resultHTML = `
    <div class="classification-result" style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      z-index: 1000;
      max-width: 400px;
      text-align: center;
    ">
      <h3 style="margin-bottom: 15px; color: #4caf50;">🎯 Hasil Klasifikasi</h3>
      <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px;">
        <p style="margin: 5px 0;"><strong>Jenis Sampah:</strong> <span style="color: #4caf50;">${result.category || result.predicted_class || result.prediction || 'Tidak terdeteksi'}</span></p>
        <p style="margin: 5px 0;"><strong>Tingkat Kepercayaan:</strong> ${result.confidence ? (result.confidence * 100).toFixed(1) + '%' : result.confidence_score ? (result.confidence_score * 100).toFixed(1) + '%' : 'N/A'}</p>
      </div>
      <div style="margin: 20px 0;">
        <p style="font-size: 14px; color: #666; line-height: 1.4;">${getWasteDescription(result.category || result.predicted_class || result.prediction)}</p>
      </div>
      ${result.points ? `<div style="color: #ff9800; font-weight: bold; margin: 10px 0;">+${result.points} Poin! 🏆</div>` : ''}
      <button onclick="closeClassificationResult()" style="
        background-color: #4caf50;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      ">Tutup</button>
    </div>
    <div class="modal-backdrop" onclick="closeClassificationResult()" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 999;
    "></div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', resultHTML);
}

function getWasteDescription(category) {
  if (!category) return '♻️ Pastikan sampah dibuang pada tempat yang sesuai untuk menjaga lingkungan';
  
  const descriptions = {
    'organic': '🌱 Sampah organik dapat dikompos menjadi pupuk alami untuk tanaman',
    'plastic': '♻️ Sampah plastik dapat didaur ulang menjadi produk baru yang berguna',
    'paper': '📄 Sampah kertas dapat didaur ulang menjadi kertas baru berkualitas',
    'metal': '🔧 Sampah logam memiliki nilai ekonomi tinggi untuk didaur ulang',
    'glass': '🏺 Sampah kaca dapat didaur ulang berkali-kali tanpa kehilangan kualitas',
    'cardboard': '📦 Sampah kardus mudah didaur ulang menjadi produk kertas baru',
    'clothes': '👕 Sampah tekstil bisa didonasikan atau didaur ulang menjadi kain baru'
  };
  return descriptions[category?.toLowerCase()] || '♻️ Pastikan sampah dibuang pada tempat yang sesuai untuk menjaga lingkungan';
}

// Global function to close result modal
window.closeClassificationResult = function() {
  const result = document.querySelector('.classification-result');
  const backdrop = document.querySelector('.modal-backdrop');
  if (result) result.remove();
  if (backdrop) backdrop.remove();
};

// ===== LEAFLET MAP =====
export function initializeMap() {
  // Check if Leaflet is loaded
  if (typeof L === 'undefined') {
    console.error('Leaflet library not loaded. Add this to your HTML head:');
    console.error('<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />');
    console.error('<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>');
    return;
  }

  // Check if we're on the bank sampah page and map container exists
  const mapContainer = document.querySelector('.map-placeholder') || document.querySelector('#map-container');
  if (!mapContainer) {
    console.log('Map container not found - pastikan ada element dengan class .map-placeholder atau #map-container');
    return;
  }

  // Replace placeholder with actual map div
  mapContainer.innerHTML = '<div id="waste-bank-map" style="width: 100%; height: 300px; border-radius: 8px; border: 1px solid #ddd;"></div>';
  
  // Wait a bit for DOM to update
  setTimeout(() => {
    try {
      // Initialize map centered on Jakarta
      map = L.map('waste-bank-map', {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true
      }).setView([-6.2088, 106.8456], 11);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        minZoom: 8
      }).addTo(map);

      console.log('Map initialized successfully');

      // Load and display waste banks
      loadWasteBankMarkers();

      // Fix map size issue after initialization
      setTimeout(() => {
        map.invalidateSize();
        console.log('Map size invalidated');
      }, 500);

    } catch (error) {
      console.error('Error initializing map:', error);
      document.getElementById('waste-bank-map').innerHTML = `
        <div style="
          display: flex; 
          align-items: center; 
          justify-content: center; 
          height: 100%; 
          color: #666;
          flex-direction: column;
          background: #f9f9f9;
          border-radius: 8px;
        ">
          <i class="bi bi-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <p>Gagal memuat peta</p>
          <p style="font-size: 12px;">Pastikan koneksi internet stabil</p>
        </div>
      `;
    }
  }, 200);
}

async function loadWasteBankMarkers() {
  try {
    console.log('Loading waste bank markers...');
    const wasteBanks = await fetchWasteBanks();
    console.log('Fetched waste banks:', wasteBanks);
    
    if (wasteBanks && Array.isArray(wasteBanks) && wasteBanks.length > 0) {
      let markersAdded = 0;
      const markers = [];

      wasteBanks.forEach((bank, index) => {
        // Check for different possible latitude/longitude field names
        const lat = bank.latitude || bank.lat || bank.y;
        const lng = bank.longitude || bank.lng || bank.lon || bank.x;
        
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          try {
            const marker = L.marker([parseFloat(lat), parseFloat(lng)]).addTo(map);
            markers.push(marker);
            
            // Create popup content - adjust based on your API response structure
            const popupContent = `
              <div style="font-size: 13px; max-width: 200px;">
                <strong style="color: #4caf50;">${bank.name || bank.nama || 'Bank Sampah'}</strong><br>
                <div style="margin: 8px 0;">
                  <i class="bi bi-geo-alt"></i> ${bank.address || bank.alamat || 'Alamat tidak tersedia'}
                </div>
                ${bank.phone || bank.telepon ? `<div><i class="bi bi-telephone"></i> ${bank.phone || bank.telepon}</div>` : ''}
                ${bank.opening_hours ? `<div style="margin-top: 5px;"><i class="bi bi-clock"></i> ${bank.opening_hours}</div>` : ''}
                ${bank.waste_processed && bank.waste_processed.length > 0 ? `<div style="margin-top: 5px;"><small>Jenis sampah: ${bank.waste_processed.join(', ')}</small></div>` : ''}
              </div>
            `;
            
            marker.bindPopup(popupContent);
            markersAdded++;
            
            console.log(`Marker ${index + 1} added:`, { name: bank.name, lat, lng });
          } catch (markerError) {
            console.error(`Error adding marker ${index + 1}:`, markerError, bank);
          }
        } else {
          console.warn(`Bank ${index + 1} missing valid coordinates:`, { lat, lng, bank });
        }
      });
      
      console.log(`Added ${markersAdded} markers to map`);
      
      // If we have markers, fit map to show all markers
      if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        const bounds = group.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds.pad(0.1));
        }
      }
    } else {
      console.log('No waste banks data or empty array, adding demo marker');
      // Add default demo marker
      const defaultMarker = L.marker([-6.2088, 106.8456]).addTo(map);
      defaultMarker.bindPopup(`
        <div style="font-size: 13px;">
          <strong style="color: #4caf50;">🏢 Bank Sampah Demo</strong><br>
          <div style="margin: 8px 0;">
            <i class="bi bi-geo-alt"></i> Jakarta Pusat, DKI Jakarta
          </div>
          <div><i class="bi bi-telephone"></i> (021) 1234-5678</div>
          <div style="margin-top: 5px;"><i class="bi bi-clock"></i> 08:00 - 16:00</div>
        </div>
      `);
    }
    
  } catch (error) {
    console.error('Error loading waste bank markers:', error);
    // Add default marker on error
    if (map) {
      const defaultMarker = L.marker([-6.2088, 106.8456]).addTo(map);
      defaultMarker.bindPopup(`
        <div style="font-size: 13px;">
          <strong style="color: #f44336;">⚠️ Bank Sampah Demo</strong><br>
          <div style="margin: 8px 0;">
            <i class="bi bi-geo-alt"></i> Data tidak dapat dimuat
          </div>
          <small>Periksa koneksi internet Anda</small>
        </div>
      `);
    }
  }
}

// Function to resize map when container changes
export function resizeMap() {
  if (map) {
    setTimeout(() => {
      map.invalidateSize();
      console.log('Map resized');
    }, 100);
  }
}

// Initialize all features when DOM is loaded
export function initializeWasteBankFeatures() {
  console.log('Initializing waste bank features...');
  
  // Initialize drag and drop for classification
  initializeDragAndDrop();
  
  // Initialize map
  initializeMap();
  
  // Add event listener for classification button
  const submitBtn = document.querySelector('.submit-btn');
  if (submitBtn) {
    // Remove existing listeners to avoid duplicates
    const newBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newBtn, submitBtn);
    
    newBtn.addEventListener('click', handleClassification);
    console.log('Classification button event listener added');
  } else {
    console.warn('Submit button not found - pastikan ada element dengan class .submit-btn');
  }

  console.log('Waste bank features initialized');
}
