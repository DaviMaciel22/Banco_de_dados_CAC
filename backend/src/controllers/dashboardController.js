// src/controllers/dashboardController.js
const { getPool, sql } = require('../config/database');

// GET /api/dashboard/metricas
const getMetricas = async (req, res, next) => {
    try {
        const pool = await getPool();

        const [alertas, estoque, entradas, saidas, atividades] = await Promise.all([
            // Usa vw_produtos_em_falta que considera estoque_minimo por produto
            pool.request().query(
                `SELECT COUNT(*) AS total FROM vw_produtos_em_falta`
            ),
            pool.request().query(
                `SELECT ISNULL(SUM(quantidade_estoque), 0) AS total FROM Produto`
            ),
            pool.request().query(`
                SELECT COUNT(*) AS total FROM Entrada
                WHERE MONTH(data_compra) = MONTH(GETDATE())
                  AND YEAR(data_compra)  = YEAR(GETDATE())
            `),
            pool.request().query(`
                SELECT COUNT(*) AS total FROM Saida
                WHERE MONTH(data_saida) = MONTH(GETDATE())
                  AND YEAR(data_saida)  = YEAR(GETDATE())
            `),
            pool.request().query(`
                SELECT TOP 5
                    id_log, nome_tabela, acao,
                    id_registro_afetado, data_hora, usuario_banco
                FROM log_alteracoes
                ORDER BY data_hora DESC
            `),
        ]);

        return res.json({
            alertasMinimos:     alertas.recordset[0].total,
            totalEstoque:       estoque.recordset[0].total,
            entradasMes:        entradas.recordset[0].total,
            saidasMes:          saidas.recordset[0].total,
            atividadesRecentes: atividades.recordset,
        });
    } catch (err) { next(err); }
};

// GET /api/dashboard/resumo
const getResumo = async (req, res, next) => {
    try {
        const pool = await getPool();

        const [fornecedores, funcionarios, setores, categorias] = await Promise.all([
            pool.request().query('SELECT COUNT(*) AS total FROM Fornecedor'),
            pool.request().query('SELECT COUNT(*) AS total FROM Funcionario'),
            pool.request().query('SELECT COUNT(*) AS total FROM Setor'),
            pool.request().query('SELECT COUNT(*) AS total FROM Categoria'),
        ]);

        return res.json({
            totalFornecedores: fornecedores.recordset[0].total,
            totalFuncionarios: funcionarios.recordset[0].total,
            totalSetores:      setores.recordset[0].total,
            totalCategorias:   categorias.recordset[0].total,
        });
    } catch (err) { next(err); }
};

module.exports = { getMetricas, getResumo };
