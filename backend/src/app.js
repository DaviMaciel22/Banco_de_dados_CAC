// src/app.js — Configuração do Express
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const routes   = require('./routes/index');
const errorHandler   = require('./middlewares/errorHandler');
const sessionContext = require('./middlewares/sessionContext');

const app = express();

// ── Segurança: cabeçalhos HTTP seguros ──────────────────────
app.use(helmet());

// ── CORS: só aceita requisições do seu front-end ─────────────
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Parse de JSON ────────────────────────────────────────────
app.use(express.json());

// ── Log de requisições (só em desenvolvimento) ───────────────
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// ── Rota de health check ─────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: '🚀 API CAC LTDA funcionando!' });
});

// ── Context de sessão (nome do usuário logado) ───────────────
app.use('/api', sessionContext);

// ── Todas as rotas da API ─────────────────────────────────────
app.use('/api', routes);

// ── Rota não encontrada ───────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Rota ${req.method} ${req.path} não encontrada.` });
});

// ── Tratamento centralizado de erros ─────────────────────────
app.use(errorHandler);

module.exports = app;
