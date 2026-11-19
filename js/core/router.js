import { store } from './store.js';
import { APP_CONFIG } from '../config/appConfig.js';

export function getDefaultRouteForRole(role) {
  switch (role) {
    case APP_CONFIG.ROLES.ADMIN:
      return '#/admin';
    case APP_CONFIG.ROLES.EBOUEUR:
      return '#/collector';
    case APP_CONFIG.ROLES.CLIENT:
    default:
      return '#/dashboard';
  }
}

class Router {
  constructor() {
    this.routes = new Map();
    this.onRouteChange = null;
    this._handleHashChange = this._handleHashChange.bind(this);
  }

  register(path, { render, roles = null, requiresAuth = true }) {
    this.routes.set(path, { render, roles, requiresAuth });
  }

  start(onRouteChange) {
    this.onRouteChange = onRouteChange;
    window.addEventListener('hashchange', this._handleHashChange);
    this._handleHashChange();
  }

  stop() {
    window.removeEventListener('hashchange', this._handleHashChange);
  }

  navigate(path) {
    const normalized = path.startsWith('#') ? path : `#${path}`;
    if (window.location.hash === normalized) {
      this._handleHashChange();
    } else {
      window.location.hash = normalized;
    }
  }

  async _handleHashChange() {
    const rawHash = window.location.hash || '#/login';
    const path = rawHash.split('?')[0];
    const { currentUser, activeRole } = store.getState();

    const route = this.routes.get(path) || this.routes.get('#/login');
    if (!route) return;

    if (route.requiresAuth && !currentUser) {
      if (path !== '#/login') {
        this.navigate('#/login');
        return;
      }
    }

    if (route.requiresAuth && currentUser && Array.isArray(route.roles) && route.roles.length > 0) {
      const effectiveRole = activeRole || currentUser.role;
      if (!route.roles.includes(effectiveRole)) {
        const fallback = getDefaultRouteForRole(effectiveRole);
        if (path !== fallback) {
          this.navigate(fallback);
          return;
        }
      }
    }

    store.setState({ currentRoute: path });
    if (typeof this.onRouteChange === 'function') {
      await this.onRouteChange(path, route);
    }
  }
}

export const router = new Router();