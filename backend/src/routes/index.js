// src/routes/index.js — Agrupador central de todas as rotas
const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const authRoutes         = require('./authRoutes');
const dashboardRoutes    = require('./dashboardRoutes');
const produtosRoutes     = require('./produtosRoutes');
const fornecedoresRoutes = require('./fornecedoresRoutes');
const categoriasRoutes   = require('./categoriasRoutes');
const setoresRoutes      = require('./setoresRoutes');
const funcionariosRoutes = require('./funcionariosRoutes');
const entradasRoutes     = require('./entradasRoutes');
const saidasRoutes       = require('./saidasRoutes');
const historicoRoutes     = require('./historicoRoutes');
const configuracoesRoutes = require('./configuracoesRoutes');
const alertasRoutes       = require('./alertasRoutes');
const relatoriosRoutes    = require('./relatoriosRoutes');
const contatosRoutes      = require('./contatosRoutes');
const usuariosRoutes      = require('./usuariosRoutes');

const router = Router();

// Rota pública
router.use('/auth', authRoutes);

// Rotas protegidas por JWT (todas as demais)
router.use(authMiddleware);
router.use('/dashboard',    dashboardRoutes);
router.use('/produtos',     produtosRoutes);
router.use('/fornecedores', fornecedoresRoutes);
router.use('/categorias',   categoriasRoutes);
router.use('/setores',      setoresRoutes);
router.use('/funcionarios', funcionariosRoutes);
router.use('/entradas',     entradasRoutes);
router.use('/saidas',       saidasRoutes);
router.use('/historico',     historicoRoutes);
router.use('/configuracoes', configuracoesRoutes);
router.use('/alertas',       alertasRoutes);
router.use('/relatorios',    relatoriosRoutes);

// Contatos (telefones/endereços) — montados diretamente em /api
router.use('/', contatosRoutes);
router.use('/usuarios',      usuariosRoutes);

module.exports = router;
