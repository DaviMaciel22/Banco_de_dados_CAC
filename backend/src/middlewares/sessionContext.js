// src/middlewares/sessionContext.js
// Anexa req.registrarLog em TODAS as rotas (autenticadas ou não)
// A verificação de req.usuario é feita na hora da chamada, não do middleware
// — assim funciona corretamente com connection pooling e authMiddleware por rota

const { getPool, sql } = require('../config/database');

const sessionContext = (req, res, next) => {
    req.registrarLog = async (nomeTabela, acao, idRegistro) => {
        // req.usuario é preenchido pelo authMiddleware antes dos controllers
        if (!req.usuario?.nome) return;

        try {
            const pool = await getPool();
            await pool.request()
                .input('nome_tabela', sql.VarChar(100), nomeTabela)
                .input('acao',        sql.VarChar(20),  acao)
                .input('id_registro', sql.BigInt,        Number(idRegistro) || 0)
                .input('usuario_app', sql.VarChar(100),  req.usuario.nome)
                .execute('sp_registrar_log');
        } catch (e) {
            // Falha silenciosa — log nunca deve quebrar a operação principal
            console.error('⚠️  Erro ao registrar log:', e.message);
        }
    };
    next();
};

module.exports = sessionContext;
