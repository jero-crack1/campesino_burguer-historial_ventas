const API_BASE = '/api';

const state = {
  token: localStorage.getItem('adminToken') || '',
  products: []
};

const elements = {
  resourceTitle: document.getElementById('resourceTitle'),
  loginForm: document.getElementById('loginForm'),
  username: document.getElementById('username'),
  password: document.getElementById('password'),
  sessionText: document.getElementById('sessionText'),
  refreshBtn: document.getElementById('refreshBtn'),
  clearBtn: document.getElementById('clearBtn'),
  output: document.getElementById('output'),
  inventoryBody: document.getElementById('inventoryBody'),
  inventoryCount: document.getElementById('inventoryCount'),
  productForm: document.getElementById('productForm'),
  productFormTitle: document.getElementById('productFormTitle'),
  productId: document.getElementById('productId'),
  productName: document.getElementById('productName'),
  productCategory: document.getElementById('productCategory'),
  productPrice: document.getElementById('productPrice'),
  productCost: document.getElementById('productCost'),
  productStock: document.getElementById('productStock'),
  inventoryTracking: document.getElementById('inventoryTracking'),
  productDescription: document.getElementById('productDescription'),
  saveProductBtn: document.getElementById('saveProductBtn'),
  cancelEditBtn: document.getElementById('cancelEditBtn'),
  totalProducts: document.getElementById('totalProducts'),
  totalUnits: document.getElementById('totalUnits'),
  totalValue: document.getElementById('totalValue')
};

function money(value) {
  return Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });
}

function showMessage(message, isError = false) {
  elements.output.textContent = message;
  elements.output.classList.toggle('error', isError);
}

function updateSession() {
  elements.sessionText.textContent = state.token
    ? 'Sesion iniciada como administrador'
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
  if (response.status === 204) {
    return { ok: true };
  }

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = typeof body === 'object' && body.error ? body.error : response.statusText;
    throw new Error(`${response.status} ${error}`);
  }

  return body;
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

function productFromForm() {
  return {
    nombre: elements.productName.value.trim(),
    categoria: elements.productCategory.value,
    precio: Number(elements.productPrice.value),
    costo: Number(elements.productCost.value),
    stock: Number(elements.productStock.value),
    seguimientoInventario: elements.inventoryTracking.checked,
    descripcion: elements.productDescription.value.trim()
  };
}

function fillForm(product) {
  elements.productId.value = product.id;
  elements.productName.value = product.nombre || '';
  elements.productCategory.value = product.categoria || '';
  elements.productPrice.value = product.precio || 0;
  elements.productCost.value = product.costo || 0;
  elements.productStock.value = product.stock ?? 0;
  elements.inventoryTracking.checked = product.seguimientoInventario !== false;
  elements.productDescription.value = product.descripcion || '';
  elements.productFormTitle.textContent = `Editando producto #${product.id}`;
  elements.saveProductBtn.textContent = 'Guardar';
  elements.productName.focus();
}

function resetForm() {
  elements.productForm.reset();
  elements.productId.value = '';
  elements.inventoryTracking.checked = true;
  elements.productFormTitle.textContent = 'Crear producto';
  elements.saveProductBtn.textContent = 'Guardar';
}

function renderInventory() {
  elements.inventoryCount.textContent = `${state.products.length} items`;

  if (state.products.length === 0) {
    elements.inventoryBody.innerHTML = '<tr><td colspan="8">Todavia no hay productos. Agrega el primero desde el formulario.</td></tr>';
  } else {
    elements.inventoryBody.innerHTML = state.products.map((product) => `
      <tr>
        <td>#${product.id}</td>
        <td>
          <strong>${product.nombre || 'Sin nombre'}</strong>
          <small>${product.descripcion || 'Sin descripcion'}</small>
        </td>
        <td>${product.categoria || 'Sin categoria'}</td>
        <td>${money(product.precio)}</td>
        <td>${money(product.costo)}</td>
        <td>${product.seguimientoInventario === false ? 'Inventario libre' : Number(product.stock || 0)}</td>
        <td><span class="status-pill ${product.seguimientoInventario === false ? 'free' : ''}">${product.seguimientoInventario === false ? 'Libre' : 'Activo'}</span></td>
        <td>
          <div class="row-actions">
            <button type="button" class="small-btn" data-action="edit" data-id="${product.id}">Editar</button>
            <button type="button" class="small-btn delete" data-action="delete" data-id="${product.id}">Eliminar</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  const totalUnits = state.products.reduce((total, product) => {
    if (product.seguimientoInventario === false) {
      return total;
    }

    return total + Number(product.stock || 0);
  }, 0);
  const totalValue = state.products.reduce((total, product) => {
    if (product.seguimientoInventario === false) {
      return total;
    }

    return total + (Number(product.costo || 0) * Number(product.stock || 0));
  }, 0);

  elements.totalProducts.textContent = state.products.length;
  elements.totalUnits.textContent = totalUnits;
  elements.totalValue.textContent = money(totalValue);
}

async function loadCategories() {
  try {
    const response = await apiRequest('categorias', { method: 'GET' });
    const categories = Array.isArray(response.data) ? response.data : [];

    elements.productCategory.innerHTML = categories.map((category) => {
      const name = category.nombre || category.name;
      return `<option value="${name}">${name}</option>`;
    }).join('');
  } catch (error) {
    showMessage(`No se pudieron cargar las categorias: ${error.message}`, true);
  }
}

async function listProducts() {
  showMessage('Actualizando inventario...');

  try {
    const response = await apiRequest('productos', { method: 'GET' });
    state.products = Array.isArray(response.data) ? response.data : [];
    renderInventory();
    showMessage('Inventario actualizado.');
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function saveProduct(event) {
  event.preventDefault();

  const product = productFromForm();
  const id = elements.productId.value;

  try {
    const response = await apiRequest(id ? `productos/${id}` : 'productos', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(product)
    });

    resetForm();
    await listProducts();
    showMessage(id
      ? `Producto #${response.data.id} actualizado correctamente.`
      : `Producto #${response.data.id} agregado al inventario.`);
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function deleteProduct(id) {
  try {
    await apiRequest(`productos/${id}`, { method: 'DELETE' });
    await listProducts();
    showMessage(`Producto #${id} eliminado.`);
  } catch (error) {
    showMessage(error.message, true);
  }
}

elements.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage('Validando credenciales...');

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
    showMessage('Sesion iniciada correctamente.');
  } catch (error) {
    showMessage(error.message, true);
  }
});

elements.refreshBtn.addEventListener('click', listProducts);

elements.clearBtn.addEventListener('click', () => {
  state.token = '';
  localStorage.removeItem('adminToken');
  elements.password.value = '';
  updateSession();
  showMessage('Sesion limpiada. Puedes iniciar de nuevo cuando lo necesites.');
});

elements.productForm.addEventListener('submit', saveProduct);
elements.cancelEditBtn.addEventListener('click', resetForm);
elements.inventoryTracking.addEventListener('change', () => {
  elements.productStock.disabled = !elements.inventoryTracking.checked;

  if (!elements.inventoryTracking.checked) {
    elements.productStock.value = 0;
  }
});

elements.inventoryBody.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');

  if (!button) {
    return;
  }

  const id = Number(button.dataset.id);
  const product = state.products.find((item) => item.id === id);

  if (button.dataset.action === 'edit' && product) {
    fillForm(product);
  }

  if (button.dataset.action === 'delete') {
    deleteProduct(id);
  }
});

updateSession();
loadCategories().then(listProducts);
