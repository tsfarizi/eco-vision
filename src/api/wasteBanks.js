import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});

const wasteBankMarkerOptions = {
  radius: 12, 
  fillColor: "#28a745",
  color: "#000",
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8
};

const trashCanMarkerOptions = {
  radius: 7, 
  fillColor: "#007bff", 
  color: "#000",
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8
};

import { fetchWithAuth, handleResponse } from './fetchWithAuth.js'; 
import { handleClassification as processImageClassification } from './predict.js';
import { fetchTrashCans } from './trashCans.js'; 

export async function fetchWasteBanks() {
  try {
    const response = await fetchWithAuth('/waste-banks', { method: 'GET' });
    return await handleResponse(response);
  } catch (err) {
    console.error("Error fetch waste banks:", err.message);
    throw err; 
  }
}

export async function addWasteBank(bankData) {
  try {
    const response = await fetchWithAuth('/waste-banks', {
      method: 'POST',
      body: JSON.stringify(bankData)
     
    });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error adding waste bank:", error.message); 
    throw error;
  }
}

let selectedFile = null;
let map = null; 

export function initializeDragAndDrop() {
  console.log('[DEBUG] initializeDragAndDrop: Called');
  const uploadArea = document.querySelector('.upload-area');
  console.log('[DEBUG] initializeDragAndDrop: Upload area element:', uploadArea);
  const fileInput = document.createElement('input');
  fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  console.log('[DEBUG] initializeDragAndDrop: File input element:', fileInput);

  if (!uploadArea) { console.error('[DEBUG] initializeDragAndDrop: Upload area .upload-area not found, exiting.'); return; }

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evName => {
    uploadArea.addEventListener(evName, e => { e.preventDefault(); e.stopPropagation(); }, false);
    document.body.addEventListener(evName, e => { e.preventDefault(); e.stopPropagation(); }, false);
  });
  ['dragenter', 'dragover'].forEach(evName => uploadArea.addEventListener(evName, () => uploadArea.classList.add('drag-highlight'), false));
  ['dragleave', 'drop'].forEach(evName => uploadArea.addEventListener(evName, () => uploadArea.classList.remove('drag-highlight'), false));
  uploadArea.addEventListener('drop', e => handleFiles(e.dataTransfer.files), false);
  uploadArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => { if (e.target.files.length > 0) handleFiles(e.target.files); });

  function handleFiles(files) {
    console.log('[DEBUG] handleFiles: Called with files:', files);
    if (files.length > 0) {
      const file = files[0];
      console.log('[DEBUG] handleFiles: Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
      if (!file.type.startsWith('image/')) { alert('Mohon pilih file gambar (JPG, PNG, dll)'); return; }
      if (file.size > 5 * 1024 * 1024) { alert('Ukuran file terlalu besar. Maksimal 5MB'); return; }
      selectedFile = file;
      console.log('[DEBUG] handleFiles: selectedFile updated:', selectedFile ? selectedFile.name : null);
      displayPreview(file);
    }
  }

  function displayPreview(file) {
    console.log('[DEBUG] displayPreview: Called for file:', file.name);
    const reader = new FileReader();
    reader.onload = e => {
      uploadArea.innerHTML = `
        <div class="upload-preview">
          <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 150px; border-radius: 8px;">
          <p style="margin-top: 10px; font-size: 14px; color: #333;">${file.name}</p>
          <p style="font-size: 12px; color: #666;">Klik "Klasifikasi" untuk menganalisis gambar</p>
        </div>`;
      console.log('[DEBUG] displayPreview: Preview HTML updated.');
    };
    reader.readAsDataURL(file);
  }
}

export function initializeMap() {
  console.log('[DEBUG] initializeMap: Called');
  const mapPlaceholder = document.querySelector('.map-placeholder');
  if (!mapPlaceholder) {
    console.error('[DEBUG] initializeMap: Map placeholder .map-placeholder not found');
    return;
  }
  mapPlaceholder.innerHTML = '<div id="waste-bank-map" style="width: 100%; height: 400px; border-radius: 8px;"></div>'; // Increased height
  
  setTimeout(() => {
    console.log('[DEBUG] initializeMap: Map container DOM element (waste-bank-map):', document.getElementById('waste-bank-map'));
    try {
      map = L.map('waste-bank-map', { zoomControl: true, scrollWheelZoom: false }).setView([-6.2088, 106.8456], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 18
      }).addTo(map);
      console.log('[DEBUG] initializeMap: Leaflet map initialized.');
      loadMapMarkers();
      setTimeout(() => {
        if(map) map.invalidateSize(); 
        console.log('[DEBUG] initializeMap: map.invalidateSize() called post initial load.');
      }, 250); 
    } catch (error) {
      console.error('[DEBUG] initializeMap: Error during Leaflet map initialization:', error);
      const mapDiv = document.getElementById('waste-bank-map');
      if (mapDiv) {
        mapDiv.innerHTML = '<p style="color:red; text-align:center;">Error initializing map. Check console for details.</p>';
      }
    }
  }, 100);
}

async function loadMapMarkers() {
  console.log('[DEBUG] loadMapMarkers: Initializing. Attempting to load Waste Banks and Trash Cans.');
  const allMarkersArray = []; 

  try {
    const wasteBanks = await fetchWasteBanks();
    console.log('[DEBUG] loadMapMarkers: Fetched waste banks (raw):', wasteBanks);
    console.log('[DEBUG] loadMapMarkers: Fetched waste banks (JSON):', JSON.stringify(wasteBanks, null, 2));
    console.log('[DEBUG] loadMapMarkers: Number of waste banks:', wasteBanks ? wasteBanks.length : 0);
    let wasteBankMarkersCreated = 0;
    if (wasteBanks && wasteBanks.length > 0) {
      wasteBanks.forEach(bank => {
        console.log('[DEBUG] loadMapMarkers: Processing individual waste bank:', bank);
        if (bank && typeof bank.latitude === 'number' && typeof bank.longitude === 'number') {
          const marker = L.circleMarker([bank.latitude, bank.longitude], wasteBankMarkerOptions);
          let wasteProcessedStr = bank.waste_processed && bank.waste_processed.length > 0 ? bank.waste_processed.map(wp => wp.name).join(', ') : 'Tidak ada info limbah';
          let openingHoursStr = 'Tidak ada info jam buka';
          if (bank.opening_hours && bank.opening_hours.length > 0) {
            openingHoursStr = bank.opening_hours.map(oh => {
              const openTime = oh.open_time ? oh.open_time.substring(0, 5) : 'N/A';
              const closeTime = oh.close_time ? oh.close_time.substring(0, 5) : 'N/A';
              const dayStr = oh.day.charAt(0).toUpperCase() + oh.day.slice(1);
              return `${dayStr}: ${openTime} - ${closeTime}`;
            }).join('<br>');
          }
          marker.bindPopup(`<div style="font-size: 12px; line-height: 1.6;"><strong>${bank.name} (Bank Sampah)</strong><br><hr style="margin: 3px 0;"><strong>Menerima:</strong> ${wasteProcessedStr}<br><hr style="margin: 3px 0;"><strong>Jam Buka:</strong><br>${openingHoursStr}</div>`);
          allMarkersArray.push(marker);
          wasteBankMarkersCreated++;
          console.log('[DEBUG] loadMapMarkers: SUCCESSFULLY created L.marker for waste bank:', bank.name, 'at [', bank.latitude, ',', bank.longitude, ']');
        } else {
          console.warn('[DEBUG] loadMapMarkers: SKIPPED waste bank due to missing/invalid lat/lng:', bank.name, 'Data:', bank);
        }
      });
    }
    console.log('[DEBUG] loadMapMarkers: Total waste bank markers created:', wasteBankMarkersCreated);
  } catch (error) {
    console.error('[DEBUG] loadMapMarkers: Error loading waste bank markers:', error);
  }

  try {
    const trashCans = await fetchTrashCans();
    console.log('[DEBUG] loadMapMarkers: Fetched trash cans (raw):', trashCans);
    console.log('[DEBUG] loadMapMarkers: Fetched trash cans (JSON):', JSON.stringify(trashCans, null, 2));
    console.log('[DEBUG] loadMapMarkers: Number of trash cans:', trashCans ? trashCans.length : 0);
    let trashCanMarkersCreated = 0;
    if (trashCans && trashCans.length > 0) {
      trashCans.forEach(tc => {
        console.log('[DEBUG] loadMapMarkers: Processing individual trash can:', tc);
        if (tc && typeof tc.latitude === 'number' && typeof tc.longitude === 'number') {
          const marker = L.circleMarker([tc.latitude, tc.longitude], trashCanMarkerOptions);
          let acceptedWasteStr = tc.accepted_waste_types && tc.accepted_waste_types.length > 0 ? tc.accepted_waste_types.map(wt => wt.name).join(', ') : 'Tidak ada info jenis sampah';
          marker.bindPopup(`<div style="font-size: 12px; line-height: 1.6;"><strong>Tempat Sampah</strong><br><hr style="margin: 3px 0;"><strong>Menerima:</strong> ${acceptedWasteStr}</div>`);
          allMarkersArray.push(marker);
          trashCanMarkersCreated++;
          console.log('[DEBUG] loadMapMarkers: SUCCESSFULLY created L.marker for trash can:', tc.id, 'at [', tc.latitude, ',', tc.longitude, ']');
        } else {
          console.warn('[DEBUG] loadMapMarkers: SKIPPED trash can due to missing/invalid lat/lng:', tc.id, 'Data:', tc);
        }
      });
    }
    console.log('[DEBUG] loadMapMarkers: Total trash can markers created:', trashCanMarkersCreated);
  } catch (error) {
    console.error('[DEBUG] loadMapMarkers: Error loading trash can markers:', error);
  }

  console.log('[DEBUG] loadMapMarkers: Finalizing. Total markers in allMarkersArray before adding to group:', allMarkersArray.length);

  if (allMarkersArray.length > 0) {
    const group = L.featureGroup(allMarkersArray).addTo(map); 
    console.log('[DEBUG] loadMapMarkers: Feature group created and added to map. Layers in group:', group.getLayers().length);
    console.log('[DEBUG] loadMapMarkers: Attempting to fitBounds. Bounds object:', group.getBounds());
    map.fitBounds(group.getBounds().pad(0.1));
  } else {
    console.log('[DEBUG] loadMapMarkers: No markers (waste banks or trash cans) to display.');
    if (map) { 
        const defaultMarker = L.marker([-6.2088, 106.8456]).addTo(map);
        defaultMarker.bindPopup('<div style="font-size: 12px;">Tidak ada data bank sampah atau tempat sampah yang dapat ditampilkan.</div>');
        map.setView([-6.2088, 106.8456], 12);
    }
  }

  if (map) {
    map.invalidateSize(true); 
    console.log('[DEBUG] loadMapMarkers: Called map.invalidateSize(true) at the end of function.');
  } else {
    console.warn('[DEBUG] loadMapMarkers: Map object not available at the end of function for invalidateSize.');
  }
}

export function resizeMap() {
  if (map) {
    console.log('[DEBUG] resizeMap: Called. Invalidating map size.');
    setTimeout(() => map.invalidateSize(true), 100); 
  } else {
    console.log('[DEBUG] resizeMap: Called, but map instance is not available.');
  }
}

export function initializeWasteBankFeatures() {
  console.log('[DEBUG] initializeWasteBankFeatures: Called');
  console.log('[DEBUG] initializeWasteBankFeatures: Calling initializeDragAndDrop');
  initializeDragAndDrop();
  console.log('[DEBUG] initializeWasteBankFeatures: Calling initializeMap');
  initializeMap();
  const submitBtn = document.querySelector('.submit-btn');
  console.log('[DEBUG] initializeWasteBankFeatures: Submit button for classification:', submitBtn);
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      console.log('[DEBUG] Classification submit button clicked.');
      console.log('[DEBUG] Current selectedFile:', selectedFile ? selectedFile.name : 'None');
      if (selectedFile) {
        processImageClassification(selectedFile, '.submit-btn');
      } else {
        alert('Mohon pilih gambar terlebih dahulu.');
      }
    });
    console.log('[DEBUG] initializeWasteBankFeatures: Event listener added to submit button.');
  } else {
    console.warn('[DEBUG] initializeWasteBankFeatures: Submit button .submit-btn not found.');
  }
}
