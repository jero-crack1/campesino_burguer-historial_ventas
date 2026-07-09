const router = require('express').Router();
const ctrl = require('../controllers/creditosController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/:id/abonar', ctrl.abonar);
router.post('/:id/pagar', ctrl.pagarCompleto);

module.exports = router;
