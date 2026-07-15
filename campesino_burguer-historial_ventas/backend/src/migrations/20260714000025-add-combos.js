'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('recetas', 'es_combo', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.createTable('combo_grupos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      receta_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'recetas', key: 'id' }, onDelete: 'CASCADE',
      },
      nombre: { type: Sequelize.STRING(100), allowNull: false },
      obligatorio: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      min_selecciones: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      max_selecciones: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      orden: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.createTable('combo_opciones', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      combo_grupo_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'combo_grupos', key: 'id' }, onDelete: 'CASCADE',
      },
      receta_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'recetas', key: 'id' },
      },
      es_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      precio_adicional: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      orden: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.createTable('detalle_venta_componentes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      detalle_venta_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'detalle_ventas', key: 'id' }, onDelete: 'CASCADE',
      },
      combo_grupo_id: {
        type: Sequelize.INTEGER, allowNull: true,
        references: { model: 'combo_grupos', key: 'id' }, onDelete: 'SET NULL',
      },
      receta_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'recetas', key: 'id' },
      },
      cantidad: { type: Sequelize.DECIMAL(10, 3), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('detalle_venta_componentes');
    await queryInterface.dropTable('combo_opciones');
    await queryInterface.dropTable('combo_grupos');
    await queryInterface.removeColumn('recetas', 'es_combo');
  },
};
