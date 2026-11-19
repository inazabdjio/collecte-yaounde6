import { APP_CONFIG } from '../config/appConfig.js';
import { store } from '../core/store.js';
import { router } from '../core/router.js';

const NAV_BY_ROLE = {
  [APP_CONFIG.ROLES.CLIENT]: [
    { label: 'Accueil', route: '#/dashboard' },
    { label: 'Souscrire', route: '#/subscription' },
    { label: 'Lieux', route: '#/location' }
  ],
  [APP_CONFIG.ROLES.EBOUEUR]: [
    { label: 'Tournées', route: '#/collector' },
    { label: 'Accueil', route: '#/dashboard' }
  ],
  [APP_CONFIG.ROLES.ADMIN]: [
    { label: 'Admin', route: '#/admin' },
    { label: 'Accueil', route: '#/dashboard' }
  ]
};

export function mountNavbar(container) {
  if (!container) return;

  function render() {
    const { currentUser, activeRole, currentRoute } = store.getState();
    container.innerHTML = '';

    if (!currentUser) {
      return;
    }

    const role = activeRole || currentUser.role;
    const items = NAV_BY_ROLE[role] || NAV_BY_ROLE[APP_CONFIG.ROLES.CLIENT];

    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `nav-item ${currentRoute === item.route ? 'is-active' : ''}`;
      btn.textContent = item.label;
      btn.addEventListener('click', () => router.navigate(item.route));
      container.appendChild(btn);
    });
  }

  render();
  return store.subscribe(render);
}