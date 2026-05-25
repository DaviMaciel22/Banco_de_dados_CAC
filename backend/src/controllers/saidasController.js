// src/controllers/saidasController.js
const { getPool, sql } = require('../config/database');

const getAll = async (req, res, next) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT s.id_saida, s.data_saida, s.valor_saida, s.quantidade_venda,
                   p.nome AS nome_produto,
                   se.nome_setor,
                   s.fkproduto, s.fksetor
            FROM Saida s
            LEFT JOIN Produto p  ON s.fkproduto = p.id_produto
            LEFT JOIN Setor   se ON s.fksetor   = se.id_setor
            ORDER BY s.data_saida DESC
        `);
        return res.json(result.recordset);
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    try {
        const { fkproduto, fksetor, data_saida, valor_saida, quantidade_produto } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('id_saida',           sql.BigInt,       0)
            .input('fkproduto',          sql.BigInt,       fkproduto)
            .input('fksetor',            sql.BigInt,       fksetor)
            .input('data_saida',         sql.DateTime,     new Date(data_saida))
            .input('valor_saida',        sql.Numeric(18,2), valor_saida)
            .input('quantidade_produto', sql.Int,          quantidade_produto)
            .execute('sp_inserir_atualizar_saida');
        await req.registrarLog?.('Saida', 'INSERT', 0);
        return res.status(201).json({ message: 'Saída registrada! Estoque atualizado automaticamente.' });
    } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id_saida', sql.BigInt, req.params.id)
            .execute('sp_deletar_saida');
        await req.registrarLog?.('Saida', 'DELETE', req.params.id);
        return res.json({ message: 'Saída excluída! Estoque revertido automaticamente.' });
    } catch (err) { next(err); }
};

module.exports = { getAll, create, remove };
