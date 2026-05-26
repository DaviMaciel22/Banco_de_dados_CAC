// src/controllers/alertasController.js
const { getPool, sql } = require('../config/database');

const getAll = async (req, res, next) => {
    try {
        const pool = await getPool();

        const cfgResult = await pool.request().query(`
            SELECT chave, valor FROM Configuracoes
            WHERE chave IN ('notif_estoque_critico', 'sistema_estoque_minimo')
        `);
        const cfg = {};
        cfgResult.recordset.forEach(r => { cfg[r.chave] = r.valor; });

        const notifAtiva     = cfg.notif_estoque_critico !== '0';
        const estoqueMinGlobal = parseInt(cfg.sistema_estoque_minimo) || 20;

        // Usa a view — retorna saldo_atual, produto, grupo, estoque_minimo, situacao
        const result = await pool.request().query(`
            SELECT
                id_produto,
                produto         AS nome,
                grupo           AS nome_categoria,
                saldo_atual     AS quantidade_estoque,
                estoque_minimo,
                diferenca,
                situacao,
                ultimo_fornecedor
            FROM vw_produtos_em_falta
            ORDER BY saldo_atual ASC, produto ASC
        `);

        const alertas = result.recordset.map(a => ({
            ...a,
            severidade: a.quantidade_estoque === 0 || a.quantidade_estoque <= (a.estoque_minimo / 2)
                ? 'critico' : 'atencao',
        }));

        return res.json({
            notificacoesAtivas: notifAtiva,
            estoqueMinGlobal,
            totais: {
                criticos: alertas.filter(a => a.severidade === 'critico').length,
                atencao:  alertas.filter(a => a.severidade === 'atencao').length,
                total:    alertas.length,
            },
            alertas,
        });
    } catch (err) { next(err); }
};

module.exports = { getAll };
