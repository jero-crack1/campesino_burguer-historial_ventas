const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Abono', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    credito_id: { type: DataTypes.INTEGER, allowNull: false },
    monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    notas: { type: DataTypes.TEXT, allowNull: true },
  }, { tableName: 'abonos', underscored: true });
