import { APP_CONFIG } from '../config/appConfig.js';

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

class HttpClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.authToken = null;
  }

  setToken(token) {
    this.authToken = token || null;
  }

  getToken() {
    return this.authToken;
  }

  async request(path, { method = 'GET', body = null, headers = {} } = {}) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${this.baseUrl}${cleanPath}`;

    const requestHeaders = {
      Accept: 'application/json',
      ...headers
    };

    if (body !== null && body !== undefined) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    if (this.authToken) {
      requestHeaders.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body !== null && body !== undefined ? JSON.stringify(body) : undefined
    });

    let payload = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      payload = await response.json().catch(() => null);
    } else {
      payload = await response.text().catch(() => null);
    }

    if (!response.ok) {
      const message =
        (payload && typeof payload === 'object' && payload.message) ||
        `Erreur serveur (${response.status})`;
      throw new ApiError(message, response.status, payload);
    }

    return payload;
  }

  get(path, options) {
    return this.request(path, { ...options, method: 'GET' });
  }

  post(path, body, options) {
    return this.request(path, { ...options, method: 'POST', body });
  }

  put(path, body, options) {
    return this.request(path, { ...options, method: 'PUT', body });
  }

  patch(path, body, options) {
    return this.request(path, { ...options, method: 'PATCH', body });
  }

  delete(path, options) {
    return this.request(path, { ...options, method: 'DELETE' });
  }
}

export const httpClient = new HttpClient(APP_CONFIG.JAVA_API_BASE_URL);