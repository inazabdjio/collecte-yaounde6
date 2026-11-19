import { httpClient } from '../core/httpClient.js';

export class RemoteRepository {
  async ensureSeeded() {
    return Promise.resolve();
  }

  // Utilisateurs
  getUsers() {
    return httpClient.get('/users');
  }

  getUserById(id) {
    return httpClient.get(`/users/${encodeURIComponent(id)}`);
  }

  saveUser(user) {
    return user.id
      ? httpClient.put(`/users/${encodeURIComponent(user.id)}`, user)
      : httpClient.post('/users', user);
  }

  deleteUser(id) {
    return httpClient.delete(`/users/${encodeURIComponent(id)}`);
  }

  // Formules de service
  getServicePlans() {
    return httpClient.get('/service-plans');
  }

  saveServicePlan(plan) {
    return plan.id
      ? httpClient.put(`/service-plans/${encodeURIComponent(plan.id)}`, plan)
      : httpClient.post('/service-plans', plan);
  }

  // Lieux de collecte
  getLocations() {
    return httpClient.get('/locations');
  }

  getLocationById(id) {
    return httpClient.get(`/locations/${encodeURIComponent(id)}`);
  }

  saveLocation(location) {
    return location.id
      ? httpClient.put(`/locations/${encodeURIComponent(location.id)}`, location)
      : httpClient.post('/locations', location);
  }

  deleteLocation(id) {
    return httpClient.delete(`/locations/${encodeURIComponent(id)}`);
  }

  // Souscriptions
  getSubscriptions() {
    return httpClient.get('/subscriptions');
  }

  saveSubscription(subscription) {
    return subscription.id
      ? httpClient.put(`/subscriptions/${encodeURIComponent(subscription.id)}`, subscription)
      : httpClient.post('/subscriptions', subscription);
  }

  // Planning & éboueurs
  getSchedules() {
    return httpClient.get('/schedules');
  }

  saveSchedule(schedule) {
    return schedule.id
      ? httpClient.put(`/schedules/${encodeURIComponent(schedule.id)}`, schedule)
      : httpClient.post('/schedules', schedule);
  }

  // Notifications
  getNotifications() {
    return httpClient.get('/notifications');
  }

  saveNotification(notification) {
    return notification.id
      ? httpClient.put(`/notifications/${encodeURIComponent(notification.id)}`, notification)
      : httpClient.post('/notifications', notification);
  }
}