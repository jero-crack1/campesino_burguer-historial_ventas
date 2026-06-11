const { Router } = require('express');
const { authJwt, requireRole } = require('../middlewares/auth');
const controller = require('../controllers/compraController');

const router = Router();

router.use(authJwt, requireRole('ADMIN'));

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);

module.exports = router;
