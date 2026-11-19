import { store } from '../core/store.js';

export function createMapWidget(locations = []) {
  const { isOnline } = store.getState();
  const box = document.createElement('div');
  box.className = 'map-box';

  const validLocations = (locations || []).filter(
    (loc) => loc.latitude !== null && loc.longitude !== null
  );

  if (!validLocations.length) {
    box.innerHTML = `
      <div class="stack-sm">
        <strong>Aperçu de localisation</strong>
        <p class="text-muted">Aucune coordonnée GPS enregistrée pour le moment.</p>
      </div>
    `;
    return box;
  }

  const lines = validLocations
    .slice(0, 4)
    .map((loc) => {
      const statusText = loc.feasible ? 'Faisable' : 'Warning accès';
      return `<li><strong>${escapeHtml(loc.label)}</strong> (${loc.latitude}, ${loc.longitude}) — <em>${statusText}</em></li>`;
    })
    .join('');

  box.innerHTML = `
    <div class="stack-sm" style="width:100%; text-align:left;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong>Points géolocalisés</strong>
        <span class="badge ${isOnline ? 'badge-base' : 'badge-offline'}">${isOnline ? 'GPS / Réseau' : 'Mode hors-ligne'}</span>
      </div>
      <ul style="padding-left:18px; font-size:0.875rem;">${lines}</ul>
    </div>
  `;

  return box;
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"');
}