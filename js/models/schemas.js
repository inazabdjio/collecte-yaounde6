import { APP_CONFIG } from '../config/appConfig.js';

function createId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createUserSchema(data = {}) {
  const role = Object.values(APP_CONFIG.ROLES).includes(data.role)
    ? data.role
    : APP_CONFIG.ROLES.CLIENT;

  return {
    id: data.id || createId('usr'),
    fullName: (data.fullName || '').trim(),
    email: (data.email || '').trim().toLowerCase(),
    phone: (data.phone || '').trim(),
    role,
    active: data.active !== undefined ? Boolean(data.active) : true,
    createdAt: data.createdAt || new Date().toISOString()
  };
}

export function createServicePlanSchema(data = {}) {
  const code = Object.values(APP_CONFIG.SERVICE_TYPES).includes(data.code)
    ? data.code
    : APP_CONFIG.SERVICE_TYPES.BASE;

  return {
    id: data.id || createId('srv'),
    code,
    name: data.name || `Service ${code}`,
    description: data.description || '',
    price: Number(data.price ?? 0),
    currency: data.currency || 'XAF',
    wasteLimitKg: data.wasteLimitKg !== undefined && data.wasteLimitKg !== null
      ? Number(data.wasteLimitKg)
      : null,
    horizonMonths: data.horizonMonths !== undefined && data.horizonMonths !== null
      ? Number(data.horizonMonths)
      : null,
    active: data.active !== undefined ? Boolean(data.active) : true
  };
}

export function createCollectionLocationSchema(data = {}) {
  return {
    id: data.id || createId('loc'),
    userId: data.userId || null,
    label: (data.label || '').trim(),
    quarter: (data.quarter || '').trim(),
    addressDetails: (data.addressDetails || '').trim(),
    latitude: data.latitude !== undefined && data.latitude !== null ? Number(data.latitude) : null,
    longitude: data.longitude !== undefined && data.longitude !== null ? Number(data.longitude) : null,
    feasible: data.feasible !== undefined ? Boolean(data.feasible) : true,
    feasibilityNote: data.feasibilityNote || '',
    createdAt: data.createdAt || new Date().toISOString()
  };
}

export function createSubscriptionSchema(data = {}) {
  const selectedDays = Array.isArray(data.selectedDays) ? [...data.selectedDays] : [];

  return {
    id: data.id || createId('sub'),
    userId: data.userId || '',
    serviceId: data.serviceId || '',
    serviceCode: data.serviceCode || APP_CONFIG.SERVICE_TYPES.BASE,
    locationId: data.locationId || '',
    selectedDays,
    paymentMethod: data.paymentMethod || 'MOBILE_MONEY',
    paymentVerified: Boolean(data.paymentVerified),
    feasibilityVerified: Boolean(data.feasibilityVerified),
    status: data.status || 'ACTIVE',
    startDate: data.startDate || new Date().toISOString().slice(0, 10),
    createdAt: data.createdAt || new Date().toISOString()
  };
}

export function createCollectionScheduleSchema(data = {}) {
  return {
    id: data.id || createId('sch'),
    subscriptionId: data.subscriptionId || null,
    locationId: data.locationId || '',
    collectorId: data.collectorId || null,
    serviceCode: data.serviceCode || APP_CONFIG.SERVICE_TYPES.BASE,
    scheduledDate: data.scheduledDate || '',
    timeSlot: data.timeSlot || '07:00 - 10:00',
    status: data.status || 'PENDING' // PENDING, ASSIGNED, COLLECTED, MISSED
  };
}

export function createNotificationSchema(data = {}) {
  return {
    id: data.id || createId('notif'),
    userId: data.userId || null,
    role: data.role || null,
    type: data.type || 'info', // info, warning, error, success
    title: data.title || 'Notification',
    message: data.message || '',
    read: Boolean(data.read),
    createdAt: data.createdAt || new Date().toISOString()
  };
}