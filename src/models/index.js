const sequelize = require('../config/database');

// Fase 2 — Materias Primas
const MateriaPrima = require('./MateriaPrima');

// Fase 3 — Compras
const Compra = require('./Compra');
const DetalleCompra = require('./DetalleCompra');

// Fase 4 — SubRecetas
const SubReceta = require('./SubReceta');
const SubRecetaMateriaPrima = require('./SubRecetaMateriaPrima');

// Fase 5 — Recetas
const Receta = require('./Receta');
const RecetaSubReceta = require('./RecetaSubReceta');
const RecetaMateriaPrima = require('./RecetaMateriaPrima');

// Fase 6 — Ventas
const Venta = require('./Venta');
const DetalleVenta = require('./DetalleVenta');

// Fase 9 — Log de producciones
const Produccion = require('./Produccion');

// ── Asociaciones ──────────────────────────────────────────────────────────────

Compra.hasMany(DetalleCompra, { foreignKey: 'compra_id', as: 'detalles' });
DetalleCompra.belongsTo(Compra, { foreignKey: 'compra_id' });

DetalleCompra.belongsTo(MateriaPrima, { foreignKey: 'materia_prima_id', as: 'materiaPrima' });
MateriaPrima.hasMany(DetalleCompra, { foreignKey: 'materia_prima_id' });

SubReceta.belongsToMany(MateriaPrima, {
  through: SubRecetaMateriaPrima,
  foreignKey: 'subreceta_id',
  otherKey: 'materia_prima_id',
  as: 'ingredientes',
});
MateriaPrima.belongsToMany(SubReceta, {
  through: SubRecetaMateriaPrima,
  foreignKey: 'materia_prima_id',
  otherKey: 'subreceta_id',
});

Receta.belongsToMany(SubReceta, {
  through: RecetaSubReceta,
  foreignKey: 'receta_id',
  otherKey: 'subreceta_id',
  as: 'subrecetas',
});
SubReceta.belongsToMany(Receta, {
  through: RecetaSubReceta,
  foreignKey: 'subreceta_id',
  otherKey: 'receta_id',
});

Receta.belongsToMany(MateriaPrima, {
  through: RecetaMateriaPrima,
  foreignKey: 'receta_id',
  otherKey: 'materia_prima_id',
  as: 'materiasPrimas',
});
MateriaPrima.belongsToMany(Receta, {
  through: RecetaMateriaPrima,
  foreignKey: 'materia_prima_id',
  otherKey: 'receta_id',
});

Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id', as: 'detalles' });
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id' });

DetalleVenta.belongsTo(Receta, { foreignKey: 'receta_id', as: 'receta' });
Receta.hasMany(DetalleVenta, { foreignKey: 'receta_id' });

const db = {
  sequelize,
  MateriaPrima, Compra, DetalleCompra,
  SubReceta, SubRecetaMateriaPrima,
  Receta, RecetaSubReceta, RecetaMateriaPrima,
  Venta, DetalleVenta,
  Produccion,
};

module.exports = db;
