import { apiGet, apiPatch } from './api.js';
import { escapeHtml } from './format.js';
import { requireAuth } from './auth.js';
import { openModal, closeModal, bindModalCancel, showModalError } from './modal.js';

const STATUS_INFO = {
  PENDENTE: { dot: 'dot-amber', label: 'Pendente' },
  APROVADO: { dot: 'dot-green', label: 'Aprovado' },
  REJEITADO: { dot: 'dot-red', label: 'Bloqueado' },
};

const PAPEL_LABEL = {
  ADMIN: 'Administrador',
  EDITOR: 'Pode editar',
  VISUALIZADOR: 'Somente visualizar',
};

let currentUserId = null;
let usuariosAtuais = [];

async function load() {
  const user = await requireAuth();
  if (!user) return;
  if (user.papel !== 'ADMIN') {
    location.href = 'index.html';
    return;
  }
  currentUserId = user.id;

  usuariosAtuais = await apiGet('/admin/usuarios');
  render(usuariosAtuais);
}

function render(usuarios) {
  usuariosAtuais = usuarios;
  const body = document.getElementById('usuarios-body');
  body.innerHTML = usuarios
    .map((u) => {
      const info = STATUS_INFO[u.status] || STATUS_INFO.PENDENTE;
      const isSelf = u.id === currentUserId;
      return `
    <tr class="border-t">
      <td class="px-4 py-3 font-medium">${escapeHtml(u.nome)}${isSelf ? ' <span class="pill">você</span>' : ''}</td>
      <td class="px-4 py-3 text-slate-500">${escapeHtml(u.email)}</td>
      <td class="px-4 py-3"><span class="inline-flex items-center gap-2"><i class="status-dot ${info.dot}"></i><span class="status-text ${info.dot} font-medium">${info.label}</span></span></td>
      <td class="px-4 py-3">
        <select data-id="${u.id}" class="select-papel border border-slate-300 rounded px-2 py-1.5 text-sm" ${isSelf ? 'disabled' : ''}>
          ${Object.entries(PAPEL_LABEL)
            .map(([value, label]) => `<option value="${value}" ${u.papel === value ? 'selected' : ''}>${label}</option>`)
            .join('')}
        </select>
      </td>
      <td class="px-4 py-3 text-right space-x-3 whitespace-nowrap">
        <button data-id="${u.id}" class="btn-editar-usuario text-violet-600 hover:text-violet-800 font-semibold text-xs">Editar</button>
        ${
          u.status !== 'APROVADO'
            ? `<button data-id="${u.id}" data-status="APROVADO" class="btn-status text-green-700 hover:text-green-900 font-semibold text-xs" ${isSelf ? 'disabled' : ''}>Aprovar</button>`
            : ''
        }
        ${
          u.status !== 'REJEITADO'
            ? `<button data-id="${u.id}" data-status="REJEITADO" class="btn-status text-red-600 hover:text-red-800 font-semibold text-xs" ${isSelf ? 'disabled' : ''}>Bloquear</button>`
            : ''
        }
      </td>
    </tr>
  `;
    })
    .join('');

  body.querySelectorAll('.select-papel').forEach((sel) => {
    sel.addEventListener('change', async () => {
      try {
        await apiPatch(`/admin/usuarios/${sel.dataset.id}`, { papel: sel.value });
      } catch (err) {
        alert(err.message);
        load();
      }
    });
  });

  body.querySelectorAll('.btn-status').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await apiPatch(`/admin/usuarios/${btn.dataset.id}`, { status: btn.dataset.status });
        const usuarios2 = await apiGet('/admin/usuarios');
        render(usuarios2);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  body.querySelectorAll('.btn-editar-usuario').forEach((btn) => {
    btn.addEventListener('click', () => {
      const usuario = usuariosAtuais.find((u) => u.id === Number(btn.dataset.id));
      abrirModalEdicao(usuario);
    });
  });
}

function abrirModalEdicao(usuario) {
  openModal(`
    <form id="form-editar-usuario" class="p-6 space-y-4">
      <h3 class="font-semibold text-slate-800 text-lg">Editar Usuário</h3>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Nome</label>
        <input name="nome" required value="${escapeHtml(usuario.nome)}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
        <input type="email" name="email" required value="${escapeHtml(usuario.email)}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Nova senha</label>
        <input type="password" name="senha" minlength="6" placeholder="Deixe em branco para manter a atual" class="w-full border border-slate-300 rounded-lg px-3 py-2">
        <p class="text-xs text-slate-400 mt-1">Preencha apenas se quiser trocar a senha deste usuário.</p>
      </div>
      <p class="modal-error text-sm text-red-600 hidden"></p>
      <div class="flex gap-3 justify-end pt-2">
        <button type="button" class="btn-cancelar text-slate-500 hover:text-slate-700 px-3 py-2 text-sm">Cancelar</button>
        <button type="submit" class="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-lg text-sm">Salvar</button>
      </div>
    </form>
  `);
  bindModalCancel();
  document.getElementById('form-editar-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    if (!fd.senha) delete fd.senha;
    try {
      await apiPatch(`/admin/usuarios/${usuario.id}`, fd);
      closeModal();
      const usuarios2 = await apiGet('/admin/usuarios');
      render(usuarios2);
    } catch (err) {
      showModalError(e.target, err.message);
    }
  });
}

load().catch((err) => {
  const el = document.getElementById('page-error');
  el.textContent = `Erro ao carregar usuários: ${err.message}`;
  el.classList.remove('hidden');
});
