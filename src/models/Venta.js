const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Venta extends Model {}

Venta.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    cliente: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'ventas',
    modelName: 'Venta',
  }
);

module.exports = Venta;
