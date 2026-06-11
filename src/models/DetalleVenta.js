const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class DetalleVenta extends Model {}

DetalleVenta.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    venta_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    receta_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      validate: {
        min: { args: [0.001], msg: 'La cantidad debe ser mayor a 0' },
      },
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'detalle_ventas',
    modelName: 'DetalleVenta',
  }
);

module.exports = DetalleVenta;
