const router = require('express').Router();
const ctrl = require('../controllers/recetasController');
const { validateCreate, validateUpdate } = require('../validators/recetasValidator');
const validate = require('../middlewares/validateRequest');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validateCreate, validate, ctrl.create);
router.put('/:id', validateUpdate, validate, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
