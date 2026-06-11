const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Venta', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    cliente: { type: DataTypes.STRING(255) },
    total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
  }, { tableName: 'ventas', underscored: true });
