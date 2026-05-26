// src/validators/authValidator.js
const Joi = require('joi');

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'E-mail inválido.',
        'any.required': 'E-mail é obrigatório.',
    }),
    senha: Joi.string().min(6).required().messages({
        'string.min': 'Senha deve ter no mínimo 6 caracteres.',
        'any.required': 'Senha é obrigatória.',
    }),
});

const alterarSenhaSchema = Joi.object({
    senhaAtual: Joi.string().required(),
    novaSenha:  Joi.string().min(6).required().messages({
        'string.min': 'Nova senha deve ter no mínimo 6 caracteres.',
    }),
});

module.exports = { loginSchema, alterarSenhaSchema };