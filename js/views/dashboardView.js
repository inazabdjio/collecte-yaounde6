import { APP_CONFIG } from '../config/appConfig.js';
import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { authService } from '../services/authService.js';
import { subscriptionService } from '../services/subscriptionService.js';
import { collectionService } from '../services/collectionService.js';
import { notificationService } from '../services/notificationService.js';
import { showToast } from '../components/toast.js';

export async function renderDashboardView(container) {
  container.innerHTML = '<div class="loading-state">Chargement du tableau de bord...</div>';

  const { currentUser, activeRole } = store.getState();
  const role = activeRole || currentUser?.role || APP_CONFIG.ROLES.CLIENT;

  const [subscriptions, schedules, notifications] = await Promise.all([
    subscriptionService.listSubscriptions(role === APP_CONFIG.ROLES.CLIENT ? currentUser?.id : null),
    role === APP_CONFIG.ROLES.EBOUEUR
      ? collectionService.listSchedulesForCollector(currentUser?.id)
      : collectionService.listSchedules(),
    notificationService.listForUser(currentUser)
  ]);

  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'stack-md';

  // Carte de bienvenue & changement de rôle démo
  const profileCard = document.createElement('section');
  profileCard.className = 'card stack-sm';
  profileCard.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
      <div>
        <h1 class="card-title" style="margin:0;">${escapeHtml(currentUser?.fullName || 'Utilisateur')}</h1>
        <p class="text-muted">${escapeHtml(currentUser?.email || '')}</p>
      </div>
      <span class="badge badge-base">${escapeHtml(role)}</span>
    </div>
    <div class="form-group" style="margin-top:8px;">
      <label class="form-label" for="switch-role-select">Basculer de rôle (test rapide)</label>
      <select id="switch-role-select" class="form-control">
        <option value="${APP_CONFIG.ROLES.CLIENT}" ${role === APP_CONFIG.ROLES.CLIENT ? 'selected' : ''}>Client</option>
        <option value="${APP_CONFIG.ROLES.EBOUEUR}" ${role === APP_CONFIG.ROLES.EBOUEUR ? 'selected' : ''}>Éboueur</option>
        <option value="${APP_CONFIG.ROLES.ADMIN}" ${role === APP_CONFIG.ROLES.ADMIN ? 'selected' : ''}>Admin</option>
      </select>
    </div>
  `;
  wrapper.appendChild(profileCard);

  // Résumé selon le rôle
  const statsCard = document.createElement('section');
  statsCard.className = 'card stack-md';
  statsCard.innerHTML = `
    <h2 class="card-title">Aperçu de l’activité</h2>
    <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px;">
      <div class="card" style="padding:12px; background:var(--color-surface-alt);">
        <div class="text-muted">Souscriptions</div>
        <strong style="font-size:1.35rem;">${subscriptions.length}</strong>
      </div>
      <div class="card" style="padding:12px; background:var(--color-surface-alt);">
        <div class="text-muted">Collectes planifiées</div>
        <strong style="font-size:1.35rem;">${schedules.length}</strong>
      </div>
    </div>
  `;

  const actionRow = document.createElement('div');
  actionRow.style.display = 'flex';
  actionRow.style.flexWrap = 'wrap';
  actionRow.style.gap = '8px';

  if (role === APP_CONFIG.ROLES.CLIENT) {
    const subBtn = document.createElement('button');
    subBtn.type = 'button';
    subBtn.className = 'btn btn-primary';
    subBtn.textContent = 'Souscrire à un service';
    subBtn.addEventListener('click', () => router.navigate('#/subscription'));

    const locBtn = document.createElement('button');
    locBtn.type = 'button';
    locBtn.className = 'btn btn-outline';
    locBtn.textContent = 'Gérer mes lieux';
    locBtn.addEventListener('click', () => router.navigate('#/location'));

    actionRow.append(subBtn, locBtn);
  } else if (role === APP_CONFIG.ROLES.EBOUEUR) {
    const colBtn = document.createElement('button');
    colBtn.type = 'button';
    colBtn.className = 'btn btn-primary';
    colBtn.textContent = 'Voir mes tournées';
    colBtn.addEventListener('click', () => router.navigate('#/collector'));
    actionRow.appendChild(colBtn);
  } else if (role === APP_CONFIG.ROLES.ADMIN) {
    const admBtn = document.createElement('button');
    admBtn.type = 'button';
    admBtn.className = 'btn btn-primary';
    admBtn.textContent = 'Ouvrir l’administration';
    admBtn.addEventListener('click', () => router.navigate('#/admin'));
    actionRow.appendChild(admBtn);
  }

  statsCard.appendChild(actionRow);
  wrapper.appendChild(statsCard);

  // Notifications & alertes (warnings)
  const notifCard = document.createElement('section');
  notifCard.className = 'card stack-sm';
  notifCard.innerHTML = `<h2 class="card-title">Notifications & alertes</h2>`;

  if (!notifications.length) {
    notifCard.innerHTML += `<p class="text-muted">Aucune notification pour le moment.</p>`;
  } else {
    notifications.slice(0, 6).forEach((n) => {
      const box = document.createElement('div');
      const alertClass =
        n.type === 'warning'
          ? 'alert-warning'
          : n.type === 'error'
          ? 'alert-error'
          : 'alert-info';
      box.className = `alert ${alertClass}`;
      box.innerHTML = `
        <strong>${escapeHtml(n.title)}</strong>
        <p style="margin-top:4px;">${escapeHtml(n.message)}</p>
      `;
      notifCard.appendChild(box);
    });
  }

  wrapper.appendChild(notifCard);
  container.appendChild(wrapper);

  profileCard.querySelector('#switch-role-select').addEventListener('change', async (e) => {
    const chosenRole = e.target.value;
    await authService.switchRole(chosenRole);
    showToast(`Rôle actif : ${chosenRole}`, 'info');
    router.navigate(
      chosenRole === APP_CONFIG.ROLES.ADMIN
        ? '#/admin'
        : chosenRole === APP_CONFIG.ROLES.EBOUEUR
        ? '#/collector'
        : '#/dashboard'
    );
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"');
}