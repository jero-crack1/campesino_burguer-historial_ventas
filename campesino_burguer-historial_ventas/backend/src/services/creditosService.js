const { Credito, Abono, Venta, sequelize } = require('../models');

const include = [
  { model: Abono, as: 'abonos' },
  { model: Venta, as: 'venta', attributes: ['id', 'fecha', 'total'] },
];

const getAll = async (estado) => {
  const where = {};
  if (estado && estado !== 'all') where.estado = estado;
  return Credito.findAll({ where, include, order: [['created_at', 'DESC']] });
};

const getById = async (id) => {
  const c = await Credito.findByPk(id, { include });
  if (!c) throw { status: 404, message: 'Crédito no encontrado' };
  return c;
};

const abonar = async (id, { monto, fecha, notas }) => {
  const t = await sequelize.transaction();
  try {
    const credito = await Credito.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!credito) throw { status: 404, message: 'Crédito no encontrado' };
    if (credito.estado === 'pagado') throw { status: 400, message: 'Este crédito ya está pagado' };

    const montoAbono = parseFloat(monto);
    const saldo = parseFloat((parseFloat(credito.monto_total) - parseFloat(credito.monto_pagado)).toFixed(2));

    if (montoAbono <= 0) throw { status: 400, message: 'El monto debe ser mayor a 0' };
    if (montoAbono > saldo + 0.01) throw { status: 400, message: `El abono supera el saldo pendiente de $${saldo}` };

    await Abono.create({ credito_id: id, monto: montoAbono, fecha, notas: notas || null }, { transaction: t });

    const nuevoPagado = parseFloat((parseFloat(credito.monto_pagado) + montoAbono).toFixed(2));
    const nuevoEstado = nuevoPagado >= parseFloat(credito.monto_total) - 0.01 ? 'pagado' : 'pendiente';
    await credito.update({ monto_pagado: nuevoPagado, estado: nuevoEstado }, { transaction: t });

    await t.commit();
    return getById(id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const pagarCompleto = async (id, fecha) => {
  const t = await sequelize.transaction();
  try {
    const credito = await Credito.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!credito) throw { status: 404, message: 'Crédito no encontrado' };
    if (credito.estado === 'pagado') throw { status: 400, message: 'Este crédito ya está pagado' };

    const saldo = parseFloat((parseFloat(credito.monto_total) - parseFloat(credito.monto_pagado)).toFixed(2));
    if (saldo > 0) {
      await Abono.create({ credito_id: id, monto: saldo, fecha, notas: 'Pago completo' }, { transaction: t });
    }
    await credito.update({ monto_pagado: credito.monto_total, estado: 'pagado' }, { transaction: t });

    await t.commit();
    return getById(id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

module.exports = { getAll, getById, abonar, pagarCompleto };
