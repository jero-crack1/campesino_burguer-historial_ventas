const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Venta', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    cliente: { type: DataTypes.STRING(255) },
    total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
    metodo_pago: { type: DataTypes.STRING(50), allowNull: true },
    descuento_aplicado: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
    valor_recibido: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    cambio: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
    estado: { type: DataTypes.STRING(30), defaultValue: 'activa', allowNull: false },
    impoconsumo_porcentaje: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0, allowNull: false },
    impoconsumo_valor: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
  }, { tableName: 'ventas', underscored: true });
