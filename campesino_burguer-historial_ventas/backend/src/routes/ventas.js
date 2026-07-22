const router = require('express').Router();
const ctrl = require('../controllers/ventasController');
const { requireRole } = require('../middlewares/auth');
const { validateCreate, validateUpdateFactura, validateAnular } = require('../validators/ventasValidator');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validateCreate, ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/factura', requireRole('ADMIN'), validateUpdateFactura, ctrl.updateFactura);
router.patch('/:id/anular', validateAnular, ctrl.anular);
router.delete('/:id', ctrl.remove);

module.exports = router;
