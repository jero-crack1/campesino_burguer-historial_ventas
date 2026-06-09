const express = require('express');
const { readRecords, writeRecords, nextId } = require('../utils/dataStore');

const router = express.Router();
const purchases = readRecords('compras');

function purchaseItems(body) {
  if (Array.isArray(body.items)) {
    return body.items;
  }

  if (body.productoId) {
    return [{ productoId: body.productoId, cantidad: body.cantidad || 1 }];
  }

  return [];
}

function applyPurchaseStock(items) {
  const products = readRecords('productos');

  for (const item of items) {
    const product = products.find((productItem) => productItem.id === Number(item.productoId));

    if (!product) {
      return `Producto ${item.productoId} no existe`;
    }
  }

  items.forEach((item) => {
    const product = products.find((productItem) => productItem.id === Number(item.productoId));

    if (product.seguimientoInventario) {
      product.stock += Number(item.cantidad || 0);
    }
  });

  writeRecords('productos', products);
  return null;
}

router.get('/', (req, res) => {
  res.json({ resource: 'compras', data: purchases });
});

router.post('/', (req, res) => {
  const items = purchaseItems(req.body);
  const stockError = applyPurchaseStock(items);

  if (stockError) {
    return res.status(400).json({ error: stockError });
  }

  const purchase = {
    id: nextId(purchases),
    fecha: req.body.fecha || new Date().toISOString(),
    proveedor: req.body.proveedor || null,
    items,
    total: Number(req.body.total || 0)
  };

  purchases.push(purchase);
  writeRecords('compras', purchases);

  return res.status(201).json({ resource: 'compras', data: purchase });
});

module.exports = router;
