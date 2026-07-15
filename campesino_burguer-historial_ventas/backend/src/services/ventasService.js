const { Venta, DetalleVenta, DetalleVentaComponente, Receta, ComboGrupo, ComboOpcion, Credito, sequelize } = require('../models');

const include = [{
  model: DetalleVenta,
  as: 'detalles',
  include: [
    { model: Receta, as: 'receta', attributes: ['id', 'nombre', 'unidad_produccion', 'precio_venta'] },
    {
      model: DetalleVentaComponente, as: 'componentes',
      include: [
        { model: Receta, as: 'receta', attributes: ['id', 'nombre'] },
        { model: ComboGrupo, as: 'grupo', attributes: ['id', 'nombre'] },
      ],
    },
  ],
}];

const getAll = async () =>
  Venta.findAll({ include, order: [['fecha', 'DESC'], ['created_at', 'DESC']] });

const getById = async (id) => {
  const v = await Venta.findByPk(id, { include });
  if (!v) throw { status: 404, message: 'Venta no encontrada' };
  return v;
};

// Resuelve, para una línea de venta de un combo, qué receta se eligió en cada grupo
// (aplicando el default configurado si el cajero no personalizó ese grupo) y valida
// que la selección respete las reglas min/max de cada grupo.
function resolverComponentesCombo(receta, componentesInput) {
  const resultado = [];
  for (const grupo of receta.comboGrupos) {
    let seleccion = componentesInput.filter((c) => Number(c.combo_grupo_id) === grupo.id);

    if (seleccion.length === 0) {
      const porDefecto = grupo.opciones.find((o) => o.es_default);
      if (porDefecto) seleccion = [{ receta_id: porDefecto.receta_id }];
    }

    if (seleccion.length < grupo.min_selecciones || seleccion.length > grupo.max_selecciones) {
      throw {
        status: 400,
        message: `El grupo "${grupo.nombre}" del combo "${receta.nombre}" requiere entre ${grupo.min_selecciones} y ${grupo.max_selecciones} opción(es), se recibieron ${seleccion.length}`,
      };
    }

    for (const elegido of seleccion) {
      const opcion = grupo.opciones.find((o) => o.receta_id === Number(elegido.receta_id));
      if (!opcion) {
        throw { status: 400, message: `Opción inválida para el grupo "${grupo.nombre}" del combo "${receta.nombre}"` };
      }
      resultado.push({ combo_grupo_id: grupo.id, receta_id: opcion.receta_id, precio_adicional: parseFloat(opcion.precio_adicional) });
    }
  }
  return resultado;
}

const create = async ({ fecha, cliente, detalles, metodoPago, valorRecibido, impoconsumoPocentaje = 0 }) => {
  const t = await sequelize.transaction();
  try {
    if (metodoPago === 'Crédito' && !String(cliente || '').trim()) {
      throw { status: 400, message: 'El cliente es requerido para una venta a crédito' };
    }

    // Carga cada receta vendida junto con su definición de combo (si aplica)
    const recetaIds = [...new Set(detalles.map((d) => d.receta_id))];
    const recetasVendidas = await Receta.findAll({
      where: { id: recetaIds },
      include: [{ model: ComboGrupo, as: 'comboGrupos', include: [{ model: ComboOpcion, as: 'opciones' }] }],
      transaction: t,
    });
    const recetaVendidaPorId = new Map(recetasVendidas.map((r) => [r.id, r]));
    for (const receta_id of recetaIds) {
      if (!recetaVendidaPorId.has(receta_id)) throw { status: 404, message: `Receta con id ${receta_id} no encontrada` };
    }

    // Resuelve componentes de combo y acumula, por receta que realmente tiene stock
    // propio (producto simple o componente elegido dentro de un combo), la cantidad total requerida.
    const cantidadPorReceta = new Map();
    const lineas = [];

    for (const d of detalles) {
      const receta = recetaVendidaPorId.get(d.receta_id);
      const cantidad = parseFloat(d.cantidad);

      if (receta.es_combo) {
        const componentesElegidos = resolverComponentesCombo(receta, d.componentes || []);
        for (const c of componentesElegidos) {
          cantidadPorReceta.set(c.receta_id, (cantidadPorReceta.get(c.receta_id) || 0) + cantidad);
        }
        lineas.push({ receta_id: d.receta_id, receta, cantidad, componentesElegidos });
      } else {
        cantidadPorReceta.set(d.receta_id, (cantidadPorReceta.get(d.receta_id) || 0) + cantidad);
        lineas.push({ receta_id: d.receta_id, receta, cantidad, componentesElegidos: null });
      }
    }

    // Bloquea y valida el stock de todas las recetas que se van a descontar
    const recetasStockPorId = new Map();
    for (const receta_id of cantidadPorReceta.keys()) {
      const r = await Receta.findByPk(receta_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!r) throw { status: 404, message: `Receta con id ${receta_id} no encontrada` };
      recetasStockPorId.set(receta_id, r);
    }

    const faltantes = [];
    for (const [receta_id, cantidadTotal] of cantidadPorReceta) {
      const r = recetasStockPorId.get(receta_id);
      const stockActual = parseFloat(r.stock_actual);
      if (stockActual < cantidadTotal) {
        faltantes.push(`"${r.nombre}" (disponible ${stockActual}, requerido ${cantidadTotal})`);
      }
    }
    if (faltantes.length > 0) {
      throw { status: 400, message: `Stock insuficiente: ${faltantes.join(', ')}` };
    }

    let subtotal = 0;
    const rows = [];

    for (const { receta_id, receta, cantidad, componentesElegidos } of lineas) {
      const precioAdicional = componentesElegidos
        ? componentesElegidos.reduce((s, c) => s + c.precio_adicional, 0)
        : 0;
      const precio_unitario = parseFloat(receta.precio_venta) + precioAdicional;
      const itemSubtotal = cantidad * precio_unitario;
      subtotal += itemSubtotal;
      rows.push({ receta_id, cantidad, precio_unitario, subtotal: itemSubtotal, componentesElegidos });
    }

    const impoPct = Math.min(100, Math.max(0, parseFloat(impoconsumoPocentaje) || 0));
    const impoconsumoValor = parseFloat((subtotal * impoPct / 100).toFixed(2));
    const total = parseFloat((subtotal + impoconsumoValor).toFixed(2));

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
        cliente: String(cliente || '').trim() || null,
        total,
        metodo_pago: metodoPago || null,
        descuento_aplicado: 0,
        valor_recibido: valorRecibidoFinal,
        cambio,
        impoconsumo_porcentaje: impoPct,
        impoconsumo_valor: impoconsumoValor,
      },
      { transaction: t }
    );

    for (const row of rows) {
      const detalleVenta = await DetalleVenta.create(
        { venta_id: venta.id, receta_id: row.receta_id, cantidad: row.cantidad, precio_unitario: row.precio_unitario, subtotal: row.subtotal },
        { transaction: t }
      );
      if (row.componentesElegidos) {
        for (const c of row.componentesElegidos) {
          await DetalleVentaComponente.create(
            { detalle_venta_id: detalleVenta.id, combo_grupo_id: c.combo_grupo_id, receta_id: c.receta_id, cantidad: row.cantidad },
            { transaction: t }
          );
        }
      }
    }

    for (const [receta_id, cantidadTotal] of cantidadPorReceta) {
      await Receta.decrement({ stock_actual: cantidadTotal }, { where: { id: receta_id }, transaction: t });
    }

    if (metodoPago === 'Crédito') {
      await Credito.create(
        { venta_id: venta.id, cliente: String(cliente).trim(), monto_total: total, monto_pagado: 0, estado: 'pendiente' },
        { transaction: t }
      );
    }

    await t.commit();
    return getById(venta.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const updateEstado = async (id, estado) => {
  const ESTADOS = ['activa', 'papelera'];
  if (!ESTADOS.includes(estado)) throw { status: 400, message: 'Estado inválido' };
  const v = await getById(id);
  await v.update({ estado });
  return getById(id);
};

const updateFactura = async (id, { numeroFactura, cliente, observaciones }) => {
  const v = await getById(id);
  const patch = {};
  if (numeroFactura !== undefined) patch.numero_factura = String(numeroFactura || '').trim() || null;
  if (cliente !== undefined) patch.cliente = String(cliente || '').trim() || null;
  if (observaciones !== undefined) patch.observaciones = String(observaciones || '').trim() || null;
  await v.update(patch);
  return getById(id);
};

const remove = async (id) => {
  const v = await getById(id);
  await v.destroy();
};

module.exports = { getAll, getById, create, updateEstado, updateFactura, remove };
