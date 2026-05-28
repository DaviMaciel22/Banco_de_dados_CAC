// src/config/database.js
const sql = require('mssql');
require('dotenv').config();

const config = {
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server:   process.env.DB_HOST,
    database: process.env.DB_NAME,
    port:     parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
    pool: {
        max: 10,       // Máximo de conexões simultâneas
        min: 2,        // Mínimo mantido aquivo
        idleTimeoutMillis: 30000,
    },
};

// Singleton: cria o pool uma vez e reutiliza
let poolPromise;

const getPool = () => {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(config)
            .connect()
            .then(pool => {
                console.log('✅ Pool SQL Server conectado com sucesso!');
                return pool;
            })
            .catch(err => {
                poolPromise = null; // Permite nova tentativa
                console.error('❌ Falha na conexão com o banco:', err.message);
                throw err;
            });
    }
    return poolPromise;
};

module.exports = { getPool, sql };
