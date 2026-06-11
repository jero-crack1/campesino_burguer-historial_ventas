const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('DetalleVenta', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    venta_id: { type: DataTypes.INTEGER, allowNull: false },
    receta_id: { type: DataTypes.INTEGER, allowNull: false },
    cantidad: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
    precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  }, { tableName: 'detalle_ventas', underscored: true });
