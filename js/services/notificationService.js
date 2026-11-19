import { getRepository } from '../repositories/repositoryFactory.js';
import { createNotificationSchema } from '../models/schemas.js';
import { store } from '../core/store.js';

class NotificationService {
  async listForUser(user) {
    const repo = getRepository();
    const all = await repo.getNotifications();
    if (!user) return [];

    return all
      .filter((n) => n.userId === user.id || n.role === user.role || (!n.userId && !n.role))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async refreshStore(user) {
    const notifications = await this.listForUser(user);
    store.setState({ notifications });
    return notifications;
  }

  async pushNotification({ userId = null, role = null, type = 'info', title, message }) {
    const repo = getRepository();
    const item = createNotificationSchema({ userId, role, type, title, message });
    await repo.saveNotification(item);

    const { currentUser } = store.getState();
    if (currentUser) {
      await this.refreshStore(currentUser);
    }
    return item;
  }

  async markAsRead(notificationId) {
    const repo = getRepository();
    const all = await repo.getNotifications();
    const target = all.find((n) => n.id === notificationId);
    if (!target) return null;

    const updated = { ...target, read: true };
    await repo.saveNotification(updated);

    const { currentUser } = store.getState();
    if (currentUser) {
      await this.refreshStore(currentUser);
    }
    return updated;
  }
}

export const notificationService = new NotificationService();