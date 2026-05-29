// src/controllers/relatoriosController.js
const { getPool, sql } = require('../config/database');

// GET /api/relatorios/consumo-setor
// Query params: ?id_setor=&id_categoria=&data_inicio=&data_fim=
const consumoPorSetor = async (req, res, next) => {
    try {
        const { id_setor, id_categoria, data_inicio, data_fim } = req.query;
        const pool = await getPool();

        const result = await pool.request()
            .input('id_setor',     sql.BigInt,  id_setor     ? parseInt(id_setor)     : null)
            .input('id_categoria', sql.BigInt,  id_categoria ? parseInt(id_categoria) : null)
            .input('data_inicio',  sql.Date,    data_inicio  ? new Date(data_inicio)  : null)
            .input('data_fim',     sql.Date,    data_fim     ? new Date(data_fim)     : null)
            .execute('sp_relatorio_consumo_setor');

        return res.json(result.recordset);
    } catch (err) { next(err); }
};

// GET /api/relatorios/ficha-produto/:id
const fichaProduto = async (req, res, next) => {
    try {
        const pool   = await getPool();
        const result = await pool.request()
            .input('id_produto', sql.BigInt, req.params.id)
            .execute('sp_ficha_produto');

        // sp_ficha_produto retorna 3 result sets: cabeçalho, entradas, saídas
        const cab = result.recordsets[0]?.[0] || null;
        // Normaliza campo nome → produto para o frontend
        if (cab && cab.nome && !cab.produto) cab.produto = cab.nome;
        return res.json({
            cabecalho: cab,
            entradas:  result.recordsets[1] || [],
            saidas:    result.recordsets[2] || [],
        });
    } catch (err) { next(err); }
};

// GET /api/relatorios/fornecedores-produto?id_produto=
const fornecedoresProduto = async (req, res, next) => {
    try {
        const { id_produto } = req.query;
        const pool   = await getPool();
        const result = await pool.request()
            .input('id_produto', sql.BigInt, id_produto ? parseInt(id_produto) : null)
            .execute('sp_fornecedores_produto');

        return res.json(result.recordset);
    } catch (err) { next(err); }
};

// GET /api/relatorios/produtos-em-falta?apenas_zerados=0
const produtosEmFalta = async (req, res, next) => {
    try {
        const { apenas_zerados = '0' } = req.query;
        const pool   = await getPool();
        const result = await pool.request()
            .input('apenas_zerados', sql.Bit, parseInt(apenas_zerados))
            .execute('sp_produtos_em_falta');

        return res.json(result.recordset);
    } catch (err) { next(err); }
};

// GET /api/relatorios/menor-preco?id_produto=&id_categoria=
const menorPrecoFornecedor = async (req, res, next) => {
    try {
        const { id_produto, id_categoria } = req.query;
        const pool   = await getPool();
        const result = await pool.request()
            .input('id_produto',   sql.BigInt, id_produto   ? parseInt(id_produto)   : null)
            .input('id_categoria', sql.BigInt, id_categoria ? parseInt(id_categoria) : null)
            .execute('sp_menor_preco_fornecedor');

        // SP retorna 'menor_preco' e 'data_ultima_compra_preco'
        // HTML espera 'menor_preco_unitario' e 'data_da_compra'
        const mapped = result.recordset.map(r => ({
            ...r,
            menor_preco_unitario: r.menor_preco_unitario ?? r.menor_preco ?? 0,
            data_da_compra:       r.data_da_compra       ?? r.data_ultima_compra_preco ?? null,
        }));
        return res.json(mapped);
    } catch (err) { next(err); }
};

// GET /api/relatorios/ultimas-compras?id_produto=&top_n=5
const ultimasCompras = async (req, res, next) => {
    try {
        const { id_produto, top_n = '5' } = req.query;
        const pool   = await getPool();
        const result = await pool.request()
            .input('id_produto', sql.BigInt, id_produto ? parseInt(id_produto) : null)
            .input('top_n',      sql.Int,    parseInt(top_n))
            .execute('sp_ultimas_compras_produto');

        return res.json(result.recordset);
    } catch (err) { next(err); }
};

// GET /api/relatorios/setores-por-grupo?id_categoria=
const setoresPorGrupo = async (req, res, next) => {
    try {
        const { id_categoria } = req.query;
        const pool   = await getPool();
        const result = await pool.request()
            .input('id_categoria', sql.BigInt, id_categoria ? parseInt(id_categoria) : null)
            .execute('sp_setores_por_grupo');

        return res.json(result.recordset);
    } catch (err) { next(err); }
};

module.exports = {
    consumoPorSetor,
    fichaProduto,
    fornecedoresProduto,
    produtosEmFalta,
    menorPrecoFornecedor,
    ultimasCompras,
    setoresPorGrupo,
};
