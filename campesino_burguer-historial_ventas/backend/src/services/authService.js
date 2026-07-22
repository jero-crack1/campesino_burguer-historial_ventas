const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');

async function login(username, password) {
  const usuario = await Usuario.findOne({ where: { username } });
  if (!usuario || !usuario.activo || !(await bcrypt.compare(password, usuario.password_hash))) {
    const err = new Error('Usuario o contraseña incorrectos');
    err.status = 401;
    throw err;
  }

  const payload = { id: usuario.id, username: usuario.username, nombre: usuario.nombre, role: usuario.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  return { token, user: payload };
}

module.exports = { login };
