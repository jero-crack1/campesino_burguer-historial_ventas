'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('recetas', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      nombre: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      precio_venta: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      unidad_medida: {
        type: Sequelize.ENUM('kg', 'g', 'L', 'ml', 'cda', 'und'),
        allowNull: false,
      },
      stock_actual: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 0,
      },
      costo_produccion: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('recetas');
  },
};
