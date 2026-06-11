const router = require('express').Router();
const authController = require('../controllers/authController');
const { loginRules } = require('../validators/auth');

router.post('/login', loginRules, authController.login);

module.exports = router;
