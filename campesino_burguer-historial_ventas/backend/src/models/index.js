require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

const MateriaPrima = require('./MateriaPrima')(sequelize);
const Compra = require('./Compra')(sequelize);
const DetalleCompra = require('./DetalleCompra')(sequelize);
const SubReceta = require('./SubReceta')(sequelize);
const DetalleSubReceta = require('./DetalleSubReceta')(sequelize);
const Receta = require('./Receta')(sequelize);
const DetalleReceta = require('./DetalleReceta')(sequelize);
const ProduccionSubReceta = require('./ProduccionSubReceta')(sequelize);
const ProduccionReceta = require('./ProduccionReceta')(sequelize);
const Venta = require('./Venta')(sequelize);
const DetalleVenta = require('./DetalleVenta')(sequelize);

// Compra <-> DetalleCompra
Compra.hasMany(DetalleCompra, { foreignKey: 'compra_id', as: 'detalles', onDelete: 'CASCADE' });
DetalleCompra.belongsTo(Compra, { foreignKey: 'compra_id', as: 'compra' });

// MateriaPrima <-> DetalleCompra
MateriaPrima.hasMany(DetalleCompra, { foreignKey: 'materia_prima_id', as: 'lineasCompra' });
DetalleCompra.belongsTo(MateriaPrima, { foreignKey: 'materia_prima_id', as: 'materiaPrima' });

// SubReceta <-> DetalleSubReceta
SubReceta.hasMany(DetalleSubReceta, { foreignKey: 'sub_receta_id', as: 'ingredientes', onDelete: 'CASCADE' });
DetalleSubReceta.belongsTo(SubReceta, { foreignKey: 'sub_receta_id', as: 'subReceta' });

// MateriaPrima <-> DetalleSubReceta
MateriaPrima.hasMany(DetalleSubReceta, { foreignKey: 'materia_prima_id', as: 'enSubRecetas' });
DetalleSubReceta.belongsTo(MateriaPrima, { foreignKey: 'materia_prima_id', as: 'materiaPrima' });

// SubReceta <-> DetalleSubReceta (como ingrediente de otra sub-receta)
SubReceta.hasMany(DetalleSubReceta, { foreignKey: 'sub_receta_ingrediente_id', as: 'usadaEnSubRecetas' });
DetalleSubReceta.belongsTo(SubReceta, { foreignKey: 'sub_receta_ingrediente_id', as: 'subRecetaIngrediente' });

// Receta <-> DetalleReceta
Receta.hasMany(DetalleReceta, { foreignKey: 'receta_id', as: 'ingredientes', onDelete: 'CASCADE' });
DetalleReceta.belongsTo(Receta, { foreignKey: 'receta_id', as: 'receta' });

// MateriaPrima <-> DetalleReceta (nullable)
MateriaPrima.hasMany(DetalleReceta, { foreignKey: 'materia_prima_id', as: 'enRecetas' });
DetalleReceta.belongsTo(MateriaPrima, { foreignKey: 'materia_prima_id', as: 'materiaPrima' });

// SubReceta <-> DetalleReceta (nullable)
SubReceta.hasMany(DetalleReceta, { foreignKey: 'sub_receta_id', as: 'enRecetas' });
DetalleReceta.belongsTo(SubReceta, { foreignKey: 'sub_receta_id', as: 'subReceta' });

// SubReceta <-> ProduccionSubReceta
SubReceta.hasMany(ProduccionSubReceta, { foreignKey: 'sub_receta_id', as: 'producciones' });
ProduccionSubReceta.belongsTo(SubReceta, { foreignKey: 'sub_receta_id', as: 'subReceta' });

// Receta <-> ProduccionReceta
Receta.hasMany(ProduccionReceta, { foreignKey: 'receta_id', as: 'producciones' });
ProduccionReceta.belongsTo(Receta, { foreignKey: 'receta_id', as: 'receta' });

// Venta <-> DetalleVenta
Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id', as: 'detalles', onDelete: 'CASCADE' });
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id', as: 'venta' });

// Receta <-> DetalleVenta
Receta.hasMany(DetalleVenta, { foreignKey: 'receta_id', as: 'lineasVenta' });
DetalleVenta.belongsTo(Receta, { foreignKey: 'receta_id', as: 'receta' });

module.exports = {
  sequelize, Sequelize,
  MateriaPrima, Compra, DetalleCompra,
  SubReceta, DetalleSubReceta,
  Receta, DetalleReceta,
  ProduccionSubReceta, ProduccionReceta,
  Venta, DetalleVenta,
};
