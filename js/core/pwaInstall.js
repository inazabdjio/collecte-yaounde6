class PwaInstallManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = this._checkIfInstalled();
    this.listeners = new Set();
    this._bindEvents();
  }

  _checkIfInstalled() {
    const isStandaloneDisplay =
      window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = window.navigator.standalone === true;
    return Boolean(isStandaloneDisplay || isIosStandalone);
  }

  _bindEvents() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this._notify();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstalled = true;
      this._notify();
    });

    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(display-mode: standalone)');
      mediaQuery.addEventListener('change', (e) => {
        this.isInstalled = e.matches;
        this._notify();
      });
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.getState());
    return () => this.listeners.delete(callback);
  }

  _notify() {
    const state = this.getState();
    this.listeners.forEach((cb) => cb(state));
  }

  getState() {
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    return {
      canPromptInstall: Boolean(this.deferredPrompt) && !this.isInstalled,
      isInstalled: this.isInstalled,
      showIosHelp: isIos && !this.isInstalled && !this.deferredPrompt
    };
  }

  async promptInstall() {
    if (this.isInstalled) {
      return { outcome: 'already_installed' };
    }

    if (!this.deferredPrompt) {
      return { outcome: 'unavailable' };
    }

    const promptEvent = this.deferredPrompt;
    promptEvent.prompt();

    const choiceResult = await promptEvent.userChoice;
    this.deferredPrompt = null;

    if (choiceResult.outcome === 'accepted') {
      this.isInstalled = true;
    }

    this._notify();
    return { outcome: choiceResult.outcome };
  }
}

export const pwaInstall = new PwaInstallManager();