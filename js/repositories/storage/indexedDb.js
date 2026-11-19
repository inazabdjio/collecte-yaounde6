import { APP_CONFIG } from '../../config/appConfig.js';

export const STORES = Object.freeze({
  USERS: 'users',
  SERVICE_PLANS: 'servicePlans',
  LOCATIONS: 'locations',
  SUBSCRIPTIONS: 'subscriptions',
  SCHEDULES: 'schedules',
  NOTIFICATIONS: 'notifications'
});

class IndexedDbClient {
  constructor() {
    this.db = null;
  }

  async open() {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        APP_CONFIG.STORAGE_KEYS.DB_NAME,
        APP_CONFIG.STORAGE_KEYS.DB_VERSION
      );

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORES.USERS)) {
          const usersStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' });
          usersStore.createIndex('email', 'email', { unique: true });
          usersStore.createIndex('role', 'role', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SERVICE_PLANS)) {
          const plansStore = db.createObjectStore(STORES.SERVICE_PLANS, { keyPath: 'id' });
          plansStore.createIndex('code', 'code', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.LOCATIONS)) {
          const locStore = db.createObjectStore(STORES.LOCATIONS, { keyPath: 'id' });
          locStore.createIndex('userId', 'userId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SUBSCRIPTIONS)) {
          const subStore = db.createObjectStore(STORES.SUBSCRIPTIONS, { keyPath: 'id' });
          subStore.createIndex('userId', 'userId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SCHEDULES)) {
          const schStore = db.createObjectStore(STORES.SCHEDULES, { keyPath: 'id' });
          schStore.createIndex('collectorId', 'collectorId', { unique: false });
          schStore.createIndex('locationId', 'locationId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.NOTIFICATIONS)) {
          const notifStore = db.createObjectStore(STORES.NOTIFICATIONS, { keyPath: 'id' });
          notifStore.createIndex('userId', 'userId', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error || new Error('Erreur d’ouverture IndexedDB'));
      };
    });
  }

  async getAll(storeName) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getById(storeName, id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async put(storeName, item) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName, id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async count(storeName) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => reject(req.error);
    });
  }
}

export const indexedDb = new IndexedDbClient();