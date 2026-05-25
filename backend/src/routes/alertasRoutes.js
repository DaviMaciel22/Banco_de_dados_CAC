// src/routes/alertasRoutes.js
const { Router } = require('express');
const { getAll } = require('../controllers/alertasController');
const router = Router();
router.get('/', getAll);
module.exports = router;
