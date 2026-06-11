const { Router } = require('express');
const { authJwt, requireRole } = require('../middlewares/auth');
const controller = require('../controllers/reporteController');

const router = Router();

router.use(authJwt, requireRole('ADMIN'));

router.get('/dashboard',            controller.getDashboard);
router.get('/stock/critico',        controller.getStockCritico);
router.get('/ventas',               controller.getVentas);
router.get('/ventas/productos-top', controller.getProductosTop);
router.get('/produccion',           controller.getProduccion);
router.get('/rentabilidad',         controller.getRentabilidad);

module.exports = router;
