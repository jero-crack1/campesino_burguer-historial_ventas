const express = require('express');
const { readRecords, writeRecords, nextId } = require('../utils/dataStore');

const router = express.Router();
const defaultCategories = [
  { id: 1, nombre: 'Hamburguesas' },
  { id: 2, nombre: 'Bebidas' },
  { id: 3, nombre: 'Acompanamientos' },
  { id: 4, nombre: 'Combos' }
];
const categories = readRecords('categorias');

if (categories.length === 0) {
  categories.push(...defaultCategories);
  writeRecords('categorias', categories);
}

router.get('/', (req, res) => {
  res.json({ resource: 'categorias', data: categories });
});

router.post('/', (req, res) => {
  const nombre = String(req.body.nombre || req.body.name || '').trim();

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la categoria es obligatorio' });
  }

  const category = { id: nextId(categories), nombre };
  categories.push(category);
  writeRecords('categorias', categories);

  return res.status(201).json({ resource: 'categorias', data: category });
});

router.put('/:id', (req, res) => {
  const categoryIndex = categories.findIndex((item) => item.id === Number(req.params.id));
  const nombre = String(req.body.nombre || req.body.name || '').trim();

  if (categoryIndex === -1) {
    return res.status(404).json({ error: 'Categoria not found' });
  }

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la categoria es obligatorio' });
  }

  categories[categoryIndex] = { ...categories[categoryIndex], nombre };
  writeRecords('categorias', categories);

  return res.json({ resource: 'categorias', data: categories[categoryIndex] });
});

router.delete('/:id', (req, res) => {
  const categoryIndex = categories.findIndex((item) => item.id === Number(req.params.id));

  if (categoryIndex === -1) {
    return res.status(404).json({ error: 'Categoria not found' });
  }

  categories.splice(categoryIndex, 1);
  writeRecords('categorias', categories);

  return res.status(204).send();
});

module.exports = router;
