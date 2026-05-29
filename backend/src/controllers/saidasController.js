// src/controllers/saidasController.js
const { getPool, sql } = require('../config/database');

const getAll = async (req, res, next) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT sa.id_saida, sa.fkproduto, sa.fksetor,
                   sa.data_saida, sa.valor_saida, sa.quantidade_venda,
                   p.nome AS nome_produto, s.nome_setor
            FROM Saida sa
            INNER JOIN Produto p ON sa.fkproduto = p.id_produto
            INNER JOIN Setor   s ON sa.fksetor   = s.id_setor
            ORDER BY sa.data_saida DESC
        `);
        return res.json(result.recordset);
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    try {
        const { fkproduto, fksetor, data_saida, valor_saida, quantidade_venda } = req.body;
        const pool = await getPool();

        // Verifica estoque disponível antes de inserir
        const estoqueResult = await pool.request()
            .input('fkproduto', sql.BigInt, fkproduto)
            .query('SELECT quantidade_estoque FROM Produto WHERE id_produto = @fkproduto');

        const saldo = estoqueResult.recordset[0]?.quantidade_estoque ?? 0;
        if (saldo < quantidade_venda) {
            return res.status(400).json({
                error: `Estoque insuficiente. Saldo disponível: ${saldo} unidade(s).`
            });
        }

        // INSERT direto — o trigger de estoque cuida de descontar automaticamente
        await pool.request()
            .input('fkproduto',       sql.BigInt,        fkproduto)
            .input('fksetor',         sql.BigInt,        fksetor)
            .input('data_saida',      sql.DateTime,      new Date(data_saida + 'T12:00:00'))
            .input('valor_saida',     sql.Numeric(18,2), valor_saida)
            .input('quantidade_venda',sql.Int,           quantidade_venda)
            .query(`
                INSERT INTO Saida (fkproduto, fksetor, data_saida, valor_saida, quantidade_venda)
                VALUES (@fkproduto, @fksetor, @data_saida, @valor_saida, @quantidade_venda)
            `);

        await req.registrarLog?.('Saida', 'INSERT', 0);
        return res.status(201).json({ message: 'Saída registrada! Estoque descontado.' });
    } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id_saida', sql.BigInt, req.params.id)
            .execute('sp_deletar_saida');
        await req.registrarLog?.('Saida', 'DELETE', req.params.id);
        return res.json({ message: 'Saída excluída!' });
    } catch (err) { next(err); }
};

module.exports = { getAll, create, remove };
