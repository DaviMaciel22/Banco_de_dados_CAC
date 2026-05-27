-- ============================================================
-- CAC LTDA — STORED PROCEDURES
-- Execute após: estrutura.sql
-- ============================================================
USE banco_cac;
GO

-- ============================================================
-- PRODUTO
-- ============================================================

CREATE OR ALTER PROCEDURE sp_inserir_atualizar_produto
 (  @id_produto         BIGINT         = NULL,
    @fkcategoria        BIGINT,
    @status1            VARCHAR(50),
    @quantidade_estoque INT,
    @preco_compra       NUMERIC(18,2),
    @descricao          VARCHAR(200),
    @nome               VARCHAR(50),
    @estoque_minimo     INT            = 20 )
AS
BEGIN
    SET NOCOUNT ON;
    IF @id_produto IS NULL OR @id_produto = 0
        INSERT INTO Produto (fkcategoria, status1, quantidade_estoque, preco_compra, descricao, nome, estoque_minimo)
        VALUES (@fkcategoria, @status1, @quantidade_estoque, @preco_compra, @descricao, @nome, @estoque_minimo);
    ELSE
        UPDATE Produto
        SET fkcategoria        = @fkcategoria,
            status1            = @status1,
            quantidade_estoque = @quantidade_estoque,
            preco_compra       = @preco_compra,
            descricao          = @descricao,
            nome               = @nome,
            estoque_minimo     = @estoque_minimo
        WHERE id_produto = @id_produto;
END;
GO

CREATE OR ALTER PROCEDURE sp_deletar_produto
    (@id_produto BIGINT)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Entrada WHERE fkproduto = @id_produto)
        OR EXISTS (SELECT 1 FROM Saida WHERE fkproduto = @id_produto)
    BEGIN
        RAISERROR('ERRO: Produto possui movimentações vinculadas e não pode ser excluído.', 16, 1);
        RETURN;
    END
    DELETE FROM Produto WHERE id_produto = @id_produto;
END;
GO

-- ============================================================
-- FORNECEDOR
-- ============================================================

CREATE OR ALTER PROCEDURE sp_inserir_atualizar_fornecedor
 (  @id_fornecedor BIGINT        = NULL,
    @cnpj          VARCHAR(18),
    @email         VARCHAR(100),
    @razao_social  VARCHAR(100) )
AS
BEGIN
    SET NOCOUNT ON;
    IF @id_fornecedor IS NULL OR @id_fornecedor = 0
        INSERT INTO Fornecedor (cnpj, email, razao_social) VALUES (@cnpj, @email, @razao_social);
    ELSE
        UPDATE Fornecedor SET cnpj = @cnpj, email = @email, razao_social = @razao_social
        WHERE id_fornecedor = @id_fornecedor;
END;
GO

CREATE OR ALTER PROCEDURE sp_deletar_fornecedor
    (@id_fornecedor BIGINT)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Entrada WHERE fkfornecedor = @id_fornecedor)
    BEGIN
        RAISERROR('ERRO: Fornecedor possui entradas vinculadas e não pode ser excluído.', 16, 1);
        RETURN;
    END
    DELETE FROM Telefone_Fornecedor WHERE fkfornecedor = @id_fornecedor;
    DELETE FROM Endereco_Fornecedor  WHERE fkfornecedor = @id_fornecedor;
    DELETE FROM Fornecedor           WHERE id_fornecedor = @id_fornecedor;
END;
GO

-- ============================================================
-- CATEGORIA
-- ============================================================

CREATE OR ALTER PROCEDURE sp_inserir_atualizar_categoria
 (  @id_categoria   BIGINT      = NULL,
    @nome_categoria VARCHAR(50) )
AS
BEGIN
    SET NOCOUNT ON;
    IF @id_categoria IS NULL OR @id_categoria = 0
        INSERT INTO Categoria (nome_categoria) VALUES (@nome_categoria);
    ELSE
        UPDATE Categoria SET nome_categoria = @nome_categoria WHERE id_categoria = @id_categoria;
END;
GO


CREATE OR ALTER PROCEDURE sp_deletar_categoria
    (@id_categoria BIGINT)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Produto WHERE fkcategoria = @id_categoria)
    BEGIN
        RAISERROR('ERRO: Categoria possui produtos vinculados e não pode ser excluída.', 16, 1);
        RETURN;
    END
    DELETE FROM Categoria_prod_set WHERE fkcategoria = @id_categoria;
    DELETE FROM Categoria           WHERE id_categoria = @id_categoria;
END;
GO

-- ============================================================
-- SETOR
-- ============================================================

CREATE OR ALTER PROCEDURE sp_inserir_atualizar_setor
 (  @id_setor            BIGINT      = NULL,
    @nome_sertor         VARCHAR(50),
    @numero_funcionarios INT         = 0 )
AS
BEGIN
    SET NOCOUNT ON;
    IF @id_setor IS NULL OR @id_setor = 0
        INSERT INTO Setor (nome_setor, numero_funcionarios) VALUES (@nome_sertor, @numero_funcionarios);
    ELSE
        UPDATE Setor SET nome_setor = @nome_sertor WHERE id_setor = @id_setor;
END;
GO

CREATE OR ALTER PROCEDURE sp_deletar_setor
    (@id_setor BIGINT)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Funcionario WHERE fksetor = @id_setor)
    BEGIN
        RAISERROR('ERRO: Setor possui funcionários vinculados e não pode ser excluído.', 16, 1);
        RETURN;
    END
    IF EXISTS (SELECT 1 FROM Saida WHERE fksetor = @id_setor)
    BEGIN
        RAISERROR('ERRO: Setor possui saídas vinculadas e não pode ser excluído.', 16, 1);
        RETURN;
    END
    DELETE FROM Categoria_prod_set WHERE fksetor = @id_setor;
    DELETE FROM Setor WHERE id_setor = @id_setor;
END;
GO

-- ============================================================
-- FUNCIONÁRIO
-- ============================================================

CREATE OR ALTER PROCEDURE sp_inserir_atualizar_funcionario
 (  @idfuncionario    BIGINT      = NULL,
    @fksetor          BIGINT,
    @nome_funcionario VARCHAR(50),
    @tipo_funcionario VARCHAR(50) )
AS
BEGIN
    SET NOCOUNT ON;
    IF @idfuncionario IS NULL OR @idfuncionario = 0
        INSERT INTO Funcionario (fksetor, nome_funcionario, tipo_funcionario)
        VALUES (@fksetor, @nome_funcionario, @tipo_funcionario);
    ELSE
        UPDATE Funcionario
        SET fksetor = @fksetor, nome_funcionario = @nome_funcionario, tipo_funcionario = @tipo_funcionario
        WHERE id_funcionario = @idfuncionario;
END;
GO

CREATE OR ALTER PROCEDURE sp_deletar_funcionario
    (@id_funcionario BIGINT)
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Telefone_Funcionario  WHERE fkfuncionario = @id_funcionario;
    DELETE FROM Endereco_Funcionario  WHERE fkfuncionario = @id_funcionario;
    DELETE FROM Funcionario           WHERE id_funcionario = @id_funcionario;
END;
GO

-- ============================================================
-- ENTRADAS E SAÍDAS
-- ============================================================

CREATE OR ALTER PROCEDURE sp_inserir_atualizar_entrada
 (  @id_entrada         BIGINT          = NULL,
    @fkproduto          BIGINT,
    @fkfornecedor       BIGINT,
    @data_compra        DATETIME,
    @valor_compra       NUMERIC(18,2),
    @quantidade_compra  INT,
    @valor_unitario     NUMERIC(18,2) )
AS
BEGIN
    IF @id_entrada IS NULL OR @id_entrada = 0
        INSERT INTO Entrada (fkproduto, fkfornecedor, data_compra, valor_compra, quantidade_compra, valor_unitario)
        VALUES (@fkproduto, @fkfornecedor, @data_compra, @valor_compra, @quantidade_compra, @valor_unitario);
    ELSE
        UPDATE Entrada
        SET fkproduto = @fkproduto, fkfornecedor = @fkfornecedor, data_compra = @data_compra,
            valor_compra = @valor_compra, quantidade_compra = @quantidade_compra, valor_unitario = @valor_unitario
        WHERE id_entrada = @id_entrada;
END;
GO

CREATE OR ALTER PROCEDURE sp_deletar_entrada
    @id_entrada BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Entrada WHERE id_entrada = @id_entrada;
END;
GO

CREATE OR ALTER PROCEDURE sp_inserir_atualizar_saida
    @id_saida           BIGINT          = NULL,
    @fkproduto          BIGINT,
    @fksetor            BIGINT,
    @data_saida         DATETIME,
    @valor_saida        NUMERIC(18,2),
    @quantidade_produto INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @saldo_atual INT;
    SELECT @saldo_atual = quantidade_estoque FROM Produto WHERE id_produto = @fkproduto;
    IF @saldo_atual < @quantidade_produto
    BEGIN
        RAISERROR('ERRO: Estoque insuficiente. Saldo disponível: %d unidade(s).', 16, 1, @saldo_atual);
        RETURN;
    END
    IF @id_saida IS NULL OR @id_saida = 0
        INSERT INTO Saida (fkproduto, fksetor, data_saida, valor_saida, quantidade_venda)
        VALUES (@fkproduto, @fksetor, @data_saida, @valor_saida, @quantidade_produto);
    ELSE
        UPDATE Saida
        SET fkproduto = @fkproduto, fksetor = @fksetor, data_saida = @data_saida,
            valor_saida = @valor_saida, quantidade_venda = @quantidade_produto
        WHERE id_saida = @id_saida;
END;
GO

CREATE OR ALTER PROCEDURE sp_deletar_saida
    @id_saida BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Saida WHERE id_saida = @id_saida;
END;
GO

-- ============================================================
-- CONTATOS — TELEFONES E ENDEREÇOS
-- ============================================================

CREATE OR ALTER PROCEDURE sp_inserir_telefone_fornecedor
    @fkfornecedor BIGINT, @telefone VARCHAR(15)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Telefone_Fornecedor WHERE fkfornecedor = @fkfornecedor AND telefone = @telefone)
    BEGIN RAISERROR('Telefone já cadastrado para este fornecedor.', 16, 1); RETURN; END
    INSERT INTO Telefone_Fornecedor (fkfornecedor, telefone) VALUES (@fkfornecedor, @telefone);
END;
GO

CREATE OR ALTER PROCEDURE sp_deletar_telefone_fornecedor
    @id_telefone_for BIGINT
AS BEGIN SET NOCOUNT ON; DELETE FROM Telefone_Fornecedor WHERE id_telefone_for = @id_telefone_for; END;
GO

CREATE OR ALTER PROCEDURE sp_inserir_atualizar_endereco_fornecedor
    @id_end_forn  BIGINT = NULL, @fkfornecedor BIGINT,
    @rua VARCHAR(255), @cep VARCHAR(9), @cidade VARCHAR(255), @numero INT
AS
BEGIN
    SET NOCOUNT ON;
    IF @id_end_forn IS NULL OR @id_end_forn = 0
        INSERT INTO Endereco_Fornecedor (fkfornecedor, rua, cep, cidade, numero) VALUES (@fkfornecedor, @rua, @cep, @cidade, @numero);
    ELSE
        UPDATE Endereco_Fornecedor SET rua=@rua, cep=@cep, cidade=@cidade, numero=@numero WHERE id_end_forn=@id_end_forn;
END;
GO

CREATE OR ALTER PROCEDURE sp_deletar_endereco_fornecedor
    @id_end_forn BIGINT
AS BEGIN SET NOCOUNT ON; DELETE FROM Endereco_Fornecedor WHERE id_end_forn = @id_end_forn; END;
GO

CREATE OR ALTER PROCEDURE sp_inserir_telefone_funcionario
    @fkfuncionario BIGINT, @telefone VARCHAR(15)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Telefone_Funcionario WHERE fkfuncionario = @fkfuncionario AND telefone = @telefone)
    BEGIN RAISERROR('Telefone já cadastrado para este funcionário.', 16, 1); RETURN; END
    INSERT INTO Telefone_Funcionario (fkfuncionario, telefone) VALUES (@fkfuncionario, @telefone);
END;
GO

CREATE OR ALTER PROCEDURE sp_deletar_telefone_funcionario
    @id_telefone_fun BIGINT
AS BEGIN SET NOCOUNT ON; DELETE FROM Telefone_Funcionario WHERE id_telefone_fun = @id_telefone_fun; END;
GO

CREATE OR ALTER PROCEDURE sp_inserir_atualizar_endereco_funcionario
    @id_end_fun BIGINT = NULL, @fkfuncionario BIGINT,
    @rua VARCHAR(255), @cep VARCHAR(9), @cidade VARCHAR(255), @numero INT
AS
BEGIN
    SET NOCOUNT ON;
    IF @id_end_fun IS NULL OR @id_end_fun = 0
        INSERT INTO Endereco_Funcionario (fkfuncionario, rua, cep, cidade, numero) VALUES (@fkfuncionario, @rua, @cep, @cidade, @numero);
    ELSE
        UPDATE Endereco_Funcionario SET rua=@rua, cep=@cep, cidade=@cidade, numero=@numero WHERE id_end_fun=@id_end_fun;
END;
GO

CREATE OR ALTER PROCEDURE sp_deletar_endereco_funcionario
    @id_end_fun BIGINT
AS BEGIN SET NOCOUNT ON; DELETE FROM Endereco_Funcionario WHERE id_end_fun = @id_end_fun; END;
GO

-- ============================================================
-- RELATÓRIOS GERENCIAIS
-- ============================================================

CREATE OR ALTER PROCEDURE sp_ficha_produto
    @id_produto BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.id_produto, p.nome, p.descricao, c.nome_categoria AS grupo,
           p.quantidade_estoque AS saldo_atual, p.estoque_minimo,
           p.preco_compra AS ultimo_preco_compra, p.preco_medio, p.status1, p.data_ultima_compra
    FROM Produto p LEFT JOIN Categoria c ON p.fkcategoria = c.id_categoria
    WHERE p.id_produto = @id_produto;

    SELECT 'ENTRADA' AS tipo_movimento, e.id_entrada AS id_movimento,
           e.data_compra AS data_movimento, e.quantidade_compra AS quantidade,
           e.valor_unitario, e.valor_compra AS valor_total,
           f.razao_social AS origem_destino, NULL AS setor
    FROM Entrada e INNER JOIN Fornecedor f ON e.fkfornecedor = f.id_fornecedor
    WHERE e.fkproduto = @id_produto ORDER BY e.data_compra DESC;

    SELECT 'SAIDA' AS tipo_movimento, sa.id_saida AS id_movimento,
           sa.data_saida AS data_movimento, sa.quantidade_venda AS quantidade,
           CASE WHEN sa.quantidade_venda > 0 THEN sa.valor_saida/sa.quantidade_venda ELSE 0 END AS valor_unitario,
           sa.valor_saida AS valor_total, s.nome_setor AS origem_destino, s.nome_setor AS setor
    FROM Saida sa INNER JOIN Setor s ON sa.fksetor = s.id_setor
    WHERE sa.fkproduto = @id_produto ORDER BY sa.data_saida DESC;
END;
GO

CREATE OR ALTER PROCEDURE sp_relatorio_consumo_setor
    @id_setor     BIGINT = NULL,
    @id_categoria BIGINT = NULL,
    @data_inicio  DATE   = NULL,
    @data_fim     DATE   = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT s.nome_setor, c.nome_categoria AS grupo, p.nome AS produto,
           SUM(sa.quantidade_venda) AS total_quantidade,
           SUM(sa.valor_saida) AS total_valor,
           COUNT(sa.id_saida) AS total_requisicoes
    FROM Saida sa
    INNER JOIN Produto   p ON sa.fkproduto  = p.id_produto
    INNER JOIN Setor     s ON sa.fksetor    = s.id_setor
    LEFT  JOIN Categoria c ON p.fkcategoria = c.id_categoria
    WHERE (@id_setor    IS NULL OR sa.fksetor      = @id_setor)
      AND (@id_categoria IS NULL OR p.fkcategoria  = @id_categoria)
      AND (@data_inicio  IS NULL OR sa.data_saida >= @data_inicio)
      AND (@data_fim     IS NULL OR sa.data_saida <= @data_fim)
    GROUP BY s.nome_setor, c.nome_categoria, p.nome
    ORDER BY s.nome_setor, total_valor DESC;
END;
GO

CREATE OR ALTER PROCEDURE sp_fornecedores_produto
    @id_produto BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.nome AS produto, f.razao_social AS fornecedor, f.cnpj, f.email,
           COUNT(e.id_entrada) AS total_compras,
           SUM(e.quantidade_compra) AS total_qtd_fornecida,
           MIN(e.valor_unitario) AS menor_preco, MAX(e.valor_unitario) AS maior_preco,
           ROUND(AVG(e.valor_unitario),2) AS preco_medio, MAX(e.data_compra) AS ultima_compra
    FROM Entrada e
    INNER JOIN Produto    p ON e.fkproduto    = p.id_produto
    INNER JOIN Fornecedor f ON e.fkfornecedor = f.id_fornecedor
    WHERE (@id_produto IS NULL OR e.fkproduto = @id_produto)
    GROUP BY p.nome, f.razao_social, f.cnpj, f.email
    ORDER BY p.nome, menor_preco ASC;
END;
GO

CREATE OR ALTER PROCEDURE sp_produtos_em_falta
    @apenas_zerados BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.id_produto, p.nome AS produto, c.nome_categoria AS grupo,
           p.quantidade_estoque AS saldo_atual, p.estoque_minimo,
           p.quantidade_estoque - p.estoque_minimo AS diferenca,
           CASE WHEN p.quantidade_estoque = 0 THEN 'SEM ESTOQUE' ELSE 'ABAIXO DO MÍNIMO' END AS situacao,
           p.estoque_minimo * 2 - p.quantidade_estoque AS sugestao_compra,
           (SELECT TOP 1 f2.razao_social FROM Entrada e2
            INNER JOIN Fornecedor f2 ON e2.fkfornecedor = f2.id_fornecedor
            WHERE e2.fkproduto = p.id_produto ORDER BY e2.data_compra DESC) AS ultimo_fornecedor,
           (SELECT TOP 1 e3.valor_unitario FROM Entrada e3
            WHERE e3.fkproduto = p.id_produto ORDER BY e3.valor_unitario ASC) AS menor_preco_historico
    FROM Produto p LEFT JOIN Categoria c ON p.fkcategoria = c.id_categoria
    WHERE p.status1 = 'Ativo'
      AND ((@apenas_zerados = 1 AND p.quantidade_estoque = 0)
        OR (@apenas_zerados = 0 AND p.quantidade_estoque <= p.estoque_minimo))
    ORDER BY p.quantidade_estoque ASC, p.nome;
END;
GO

CREATE OR ALTER PROCEDURE sp_menor_preco_fornecedor
    @id_produto   BIGINT = NULL,
    @id_categoria BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.nome AS produto, c.nome_categoria AS grupo,
           f.razao_social AS fornecedor_mais_barato, f.cnpj, f.email,
           e.valor_unitario AS menor_preco, e.data_compra AS data_ultima_compra_preco
    FROM (
        SELECT fkproduto, fkfornecedor, valor_unitario, data_compra,
               ROW_NUMBER() OVER (PARTITION BY fkproduto ORDER BY valor_unitario ASC, data_compra DESC) AS rn
        FROM Entrada
    ) e
    INNER JOIN Produto    p ON e.fkproduto    = p.id_produto
    INNER JOIN Fornecedor f ON e.fkfornecedor = f.id_fornecedor
    LEFT  JOIN Categoria  c ON p.fkcategoria  = c.id_categoria
    WHERE e.rn = 1
      AND (@id_produto   IS NULL OR p.id_produto  = @id_produto)
      AND (@id_categoria IS NULL OR p.fkcategoria = @id_categoria)
    ORDER BY p.nome;
END;
GO

CREATE OR ALTER PROCEDURE sp_ultimas_compras_produto
    @id_produto BIGINT = NULL,
    @top_n      INT    = 5
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.nome AS produto, c.nome_categoria AS grupo,
           f.razao_social AS fornecedor, e.data_compra,
           e.quantidade_compra, e.valor_unitario, e.valor_compra AS valor_total,
           ROW_NUMBER() OVER (PARTITION BY e.fkproduto ORDER BY e.data_compra DESC) AS numero_compra
    FROM Entrada e
    INNER JOIN Produto    p ON e.fkproduto    = p.id_produto
    INNER JOIN Fornecedor f ON e.fkfornecedor = f.id_fornecedor
    LEFT  JOIN Categoria  c ON p.fkcategoria  = c.id_categoria
    WHERE (@id_produto IS NULL OR e.fkproduto = @id_produto)
    ORDER BY e.fkproduto, e.data_compra DESC;
END;
GO

CREATE OR ALTER PROCEDURE sp_setores_por_grupo
    @id_categoria BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT c.nome_categoria AS grupo, s.nome_setor,
           COUNT(DISTINCT sa.fkproduto) AS produtos_diferentes,
           SUM(sa.quantidade_venda) AS total_consumido,
           SUM(sa.valor_saida) AS total_valor
    FROM Saida sa
    INNER JOIN Produto   p ON sa.fkproduto  = p.id_produto
    INNER JOIN Categoria c ON p.fkcategoria = c.id_categoria
    INNER JOIN Setor     s ON sa.fksetor    = s.id_setor
    WHERE (@id_categoria IS NULL OR c.id_categoria = @id_categoria)
    GROUP BY c.nome_categoria, s.nome_setor
    ORDER BY c.nome_categoria, total_valor DESC;
END;
GO

-- ============================================================
-- LOG DO SISTEMA
-- ============================================================

CREATE OR ALTER PROCEDURE sp_registrar_log
    @nome_tabela VARCHAR(100),
    @acao        VARCHAR(20),
    @id_registro BIGINT,
    @usuario_app VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado, usuario_app)
    VALUES (@nome_tabela, @acao, @id_registro, @usuario_app);
END;
GO

PRINT 'Todas as stored procedures criadas com sucesso!';
GO
