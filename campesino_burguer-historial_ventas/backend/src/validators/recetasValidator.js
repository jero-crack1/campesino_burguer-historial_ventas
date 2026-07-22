const { body } = require('express-validator');

const comboGruposRules = [
  body('comboGrupos').optional().isArray(),
  body('comboGrupos.*.nombre').trim().notEmpty().withMessage('Nombre de grupo requerido'),
  body('comboGrupos.*.min_selecciones').isInt({ min: 0 }).withMessage('Mínimo de selecciones inválido'),
  body('comboGrupos.*.max_selecciones').isInt({ min: 1 }).withMessage('Máximo de selecciones inválido'),
  body('comboGrupos.*.opciones').isArray({ min: 1 }).withMessage('Cada grupo requiere al menos una opción'),
  body('comboGrupos.*.opciones.*.receta_id').isInt({ min: 1 }).withMessage('Opción de combo inválida'),
  body('comboGrupos.*.opciones.*.precio_adicional').optional({ nullable: true }).isFloat({ min: 0 }),
];

exports.validateCreate = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('unidad_produccion').trim().notEmpty().withMessage('Unidad de producción requerida'),
  body('cantidad_produccion').isFloat({ min: 0.001 }),
  body('precio_venta').isFloat({ min: 0 }).withMessage('Precio de venta requerido'),
  body('costo_produccion').isFloat({ min: 0 }).withMessage('Costo de producción requerido'),
  body('imagen_url').optional({ nullable: true, checkFalsy: true }).isURL().withMessage('URL de imagen no válida'),
  body('categoria').optional({ nullable: true, checkFalsy: true }).trim().isString(),
  body('costo_objetivo').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('Costo objetivo debe ser entre 0 y 100'),
  body('stock_minimo').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Stock mínimo inválido'),
  body('es_combo').optional().isBoolean(),
  body('ingredientes').custom((val, { req }) => {
    if (!req.body.es_combo && (!Array.isArray(val) || val.length === 0)) {
      throw new Error('Se requiere al menos un ingrediente');
    }
    return true;
  }),
  body('ingredientes.*.tipo').optional().isIn(['materia_prima', 'sub_receta']),
  body('ingredientes.*.cantidad').optional().isFloat({ min: 0.001 }),
  ...comboGruposRules,
];

exports.validateUpdate = [
  body('nombre').optional().trim().notEmpty(),
  body('unidad_produccion').optional().trim().notEmpty(),
  body('cantidad_produccion').optional().isFloat({ min: 0.001 }),
  body('precio_venta').optional().isFloat({ min: 0 }),
  body('costo_produccion').optional().isFloat({ min: 0 }),
  body('imagen_url').optional({ nullable: true, checkFalsy: true }).isURL().withMessage('URL de imagen no válida'),
  body('categoria').optional({ nullable: true, checkFalsy: true }).trim().isString(),
  body('stock_minimo').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('Stock mínimo inválido'),
  body('es_combo').optional().isBoolean(),
  body('ingredientes').optional().isArray(),
  ...comboGruposRules,
];
