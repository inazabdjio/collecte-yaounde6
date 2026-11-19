import { getRepository } from '../repositories/repositoryFactory.js';
import { createCollectionLocationSchema } from '../models/schemas.js';

class LocationService {
  async listLocations(userId = null) {
    const repo = getRepository();
    const all = await repo.getLocations();
    if (!userId) return all;
    return all.filter((loc) => loc.userId === userId);
  }

  async getCurrentBrowserPosition() {
    if (!('geolocation' in navigator)) {
      throw new Error('La géolocalisation n’est pas prise en charge par cet appareil.');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          reject(new Error(err.message || 'Impossible de récupérer la position GPS.'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  /**
   * Vérifie la faisabilité d'un lieu de collecte.
   * Retourne { feasible, warning, message }.
   */
  evaluateFeasibility(location) {
    const quarter = (location.quarter || '').toLowerCase();
    const details = (location.addressDetails || '').toLowerCase();

    if (details.includes('non goudronn') || details.includes('inaccessible') || quarter.includes('mvog-betsi')) {
      return {
        feasible: false,
        warning: 'Warning : faisabilité limitée sur cet emplacement.',
        message:
          'L’accès direct peut être difficile. Vérifiez un point de dépôt accessible ou contactez l’administration.'
      };
    }

    return {
      feasible: true,
      warning: null,
      message: 'Emplacement éligible à la collecte.'
    };
  }

  async createOrUpdateLocation(data) {
    if (!data.label || !data.quarter) {
      throw new Error('Veuillez renseigner un libellé et un quartier/zone.');
    }

    const repo = getRepository();
    const evaluation = this.evaluateFeasibility(data);

    const location = createCollectionLocationSchema({
      ...data,
      feasible: evaluation.feasible,
      feasibilityNote: evaluation.message
    });

    await repo.saveLocation(location);
    return {
      location,
      evaluation
    };
  }

  async deleteLocation(id) {
    const repo = getRepository();
    return repo.deleteLocation(id);
  }
}

export const locationService = new LocationService();