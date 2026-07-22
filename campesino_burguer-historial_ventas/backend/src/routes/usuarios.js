const router = require('express').Router();
const ctrl = require('../controllers/usuariosController');
const { validateCreate, validateUpdate } = require('../validators/usuariosValidator');
const validate = require('../middlewares/validateRequest');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validateCreate, validate, ctrl.create);
router.put('/:id', validateUpdate, validate, ctrl.update);

module.exports = router;
