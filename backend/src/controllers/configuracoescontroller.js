// src/controllers/configuracoesController.js
const { getPool, sql } = require('../config/database');

// GET /api/configuracoes — retorna todas as configurações como objeto
const getAll = async (req, res, next) => {
    try {
        const pool   = await getPool();
        const result = await pool.request().query('SELECT chave, valor FROM Configuracoes');

        // Transforma array de {chave, valor} em objeto simples { chave: valor }
        const config = {};
        result.recordset.forEach(row => { config[row.chave] = row.valor; });

        return res.json(config);
    } catch (err) { next(err); }
};

// PUT /api/configuracoes — salva um conjunto de chaves
// Body: { "empresa_razao_social": "CAC LTDA", "empresa_cnpj": "..." }
const saveMany = async (req, res, next) => {
    try {
        const pool    = await getPool();
        const entries = Object.entries(req.body);

        if (!entries.length) {
            return res.status(400).json({ error: 'Nenhuma configuração enviada.' });
        }

        // Upsert de cada chave (MERGE = INSERT ou UPDATE automático)
        for (const [chave, valor] of entries) {
            await pool.request()
                .input('chave', sql.VarChar(100), chave)
                .input('valor', sql.VarChar(500), String(valor))
                .query(`
                    MERGE Configuracoes AS alvo
                    USING (SELECT @chave AS chave, @valor AS valor) AS origem
                    ON alvo.chave = origem.chave
                    WHEN MATCHED THEN
                        UPDATE SET valor = origem.valor, atualizado_em = GETDATE()
                    WHEN NOT MATCHED THEN
                        INSERT (chave, valor) VALUES (origem.chave, origem.valor);
                `);
        }

        return res.json({ message: 'Configurações salvas com sucesso!' });
    } catch (err) { next(err); }
};

module.exports = { getAll, saveMany };