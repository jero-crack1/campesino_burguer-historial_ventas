const { Op, QueryTypes } = require('sequelize');
const { sequelize, MateriaPrima, Venta, DetalleVenta, Receta } = require('../models/index');

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function inicioMesActual() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function resolverPeriodo(desde, hasta) {
  return {
    desde: desde || inicioMesActual(),
    hasta: hasta || hoy(),
  };
}

async function stockCritico() {
  const items = await MateriaPrima.findAll({
    where: sequelize.literal('stock_actual < stock_minimo'),
    attributes: ['id', 'nombre', 'unidad_medida', 'stock_actual', 'stock_minimo', 'costo_unitario'],
    order: [[sequelize.literal('stock_minimo - stock_actual'), 'DESC']],
  });

  return {
    total: items.length,
    items: items.map(mp => ({
      ...mp.toJSON(),
      deficit: Number((Number(mp.stock_minimo) - Number(mp.stock_actual)).toFixed(3)),
    })),
  };
}

async function ventasPorPeriodo(desde, hasta) {
  const periodo = resolverPeriodo(desde, hasta);

  const ventas = await Venta.findAll({
    where: { fecha: { [Op.between]: [periodo.desde, periodo.hasta] } },
    include: [
      {
        model: DetalleVenta,
        as: 'detalles',
        include: [{ model: Receta, as: 'receta', attributes: ['id', 'nombre'] }],
      },
    ],
    order: [['fecha', 'DESC'], ['createdAt', 'DESC']],
  });

  const ingresosTotales = ventas.reduce((sum, v) => sum + Number(v.total), 0);
  const totalVentas = ventas.length;

  return {
    periodo,
    resumen: {
      total_ventas: totalVentas,
      ingresos_totales: Number(ingresosTotales.toFixed(2)),
      promedio_por_venta: totalVentas > 0
        ? Number((ingresosTotales / totalVentas).toFixed(2))
        : 0,
    },
    ventas,
  };
}

async function productosTop(desde, hasta, limite = 10) {
  const periodo = resolverPeriodo(desde, hasta);

  const rows = await sequelize.query(
    `SELECT
       dv.receta_id,
       r.nombre,
       r.precio_venta,
       SUM(dv.cantidad)          AS cantidad_vendida,
       SUM(dv.subtotal)          AS ingresos_generados,
       COUNT(DISTINCT dv.venta_id) AS num_ventas
     FROM detalle_ventas dv
     JOIN ventas  v ON v.id = dv.venta_id
     JOIN recetas r ON r.id = dv.receta_id
     WHERE v.fecha BETWEEN :desde AND :hasta
     GROUP BY dv.receta_id, r.nombre, r.precio_venta
     ORDER BY SUM(dv.cantidad) DESC
     LIMIT :limite`,
    {
      replacements: { desde: periodo.desde, hasta: periodo.hasta, limite: Number(limite) || 10 },
      type: QueryTypes.SELECT,
    }
  );

  return {
    periodo,
    total: rows.length,
    productos: rows.map((r, i) => ({
      posicion: i + 1,
      receta_id: r.receta_id,
      nombre: r.nombre,
      precio_venta: Number(r.precio_venta),
      cantidad_vendida: Number(r.cantidad_vendida),
      ingresos_generados: Number(r.ingresos_generados),
      num_ventas: Number(r.num_ventas),
    })),
  };
}

async function produccionPorPeriodo(desde, hasta) {
  const periodo = resolverPeriodo(desde, hasta);

  const rows = await sequelize.query(
    `SELECT
       tipo,
       entidad_id,
       entidad_nombre,
       SUM(cantidad_producida) AS total_producido,
       SUM(costo_estimado)     AS costo_total,
       COUNT(id)               AS num_producciones
     FROM producciones
     WHERE fecha BETWEEN :desde AND :hasta
     GROUP BY tipo, entidad_id, entidad_nombre
     ORDER BY tipo ASC, SUM(cantidad_producida) DESC`,
    {
      replacements: { desde: periodo.desde, hasta: periodo.hasta },
      type: QueryTypes.SELECT,
    }
  );

  const mapear = r => ({
    entidad_id: r.entidad_id,
    nombre: r.entidad_nombre,
    total_producido: Number(r.total_producido),
    costo_total: r.costo_total !== null ? Number(r.costo_total) : null,
    num_producciones: Number(r.num_producciones),
  });

  return {
    periodo,
    subrecetas: rows.filter(r => r.tipo === 'subreceta').map(mapear),
    recetas:    rows.filter(r => r.tipo === 'receta').map(mapear),
  };
}

async function rentabilidad() {
  const recetas = await Receta.findAll({
    attributes: ['id', 'nombre', 'precio_venta', 'costo_produccion', 'unidad_medida'],
    order: [['nombre', 'ASC']],
  });

  const items = recetas.map(r => {
    const precio = Number(r.precio_venta);
    const costo  = Number(r.costo_produccion);
    const margen = precio - costo;
    return {
      id: r.id,
      nombre: r.nombre,
      precio_venta: precio,
      costo_produccion: costo,
      margen: Number(margen.toFixed(2)),
      margen_pct: precio > 0 ? Number(((margen / precio) * 100).toFixed(2)) : 0,
    };
  });

  const promedio = items.length > 0
    ? Number((items.reduce((s, i) => s + i.margen_pct, 0) / items.length).toFixed(2))
    : 0;

  return { promedio_margen_pct: promedio, recetas: items };
}

async function dashboard() {
  const hoyStr       = hoy();
  const inicioMes    = inicioMesActual();

  const [critico, ventasHoy, ventasMes, top, rent] = await Promise.all([
    stockCritico(),
    ventasPorPeriodo(hoyStr, hoyStr),
    ventasPorPeriodo(inicioMes, hoyStr),
    productosTop(inicioMes, hoyStr, 5),
    rentabilidad(),
  ]);

  return {
    stock_critico:            { total: critico.total, items: critico.items },
    ventas_hoy:               ventasHoy.resumen,
    ventas_mes:               ventasMes.resumen,
    productos_top:            top.productos,
    rentabilidad_promedio_pct: rent.promedio_margen_pct,
  };
}

module.exports = {
  stockCritico,
  ventasPorPeriodo,
  productosTop,
  produccionPorPeriodo,
  rentabilidad,
  dashboard,
};
