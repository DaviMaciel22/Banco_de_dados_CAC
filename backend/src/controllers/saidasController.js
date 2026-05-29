// src/controllers/saidasController.js
const { getPool, sql } = require('../config/database');

const getAll = async (req, res, next) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT sa.id_saida, sa.fkproduto, sa.fksetor,
                   sa.data_saida, sa.valor_saida, sa.quantidade_venda,
                   sa.numero_nota_fiscal,
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
        const { fkproduto, fksetor, data_saida, valor_saida,
                quantidade_venda, numero_nota_fiscal } = req.body;
        const pool = await getPool();

        await pool.request()
            .input('id_saida',           sql.BigInt,       null)
            .input('fkproduto',          sql.BigInt,       fkproduto)
            .input('fksetor',            sql.BigInt,       fksetor)
            .input('data_saida',         sql.DateTime,     new Date(data_saida + 'T12:00:00'))
            .input('valor_saida',        sql.Numeric(18,2),valor_saida)
            .input('quantidade_produto', sql.Int,          quantidade_venda)
            .input('numero_nota_fiscal', sql.VarChar(50),  numero_nota_fiscal || null)
            .execute('sp_inserir_atualizar_saida');

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
