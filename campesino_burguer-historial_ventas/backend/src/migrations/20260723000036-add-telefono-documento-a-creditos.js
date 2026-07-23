'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('creditos', 'telefono', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn('creditos', 'documento', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('creditos', 'telefono');
    await queryInterface.removeColumn('creditos', 'documento');
  },
};
