const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('ComboGrupo', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    receta_id: { type: DataTypes.INTEGER, allowNull: false },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    obligatorio: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    min_selecciones: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    max_selecciones: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, { tableName: 'combo_grupos', underscored: true });
