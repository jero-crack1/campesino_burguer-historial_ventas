const { Router } = require('express');
const { authJwt, requireRole } = require('../middlewares/auth');
const controller = require('../controllers/materiaPrimaController');

const router = Router();

router.get('/', controller.getAll);
router.get('/bajo-minimo', controller.getBajoMinimo);
router.get('/:id', controller.getById);
router.post('/', authJwt, requireRole('ADMIN'), controller.create);
router.put('/:id', authJwt, requireRole('ADMIN'), controller.update);
router.delete('/:id', authJwt, requireRole('ADMIN'), controller.remove);

module.exports = router;
