const { sequelize, Venta, DetalleVenta, Receta } = require('../models/index');
const { validarYDescontarStock } = require('./inventarioService');
const AppError = require('../utils/AppError');

function buildInclude() {
  return [
    {
      model: DetalleVenta,
      as: 'detalles',
      include: [{ model: Receta, as: 'receta', attributes: ['id', 'nombre', 'precio_venta'] }],
    },
  ];
}

async function getAll() {
  return Venta.findAll({
    include: buildInclude(),
    order: [['fecha', 'DESC'], ['createdAt', 'DESC']],
  });
}

async function getById(id) {
  const venta = await Venta.findByPk(id, { include: buildInclude() });
  if (!venta) throw new AppError('Venta no encontrada', 404);
  return venta;
}

async function create(data) {
  const t = await sequelize.transaction();
  try {
    const detallesCalc = [];

    for (const d of data.detalles) {
      const receta = await Receta.findByPk(d.receta_id, { transaction: t });
      if (!receta) throw new AppError(`Receta con id ${d.receta_id} no encontrada`, 404);

      const cantidad = Number(d.cantidad);
      const precio_unitario = Number(receta.precio_venta);
      const subtotal = cantidad * precio_unitario;

      detallesCalc.push({ receta, cantidad, precio_unitario, subtotal });
    }

    // Validar y descontar stock de cada receta
    for (const { receta, cantidad } of detallesCalc) {
      await validarYDescontarStock(receta, cantidad, t);
    }

    const total = detallesCalc.reduce((sum, d) => sum + d.subtotal, 0);

    const venta = await Venta.create(
      {
        fecha: data.fecha,
        cliente: data.cliente || null,
        total,
      },
      { transaction: t }
    );

    for (const { receta, cantidad, precio_unitario, subtotal } of detallesCalc) {
      await DetalleVenta.create(
        { venta_id: venta.id, receta_id: receta.id, cantidad, precio_unitario, subtotal },
        { transaction: t }
      );
    }

    await t.commit();
    return getById(venta.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

module.exports = { getAll, getById, create };
