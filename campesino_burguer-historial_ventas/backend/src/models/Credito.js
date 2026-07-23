const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Credito', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    venta_id: { type: DataTypes.INTEGER, allowNull: false },
    cliente: { type: DataTypes.STRING(255), allowNull: true },
    telefono: { type: DataTypes.STRING(50), allowNull: true },
    documento: { type: DataTypes.STRING(50), allowNull: true },
    monto_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    monto_pagado: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    estado: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pendiente' },
  }, { tableName: 'creditos', underscored: true });
