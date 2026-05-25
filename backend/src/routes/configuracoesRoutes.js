// src/routes/configuracoesRoutes.js
const { Router } = require('express');
const { getAll, saveMany } = require('../controllers/configuracoesController');
const router = Router();
router.get('/',  getAll);
router.put('/',  saveMany);
module.exports = router;