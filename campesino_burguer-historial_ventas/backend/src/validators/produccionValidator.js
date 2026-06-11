const { body } = require('express-validator');

exports.validateCreate = [
  body('cantidad_lotes').isInt({ min: 1 }).withMessage('Cantidad de lotes debe ser >= 1'),
  body('fecha').isDate().withMessage('Fecha inválida'),
];
