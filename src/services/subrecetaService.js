const { sequelize, SubReceta, SubRecetaMateriaPrima, MateriaPrima, Produccion } = require('../models/index');
const { validarYDescontarStock } = require('./inventarioService');
const AppError = require('../utils/AppError');

function buildInclude() {
  return [
    {
      model: MateriaPrima,
      as: 'ingredientes',
      attributes: ['id', 'nombre', 'unidad_medida', 'stock_actual'],
      through: { attributes: ['id', 'cantidad'] },
    },
  ];
}

async function getAll() {
  return SubReceta.findAll({
    include: buildInclude(),
    order: [['nombre', 'ASC']],
  });
}

async function getById(id) {
  const subreceta = await SubReceta.findByPk(id, { include: buildInclude() });
  if (!subreceta) throw new AppError('Subreceta no encontrada', 404);
  return subreceta;
}

async function create(data) {
  const t = await sequelize.transaction();
  try {
    const subreceta = await SubReceta.create(
      {
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        unidad_medida: data.unidad_medida,
        stock_actual: Number(data.stock_actual || 0),
        costo_produccion: Number(data.costo_produccion || 0),
      },
      { transaction: t }
    );

    await _guardarIngredientes(subreceta.id, data.ingredientes, t);

    await t.commit();
    return getById(subreceta.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function update(id, data) {
  const t = await sequelize.transaction();
  try {
    const subreceta = await SubReceta.findByPk(id, { transaction: t });
    if (!subreceta) throw new AppError('Subreceta no encontrada', 404);

    const camposActualizar = {};
    if (data.nombre !== undefined) camposActualizar.nombre = data.nombre;
    if (data.descripcion !== undefined) camposActualizar.descripcion = data.descripcion;
    if (data.unidad_medida !== undefined) camposActualizar.unidad_medida = data.unidad_medida;
    if (data.stock_actual !== undefined) camposActualizar.stock_actual = Number(data.stock_actual);
    if (data.costo_produccion !== undefined) camposActualizar.costo_produccion = Number(data.costo_produccion);

    await subreceta.update(camposActualizar, { transaction: t });

    if (Array.isArray(data.ingredientes)) {
      await SubRecetaMateriaPrima.destroy({ where: { subreceta_id: id }, transaction: t });
      await _guardarIngredientes(id, data.ingredientes, t);
    }

    await t.commit();
    return getById(id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function remove(id) {
  const subreceta = await getById(id);
  await subreceta.destroy();
}

async function producir(id, cantidadProducir) {
  const t = await sequelize.transaction();
  try {
    const subreceta = await SubReceta.findByPk(id, { include: buildInclude(), transaction: t });
    if (!subreceta) throw new AppError('Subreceta no encontrada', 404);

    if (!subreceta.ingredientes || subreceta.ingredientes.length === 0) {
      throw new AppError('La subreceta no tiene ingredientes definidos', 400);
    }

    let costoEstimado = 0;

    for (const ingrediente of subreceta.ingredientes) {
      const cantidadNecesaria = Number(ingrediente.SubRecetaMateriaPrima.cantidad) * Number(cantidadProducir);
      const mp = await MateriaPrima.findByPk(ingrediente.id, { transaction: t });
      costoEstimado += cantidadNecesaria * Number(mp.costo_unitario);
      await validarYDescontarStock(mp, cantidadNecesaria, t);
    }

    await subreceta.increment('stock_actual', { by: Number(cantidadProducir), transaction: t });

    await Produccion.create(
      {
        tipo: 'subreceta',
        entidad_id: subreceta.id,
        entidad_nombre: subreceta.nombre,
        cantidad_producida: Number(cantidadProducir),
        costo_estimado: Number(costoEstimado.toFixed(2)),
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

async function _guardarIngredientes(subrecetaId, ingredientes, transaction) {
  for (const ing of ingredientes) {
    const mp = await MateriaPrima.findByPk(ing.materia_prima_id, { transaction });
    if (!mp) throw new AppError(`Materia prima con id ${ing.materia_prima_id} no encontrada`, 404);

    await SubRecetaMateriaPrima.create(
      { subreceta_id: subrecetaId, materia_prima_id: ing.materia_prima_id, cantidad: Number(ing.cantidad) },
      { transaction }
    );
  }
}

module.exports = { getAll, getById, create, update, remove, producir };
