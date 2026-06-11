const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('ProduccionReceta', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    receta_id: { type: DataTypes.INTEGER, allowNull: false },
    cantidad_lotes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    notas: { type: DataTypes.TEXT },
  }, { tableName: 'producciones_recetas', underscored: true });
