import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { authService } from '../services/authService.js';
import { createInstallButton } from './installButton.js';
import { showToast } from './toast.js';

export function mountHeader(container) {
  if (!container) return;

  let currentInstallWidget = null;

  function render() {
    if (currentInstallWidget && typeof currentInstallWidget.destroy === 'function') {
      currentInstallWidget.destroy();
    }

    const { currentUser, activeRole, isOnline } = store.getState();
    container.innerHTML = '';

    const brand = document.createElement('a');
    brand.className = 'header-brand';
    brand.href = currentUser ? '#/dashboard' : '#/login';
    brand.textContent = 'Collecte Y6';

    const actions = document.createElement('div');
    actions.className = 'header-actions';

    const statusBadge = document.createElement('span');
    statusBadge.className = `badge ${isOnline ? 'badge-online' : 'badge-offline'}`;
    statusBadge.textContent = isOnline ? 'En ligne' : 'Hors ligne';
    actions.appendChild(statusBadge);

    currentInstallWidget = createInstallButton({
      variant: 'button',
      onStatus: (msg, type) => showToast(msg, type)
    });
    actions.appendChild(currentInstallWidget);

    if (currentUser) {
      const roleTag = document.createElement('span');
      roleTag.className = 'badge badge-online';
      roleTag.textContent = activeRole || currentUser.role;
      actions.appendChild(roleTag);

      const logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.className = 'btn btn-sm btn-outline';
      logoutBtn.style.color = '#ffffff';
      logoutBtn.style.borderColor = 'rgba(255,255,255,0.4)';
      logoutBtn.textContent = 'Quitter';
      logoutBtn.addEventListener('click', () => {
        authService.logout();
        showToast('Session fermée.', 'info');
        router.navigate('#/login');
      });
      actions.appendChild(logoutBtn);
    }

    container.appendChild(brand);
    container.appendChild(actions);
  }

  render();
  return store.subscribe(render);
}