const { MateriaPrima } = require('../models');
const { Op } = require('sequelize');

const getAll = async (query = {}) => {
  const where = {};
  if (query.nombre) where.nombre = { [Op.iLike]: `%${query.nombre}%` };
  return MateriaPrima.findAll({ where, order: [['nombre', 'ASC']] });
};

const getById = async (id) => {
  const mp = await MateriaPrima.findByPk(id);
  if (!mp) throw { status: 404, message: 'Materia prima no encontrada' };
  return mp;
};

const calcularPrecioUnitario = (data) => {
  const cp = parseFloat(data.costo_paquete);
  const qp = parseFloat(data.cantidad_paquete);
  if (cp > 0 && qp > 0) data.precio_unitario = parseFloat((cp / qp).toFixed(4));
  return data;
};

const create = async (data) => MateriaPrima.create(calcularPrecioUnitario(data));

const update = async (id, data) => {
  const mp = await getById(id);
  return mp.update(calcularPrecioUnitario(data));
};

const remove = async (id) => {
  const mp = await getById(id);
  await mp.destroy();
};

module.exports = { getAll, getById, create, update, remove };
