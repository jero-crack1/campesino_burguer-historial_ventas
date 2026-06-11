const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('DetalleReceta', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    receta_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo: { type: DataTypes.ENUM('materia_prima', 'sub_receta'), allowNull: false },
    materia_prima_id: { type: DataTypes.INTEGER, allowNull: true },
    sub_receta_id: { type: DataTypes.INTEGER, allowNull: true },
    cantidad: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
  }, { tableName: 'detalle_recetas', underscored: true });
