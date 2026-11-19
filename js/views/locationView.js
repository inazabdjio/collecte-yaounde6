import { store } from '../core/store.js';
import { locationService } from '../services/locationService.js';
import { createMapWidget } from '../components/mapWidget.js';
import { showToast } from '../components/toast.js';

export async function renderLocationView(container) {
  container.innerHTML = '<div class="loading-state">Chargement des lieux de collecte...</div>';

  const { currentUser } = store.getState();
  const locations = await locationService.listLocations(currentUser?.id);

  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'stack-md';

  const formCard = document.createElement('section');
  formCard.className = 'card stack-md';
  formCard.innerHTML = `
    <div>
      <h1 class="card-title">Localisation & faisabilité</h1>
      <p class="text-muted">Enregistrez ou vérifiez un lieu de collecte avant de souscrire.</p>
    </div>
    <form id="location-form" class="stack-md">
      <div class="form-group">
        <label class="form-label" for="loc-label">Nom / libellé du lieu</label>
        <input id="loc-label" type="text" class="form-control" required placeholder="Ex: Domicile / Boutique" />
      </div>
      <div class="form-group">
        <label class="form-label" for="loc-quarter">Quartier / zone</label>
        <input id="loc-quarter" type="text" class="form-control" required placeholder="Ex: Biyem-Assi, Mvog-Betsi..." />
      </div>
      <div class="form-group">
        <label class="form-label" for="loc-details">Précisions d’accès</label>
        <input id="loc-details" type="text" class="form-control" placeholder="Ex: Route goudronnée, ruelle secondaire..." />
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div class="form-group">
          <label class="form-label" for="loc-lat">Latitude</label>
          <input id="loc-lat" type="number" step="any" class="form-control" placeholder="3.8480" />
        </div>
        <div class="form-group">
          <label class="form-label" for="loc-lng">Longitude</label>
          <input id="loc-lng" type="number" step="any" class="form-control" placeholder="11.5021" />
        </div>
      </div>
      <button type="button" id="gps-btn" class="btn btn-secondary btn-block">Capturer ma position GPS</button>
      <button type="submit" class="btn btn-primary btn-block">Enregistrer et vérifier la faisabilité</button>
    </form>
  `;
  wrapper.appendChild(formCard);

  wrapper.appendChild(createMapWidget(locations));

  const listCard = document.createElement('section');
  listCard.className = 'card stack-sm';
  listCard.innerHTML = `<h2 class="card-title">Mes lieux enregistrés (${locations.length})</h2>`;

  if (!locations.length) {
    listCard.innerHTML += `<p class="text-muted">Aucun lieu enregistré.</p>`;
  } else {
    locations.forEach((loc) => {
      const item = document.createElement('div');
      item.className = `alert ${loc.feasible ? 'alert-info' : 'alert-warning'}`;
      item.innerHTML = `
        <strong>${escapeHtml(loc.label)}</strong> — <span>${escapeHtml(loc.quarter)}</span>
        <p style="margin-top:4px;">${escapeHtml(loc.feasibilityNote || '')}</p>
      `;
      listCard.appendChild(item);
    });
  }

  wrapper.appendChild(listCard);
  container.appendChild(wrapper);

  const gpsBtn = formCard.querySelector('#gps-btn');
  gpsBtn.addEventListener('click', async () => {
    gpsBtn.disabled = true;
    try {
      const pos = await locationService.getCurrentBrowserPosition();
      formCard.querySelector('#loc-lat').value = pos.latitude;
      formCard.querySelector('#loc-lng').value = pos.longitude;
      showToast('Position GPS récupérée.', 'success');
    } catch (err) {
      showToast(err.message || 'Erreur GPS', 'warning');
    } finally {
      gpsBtn.disabled = false;
    }
  });

  formCard.querySelector('#location-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const latRaw = formCard.querySelector('#loc-lat').value;
      const lngRaw = formCard.querySelector('#loc-lng').value;

      const { evaluation } = await locationService.createOrUpdateLocation({
        userId: currentUser?.id || null,
        label: formCard.querySelector('#loc-label').value,
        quarter: formCard.querySelector('#loc-quarter').value,
        addressDetails: formCard.querySelector('#loc-details').value,
        latitude: latRaw !== '' ? Number(latRaw) : null,
        longitude: lngRaw !== '' ? Number(lngRaw) : null
      });

      showToast(
        evaluation.warning || 'Lieu enregistré et faisable.',
        evaluation.warning ? 'warning' : 'success'
      );
      await renderLocationView(container);
    } catch (err) {
      showToast(err.message || 'Erreur lors de l’enregistrement', 'error');
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