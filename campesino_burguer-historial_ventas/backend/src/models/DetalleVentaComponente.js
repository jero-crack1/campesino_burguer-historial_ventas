const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('DetalleVentaComponente', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    detalle_venta_id: { type: DataTypes.INTEGER, allowNull: false },
    combo_grupo_id: { type: DataTypes.INTEGER, allowNull: true },
    receta_id: { type: DataTypes.INTEGER, allowNull: false },
    cantidad: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
  }, { tableName: 'detalle_venta_componentes', underscored: true });
