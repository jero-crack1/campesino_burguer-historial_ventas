const router = require('express').Router();
const ctrl = require('../controllers/ventasController');
const { validateCreate, validateUpdateFactura } = require('../validators/ventasValidator');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validateCreate, ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/factura', validateUpdateFactura, ctrl.updateFactura);
router.delete('/:id', ctrl.remove);

module.exports = router;
