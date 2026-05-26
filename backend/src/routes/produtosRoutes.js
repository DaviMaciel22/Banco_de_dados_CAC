// src/routes/produtosRoutes.js
const { Router } = require('express');
const ctrl = require('../controllers/produtosController');
const router = Router();
router.get   ('/',    ctrl.getAll);
router.get   ('/:id', ctrl.getById);
router.post  ('/',    ctrl.create);
router.put   ('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
module.exports = router;
