-- ============================================================
-- CAC LTDA — TRIGGERS
-- Execute após: estrutura.sql, procs.sql, views.sql
-- ============================================================
USE banco_cac;
GO

-- ============================================================
-- TRIGGER 1: Atualiza preço médio e data da última compra
-- Dispara: AFTER INSERT na tabela Entrada
-- ============================================================
IF OBJECT_ID('trg_entrada_atualiza_produto','TR') IS NOT NULL DROP TRIGGER trg_entrada_atualiza_produto;
GO
CREATE TRIGGER trg_entrada_atualiza_produto
ON Entrada
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE p
    SET
        -- Preço médio ponderado = SUM(valor_total) / SUM(qtd_comprada)
        p.preco_medio = (
            SELECT ROUND(SUM(e2.valor_compra) / NULLIF(SUM(e2.quantidade_compra), 0), 2)
            FROM Entrada e2 WHERE e2.fkproduto = p.id_produto
        ),
        -- Último preço de compra
        p.preco_compra = (
            SELECT TOP 1 valor_unitario FROM Entrada
            WHERE fkproduto = p.id_produto ORDER BY data_compra DESC
        ),
        -- Data da última compra
        p.data_ultima_compra = (
            SELECT TOP 1 data_compra FROM Entrada
            WHERE fkproduto = p.id_produto ORDER BY data_compra DESC
        )
    FROM Produto p
    INNER JOIN inserted i ON p.id_produto = i.fkproduto;
END;
GO

-- ============================================================
-- TRIGGER 2: Atualiza estoque ao registrar entrada
-- Dispara: AFTER INSERT na tabela Entrada
-- ============================================================
IF OBJECT_ID('atualizacao_de_estoque_entrada','TR') IS NOT NULL DROP TRIGGER atualizacao_de_estoque_entrada;
GO
CREATE TRIGGER atualizacao_de_estoque_entrada
ON Entrada
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE p
    SET p.quantidade_estoque = p.quantidade_estoque + i.quantidade_compra
    FROM Produto p
    INNER JOIN inserted i ON p.id_produto = i.fkproduto;
END;
GO

-- ============================================================
-- TRIGGER 3: Desconta estoque ao registrar saída
-- Dispara: AFTER INSERT na tabela Saida
-- ============================================================
IF OBJECT_ID('atualizacao_de_estoque_saida','TR') IS NOT NULL DROP TRIGGER atualizacao_de_estoque_saida;
GO
CREATE TRIGGER atualizacao_de_estoque_saida
ON Saida
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE p
    SET p.quantidade_estoque = p.quantidade_estoque - i.quantidade_venda
    FROM Produto p
    INNER JOIN inserted i ON p.id_produto = i.fkproduto;
END;
GO

-- ============================================================
-- TRIGGER 4: Valida estoque — impede negativo, alerta mínimo
-- Dispara: FOR UPDATE na tabela Produto
-- ============================================================
IF OBJECT_ID('quantidade_estoque','TR') IS NOT NULL DROP TRIGGER quantidade_estoque;
GO
CREATE TRIGGER quantidade_estoque
ON Produto
FOR UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Lê preferência de notificação das configurações
    DECLARE @notif_ativa VARCHAR(1) = '1';
    SELECT @notif_ativa = valor FROM Configuracoes WHERE chave = 'notif_estoque_critico';

    IF UPDATE(quantidade_estoque)
    BEGIN
        -- Bloqueia estoque negativo
        IF EXISTS (SELECT 1 FROM inserted WHERE quantidade_estoque < 0)
        BEGIN
            RAISERROR('ERRO: O estoque não pode ficar negativo.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Alerta de mínimo por produto (só na transição de normal → abaixo)
        IF @notif_ativa = '1'
        BEGIN
            DECLARE @qtd_criticos INT;
            SELECT @qtd_criticos = COUNT(*)
            FROM inserted i INNER JOIN deleted d ON i.id_produto = d.id_produto
            WHERE i.quantidade_estoque <= i.estoque_minimo
              AND d.quantidade_estoque >  d.estoque_minimo;

            IF @qtd_criticos = 1
                RAISERROR('AVISO: 1 produto atingiu o estoque mínimo!', 10, 1);
            IF @qtd_criticos > 1
                RAISERROR('AVISO: %d produtos atingiram o estoque mínimo!', 10, 1, @qtd_criticos);
        END
    END
END;
GO

-- ============================================================
-- TRIGGER 5: Valida exclusão de produto com movimentações
-- Dispara: FOR DELETE na tabela Produto
-- ============================================================
IF OBJECT_ID('validacao_exclusao','TR') IS NOT NULL DROP TRIGGER validacao_exclusao;
GO
CREATE TRIGGER validacao_exclusao
ON Produto
FOR DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM deleted d
        WHERE EXISTS (SELECT 1 FROM Entrada WHERE fkproduto = d.id_produto)
           OR EXISTS (SELECT 1 FROM Saida   WHERE fkproduto = d.id_produto)
    )
    BEGIN
        RAISERROR('ERRO: Produto possui movimentações vinculadas e não pode ser excluído.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- ============================================================
-- TRIGGER 6: Mantém numero_funcionarios atualizado em Setor
-- Dispara: AFTER INSERT, DELETE, UPDATE em Funcionario
-- ============================================================
IF OBJECT_ID('trg_atualiza_numero_funcionarios','TR') IS NOT NULL DROP TRIGGER trg_atualiza_numero_funcionarios;
GO
CREATE TRIGGER trg_atualiza_numero_funcionarios
ON Funcionario
AFTER INSERT, DELETE, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE s
    SET s.numero_funcionarios = (
        SELECT COUNT(*) FROM Funcionario f WHERE f.fksetor = s.id_setor
    )
    FROM Setor s
    WHERE s.id_setor IN (
        SELECT fksetor FROM inserted
        UNION
        SELECT fksetor FROM deleted
    );
END;
GO

PRINT '✅ Todas as triggers criadas com sucesso!';
PRINT '';
PRINT 'ATENÇÃO: NÃO criar triggers tg_log_alteracoes_*.';
PRINT '         O log é feito pelo backend via sp_registrar_log,';
PRINT '         garantindo o nome real do usuário logado.';
GO
