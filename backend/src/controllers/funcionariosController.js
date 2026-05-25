// src/controllers/funcionariosController.js
const { getPool, sql } = require('../config/database');

const getAll = async (req, res, next) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT f.id_funcionario, f.nome_funcionario, f.tipo_funcionario,
                   f.fksetor, s.nome_setor
            FROM Funcionario f
            LEFT JOIN Setor s ON f.fksetor = s.id_setor
            ORDER BY f.nome_funcionario
        `);
        return res.json(result.recordset);
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    try {
        const { fksetor, nome_funcionario, tipo_funcionario } = req.body;
        const pool = await getPool();

        await pool.request()
            .input('idfuncionario',    sql.BigInt,      0)
            .input('fksetor',          sql.BigInt,      fksetor)
            .input('nome_funcionario', sql.VarChar(50), nome_funcionario)
            .input('tipo_funcionario', sql.VarChar(50), tipo_funcionario)
            .execute('sp_inserir_atualizar_funcionario');

        // Busca o ID recém-criado pelo nome + setor
        const novo = await pool.request()
            .input('nome', sql.VarChar(50), nome_funcionario)
            .input('setor', sql.BigInt, fksetor)
            .query(`SELECT TOP 1 id_funcionario FROM Funcionario
                    WHERE nome_funcionario = @nome AND fksetor = @setor
                    ORDER BY id_funcionario DESC`);

        const novoId = novo.recordset[0]?.id_funcionario || null;

        await req.registrarLog?.('Funcionario', 'INSERT', 0);
        return res.status(201).json({ message: 'Funcionário cadastrado!', id: novoId });
    } catch (err) { next(err); }
};

const update = async (req, res, next) => {
    try {
        const { fksetor, nome_funcionario, tipo_funcionario } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('idfuncionario',    sql.BigInt,      req.params.id)
            .input('fksetor',          sql.BigInt,      fksetor)
            .input('nome_funcionario', sql.VarChar(50), nome_funcionario)
            .input('tipo_funcionario', sql.VarChar(50), tipo_funcionario)
            .execute('sp_inserir_atualizar_funcionario');
        await req.registrarLog?.('Funcionario', 'UPDATE', req.params.id);
        return res.json({ message: 'Funcionário atualizado!', id: parseInt(req.params.id) });
    } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id_funcionario', sql.BigInt, req.params.id)
            .execute('sp_deletar_funcionario');
        await req.registrarLog?.('Funcionario', 'DELETE', req.params.id);
        return res.json({ message: 'Funcionário excluído!' });
    } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove };
