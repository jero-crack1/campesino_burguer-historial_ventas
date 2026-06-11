const state = {
  products: [],
  clients: [],
  discounts: [],
  cart: [],
  selectedProduct: null
};

const elements = {
  productsGrid: document.getElementById('productsGrid'),
  productSearch: document.getElementById('productSearch'),
  clientSelect: document.getElementById('clientSelect'),
  discountSelect: document.getElementById('discountSelect'),
  paymentMethod: document.getElementById('paymentMethod'),
  cashSection: document.getElementById('cashSection'),
  cashReceived: document.getElementById('cashReceived'),
  changeAmount: document.getElementById('changeAmount'),
  cartItems: document.getElementById('cartItems'),
  cartCount: document.getElementById('cartCount'),
  subtotalText: document.getElementById('subtotalText'),
  discountText: document.getElementById('discountText'),
  totalText: document.getElementById('totalText'),
  salesMessage: document.getElementById('salesMessage'),
  finishSaleBtn: document.getElementById('finishSaleBtn'),
  pauseSaleBtn: document.getElementById('pauseSaleBtn'),
  clearCartBtn: document.getElementById('clearCartBtn'),
  resumeSaleBtn: document.getElementById('resumeSaleBtn'),
  quantityModal: document.getElementById('quantityModal'),
  quantityForm: document.getElementById('quantityForm'),
  quantityTitle: document.getElementById('quantityTitle'),
  quantityInput: document.getElementById('quantityInput'),
  cancelQuantityBtn: document.getElementById('cancelQuantityBtn'),
  confirmModal: document.getElementById('confirmModal'),
  confirmForm: document.getElementById('confirmForm'),
  confirmSummary: document.getElementById('confirmSummary'),
  cancelConfirmBtn: document.getElementById('cancelConfirmBtn'),
  pausedModal: document.getElementById('pausedModal'),
  pausedSalesList: document.getElementById('pausedSalesList'),
  closePausedBtn: document.getElementById('closePausedBtn')
};

function money(value) {
  return Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });
}

function showMessage(message, isError = false) {
  elements.salesMessage.textContent = message;
  elements.salesMessage.classList.toggle('error', isError);
}

function productStockText(product) {
  return product.seguimientoInventario === false
    ? 'Inventario libre'
    : `Stock: ${Number(product.stock || 0)}`;
}

function cartQuantity(productId) {
  const item = state.cart.find((cartItem) => cartItem.productoId === Number(productId));
  return item ? item.cantidad : 0;
}

function hasStock(product, quantity) {
  if (product.seguimientoInventario === false) {
    return true;
  }

  return Number(product.stock || 0) >= cartQuantity(product.id) + Number(quantity);
}

function renderProducts() {
  const search = elements.productSearch.value.trim().toLowerCase();
  const products = state.products.filter((product) => {
    return product.nombre.toLowerCase().includes(search);
  });

  if (products.length === 0) {
    elements.productsGrid.innerHTML = '<p class="message-line">No hay productos disponibles.</p>';
    return;
  }

  elements.productsGrid.innerHTML = products.map((product) => {
    const disabled = product.seguimientoInventario !== false && Number(product.stock || 0) <= 0;
    return `
      <article class="product-card">
        <div>
          <h3>${product.nombre}</h3>
          <p>${product.categoria || 'Sin categoria'} · ${productStockText(product)}</p>
        </div>
        <strong>${money(product.precio)}</strong>
        <button type="button" data-product-id="${product.id}" ${disabled ? 'disabled' : ''}>Agregar</button>
      </article>
    `;
  }).join('');
}

function selectedDiscount() {
  return state.discounts.find((discount) => String(discount.id) === elements.discountSelect.value);
}

function totals() {
  const subtotal = state.cart.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
  const discount = selectedDiscount();
  let discountValue = 0;

  if (discount) {
    const type = discount.tipo || discount.type || discount.clase;
    const value = Number(discount.valor || discount.value || 0);
    discountValue = type === 'porcentaje' || type === 'percentage'
      ? subtotal * (value / 100)
      : value;
  }

  discountValue = Math.min(discountValue, subtotal);

  return {
    subtotal,
    discountValue,
    total: subtotal - discountValue
  };
}

function renderCart() {
  elements.cartCount.textContent = `${state.cart.length} items`;

  if (state.cart.length === 0) {
    elements.cartItems.innerHTML = '<p class="message-line">El carrito esta vacio.</p>';
  } else {
    elements.cartItems.innerHTML = state.cart.map((item) => `
      <div class="cart-item">
        <div>
          <strong>${item.nombre}</strong>
          <span>${money(item.precioUnitario)} c/u · ${money(item.precioUnitario * item.cantidad)}</span>
        </div>
        <input type="number" min="1" step="1" value="${item.cantidad}" data-cart-quantity="${item.productoId}">
        <button class="small-btn delete" type="button" data-remove="${item.productoId}">Eliminar</button>
      </div>
    `).join('');
  }

  const currentTotals = totals();
  elements.subtotalText.textContent = money(currentTotals.subtotal);
  elements.discountText.textContent = money(currentTotals.discountValue);
  elements.totalText.textContent = money(currentTotals.total);
  elements.finishSaleBtn.disabled = state.cart.length === 0;
  updateCashChange();
}

function addToCart(product, quantity) {
  if (!hasStock(product, quantity)) {
    showMessage(`No hay stock suficiente para ${product.nombre}.`, true);
    return;
  }

  const currentItem = state.cart.find((item) => item.productoId === product.id);

  if (currentItem) {
    currentItem.cantidad += Number(quantity);
  } else {
    state.cart.push({
      productoId: product.id,
      nombre: product.nombre,
      cantidad: Number(quantity),
      precioUnitario: Number(product.precio || 0)
    });
  }

  renderCart();
  showMessage(`${product.nombre} agregado al carrito.`);
}

function fillSelect(select, items, emptyLabel) {
  select.innerHTML = `<option value="">${emptyLabel}</option>` + items.map((item) => {
    const label = item.nombre || item.name || item.cliente || `Registro #${item.id}`;
    return `<option value="${item.id}">${label}</option>`;
  }).join('');
}

function updateCashChange() {
  const total = totals().total;
  const received = Number(elements.cashReceived.value || 0);
  const change = Math.max(received - total, 0);
  elements.changeAmount.textContent = money(change);
}

function paymentIsValid() {
  if (!elements.paymentMethod.value) {
    showMessage('Selecciona un metodo de pago.', true);
    return false;
  }

  if (elements.paymentMethod.value === 'Efectivo' && Number(elements.cashReceived.value || 0) < totals().total) {
    showMessage('El efectivo recibido no alcanza para cubrir el total.', true);
    return false;
  }

  return true;
}

function pausedSales() {
  return JSON.parse(localStorage.getItem('ventasPausadas') || '[]');
}

function savePausedSales(sales) {
  localStorage.setItem('ventasPausadas', JSON.stringify(sales));
}

function clearCart() {
  state.cart = [];
  renderCart();
}

async function loadInitialData() {
  try {
    const [products, clients, discounts] = await Promise.all([
      window.Backend.get('productos'),
      window.Backend.get('clientes'),
      window.Backend.get('descuentos')
    ]);

    state.products = Array.isArray(products.data) ? products.data : [];
    state.clients = Array.isArray(clients.data) ? clients.data : [];
    state.discounts = Array.isArray(discounts.data) ? discounts.data : [];

    renderProducts();
    fillSelect(elements.clientSelect, state.clients, 'Cliente general');
    fillSelect(elements.discountSelect, state.discounts, 'Sin descuento');
    renderCart();
  } catch (error) {
    showMessage(error.message, true);
  }
}

function openQuantityModal(product) {
  state.selectedProduct = product;
  elements.quantityTitle.textContent = `Agregar ${product.nombre}`;
  elements.quantityInput.value = 1;
  elements.quantityModal.showModal();
}

function showConfirmModal() {
  if (!paymentIsValid()) {
    return;
  }

  const currentTotals = totals();
  elements.confirmSummary.innerHTML = `
    <p><strong>Productos:</strong> ${state.cart.length}</p>
    <p><strong>Subtotal:</strong> ${money(currentTotals.subtotal)}</p>
    <p><strong>Descuento:</strong> ${money(currentTotals.discountValue)}</p>
    <p><strong>Total:</strong> ${money(currentTotals.total)}</p>
    <p><strong>Pago:</strong> ${elements.paymentMethod.value}</p>
  `;
  elements.confirmModal.showModal();
}

async function finishSale() {
  const currentTotals = totals();
  const salePayload = {
    clienteId: elements.clientSelect.value || null,
    descuentoId: elements.discountSelect.value || null,
    metodoPago: elements.paymentMethod.value,
    efectivoRecibido: elements.paymentMethod.value === 'Efectivo' ? Number(elements.cashReceived.value || 0) : null,
    cambio: elements.paymentMethod.value === 'Efectivo' ? Number(elements.cashReceived.value || 0) - currentTotals.total : null,
    subtotal: currentTotals.subtotal,
    descuento: currentTotals.discountValue,
    total: currentTotals.total,
    items: state.cart.map((item) => ({
      productoId: item.productoId,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal: item.precioUnitario * item.cantidad
    }))
  };

  try {
    const sale = await window.Backend.post('ventas', salePayload);
    await Promise.all(salePayload.items.map((item) => {
      return window.Backend.post('detalle_ventas', {
        ventaId: sale.data.id,
        ...item
      });
    }));

    clearCart();
    window.location.href = `factura.html?id=${sale.data.id}`;
  } catch (error) {
    showMessage(error.message, true);
  }
}

function renderPausedSales() {
  const sales = pausedSales();

  if (sales.length === 0) {
    elements.pausedSalesList.innerHTML = '<p class="message-line">No hay ventas pausadas.</p>';
    return;
  }

  elements.pausedSalesList.innerHTML = sales.map((sale) => `
    <div class="paused-sale">
      <div>
        <strong>${sale.nombre}</strong>
        <span>${sale.cart.length} productos</span>
      </div>
      <button class="small-btn" type="button" data-resume="${sale.id}">Retomar</button>
      <button class="small-btn delete" type="button" data-delete-paused="${sale.id}">Eliminar</button>
    </div>
  `).join('');
}

elements.productSearch.addEventListener('input', renderProducts);

elements.productsGrid.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-product-id]');

  if (!button) {
    return;
  }

  const product = state.products.find((item) => item.id === Number(button.dataset.productId));

  if (product) {
    openQuantityModal(product);
  }
});

elements.quantityForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addToCart(state.selectedProduct, Number(elements.quantityInput.value));
  elements.quantityModal.close();
});

elements.cancelQuantityBtn.addEventListener('click', () => elements.quantityModal.close());

elements.cartItems.addEventListener('input', (event) => {
  const input = event.target.closest('input[data-cart-quantity]');

  if (!input) {
    return;
  }

  const item = state.cart.find((cartItem) => cartItem.productoId === Number(input.dataset.cartQuantity));
  const product = state.products.find((productItem) => productItem.id === item.productoId);
  const nextQuantity = Number(input.value || 1);

  if (product.seguimientoInventario !== false && nextQuantity > Number(product.stock || 0)) {
    input.value = item.cantidad;
    showMessage(`No hay stock suficiente para ${product.nombre}.`, true);
    return;
  }

  item.cantidad = nextQuantity;
  renderCart();
});

elements.cartItems.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-remove]');

  if (!button) {
    return;
  }

  state.cart = state.cart.filter((item) => item.productoId !== Number(button.dataset.remove));
  renderCart();
});

elements.discountSelect.addEventListener('change', renderCart);
elements.cashReceived.addEventListener('input', updateCashChange);
elements.paymentMethod.addEventListener('change', () => {
  elements.cashSection.classList.toggle('hidden', elements.paymentMethod.value !== 'Efectivo');
  updateCashChange();
});

elements.clearCartBtn.addEventListener('click', clearCart);
elements.finishSaleBtn.addEventListener('click', showConfirmModal);
elements.cancelConfirmBtn.addEventListener('click', () => elements.confirmModal.close());
elements.confirmForm.addEventListener('submit', (event) => {
  event.preventDefault();
  elements.confirmModal.close();
  finishSale();
});

elements.pauseSaleBtn.addEventListener('click', () => {
  if (state.cart.length === 0) {
    showMessage('No hay productos para pausar.', true);
    return;
  }

  const sales = pausedSales();
  sales.push({
    id: Date.now(),
    nombre: `Venta pausada ${new Date().toLocaleString('es-CO')}`,
    cart: state.cart,
    clienteId: elements.clientSelect.value,
    descuentoId: elements.discountSelect.value,
    metodoPago: elements.paymentMethod.value
  });
  savePausedSales(sales);
  clearCart();
  showMessage('Venta pausada correctamente.');
});

elements.resumeSaleBtn.addEventListener('click', () => {
  renderPausedSales();
  elements.pausedModal.showModal();
});

elements.closePausedBtn.addEventListener('click', () => elements.pausedModal.close());

elements.pausedSalesList.addEventListener('click', (event) => {
  const resumeButton = event.target.closest('button[data-resume]');
  const deleteButton = event.target.closest('button[data-delete-paused]');
  const sales = pausedSales();

  if (resumeButton) {
    const sale = sales.find((item) => item.id === Number(resumeButton.dataset.resume));
    state.cart = sale.cart;
    elements.clientSelect.value = sale.clienteId || '';
    elements.discountSelect.value = sale.descuentoId || '';
    elements.paymentMethod.value = sale.metodoPago || '';
    savePausedSales(sales.filter((item) => item.id !== sale.id));
    renderCart();
    elements.pausedModal.close();
  }

  if (deleteButton) {
    savePausedSales(sales.filter((item) => item.id !== Number(deleteButton.dataset.deletePaused)));
    renderPausedSales();
  }
});

loadInitialData();
