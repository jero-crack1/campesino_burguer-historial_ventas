const { body } = require('express-validator');

exports.validateCreate = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido').isLength({ max: 150 }),
  body('unidad_medida').trim().notEmpty().withMessage('Unidad de medida requerida'),
  body('stock_actual').optional().isFloat({ min: 0 }),
  body('stock_minimo').optional().isFloat({ min: 0 }),
  body('precio_unitario').optional().isFloat({ min: 0 }),
];

exports.validateUpdate = [
  body('nombre').optional().trim().notEmpty().isLength({ max: 150 }),
  body('unidad_medida').optional().trim().notEmpty(),
  body('stock_actual').optional().isFloat({ min: 0 }),
  body('stock_minimo').optional().isFloat({ min: 0 }),
  body('precio_unitario').optional().isFloat({ min: 0 }),
];
