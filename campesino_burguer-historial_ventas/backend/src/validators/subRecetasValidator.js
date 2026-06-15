const { body } = require('express-validator');

const validarIdOpcional = (campo) =>
  body(campo).custom((val) => {
    if (val === null || val === undefined) return true;
    if (!Number.isInteger(Number(val)) || Number(val) < 1) throw new Error(`${campo} inválido`);
    return true;
  });

const ingredientesRules = [
  body('ingredientes').isArray({ min: 1 }).withMessage('Se requiere al menos un ingrediente'),
  validarIdOpcional('ingredientes.*.materia_prima_id'),
  validarIdOpcional('ingredientes.*.sub_receta_ingrediente_id'),
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
  validarIdOpcional('ingredientes.*.materia_prima_id'),
  validarIdOpcional('ingredientes.*.sub_receta_ingrediente_id'),
  body('ingredientes.*.cantidad').optional().isFloat({ min: 0.001 }),
];
