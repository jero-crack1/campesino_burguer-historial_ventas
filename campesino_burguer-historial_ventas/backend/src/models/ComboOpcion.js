const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('ComboOpcion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    combo_grupo_id: { type: DataTypes.INTEGER, allowNull: false },
    receta_id: { type: DataTypes.INTEGER, allowNull: false },
    es_default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    precio_adicional: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, { tableName: 'combo_opciones', underscored: true });
