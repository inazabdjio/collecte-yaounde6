import { APP_CONFIG } from '../config/appConfig.js';
import { LocalRepository } from './localRepository.js';
import { RemoteRepository } from './remoteRepository.js';

let repositoryInstance = null;

export function getRepository() {
  if (!repositoryInstance) {
    repositoryInstance = APP_CONFIG.USE_MOCK_API
      ? new LocalRepository()
      : new RemoteRepository();
  }
  return repositoryInstance;
}