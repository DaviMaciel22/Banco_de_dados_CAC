// src/controllers/historicoController.js
const { getPool, sql } = require('../config/database');

const getAll = async (req, res, next) => {
    try {
        const pool = await getPool();
        const { tabela, acao, pagina = 1, limite = 500 } = req.query;
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        let where = 'WHERE 1=1';
        const request = pool.request();

        if (tabela) { where += ' AND nome_tabela = @tabela'; request.input('tabela', sql.VarChar(100), tabela); }
        if (acao)   { where += ' AND acao = @acao';         request.input('acao',   sql.VarChar(20),  acao.toUpperCase()); }

        request.input('limite', sql.Int, parseInt(limite));
        request.input('offset', sql.Int, offset);

        const result = await request.query(`
            SELECT
                id_log,
                nome_tabela,
                acao,
                id_registro_afetado,
                -- Retorna dois campos separados, já formatados
                CONVERT(VARCHAR(10), data_hora, 103) AS data_formatada,
                CONVERT(VARCHAR(5),  data_hora, 108) AS hora_formatada,
                ISNULL(usuario_app, usuario_banco)   AS usuario_exibicao,
                usuario_banco,
                usuario_app
            FROM log_alteracoes
            ${where}
            ORDER BY data_hora DESC
            OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY
        `);

        const countResult = await pool.request()
            .query(`SELECT COUNT(*) AS total FROM log_alteracoes ${where}`);

        return res.json({
            dados:        result.recordset,
            total:        countResult.recordset[0].total,
            pagina:       parseInt(pagina),
            totalPaginas: Math.ceil(countResult.recordset[0].total / parseInt(limite)),
        });
    } catch (err) { next(err); }
};

module.exports = { getAll };
