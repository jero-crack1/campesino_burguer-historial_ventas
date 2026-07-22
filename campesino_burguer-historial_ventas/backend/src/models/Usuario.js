const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Usuario', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(255), allowNull: false },
    username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'MESERO' },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'usuarios', underscored: true });
