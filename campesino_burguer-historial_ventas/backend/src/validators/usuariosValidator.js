const { body } = require('express-validator');

const ROLES = ['ADMIN', 'MESERO'];

exports.validateCreate = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido').isLength({ max: 255 }),
  body('username').trim().notEmpty().withMessage('El usuario es requerido').isLength({ max: 100 }),
  body('password').notEmpty().withMessage('La contraseña es requerida').isLength({ min: 4 }).withMessage('Mínimo 4 caracteres'),
  body('role').notEmpty().withMessage('El rol es requerido').isIn(ROLES).withMessage('Rol inválido'),
];

exports.validateUpdate = [
  body('nombre').optional().trim().notEmpty().isLength({ max: 255 }),
  body('username').optional().trim().notEmpty().isLength({ max: 100 }),
  body('password').optional({ nullable: true, checkFalsy: true }).isLength({ min: 4 }).withMessage('Mínimo 4 caracteres'),
  body('role').optional().isIn(ROLES).withMessage('Rol inválido'),
  body('activo').optional().isBoolean(),
];
