const { body } = require('express-validator');

exports.validateCreate = [
  body('proveedor').trim().notEmpty().withMessage('Proveedor requerido'),
  body('fecha').isDate().withMessage('Fecha inválida'),
  body('detalles').isArray({ min: 1 }).withMessage('Se requiere al menos un ítem'),
  body('detalles.*.materia_prima_id').isInt({ min: 1 }),
  body('detalles.*.cantidad').isFloat({ min: 0.001 }),
  body('detalles.*.precio_unitario').isFloat({ min: 0 }),
];
