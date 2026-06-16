const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('DetalleSubReceta', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sub_receta_id: { type: DataTypes.INTEGER, allowNull: false },
    materia_prima_id: { type: DataTypes.INTEGER, allowNull: true },
    sub_receta_ingrediente_id: { type: DataTypes.INTEGER, allowNull: true },
    cantidad: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
  }, { tableName: 'detalle_sub_recetas', underscored: true });
