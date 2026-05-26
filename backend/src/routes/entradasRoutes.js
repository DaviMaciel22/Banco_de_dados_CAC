// src/routes/entradasRoutes.js
const { Router } = require('express');
const ctrl = require('../controllers/entradasController');
const router = Router();
router.get   ('/',    ctrl.getAll);
router.post  ('/',    ctrl.create);
router.delete('/:id', ctrl.remove);
module.exports = router;
