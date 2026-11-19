import { APP_CONFIG } from '../../config/appConfig.js';
import {
  createUserSchema,
  createServicePlanSchema,
  createCollectionLocationSchema,
  createSubscriptionSchema,
  createCollectionScheduleSchema,
  createNotificationSchema
} from '../../models/schemas.js';

export function buildSeedData() {
  const clientUser = createUserSchema({
    id: 'usr_client_1',
    fullName: 'Amina Ngono',
    email: 'client@collecte.cm',
    phone: '+237 670 000 001',
    role: APP_CONFIG.ROLES.CLIENT
  });

  const collectorUser = createUserSchema({
    id: 'usr_eboueur_1',
    fullName: 'Paul Mbarga',
    email: 'eboueur@collecte.cm',
    phone: '+237 670 000 002',
    role: APP_CONFIG.ROLES.EBOUEUR
  });

  const adminUser = createUserSchema({
    id: 'usr_admin_1',
    fullName: 'Admin Système',
    email: 'admin@collecte.cm',
    phone: '+237 670 000 003',
    role: APP_CONFIG.ROLES.ADMIN
  });

  const servicePlans = [
    createServicePlanSchema({
      id: 'srv_base',
      code: APP_CONFIG.SERVICE_TYPES.BASE,
      name: 'Service de base (2 mois)',
      description: 'Collecte planifiée sur un horizon de 2 mois avec sélection de 2 jours.',
      price: 5000,
      currency: 'XAF',
      wasteLimitKg: 35,
      horizonMonths: APP_CONFIG.BASE_PLAN_HORIZON_MONTHS
    }),
    createServicePlanSchema({
      id: 'srv_express',
      code: APP_CONFIG.SERVICE_TYPES.EXPRESS,
      name: 'Service Express',
      description: 'Prise en charge rapide avec priorité sur les créneaux.',
      price: 10000,
      currency: 'XAF',
      wasteLimitKg: 60,
      horizonMonths: 1
    }),
    createServicePlanSchema({
      id: 'srv_vip',
      code: APP_CONFIG.SERVICE_TYPES.VIP,
      name: 'Service VIP',
      description: 'Tarif supérieur avec suivi renforcé et limite d’ordures dédiée.',
      price: 20000,
      currency: 'XAF',
      wasteLimitKg: 120,
      horizonMonths: 1
    })
  ];

  const locations = [
    createCollectionLocationSchema({
      id: 'loc_1',
      userId: clientUser.id,
      label: 'Résidence Biyem-Assi',
      quarter: 'Biyem-Assi',
      addressDetails: 'Près du carrefour Lac',
      latitude: 3.8412,
      longitude: 11.4915,
      feasible: true,
      feasibilityNote: 'Zone accessible aux équipes de collecte'
    }),
    createCollectionLocationSchema({
      id: 'loc_2',
      userId: clientUser.id,
      label: 'Entrée Mvog-Betsi',
      quarter: 'Mvog-Betsi',
      addressDetails: 'Ruelle secondaire non goudronnée',
      latitude: 3.8754,
      longitude: 11.5012,
      feasible: false,
      feasibilityNote: 'Warning : accès restreint, point de regroupement requis'
    })
  ];

  const subscriptions = [
    createSubscriptionSchema({
      id: 'sub_1',
      userId: clientUser.id,
      serviceId: 'srv_base',
      serviceCode: APP_CONFIG.SERVICE_TYPES.BASE,
      locationId: 'loc_1',
      selectedDays: ['Lundi', 'Jeudi'],
      paymentMethod: 'MOBILE_MONEY',
      paymentVerified: true,
      feasibilityVerified: true,
      status: 'ACTIVE'
    })
  ];

  const schedules = [
    createCollectionScheduleSchema({
      id: 'sch_1',
      subscriptionId: 'sub_1',
      locationId: 'loc_1',
      collectorId: collectorUser.id,
      serviceCode: APP_CONFIG.SERVICE_TYPES.BASE,
      scheduledDate: 'Lundi',
      timeSlot: '07:00 - 09:30',
      status: 'ASSIGNED'
    }),
    createCollectionScheduleSchema({
      id: 'sch_2',
      subscriptionId: 'sub_1',
      locationId: 'loc_1',
      collectorId: collectorUser.id,
      serviceCode: APP_CONFIG.SERVICE_TYPES.BASE,
      scheduledDate: 'Jeudi',
      timeSlot: '07:00 - 09:30',
      status: 'PENDING'
    })
  ];

  const notifications = [
    createNotificationSchema({
      id: 'notif_1',
      userId: clientUser.id,
      role: APP_CONFIG.ROLES.CLIENT,
      type: 'warning',
      title: 'Vérification emplacement',
      message: 'Certains accès secondaires peuvent nécessiter un point de collecte validé.'
    }),
    createNotificationSchema({
      id: 'notif_2',
      userId: collectorUser.id,
      role: APP_CONFIG.ROLES.EBOUEUR,
      type: 'info',
      title: 'Nouvelle tournée assignée',
      message: 'Des collectes sont planifiées pour votre compte.'
    })
  ];

  return {
    users: [clientUser, collectorUser, adminUser],
    servicePlans,
    locations,
    subscriptions,
    schedules,
    notifications
  };
}