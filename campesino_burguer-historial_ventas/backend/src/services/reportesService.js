const { Venta, DetalleVenta, Receta, MateriaPrima, Credito, Abono, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

const inicioMes = () => {
  const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
};
const hoy = () => new Date().toISOString().slice(0, 10);

// Las ventas a crédito generan una cuenta por cobrar, no un ingreso del período.
// Las ventas anuladas no representan un ingreso real (se corrigió un error de registro).
const ventasCobradasWhere = (desde, hasta) => ({
  fecha: { [Op.between]: [desde, hasta] },
  estado: { [Op.ne]: 'anulada' },
  [Op.or]: [
    { metodo_pago: { [Op.ne]: 'Crédito' } },
    { metodo_pago: { [Op.is]: null } },
  ],
});

// Pagos (abonos o pago completo) de créditos cobrados dentro del período, por FECHA DE PAGO
// — no por la fecha en que se registró la venta a crédito original.
const cobrosCarteraDelPeriodo = async (desde, hasta) => {
  const abonos = await Abono.findAll({
    where: { fecha: { [Op.between]: [desde, hasta] } },
    include: [{ model: Credito, as: 'credito', attributes: ['id', 'cliente', 'venta_id'] }],
    order: [['fecha', 'DESC']],
  });
  const total = abonos.reduce((s, a) => s + parseFloat(a.monto), 0);
  return { total: +total.toFixed(2), abonos };
};

const ventasPorPeriodo = async (desde, hasta) => {
  const d = desde || inicioMes();
  const h = hasta || hoy();

  const ventas = await Venta.findAll({
    where: ventasCobradasWhere(d, h),
    include: [
      {
        model: DetalleVenta, as: 'detalles',
        include: [{ model: Receta, as: 'receta', attributes: ['id', 'nombre', 'precio_venta', 'costo_produccion'] }],
      },
      { model: Credito, as: 'credito', attributes: ['id', 'monto_total'] },
    ],
    order: [['fecha', 'DESC']],
  });

  // Si la venta quedó parcial o totalmente a crédito, esa porción no es un ingreso
  // cobrado en este período — solo cuenta lo que realmente se recibió al momento de la venta.
  const total_ventas = ventas.length;
  const ingresos_totales = ventas.reduce((s, v) => {
    const deuda = parseFloat(v.credito?.monto_total || 0);
    return s + (parseFloat(v.total) - deuda);
  }, 0);
  const promedio_por_venta = total_ventas ? ingresos_totales / total_ventas : 0;

  const costo_total = ventas.reduce((sum, v) =>
    sum + v.detalles.reduce((s2, d) =>
      s2 + parseFloat(d.receta?.costo_produccion || 0) * parseFloat(d.cantidad), 0), 0);

  const utilidad_total = ingresos_totales - costo_total;

  const cartera = await cobrosCarteraDelPeriodo(d, h);

  return {
    periodo: { desde: d, hasta: h },
    resumen: {
      total_ventas,
      ingresos_totales: +ingresos_totales.toFixed(2),
      promedio_por_venta: +promedio_por_venta.toFixed(2),
      costo_total: +costo_total.toFixed(2),
      utilidad_total: +utilidad_total.toFixed(2),
      cobros_cartera: cartera.total,
      total_recibido: +(ingresos_totales + cartera.total).toFixed(2),
    },
    ventas,
    abonosPeriodo: cartera.abonos,
  };
};

const productosTop = async (desde, hasta, limite = 10) => {
  const d = desde || inicioMes();
  const h = hasta || hoy();

  const rows = await DetalleVenta.findAll({
    attributes: [
      'receta_id',
      [fn('SUM', col('DetalleVenta.cantidad')), 'cantidad_vendida'],
      [fn('SUM', col('DetalleVenta.subtotal')), 'ingresos_generados'],
      [fn('COUNT', fn('DISTINCT', col('venta_id'))), 'num_ventas'],
    ],
    include: [{
      model: Receta, as: 'receta', attributes: ['nombre', 'precio_venta', 'costo_produccion'],
      required: true,
    }, {
      model: Venta, as: 'venta', attributes: [],
      where: ventasCobradasWhere(d, h),
      required: true,
    }],
    group: ['receta_id', 'receta.id'],
    order: [[literal('"cantidad_vendida"'), 'DESC']],
    limit: parseInt(limite),
  });

  return rows.map((r, i) => {
    const cantidad_vendida = parseFloat(r.dataValues.cantidad_vendida);
    const ingresos_generados = parseFloat(r.dataValues.ingresos_generados);
    const costo_produccion = parseFloat(r.receta.costo_produccion || 0);
    const costo_total = +(cantidad_vendida * costo_produccion).toFixed(2);
    const utilidad = +(ingresos_generados - costo_total).toFixed(2);
    const margen_pct = ingresos_generados > 0 ? +((utilidad / ingresos_generados) * 100).toFixed(1) : 0;

    return {
      posicion: i + 1,
      receta_id: r.receta_id,
      nombre: r.receta.nombre,
      precio_venta: parseFloat(r.receta.precio_venta),
      costo_produccion,
      cantidad_vendida,
      ingresos_generados: +ingresos_generados.toFixed(2),
      costo_total,
      utilidad,
      margen_pct,
      num_ventas: parseInt(r.dataValues.num_ventas),
    };
  });
};

const rentabilidad = async () => {
  const recetas = await Receta.findAll({ attributes: ['id', 'nombre', 'precio_venta', 'costo_produccion', 'unidad_produccion'] });
  const items = recetas.map((r) => {
    const precio = parseFloat(r.precio_venta);
    const costo = parseFloat(r.costo_produccion);
    const margen = precio - costo;
    const margen_pct = precio > 0 ? (margen / precio) * 100 : 0;
    return { id: r.id, nombre: r.nombre, unidad_produccion: r.unidad_produccion, precio_venta: precio, costo_produccion: costo, margen: +margen.toFixed(2), margen_pct: +margen_pct.toFixed(1) };
  });
  const promedio_margen = items.length ? items.reduce((s, i) => s + i.margen_pct, 0) / items.length : 0;
  return { promedio_margen: +promedio_margen.toFixed(1), recetas: items };
};

const stockCritico = async () => {
  const [mps, recetas] = await Promise.all([
    MateriaPrima.findAll({
      where: { [Op.and]: [sequelize.where(col('stock_actual'), { [Op.lte]: col('stock_minimo') })] },
      attributes: ['id', 'nombre', 'unidad_medida', 'stock_actual', 'stock_minimo'],
      order: [['stock_actual', 'ASC']],
    }),
    Receta.findAll({
      where: {
        es_combo: false,
        [Op.and]: [sequelize.where(col('stock_actual'), { [Op.lte]: col('stock_minimo') })],
      },
      attributes: ['id', 'nombre', 'unidad_produccion', 'stock_actual', 'stock_minimo'],
      order: [['stock_actual', 'ASC']],
    }),
  ]);

  const alertasMp = mps.map((m) => ({
    tipo: 'materia_prima',
    id: m.id,
    nombre: m.nombre,
    unidad: m.unidad_medida,
    stock_actual: parseFloat(m.stock_actual),
    stock_minimo: parseFloat(m.stock_minimo),
    deficit: +(parseFloat(m.stock_minimo) - parseFloat(m.stock_actual)).toFixed(3),
  }));
  const alertasReceta = recetas.map((r) => ({
    tipo: 'receta',
    id: r.id,
    nombre: r.nombre,
    unidad: r.unidad_produccion,
    stock_actual: parseFloat(r.stock_actual),
    stock_minimo: parseFloat(r.stock_minimo),
    deficit: +(parseFloat(r.stock_minimo) - parseFloat(r.stock_actual)).toFixed(3),
  }));

  return [...alertasMp, ...alertasReceta].sort((a, b) => b.deficit - a.deficit);
};

const dashboard = async () => {
  const [resumenHoy, resumenMes, top5, rent, critico] = await Promise.all([
    ventasPorPeriodo(hoy(), hoy()),
    ventasPorPeriodo(inicioMes(), hoy()),
    productosTop(inicioMes(), hoy(), 5),
    rentabilidad(),
    stockCritico(),
  ]);
  return { resumenHoy: resumenHoy.resumen, resumenMes: resumenMes.resumen, top5, rentabilidad: rent, stockCritico: critico };
};

module.exports = { ventasPorPeriodo, productosTop, rentabilidad, stockCritico, dashboard };
