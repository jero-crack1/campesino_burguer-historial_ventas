const { SubReceta, DetalleSubReceta, MateriaPrima, sequelize } = require('../models');

const include = [{
  model: DetalleSubReceta,
  as: 'ingredientes',
  include: [
    { model: MateriaPrima, as: 'materiaPrima' },
    { model: SubReceta, as: 'subRecetaIngrediente' },
  ],
}];

const getAll = async () =>
  SubReceta.findAll({ include, order: [['nombre', 'ASC']] });

const getById = async (id) => {
  const sr = await SubReceta.findByPk(id, { include });
  if (!sr) throw { status: 404, message: 'SubReceta no encontrada' };
  return sr;
};

const create = async ({ nombre, descripcion, unidad_produccion, cantidad_produccion, porciones, peso_porcion, costo_porcion, ingredientes }) => {
  const t = await sequelize.transaction();
  try {
    const sr = await SubReceta.create({ nombre, descripcion, unidad_produccion, cantidad_produccion, porciones, peso_porcion, costo_porcion }, { transaction: t });
    for (const ing of ingredientes) {
      await DetalleSubReceta.create({ ...ing, sub_receta_id: sr.id }, { transaction: t });
    }
    await t.commit();
    return getById(sr.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const update = async (id, { nombre, descripcion, unidad_produccion, cantidad_produccion, porciones, peso_porcion, costo_porcion, ingredientes }) => {
  const t = await sequelize.transaction();
  try {
    const sr = await getById(id);
    await sr.update({ nombre, descripcion, unidad_produccion, cantidad_produccion, porciones, peso_porcion, costo_porcion }, { transaction: t });
    if (ingredientes) {
      await DetalleSubReceta.destroy({ where: { sub_receta_id: id }, transaction: t });
      for (const ing of ingredientes) {
        await DetalleSubReceta.create({ ...ing, sub_receta_id: id }, { transaction: t });
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
  const sr = await getById(id);
  await sr.destroy();
};

module.exports = { getAll, getById, create, update, remove };
