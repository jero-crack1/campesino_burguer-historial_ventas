const { body } = require('express-validator');

exports.validateCreate = [
  body('fecha').notEmpty().withMessage('La fecha es requerida').isDate().withMessage('Formato de fecha inválido'),
  body('cliente').optional().trim(),
  body('detalles').isArray({ min: 1 }).withMessage('Se requiere al menos un ítem'),
  body('detalles.*.receta_id').isInt({ min: 1 }).withMessage('Receta inválida'),
  body('detalles.*.cantidad').isFloat({ min: 0.001 }).withMessage('Cantidad inválida'),
];
