const express = require('express');
const { readRecords, writeRecords, nextId } = require('../utils/dataStore');

const router = express.Router();
const products = readRecords('productos');

function validCategories() {
  const categories = readRecords('categorias');

  if (categories.length === 0) {
    return ['Hamburguesas', 'Bebidas', 'Acompanamientos', 'Combos'];
  }

  return categories.map((category) => category.nombre || category.name).filter(Boolean);
}

function normalizeProduct(body, id) {
  const seguimientoInventario = body.seguimientoInventario !== false;

  return {
    id,
    nombre: String(body.nombre || '').trim(),
    categoria: String(body.categoria || '').trim(),
    precio: Number(body.precio || body.precioVenta || 0),
    costo: Number(body.costo || 0),
    stock: seguimientoInventario ? Number(body.stock ?? body.cantidad ?? 0) : null,
    seguimientoInventario,
    descripcion: String(body.descripcion || '').trim()
  };
}

function validateProduct(product) {
  if (!product.nombre) {
    return 'El nombre del producto es obligatorio';
  }

  if (!product.categoria) {
    return 'La categoria es obligatoria';
  }

  if (!validCategories().includes(product.categoria)) {
    return 'La categoria seleccionada no existe';
  }

  if (product.precio < 0 || product.costo < 0) {
    return 'Precio y costo no pueden ser negativos';
  }

  if (product.seguimientoInventario && product.stock < 0) {
    return 'El stock no puede ser negativo';
  }

  return null;
}

router.get('/', (req, res) => {
  res.json({ resource: 'productos', data: products });
});

router.get('/categorias-validas', (req, res) => {
  res.json({ data: validCategories() });
});

router.get('/:id', (req, res) => {
  const product = products.find((item) => item.id === Number(req.params.id));

  if (!product) {
    return res.status(404).json({ error: 'Producto not found' });
  }

  return res.json({ resource: 'productos', data: product });
});

router.post('/', (req, res) => {
  const product = normalizeProduct(req.body, nextId(products));
  const validationError = validateProduct(product);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  products.push(product);
  writeRecords('productos', products);

  return res.status(201).json({ resource: 'productos', data: product });
});

router.put('/:id', (req, res) => {
  const productIndex = products.findIndex((item) => item.id === Number(req.params.id));

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Producto not found' });
  }

  const updatedProduct = normalizeProduct(
    { ...products[productIndex], ...req.body },
    Number(req.params.id)
  );
  const validationError = validateProduct(updatedProduct);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  products[productIndex] = updatedProduct;
  writeRecords('productos', products);

  return res.json({ resource: 'productos', data: updatedProduct });
});

router.delete('/:id', (req, res) => {
  const productIndex = products.findIndex((item) => item.id === Number(req.params.id));

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Producto not found' });
  }

  products.splice(productIndex, 1);
  writeRecords('productos', products);

  return res.status(204).send();
});

module.exports = router;
