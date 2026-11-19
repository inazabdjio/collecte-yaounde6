import { indexedDb, STORES } from './storage/indexedDb.js';
import { buildSeedData } from './storage/seedData.js';

export class LocalRepository {
  async ensureSeeded() {
    const existingUsers = await indexedDb.count(STORES.USERS);
    if (existingUsers > 0) {
      return;
    }

    const seed = buildSeedData();
    await Promise.all([
      ...seed.users.map((u) => indexedDb.put(STORES.USERS, u)),
      ...seed.servicePlans.map((p) => indexedDb.put(STORES.SERVICE_PLANS, p)),
      ...seed.locations.map((l) => indexedDb.put(STORES.LOCATIONS, l)),
      ...seed.subscriptions.map((s) => indexedDb.put(STORES.SUBSCRIPTIONS, s)),
      ...seed.schedules.map((c) => indexedDb.put(STORES.SCHEDULES, c)),
      ...seed.notifications.map((n) => indexedDb.put(STORES.NOTIFICATIONS, n))
    ]);
  }

  // Utilisateurs (CRUD)
  async getUsers() {
    await this.ensureSeeded();
    return indexedDb.getAll(STORES.USERS);
  }

  async getUserById(id) {
    await this.ensureSeeded();
    return indexedDb.getById(STORES.USERS, id);
  }

  async saveUser(user) {
    await this.ensureSeeded();
    return indexedDb.put(STORES.USERS, user);
  }

  async deleteUser(id) {
    await this.ensureSeeded();
    return indexedDb.delete(STORES.USERS, id);
  }

  // Formules de service (Base / Express / VIP)
  async getServicePlans() {
    await this.ensureSeeded();
    return indexedDb.getAll(STORES.SERVICE_PLANS);
  }

  async saveServicePlan(plan) {
    await this.ensureSeeded();
    return indexedDb.put(STORES.SERVICE_PLANS, plan);
  }

  // Lieux de collecte (CRUD)
  async getLocations() {
    await this.ensureSeeded();
    return indexedDb.getAll(STORES.LOCATIONS);
  }

  async getLocationById(id) {
    await this.ensureSeeded();
    return indexedDb.getById(STORES.LOCATIONS, id);
  }

  async saveLocation(location) {
    await this.ensureSeeded();
    return indexedDb.put(STORES.LOCATIONS, location);
  }

  async deleteLocation(id) {
    await this.ensureSeeded();
    return indexedDb.delete(STORES.LOCATIONS, id);
  }

  // Souscriptions
  async getSubscriptions() {
    await this.ensureSeeded();
    return indexedDb.getAll(STORES.SUBSCRIPTIONS);
  }

  async saveSubscription(subscription) {
    await this.ensureSeeded();
    return indexedDb.put(STORES.SUBSCRIPTIONS, subscription);
  }

  // Planning et affectation des éboueurs
  async getSchedules() {
    await this.ensureSeeded();
    return indexedDb.getAll(STORES.SCHEDULES);
  }

  async saveSchedule(schedule) {
    await this.ensureSeeded();
    return indexedDb.put(STORES.SCHEDULES, schedule);
  }

  // Notifications / warnings
  async getNotifications() {
    await this.ensureSeeded();
    return indexedDb.getAll(STORES.NOTIFICATIONS);
  }

  async saveNotification(notification) {
    await this.ensureSeeded();
    return indexedDb.put(STORES.NOTIFICATIONS, notification);
  }
}