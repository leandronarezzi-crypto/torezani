export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || value === '') return '—';
  return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function statusBadgeClass(status) {
  switch (status) {
    case 'VENCIDO':
      return 'bg-red-100 text-red-800 border border-red-300';
    case 'ALERTA':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    case 'OK':
      return 'bg-green-100 text-green-800 border border-green-300';
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-300';
  }
}

export function statusLabel(status) {
  switch (status) {
    case 'VENCIDO':
      return 'Vencido';
    case 'ALERTA':
      return 'Alerta';
    case 'OK':
      return 'Em dia';
    default:
      return '—';
  }
}

export function statusDotClass(status) {
  switch (status) {
    case 'VENCIDO':
      return 'dot-red';
    case 'ALERTA':
      return 'dot-amber';
    case 'OK':
      return 'dot-green';
    default:
      return 'dot-gray';
  }
}

export function statusDot(status) {
  const dot = statusDotClass(status);
  return `<span class="inline-flex items-center gap-2"><i class="status-dot ${dot}"></i><span class="status-text ${dot} font-medium">${statusLabel(status)}</span></span>`;
}

export function boatIconSvg(className = 'vessel-card-icon') {
  return `
    <svg class="${className}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect fill="currentColor" x="26" y="10" width="4" height="16" rx="1"/>
      <rect fill="currentColor" x="38" y="10" width="4" height="16" rx="1"/>
      <rect fill="currentColor" x="25" y="12" width="18" height="3" rx="1"/>
      <path fill="currentColor" d="M20,28 L48,28 L44,18 L24,18 Z"/>
      <rect fill="currentColor" x="18" y="28" width="32" height="18" rx="2"/>
      <rect fill="#fff" x="22" y="33" width="6" height="8" rx="1"/>
      <rect fill="#fff" x="31" y="33" width="6" height="8" rx="1"/>
      <rect fill="#fff" x="40" y="33" width="6" height="8" rx="1"/>
      <path fill="currentColor" d="M6,46 L62,46 C61,58 55,68 48,75 L44,71 L34,79 L24,71 L20,75 C13,68 7,58 6,46 Z"/>
      <path fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" d="M13,54 C22,60 30,63 34,63 C38,63 46,60 55,54"/>
      <path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M2,84 C7,80 11,80 16,84 C21,88 25,88 30,84 C35,80 39,80 44,84 C49,88 53,88 58,84 C63,80 67,80 72,84"/>
      <path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.55" d="M2,92 C7,88 11,88 16,92 C21,96 25,96 30,92 C35,88 39,88 44,92 C49,96 53,96 58,92 C63,88 67,88 72,92"/>
    </svg>
  `;
}

export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
