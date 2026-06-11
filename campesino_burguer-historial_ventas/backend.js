window.Backend = {
  baseUrl: '/api',

  async request(path, options = {}) {
    const response = await fetch(`${this.baseUrl}/${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (response.status === 204) {
      return { ok: true };
    }

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.error || response.statusText);
    }

    return body;
  },

  get(path) {
    return this.request(path, { method: 'GET' });
  },

  post(path, body) {
    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }
};
