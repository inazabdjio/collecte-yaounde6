import { pwaInstall } from '../core/pwaInstall.js';

/**
 * Crée un bouton ou bloc d'installation PWA.
 * @param {Object} options
 * @param {'button'|'banner'} options.variant - 'button' pour le header, 'banner' pour un encart dédié
 * @param {Function} [options.onStatus] - callback optionnel (message, type)
 */
export function createInstallButton({ variant = 'button', onStatus } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'pwa-install-wrapper';

  const button = document.createElement('button');
  button.type = 'button';
  button.className =
    variant === 'banner'
      ? 'btn btn-primary btn-block'
      : 'btn btn-install btn-sm';
  button.textContent = 'Télécharger l’app';

  const iosHint = document.createElement('p');
  iosHint.className = 'alert alert-info';
  iosHint.style.display = 'none';
  iosHint.style.marginTop = '8px';
  iosHint.textContent =
    'Sur iPhone/iPad (Safari) : appuyez sur le bouton Partager puis « Sur l’écran d’accueil ».';

  button.addEventListener('click', async () => {
    const state = pwaInstall.getState();

    if (state.isInstalled) {
      onStatus?.('L’application est déjà installée.', 'info');
      return;
    }

    if (state.canPromptInstall) {
      const result = await pwaInstall.promptInstall();
      if (result.outcome === 'accepted') {
        onStatus?.('Installation de l’application lancée.', 'info');
      } else if (result.outcome === 'dismissed') {
        onStatus?.('Installation annulée.', 'warning');
      }
      return;
    }

    if (state.showIosHelp) {
      iosHint.style.display = iosHint.style.display === 'none' ? 'block' : 'none';
      return;
    }

    // Repli si le navigateur n'a pas encore émis beforeinstallprompt (ex: HTTP non sécurisé ou déjà installé)
    onStatus?.(
      'Pour installer l’app : ouvrez le menu du navigateur (⋮) puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».',
      'info'
    );
  });

  const unsubscribe = pwaInstall.subscribe((state) => {
    if (state.isInstalled && variant === 'button') {
      button.style.display = 'none';
    } else {
      button.style.display = 'inline-flex';
      button.textContent = state.isInstalled ? 'App installée' : 'Télécharger l’app';
    }
  });

  wrapper.appendChild(button);
  wrapper.appendChild(iosHint);
  wrapper.destroy = unsubscribe;

  return wrapper;
}