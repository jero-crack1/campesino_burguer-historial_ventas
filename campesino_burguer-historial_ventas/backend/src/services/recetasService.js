const { Receta, DetalleReceta, MateriaPrima, SubReceta, sequelize } = require('../models');

const include = [{
  model: DetalleReceta, as: 'ingredientes',
  include: [
    { model: MateriaPrima, as: 'materiaPrima' },
    { model: SubReceta, as: 'subReceta' },
  ],
}];

const getAll = async () =>
  Receta.findAll({ include, order: [['nombre', 'ASC']] });

const getById = async (id) => {
  const r = await Receta.findByPk(id, { include });
  if (!r) throw { status: 404, message: 'Receta no encontrada' };
  return r;
};

const create = async ({ nombre, descripcion, unidad_produccion, cantidad_produccion, precio_venta, costo_produccion, imagen_url, ingredientes }) => {
  const t = await sequelize.transaction();
  try {
    const receta = await Receta.create({ nombre, descripcion, unidad_produccion, cantidad_produccion, precio_venta, costo_produccion, imagen_url }, { transaction: t });
    for (const ing of ingredientes) {
      await DetalleReceta.create({ ...ing, receta_id: receta.id }, { transaction: t });
    }
    await t.commit();
    return getById(receta.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const update = async (id, { nombre, descripcion, unidad_produccion, cantidad_produccion, precio_venta, costo_produccion, imagen_url, ingredientes }) => {
  const t = await sequelize.transaction();
  try {
    const receta = await getById(id);
    await receta.update({ nombre, descripcion, unidad_produccion, cantidad_produccion, precio_venta, costo_produccion, imagen_url }, { transaction: t });
    if (ingredientes) {
      await DetalleReceta.destroy({ where: { receta_id: id }, transaction: t });
      for (const ing of ingredientes) {
        await DetalleReceta.create({ ...ing, receta_id: id }, { transaction: t });
      }
    }
    await t.commit();
    return getById(id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const remove = async (id) => {
  const r = await getById(id);
  await r.destroy();
};

module.exports = { getAll, getById, create, update, remove };
