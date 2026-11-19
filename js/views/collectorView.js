import { store } from '../core/store.js';
import { collectionService } from '../services/collectionService.js';
import { createMapWidget } from '../components/mapWidget.js';
import { showToast } from '../components/toast.js';

export async function renderCollectorView(container) {
  container.innerHTML = '<div class="loading-state">Chargement des collectes assignées...</div>';

  const { currentUser } = store.getState();
  const schedules = await collectionService.listSchedulesForCollector(currentUser?.id);
  const locations = schedules.map((s) => s.location).filter(Boolean);

  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'stack-md';

  const headerCard = document.createElement('section');
  headerCard.className = 'card stack-sm';
  headerCard.innerHTML = `
    <h1 class="card-title">Collectes assignées</h1>
    <p class="text-muted">Visualisez vos collectes prévues, les lieux et validez le passage.</p>
  `;
  wrapper.appendChild(headerCard);

  wrapper.appendChild(createMapWidget(locations));

  const listCard = document.createElement('section');
  listCard.className = 'card stack-md';
  listCard.innerHTML = `<h2 class="card-title">Tournées (${schedules.length})</h2>`;

  if (!schedules.length) {
    listCard.innerHTML += `<p class="text-muted">Aucune collecte assignée pour le moment.</p>`;
  } else {
    schedules.forEach((sch) => {
      const row = document.createElement('div');
      row.className = 'card stack-sm';
      row.style.background = 'var(--color-surface-alt)';
      row.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>${escapeHtml(sch.scheduledDate)} (${escapeHtml(sch.timeSlot)})</strong>
          <span class="badge badge-base">${escapeHtml(sch.status)}</span>
        </div>
        <p class="text-muted">Lieu : ${escapeHtml(sch.location?.label || 'Non défini')} — ${escapeHtml(sch.location?.quarter || '')}</p>
      `;

      if (sch.status !== 'COLLECTED') {
        const doneBtn = document.createElement('button');
        doneBtn.type = 'button';
        doneBtn.className = 'btn btn-sm btn-primary';
        doneBtn.textContent = 'Marquer comme collecté';
        doneBtn.addEventListener('click', async () => {
          await collectionService.updateScheduleStatus(sch.id, 'COLLECTED');
          showToast('Collecte marquée comme effectuée.', 'success');
          await renderCollectorView(container);
        });
        row.appendChild(doneBtn);
      }

      listCard.appendChild(row);
    });
  }

  wrapper.appendChild(listCard);
  container.appendChild(wrapper);
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"');
}