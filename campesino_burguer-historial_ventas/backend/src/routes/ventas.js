const router = require('express').Router();
const ctrl = require('../controllers/ventasController');
const { validateCreate } = require('../validators/ventasValidator');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validateCreate, ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;
