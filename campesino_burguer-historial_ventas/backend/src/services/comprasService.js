const { Compra, DetalleCompra, MateriaPrima, sequelize } = require('../models');

const include = [{ model: DetalleCompra, as: 'detalles', include: [{ model: MateriaPrima, as: 'materiaPrima' }] }];

const getAll = async () =>
  Compra.findAll({ include, order: [['fecha', 'DESC']] });

const getById = async (id) => {
  const c = await Compra.findByPk(id, { include });
  if (!c) throw { status: 404, message: 'Compra no encontrada' };
  return c;
};

const create = async ({ proveedor, fecha, notas, detalles }) => {
  const t = await sequelize.transaction();
  try {
    let total = 0;
    const rows = detalles.map((d) => {
      const subtotal = parseFloat(d.cantidad) * parseFloat(d.precio_unitario);
      total += subtotal;
      return { ...d, subtotal };
    });

    const compra = await Compra.create({ proveedor, fecha, notas, total }, { transaction: t });

    for (const row of rows) {
      await DetalleCompra.create({ ...row, compra_id: compra.id }, { transaction: t });
      await MateriaPrima.increment(
        { stock_actual: parseFloat(row.cantidad) },
        { where: { id: row.materia_prima_id }, transaction: t }
      );
    }

    await t.commit();
    return getById(compra.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const remove = async (id) => {
  const c = await getById(id);
  await c.destroy();
};

module.exports = { getAll, getById, create, remove };
