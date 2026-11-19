import { APP_CONFIG } from '../config/appConfig.js';
import { getRepository } from '../repositories/repositoryFactory.js';
import { createUserSchema } from '../models/schemas.js';
import { store } from '../core/store.js';
import { notificationService } from './notificationService.js';

class AuthService {
  async restoreSession() {
    try {
      const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SESSION);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.userId) return null;

      const repo = getRepository();
      const user = await repo.getUserById(parsed.userId);
      if (!user || !user.active) {
        this.logout();
        return null;
      }

      const activeRole = Object.values(APP_CONFIG.ROLES).includes(parsed.activeRole)
        ? parsed.activeRole
        : user.role;

      store.setState({ currentUser: user, activeRole });
      await notificationService.refreshStore(user);
      return user;
    } catch {
      return null;
    }
  }

  async login({ email, role = null }) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Veuillez saisir une adresse e-mail.');
    }

    const repo = getRepository();
    const users = await repo.getUsers();
    let user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      throw new Error('Aucun compte trouvé avec cet e-mail.');
    }

    if (!user.active) {
      throw new Error('Ce compte est désactivé.');
    }

    const activeRole =
      role && Object.values(APP_CONFIG.ROLES).includes(role) ? role : user.role;

    localStorage.setItem(
      APP_CONFIG.STORAGE_KEYS.SESSION,
      JSON.stringify({ userId: user.id, activeRole })
    );

    store.setState({ currentUser: user, activeRole });
    await notificationService.refreshStore(user);
    return user;
  }

  async register({ fullName, email, phone = '', role = APP_CONFIG.ROLES.CLIENT }) {
    if (!fullName || !email) {
      throw new Error('Le nom complet et l’e-mail sont obligatoires.');
    }

    const repo = getRepository();
    const users = await repo.getUsers();
    const exists = users.some(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (exists) {
      throw new Error('Un compte existe déjà avec cet e-mail.');
    }

    const newUser = createUserSchema({ fullName, email, phone, role });
    await repo.saveUser(newUser);

    localStorage.setItem(
      APP_CONFIG.STORAGE_KEYS.SESSION,
      JSON.stringify({ userId: newUser.id, activeRole: newUser.role })
    );

    store.setState({ currentUser: newUser, activeRole: newUser.role });
    await notificationService.refreshStore(newUser);
    return newUser;
  }

  async switchRole(newRole) {
    if (!Object.values(APP_CONFIG.ROLES).includes(newRole)) {
      throw new Error('Rôle invalide.');
    }
    const { currentUser } = store.getState();
    if (!currentUser) return null;

    localStorage.setItem(
      APP_CONFIG.STORAGE_KEYS.SESSION,
      JSON.stringify({ userId: currentUser.id, activeRole: newRole })
    );
    store.setState({ activeRole: newRole });
    return newRole;
  }

  logout() {
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.SESSION);
    store.setState({
      currentUser: null,
      activeRole: null,
      notifications: []
    });
  }

  hasRole(requiredRoles = []) {
    const { currentUser, activeRole } = store.getState();
    if (!currentUser) return false;
    const current = activeRole || currentUser.role;
    return requiredRoles.includes(current);
  }
}

export const authService = new AuthService();