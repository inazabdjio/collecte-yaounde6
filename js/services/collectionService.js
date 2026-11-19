import { getRepository } from '../repositories/repositoryFactory.js';
import { createCollectionScheduleSchema } from '../models/schemas.js';
import { notificationService } from './notificationService.js';

class CollectionService {
  async listSchedules() {
    const repo = getRepository();
    const [schedules, locations, users] = await Promise.all([
      repo.getSchedules(),
      repo.getLocations(),
      repo.getUsers()
    ]);

    const locationMap = new Map(locations.map((l) => [l.id, l]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    return schedules.map((sch) => ({
      ...sch,
      location: locationMap.get(sch.locationId) || null,
      collector: sch.collectorId ? userMap.get(sch.collectorId) || null : null
    }));
  }

  async listSchedulesForCollector(collectorId) {
    const all = await this.listSchedules();
    return all.filter((sch) => sch.collectorId === collectorId);
  }

  async createSchedule({
    subscriptionId = null,
    locationId,
    collectorId = null,
    serviceCode = 'BASE',
    scheduledDate,
    timeSlot = '07:00 - 10:00'
  }) {
    if (!locationId || !scheduledDate) {
      throw new Error('Le lieu de collecte et le jour/date sont obligatoires.');
    }

    const repo = getRepository();
    const schedule = createCollectionScheduleSchema({
      subscriptionId,
      locationId,
      collectorId,
      serviceCode,
      scheduledDate,
      timeSlot,
      status: collectorId ? 'ASSIGNED' : 'PENDING'
    });

    await repo.saveSchedule(schedule);

    if (collectorId) {
      await notificationService.pushNotification({
        userId: collectorId,
        type: 'info',
        title: 'Nouvelle collecte assignée',
        message: `Collecte prévue (${scheduledDate}, ${timeSlot}).`
      });
    }

    return schedule;
  }

  async assignCollector(scheduleId, collectorId) {
    const repo = getRepository();
    const schedules = await repo.getSchedules();
    const target = schedules.find((s) => s.id === scheduleId);
    if (!target) {
      throw new Error('Planification introuvable.');
    }

    const updated = {
      ...target,
      collectorId: collectorId || null,
      status: collectorId ? 'ASSIGNED' : 'PENDING'
    };

    await repo.saveSchedule(updated);

    if (collectorId) {
      await notificationService.pushNotification({
        userId: collectorId,
        type: 'info',
        title: 'Affectation de ramassage',
        message: `Un nouveau ramassage (${target.scheduledDate}) vous a été attribué.`
      });
    }

    return updated;
  }

  async updateScheduleStatus(scheduleId, status) {
    const repo = getRepository();
    const schedules = await repo.getSchedules();
    const target = schedules.find((s) => s.id === scheduleId);
    if (!target) {
      throw new Error('Planification introuvable.');
    }

    const updated = { ...target, status };
    await repo.saveSchedule(updated);
    return updated;
  }
}

export const collectionService = new CollectionService();