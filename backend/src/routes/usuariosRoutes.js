// src/routes/usuariosRoutes.js
const { Router } = require('express');
const { getAll, create, update, remove, resetarSenha } = require('../controllers/usuariosController');
const router = Router();
router.get   ('/',                 getAll);
router.post  ('/',                 create);
router.put   ('/:id',              update);
router.delete('/:id',             remove);
router.put   ('/:id/resetar-senha', resetarSenha);
module.exports = router;