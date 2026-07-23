const router = require('express').Router();
const { authJwt, requireRole } = require('../middlewares/auth');

router.use('/auth', require('./auth'));

router.use(authJwt);

router.use('/materias-primas', require('./materiasPrimas'));
router.use('/compras', require('./compras'));
router.use('/sub-recetas', require('./subRecetas'));
router.use('/recetas', require('./recetas'));
router.use('/produccion-sub-recetas', require('./produccionSubRecetas'));
router.use('/produccion-recetas', require('./produccionRecetas'));
router.use('/ventas', require('./ventas'));
router.use('/creditos', require('./creditos'));
router.use('/reportes', require('./reportes'));
router.use('/usuarios', requireRole('ADMIN', 'MESERO'), require('./usuarios'));

module.exports = router;
