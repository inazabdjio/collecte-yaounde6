import { APP_CONFIG } from '../config/appConfig.js';
import { getRepository } from '../repositories/repositoryFactory.js';
import { createUserSchema } from '../models/schemas.js';
import { collectionService } from '../services/collectionService.js';
import { locationService } from '../services/locationService.js';
import { showToast } from '../components/toast.js';

export async function renderAdminView(container) {
  container.innerHTML = '<div class="loading-state">Chargement de l’administration...</div>';

  const repo = getRepository();
  const [users, locations, schedules] = await Promise.all([
    repo.getUsers(),
    locationService.listLocations(),
    collectionService.listSchedules()
  ]);

  const collectors = users.filter((u) => u.role === APP_CONFIG.ROLES.EBOUEUR);

  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'stack-md';

  // 1. Gestion des utilisateurs (CRUD simplifié)
  const usersCard = document.createElement('section');
  usersCard.className = 'card stack-md';
  usersCard.innerHTML = `
    <h1 class="card-title">Administration — Utilisateurs (${users.length})</h1>
    <form id="admin-user-form" class="stack-sm">
      <input id="adm-user-name" type="text" class="form-control" required placeholder="Nom complet" />
      <input id="adm-user-email" type="email" class="form-control" required placeholder="Email" />
      <select id="adm-user-role" class="form-control">
        <option value="${APP_CONFIG.ROLES.CLIENT}">Client</option>
        <option value="${APP_CONFIG.ROLES.EBOUEUR}">Éboueur</option>
        <option value="${APP_CONFIG.ROLES.ADMIN}">Admin</option>
      </select>
      <button type="submit" class="btn btn-primary btn-block">Ajouter utilisateur</button>
    </form>
    <div class="stack-sm">
      ${users
        .map(
          (u) => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border:1px solid var(--color-border); border-radius:8px;">
            <div>
              <strong>${escapeHtml(u.fullName)}</strong>
              <div class="text-muted">${escapeHtml(u.email)} • ${escapeHtml(u.role)}</div>
            </div>
            <button type="button" class="btn btn-sm btn-outline" data-del-user="${escapeHtml(u.id)}">Suppr.</button>
          </div>`
        )
        .join('')}
    </div>
  `;
  wrapper.appendChild(usersCard);

  // 2. Planning & affectation des éboueurs
  const scheduleCard = document.createElement('section');
  scheduleCard.className = 'card stack-md';
  scheduleCard.innerHTML = `
    <h2 class="card-title">Planning & affectation des éboueurs</h2>
    <form id="admin-schedule-form" class="stack-sm">
      <div class="form-group">
        <label class="form-label" for="sch-loc">Lieu de collecte</label>
        <select id="sch-loc" class="form-control">
          ${locations.map((l) => `<option value="${escapeHtml(l.id)}">${escapeHtml(l.label)} (${escapeHtml(l.quarter)})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="sch-day">Jour / créneau</label>
        <input id="sch-day" type="text" class="form-control" required value="Mercredi" placeholder="Ex: Mercredi ou 2026-11-25" />
      </div>
      <div class="form-group">
        <label class="form-label" for="sch-collector">Éboueur assigné</label>
        <select id="sch-collector" class="form-control">
          <option value="">-- Non assigné --</option>
          ${collectors.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.fullName)}</option>`).join('')}
        </select>
      </div>
      <button type="submit" class="btn btn-primary btn-block">Créer / planifier la collecte</button>
    </form>
    <div class="stack-sm">
      ${schedules
        .map(
          (s) => `
          <div style="padding:8px; border:1px solid var(--color-border); border-radius:8px;">
            <strong>${escapeHtml(s.scheduledDate)}</strong> — ${escapeHtml(s.location?.label || 'Lieu')}
            <div class="text-muted">Éboueur : ${escapeHtml(s.collector?.fullName || 'Non assigné')} • Statut : ${escapeHtml(s.status)}</div>
          </div>`
        )
        .join('')}
    </div>
  `;
  wrapper.appendChild(scheduleCard);

  container.appendChild(wrapper);

  usersCard.querySelector('#admin-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const newUser = createUserSchema({
        fullName: usersCard.querySelector('#adm-user-name').value,
        email: usersCard.querySelector('#adm-user-email').value,
        role: usersCard.querySelector('#adm-user-role').value
      });
      await repo.saveUser(newUser);
      showToast('Utilisateur ajouté.', 'success');
      await renderAdminView(container);
    } catch (err) {
      showToast(err.message || 'Erreur ajout utilisateur', 'error');
    }
  });

  usersCard.querySelectorAll('[data-del-user]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-del-user');
      await repo.deleteUser(id);
      showToast('Utilisateur supprimé.', 'info');
      await renderAdminView(container);
    });
  });

  scheduleCard.querySelector('#admin-schedule-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await collectionService.createSchedule({
        locationId: scheduleCard.querySelector('#sch-loc').value,
        scheduledDate: scheduleCard.querySelector('#sch-day').value,
        collectorId: scheduleCard.querySelector('#sch-collector').value || null
      });
      showToast('Collecte planifiée.', 'success');
      await renderAdminView(container);
    } catch (err) {
      showToast(err.message || 'Erreur planification', 'error');
    }
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"');
}