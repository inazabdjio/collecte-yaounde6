import { APP_CONFIG } from '../config/appConfig.js';
import { getRepository } from '../repositories/repositoryFactory.js';
import { authService } from '../services/authService.js';
import { router, getDefaultRouteForRole } from './router.js';
import { store } from './store.js';
import { mountHeader } from '../components/header.js';
import { mountNavbar } from '../components/navbar.js';
import { showToast } from '../components/toast.js';

import { renderAuthView } from '../views/authView.js';
import { renderDashboardView } from '../views/dashboardView.js';
import { renderSubscriptionView } from '../views/subscriptionView.js';
import { renderLocationView } from '../views/locationView.js';
import { renderCollectorView } from '../views/collectorView.js';
import { renderAdminView } from '../views/adminView.js';

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register('./sw.js', { scope: './' });
  } catch (err) {
    console.warn('Enregistrement du Service Worker ignoré ou impossible :', err);
  }
}

function registerRoutes() {
  router.register('#/login', {
    render: renderAuthView,
    requiresAuth: false
  });

  router.register('#/dashboard', {
    render: renderDashboardView,
    requiresAuth: true,
    roles: [APP_CONFIG.ROLES.CLIENT, APP_CONFIG.ROLES.EBOUEUR, APP_CONFIG.ROLES.ADMIN]
  });

  router.register('#/subscription', {
    render: renderSubscriptionView,
    requiresAuth: true,
    roles: [APP_CONFIG.ROLES.CLIENT, APP_CONFIG.ROLES.ADMIN]
  });

  router.register('#/location', {
    render: renderLocationView,
    requiresAuth: true,
    roles: [APP_CONFIG.ROLES.CLIENT, APP_CONFIG.ROLES.ADMIN]
  });

  router.register('#/collector', {
    render: renderCollectorView,
    requiresAuth: true,
    roles: [APP_CONFIG.ROLES.EBOUEUR, APP_CONFIG.ROLES.ADMIN]
  });

  router.register('#/admin', {
    render: renderAdminView,
    requiresAuth: true,
    roles: [APP_CONFIG.ROLES.ADMIN]
  });
}

function syncNavbarVisibility() {
  const mainEl = document.getElementById('app-main');
  const { currentUser } = store.getState();
  if (!mainEl) return;

  if (currentUser) {
    mainEl.classList.remove('no-navbar');
  } else {
    mainEl.classList.add('no-navbar');
  }
}

async function bootstrap() {
  const headerEl = document.getElementById('app-header');
  const mainEl = document.getElementById('app-main');
  const navbarEl = document.getElementById('app-navbar');

  await registerServiceWorker();

  const repo = getRepository();
  await repo.ensureSeeded();

  mountHeader(headerEl);
  mountNavbar(navbarEl);
  store.subscribe(syncNavbarVisibility);

  registerRoutes();

  const restoredUser = await authService.restoreSession();

  router.start(async (_path, route) => {
    syncNavbarVisibility();
    if (mainEl && typeof route.render === 'function') {
      await route.render(mainEl);
    }
  });

  if (!window.location.hash || window.location.hash === '#') {
    if (restoredUser) {
      router.navigate(getDefaultRouteForRole(restoredUser.role));
    } else {
      router.navigate('#/login');
    }
  }

  window.addEventListener('offline', () => {
    showToast('Connexion perdue : mode hors-ligne actif.', 'warning');
  });

  window.addEventListener('online', () => {
    showToast('Connexion réseau rétablie.', 'success');
  });
}

bootstrap().catch((err) => {
  const mainEl = document.getElementById('app-main');
  if (mainEl) {
    mainEl.innerHTML = `
      <div class="card stack-sm">
        <h1 class="card-title">Erreur d’initialisation</h1>
        <p class="text-muted">${String(err?.message || err)}</p>
      </div>
    `;
  }
});