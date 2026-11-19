export const APP_CONFIG = Object.freeze({
  appName: 'Collecte Yaoundé 6',
  version: '0.1.0-pwa',

  // Phase 1 : true = stockage local / données simulées
  // Phase 2 : false = appels vers l'API REST Java via remoteRepository.js
  USE_MOCK_API: true,

  // URL de base du futur backend Java (à renseigner en Phase 2)
  JAVA_API_BASE_URL: 'http://localhost:8080/api/v1',

  // Règles métier issues de la conception
  ROLES: Object.freeze({
    CLIENT: 'CLIENT',
    EBOUEUR: 'EBOUEUR',
    ADMIN: 'ADMIN'
  }),

  SERVICE_TYPES: Object.freeze({
    BASE: 'BASE',
    EXPRESS: 'EXPRESS',
    VIP: 'VIP'
  }),

  SUBSCRIPTION_REQUIRED_DAYS: 2,
  BASE_PLAN_HORIZON_MONTHS: 2,

  STORAGE_KEYS: Object.freeze({
    SESSION: 'collecte_y6_session',
    DB_NAME: 'CollecteYaounde6DB',
    DB_VERSION: 1
  })
});