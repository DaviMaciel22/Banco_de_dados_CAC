// src/middlewares/validate.js
// Middleware genérico de validação com Joi
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        const mensagens = error.details.map(d => d.message.replace(/"/g, ''));
        return res.status(422).json({ error: 'Dados inválidos.', detalhes: mensagens });
    }

    next();
};

module.exports = validate;
