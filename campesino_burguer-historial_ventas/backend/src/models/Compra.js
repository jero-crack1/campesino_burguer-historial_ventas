const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Compra', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    proveedor: { type: DataTypes.STRING(150), allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    notas: { type: DataTypes.TEXT },
    total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
  }, { tableName: 'compras', underscored: true });
