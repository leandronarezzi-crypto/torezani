import { apiGet, apiDelete } from './api.js';
import { escapeHtml } from './format.js';
import { requireAuth } from './auth.js';

let allItems = [];

async function load() {
  const user = await requireAuth();
  if (!user) return;
  allItems = await apiGet('/embarcacoes');
  render(allItems);
}

function render(items) {
  const body = document.getElementById('embarcacoes-body');

  if (!items.length) {
    body.innerHTML = `<tr><td colspan="3" class="px-4 py-6 text-center text-slate-400">Nenhuma embarcação encontrada.</td></tr>`;
    return;
  }

  body.innerHTML = items
    .map(
      (v) => `
    <tr class="border-t">
      <td class="px-4 py-3 font-medium"><a class="text-violet-600 hover:underline" href="embarcacao-detail.html?id=${v.id}">${escapeHtml(v.nome)}</a></td>
      <td class="px-4 py-3"><span class="pill">${escapeHtml(v.tipo_configuracao)}</span></td>
      <td class="px-4 py-3 text-right space-x-3">
        <a href="embarcacao-form.html?id=${v.id}" class="write-only text-slate-600 hover:text-violet-600">Editar</a>
        <button data-id="${v.id}" data-nome="${escapeHtml(v.nome)}" class="btn-excluir write-only text-red-600 hover:text-red-800">Excluir</button>
      </td>
    </tr>
  `
    )
    .join('');

  body.querySelectorAll('.btn-excluir').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm(`Excluir a embarcação "${btn.dataset.nome}"? Todos os dados relacionados (motores, manutenções, histórico) serão removidos permanentemente.`)) return;
      await apiDelete(`/embarcacoes/${btn.dataset.id}`);
      load();
    });
  });
}

document.getElementById('search-embarcacoes').addEventListener('input', (e) => {
  const term = e.target.value.trim().toLowerCase();
  render(allItems.filter((v) => v.nome.toLowerCase().includes(term)));
});

load().catch((err) => {
  document.getElementById('page-error').textContent = `Erro ao carregar embarcações: ${err.message}`;
  document.getElementById('page-error').classList.remove('hidden');
});
