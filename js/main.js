// EcoLimpia - Interactividad y Visor de Mapas en Miniventana (100% interno)
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

// Datos verificados de los 4 puntos de acopio aliados en Av. San Carlos, Huancayo
const ACOPIO_POINTS = [
  {
    id: 0,
    num: 1,
    badge: 'Punto aliado #1',
    name: 'Salchi Wok',
    address: 'Av. San Carlos / Jr. San Miguel, San Carlos, Huancayo',
    detail: 'Recibe botellas plásticas limpias y secas · Ref: 993 248 645',
    img: 'img/bodega-1.jpg?v=4',
    lat: -12.0484672,
    lng: -75.199632
  },
  {
    id: 1,
    num: 2,
    badge: 'Punto aliado #2',
    name: 'Bodega Aliada #1401',
    address: 'Av. San Carlos 1401, San Carlos, Huancayo',
    detail: 'Recibe botellas plásticas limpias y secas · Contenedor en puerta principal',
    img: 'img/bodega-2.jpg?v=4',
    lat: -12.0516692,
    lng: -75.2019644
  },
  {
    id: 2,
    num: 3,
    badge: 'Punto aliado #3',
    name: 'Bazar Librería "Curiosísimas"',
    address: 'Av. San Carlos / Pje. Santa Rosa, San Carlos, Huancayo',
    detail: 'Recibe botellas plásticas limpias y secas · Esquina con contenedor interior',
    img: 'img/bodega-3.jpg?v=4',
    lat: -12.0552339,
    lng: -75.2039631
  },
  {
    id: 3,
    num: 4,
    badge: 'Punto aliado #4',
    name: 'Broastería "Anita"',
    address: 'Av. San Carlos, San Carlos, Huancayo',
    detail: 'Recibe botellas plásticas limpias y secas · Salón principal',
    img: 'img/bodega-4.png?v=4',
    lat: -12.056153,
    lng: -75.2045399
  }
];

// Mobile nav
const navToggle = $('#navToggle');
const navMenu = $('#navMenu');
if (navToggle) navToggle.addEventListener('click', () => navMenu.classList.toggle('hidden'));

$$('.nav-link').forEach(a => a.addEventListener('click', () => {
  if (window.innerWidth < 768) navMenu.classList.add('hidden');
}));

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Ícono numerado personalizado para Leaflet
function createNumberedIcon(num) {
  return L.divIcon({
    className: 'eco-custom-pin',
    html: `<div class="eco-marker-pin"><span>${num}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -34]
  });
}

// Contenido HTML del globo (popup) de cada marcador
function buildPopupHtml(pt, isInsideModal = false) {
  const actionBtn = isInsideModal
    ? `<button type="button" data-modal-switch="${pt.id}" class="mt-2 w-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors">Acercar a este local</button>`
    : `<button type="button" data-open-map="${pt.id}" class="mt-2 w-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors"><i class="fa-solid fa-window-restore"></i> Abrir en miniventana</button>`;

  return `
    <div class="font-sans">
      <img src="${pt.img}" alt="${escapeHtml(pt.name)}" style="width:100%;height:115px;object-fit:cover;display:block;">
      <div style="padding:10px 12px;">
        <span style="display:inline-block;background:#dcfce7;color:#166534;font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;">${pt.badge}</span>
        <p style="font-weight:700;font-size:14px;color:#0f172a;margin:4px 0 2px;">${escapeHtml(pt.name)}</p>
        <p style="font-size:11px;color:#475569;margin:0;">${escapeHtml(pt.address)}</p>
        ${actionBtn}
      </div>
    </div>
  `;
}

// ============================================================================
// 1. MAPA GENERAL UNIFICADO EN LA PÁGINA (#allPointsMap)
// ============================================================================
let mainLeafletMap = null;
let mainMarkers = [];
let mainBounds = null;

function initMainAllPointsMap() {
  const container = document.getElementById('allPointsMap');
  if (!container || typeof L === 'undefined') return;

  mainLeafletMap = L.map(container, { scrollWheelZoom: false }).setView([-12.0523, -75.2022], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(mainLeafletMap);

  const coords = [];
  mainMarkers = ACOPIO_POINTS.map(pt => {
    const latLng = [pt.lat, pt.lng];
    coords.push(latLng);
    return L.marker(latLng, { icon: createNumberedIcon(pt.num) })
      .addTo(mainLeafletMap)
      .bindPopup(buildPopupHtml(pt, false));
  });

  L.polyline(coords, {
    color: '#16a34a',
    weight: 4,
    opacity: 0.85,
    dashArray: '8, 8'
  }).addTo(mainLeafletMap);

  mainBounds = L.latLngBounds(coords);
  mainLeafletMap.fitBounds(mainBounds, { padding: [45, 45] });
}

function focusPointOnMainMap(target, shouldScroll = false) {
  if (!mainLeafletMap) return;
  if (shouldScroll) {
    const box = document.getElementById('mapaGeneralBox');
    if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  ['All', '0', '1', '2', '3'].forEach(k => {
    const btn = document.getElementById('mainMapBtn' + k);
    if (btn) btn.classList.toggle('active', String(target).toLowerCase() === k.toLowerCase());
  });

  if (target === 'all') {
    mainLeafletMap.closePopup();
    mainLeafletMap.fitBounds(mainBounds, { padding: [45, 45], maxZoom: 16 });
  } else {
    const idx = Number(target);
    const pt = ACOPIO_POINTS[idx];
    const marker = mainMarkers[idx];
    if (pt && marker) {
      mainLeafletMap.setView([pt.lat, pt.lng], 18, { animate: true });
      marker.openPopup();
    }
  }
}

// ============================================================================
// 2. MINIVENTANA EMERGENTE DE MAPAS (#mapModal) - 100% EN LA MISMA PÁGINA
// ============================================================================
let modalLeafletMap = null;
let modalMarkers = [];
let modalLeafletBounds = null;

function ensureModalLeafletMap() {
  const container = document.getElementById('mapModalAllContainer');
  if (!container || typeof L === 'undefined') return;
  if (modalLeafletMap) {
    modalLeafletMap.invalidateSize();
    return;
  }

  modalLeafletMap = L.map(container).setView([-12.0523, -75.2022], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(modalLeafletMap);

  const coords = [];
  modalMarkers = ACOPIO_POINTS.map(pt => {
    const latLng = [pt.lat, pt.lng];
    coords.push(latLng);
    return L.marker(latLng, { icon: createNumberedIcon(pt.num) })
      .addTo(modalLeafletMap)
      .bindPopup(buildPopupHtml(pt, true));
  });

  L.polyline(coords, {
    color: '#16a34a',
    weight: 4,
    opacity: 0.85,
    dashArray: '8, 8'
  }).addTo(modalLeafletMap);

  modalLeafletBounds = L.latLngBounds(coords);
}

function openMapModal(target = 0) {
  const modal = document.getElementById('mapModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  switchMapModalView(target);
}

function switchMapModalView(target) {
  const titleEl = document.getElementById('mapModalTitle');
  const subEl = document.getElementById('mapModalSubtitle');
  const pointBar = document.getElementById('mapModalPointBar');

  ['All', '0', '1', '2', '3'].forEach(k => {
    const tab = document.getElementById('modalTab' + k);
    if (tab) tab.classList.toggle('active', String(target).toLowerCase() === k.toLowerCase());
  });

  ensureModalLeafletMap();

  if (target === 'all') {
    titleEl.textContent = 'Mapa General: Los 4 Puntos de Acopio Aliados';
    subEl.textContent = 'Corredor Av. San Carlos, Huancayo – Pulsa cualquier número para ver el detalle';
    if (pointBar) pointBar.classList.add('hidden');
    setTimeout(() => {
      if (!modalLeafletMap) return;
      modalLeafletMap.invalidateSize();
      modalLeafletMap.closePopup();
      modalLeafletMap.fitBounds(modalLeafletBounds, { padding: [45, 45], maxZoom: 16 });
    }, 60);
  } else {
    const idx = Number(target);
    const pt = ACOPIO_POINTS[idx] || ACOPIO_POINTS[0];
    const marker = modalMarkers[idx] || modalMarkers[0];
    titleEl.textContent = `${pt.name} (${pt.badge})`;
    subEl.textContent = pt.address;
    if (pointBar) {
      pointBar.classList.remove('hidden');
      document.getElementById('mapModalThumb').src = pt.img;
      document.getElementById('mapModalBadge').textContent = pt.badge;
      document.getElementById('mapModalAddress').textContent = `${pt.address} · ${pt.detail}`;
    }
    setTimeout(() => {
      if (!modalLeafletMap) return;
      modalLeafletMap.invalidateSize();
      modalLeafletMap.setView([pt.lat, pt.lng], 18, { animate: true });
      if (marker) marker.openPopup();
    }, 60);
  }
}

function closeMapModal() {
  const modal = document.getElementById('mapModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

window.openMapModal = openMapModal;
window.switchMapModalView = switchMapModalView;
window.closeMapModal = closeMapModal;
window.focusPointOnMainMap = focusPointOnMainMap;

// Delegación global de eventos de clic para que TODOS los botones funcionen siempre
document.addEventListener('click', (e) => {
  const openBtn = e.target.closest('[data-open-map]');
  if (openBtn) {
    e.preventDefault();
    const val = openBtn.getAttribute('data-open-map');
    openMapModal(val === 'all' ? 'all' : Number(val));
    return;
  }

  const switchBtn = e.target.closest('[data-modal-switch]');
  if (switchBtn) {
    e.preventDefault();
    const val = switchBtn.getAttribute('data-modal-switch');
    switchMapModalView(val === 'all' ? 'all' : Number(val));
    return;
  }

  const focusBtn = e.target.closest('[data-focus-main]');
  if (focusBtn) {
    e.preventDefault();
    const val = focusBtn.getAttribute('data-focus-main');
    const isCardBtn = !focusBtn.id.startsWith('mainMapBtn');
    focusPointOnMainMap(val === 'all' ? 'all' : Number(val), isCardBtn);
    return;
  }

  if (e.target.id === 'mapModal' || e.target.closest('#closeMapModalBtn') || e.target.closest('#closeMapModalFooterBtn')) {
    e.preventDefault();
    closeMapModal();
    return;
  }

  const routeBtn = e.target.closest('[data-route-filter]');
  if (routeBtn) {
    e.preventDefault();
    const val = routeBtn.getAttribute('data-route-filter');
    filterTruckRoute(val === 'all' ? 'all' : Number(val));
    return;
  }
});

// ============================================================================
// 3. MAPA DE RUTAS DE RECOLECTORES DE BASURA EN HUANCAYO (#truckRoutesMap)
// ============================================================================
const TRUCK_ROUTES = [
  {
    id: 0,
    name: 'Ruta 1: Av. San Carlos (Pichcus - Cooperativa Centenario - San Carlos)',
    schedule: 'Lunes a Sábado · Turno Mañana: 6:00 a.m. a 9:30 a.m.',
    estimatedArrivals: 'Salchi Wok: 6:30 a.m. | Bodega #1401: 7:15 a.m. | Lib. Curiosísimas: 8:00 a.m. | Broastería Anita: 8:45 a.m.',
    zoneType: 'Residencial y comercial mixto',
    description: 'Corredor ambiental prioritario sobre la Av. San Carlos, cubriendo los 4 puntos de acopio de botellas y viviendas colindantes.',
    coords: [
      [-12.0465, -75.1982],
      [-12.0484672, -75.199632], // Salchi Wok
      [-12.0516692, -75.2019644], // Bodega 1401
      [-12.0552339, -75.2039631], // Librería Curiosísimas
      [-12.056153, -75.2045399], // Broastería Anita
      [-12.0585, -75.2062]
    ]
  },
  {
    id: 1,
    name: 'Ruta 2: Eje Comercial Calle Real - Av. Huancavelica',
    schedule: 'Lunes a Domingo (Diario) · Turno Noche: 7:30 p.m. a 12:00 medianoche',
    estimatedArrivals: 'Zona Real Norte: 7:45 p.m. | Plaza Huamanmarca: 9:00 p.m. | Av. Huancavelica Sur: 10:45 p.m.',
    zoneType: 'Zona comercial céntrica de alto tránsito',
    description: 'Compactador nocturno para evitar congestionamiento vehicular en el centro comercial de Huancayo.',
    coords: [
      [-12.0540, -75.2140],
      [-12.0590, -75.2115],
      [-12.0645, -75.2090],
      [-12.0700, -75.2065],
      [-12.0760, -75.2040]
    ]
  },
  {
    id: 2,
    name: 'Ruta 3: Calle Real - Av. Ferrocarril (Mercados y Ferias)',
    schedule: 'Lunes a Domingo (Diario) · Turno Noche: 8:00 p.m. a 1:00 a.m.',
    estimatedArrivals: 'Mercado Modelo: 8:30 p.m. | Jr. Calixto: 9:45 p.m. | Estación Ferrocarril: 11:15 p.m.',
    zoneType: 'Comercial mayorista y gastronómico',
    description: 'Recojo continuo de residuos orgánicos e inorgánicos en el entorno de mercados y galerías.',
    coords: [
      [-12.0565, -75.2085],
      [-12.0620, -75.2060],
      [-12.0675, -75.2035],
      [-12.0725, -75.2010],
      [-12.0780, -75.1985]
    ]
  },
  {
    id: 3,
    name: 'Ruta 4: Pichcus - Av. Giráldez - Calmell del Solar',
    schedule: 'Lunes, Miércoles y Viernes · Turno Mañana: 6:30 a.m. a 11:00 a.m.',
    estimatedArrivals: 'Barrio Pichcus: 7:00 a.m. | Av. Giráldez alta: 8:30 a.m. | Calmell del Solar: 10:00 a.m.',
    zoneType: 'Residencial, colegios y campus universitario',
    description: 'Ruta sectorizada interdiaria en urbanizaciones de San Carlos alto y Pichcus.',
    coords: [
      [-12.0505, -75.2050],
      [-12.0545, -75.2025],
      [-12.0595, -75.2000],
      [-12.0635, -75.1975]
    ]
  }
];

let truckRoutesMapInstance = null;
let truckRouteLayers = [];
let truckMarkers = [];
let sectorSearchMarker = null;

function initTruckRoutesMap() {
  const container = document.getElementById('truckRoutesMap');
  if (!container || typeof L === 'undefined') return;

  truckRoutesMapInstance = L.map(container, { scrollWheelZoom: false }).setView([-12.0620, -75.2040], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(truckRoutesMapInstance);

  const allCoords = [];

  TRUCK_ROUTES.forEach((route, idx) => {
    // Halo verde esmeralda más nítido para resaltar el trazado
    L.polyline(route.coords, {
      color: '#15803d',
      weight: 12,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(truckRoutesMapInstance);

    // Línea principal de camino: verde bosque intenso (#15803d / #16a34a)
    const polyline = L.polyline(route.coords, {
      color: '#15803d',
      weight: 6.5,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(truckRoutesMapInstance);

    // Núcleo central vibrante para que se vea claramente como una ruta iluminada
    L.polyline(route.coords, {
      color: '#22c55e',
      weight: 2.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(truckRoutesMapInstance);

    polyline.bindPopup(`
      <div class="p-2 font-sans">
        <span class="badge badge-ok mb-1.5"><i class="fa-solid fa-truck"></i> Camión Recolector</span>
        <h4 class="font-extrabold text-sm text-slate-900 leading-snug">${escapeHtml(route.name)}</h4>
        <div class="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs">
          <p class="font-bold text-emerald-800"><i class="fa-solid fa-clock"></i> Horario de paso:</p>
          <p class="text-slate-700 font-semibold mt-0.5">${escapeHtml(route.schedule)}</p>
        </div>
        <div class="mt-2 text-xs text-slate-600">
          <p><strong>Paso estimado por sector:</strong><br><span class="text-emerald-700">${escapeHtml(route.estimatedArrivals)}</span></p>
          <p class="mt-1"><strong>Zona:</strong> ${escapeHtml(route.zoneType)}</p>
          <p class="mt-1">${escapeHtml(route.description)}</p>
        </div>
      </div>
    `);

    truckRouteLayers.push(polyline);
    route.coords.forEach(c => allCoords.push(c));

    // Marcador de inicio de ruta
    const startPin = L.circleMarker(route.coords[0], {
      radius: 6,
      fillColor: '#15803d',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 1
    }).addTo(truckRoutesMapInstance).bindPopup(`<strong>Inicio:</strong> ${escapeHtml(route.name)}`);
    truckMarkers.push(startPin);
  });

  // Marcadores de los 4 puntos de acopio sobre el mapa de rutas
  ACOPIO_POINTS.forEach(pt => {
    L.marker([pt.lat, pt.lng], { icon: createNumberedIcon(pt.num) })
      .addTo(truckRoutesMapInstance)
      .bindPopup(buildPopupHtml(pt, false));
  });

  if (allCoords.length) {
    truckRoutesMapInstance.fitBounds(L.latLngBounds(allCoords), { padding: [35, 35] });
  }
}

function filterTruckRoute(target) {
  if (!truckRoutesMapInstance) return;
  ['All', '0', '1', '2', '3'].forEach(k => {
    const btn = document.getElementById('btnRoute' + k);
    if (btn) btn.classList.toggle('active', String(target).toLowerCase() === k.toLowerCase());
  });

  if (target === 'all') {
    const all = [];
    TRUCK_ROUTES.forEach(r => r.coords.forEach(c => all.push(c)));
    truckRoutesMapInstance.closePopup();
    truckRoutesMapInstance.fitBounds(L.latLngBounds(all), { padding: [35, 35] });
  } else {
    const idx = Number(target);
    const route = TRUCK_ROUTES[idx];
    const layer = truckRouteLayers[idx];
    if (route && layer) {
      truckRoutesMapInstance.fitBounds(layer.getBounds(), { padding: [50, 50] });
      layer.openPopup();
    }
  }
}

// Búsqueda de sectores
const sectorForm = $('#sectorForm');
if (sectorForm) {
  sectorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sec = $('#sectorInput').value.trim();
    const out = $('#sectorResult');
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(sec + ', Huancayo') + '&viewbox=-75.28,-12.00,-75.15,-12.12&bounded=1&limit=1';
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      const data = await res.json();
      if (data && data.length) {
        const lat = parseFloat(data[0].lat), lon = parseFloat(data[0].lon);
        if (truckRoutesMapInstance) {
          truckRoutesMapInstance.setView([lat, lon], 16, { animate: true });
          if (sectorSearchMarker) truckRoutesMapInstance.removeLayer(sectorSearchMarker);
          sectorSearchMarker = L.marker([lat, lon]).addTo(truckRoutesMapInstance)
            .bindPopup(`<strong>${escapeHtml(sec)}</strong><br>Sector consultado en Huancayo`).openPopup();
        }
        out.innerHTML = `<div class="card p-4 border-l-4 border-green-500">
          <p class="font-bold text-green-700">Sector ubicado en Huancayo: ${escapeHtml(sec)}</p>
          <p class="text-sm text-slate-600 mt-1">Revisa los caminos verdes en el mapa para ubicar la ruta de recolección más cercana a tu dirección.</p>
        </div>`;
      } else {
        out.innerHTML = `<div class="card p-4 border-l-4 border-amber-400">
          <p class="font-bold text-amber-700">Ubicación fuera del área o no encontrada</p>
          <p class="text-sm text-slate-600 mt-1">No se encontró "${escapeHtml(sec)}" dentro de Huancayo.</p>
        </div>`;
      }
    } catch (err) {
      out.innerHTML = `<div class="card p-4 border-l-4 border-amber-400">
        <p class="font-bold text-amber-700">No se pudo conectar al buscador</p>
      </div>`;
    }
  });
}

// ============================================================================
// 4. FORMULARIO DE REPORTES Y VISTA PREVIA DE FOTOS
// ============================================================================
const photoInput = $('#reportPhotos');
const photoPreview = $('#photoPreview');
const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

if (photoInput) {
  photoInput.addEventListener('change', () => {
    photoPreview.innerHTML = '';
    const files = [...photoInput.files];
    if (files.length > MAX_FILES) {
      showToast('Máximo ' + MAX_FILES + ' imágenes.');
      photoInput.value = '';
      return;
    }
    for (const f of files) {
      if (!ALLOWED.includes(f.type)) {
        showToast('Tipo no permitido: ' + f.type);
        photoInput.value = '';
        photoPreview.innerHTML = '';
        return;
      }
      if (f.size > MAX_SIZE) {
        showToast('Imagen mayor a 5 MB: ' + f.name);
        photoInput.value = '';
        photoPreview.innerHTML = '';
        return;
      }
    }
    files.forEach(f => {
      const r = new FileReader();
      r.onload = e => {
        const img = document.createElement('img');
        img.src = e.target.result;
        photoPreview.appendChild(img);
      };
      r.readAsDataURL(f);
    });
  });
}

const reportForm = $('#reportForm');
if (reportForm) {
  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const honey = reportForm.querySelector('input[name="_honey"]');
    if (honey && honey.value.trim() !== '') return;

    const last = parseInt(localStorage.getItem('ecolimpia_last_report') || '0', 10);
    if (Date.now() - last < 5000) {
      showToast('Espera unos segundos antes de enviar otro reporte.');
      return;
    }
    localStorage.setItem('ecolimpia_last_report', String(Date.now()));

    const fd = new FormData(reportForm);
    // Evitar enviar partes vacías si no se adjuntaron fotos
    if (!photoInput || !photoInput.files || photoInput.files.length === 0) {
      fd.delete('fotos');
    }
    const required = ['problemType', 'location', 'description', 'dni'];
    for (const r of required) {
      if (!fd.get(r) || !String(fd.get(r)).trim()) {
        showToast('Completa los campos obligatorios (*).');
        return;
      }
    }
    const dni = String(fd.get('dni')).trim();
    if (!/^[0-9]{8}$/.test(dni)) {
      showToast('El DNI debe tener 8 dígitos.');
      return;
    }
    const code = 'EL-' + Date.now().toString(36).toUpperCase().slice(-6);
    const record = {
      code,
      dni,
      problemType: fd.get('problemType'),
      location: fd.get('location'),
      sector: fd.get('sector'),
      description: fd.get('description'),
      date: fd.get('incidentDate'),
      contact: fd.get('contact'),
      status: 'Reporte recibido',
      createdAt: new Date().toISOString()
    };

    const list = JSON.parse(localStorage.getItem('ecolimpia_reports') || '[]');
    list.unshift(record);
    localStorage.setItem('ecolimpia_reports', JSON.stringify(list));

    const subj = reportForm.querySelector('input[name="_subject"]');
    if (subj) subj.value = 'Reporte EcoLimpia ' + code;
    const next = reportForm.querySelector('input[name="_next"]');
    if (next) next.value = window.location.href.split('#')[0] + '#reportar';

    const submitBtn = reportForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
    }

    let isPendingActivation = false;
    if (location.protocol !== 'file:') {
      try {
        const endpoint = reportForm.action.includes('/ajax/') ? reportForm.action : reportForm.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
        const res = await fetch(endpoint, {
          method: 'POST',
          body: fd,
          headers: { 'Accept': 'application/json' }
        });
        const data = await res.json().catch(() => ({}));
        if (data.success === 'false' && data.message && data.message.includes('Activation')) {
          isPendingActivation = true;
        }
      } catch (err) {
        console.warn('Error al enviar formulario:', err);
      }
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar reporte ciudadano';
    }

    let activationNotice = '';
    if (isPendingActivation) {
      activationNotice = `<p class="text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200 mt-2">
        <i class="fa-solid fa-circle-exclamation"></i> <strong>Aviso de activación:</strong> Se ha enviado un correo de confirmación de FormSubmit. Revisa tu bandeja de entrada o Spam y pulsa <em>"Activate Form"</em> para empezar a recibir las alertas directamente.
      </p>`;
    }

    $('#reportResult').innerHTML = `<div class="card p-5 border-l-4 border-green-500 bg-green-50/40">
      <p class="font-bold text-green-800"><i class="fa-solid fa-circle-check"></i> Reporte registrado con éxito</p>
      <p class="text-sm text-slate-700 mt-1">Código de seguimiento: <strong class="font-mono bg-white px-2 py-0.5 rounded border">${code}</strong></p>
      ${activationNotice}
      <p class="text-xs text-slate-600 mt-2">También puedes notificar este código directamente por WhatsApp para atención rápida:</p>
      <a class="btn btn-outline mt-2 text-xs py-2" target="_blank" rel="noopener noreferrer" href="https://wa.me/51983017362?text=${encodeURIComponent('Reporte EcoLimpia ' + code + ': ' + record.problemType + ' en ' + record.location)}"><i class="fa-brands fa-whatsapp"></i> Enviar alerta por WhatsApp</a>
    </div>`;
    reportForm.reset();
    photoPreview.innerHTML = '';
    renderTracking();
    showToast(isPendingActivation ? 'Reporte registrado (pendiente de activar correo)' : 'Reporte enviado. Código: ' + code);
  });
}

function renderTracking() {
  const box = $('#trackingList');
  if (!box) return;
  const list = JSON.parse(localStorage.getItem('ecolimpia_reports') || '[]');
  if (!list.length) {
    box.innerHTML = '<p class="text-sm text-slate-500">Aún no hay reportes registrados en este navegador.</p>';
    return;
  }
  box.innerHTML = list.slice(0, 8).map(r => `
    <div class="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl p-3">
      <div>
        <p class="font-semibold text-sm text-slate-800"><span class="font-mono text-green-700">${r.code}</span> — ${escapeHtml(r.problemType)}</p>
        <p class="text-xs text-slate-500">${escapeHtml(r.location)} · ${new Date(r.createdAt).toLocaleDateString('es-PE')}</p>
      </div>
      <span class="badge badge-pending">${r.status}</span>
    </div>`).join('');
}

// ============================================================================
// 5. FILTROS, INTERÉS, FAQ Y MODAL DE VIDEO
// ============================================================================
const filterBarrio = $('#filterBarrio');
const filterMaterial = $('#filterMaterial');
function applyFilters() {
  const b = (filterBarrio?.value || '').toLowerCase();
  const m = (filterMaterial?.value || '').toLowerCase();
  $$('.point-card').forEach(card => {
    const cb = (card.dataset.barrio || '').toLowerCase();
    const cm = (card.dataset.materiales || '').toLowerCase();
    const show = (!b || cb.includes(b)) && (!m || cm.includes(m));
    card.style.display = show ? '' : 'none';
  });
}
[filterBarrio, filterMaterial].forEach(el => el && el.addEventListener('change', applyFilters));

const interestForm = $('#interestForm');
if (interestForm) {
  interestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(interestForm);
    const honey = interestForm.querySelector('input[name="_honey"]');
    if (honey && honey.value.trim() !== '') return;
    const contact = String(fd.get('contacto') || '').trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const isPhone = /^[0-9+\s-]{7,15}$/.test(contact);
    if (!isEmail && !isPhone) {
      showToast('Ingresa un correo o número de teléfono válido.');
      return;
    }
    const list = JSON.parse(localStorage.getItem('ecolimpia_interest') || '[]');
    list.unshift(Object.fromEntries(fd.entries()));
    localStorage.setItem('ecolimpia_interest', JSON.stringify(list));
    const next = interestForm.querySelector('input[name="_next"]');
    if (next) next.value = window.location.href.split('#')[0] + '#participa';
    if (location.protocol === 'file:') {
      showToast('Guardado localmente. Publica el sitio para enviar por correo.');
    } else {
      const endpoint = interestForm.action.includes('/ajax/') ? interestForm.action : interestForm.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
      fetch(endpoint, {
        method: 'POST',
        body: fd,
        headers: { 'Accept': 'application/json' }
      }).catch(err => console.warn('Error interestForm:', err));
      showToast('Gracias por tu interés. Solicitud enviada.');
      interestForm.reset();
    }
  });
}

const faqSearch = $('#faqSearch');
if (faqSearch) {
  faqSearch.addEventListener('input', () => {
    const q = faqSearch.value.toLowerCase();
    $$('.faq').forEach(d => {
      const txt = d.textContent.toLowerCase();
      d.style.display = txt.includes(q) ? '' : 'none';
    });
  });
}

function showToast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3200);
}

function openVideo(vid) {
  const modal = document.getElementById('videoModal');
  const frame = document.getElementById('videoFrame');
  frame.src = 'https://www.youtube-nocookie.com/embed/' + vid + '?autoplay=1&rel=0';
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}
function closeVideo() {
  const modal = document.getElementById('videoModal');
  const frame = document.getElementById('videoFrame');
  frame.src = '';
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}
window.openVideo = openVideo;
window.closeVideo = closeVideo;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMapModal();
    closeVideo();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Asegurar siempre inicio en la parte superior si la URL no trae un hash específico
  if (!window.location.hash || window.location.hash === '#inicio') {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setTimeout(() => window.scrollTo(0, 0), 50);
  }

  renderTracking();
  initMainAllPointsMap();
  initTruckRoutesMap();

  const sections = $$('section[id]');
  const navLinks = $$('.nav-link');
  if ('IntersectionObserver' in window && sections.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = '#' + entry.target.id;
          navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === id));
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(s => obs.observe(s));
  }
});
