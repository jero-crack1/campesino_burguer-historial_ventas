const sequelize = require('../config/database');

// Fase 2 — Materias Primas
const MateriaPrima = require('./MateriaPrima');

// Fase 3 — Compras
const Compra = require('./Compra');
const DetalleCompra = require('./DetalleCompra');

// Fase 4 — SubRecetas
const SubReceta = require('./SubReceta');
const SubRecetaMateriaPrima = require('./SubRecetaMateriaPrima');

// Fase 5 — Recetas (pendiente)
// const Receta = require('./Receta');
// const RecetaSubReceta = require('./RecetaSubReceta');
// const RecetaMateriaPrima = require('./RecetaMateriaPrima');

// Fase 6 — Ventas (pendiente)
// const Venta = require('./Venta');
// const DetalleVenta = require('./DetalleVenta');

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

const db = { sequelize, MateriaPrima, Compra, DetalleCompra, SubReceta, SubRecetaMateriaPrima };

module.exports = db;
