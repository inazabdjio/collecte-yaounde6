export const PAYMENT_METHODS = Object.freeze([
  { id: 'MOBILE_MONEY', label: 'Mobile Money (MTN / Orange)' },
  { id: 'CARD', label: 'Carte bancaire' },
  { id: 'CASH_ON_VALIDATION', label: 'Paiement à la validation' }
]);

class PaymentService {
  getAvailableMethods() {
    return PAYMENT_METHODS;
  }

  /**
   * Vérifie le mode de paiement choisi et retourne un résultat + warning éventuel.
   */
  async verifyPaymentMethod({ paymentMethod, amount, serviceCode }) {
    if (!paymentMethod) {
      throw new Error('Veuillez sélectionner un mode de paiement.');
    }

    if (amount === undefined || amount === null || Number(amount) <= 0) {
      throw new Error('Le montant à payer est invalide.');
    }

    // Simulation d'une vérification asynchrone (remplaçable par un appel API Java)
    await new Promise((resolve) => setTimeout(resolve, 150));

    if (paymentMethod === 'CASH_ON_VALIDATION') {
      return {
        verified: true,
        status: 'PENDING_VALIDATION',
        warning:
          'Warning : l’activation définitive de la collecte restera soumise à la validation du paiement.'
      };
    }

    if (serviceCode === 'VIP') {
      return {
        verified: true,
        status: 'VERIFIED',
        warning:
          'Warning : le service VIP applique un tarif supérieur et une limite dédiée sur les ordures.'
      };
    }

    return {
      verified: true,
      status: 'VERIFIED',
      warning: null
    };
  }
}

export const paymentService = new PaymentService();