const { Router } = require('express');
const { authJwt, requireRole } = require('../middlewares/auth');
const controller = require('../controllers/subrecetaController');

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', authJwt, requireRole('ADMIN'), controller.create);
router.put('/:id', authJwt, requireRole('ADMIN'), controller.update);
router.delete('/:id', authJwt, requireRole('ADMIN'), controller.remove);
router.post('/:id/producir', authJwt, requireRole('ADMIN'), controller.producir);

module.exports = router;
