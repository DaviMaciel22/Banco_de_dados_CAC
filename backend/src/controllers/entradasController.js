const { getPool, sql } = require('../config/database');

const getAll = async (req, res, next) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT e.id_entrada, e.data_compra, e.valor_compra,
                   e.quantidade_compra, e.valor_unitario,
                   e.num_nf,
                   p.nome AS nome_produto,
                   f.razao_social AS nome_fornecedor,
                   e.fkproduto, e.fkfornecedor
            FROM Entrada e
            LEFT JOIN Produto   p ON e.fkproduto    = p.id_produto
            LEFT JOIN Fornecedor f ON e.fkfornecedor = f.id_fornecedor
            ORDER BY e.data_compra DESC
        `);
        return res.json(result.recordset);
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    try {
        const { fkproduto, fkfornecedor, data_compra, valor_compra,
                quantidade_compra, valor_unitario, num_nf } = req.body;
        const pool = await getPool();
        
        await pool.request()
            .input('fkproduto',         sql.BigInt,        fkproduto)
            .input('fkfornecedor',      sql.BigInt,        fkfornecedor)
            .input('data_compra',       sql.DateTime,      new Date(data_compra))
            .input('valor_compra',      sql.Numeric(18,2), valor_compra)
            .input('quantidade_compra', sql.BigInt,        quantidade_compra)
            .input('valor_unitario',    sql.Numeric(18,2), valor_unitario)
            .input('num_nf',            sql.VarChar(50),   num_nf || null)
            .query(`
                INSERT INTO Entrada (fkproduto, fkfornecedor, data_compra, valor_compra,
                                     quantidade_compra, valor_unitario, num_nf)
                VALUES (@fkproduto, @fkfornecedor, @data_compra, @valor_compra,
                        @quantidade_compra, @valor_unitario, @num_nf)
            `);
        await req.registrarLog?.('Entrada', 'INSERT', 0);
        return res.status(201).json({ message: 'Entrada registrada! Estoque atualizado automaticamente.' });
    } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id_entrada', sql.BigInt, req.params.id)
            .execute('sp_deletar_entrada');
        await req.registrarLog?.('Entrada', 'DELETE', req.params.id);
        return res.json({ message: 'Entrada excluída! Estoque revertido automaticamente.' });
    } catch (err) { next(err); }
};

module.exports = { getAll, create, remove };
