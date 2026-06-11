const { sequelize, Compra, DetalleCompra, MateriaPrima } = require('../models/index');
const { incrementarStock } = require('./inventarioService');
const AppError = require('../utils/AppError');

function buildInclude() {
  return [
    {
      model: DetalleCompra,
      as: 'detalles',
      include: [{ model: MateriaPrima, as: 'materiaPrima', attributes: ['id', 'nombre', 'unidad_medida'] }],
    },
  ];
}

async function getAll() {
  return Compra.findAll({
    include: buildInclude(),
    order: [['fecha', 'DESC']],
  });
}

async function getById(id) {
  const compra = await Compra.findByPk(id, { include: buildInclude() });
  if (!compra) throw new AppError('Compra no encontrada', 404);
  return compra;
}

async function create(data) {
  const t = await sequelize.transaction();

  try {
    const detallesCalc = data.detalles.map((d) => ({
      materia_prima_id: Number(d.materia_prima_id),
      cantidad: Number(d.cantidad),
      precio_unitario: Number(d.precio_unitario),
      subtotal: Number(d.cantidad) * Number(d.precio_unitario),
    }));

    const total = detallesCalc.reduce((sum, d) => sum + d.subtotal, 0);

    const compra = await Compra.create(
      {
        fecha: data.fecha,
        observaciones: data.observaciones || null,
        total,
      },
      { transaction: t }
    );

    for (const detalle of detallesCalc) {
      const mp = await MateriaPrima.findByPk(detalle.materia_prima_id, { transaction: t });
      if (!mp) {
        throw new AppError(`Materia prima con id ${detalle.materia_prima_id} no encontrada`, 404);
      }

      await DetalleCompra.create({ ...detalle, compra_id: compra.id }, { transaction: t });
      await incrementarStock(mp, detalle.cantidad, t);
    }

    await t.commit();
    return getById(compra.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

module.exports = { getAll, getById, create };
