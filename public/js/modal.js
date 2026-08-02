export function openModal(innerHtml) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div id="modal-overlay" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        ${innerHtml}
      </div>
    </div>
  `;
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
}

export function closeModal() {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
}

export function bindModalCancel() {
  document.querySelectorAll('.btn-cancelar').forEach((btn) => btn.addEventListener('click', closeModal));
}

export function showModalError(form, message) {
  const el = form.querySelector('.modal-error');
  if (el) {
    el.textContent = message;
    el.classList.remove('hidden');
  }
}
