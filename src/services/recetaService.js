const { sequelize, Receta, RecetaSubReceta, RecetaMateriaPrima, SubReceta, MateriaPrima, Produccion } = require('../models/index');
const { validarYDescontarStock } = require('./inventarioService');
const AppError = require('../utils/AppError');

function buildInclude() {
  return [
    {
      model: SubReceta,
      as: 'subrecetas',
      attributes: ['id', 'nombre', 'unidad_medida', 'stock_actual'],
      through: { attributes: ['id', 'cantidad'] },
    },
    {
      model: MateriaPrima,
      as: 'materiasPrimas',
      attributes: ['id', 'nombre', 'unidad_medida', 'stock_actual'],
      through: { attributes: ['id', 'cantidad'] },
    },
  ];
}

async function getAll() {
  return Receta.findAll({
    include: buildInclude(),
    order: [['nombre', 'ASC']],
  });
}

async function getById(id) {
  const receta = await Receta.findByPk(id, { include: buildInclude() });
  if (!receta) throw new AppError('Receta no encontrada', 404);
  return receta;
}

async function create(data) {
  const t = await sequelize.transaction();
  try {
    const receta = await Receta.create(
      {
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        precio_venta: Number(data.precio_venta),
        unidad_medida: data.unidad_medida,
        stock_actual: Number(data.stock_actual || 0),
        costo_produccion: Number(data.costo_produccion || 0),
      },
      { transaction: t }
    );

    await _guardarComponentes(receta.id, data.subrecetas, data.materias_primas, t);

    await t.commit();
    return getById(receta.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function update(id, data) {
  const t = await sequelize.transaction();
  try {
    const receta = await Receta.findByPk(id, { transaction: t });
    if (!receta) throw new AppError('Receta no encontrada', 404);

    const campos = {};
    if (data.nombre !== undefined) campos.nombre = data.nombre;
    if (data.descripcion !== undefined) campos.descripcion = data.descripcion;
    if (data.precio_venta !== undefined) campos.precio_venta = Number(data.precio_venta);
    if (data.unidad_medida !== undefined) campos.unidad_medida = data.unidad_medida;
    if (data.stock_actual !== undefined) campos.stock_actual = Number(data.stock_actual);
    if (data.costo_produccion !== undefined) campos.costo_produccion = Number(data.costo_produccion);

    await receta.update(campos, { transaction: t });

    const actualizaComponentes = Array.isArray(data.subrecetas) || Array.isArray(data.materias_primas);
    if (actualizaComponentes) {
      await RecetaSubReceta.destroy({ where: { receta_id: id }, transaction: t });
      await RecetaMateriaPrima.destroy({ where: { receta_id: id }, transaction: t });
      await _guardarComponentes(id, data.subrecetas || [], data.materias_primas || [], t);
    }

    await t.commit();
    return getById(id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function remove(id) {
  const receta = await getById(id);
  await receta.destroy();
}

async function producir(id, cantidadProducir) {
  const t = await sequelize.transaction();
  try {
    const receta = await Receta.findByPk(id, { include: buildInclude(), transaction: t });
    if (!receta) throw new AppError('Receta no encontrada', 404);

    const sinComponentes = receta.subrecetas.length === 0 && receta.materiasPrimas.length === 0;
    if (sinComponentes) throw new AppError('La receta no tiene componentes definidos', 400);

    // Descontar subrecetas
    for (const subreceta of receta.subrecetas) {
      const cantidadNecesaria = Number(subreceta.RecetaSubReceta.cantidad) * Number(cantidadProducir);
      const sr = await SubReceta.findByPk(subreceta.id, { transaction: t });
      await validarYDescontarStock(sr, cantidadNecesaria, t);
    }

    // Descontar materias primas directas
    for (const mp of receta.materiasPrimas) {
      const cantidadNecesaria = Number(mp.RecetaMateriaPrima.cantidad) * Number(cantidadProducir);
      const materiaPrima = await MateriaPrima.findByPk(mp.id, { transaction: t });
      await validarYDescontarStock(materiaPrima, cantidadNecesaria, t);
    }

    await receta.increment('stock_actual', { by: Number(cantidadProducir), transaction: t });

    await Produccion.create(
      {
        tipo: 'receta',
        entidad_id: receta.id,
        entidad_nombre: receta.nombre,
        cantidad_producida: Number(cantidadProducir),
        costo_estimado: Number((Number(receta.costo_produccion) * Number(cantidadProducir)).toFixed(2)),
        fecha: new Date().toISOString().slice(0, 10),
      },
      { transaction: t }
    );

    await t.commit();
    return getById(id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function _guardarComponentes(recetaId, subrecetas = [], materiasPrimas = [], transaction) {
  for (const s of subrecetas) {
    const sr = await SubReceta.findByPk(s.subreceta_id, { transaction });
    if (!sr) throw new AppError(`Subreceta con id ${s.subreceta_id} no encontrada`, 404);
    await RecetaSubReceta.create(
      { receta_id: recetaId, subreceta_id: s.subreceta_id, cantidad: Number(s.cantidad) },
      { transaction }
    );
  }

  for (const m of materiasPrimas) {
    const mp = await MateriaPrima.findByPk(m.materia_prima_id, { transaction });
    if (!mp) throw new AppError(`Materia prima con id ${m.materia_prima_id} no encontrada`, 404);
    await RecetaMateriaPrima.create(
      { receta_id: recetaId, materia_prima_id: m.materia_prima_id, cantidad: Number(m.cantidad) },
      { transaction }
    );
  }
}

module.exports = { getAll, getById, create, update, remove, producir };
