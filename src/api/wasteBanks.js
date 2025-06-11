import { authHeader, refreshAccessToken } from './token.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fungsi untuk ambil daftar bank sampah
export async function fetchWasteBanks() {
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
      await refreshAccessToken();
      res = await sendRequest();
    }

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Gagal mengambil data bank sampah');
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
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  if (!uploadArea) {
    console.error('Upload area not found');
    return;
  }

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
    }
  }

  function displayPreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadArea.innerHTML = `
        <div class="upload-preview">
          <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 150px; border-radius: 8px;">
          <p style="margin-top: 10px; font-size: 14px; color: #333;">${file.name}</p>
          <p style="font-size: 12px; color: #666;">Klik "Klasifikasi" untuk menganalisis gambar</p>
        </div>
      `;
    };
    reader.readAsDataURL(file);
  }
}

// Handle classification submission
export async function handleClassification() {
  if (!selectedFile) {
    alert('Mohon pilih gambar terlebih dahulu');
    return;
  }

  const submitBtn = document.querySelector('.submit-btn');
  const originalText = submitBtn.textContent;
  
  try {
    // Show loading state
    submitBtn.textContent = 'Memproses...';
    submitBtn.disabled = true;

    // Create FormData
    const formData = new FormData();
    formData.append('image', selectedFile);

    // Send to prediction API
    const response = await fetch(`${BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        ...authHeader()
      },
      body: formData
    });

    if (response.status === 401) {
      await refreshAccessToken();
      // Retry request
      const retryResponse = await fetch(`${BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          ...authHeader()
        },
        body: formData
      });
      
      if (!retryResponse.ok) {
        throw new Error('Gagal melakukan klasifikasi sampah');
      }
      
      const result = await retryResponse.json();
      displayClassificationResult(result);
    } else if (response.ok) {
      const result = await response.json();
      displayClassificationResult(result);
    } else {
      throw new Error('Gagal melakukan klasifikasi sampah');
    }

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
  // Create result modal or section
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
      <h3 style="margin-bottom: 15px; color: #4caf50;">Hasil Klasifikasi</h3>
      <p><strong>Jenis Sampah:</strong> ${result.category || 'Tidak terdeteksi'}</p>
      <p><strong>Tingkat Kepercayaan:</strong> ${result.confidence ? (result.confidence * 100).toFixed(1) + '%' : 'N/A'}</p>
      <div style="margin: 20px 0;">
        <p style="font-size: 14px; color: #666;">${getWasteDescription(result.category)}</p>
      </div>
      <button onclick="closeClassificationResult()" style="
        background-color: #4caf50;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
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
  const descriptions = {
    'organic': 'Sampah organik dapat dikompos menjadi pupuk alami',
    'plastic': 'Sampah plastik dapat didaur ulang menjadi produk baru',
    'paper': 'Sampah kertas dapat didaur ulang menjadi kertas baru',
    'metal': 'Sampah logam memiliki nilai ekonomi tinggi untuk didaur ulang',
    'glass': 'Sampah kaca dapat didaur ulang berkali-kali tanpa kehilangan kualitas'
  };
  return descriptions[category] || 'Pastikan sampah dibuang pada tempat yang sesuai';
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
  // Check if we're on the bank sampah page and map container exists
  const mapContainer = document.querySelector('.map-placeholder');
  if (!mapContainer) {
    console.log('Map container not found');
    return;
  }

  // Replace placeholder with actual map div
  mapContainer.innerHTML = '<div id="waste-bank-map" style="width: 100%; height: 140px; border-radius: 8px;"></div>';
  
  // Wait a bit for DOM to update
  setTimeout(() => {
    try {
      // Initialize map centered on Jakarta (you can change this)
      map = L.map('waste-bank-map', {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([-6.2088, 106.8456], 12);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      // Load and display waste banks
      loadWasteBankMarkers();

      // Fix map size issue
      setTimeout(() => {
        map.invalidateSize();
      }, 250);

    } catch (error) {
      console.error('Error initializing map:', error);
      document.getElementById('waste-bank-map').innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
          <p>Gagal memuat peta</p>
        </div>
      `;
    }
  }, 100);
}

async function loadWasteBankMarkers() {
  try {
    const wasteBanks = await fetchWasteBanks();
    
    if (wasteBanks && wasteBanks.length > 0) {
      wasteBanks.forEach(bank => {
        if (bank.latitude && bank.longitude) {
          const marker = L.marker([bank.latitude, bank.longitude]).addTo(map);
          
          // Create popup content
          const popupContent = `
            <div style="font-size: 12px;">
              <strong>${bank.name}</strong><br>
              ${bank.address || 'Alamat tidak tersedia'}<br>
              ${bank.phone ? `Telp: ${bank.phone}` : ''}
            </div>
          `;
          
          marker.bindPopup(popupContent);
        }
      });
      
      // If we have banks, fit map to show all markers
      if (wasteBanks.some(bank => bank.latitude && bank.longitude)) {
        const group = new L.featureGroup(
          wasteBanks
            .filter(bank => bank.latitude && bank.longitude)
            .map(bank => L.marker([bank.latitude, bank.longitude]))
        );
        map.fitBounds(group.getBounds().pad(0.1));
      }
    } else {
      // Add default marker for demo
      const defaultMarker = L.marker([-6.2088, 106.8456]).addTo(map);
      defaultMarker.bindPopup('<div style="font-size: 12px;"><strong>Bank Sampah Demo</strong><br>Jakarta Pusat</div>');
    }
    
  } catch (error) {
    console.error('Error loading waste bank markers:', error);
    // Add default marker on error
    const defaultMarker = L.marker([-6.2088, 106.8456]).addTo(map);
    defaultMarker.bindPopup('<div style="font-size: 12px;"><strong>Bank Sampah Demo</strong><br>Lokasi tidak dapat dimuat</div>');
  }
}

// Function to resize map when container changes
export function resizeMap() {
  if (map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }
}

// Initialize all features when DOM is loaded
export function initializeWasteBankFeatures() {
  // Initialize drag and drop for classification
  initializeDragAndDrop();
  
  // Initialize map
  initializeMap();
  
  // Add event listener for classification button
  const submitBtn = document.querySelector('.submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleClassification);
  }
}
