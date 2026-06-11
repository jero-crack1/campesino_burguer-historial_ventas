const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Produccion extends Model {}

Produccion.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    tipo: {
      type: DataTypes.ENUM('subreceta', 'receta'),
      allowNull: false,
    },
    entidad_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    entidad_nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    cantidad_producida: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    costo_estimado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'producciones',
    modelName: 'Produccion',
  }
);

module.exports = Produccion;
