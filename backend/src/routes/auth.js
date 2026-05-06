const router = require('express').Router();
const { register, login, getMe } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../utils/validators');
const { requireAuth } = require('../middleware/auth');

router.post('/register', registerValidator, register);
router.post('/login',    loginValidator,    login);
router.get('/me',        requireAuth,       getMe);

module.exports = router;