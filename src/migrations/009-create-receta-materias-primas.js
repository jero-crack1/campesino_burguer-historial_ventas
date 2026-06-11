'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('receta_materias_primas', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      receta_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'recetas', key: 'id' },
        onDelete: 'CASCADE',
      },
      materia_prima_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'materias_primas', key: 'id' },
      },
      cantidad: {
        type: Sequelize.DECIMAL(10, 3),
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
    await queryInterface.dropTable('receta_materias_primas');
  },
};
