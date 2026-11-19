export function openPaymentModal({
  planName,
  amount,
  paymentMethodLabel,
  warning = null,
  onConfirm,
  onCancel
}) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  modalRoot.innerHTML = '';

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const card = document.createElement('div');
  card.className = 'modal-card stack-md';

  const title = document.createElement('h2');
  title.className = 'card-title';
  title.textContent = 'Vérification du paiement';

  const summary = document.createElement('div');
  summary.className = 'stack-sm';
  summary.innerHTML = `
    <p><strong>Service :</strong> ${escapeHtml(planName)}</p>
    <p><strong>Mode choisi :</strong> ${escapeHtml(paymentMethodLabel)}</p>
    <p><strong>Montant :</strong> ${Number(amount).toLocaleString('fr-FR')} XAF</p>
  `;

  card.appendChild(title);
  card.appendChild(summary);

  if (warning) {
    const warnBox = document.createElement('div');
    warnBox.className = 'alert alert-warning';
    warnBox.textContent = warning;
    card.appendChild(warnBox);
  }

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '10px';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-outline';
  cancelBtn.style.flex = '1';
  cancelBtn.textContent = 'Annuler';

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'btn btn-primary';
  confirmBtn.style.flex = '1';
  confirmBtn.textContent = 'Confirmer';

  function close() {
    modalRoot.innerHTML = '';
  }

  cancelBtn.addEventListener('click', () => {
    close();
    onCancel?.();
  });

  confirmBtn.addEventListener('click', async () => {
    confirmBtn.disabled = true;
    try {
      await onConfirm?.();
      close();
    } catch {
      confirmBtn.disabled = false;
    }
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);
  card.appendChild(actions);
  backdrop.appendChild(card);
  modalRoot.appendChild(backdrop);
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"');
}