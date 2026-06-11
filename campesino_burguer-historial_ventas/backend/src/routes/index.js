const router = require('express').Router();

router.use('/materias-primas', require('./materiasPrimas'));
router.use('/compras', require('./compras'));
router.use('/sub-recetas', require('./subRecetas'));
router.use('/recetas', require('./recetas'));
router.use('/produccion-sub-recetas', require('./produccionSubRecetas'));
router.use('/produccion-recetas', require('./produccionRecetas'));

module.exports = router;
