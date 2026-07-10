const { body } = require('express-validator');

const validarIdOpcional = (campo) =>
  body(campo).custom((val) => {
    if (val === null || val === undefined) return true;
    if (!Number.isInteger(Number(val)) || Number(val) < 1) throw new Error(`${campo} inválido`);
    return true;
  });

const validarDosDecimales = (campo, { optional = false } = {}) => {
  let rule = body(campo);
  if (optional) rule = rule.optional();
  return rule
    .isFloat({ min: 0.01 }).withMessage(`${campo} debe ser mayor o igual a 0.01`)
    .bail()
    .custom((valor) => {
      const texto = String(valor).trim();
      if (!/^\d+(?:\.\d{1,2})?$/.test(texto)) {
        throw new Error(`${campo} admite máximo 2 decimales`);
      }
      return true;
    });
};

const ingredientesRules = [
  body('ingredientes').isArray({ min: 1 }).withMessage('Se requiere al menos un ingrediente'),
  validarIdOpcional('ingredientes.*.materia_prima_id'),
  validarIdOpcional('ingredientes.*.sub_receta_ingrediente_id'),
  validarDosDecimales('ingredientes.*.cantidad'),
];

const porcionesRules = [
  body('porciones').optional({ nullable: true }).custom((v) => {
    if (v === null || v === undefined) return true;
    if (isNaN(Number(v)) || Number(v) < 0) throw new Error('porciones inválido');
    return true;
  }),
  body('peso_porcion').optional({ nullable: true }).custom((v) => {
    if (v === null || v === undefined) return true;
    if (isNaN(Number(v)) || Number(v) < 0) throw new Error('peso_porcion inválido');
    return true;
  }),
  body('costo_porcion').optional({ nullable: true }).custom((v) => {
    if (v === null || v === undefined) return true;
    if (isNaN(Number(v)) || Number(v) < 0) throw new Error('costo_porcion inválido');
    return true;
  }),
];

exports.validateCreate = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('unidad_produccion').trim().notEmpty().withMessage('Unidad de producción requerida'),
  body('cantidad_produccion').isFloat({ min: 0.001 }),
  ...porcionesRules,
  ...ingredientesRules,
];

exports.validateUpdate = [
  body('nombre').optional().trim().notEmpty(),
  body('unidad_produccion').optional().trim().notEmpty(),
  body('cantidad_produccion').optional().isFloat({ min: 0.001 }),
  ...porcionesRules,
  body('ingredientes').optional().isArray({ min: 1 }),
  validarIdOpcional('ingredientes.*.materia_prima_id'),
  validarIdOpcional('ingredientes.*.sub_receta_ingrediente_id'),
  validarDosDecimales('ingredientes.*.cantidad', { optional: true }),
];
