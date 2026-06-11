const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('DetalleCompra', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    compra_id: { type: DataTypes.INTEGER, allowNull: false },
    materia_prima_id: { type: DataTypes.INTEGER, allowNull: false },
    cantidad: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
    precio_unitario: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  }, { tableName: 'detalle_compras', underscored: true });
