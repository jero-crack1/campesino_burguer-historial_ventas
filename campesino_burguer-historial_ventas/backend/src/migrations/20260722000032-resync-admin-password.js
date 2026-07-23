'use strict';

const bcrypt = require('bcryptjs');

// La migración que crea 'usuarios' siembra el admin una sola vez, con el
// ADMIN_USER/ADMIN_PASSWORD que estuviera configurado en ese momento. Si esas
// variables de entorno cambiaron después (ej. en Render, ya desplegado), el
// usuario admin queda con una contraseña vieja que ya no coincide. Esta
// migración re-sincroniza el hash con el valor actual de las env vars.
module.exports = {
  async up(queryInterface) {
    const username = process.env.ADMIN_USER || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin';
    const password_hash = await bcrypt.hash(password, 10);

    await queryInterface.bulkUpdate(
      'usuarios',
      { password_hash, activo: true, role: 'ADMIN', updated_at: new Date() },
      { username }
    );
  },

  async down() {
    // No reversible: no conocemos el hash anterior.
  },
};
