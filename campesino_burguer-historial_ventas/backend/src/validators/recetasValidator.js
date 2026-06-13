const { body } = require('express-validator');

exports.validateCreate = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('unidad_produccion').trim().notEmpty().withMessage('Unidad de producción requerida'),
  body('cantidad_produccion').isFloat({ min: 0.001 }),
  body('precio_venta').isFloat({ min: 0 }).withMessage('Precio de venta requerido'),
  body('costo_produccion').isFloat({ min: 0 }).withMessage('Costo de producción requerido'),
  body('imagen_url').optional({ nullable: true }).isURL().withMessage('URL de imagen no válida'),
  body('categoria').optional({ nullable: true }).trim().isString(),
  body('ingredientes').isArray({ min: 1 }).withMessage('Se requiere al menos un ingrediente'),
  body('ingredientes.*.tipo').isIn(['materia_prima', 'sub_receta']),
  body('ingredientes.*.cantidad').isFloat({ min: 0.001 }),
];

exports.validateUpdate = [
  body('nombre').optional().trim().notEmpty(),
  body('unidad_produccion').optional().trim().notEmpty(),
  body('cantidad_produccion').optional().isFloat({ min: 0.001 }),
  body('precio_venta').optional().isFloat({ min: 0 }),
  body('costo_produccion').optional().isFloat({ min: 0 }),
  body('imagen_url').optional({ nullable: true }).isURL().withMessage('URL de imagen no válida'),
  body('categoria').optional({ nullable: true }).trim().isString(),
  body('ingredientes').optional().isArray({ min: 1 }),
];
