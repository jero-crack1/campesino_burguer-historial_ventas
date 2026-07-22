'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nombre: { type: Sequelize.STRING(255), allowNull: false },
      username: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'MESERO' },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    // Siembra el administrador ya existente (mismas credenciales que ADMIN_USER/ADMIN_PASSWORD)
    // para que el login siga funcionando exactamente igual después de esta migración.
    const username = process.env.ADMIN_USER || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin';
    const password_hash = await bcrypt.hash(password, 10);

    await queryInterface.bulkInsert('usuarios', [{
      nombre: 'Administrador',
      username,
      password_hash,
      role: 'ADMIN',
      activo: true,
      created_at: new Date(),
      updated_at: new Date(),
    }]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('usuarios');
  },
};
