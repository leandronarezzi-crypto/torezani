import { apiGet, apiPost } from './api.js';

const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const toggleParaRegistro = document.getElementById('toggle-para-registro');
const toggleParaLogin = document.getElementById('toggle-para-login');
const alertBox = document.getElementById('alert-box');

async function redirectIfAuthenticated() {
  try {
    await apiGet('/auth/me');
    location.href = 'index.html';
  } catch {
    // não autenticado, permanece na tela de login
  }
}

function showAlert(message, type = 'success') {
  alertBox.textContent = message;
  alertBox.classList.remove('hidden', 'login-alert-success', 'login-alert-error');
  alertBox.classList.add(type === 'success' ? 'login-alert-success' : 'login-alert-error');
}

toggleParaRegistro.querySelector('a').addEventListener('click', (e) => {
  e.preventDefault();
  formLogin.classList.add('hidden');
  formRegistro.classList.remove('hidden');
  toggleParaRegistro.classList.add('hidden');
  toggleParaLogin.classList.remove('hidden');
  alertBox.classList.add('hidden');
});

toggleParaLogin.querySelector('a').addEventListener('click', (e) => {
  e.preventDefault();
  formRegistro.classList.add('hidden');
  formLogin.classList.remove('hidden');
  toggleParaLogin.classList.add('hidden');
  toggleParaRegistro.classList.remove('hidden');
  alertBox.classList.add('hidden');
});

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('login-error');
  errorEl.classList.add('hidden');
  try {
    await apiPost('/auth/login', {
      email: document.getElementById('login-email').value,
      senha: document.getElementById('login-senha').value,
    });
    location.href = 'index.html';
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});

formRegistro.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('registro-error');
  errorEl.classList.add('hidden');
  try {
    await apiPost('/auth/registrar', {
      nome: document.getElementById('registro-nome').value,
      email: document.getElementById('registro-email').value,
      senha: document.getElementById('registro-senha').value,
    });
    formRegistro.reset();
    toggleParaLogin.querySelector('a').click();
    showAlert('Conta criada! Assim que um administrador liberar seu acesso, você poderá entrar.', 'success');
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});

redirectIfAuthenticated();
