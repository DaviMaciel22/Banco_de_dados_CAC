// src/routes/funcionariosRoutes.js
const { Router } = require('express');
const ctrl = require('../controllers/funcionariosController');
const router = Router();
router.get   ('/',    ctrl.getAll);
router.post  ('/',    ctrl.create);
router.put   ('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
module.exports = router;

