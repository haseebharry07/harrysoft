const express = require('express');
const { login, register, me } = require('../controllers/authController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const router = express.Router();
router.post('/login', login);
router.post('/register', optionalProtect, register);
router.get('/me', protect, me);
module.exports = router;
