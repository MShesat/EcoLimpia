// EcoLimpia - interactividad básica
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

// Mobile nav
const navToggle = $('#navToggle');
const navMenu = $('#navMenu');
if (navToggle) navToggle.addEventListener('click', () => navMenu.classList.toggle('hidden'));

// Smooth close menu on link click (mobile)
$$('.nav-link').forEach(a => a.addEventListener('click', () => {
  if (window.innerWidth < 768) navMenu.classList.add('hidden');
}));

// Photo preview for report form
const photoInput = $('#reportPhotos');
const photoPreview = $('#photoPreview');
const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg','image/png','image/webp','image/gif'];
if (photoInput) {
  photoInput.addEventListener('change', () => {
    photoPreview.innerHTML = '';
    const files = [...photoInput.files];
    if (files.length > MAX_FILES) { showToast('Máximo ' + MAX_FILES + ' imágenes.'); photoInput.value=''; return; }
    for (const f of files) {
      if (!ALLOWED.includes(f.type)) { showToast('Tipo no permitido: ' + f.type); photoInput.value=''; photoPreview.innerHTML=''; return; }
      if (f.size > MAX_SIZE) { showToast('Imagen mayor a 5 MB: ' + f.name); photoInput.value=''; photoPreview.innerHTML=''; return; }
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

// Report form submit (localStorage simulation + optional endpoint)
const reportForm = $('#reportForm');
if (reportForm) {
  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Honeypot
    const honey = reportForm.querySelector('input[name="_honey"]');
    if (honey && honey.value.trim() !== '') return;
    // Rate limit simple (60s)
    const last = parseInt(localStorage.getItem('ecolimpia_last_report') || '0', 10);
    if (Date.now() - last < 60000) { showToast('Espera un momento antes de enviar otro reporte.'); return; }
    localStorage.setItem('ecolimpia_last_report', String(Date.now()));
    const fd = new FormData(reportForm);
    const required = ['problemType','location','description','dni'];
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
      dni: dni,
      problemType: fd.get('problemType'),
      location: fd.get('location'),
      sector: fd.get('sector'),
      description: fd.get('description'),
      date: fd.get('incidentDate'),
      contact: fd.get('contact'),
      status: 'Reporte recibido',
      createdAt: new Date().toISOString()
    };
    // Optional real endpoint (configure in js/config.js if exists)
    const endpoint = (window.ECOLIMPIA_ENDPOINT || '').trim();
    if (endpoint) {
      try {
        await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(record) });
      } catch (err) { console.warn('Endpoint no disponible, guardando localmente', err); }
    }
    const list = JSON.parse(localStorage.getItem('ecolimpia_reports') || '[]');
    list.unshift(record);
    localStorage.setItem('ecolimpia_reports', JSON.stringify(list));
    // Configurar asunto y retorno dinámico
    const subj = reportForm.querySelector('input[name="_subject"]');
    if (subj) subj.value = 'Reporte EcoLimpia ' + code;
    const next = reportForm.querySelector('input[name="_next"]');
    if (next) next.value = window.location.href.split('#')[0] + '#reportar';
    if (location.protocol === 'file:') {
      showToast('Guardado localmente. Publica el sitio para enviar por correo.');
    } else {
      // Enviar con archivos adjuntos a FormSubmit (abre página de confirmación y vuelve)
      reportForm.submit();
    }
    // Reporte anónimo en la plataforma (sin exponer datos personales)
    $('#reportResult').innerHTML = `<div class="card p-4 border-l-4 border-green-500">
      <p class="font-bold text-green-700">Reporte enviado con imágenes.</p>
      <p class="text-sm text-gray-600 mt-1">Código de seguimiento: <strong>${code}</strong></p>
      <p class="text-sm text-gray-500 mt-1">El reporte se envió al correo con las fotos adjuntas. Para enviarlo por WhatsApp (puede mostrar tu número), usa el botón.</p>
      <a class="btn btn-outline mt-2" target="_blank" href="https://wa.me/51983017362?text=${encodeURIComponent('Reporte EcoLimpia ' + code + ': ' + record.problemType + ' en ' + record.location)}"><i class="fa-brands fa-whatsapp"></i> Enviar por WhatsApp</a>
    </div>`;
    reportForm.reset();
    photoPreview.innerHTML = '';
    renderTracking();
    showToast('Reporte enviado. Código: ' + code);
  });
}

// Tracking list render
function renderTracking() {
  const box = $('#trackingList');
  if (!box) return;
  const list = JSON.parse(localStorage.getItem('ecolimpia_reports') || '[]');
  if (!list.length) { box.innerHTML = '<p class="text-sm text-gray-500">Aún no hay reportes registrados en este navegador.</p>'; return; }
  box.innerHTML = list.slice(0,8).map(r => `
    <div class="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
      <div>
        <p class="font-semibold text-sm">${r.code} — ${escapeHtml(r.problemType)}</p>
        <p class="text-xs text-gray-500">${escapeHtml(r.location)} · ${new Date(r.createdAt).toLocaleDateString('es-PE')}</p>
      </div>
      <span class="badge badge-pending">${r.status}</span>
    </div>`).join('');
}
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// Sectors of Huancayo (approx coords) for friendly search
const SECTORS = [
  {name:'Huancayo centro', lat:-12.0653, lng:-75.2049},
  {name:'El Tambo', lat:-12.0500, lng:-75.2200},
  {name:'Chilca', lat:-12.0750, lng:-75.1950},
  {name:'Pilcomayo', lat:-12.0400, lng:-75.1900},
  {name:'Sapallanga', lat:-12.0900, lng:-75.2300},
  {name:'Huancan', lat:-12.0300, lng:-75.2400},
  {name:'San Agustin de Cajas', lat:-12.0100, lng:-75.2600},
  {name:'San Jeronimo de Tunan', lat:-11.9900, lng:-75.2700},
];

function normalize(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').trim(); }
function levenshtein(a,b){ if(!a) return b.length; if(!b) return a.length; const m=[]; for(let i=0;i<=b.length;i++){m[i]=[i];} for(let j=0;j<=a.length;j++){m[0][j]=j;} for(let i=1;i<=b.length;i++) for(let j=1;j<=a.length;j++){m[i][j]=b[i-1]===a[j-1]?m[i-1][j-1]:Math.min(m[i-1][j-1]+1,m[i][j-1]+1,m[i-1][j]+1);} return m[b.length][a.length]; }

// no leaflet map; using Google Maps iframe

const sectorForm = $('#sectorForm');
if (sectorForm) {
  sectorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sec = $('#sectorInput').value.trim();
    const out = $('#sectorResult');
    const iframe = document.getElementById('sectorMap');
    // Restrict search to Huancayo area via Nominatim
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(sec) + '&viewbox=-75.28,-12.00,-75.15,-12.12&bounded=1&limit=1';
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      const data = await res.json();
      if (data && data.length) {
        const lat = data[0].lat, lon = data[0].lon;
        if (iframe) iframe.src = 'https://maps.google.com/maps?q=' + lat + ',' + lon + '&t=&z=18&ie=UTF8&iwloc=&output=embed';
        out.innerHTML = `<div class="card p-4 border-l-4 border-green-500">
          <p class="font-bold text-green-700">Ubicación encontrada en Huancayo</p>
          <p class="text-sm text-gray-600 mt-1">Mostrando: ${escapeHtml(sec)}. Las rutas, días y horarios definitivos están pendientes de coordinación con la Municipalidad.</p>
          <p class="text-sm text-gray-500 mt-1">Estado: Ruta por confirmar · Horario pendiente de coordinación · Información en actualización.</p>
        </div>`;
      } else {
        if (iframe) iframe.src = 'https://maps.google.com/maps?q=Huancayo,Peru&t=&z=13&ie=UTF8&iwloc=&output=embed';
        out.innerHTML = `<div class="card p-4 border-l-4 border-amber-400">
          <p class="font-bold text-amber-700">Servicio no disponible para esta ubicación</p>
          <p class="text-sm text-gray-600 mt-1">"${escapeHtml(sec)}" está fuera de Huancayo o no se encontró en la ciudad. EcoLimpia solo atiende Huancayo.</p>
        </div>`;
      }
    } catch (err) {
      if (iframe) iframe.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(sec + ',Huancayo,Peru') + '&t=&z=18&ie=UTF8&iwloc=&output=embed';
      out.innerHTML = `<div class="card p-4 border-l-4 border-green-500">
        <p class="font-bold text-green-700">Búsqueda realizada: ${escapeHtml(sec)}</p>
        <p class="text-sm text-gray-600 mt-1">Mostrando ubicación en Huancayo.</p>
      </div>`;
    }
    return;

  });
}

// Directory filters
const filterBarrio = $('#filterBarrio');
const filterMaterial = $('#filterMaterial');
function applyFilters() {
  const b = (filterBarrio?.value || '').toLowerCase();
  const m = (filterMaterial?.value || '').toLowerCase();
  $$('.point-card').forEach(card => {
    const cb = (card.dataset.barrio||'').toLowerCase();
    const cm = (card.dataset.materiales||'').toLowerCase();
    const show = (!b || cb.includes(b)) && (!m || cm.includes(m));
    card.style.display = show ? '' : 'none';
  });
}
[filterBarrio, filterMaterial].forEach(el => el && el.addEventListener('change', applyFilters));

// Interest form
const interestForm = $('#interestForm');
if (interestForm) {
  interestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(interestForm);
    const honey = interestForm.querySelector('input[name="_honey"]');
    if (honey && honey.value.trim() !== '') return;
    const contact = String(fd.get('contacto') || '').trim();
    const isEmail = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(contact);
    const isPhone = /^[0-9+\\s-]{7,15}$/.test(contact);
    if (!isEmail && !isPhone) {
      showToast('Ingresa un correo o número de teléfono válido.');
      return;
    }
    const list = JSON.parse(localStorage.getItem('ecolimpia_interest') || '[]');
    list.unshift(Object.fromEntries(fd.entries()));
    localStorage.setItem('ecolimpia_interest', JSON.stringify(list));
    const subj = interestForm.querySelector('input[name="_subject"]');
    if (subj) subj.value = 'Interés en EcoLimpia';
    const next = interestForm.querySelector('input[name="_next"]');
    if (next) next.value = window.location.href.split('#')[0] + '#participa';
    if (location.protocol === 'file:') {
      showToast('Guardado localmente. Publica el sitio para enviar por correo.');
    } else {
      interestForm.submit();
      showToast('Gracias por tu interés. Te contactaremos cuando haya novedades.');
    }
  });
}

// FAQ search (optional)
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

// Toast
function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 3000);
}

// Video modal
function openVideo(vid) {
  const modal = document.getElementById('videoModal');
  const frame = document.getElementById('videoFrame');
  const link = document.getElementById('videoLink');
  frame.style.display = '';
  frame.src = 'https://www.youtube-nocookie.com/embed/' + vid + '?autoplay=1&rel=0';
  link.href = 'https://www.youtube.com/watch?v=' + vid;
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

// Init
renderTracking();
// Animate counters placeholder (static text, no fake numbers)
// nothing

// Video modal simple: open in new tab handled by links

document.addEventListener('DOMContentLoaded', () => {
  // mark active nav
});