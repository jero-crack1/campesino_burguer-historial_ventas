const router = require('express').Router();
const ctrl = require('../controllers/reportesController');

router.get('/dashboard', ctrl.dashboard);
router.get('/ventas', ctrl.ventasPorPeriodo);
router.get('/ventas/productos-top', ctrl.productosTop);
router.get('/rentabilidad', ctrl.rentabilidad);
router.get('/stock/critico', ctrl.stockCritico);

module.exports = router;
