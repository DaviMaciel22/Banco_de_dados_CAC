// src/routes/dashboardRoutes.js
const { Router } = require('express');
const { getMetricas, getResumo } = require('../controllers/dashboardController');
const router = Router();
router.get('/metricas', getMetricas);
router.get('/resumo',   getResumo);
module.exports = router;
