const express = require('express');
const { readRecords, writeRecords, nextId } = require('../utils/dataStore');

const router = express.Router();
const sales = readRecords('ventas');

function saleItems(body) {
  if (Array.isArray(body.items)) {
    return body.items;
  }

  if (body.productoId) {
    return [{ productoId: body.productoId, cantidad: body.cantidad || 1 }];
  }

  return [];
}

function applySaleStock(items) {
  const products = readRecords('productos');

  for (const item of items) {
    const product = products.find((productItem) => productItem.id === Number(item.productoId));
    const quantity = Number(item.cantidad || 0);

    if (!product) {
      return `Producto ${item.productoId} no existe`;
    }

    if (product.seguimientoInventario && product.stock < quantity) {
      return `Stock insuficiente para ${product.nombre}`;
    }
  }

  items.forEach((item) => {
    const product = products.find((productItem) => productItem.id === Number(item.productoId));

    if (product.seguimientoInventario) {
      product.stock -= Number(item.cantidad || 0);
    }
  });

  writeRecords('productos', products);
  return null;
}

router.get('/', (req, res) => {
  res.json({ resource: 'ventas', data: sales });
});

router.post('/', (req, res) => {
  const items = saleItems(req.body);
  const stockError = applySaleStock(items);

  if (stockError) {
    return res.status(400).json({ error: stockError });
  }

  const sale = {
    id: nextId(sales),
    fecha: req.body.fecha || new Date().toISOString(),
    cliente: req.body.cliente || null,
    items,
    total: Number(req.body.total || 0)
  };

  sales.push(sale);
  writeRecords('ventas', sales);

  return res.status(201).json({ resource: 'ventas', data: sale });
});

module.exports = router;
