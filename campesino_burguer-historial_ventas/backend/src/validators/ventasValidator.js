const { body } = require('express-validator');

const METODOS_PAGO = ['Efectivo', 'Nequi', 'Daviplata', 'Bre-B', 'Bold', 'Crédito'];

exports.validateCreate = [
  body('fecha').notEmpty().withMessage('La fecha es requerida').isDate().withMessage('Formato de fecha inválido'),
  body('cliente').optional().trim(),
  body('cliente').custom((cliente, { req }) => {
    if (req.body.metodoPago === 'Crédito' && !String(cliente || '').trim()) {
      throw new Error('El cliente es requerido para una venta a crédito');
    }
    return true;
  }),
  body('detalles').isArray({ min: 1 }).withMessage('Se requiere al menos un ítem'),
  body('detalles.*.receta_id').isInt({ min: 1 }).withMessage('Receta inválida'),
  body('detalles.*.cantidad').isFloat({ min: 0.001 }).withMessage('Cantidad inválida'),
  body('metodoPago').optional({ nullable: true }).isIn(METODOS_PAGO).withMessage('Método de pago inválido'),
  body('valorRecibido').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Valor recibido inválido'),
  body('impoconsumoPocentaje').optional({ nullable: true }).isFloat({ min: 0, max: 100 }).withMessage('Impoconsumo inválido'),
];
