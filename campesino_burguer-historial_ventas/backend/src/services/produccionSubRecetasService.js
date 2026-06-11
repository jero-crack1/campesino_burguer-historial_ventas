const { ProduccionSubReceta, SubReceta, DetalleSubReceta, MateriaPrima, sequelize } = require('../models');

const getAll = async () =>
  ProduccionSubReceta.findAll({
    include: [{ model: SubReceta, as: 'subReceta' }],
    order: [['fecha', 'DESC']],
  });

const getById = async (id) => {
  const p = await ProduccionSubReceta.findByPk(id, {
    include: [{ model: SubReceta, as: 'subReceta' }],
  });
  if (!p) throw { status: 404, message: 'Producción no encontrada' };
  return p;
};

const create = async ({ sub_receta_id, cantidad_lotes, fecha, notas }) => {
  const t = await sequelize.transaction();
  try {
    const subReceta = await SubReceta.findByPk(sub_receta_id, {
      include: [{ model: DetalleSubReceta, as: 'ingredientes' }],
    });
    if (!subReceta) throw { status: 404, message: 'SubReceta no encontrada' };

    for (const ing of subReceta.ingredientes) {
      const consumo = parseFloat(ing.cantidad) * cantidad_lotes;
      const mp = await MateriaPrima.findByPk(ing.materia_prima_id, { transaction: t });
      if (parseFloat(mp.stock_actual) < consumo) {
        throw { status: 400, message: `Stock insuficiente de "${mp.nombre}". Disponible: ${mp.stock_actual}, Requerido: ${consumo}` };
      }
      await MateriaPrima.decrement({ stock_actual: consumo }, { where: { id: mp.id }, transaction: t });
    }

    const producido = parseFloat(subReceta.cantidad_produccion) * cantidad_lotes;
    await SubReceta.increment({ stock_actual: producido }, { where: { id: sub_receta_id }, transaction: t });

    const produccion = await ProduccionSubReceta.create({ sub_receta_id, cantidad_lotes, fecha, notas }, { transaction: t });
    await t.commit();
    return getById(produccion.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

module.exports = { getAll, getById, create };
