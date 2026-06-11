const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class RecetaSubReceta extends Model {}

RecetaSubReceta.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    receta_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    subreceta_id: {
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
  },
  {
    sequelize,
    tableName: 'receta_subrecetas',
    modelName: 'RecetaSubReceta',
  }
);

module.exports = RecetaSubReceta;
