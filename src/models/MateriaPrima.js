const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class MateriaPrima extends Model {}

MateriaPrima.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre no puede estar vacío' },
      },
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    unidad_medida: {
      type: DataTypes.ENUM('kg', 'g', 'L', 'ml', 'cda', 'und'),
      allowNull: false,
    },
    stock_actual: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'El stock actual no puede ser negativo' },
      },
    },
    stock_minimo: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'El stock mínimo no puede ser negativo' },
      },
    },
    costo_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'El costo unitario no puede ser negativo' },
      },
    },
  },
  {
    sequelize,
    tableName: 'materias_primas',
    modelName: 'MateriaPrima',
  }
);

module.exports = MateriaPrima;
