import { APP_CONFIG } from '../config/appConfig.js';
import { getRepository } from '../repositories/repositoryFactory.js';
import { createSubscriptionSchema } from '../models/schemas.js';
import { paymentService } from './paymentService.js';
import { locationService } from './locationService.js';
import { notificationService } from './notificationService.js';

export const COLLECTION_DAYS = Object.freeze([
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche'
]);

class SubscriptionService {
  async getServicePlans() {
    const repo = getRepository();
    const plans = await repo.getServicePlans();
    return plans.filter((p) => p.active);
  }

  async listSubscriptions(userId = null) {
    const repo = getRepository();
    const subs = await repo.getSubscriptions();
    if (!userId) return subs;
    return subs.filter((s) => s.userId === userId);
  }

  validateSelectedDays(selectedDays = []) {
    if (!Array.isArray(selectedDays) || selectedDays.length !== APP_CONFIG.SUBSCRIPTION_REQUIRED_DAYS) {
      throw new Error(
        `Veuillez sélectionner exactement ${APP_CONFIG.SUBSCRIPTION_REQUIRED_DAYS} jours de collecte.`
      );
    }
    const uniqueDays = new Set(selectedDays);
    if (uniqueDays.size !== APP_CONFIG.SUBSCRIPTION_REQUIRED_DAYS) {
      throw new Error('Les deux jours sélectionnés doivent être distincts.');
    }
    return true;
  }

  async subscribe({
    userId,
    serviceId,
    locationId,
    paymentMethod,
    selectedDays,
    allowFeasibilityWarning = true
  }) {
    if (!userId) {
      throw new Error('Vous devez être authentifié pour souscrire.');
    }
    if (!serviceId) {
      throw new Error('Veuillez choisir un service.');
    }
    if (!locationId) {
      throw new Error('Veuillez choisir ou renseigner un emplacement de collecte.');
    }

    // 1. Vérification des 2 jours
    this.validateSelectedDays(selectedDays);

    const repo = getRepository();
    const plans = await repo.getServicePlans();
    const plan = plans.find((p) => p.id === serviceId);
    if (!plan) {
      throw new Error('Service introuvable.');
    }

    const location = await repo.getLocationById(locationId);
    if (!location) {
      throw new Error('Emplacement introuvable.');
    }

    // 2. Vérification du mode de paiement
    const paymentCheck = await paymentService.verifyPaymentMethod({
      paymentMethod,
      amount: plan.price,
      serviceCode: plan.code
    });

    if (!paymentCheck.verified) {
      throw new Error('La vérification du mode de paiement a échoué.');
    }

    // 3. Vérification de la faisabilité selon l'emplacement
    const feasibilityCheck = locationService.evaluateFeasibility(location);
    if (!feasibilityCheck.feasible && !allowFeasibilityWarning) {
      throw new Error(feasibilityCheck.warning || 'Emplacement non faisable.');
    }

    const subscription = createSubscriptionSchema({
      userId,
      serviceId: plan.id,
      serviceCode: plan.code,
      locationId: location.id,
      selectedDays,
      paymentMethod,
      paymentVerified: paymentCheck.verified,
      feasibilityVerified: feasibilityCheck.feasible,
      status: paymentCheck.status === 'PENDING_VALIDATION' ? 'PENDING_PAYMENT' : 'ACTIVE'
    });

    await repo.saveSubscription(subscription);

    const warnings = [paymentCheck.warning, feasibilityCheck.warning].filter(Boolean);
    if (warnings.length > 0) {
      await notificationService.pushNotification({
        userId,
        type: 'warning',
        title: `Alerte souscription (${plan.name})`,
        message: warnings.join(' | ')
      });
    } else {
      await notificationService.pushNotification({
        userId,
        type: 'info',
        title: 'Souscription enregistrée',
        message: `Service ${plan.name} activé pour les jours : ${selectedDays.join(' et ')}.`
      });
    }

    return {
      subscription,
      plan,
      location,
      warnings
    };
  }
}

export const subscriptionService = new SubscriptionService();