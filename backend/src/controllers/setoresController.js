// src/controllers/setoresController.js
const { getPool, sql } = require('../config/database');

const getAll = async (req, res, next) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT id_setor, nome_setor, numero_funcionarios
            FROM Setor ORDER BY nome_setor
        `);
        return res.json(result.recordset);
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    try {
        const { nome_setor, numero_funcionarios } = req.body;
        const pool = await getPool();
        // Atenção: a stored proc tem o parâmetro como @nome_sertor (typo original)
        await pool.request()
            .input('id_setor',           sql.BigInt, 0)
            .input('nome_sertor',        sql.VarChar(50), nome_setor)
            .input('numero_funcionarios', sql.Int,   numero_funcionarios || 0)
            .execute('sp_inserir_atualizar_setor');
        await req.registrarLog?.('Setor', 'INSERT', 0);
        return res.status(201).json({ message: 'Setor criado!' });
    } catch (err) { next(err); }
};

const update = async (req, res, next) => {
    try {
        const { nome_setor, numero_funcionarios } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('id_setor',            sql.BigInt,      req.params.id)
            .input('nome_sertor',         sql.VarChar(50), nome_setor)
            .input('numero_funcionarios', sql.Int,         numero_funcionarios || 0)
            .execute('sp_inserir_atualizar_setor');
        await req.registrarLog?.('Setor', 'UPDATE', req.params.id);
        return res.json({ message: 'Setor atualizado!' });
    } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id_setor', sql.BigInt, req.params.id)
            .execute('sp_deletar_setor');
        await req.registrarLog?.('Setor', 'DELETE', req.params.id);
        return res.json({ message: 'Setor excluído!' });
    } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove };
