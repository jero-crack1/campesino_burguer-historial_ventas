const { body } = require('express-validator');

const ingredientesRules = [
  body('ingredientes').isArray({ min: 1 }).withMessage('Se requiere al menos un ingrediente'),
  body('ingredientes.*.materia_prima_id').isInt({ min: 1 }),
  body('ingredientes.*.cantidad').isFloat({ min: 0.001 }),
];

exports.validateCreate = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('unidad_produccion').trim().notEmpty().withMessage('Unidad de producción requerida'),
  body('cantidad_produccion').isFloat({ min: 0.001 }),
  ...ingredientesRules,
];

exports.validateUpdate = [
  body('nombre').optional().trim().notEmpty(),
  body('unidad_produccion').optional().trim().notEmpty(),
  body('cantidad_produccion').optional().isFloat({ min: 0.001 }),
  body('ingredientes').optional().isArray({ min: 1 }),
  body('ingredientes.*.materia_prima_id').optional().isInt({ min: 1 }),
  body('ingredientes.*.cantidad').optional().isFloat({ min: 0.001 }),
];
