const jwt = require('jsonwebtoken');

function login(username, password) {
  const validUser = process.env.ADMIN_USER || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || 'admin';

  if (username !== validUser || password !== validPassword) {
    const err = new Error('Usuario o contraseña incorrectos');
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(
    { username, role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return { token, user: { username, role: 'ADMIN' } };
}

module.exports = { login };
