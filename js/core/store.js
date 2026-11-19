class Store {
  constructor() {
    this.state = {
      currentUser: null,
      activeRole: null,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      currentRoute: '#/login',
      notifications: []
    };
    this.listeners = new Set();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setState({ isOnline: true }));
      window.addEventListener('offline', () => this.setState({ isOnline: false }));
    }
  }

  getState() {
    return this.state;
  }

  setState(partialState) {
    this.state = {
      ...this.state,
      ...(typeof partialState === 'function' ? partialState(this.state) : partialState)
    };
    this.listeners.forEach((listener) => listener(this.state));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const store = new Store();