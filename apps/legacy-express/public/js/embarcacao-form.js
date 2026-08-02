import { apiGet, apiPost, apiPut } from './api.js';
import { requireAuth } from './auth.js';

const params = new URLSearchParams(location.search);
const id = params.get('id');
const form = document.getElementById('form-embarcacao');
const nomeInput = document.getElementById('nome');
const tipoSelect = document.getElementById('tipo_configuracao');
const errorEl = document.getElementById('form-error');

async function init() {
  const user = await requireAuth();
  if (!user) return;
  if (user.papel === 'VISUALIZADOR') {
    location.href = 'embarcacoes.html';
    return;
  }
  if (id) {
    document.getElementById('page-title').textContent = 'Editar Embarcação';
    document.title = 'Editar Embarcação - Torezani Apoio Marítimo';
    const vessel = await apiGet(`/embarcacoes/${id}`);
    nomeInput.value = vessel.nome;
    tipoSelect.value = vessel.tipo_configuracao;
    tipoSelect.disabled = true;
    tipoSelect.classList.add('bg-slate-100', 'text-slate-500');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.classList.add('hidden');
  try {
    if (id) {
      await apiPut(`/embarcacoes/${id}`, { nome: nomeInput.value });
      location.href = 'embarcacoes.html';
    } else {
      const created = await apiPost('/embarcacoes', { nome: nomeInput.value, tipo_configuracao: tipoSelect.value });
      location.href = `embarcacao-detail.html?id=${created.id}`;
    }
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});

init().catch((err) => {
  errorEl.textContent = err.message;
  errorEl.classList.remove('hidden');
});
