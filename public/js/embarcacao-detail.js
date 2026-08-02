import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api.js';
import { formatDate, formatNumber, statusDot, escapeHtml } from './format.js';
import { openModal, closeModal, bindModalCancel, showModalError } from './modal.js';
import { requireAuth } from './auth.js';

const params = new URLSearchParams(location.search);
const embarcacaoId = params.get('id');

let data = null;
let activeMotorId = null;

async function load() {
  const user = await requireAuth();
  if (!user) return;
  if (!embarcacaoId) {
    location.href = 'embarcacoes.html';
    return;
  }
  data = await apiGet(`/embarcacoes/${embarcacaoId}/detail`);
  if (!activeMotorId || !data.motores.some((m) => m.id === activeMotorId)) {
    activeMotorId = data.motores[0].id;
  }
  document.title = `${data.nome} - Torezani Apoio Marítimo`;
  renderHeader();
  renderTabs();
  renderEnginePanel();
  renderCascoPintura();
}

function renderHeader() {
  document.getElementById('vessel-header').innerHTML = `
    <div>
      <div class="topbar-subtitle"><a href="embarcacoes.html" class="hover:underline">Embarcações</a> / ${escapeHtml(data.nome)}</div>
      <div class="topbar-title">${escapeHtml(data.nome)}</div>
      <span class="pill mt-1">${escapeHtml(data.tipo_configuracao)}</span>
    </div>
    <div class="flex gap-3">
      <a href="embarcacao-form.html?id=${data.id}" class="btn-outline write-only">Editar</a>
      <button id="btn-excluir-embarcacao" class="write-only text-sm text-red-600 hover:text-red-800 px-3 py-2 font-semibold">Excluir Embarcação</button>
    </div>
  `;
  document.getElementById('btn-excluir-embarcacao').addEventListener('click', async () => {
    if (!confirm(`Excluir "${data.nome}" e todo o seu histórico permanentemente?`)) return;
    await apiDelete(`/embarcacoes/${data.id}`);
    location.href = 'embarcacoes.html';
  });
}

function renderTabs() {
  const tabsEl = document.getElementById('engine-tabs');
  if (data.motores.length <= 1) {
    tabsEl.innerHTML = '';
    return;
  }
  tabsEl.innerHTML = data.motores
    .map(
      (m) => `
    <button data-motor-id="${m.id}" class="tab-btn px-4 py-2 text-sm font-medium ${m.id === activeMotorId ? 'active' : 'text-slate-500 hover:text-slate-700'}">
      ${escapeHtml(m.posicao)}
    </button>
  `
    )
    .join('');
  tabsEl.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeMotorId = Number(btn.dataset.motorId);
      renderTabs();
      renderEnginePanel();
    });
  });
}

function renderEnginePanel() {
  const motor = data.motores.find((m) => m.id === activeMotorId);
  const panel = document.getElementById('engine-panel');
  panel.innerHTML = `
    <div class="grid md:grid-cols-2 gap-6">
      ${specsCard(motor)}
      ${gearboxCard(motor)}
      ${shaftCard(motor)}
      ${beltsCard(motor)}
    </div>
    ${maintenanceCard(motor)}
  `;
  wireSpecsCard(motor);
  wireGearboxCard(motor);
  wireShaftCard(motor);
  wireBeltsCard(motor);
  wireMaintenanceCard(motor);

  if (document.body.classList.contains('role-viewer')) {
    panel.querySelectorAll('input, select, textarea').forEach((el) => { el.disabled = true; });
  }
}

// --- Especificações do motor ---

function specsCard(motor) {
  return `
    <div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-slate-700">Especificações do Motor</h3>
        <button id="btn-atualizar-horimetro" class="write-only text-xs bg-violet-50 text-violet-700 font-semibold px-2 py-1 rounded hover:bg-violet-100">Atualizar Horímetro</button>
      </div>
      <p class="text-sm text-slate-500 mb-3">Horímetro atual: <span class="font-bold text-slate-800">${formatNumber(motor.horimetro_atual)} h</span></p>
      <form id="form-motor" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Marca</label>
            <input name="marca" value="${escapeHtml(motor.marca || '')}" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Modelo</label>
            <input name="modelo" value="${escapeHtml(motor.modelo || '')}" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Potência</label>
            <input name="potencia_config" value="${escapeHtml(motor.potencia_config || '')}" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Nº de Série</label>
            <input name="num_serie" value="${escapeHtml(motor.num_serie || '')}" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
          </div>
        </div>
        <button type="submit" class="write-only text-sm bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded">Salvar</button>
      </form>
    </div>
  `;
}

function wireSpecsCard(motor) {
  document.getElementById('btn-atualizar-horimetro').addEventListener('click', () => {
    openModal(`
      <form id="form-horimetro" class="p-6 space-y-4">
        <h3 class="font-semibold text-slate-800 text-lg">Atualizar Horímetro — ${escapeHtml(motor.posicao)}</h3>
        <p class="text-sm text-slate-500">Valor atual: ${formatNumber(motor.horimetro_atual)} h. O novo valor deve ser maior ou igual ao atual.</p>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Novo Horímetro</label>
          <input type="number" step="0.01" min="0" name="horimetro_atual" required value="${motor.horimetro_atual}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
        </div>
        <p class="modal-error text-sm text-red-600 hidden"></p>
        <div class="flex gap-3 justify-end pt-2">
          <button type="button" class="btn-cancelar text-slate-500 hover:text-slate-700 px-3 py-2 text-sm">Cancelar</button>
          <button type="submit" class="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-lg text-sm">Salvar</button>
        </div>
      </form>
    `);
    bindModalCancel();
    document.getElementById('form-horimetro').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      try {
        await apiPatch(`/motores/${motor.id}/horimetro`, { horimetro_atual: form.horimetro_atual.value });
        closeModal();
        await load();
      } catch (err) {
        showModalError(form, err.message);
      }
    });
  });

  document.getElementById('form-motor').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    await apiPut(`/motores/${motor.id}`, fd);
    await load();
  });
}

// --- Caixa Reversora ---

function gearboxCard(motor) {
  const cr = motor.caixaReversora || {};
  return `
    <div class="card p-5">
      <h3 class="font-semibold text-slate-700 mb-3">Caixa Reversora</h3>
      <form id="form-caixa-reversora" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Marca</label>
            <input name="marca" value="${escapeHtml(cr.marca || '')}" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Modelo</label>
            <input name="modelo" value="${escapeHtml(cr.modelo || '')}" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
          </div>
          <div class="col-span-2">
            <label class="block text-xs font-medium text-slate-600 mb-1">Ratio (Redução)</label>
            <input name="ratio" value="${escapeHtml(cr.ratio || '')}" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
          </div>
        </div>
        <button type="submit" class="write-only text-sm bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded">Salvar</button>
      </form>
    </div>
  `;
}

function wireGearboxCard(motor) {
  document.getElementById('form-caixa-reversora').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    await apiPut(`/motores/${motor.id}/caixa-reversora`, fd);
    await load();
  });
}

// --- Sistema Eixo / Hélice ---

function shaftCard(motor) {
  const eh = motor.sistemaEixoHelice || {};
  return `
    <div class="card p-5">
      <h3 class="font-semibold text-slate-700 mb-3">Sistema Eixo / Hélice</h3>
      <form id="form-eixo-helice" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Diâmetro Hélice</label>
            <input name="diametro_helice" value="${escapeHtml(eh.diametro_helice || '')}" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Passo Hélice</label>
            <input name="passo_helice" value="${escapeHtml(eh.passo_helice || '')}" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Nº de Pás</label>
            <input type="number" name="num_pas" value="${eh.num_pas ?? ''}" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Diâmetro Eixo</label>
            <input name="diametro_eixo" value="${escapeHtml(eh.diametro_eixo || '')}" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Grau do Cone</label>
            <input name="grau_cone" value="${escapeHtml(eh.grau_cone || '')}" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Comprimento Cone</label>
            <input name="comprimento_cone" value="${escapeHtml(eh.comprimento_cone || '')}" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
          </div>
        </div>
        <button type="submit" class="write-only text-sm bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded">Salvar</button>
      </form>
    </div>
  `;
}

function wireShaftCard(motor) {
  document.getElementById('form-eixo-helice').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    await apiPut(`/motores/${motor.id}/sistema-eixo-helice`, fd);
    await load();
  });
}

// --- Correias ---

function beltsCard(motor) {
  const rows =
    motor.correias
      .map(
        (c) => `
    <tr class="border-t">
      <td class="px-3 py-2">${escapeHtml(c.funcao_aplicacao || '')}</td>
      <td class="px-3 py-2">${escapeHtml(c.especificacao_tamanho || '')}</td>
      <td class="px-3 py-2">${c.quantidade}</td>
      <td class="px-3 py-2 text-right space-x-2 whitespace-nowrap">
        <button data-id="${c.id}" class="btn-editar-correia write-only text-slate-600 hover:text-violet-600 text-xs">Editar</button>
        <button data-id="${c.id}" class="btn-excluir-correia write-only text-red-600 hover:text-red-800 text-xs">Excluir</button>
      </td>
    </tr>
  `
      )
      .join('') || `<tr><td colspan="4" class="px-3 py-4 text-center text-slate-400 text-sm">Nenhuma correia cadastrada.</td></tr>`;

  return `
    <div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-slate-700">Correias</h3>
        <button id="btn-nova-correia" class="write-only text-xs bg-violet-50 text-violet-700 font-semibold px-2 py-1 rounded hover:bg-violet-100">+ Adicionar</button>
      </div>
      <table class="w-full text-sm text-left">
        <thead class="text-slate-500 text-xs uppercase">
          <tr><th class="px-3 py-1">Função</th><th class="px-3 py-1">Especificação</th><th class="px-3 py-1">Qtd</th><th></th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function correiaModalForm(correia) {
  const isEdit = !!correia;
  return `
    <form id="form-correia" class="p-6 space-y-4">
      <h3 class="font-semibold text-slate-800 text-lg">${isEdit ? 'Editar' : 'Nova'} Correia</h3>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Função / Aplicação</label>
        <input name="funcao_aplicacao" required value="${escapeHtml(correia?.funcao_aplicacao || '')}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Especificação / Tamanho</label>
        <input name="especificacao_tamanho" value="${escapeHtml(correia?.especificacao_tamanho || '')}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
        <input type="number" min="1" name="quantidade" value="${correia?.quantidade ?? 1}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
      </div>
      <p class="modal-error text-sm text-red-600 hidden"></p>
      <div class="flex gap-3 justify-end pt-2">
        <button type="button" class="btn-cancelar text-slate-500 hover:text-slate-700 px-3 py-2 text-sm">Cancelar</button>
        <button type="submit" class="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-lg text-sm">Salvar</button>
      </div>
    </form>
  `;
}

function wireBeltsCard(motor) {
  document.getElementById('btn-nova-correia').addEventListener('click', () => {
    openModal(correiaModalForm(null));
    bindModalCancel();
    document.getElementById('form-correia').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      try {
        await apiPost(`/motores/${motor.id}/correias`, fd);
        closeModal();
        await load();
      } catch (err) {
        showModalError(e.target, err.message);
      }
    });
  });

  motor.correias.forEach((c) => {
    document.querySelector(`.btn-editar-correia[data-id="${c.id}"]`).addEventListener('click', () => {
      openModal(correiaModalForm(c));
      bindModalCancel();
      document.getElementById('form-correia').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.target));
        try {
          await apiPut(`/correias/${c.id}`, fd);
          closeModal();
          await load();
        } catch (err) {
          showModalError(e.target, err.message);
        }
      });
    });
    document.querySelector(`.btn-excluir-correia[data-id="${c.id}"]`).addEventListener('click', async () => {
      if (!confirm('Excluir esta correia?')) return;
      await apiDelete(`/correias/${c.id}`);
      await load();
    });
  });
}

// --- Manutenção Preventiva ---

function maintenanceCard(motor) {
  const rows =
    motor.manutencoes
      .map(
        (m) => `
    <tr class="border-t">
      <td class="px-3 py-2">${escapeHtml(m.tipo_servico)}</td>
      <td class="px-3 py-2">${formatNumber(m.horimetro_ultima_troca)} h</td>
      <td class="px-3 py-2">${m.intervalo_horas} h</td>
      <td class="px-3 py-2">${formatNumber(m.proximaTroca)} h</td>
      <td class="px-3 py-2">${formatNumber(m.horasRestantes)} h</td>
      <td class="px-3 py-2">${statusDot(m.status)}</td>
      <td class="px-3 py-2 text-right space-x-2 whitespace-nowrap">
        <button data-id="${m.id}" class="btn-registrar-servico write-only text-green-700 hover:text-green-900 text-xs font-semibold">Registrar Serviço</button>
        <button data-id="${m.id}" class="btn-editar-manutencao write-only text-slate-600 hover:text-violet-600 text-xs">Editar</button>
        <button data-id="${m.id}" class="btn-excluir-manutencao write-only text-red-600 hover:text-red-800 text-xs">Excluir</button>
      </td>
    </tr>
  `
      )
      .join('') || `<tr><td colspan="7" class="px-3 py-4 text-center text-slate-400 text-sm">Nenhuma manutenção cadastrada.</td></tr>`;

  return `
    <div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-slate-700">Manutenção Preventiva</h3>
        <button id="btn-nova-manutencao" class="write-only text-xs bg-violet-50 text-violet-700 font-semibold px-2 py-1 rounded hover:bg-violet-100">+ Nova Manutenção</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-slate-500 text-xs uppercase">
            <tr>
              <th class="px-3 py-1">Serviço</th><th class="px-3 py-1">Última Troca</th><th class="px-3 py-1">Intervalo</th>
              <th class="px-3 py-1">Próxima Troca</th><th class="px-3 py-1">Restam</th><th class="px-3 py-1">Status</th><th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function manutencaoModalForm(manutencao) {
  const isEdit = !!manutencao;
  return `
    <form id="form-manutencao" class="p-6 space-y-4">
      <h3 class="font-semibold text-slate-800 text-lg">${isEdit ? 'Editar' : 'Nova'} Manutenção</h3>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Tipo de Serviço</label>
        <input name="tipo_servico" required value="${escapeHtml(manutencao?.tipo_servico || '')}" placeholder="Ex: OLEO_MOTOR, FILTRO_DIESEL" class="w-full border border-slate-300 rounded-lg px-3 py-2">
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Horímetro da Última Troca</label>
        <input type="number" step="0.01" min="0" name="horimetro_ultima_troca" value="${manutencao?.horimetro_ultima_troca ?? 0}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Intervalo (horas)</label>
        <input type="number" min="1" name="intervalo_horas" required value="${manutencao?.intervalo_horas ?? ''}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Alertar quando faltar (horas)</label>
        <input type="number" min="0" name="alerta_limite_horas" value="${manutencao?.alerta_limite_horas ?? 50}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
      </div>
      <p class="modal-error text-sm text-red-600 hidden"></p>
      <div class="flex gap-3 justify-end pt-2">
        <button type="button" class="btn-cancelar text-slate-500 hover:text-slate-700 px-3 py-2 text-sm">Cancelar</button>
        <button type="submit" class="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-lg text-sm">Salvar</button>
      </div>
    </form>
  `;
}

function wireMaintenanceCard(motor) {
  document.getElementById('btn-nova-manutencao').addEventListener('click', () => {
    openModal(manutencaoModalForm(null));
    bindModalCancel();
    document.getElementById('form-manutencao').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      try {
        await apiPost(`/motores/${motor.id}/manutencoes`, fd);
        closeModal();
        await load();
      } catch (err) {
        showModalError(e.target, err.message);
      }
    });
  });

  motor.manutencoes.forEach((m) => {
    document.querySelector(`.btn-editar-manutencao[data-id="${m.id}"]`).addEventListener('click', () => {
      openModal(manutencaoModalForm(m));
      bindModalCancel();
      document.getElementById('form-manutencao').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.target));
        try {
          await apiPut(`/manutencoes/${m.id}`, fd);
          closeModal();
          await load();
        } catch (err) {
          showModalError(e.target, err.message);
        }
      });
    });
    document.querySelector(`.btn-excluir-manutencao[data-id="${m.id}"]`).addEventListener('click', async () => {
      if (!confirm('Excluir este item de manutenção?')) return;
      await apiDelete(`/manutencoes/${m.id}`);
      await load();
    });
    document.querySelector(`.btn-registrar-servico[data-id="${m.id}"]`).addEventListener('click', async () => {
      if (!confirm(`Registrar serviço de "${m.tipo_servico}" com o horímetro atual (${formatNumber(motor.horimetro_atual)} h)?`)) return;
      await apiPatch(`/manutencoes/${m.id}/registrar-servico`, {});
      await load();
    });
  });
}

// --- Casco / Pintura (nível embarcação) ---

function renderCascoPintura() {
  const rows =
    data.cascoPintura
      .map(
        (c) => `
    <tr class="border-t">
      <td class="px-4 py-3">${escapeHtml(c.tipo_intervencao)}</td>
      <td class="px-4 py-3">${formatDate(c.data_execucao)}</td>
      <td class="px-4 py-3">${c.horimetro_embarcacao != null ? formatNumber(c.horimetro_embarcacao) + ' h' : '—'}</td>
      <td class="px-4 py-3">${formatDate(c.alerta_vencimento_data)}</td>
      <td class="px-4 py-3">${statusDot(c.status)}</td>
      <td class="px-4 py-3 text-right space-x-2 whitespace-nowrap">
        <button data-id="${c.id}" class="btn-editar-casco-pintura write-only text-slate-600 hover:text-violet-600 text-xs">Editar</button>
        <button data-id="${c.id}" class="btn-excluir-casco-pintura write-only text-red-600 hover:text-red-800 text-xs">Excluir</button>
      </td>
    </tr>
  `
      )
      .join('') || `<tr><td colspan="6" class="px-4 py-6 text-center text-slate-400">Nenhum registro de casco/pintura ainda.</td></tr>`;

  document.getElementById('casco-pintura-body').innerHTML = rows;

  document.getElementById('btn-novo-casco-pintura').onclick = () => {
    openModal(cascoPinturaModalForm(null));
    bindModalCancel();
    document.getElementById('form-casco-pintura').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      try {
        await apiPost(`/embarcacoes/${data.id}/casco-pintura`, fd);
        closeModal();
        await load();
      } catch (err) {
        showModalError(e.target, err.message);
      }
    });
  };

  data.cascoPintura.forEach((c) => {
    document.querySelector(`.btn-editar-casco-pintura[data-id="${c.id}"]`).addEventListener('click', () => {
      openModal(cascoPinturaModalForm(c));
      bindModalCancel();
      document.getElementById('form-casco-pintura').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.target));
        try {
          await apiPut(`/casco-pintura/${c.id}`, fd);
          closeModal();
          await load();
        } catch (err) {
          showModalError(e.target, err.message);
        }
      });
    });
    document.querySelector(`.btn-excluir-casco-pintura[data-id="${c.id}"]`).addEventListener('click', async () => {
      if (!confirm('Excluir este registro de casco/pintura?')) return;
      await apiDelete(`/casco-pintura/${c.id}`);
      await load();
    });
  });
}

function cascoPinturaModalForm(item) {
  const isEdit = !!item;
  return `
    <form id="form-casco-pintura" class="p-6 space-y-4">
      <h3 class="font-semibold text-slate-800 text-lg">${isEdit ? 'Editar' : 'Novo'} Registro de Casco/Pintura</h3>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Tipo de Intervenção</label>
        <select name="tipo_intervencao" required class="w-full border border-slate-300 rounded-lg px-3 py-2">
          <option value="CASCO" ${item?.tipo_intervencao === 'CASCO' ? 'selected' : ''}>Casco</option>
          <option value="PINTURA" ${item?.tipo_intervencao === 'PINTURA' ? 'selected' : ''}>Pintura</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Data de Execução</label>
          <input type="date" name="data_execucao" value="${item?.data_execucao ? item.data_execucao.substring(0, 10) : ''}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Horímetro da Embarcação</label>
          <input type="number" step="0.01" name="horimetro_embarcacao" value="${item?.horimetro_embarcacao ?? ''}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Esquema de Produtos</label>
        <textarea name="esquema_produtos" rows="2" class="w-full border border-slate-300 rounded-lg px-3 py-2">${escapeHtml(item?.esquema_produtos || '')}</textarea>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Observações</label>
        <textarea name="historico_observacoes" rows="2" class="w-full border border-slate-300 rounded-lg px-3 py-2">${escapeHtml(item?.historico_observacoes || '')}</textarea>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Data de Vencimento do Alerta</label>
        <input type="date" name="alerta_vencimento_data" value="${item?.alerta_vencimento_data ? item.alerta_vencimento_data.substring(0, 10) : ''}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
        <p class="text-xs text-slate-400 mt-1">Ex: validade de tinta anti-incrustante (geralmente 36 meses).</p>
      </div>
      <p class="modal-error text-sm text-red-600 hidden"></p>
      <div class="flex gap-3 justify-end pt-2">
        <button type="button" class="btn-cancelar text-slate-500 hover:text-slate-700 px-3 py-2 text-sm">Cancelar</button>
        <button type="submit" class="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-lg text-sm">Salvar</button>
      </div>
    </form>
  `;
}

load().catch((err) => {
  const el = document.getElementById('page-error');
  el.textContent = `Erro ao carregar embarcação: ${err.message}`;
  el.classList.remove('hidden');
});
