-- ============================================================
-- CAC LTDA — VIEWS
-- Execute após: estrutura.sql, procs.sql
-- ============================================================
USE banco_cac;
GO

-- Saldo e preço médio de cada produto
IF OBJECT_ID('vw_saldo_preco_medio','V') IS NOT NULL DROP VIEW vw_saldo_preco_medio;
GO
CREATE VIEW vw_saldo_preco_medio AS
SELECT p.id_produto, p.nome AS produto, c.nome_categoria AS grupo,
       p.quantidade_estoque AS saldo_atual, p.estoque_minimo, p.preco_medio,
       p.preco_compra AS ultimo_preco_compra, p.data_ultima_compra, p.status1,
       CASE WHEN p.quantidade_estoque = 0                    THEN 'Sem estoque'
            WHEN p.quantidade_estoque <= p.estoque_minimo    THEN 'Abaixo do mínimo'
            ELSE 'Normal' END AS situacao_estoque,
       ISNULL(tot.total_entradas, 0) AS total_unidades_compradas,
       ISNULL(tot.total_investido, 0) AS total_valor_investido
FROM Produto p
LEFT JOIN Categoria c ON p.fkcategoria = c.id_categoria
LEFT JOIN (
    SELECT fkproduto, SUM(quantidade_compra) AS total_entradas, SUM(valor_compra) AS total_investido
    FROM Entrada GROUP BY fkproduto
) tot ON tot.fkproduto = p.id_produto;
GO

-- Últimas compras de cada produto
IF OBJECT_ID('vw_ultimas_compras','V') IS NOT NULL DROP VIEW vw_ultimas_compras;
GO
CREATE VIEW vw_ultimas_compras AS
SELECT e.id_entrada, p.id_produto, p.nome AS produto, c.nome_categoria AS grupo,
       f.razao_social AS fornecedor, e.data_compra, e.quantidade_compra,
       e.valor_unitario, e.valor_compra AS valor_total,
       ROW_NUMBER() OVER (PARTITION BY e.fkproduto ORDER BY e.data_compra DESC) AS ordem_recente
FROM Entrada e
INNER JOIN Produto    p ON e.fkproduto    = p.id_produto
INNER JOIN Fornecedor f ON e.fkfornecedor = f.id_fornecedor
LEFT  JOIN Categoria  c ON p.fkcategoria  = c.id_categoria;
GO

-- Produtos em falta ou abaixo do mínimo
IF OBJECT_ID('vw_produtos_em_falta','V') IS NOT NULL DROP VIEW vw_produtos_em_falta;
GO
CREATE VIEW vw_produtos_em_falta AS
SELECT p.id_produto, p.nome AS produto, c.nome_categoria AS grupo,
       p.quantidade_estoque AS saldo_atual, p.estoque_minimo,
       p.quantidade_estoque - p.estoque_minimo AS diferenca,
       CASE WHEN p.quantidade_estoque = 0 THEN 'SEM ESTOQUE' ELSE 'ABAIXO DO MÍNIMO' END AS situacao,
       (SELECT TOP 1 f2.razao_social FROM Entrada e2
        INNER JOIN Fornecedor f2 ON e2.fkfornecedor = f2.id_fornecedor
        WHERE e2.fkproduto = p.id_produto ORDER BY e2.data_compra DESC) AS ultimo_fornecedor
FROM Produto p
LEFT JOIN Categoria c ON p.fkcategoria = c.id_categoria
WHERE p.quantidade_estoque <= p.estoque_minimo AND p.status1 = 'Ativo';
GO

-- Fornecedores de cada produto com histórico de preços
IF OBJECT_ID('vw_fornecedores_produto','V') IS NOT NULL DROP VIEW vw_fornecedores_produto;
GO
CREATE VIEW vw_fornecedores_produto AS
SELECT p.id_produto, p.nome AS produto, c.nome_categoria AS grupo,
       f.id_fornecedor, f.razao_social AS fornecedor, f.email,
       COUNT(e.id_entrada) AS total_compras,
       SUM(e.quantidade_compra) AS total_qtd_fornecida,
       MIN(e.valor_unitario) AS menor_preco, MAX(e.valor_unitario) AS maior_preco,
       AVG(e.valor_unitario) AS preco_medio_fornecedor, MAX(e.data_compra) AS ultima_compra
FROM Entrada e
INNER JOIN Produto    p ON e.fkproduto    = p.id_produto
INNER JOIN Fornecedor f ON e.fkfornecedor = f.id_fornecedor
LEFT  JOIN Categoria  c ON p.fkcategoria  = c.id_categoria
GROUP BY p.id_produto, p.nome, c.nome_categoria, f.id_fornecedor, f.razao_social, f.email;
GO

-- Menor preço de compra por produto e respectivo fornecedor
IF OBJECT_ID('vw_menor_preco_fornecedor','V') IS NOT NULL DROP VIEW vw_menor_preco_fornecedor;
GO
CREATE VIEW vw_menor_preco_fornecedor AS
WITH ranked AS (
    SELECT fkproduto, fkfornecedor, valor_unitario, data_compra,
           ROW_NUMBER() OVER (PARTITION BY fkproduto ORDER BY valor_unitario ASC, data_compra DESC) AS rn
    FROM Entrada
)
SELECT p.id_produto, p.nome AS produto, c.nome_categoria AS grupo,
       f.razao_social AS fornecedor_mais_barato, f.email,
       r.valor_unitario AS menor_preco_unitario, r.data_compra AS data_da_compra
FROM ranked r
INNER JOIN Produto    p ON r.fkproduto    = p.id_produto
INNER JOIN Fornecedor f ON r.fkfornecedor = f.id_fornecedor
LEFT  JOIN Categoria  c ON p.fkcategoria  = c.id_categoria
WHERE r.rn = 1;
GO

-- Consumo de produtos por setor
IF OBJECT_ID('vw_consumo_por_setor','V') IS NOT NULL DROP VIEW vw_consumo_por_setor;
GO
CREATE VIEW vw_consumo_por_setor AS
SELECT s.id_setor, s.nome_setor, p.id_produto, p.nome AS produto,
       c.nome_categoria AS grupo,
       SUM(sa.quantidade_venda) AS total_quantidade, SUM(sa.valor_saida) AS total_valor,
       COUNT(sa.id_saida) AS total_requisicoes,
       MIN(sa.data_saida) AS primeira_retirada, MAX(sa.data_saida) AS ultima_retirada
FROM Saida sa
INNER JOIN Produto   p ON sa.fkproduto = p.id_produto
INNER JOIN Setor     s ON sa.fksetor   = s.id_setor
LEFT  JOIN Categoria c ON p.fkcategoria = c.id_categoria
GROUP BY s.id_setor, s.nome_setor, p.id_produto, p.nome, c.nome_categoria;
GO

-- Setores que utilizam cada grupo de produtos
IF OBJECT_ID('vw_setores_por_grupo','V') IS NOT NULL DROP VIEW vw_setores_por_grupo;
GO
CREATE VIEW vw_setores_por_grupo AS
SELECT c.id_categoria, c.nome_categoria AS grupo, s.id_setor, s.nome_setor,
       COUNT(DISTINCT sa.fkproduto) AS qtd_produtos_utilizados,
       SUM(sa.quantidade_venda) AS total_consumido, SUM(sa.valor_saida) AS total_valor
FROM Saida sa
INNER JOIN Produto   p ON sa.fkproduto  = p.id_produto
INNER JOIN Categoria c ON p.fkcategoria = c.id_categoria
INNER JOIN Setor     s ON sa.fksetor    = s.id_setor
GROUP BY c.id_categoria, c.nome_categoria, s.id_setor, s.nome_setor;
GO

-- Histórico com nome real do usuário da aplicação
IF OBJECT_ID('vw_historico','V') IS NOT NULL DROP VIEW vw_historico;
GO
CREATE VIEW vw_historico AS
SELECT id_log, nome_tabela, acao, id_registro_afetado, data_hora,
       ISNULL(usuario_app, usuario_banco) AS usuario_exibicao,
       usuario_banco, usuario_app
FROM log_alteracoes;
GO

PRINT '✅ Todas as views criadas com sucesso!';
GO
