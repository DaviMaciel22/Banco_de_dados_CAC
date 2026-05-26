// src/controllers/categoriasController.js
const { getPool, sql } = require('../config/database');

const getAll = async (req, res, next) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT c.id_categoria, c.nome_categoria,
                   COUNT(p.id_produto) AS total_produtos
            FROM Categoria c
            LEFT JOIN Produto p ON p.fkcategoria = c.id_categoria
            GROUP BY c.id_categoria, c.nome_categoria
            ORDER BY c.nome_categoria
        `);
        return res.json(result.recordset);
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    try {
        const { nome_categoria } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('id_categoria',  sql.BigInt,     0)
            .input('nome_categoria', sql.VarChar(50), nome_categoria)
            .execute('sp_inserir_atualizar_categoria');
        await req.registrarLog?.('Categoria', 'INSERT', 0);
        return res.status(201).json({ message: 'Categoria criada!' });
    } catch (err) { next(err); }
};

const update = async (req, res, next) => {
    try {
        const { nome_categoria } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('id_categoria',  sql.BigInt,     req.params.id)
            .input('nome_categoria', sql.VarChar(50), nome_categoria)
            .execute('sp_inserir_atualizar_categoria');
        await req.registrarLog?.('Categoria', 'UPDATE', req.params.id);
        return res.json({ message: 'Categoria atualizada!' });
    } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id_categoria', sql.BigInt, req.params.id)
            .execute('sp_deletar_categoria');
        await req.registrarLog?.('Categoria', 'DELETE', req.params.id);
        return res.json({ message: 'Categoria excluída!' });
    } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove };
