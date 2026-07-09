'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('creditos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      venta_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'ventas', key: 'id' }, onDelete: 'CASCADE',
      },
      cliente: { type: Sequelize.STRING(255), allowNull: true },
      monto_total: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      monto_pagado: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      estado: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'pendiente' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.createTable('abonos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      credito_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'creditos', key: 'id' }, onDelete: 'CASCADE',
      },
      monto: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      notas: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('abonos');
    await queryInterface.dropTable('creditos');
  },
};
