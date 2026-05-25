// src/controllers/contatosController.js
// Gerencia telefones e endereços de fornecedores e funcionários
const { getPool, sql } = require('../config/database');

// ── FORNECEDOR ────────────────────────────────────────────────

// GET /api/fornecedores/:id/contatos
const getContatosFornecedor = async (req, res, next) => {
    try {
        const pool = await getPool();
        const id   = req.params.id;

        const [telefones, enderecos] = await Promise.all([
            pool.request()
                .input('id', sql.BigInt, id)
                .query('SELECT * FROM Telefone_Fornecedor WHERE fkfornecedor = @id ORDER BY id_telefone_for'),
            pool.request()
                .input('id', sql.BigInt, id)
                .query('SELECT * FROM Endereco_Fornecedor WHERE fkfornecedor = @id ORDER BY id_end_forn'),
        ]);

        return res.json({ telefones: telefones.recordset, enderecos: enderecos.recordset });
    } catch (err) { next(err); }
};

// POST /api/fornecedores/:id/telefones
const addTelefoneFornecedor = async (req, res, next) => {
    try {
        const { telefone } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('fkfornecedor', sql.BigInt,     req.params.id)
            .input('telefone',     sql.VarChar(15), telefone)
            .execute('sp_inserir_telefone_fornecedor');
        return res.status(201).json({ message: 'Telefone adicionado!' });
    } catch (err) { next(err); }
};

// DELETE /api/fornecedores/:id/telefones/:idTel
const deleteTelefoneFornecedor = async (req, res, next) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id_telefone_for', sql.BigInt, req.params.idTel)
            .execute('sp_deletar_telefone_fornecedor');
        return res.json({ message: 'Telefone removido!' });
    } catch (err) { next(err); }
};

// POST /api/fornecedores/:id/enderecos
const saveEnderecoFornecedor = async (req, res, next) => {
    try {
        const { id_end_forn, rua, cep, cidade, numero } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('id_end_forn',  sql.BigInt,      id_end_forn || 0)
            .input('fkfornecedor', sql.BigInt,      req.params.id)
            .input('rua',          sql.VarChar(255), rua)
            .input('cep',          sql.VarChar(9),   cep)
            .input('cidade',       sql.VarChar(255), cidade)
            .input('numero',       sql.Int,          parseInt(numero))
            .execute('sp_inserir_atualizar_endereco_fornecedor');
        return res.status(201).json({ message: 'Endereço salvo!' });
    } catch (err) { next(err); }
};

// DELETE /api/fornecedores/:id/enderecos/:idEnd
const deleteEnderecoFornecedor = async (req, res, next) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id_end_forn', sql.BigInt, req.params.idEnd)
            .execute('sp_deletar_endereco_fornecedor');
        return res.json({ message: 'Endereço removido!' });
    } catch (err) { next(err); }
};

// ── FUNCIONÁRIO ───────────────────────────────────────────────

// GET /api/funcionarios/:id/contatos
const getContatosFuncionario = async (req, res, next) => {
    try {
        const pool = await getPool();
        const id   = req.params.id;

        const [telefones, enderecos] = await Promise.all([
            pool.request()
                .input('id', sql.BigInt, id)
                .query('SELECT * FROM Telefone_Funcionario WHERE fkfuncionario = @id ORDER BY id_telefone_fun'),
            pool.request()
                .input('id', sql.BigInt, id)
                .query('SELECT * FROM Endereco_Funcionario WHERE fkfuncionario = @id ORDER BY id_end_fun'),
        ]);

        return res.json({ telefones: telefones.recordset, enderecos: enderecos.recordset });
    } catch (err) { next(err); }
};

// POST /api/funcionarios/:id/telefones
const addTelefoneFuncionario = async (req, res, next) => {
    try {
        const { telefone } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('fkfuncionario', sql.BigInt,     req.params.id)
            .input('telefone',      sql.VarChar(15), telefone)
            .execute('sp_inserir_telefone_funcionario');
        return res.status(201).json({ message: 'Telefone adicionado!' });
    } catch (err) { next(err); }
};

// DELETE /api/funcionarios/:id/telefones/:idTel
const deleteTelefoneFuncionario = async (req, res, next) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id_telefone_fun', sql.BigInt, req.params.idTel)
            .execute('sp_deletar_telefone_funcionario');
        return res.json({ message: 'Telefone removido!' });
    } catch (err) { next(err); }
};

// POST /api/funcionarios/:id/enderecos
const saveEnderecoFuncionario = async (req, res, next) => {
    try {
        const { id_end_fun, rua, cep, cidade, numero } = req.body;
        const pool = await getPool();
        await pool.request()
            .input('id_end_fun',    sql.BigInt,      id_end_fun || 0)
            .input('fkfuncionario', sql.BigInt,      req.params.id)
            .input('rua',           sql.VarChar(255), rua)
            .input('cep',           sql.VarChar(9),   cep)
            .input('cidade',        sql.VarChar(255), cidade)
            .input('numero',        sql.Int,          parseInt(numero))
            .execute('sp_inserir_atualizar_endereco_funcionario');
        return res.status(201).json({ message: 'Endereço salvo!' });
    } catch (err) { next(err); }
};

// DELETE /api/funcionarios/:id/enderecos/:idEnd
const deleteEnderecoFuncionario = async (req, res, next) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id_end_fun', sql.BigInt, req.params.idEnd)
            .execute('sp_deletar_endereco_funcionario');
        return res.json({ message: 'Endereço removido!' });
    } catch (err) { next(err); }
};

module.exports = {
    getContatosFornecedor,
    addTelefoneFornecedor, deleteTelefoneFornecedor,
    saveEnderecoFornecedor, deleteEnderecoFornecedor,
    getContatosFuncionario,
    addTelefoneFuncionario, deleteTelefoneFuncionario,
    saveEnderecoFuncionario, deleteEnderecoFuncionario,
};
