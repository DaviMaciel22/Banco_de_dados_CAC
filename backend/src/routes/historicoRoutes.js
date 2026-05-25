// src/routes/historicoRoutes.js
const { Router } = require('express');
const ctrl = require('../controllers/historicoController');
const router = Router();
router.get('/', ctrl.getAll);
module.exports = router;
