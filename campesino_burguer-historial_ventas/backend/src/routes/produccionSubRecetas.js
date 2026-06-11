const router = require('express').Router();
const ctrl = require('../controllers/produccionSubRecetasController');
const { validateCreate } = require('../validators/produccionValidator');
const validate = require('../middlewares/validateRequest');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', [
  ...validateCreate,
  require('express-validator').body('sub_receta_id').isInt({ min: 1 }),
], validate, ctrl.create);

module.exports = router;
