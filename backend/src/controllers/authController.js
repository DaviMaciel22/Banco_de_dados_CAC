// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { getPool, sql } = require('../config/database');

// POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, senha } = req.body;
        const pool = await getPool();

        // Busca usuário pelo email (parametrizado — sem injeção SQL)
        const result = await pool.request()
            .input('email', sql.VarChar(100), email)
            .query(`SELECT id_usuario, nome, email, senha, perfil, ativo
                    FROM Usuarios WHERE email = @email`);

        const usuario = result.recordset[0];

        // Usuário não encontrado OU inativo
        if (!usuario || !usuario.ativo) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Compara a senha com o hash (seguro contra timing attacks)
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Atualiza último login
        await pool.request()
            .input('id', sql.BigInt, usuario.id_usuario)
            .query('UPDATE Usuarios SET ultimo_login = GETDATE() WHERE id_usuario = @id');

        // Gera JWT com payload mínimo (sem dados sensíveis)
        const token = jwt.sign(
            { id: usuario.id_usuario, nome: usuario.nome, perfil: usuario.perfil },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        return res.json({
            token,
            usuario: {
                id:     usuario.id_usuario,
                nome:   usuario.nome,
                email:  usuario.email,
                perfil: usuario.perfil,
            },
        });

    } catch (err) {
        next(err);
    }
};

// GET /api/auth/me  — retorna dados do usuário logado (via token)
const me = async (req, res, next) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.BigInt, req.usuario.id)
            .query('SELECT id_usuario, nome, email, perfil, criado_em, ultimo_login FROM Usuarios WHERE id_usuario = @id');

        if (!result.recordset[0]) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        return res.json(result.recordset[0]);
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/alterar-senha
const alterarSenha = async (req, res, next) => {
    try {
        const { senhaAtual, novaSenha } = req.body;
        const pool = await getPool();

        const result = await pool.request()
            .input('id', sql.BigInt, req.usuario.id)
            .query('SELECT senha FROM Usuarios WHERE id_usuario = @id');

        const usuario = result.recordset[0];
        const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);

        if (!senhaCorreta) {
            return res.status(400).json({ error: 'Senha atual incorreta.' });
        }

        const novoHash = await bcrypt.hash(novaSenha, 10);
        await pool.request()
            .input('hash', sql.VarChar(255), novoHash)
            .input('id',   sql.BigInt,      req.usuario.id)
            .query('UPDATE Usuarios SET senha = @hash WHERE id_usuario = @id');

        return res.json({ message: 'Senha alterada com sucesso!' });
    } catch (err) {
        next(err);
    }
};

// PUT /api/auth/perfil — usuário edita os próprios dados
const atualizarPerfil = async (req, res, next) => {
    try {
        const { nome, email } = req.body;
        if (!nome || !email) return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });

        const pool = await getPool();

        // Verifica se e-mail já está em uso por outro usuário
        const dup = await pool.request()
            .input('email', sql.VarChar(100), email)
            .input('id',    sql.BigInt,        req.usuario.id)
            .query('SELECT id_usuario FROM Usuarios WHERE email = @email AND id_usuario != @id');

        if (dup.recordset.length > 0)
            return res.status(409).json({ error: 'Este e-mail já está em uso por outro usuário.' });

        await pool.request()
            .input('id',    sql.BigInt,        req.usuario.id)
            .input('nome',  sql.VarChar(100),   nome)
            .input('email', sql.VarChar(100),   email)
            .query('UPDATE Usuarios SET nome = @nome, email = @email WHERE id_usuario = @id');

        return res.json({ message: 'Perfil atualizado!', nome, email });
    } catch (err) { next(err); }
};

module.exports = { login, me, alterarSenha, atualizarPerfil };
