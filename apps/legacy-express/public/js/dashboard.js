import { apiGet } from './api.js';
import { statusDot, boatIconSvg, escapeHtml } from './format.js';
import { requireAuth } from './auth.js';

async function load() {
  const user = await requireAuth();
  if (!user) return;

  const [data, embarcacoes] = await Promise.all([apiGet('/dashboard/alertas'), apiGet('/embarcacoes')]);
  renderFrota(embarcacoes);
  renderResumo(data.resumo);
  renderManutencoes(data.manutencoes);
  renderCascoPintura(data.cascoPintura);
}

document.getElementById('btn-atualizar').addEventListener('click', () => load());

function renderFrota(embarcacoes) {
  const el = document.getElementById('frota-cards');
  if (!embarcacoes.length) {
    el.innerHTML = `<p class="text-slate-400 text-sm">Nenhuma embarcação cadastrada ainda.</p>`;
    return;
  }
  el.innerHTML = embarcacoes
    .map(
      (v) => `
    <a href="embarcacao-detail.html?id=${v.id}" class="vessel-card">
      ${boatIconSvg()}
      <span class="vessel-card-name">${escapeHtml(v.nome)}</span>
    </a>
  `
    )
    .join('');
}

function renderResumo(resumo) {
  const tiles = [
    { label: 'Manutenção Vencida', value: resumo.manutencaoVencida, dot: 'dot-red' },
    { label: 'Manutenção em Alerta', value: resumo.manutencaoAlerta, dot: 'dot-amber' },
    { label: 'Casco/Pintura Vencido', value: resumo.cascoPinturaVencido, dot: 'dot-red' },
    { label: 'Casco/Pintura em Alerta', value: resumo.cascoPinturaAlerta, dot: 'dot-amber' },
  ];
  document.getElementById('resumo').innerHTML = tiles
    .map(
      (t) => `
    <div class="legend-card">
      <span class="status-dot ${t.dot}"></span>
      <div>
        <div class="legend-value">${t.value}</div>
        <div class="legend-label">${t.label}</div>
      </div>
    </div>
  `
    )
    .join('');
}

function renderManutencoes(items) {
  const body = document.getElementById('manutencoes-body');
  if (!items.length) {
    body.innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-center text-slate-400">Nenhum alerta de manutenção. Tudo em dia.</td></tr>`;
    return;
  }
  body.innerHTML = items
    .map(
      (item) => `
    <tr class="border-t">
      <td class="px-4 py-3"><a class="text-violet-600 hover:underline" href="embarcacao-detail.html?id=${item.embarcacaoId}">${escapeHtml(item.embarcacaoNome)}</a></td>
      <td class="px-4 py-3">${escapeHtml(item.motorPosicao)}</td>
      <td class="px-4 py-3">${escapeHtml(item.tipoServico)}</td>
      <td class="px-4 py-3">${item.horasRestantes}</td>
      <td class="px-4 py-3">${statusDot(item.status)}</td>
    </tr>
  `
    )
    .join('');
}

function renderCascoPintura(items) {
  const body = document.getElementById('casco-pintura-body');
  if (!items.length) {
    body.innerHTML = `<tr><td colspan="4" class="px-4 py-6 text-center text-slate-400">Nenhum alerta de casco/pintura. Tudo em dia.</td></tr>`;
    return;
  }
  body.innerHTML = items
    .map(
      (item) => `
    <tr class="border-t">
      <td class="px-4 py-3"><a class="text-violet-600 hover:underline" href="embarcacao-detail.html?id=${item.embarcacaoId}">${escapeHtml(item.embarcacaoNome)}</a></td>
      <td class="px-4 py-3">${escapeHtml(item.tipoIntervencao)}</td>
      <td class="px-4 py-3">${item.diasRestantes}</td>
      <td class="px-4 py-3">${statusDot(item.status)}</td>
    </tr>
  `
    )
    .join('');
}

load().catch((err) => {
  document.querySelector('main').insertAdjacentHTML(
    'beforeend',
    `<p class="text-red-600 mt-4">Erro ao carregar dashboard: ${err.message}</p>`
  );
});
