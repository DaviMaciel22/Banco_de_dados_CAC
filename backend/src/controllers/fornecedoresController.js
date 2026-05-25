// src/controllers/fornecedoresController.js
const { getPool, sql } = require('../config/database');

const getAll = async (req, res, next) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT * FROM Fornecedor ORDER BY razao_social');
        return res.json(result.recordset);
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    try {
        const { cnpj, email, razao_social } = req.body;
        const pool = await getPool();

        await pool.request()
            .input('id_fornecedor', sql.BigInt,      0)
            .input('cnpj',         sql.VarChar(18),  cnpj)
            .input('email',        sql.VarChar(100), email)
            .input('razao_social', sql.VarChar(100), razao_social)
            .execute('sp_inserir_atualizar_fornecedor');

        // Busca o ID recém-criado pelo CNPJ (único)
        const novo = await pool.request()
            .input('cnpj', sql.VarChar(18), cnpj)
            .query('SELECT id_fornecedor FROM Fornecedor WHERE cnpj = @cnpj');

        const novoId = novo.recordset[0]?.id_fornecedor || null;

        return res.status(201).json({
            message: 'Fornecedor cadastrado!',
            id: novoId,
        });
    } catch (err) { next(err); }
};

const update = async (req, res, next) => {
    try {
        const { cnpj, email, razao_social } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('id_fornecedor', sql.BigInt,      req.params.id)
            .input('cnpj',         sql.VarChar(18),  cnpj)
            .input('email',        sql.VarChar(100), email)
            .input('razao_social', sql.VarChar(100), razao_social)
            .execute('sp_inserir_atualizar_fornecedor');
        await req.registrarLog?.('Fornecedor', 'UPDATE', req.params.id);
        return res.json({ message: 'Fornecedor atualizado!', id: parseInt(req.params.id) });
    } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id_fornecedor', sql.BigInt, req.params.id)
            .execute('sp_deletar_fornecedor');
        await req.registrarLog?.('Fornecedor', 'DELETE', req.params.id);
        return res.json({ message: 'Fornecedor excluído!' });
    } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove };
