const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('SubReceta', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    unidad_produccion: { type: DataTypes.STRING(50), allowNull: false },
    cantidad_produccion: { type: DataTypes.DECIMAL(10, 3), allowNull: false, defaultValue: 1 },
    stock_actual: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0, allowNull: false },
  }, { tableName: 'sub_recetas', underscored: true });
