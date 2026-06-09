const API_BASE = '/api';

const resources = [
  { label: 'Productos', path: 'productos', publicRead: true },
  { label: 'Usuarios', path: 'usuarios' },
  { label: 'Categorias', path: 'categorias' },
  { label: 'Descuentos', path: 'descuentos' },
  { label: 'Clientes', path: 'clientes' },
  { label: 'Proveedores', path: 'proveedores' },
  { label: 'Ventas', path: 'ventas', publicRead: true },
  { label: 'Detalle ventas', path: 'detalle_ventas', publicRead: true },
  { label: 'Detalle compras', path: 'detalle_compras', publicRead: true },
  { label: 'Compras', path: 'compras' },
  { label: 'Faltantes', path: 'faltantes' },
  { label: 'Reportes', path: 'reportes' }
];

const state = {
  token: localStorage.getItem('adminToken') || '',
  resource: resources[0]
};

const elements = {
  apiBaseLabel: document.getElementById('apiBaseLabel'),
  resourceNav: document.getElementById('resourceNav'),
  resourceTitle: document.getElementById('resourceTitle'),
  loginForm: document.getElementById('loginForm'),
  username: document.getElementById('username'),
  password: document.getElementById('password'),
  sessionText: document.getElementById('sessionText'),
  refreshBtn: document.getElementById('refreshBtn'),
  clearBtn: document.getElementById('clearBtn'),
  output: document.getElementById('output'),
  requestBadge: document.getElementById('requestBadge'),
  healthText: document.getElementById('healthText'),
  healthDot: document.getElementById('healthDot'),
  createForm: document.getElementById('createForm'),
  createBody: document.getElementById('createBody'),
  updateForm: document.getElementById('updateForm'),
  updateId: document.getElementById('updateId'),
  updateBody: document.getElementById('updateBody'),
  deleteForm: document.getElementById('deleteForm'),
  deleteId: document.getElementById('deleteId')
};

elements.apiBaseLabel.textContent = API_BASE;

function setOutput(value) {
  elements.output.textContent = typeof value === 'string'
    ? value
    : JSON.stringify(value, null, 2);
}

function setRequestBadge(method) {
  elements.requestBadge.textContent = method;
}

function updateSession() {
  elements.sessionText.textContent = state.token
    ? 'Sesion iniciada con token JWT'
    : 'Sin sesion activa';
}

function headers(includeJson = true) {
  const result = {};

  if (includeJson) {
    result['Content-Type'] = 'application/json';
  }

  if (state.token) {
    result.Authorization = `Bearer ${state.token}`;
  }

  return result;
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = typeof body === 'object' && body.error ? body.error : response.statusText;
    throw new Error(`${response.status} ${error}`);
  }

  return body || { ok: true, status: response.status };
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}/${path}`, {
    ...options,
    headers: {
      ...headers(options.body !== undefined),
      ...(options.headers || {})
    }
  });

  return parseResponse(response);
}

function readJson(textarea) {
  try {
    return JSON.parse(textarea.value);
  } catch (error) {
    throw new Error('El JSON no es valido. Revisa comas, llaves y comillas.');
  }
}

function renderResources() {
  elements.resourceNav.innerHTML = '';

  resources.forEach((resource) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `resource-tab${resource.path === state.resource.path ? ' active' : ''}`;
    button.innerHTML = `<span>${resource.label}</span><strong>${resource.publicRead ? 'Libre' : 'Admin'}</strong>`;

    button.addEventListener('click', () => {
      state.resource = resource;
      elements.resourceTitle.textContent = resource.label;
      renderResources();
      listResource();
    });

    elements.resourceNav.appendChild(button);
  });
}

async function checkHealth() {
  try {
    const data = await apiRequest('health', { method: 'GET' });
    elements.healthText.textContent = data.ok ? 'En linea' : 'Sin confirmar';
    elements.healthDot.className = `status-dot ${data.ok ? 'ok' : 'pending'}`;
  } catch (error) {
    elements.healthText.textContent = 'Sin conexion';
    elements.healthDot.className = 'status-dot fail';
  }
}

async function listResource() {
  setRequestBadge('GET');
  setOutput(`Consultando ${state.resource.label}...`);

  try {
    const data = await apiRequest(state.resource.path, { method: 'GET' });
    setOutput(data);
  } catch (error) {
    setOutput({ error: error.message });
  }
}

elements.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setRequestBadge('POST');
  setOutput('Validando credenciales...');

  try {
    const data = await apiRequest('auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: elements.username.value,
        password: elements.password.value
      })
    });

    state.token = data.token;
    localStorage.setItem('adminToken', state.token);
    updateSession();
    setOutput({ ok: true, message: 'Sesion iniciada correctamente.' });
  } catch (error) {
    setOutput({ error: error.message });
  }
});

elements.refreshBtn.addEventListener('click', listResource);

elements.clearBtn.addEventListener('click', () => {
  state.token = '';
  localStorage.removeItem('adminToken');
  elements.password.value = '';
  updateSession();
  setRequestBadge('GET');
  setOutput('Sesion limpiada. Puedes iniciar de nuevo cuando lo necesites.');
});

elements.createForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setRequestBadge('POST');

  try {
    const body = readJson(elements.createBody);
    const data = await apiRequest(state.resource.path, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    setOutput(data);
  } catch (error) {
    setOutput({ error: error.message });
  }
});

elements.updateForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setRequestBadge('PUT');

  try {
    const body = readJson(elements.updateBody);
    const data = await apiRequest(`${state.resource.path}/${elements.updateId.value}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    setOutput(data);
  } catch (error) {
    setOutput({ error: error.message });
  }
});

elements.deleteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setRequestBadge('DELETE');

  try {
    const data = await apiRequest(`${state.resource.path}/${elements.deleteId.value}`, {
      method: 'DELETE'
    });
    setOutput(data);
  } catch (error) {
    setOutput({ error: error.message });
  }
});

renderResources();
updateSession();
checkHealth();
