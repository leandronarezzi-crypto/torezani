import { apiGet, apiPatch } from './api.js';
import { escapeHtml } from './format.js';
import { requireAuth } from './auth.js';

const DEFAULT_CENTER = [-14.5, -45];
const DEFAULT_ZOOM = 4;

let map = null;
let markers = new Map();

async function load() {
  const user = await requireAuth();
  if (!user) return;

  map = L.map('mapa').setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);

  const embarcacoes = await apiGet('/embarcacoes');
  renderLista(embarcacoes);
  renderMarcadores(embarcacoes);

  acompanharSidebar();
}

function acompanharSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const appMain = document.querySelector('.app-main');
  if (!sidebar || !appMain) return;

  let raf = null;
  const acompanhar = (duracaoMs) => {
    cancelAnimationFrame(raf);
    const inicio = performance.now();
    const passo = (agora) => {
      map.invalidateSize();
      if (agora - inicio < duracaoMs) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
  };

  sidebar.addEventListener('mouseenter', () => {
    appMain.classList.add('sidebar-expanded');
    acompanhar(250);
  });
  sidebar.addEventListener('mouseleave', () => {
    appMain.classList.remove('sidebar-expanded');
    acompanhar(250);
  });
}

function renderMarcadores(embarcacoes) {
  markers.forEach((m) => map.removeLayer(m));
  markers = new Map();

  const comCoordenadas = embarcacoes.filter((v) => v.latitude != null && v.longitude != null);
  comCoordenadas.forEach((v) => {
    const marker = L.marker([Number(v.latitude), Number(v.longitude)]).addTo(map);
    marker.bindPopup(
      `<strong>${escapeHtml(v.nome)}</strong><br><a href="embarcacao-detail.html?id=${v.id}">Ver detalhes</a>`
    );
    markers.set(v.id, marker);
  });

  if (comCoordenadas.length) {
    const bounds = L.latLngBounds(comCoordenadas.map((v) => [Number(v.latitude), Number(v.longitude)]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }
}

function renderLista(embarcacoes) {
  const el = document.getElementById('lista-localizacoes');
  if (!embarcacoes.length) {
    el.innerHTML = `<p class="text-slate-400 text-sm p-4">Nenhuma embarcação cadastrada ainda.</p>`;
    return;
  }

  el.innerHTML = embarcacoes
    .map((v) => {
      const temCoords = v.latitude != null && v.longitude != null;
      return `
    <div class="map-vessel-row" data-id="${v.id}">
      <div class="map-vessel-name">${escapeHtml(v.nome)}</div>
      <div class="map-vessel-coords">${temCoords ? `${Number(v.latitude).toFixed(6)}, ${Number(v.longitude).toFixed(6)}` : 'Sem coordenadas cadastradas'}</div>
      <div class="map-coord-inputs write-only">
        <input type="number" step="any" min="-90" max="90" class="input-lat" placeholder="Latitude" value="${temCoords ? v.latitude : ''}">
        <input type="number" step="any" min="-180" max="180" class="input-lng" placeholder="Longitude" value="${temCoords ? v.longitude : ''}">
      </div>
      <div class="map-row-actions">
        <button class="btn-salvar-coord map-btn-salvar write-only" data-id="${v.id}">Salvar</button>
        <button class="btn-centralizar map-btn-centralizar" data-id="${v.id}" ${temCoords ? '' : 'disabled style="opacity:.4;cursor:not-allowed"'}>Centralizar</button>
      </div>
    </div>
  `;
    })
    .join('');

  el.querySelectorAll('.btn-centralizar').forEach((btn) => {
    btn.addEventListener('click', () => {
      const marker = markers.get(Number(btn.dataset.id));
      if (!marker) return;
      map.setView(marker.getLatLng(), 13);
      marker.openPopup();
    });
  });

  el.querySelectorAll('.btn-salvar-coord').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('.map-vessel-row');
      const latitude = row.querySelector('.input-lat').value;
      const longitude = row.querySelector('.input-lng').value;
      if (latitude === '' || longitude === '') {
        alert('Preencha latitude e longitude.');
        return;
      }
      try {
        await apiPatch(`/embarcacoes/${btn.dataset.id}/localizacao`, { latitude, longitude });
        const embarcacoes = await apiGet('/embarcacoes');
        renderLista(embarcacoes);
        renderMarcadores(embarcacoes);
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

load().catch((err) => {
  const el = document.getElementById('page-error');
  el.textContent = `Erro ao carregar o mapa: ${err.message}`;
  el.classList.remove('hidden');
});
