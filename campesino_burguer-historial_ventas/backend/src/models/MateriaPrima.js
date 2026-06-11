const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('MateriaPrima', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    unidad_medida: { type: DataTypes.STRING(50), allowNull: false },
    stock_actual: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0, allowNull: false },
    stock_minimo: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0, allowNull: false },
    precio_unitario: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
  }, { tableName: 'materias_primas', underscored: true });
