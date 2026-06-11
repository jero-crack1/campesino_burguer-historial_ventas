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

const create = async (data) => MateriaPrima.create(data);

const update = async (id, data) => {
  const mp = await getById(id);
  return mp.update(data);
};

const remove = async (id) => {
  const mp = await getById(id);
  await mp.destroy();
};

module.exports = { getAll, getById, create, update, remove };
