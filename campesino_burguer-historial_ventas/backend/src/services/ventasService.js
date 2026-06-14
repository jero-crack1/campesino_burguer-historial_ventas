const { Venta, DetalleVenta, Receta, sequelize } = require('../models');

const include = [{
  model: DetalleVenta,
  as: 'detalles',
  include: [{ model: Receta, as: 'receta', attributes: ['id', 'nombre', 'unidad_produccion', 'precio_venta'] }],
}];

const getAll = async () =>
  Venta.findAll({ include, order: [['fecha', 'DESC'], ['created_at', 'DESC']] });

const getById = async (id) => {
  const v = await Venta.findByPk(id, { include });
  if (!v) throw { status: 404, message: 'Venta no encontrada' };
  return v;
};

const create = async ({ fecha, cliente, detalles, metodoPago, descuentoAplicado = 0, valorRecibido }) => {
  const t = await sequelize.transaction();
  try {
    let subtotal = 0;
    const rows = [];

    for (const d of detalles) {
      const receta = await Receta.findByPk(d.receta_id, { transaction: t });
      if (!receta) throw { status: 404, message: `Receta con id ${d.receta_id} no encontrada` };

      const cantidad = parseFloat(d.cantidad);
      const stockActual = parseFloat(receta.stock_actual);

      if (stockActual < cantidad) {
        throw {
          status: 400,
          message: `Stock insuficiente para "${receta.nombre}": disponible ${stockActual}, requerido ${cantidad}`,
        };
      }

      const precio_unitario = parseFloat(receta.precio_venta);
      const itemSubtotal = cantidad * precio_unitario;
      subtotal += itemSubtotal;
      rows.push({ receta_id: d.receta_id, cantidad, precio_unitario, subtotal: itemSubtotal, receta });
    }

    const descuento = Math.max(0, parseFloat(descuentoAplicado) || 0);
    const total = Math.max(0, subtotal - descuento);

    let cambio = 0;
    let valorRecibidoFinal = null;

    if (metodoPago === 'Efectivo') {
      const recibido = parseFloat(valorRecibido) || 0;
      if (recibido < total) {
        throw { status: 400, message: `Efectivo insuficiente: recibido $${recibido}, total $${total}` };
      }
      valorRecibidoFinal = recibido;
      cambio = parseFloat((recibido - total).toFixed(2));
    }

    const venta = await Venta.create(
      {
        fecha,
        cliente: cliente || null,
        total,
        metodo_pago: metodoPago || null,
        descuento_aplicado: descuento,
        valor_recibido: valorRecibidoFinal,
        cambio,
      },
      { transaction: t }
    );

    for (const row of rows) {
      await DetalleVenta.create(
        { venta_id: venta.id, receta_id: row.receta_id, cantidad: row.cantidad, precio_unitario: row.precio_unitario, subtotal: row.subtotal },
        { transaction: t }
      );
      await Receta.decrement({ stock_actual: row.cantidad }, { where: { id: row.receta_id }, transaction: t });
    }

    await t.commit();
    return getById(venta.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const remove = async (id) => {
  const v = await getById(id);
  await v.destroy();
};

module.exports = { getAll, getById, create, remove };
