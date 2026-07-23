'use strict';

const bcrypt = require('bcryptjs');

// La migración anterior (20260722000032) actualizaba por username y no dejó
// rastro de si realmente encontró la fila — si el username en la base no
// coincidía exactamente con ADMIN_USER (mayúsculas, espacios, etc.), el
// UPDATE no falla, simplemente no toca ninguna fila. Esta versión ubica al
// admin por su rol (ADMIN) en vez de por nombre de usuario, y si no existe
// ninguno lo crea, para que quede resuelto sin depender de ese match exacto.
module.exports = {
  async up(queryInterface) {
    const username = (process.env.ADMIN_USER || 'admin').trim();
    const password = (process.env.ADMIN_PASSWORD || 'admin').trim();
    const password_hash = await bcrypt.hash(password, 10);

    const [rows] = await queryInterface.sequelize.query(
      `SELECT id FROM usuarios WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1`
    );

    if (rows.length > 0) {
      await queryInterface.sequelize.query(
        `UPDATE usuarios SET username = :username, password_hash = :password_hash, activo = true, updated_at = NOW() WHERE id = :id`,
        { replacements: { username, password_hash, id: rows[0].id } }
      );
    } else {
      await queryInterface.bulkInsert('usuarios', [{
        nombre: 'Administrador',
        username,
        password_hash,
        role: 'ADMIN',
        activo: true,
        created_at: new Date(),
        updated_at: new Date(),
      }]);
    }
  },

  async down() {
    // No reversible: no conocemos el estado anterior.
  },
};
