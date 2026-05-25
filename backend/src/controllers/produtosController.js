// src/controllers/produtosController.js
const { getPool, sql } = require('../config/database');

const getAll = async (req, res, next) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT p.id_produto, p.nome, p.descricao, p.status1,
                   p.quantidade_estoque, p.estoque_minimo, p.preco_compra,
                   p.preco_medio, p.fkcategoria, c.nome_categoria
            FROM Produto p
            LEFT JOIN Categoria c ON p.fkcategoria = c.id_categoria
            ORDER BY p.nome
        `);
        return res.json(result.recordset);
    } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.BigInt, req.params.id)
            .query(`SELECT p.*, c.nome_categoria FROM Produto p
                    LEFT JOIN Categoria c ON p.fkcategoria = c.id_categoria
                    WHERE p.id_produto = @id`);
        if (!result.recordset[0]) return res.status(404).json({ error: 'Produto não encontrado.' });
        return res.json(result.recordset[0]);
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    try {
        const { fkcategoria, quantidade_estoque, preco_compra, descricao, nome, estoque_minimo } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('id_produto',         sql.BigInt,        null)
            .input('fkcategoria',        sql.BigInt,        fkcategoria)
            .input('status1',            sql.VarChar(50),   'Ativo')
            .input('quantidade_estoque', sql.Int,           quantidade_estoque)
            .input('preco_compra',       sql.Numeric(18,2), preco_compra)
            .input('descricao',          sql.VarChar(200),  descricao)
            .input('nome',               sql.VarChar(50),   nome)
            .input('estoque_minimo',     sql.Int,           estoque_minimo || 20)
            .execute('sp_inserir_atualizar_produto');

        // Busca o novo ID para o log
        const novo = await pool.request()
            .input('nome', sql.VarChar(50), nome)
            .query('SELECT TOP 1 id_produto FROM Produto WHERE nome = @nome ORDER BY id_produto DESC');
        await req.registrarLog?.('Produto', 'INSERT', novo.recordset[0]?.id_produto || 0);

        return res.status(201).json({ message: 'Produto cadastrado!' });
    } catch (err) { next(err); }
};

const update = async (req, res, next) => {
    try {
        const { fkcategoria, status1, quantidade_estoque, preco_compra, descricao, nome, estoque_minimo } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('id_produto',         sql.BigInt,        req.params.id)
            .input('fkcategoria',        sql.BigInt,        fkcategoria)
            .input('status1',            sql.VarChar(50),   status1)
            .input('quantidade_estoque', sql.Int,           quantidade_estoque)
            .input('preco_compra',       sql.Numeric(18,2), preco_compra)
            .input('descricao',          sql.VarChar(200),  descricao)
            .input('nome',               sql.VarChar(50),   nome)
            .input('estoque_minimo',     sql.Int,           estoque_minimo || 20)
            .execute('sp_inserir_atualizar_produto');

        await req.registrarLog?.('Produto', 'UPDATE', req.params.id);
        return res.json({ message: 'Produto atualizado!' });
    } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id_produto', sql.BigInt, req.params.id)
            .execute('sp_deletar_produto');
        await req.registrarLog?.('Produto', 'DELETE', req.params.id);
        return res.json({ message: 'Produto excluído!' });
    } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
