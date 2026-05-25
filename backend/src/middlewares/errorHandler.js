// src/middlewares/errorHandler.js
// Tratamento centralizado de erros — captura tudo que usa next(err)
const errorHandler = (err, req, res, next) => {
    console.error(`❌ [${new Date().toISOString()}] ${err.message}`);

    // Erro de Foreign Key ou Constraint do SQL Server
    if (err.number === 547) {
        return res.status(400).json({
            error: 'Não é possível excluir: este registro está vinculado a outros dados no sistema.'
        });
    }

    // Erro de valor duplicado (UNIQUE constraint)
    if (err.number === 2627 || err.number === 2601) {
        return res.status(409).json({
            error: 'Já existe um registro com esses dados (valor duplicado).'
        });
    }

    // Erro de conexão com o banco
    if (err.code === 'ELOGIN' || err.code === 'ETIMEOUT') {
        return res.status(503).json({
            error: 'Serviço de banco de dados indisponível. Tente novamente.'
        });
    }

    // Erro genérico
    const status = err.status || 500;
    return res.status(status).json({
        error: err.message || 'Erro interno do servidor.'
    });
};

module.exports = errorHandler;
