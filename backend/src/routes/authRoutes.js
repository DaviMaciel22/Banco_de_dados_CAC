// src/routes/authRoutes.js
const { Router } = require('express');
const { login, me, alterarSenha, atualizarPerfil } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { loginSchema, alterarSenhaSchema } = require('../validators/authValidator');

const router = Router();
router.post('/login',          validate(loginSchema),        login);
router.get ('/me',             authMiddleware,               me);
router.put ('/alterar-senha',  authMiddleware, validate(alterarSenhaSchema), alterarSenha);
router.put('/perfil', authMiddleware, atualizarPerfil);
module.exports = router;
