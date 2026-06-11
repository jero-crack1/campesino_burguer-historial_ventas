const { ProduccionReceta, Receta, DetalleReceta, MateriaPrima, SubReceta, sequelize } = require('../models');

const getAll = async () =>
  ProduccionReceta.findAll({
    include: [{ model: Receta, as: 'receta' }],
    order: [['fecha', 'DESC']],
  });

const getById = async (id) => {
  const p = await ProduccionReceta.findByPk(id, {
    include: [{ model: Receta, as: 'receta' }],
  });
  if (!p) throw { status: 404, message: 'Producción no encontrada' };
  return p;
};

const create = async ({ receta_id, cantidad_lotes, fecha, notas }) => {
  const t = await sequelize.transaction();
  try {
    const receta = await Receta.findByPk(receta_id, {
      include: [{ model: DetalleReceta, as: 'ingredientes' }],
    });
    if (!receta) throw { status: 404, message: 'Receta no encontrada' };

    for (const ing of receta.ingredientes) {
      const consumo = parseFloat(ing.cantidad) * cantidad_lotes;
      if (ing.tipo === 'materia_prima') {
        const mp = await MateriaPrima.findByPk(ing.materia_prima_id, { transaction: t });
        if (parseFloat(mp.stock_actual) < consumo) {
          throw { status: 400, message: `Stock insuficiente de materia prima "${mp.nombre}". Disponible: ${mp.stock_actual}, Requerido: ${consumo}` };
        }
        await MateriaPrima.decrement({ stock_actual: consumo }, { where: { id: mp.id }, transaction: t });
      } else {
        const sr = await SubReceta.findByPk(ing.sub_receta_id, { transaction: t });
        if (parseFloat(sr.stock_actual) < consumo) {
          throw { status: 400, message: `Stock insuficiente de subreceta "${sr.nombre}". Disponible: ${sr.stock_actual}, Requerido: ${consumo}` };
        }
        await SubReceta.decrement({ stock_actual: consumo }, { where: { id: sr.id }, transaction: t });
      }
    }

    const producido = parseFloat(receta.cantidad_produccion) * cantidad_lotes;
    await Receta.increment({ stock_actual: producido }, { where: { id: receta_id }, transaction: t });

    const produccion = await ProduccionReceta.create({ receta_id, cantidad_lotes, fecha, notas }, { transaction: t });
    await t.commit();
    return getById(produccion.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

module.exports = { getAll, getById, create };
