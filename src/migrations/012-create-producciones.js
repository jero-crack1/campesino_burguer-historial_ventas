'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('producciones', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      tipo: {
        type: Sequelize.ENUM('subreceta', 'receta'),
        allowNull: false,
      },
      entidad_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      entidad_nombre: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      cantidad_producida: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
      },
      costo_estimado: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
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
    await queryInterface.dropTable('producciones');
  },
};
