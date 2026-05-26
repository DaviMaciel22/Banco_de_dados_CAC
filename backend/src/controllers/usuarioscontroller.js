// src/controllers/usuariosController.js
const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/database');

// GET /api/usuarios
const getAll = async (req, res, next) => {
    try {
        const pool   = await getPool();
        const result = await pool.request().query(`
            SELECT id_usuario, nome, email, perfil, ativo, criado_em, ultimo_login
            FROM Usuarios
            ORDER BY nome
        `);
        return res.json(result.recordset);
    } catch (err) { next(err); }
};

// POST /api/usuarios
const create = async (req, res, next) => {
    try {
        const { nome, email, senha, perfil = 'operador' } = req.body;
        const pool = await getPool();

        // Verifica se e-mail já existe
        const existe = await pool.request()
            .input('email', sql.VarChar(100), email)
            .query('SELECT id_usuario FROM Usuarios WHERE email = @email');

        if (existe.recordset.length > 0) {
            return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' });
        }

        const hash = await bcrypt.hash(senha, 10);

        await pool.request()
            .input('nome',       sql.VarChar(100), nome)
            .input('email',      sql.VarChar(100), email)
            .input('senha_hash', sql.VarChar(255), hash)
            .input('perfil',     sql.VarChar(20),  perfil)
            .query(`
                INSERT INTO Usuarios (nome, email, senha_hash, perfil)
                VALUES (@nome, @email, @senha_hash, @perfil)
            `);

        return res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (err) { next(err); }
};

// PUT /api/usuarios/:id
const update = async (req, res, next) => {
    try {
        const { nome, email, perfil, ativo } = req.body;
        const pool = await getPool();

        // Não permite alterar o próprio perfil/status (proteção básica)
        if (req.usuario.id == req.params.id && (perfil || ativo !== undefined)) {
            return res.status(403).json({ error: 'Você não pode alterar seu próprio perfil ou status.' });
        }

        await pool.request()
            .input('id',     sql.BigInt,     req.params.id)
            .input('nome',   sql.VarChar(100), nome)
            .input('email',  sql.VarChar(100), email)
            .input('perfil', sql.VarChar(20),  perfil)
            .input('ativo',  sql.Bit,          ativo !== undefined ? ativo : 1)
            .query(`
                UPDATE Usuarios
                SET nome = @nome, email = @email, perfil = @perfil, ativo = @ativo
                WHERE id_usuario = @id
            `);

        return res.json({ message: 'Usuário atualizado!' });
    } catch (err) { next(err); }
};

// DELETE /api/usuarios/:id  — desativa em vez de excluir
const remove = async (req, res, next) => {
    try {
        // Não permite deletar a si mesmo
        if (req.usuario.id == req.params.id) {
            return res.status(403).json({ error: 'Você não pode excluir seu próprio usuário.' });
        }

        const pool = await getPool();
        await pool.request()
            .input('id', sql.BigInt, req.params.id)
            .query('UPDATE Usuarios SET ativo = 0 WHERE id_usuario = @id');

        return res.json({ message: 'Usuário desativado!' });
    } catch (err) { next(err); }
};

// PUT /api/usuarios/:id/resetar-senha  — admin reseta a senha de outro usuário
const resetarSenha = async (req, res, next) => {
    try {
        const { novaSenha } = req.body;

        if (!novaSenha || novaSenha.length < 6) {
            return res.status(400).json({ error: 'Nova senha deve ter ao menos 6 caracteres.' });
        }

        const hash = await bcrypt.hash(novaSenha, 10);
        const pool = await getPool();

        await pool.request()
            .input('hash', sql.VarChar(255), hash)
            .input('id',   sql.BigInt,       req.params.id)
            .query('UPDATE Usuarios SET senha_hash = @hash WHERE id_usuario = @id');

        return res.json({ message: 'Senha resetada com sucesso!' });
    } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove, resetarSenha };