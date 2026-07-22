const { Receta, DetalleReceta, MateriaPrima, SubReceta, ComboGrupo, ComboOpcion, sequelize } = require('../models');

const include = [
  {
    model: DetalleReceta, as: 'ingredientes',
    include: [
      { model: MateriaPrima, as: 'materiaPrima' },
      { model: SubReceta, as: 'subReceta' },
    ],
  },
  {
    model: ComboGrupo, as: 'comboGrupos',
    separate: true,
    order: [['orden', 'ASC']],
    include: [{
      model: ComboOpcion, as: 'opciones',
      separate: true,
      order: [['orden', 'ASC']],
      include: [{ model: Receta, as: 'receta', attributes: ['id', 'nombre', 'precio_venta', 'stock_actual'] }],
    }],
  },
];

const getAll = async () =>
  Receta.findAll({ include, order: [['nombre', 'ASC']] });

const getById = async (id) => {
  const r = await Receta.findByPk(id, { include });
  if (!r) throw { status: 404, message: 'Receta no encontrada' };
  return r;
};

function validarComboGrupos(comboGrupos) {
  for (const grupo of comboGrupos) {
    if (!Array.isArray(grupo.opciones) || grupo.opciones.length === 0) {
      throw { status: 400, message: `El grupo "${grupo.nombre}" requiere al menos una opción` };
    }
    const min = Number(grupo.min_selecciones);
    const max = Number(grupo.max_selecciones);
    if (min > max) {
      throw { status: 400, message: `El grupo "${grupo.nombre}": el mínimo de selecciones no puede ser mayor al máximo` };
    }
  }
}

async function guardarComboGrupos(receta_id, comboGrupos, t) {
  await ComboGrupo.destroy({ where: { receta_id }, transaction: t });
  if (!comboGrupos || comboGrupos.length === 0) return;
  validarComboGrupos(comboGrupos);
  for (let i = 0; i < comboGrupos.length; i++) {
    const g = comboGrupos[i];
    const grupo = await ComboGrupo.create({
      receta_id,
      nombre: g.nombre,
      obligatorio: g.obligatorio !== false,
      min_selecciones: g.min_selecciones,
      max_selecciones: g.max_selecciones,
      orden: i,
    }, { transaction: t });
    for (let j = 0; j < g.opciones.length; j++) {
      const o = g.opciones[j];
      await ComboOpcion.create({
        combo_grupo_id: grupo.id,
        receta_id: o.receta_id,
        es_default: !!o.es_default,
        precio_adicional: o.precio_adicional || 0,
        orden: j,
      }, { transaction: t });
    }
  }
}

const create = async ({ nombre, descripcion, unidad_produccion, cantidad_produccion, precio_venta, costo_produccion, imagen_url, categoria, stock_minimo, es_combo, ingredientes, comboGrupos }) => {
  const t = await sequelize.transaction();
  try {
    const receta = await Receta.create({ nombre, descripcion, unidad_produccion, cantidad_produccion, precio_venta, costo_produccion, imagen_url, categoria, stock_minimo: stock_minimo || 0, es_combo: !!es_combo }, { transaction: t });
    for (const ing of ingredientes || []) {
      await DetalleReceta.create({ ...ing, receta_id: receta.id }, { transaction: t });
    }
    if (es_combo) await guardarComboGrupos(receta.id, comboGrupos, t);
    await t.commit();
    return getById(receta.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const update = async (id, { nombre, descripcion, unidad_produccion, cantidad_produccion, precio_venta, costo_produccion, imagen_url, categoria, stock_minimo, es_combo, ingredientes, comboGrupos }) => {
  const t = await sequelize.transaction();
  try {
    const receta = await getById(id);
    const patch = { nombre, descripcion, unidad_produccion, cantidad_produccion, precio_venta, costo_produccion, imagen_url, categoria };
    if (stock_minimo !== undefined) patch.stock_minimo = stock_minimo || 0;
    if (es_combo !== undefined) patch.es_combo = !!es_combo;
    await receta.update(patch, { transaction: t });
    if (ingredientes) {
      await DetalleReceta.destroy({ where: { receta_id: id }, transaction: t });
      for (const ing of ingredientes) {
        await DetalleReceta.create({ ...ing, receta_id: id }, { transaction: t });
      }
    }
    if (comboGrupos !== undefined) await guardarComboGrupos(id, comboGrupos, t);
    await t.commit();
    return getById(id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const remove = async (id) => {
  const r = await getById(id);
  await r.destroy();
};

module.exports = { getAll, getById, create, update, remove };
