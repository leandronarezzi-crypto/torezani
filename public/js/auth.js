import { apiGet, apiPost } from './api.js';

export async function requireAuth() {
  let user;
  try {
    user = await apiGet('/auth/me');
  } catch {
    location.href = 'login.html';
    return null;
  }

  if (user.papel === 'VISUALIZADOR') {
    document.body.classList.add('role-viewer');
  }
  document.querySelectorAll('.admin-only').forEach((el) => {
    el.style.display = user.papel === 'ADMIN' ? '' : 'none';
  });

  const sair = async () => {
    if (!confirm('Deseja sair da sua conta?')) return;
    await apiPost('/auth/logout');
    location.href = 'login.html';
  };

  const avatar = document.getElementById('btn-logout');
  if (avatar) {
    avatar.textContent = initials(user.nome);
    avatar.title = `${user.nome} — clique para sair`;
    avatar.addEventListener('click', sair);
  }

  const sidebarLogout = document.getElementById('btn-logout-sidebar');
  if (sidebarLogout) {
    sidebarLogout.addEventListener('click', sair);
  }

  return user;
}

function initials(nome) {
  const parts = String(nome || '').trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}
