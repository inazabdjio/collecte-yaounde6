import { APP_CONFIG } from '../config/appConfig.js';
import { store } from '../core/store.js';
import { subscriptionService, COLLECTION_DAYS } from '../services/subscriptionService.js';
import { locationService } from '../services/locationService.js';
import { paymentService } from '../services/paymentService.js';
import { openPaymentModal } from '../components/paymentModal.js';
import { showToast } from '../components/toast.js';

export async function renderSubscriptionView(container) {
  container.innerHTML = '<div class="loading-state">Chargement des formules...</div>';

  const { currentUser } = store.getState();
  const [plans, locations, existingSubs] = await Promise.all([
    subscriptionService.getServicePlans(),
    locationService.listLocations(currentUser?.id),
    subscriptionService.listSubscriptions(currentUser?.id)
  ]);

  const paymentMethods = paymentService.getAvailableMethods();

  let selectedPlanId = plans[0]?.id || '';
  let selectedLocationId = locations[0]?.id || '';
  let selectedPaymentMethod = paymentMethods[0]?.id || 'MOBILE_MONEY';
  const selectedDays = new Set();

  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'stack-md';

  // 1. Choix du service (Base / Express / VIP)
  const planCard = document.createElement('section');
  planCard.className = 'card stack-md';
  planCard.innerHTML = `
    <div>
      <h1 class="card-title">Souscription à un service</h1>
      <p class="text-muted">Choisissez un service, vérifiez le paiement et l’emplacement, puis sélectionnez ${APP_CONFIG.SUBSCRIPTION_REQUIRED_DAYS} jours.</p>
    </div>
    <div id="plans-grid" class="service-grid"></div>
  `;

  const plansGrid = planCard.querySelector('#plans-grid');
  plans.forEach((plan) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.style.textAlign = 'left';
    card.dataset.planId = plan.id;

    const badgeClass =
      plan.code === APP_CONFIG.SERVICE_TYPES.VIP
        ? 'badge-vip'
        : plan.code === APP_CONFIG.SERVICE_TYPES.EXPRESS
        ? 'badge-express'
        : 'badge-base';

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
        <strong>${escapeHtml(plan.name)}</strong>
        <span class="badge ${badgeClass}">${escapeHtml(plan.code)}</span>
      </div>
      <p style="margin-top:8px; font-weight:700;">${Number(plan.price).toLocaleString('fr-FR')} ${escapeHtml(plan.currency)}</p>
      <p class="text-muted" style="margin-top:4px;">${escapeHtml(plan.description)}</p>
      <p class="text-muted" style="margin-top:6px;">
        ${plan.wasteLimitKg ? `Limite ordures : ${plan.wasteLimitKg} kg` : 'Sans limite fixe'}
        ${plan.horizonMonths ? ` • Durée : ${plan.horizonMonths} mois` : ''}
      </p>
    `;

    card.addEventListener('click', () => {
      selectedPlanId = plan.id;
      updatePlanSelection();
    });

    plansGrid.appendChild(card);
  });

  function updatePlanSelection() {
    plansGrid.querySelectorAll('[data-plan-id]').forEach((el) => {
      const active = el.dataset.planId === selectedPlanId;
      el.style.borderColor = active ? 'var(--color-primary)' : 'var(--color-border)';
      el.style.boxShadow = active ? '0 0 0 2px var(--color-primary-light)' : 'var(--shadow-sm)';
    });
  }
  updatePlanSelection();
  wrapper.appendChild(planCard);

  // 2. Emplacement, mode de paiement & 2 jours
  const formCard = document.createElement('section');
  formCard.className = 'card stack-md';

  const locOptionsHtml = locations.length
    ? locations
        .map(
          (l) =>
            `<option value="${escapeHtml(l.id)}">${escapeHtml(l.label)} (${escapeHtml(l.quarter)})</option>`
        )
        .join('')
    : `<option value="">Aucun lieu disponible</option>`;

  const payOptionsHtml = paymentMethods
    .map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.label)}</option>`)
    .join('');

  formCard.innerHTML = `
    <div class="form-group">
      <label class="form-label" for="sub-location">Emplacement de collecte (vérification faisabilité)</label>
      <select id="sub-location" class="form-control">${locOptionsHtml}</select>
      <div id="feasibility-feedback" style="margin-top:6px;"></div>
    </div>

    <div class="form-group">
      <label class="form-label" for="sub-payment">Mode de paiement</label>
      <select id="sub-payment" class="form-control">${payOptionsHtml}</select>
    </div>

    <div class="form-group">
      <label class="form-label">Choisir exactement ${APP_CONFIG.SUBSCRIPTION_REQUIRED_DAYS} jours de collecte</label>
      <div id="days-grid" class="days-selector"></div>
    </div>

    <button type="button" id="submit-sub-btn" class="btn btn-primary btn-block">Vérifier et souscrire</button>
  `;

  const locSelect = formCard.querySelector('#sub-location');
  const paySelect = formCard.querySelector('#sub-payment');
  const feasibilityBox = formCard.querySelector('#feasibility-feedback');
  const daysGrid = formCard.querySelector('#days-grid');

  function refreshFeasibilityBox() {
    selectedLocationId = locSelect.value;
    const loc = locations.find((l) => l.id === selectedLocationId);
    if (!loc) {
      feasibilityBox.innerHTML = `<div class="alert alert-warning">Ajoutez d’abord un lieu dans l’onglet « Lieux ».</div>`;
      return;
    }
    const evalRes = locationService.evaluateFeasibility(loc);
    feasibilityBox.innerHTML = `
      <div class="alert ${evalRes.feasible ? 'alert-info' : 'alert-warning'}">
        ${escapeHtml(evalRes.warning || evalRes.message)}
      </div>
    `;
  }

  locSelect.addEventListener('change', refreshFeasibilityBox);
  paySelect.addEventListener('change', () => {
    selectedPaymentMethod = paySelect.value;
  });
  refreshFeasibilityBox();

  COLLECTION_DAYS.forEach((day) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'day-chip';
    chip.textContent = day;
    chip.addEventListener('click', () => {
      if (selectedDays.has(day)) {
        selectedDays.delete(day);
        chip.classList.remove('is-selected');
      } else {
        if (selectedDays.size >= APP_CONFIG.SUBSCRIPTION_REQUIRED_DAYS) {
          showToast(
            `Vous ne pouvez sélectionner que ${APP_CONFIG.SUBSCRIPTION_REQUIRED_DAYS} jours.`,
            'warning'
          );
          return;
        }
        selectedDays.add(day);
        chip.classList.add('is-selected');
      }
    });
    daysGrid.appendChild(chip);
  });

  formCard.querySelector('#submit-sub-btn').addEventListener('click', async () => {
    try {
      const daysArray = Array.from(selectedDays);
      subscriptionService.validateSelectedDays(daysArray);

      const plan = plans.find((p) => p.id === selectedPlanId);
      const loc = locations.find((l) => l.id === selectedLocationId);
      const methodObj = paymentMethods.find((m) => m.id === selectedPaymentMethod);

      if (!plan) throw new Error('Veuillez choisir un service.');
      if (!loc) throw new Error('Veuillez choisir un emplacement.');

      const paymentCheck = await paymentService.verifyPaymentMethod({
        paymentMethod: selectedPaymentMethod,
        amount: plan.price,
        serviceCode: plan.code
      });

      const feasibilityCheck = locationService.evaluateFeasibility(loc);
      const combinedWarning = [paymentCheck.warning, feasibilityCheck.warning]
        .filter(Boolean)
        .join(' | ');

      openPaymentModal({
        planName: plan.name,
        amount: plan.price,
        paymentMethodLabel: methodObj?.label || selectedPaymentMethod,
        warning: combinedWarning || null,
        onConfirm: async () => {
          await subscriptionService.subscribe({
            userId: currentUser?.id,
            serviceId: plan.id,
            locationId: loc.id,
            paymentMethod: selectedPaymentMethod,
            selectedDays: daysArray
          });
          showToast('Souscription enregistrée avec succès.', 'success');
          await renderSubscriptionView(container);
        }
      });
    } catch (err) {
      showToast(err.message || 'Erreur lors de la souscription', 'warning');
    }
  });

  wrapper.appendChild(formCard);

  // 3. Historique / souscriptions actives
  const historyCard = document.createElement('section');
  historyCard.className = 'card stack-sm';
  historyCard.innerHTML = `<h2 class="card-title">Mes souscriptions (${existingSubs.length})</h2>`;

  if (!existingSubs.length) {
    historyCard.innerHTML += `<p class="text-muted">Aucune souscription enregistrée.</p>`;
  } else {
    existingSubs.forEach((sub) => {
      const item = document.createElement('div');
      item.className = 'alert alert-info';
      item.innerHTML = `
        <strong>Service ${escapeHtml(sub.serviceCode)}</strong> — Statut : <strong>${escapeHtml(sub.status)}</strong>
        <p style="margin-top:4px;">Jours choisis : ${escapeHtml((sub.selectedDays || []).join(' & '))} • Paiement : ${escapeHtml(sub.paymentMethod)}</p>
      `;
      historyCard.appendChild(item);
    });
  }

  wrapper.appendChild(historyCard);
  container.appendChild(wrapper);
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"');
}