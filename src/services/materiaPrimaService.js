const { literal } = require('sequelize');
const MateriaPrima = require('../models/MateriaPrima');
const AppError = require('../utils/AppError');

async function getAll() {
  return MateriaPrima.findAll({ order: [['nombre', 'ASC']] });
}

async function getById(id) {
  const mp = await MateriaPrima.findByPk(id);
  if (!mp) throw new AppError('Materia prima no encontrada', 404);
  return mp;
}

async function create(data) {
  return MateriaPrima.create(data);
}

async function update(id, data) {
  const mp = await getById(id);
  return mp.update(data);
}

async function remove(id) {
  const mp = await getById(id);
  await mp.destroy();
}

async function getBajoMinimo() {
  return MateriaPrima.findAll({
    where: literal('stock_actual < stock_minimo'),
    order: [['nombre', 'ASC']],
  });
}

module.exports = { getAll, getById, create, update, remove, getBajoMinimo };
