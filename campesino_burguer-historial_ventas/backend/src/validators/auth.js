const { body } = require('express-validator');

const loginRules = [
  body('username').trim().notEmpty().withMessage('El usuario es requerido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
];

module.exports = { loginRules };
