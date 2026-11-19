import { APP_CONFIG } from '../config/appConfig.js';
import { authService } from '../services/authService.js';
import { router, getDefaultRouteForRole } from '../core/router.js';
import { createInstallButton } from '../components/installButton.js';
import { showToast } from '../components/toast.js';

export async function renderAuthView(container) {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'stack-md';

  // Encart d'installation PWA
  const installCard = document.createElement('section');
  installCard.className = 'card stack-sm';
  installCard.innerHTML = `
    <h2 class="card-title">Application mobile / PWA</h2>
    <p class="text-muted">Installez l’application sur votre écran d’accueil Android ou web mobile pour un accès rapide.</p>
  `;
  const installBtn = createInstallButton({
    variant: 'banner',
    onStatus: (msg, type) => showToast(msg, type)
  });
  installCard.appendChild(installBtn);
  wrapper.appendChild(installCard);

  // Carte de connexion
  const loginCard = document.createElement('section');
  loginCard.className = 'card stack-md';
  loginCard.innerHTML = `
    <div>
      <h1 class="card-title">Connexion</h1>
      <p class="text-muted">Accédez à votre espace selon votre rôle (Client, Éboueur ou Admin).</p>
    </div>
    <form id="login-form" class="stack-md">
      <div class="form-group">
        <label class="form-label" for="login-email">Adresse e-mail</label>
        <input id="login-email" name="email" type="email" class="form-control" required placeholder="ex: client@collecte.cm" />
      </div>
      <div class="form-group">
        <label class="form-label" for="login-role">Rôle d’accès (optionnel)</label>
        <select id="login-role" name="role" class="form-control">
          <option value="">Rôle par défaut du compte</option>
          <option value="${APP_CONFIG.ROLES.CLIENT}">Client</option>
          <option value="${APP_CONFIG.ROLES.EBOUEUR}">Éboueur</option>
          <option value="${APP_CONFIG.ROLES.ADMIN}">Admin</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary btn-block">Se connecter</button>
    </form>
    <div class="stack-sm" style="border-top: 1px solid var(--color-border); padding-top: 12px;">
      <p class="text-muted"><strong>Comptes de démonstration :</strong></p>
      <div style="display:flex; flex-wrap:wrap; gap:8px;">
        <button type="button" class="btn btn-sm btn-secondary" data-demo-email="client@collecte.cm">Démo Client</button>
        <button type="button" class="btn btn-sm btn-secondary" data-demo-email="eboueur@collecte.cm">Démo Éboueur</button>
        <button type="button" class="btn btn-sm btn-secondary" data-demo-email="admin@collecte.cm">Démo Admin</button>
      </div>
    </div>
  `;
  wrapper.appendChild(loginCard);

  // Carte d'inscription rapide
  const registerCard = document.createElement('section');
  registerCard.className = 'card stack-md';
  registerCard.innerHTML = `
    <h2 class="card-title">Créer un compte</h2>
    <form id="register-form" class="stack-md">
      <div class="form-group">
        <label class="form-label" for="reg-name">Nom complet</label>
        <input id="reg-name" name="fullName" type="text" class="form-control" required placeholder="Nom et prénom" />
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-email">Adresse e-mail</label>
        <input id="reg-email" name="email" type="email" class="form-control" required placeholder="nom@exemple.com" />
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-phone">Téléphone</label>
        <input id="reg-phone" name="phone" type="tel" class="form-control" placeholder="+237 6XX XXX XXX" />
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-role">Rôle</label>
        <select id="reg-role" name="role" class="form-control">
          <option value="${APP_CONFIG.ROLES.CLIENT}">Client</option>
          <option value="${APP_CONFIG.ROLES.EBOUEUR}">Éboueur</option>
          <option value="${APP_CONFIG.ROLES.ADMIN}">Admin</option>
        </select>
      </div>
      <button type="submit" class="btn btn-outline btn-block">S’inscrire</button>
    </form>
  `;
  wrapper.appendChild(registerCard);
  container.appendChild(wrapper);

  const loginForm = loginCard.querySelector('#login-form');
  const emailInput = loginCard.querySelector('#login-email');
  const roleSelect = loginCard.querySelector('#login-role');

  loginCard.querySelectorAll('[data-demo-email]').forEach((btn) => {
    btn.addEventListener('click', () => {
      emailInput.value = btn.getAttribute('data-demo-email');
      loginForm.requestSubmit();
    });
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const user = await authService.login({
        email: emailInput.value,
        role: roleSelect.value || null
      });
      showToast(`Bienvenue, ${user.fullName}`, 'success');
      router.navigate(getDefaultRouteForRole(user.role));
    } catch (err) {
      showToast(err.message || 'Erreur de connexion', 'error');
    }
  });

  const registerForm = registerCard.querySelector('#register-form');
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const user = await authService.register({
        fullName: registerCard.querySelector('#reg-name').value,
        email: registerCard.querySelector('#reg-email').value,
        phone: registerCard.querySelector('#reg-phone').value,
        role: registerCard.querySelector('#reg-role').value
      });
      showToast(`Compte créé pour ${user.fullName}`, 'success');
      router.navigate(getDefaultRouteForRole(user.role));
    } catch (err) {
      showToast(err.message || 'Erreur d’inscription', 'error');
    }
  });
}