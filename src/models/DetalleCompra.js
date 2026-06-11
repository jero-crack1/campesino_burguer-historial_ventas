const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class DetalleCompra extends Model {}

DetalleCompra.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    compra_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    materia_prima_id: {
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
      validate: {
        min: { args: [0], msg: 'El precio unitario no puede ser negativo' },
      },
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'detalle_compras',
    modelName: 'DetalleCompra',
  }
);

module.exports = DetalleCompra;
