create trigger validacao_exclusao --valida se existem produtos ainda antes de excluir
on produto
for delete
as
if exists (select 1 from deleted where quantidade_estoque > 0) 
begin
print('Esse produto não pode ser excluído, pois ainda existem exemplares no estoque.')

rollback transaction
return
end

else
begin
print('Produto excluído com sucesso!')
return
end

/***********************************************************/









/* ALAN ***********************************************************/

create trigger quantidade_estoque
on Produto
for update
as
begin
 
    if update(quantidade_estoque)
    begin
        if exists (select 1 from inserted where quantidade_estoque < 0)
        begin
            raiserror ('ERRO: O estoque não pode ficar negativo. Operação cancelada.', 16, 1);
            rollback transaction;
            return;
        end

        if exists (select 1 from inserted where quantidade_estoque <= 20 having count(quantidade_estoque) = 1)
        begin
            raiserror ('AVISO: Atenção! 1 produto chegou no estoque mínimo!', 10, 1);
        end
        if exists (select 1 from inserted where quantidade_estoque <= 20 having count(quantidade_estoque) > 1)
        begin
            raiserror ('AVISO: Atenção! Há mais de 1 produto com estoque mínimo!', 10, 1);
        end
     end

end;




/***********************************************************/




CREATE TRIGGER tg_log_alteracoes_produto
ON Produto
AFTER INSERT, UPDATE, DELETE
AS
BEGIN

    DECLARE @acao VARCHAR(20);

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @acao = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @acao = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @acao = 'DELETE';


    IF @acao = 'INSERT'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Produto', 
            @acao, 
            id_produto
        FROM inserted;
    END


    IF @acao = 'DELETE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Produto', 
            @acao, 
            id_produto
        FROM deleted;
    END


    IF @acao = 'UPDATE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Produto', 
            @acao, 
            id_produto
        FROM inserted;
    END

END;





/***********************************************************/






CREATE TRIGGER tg_log_alteracoes_categoria
ON Categoria
AFTER INSERT, UPDATE, DELETE
AS
BEGIN

    DECLARE @acao VARCHAR(20);

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @acao = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @acao = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @acao = 'DELETE';


    IF @acao = 'INSERT'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Categoria', 
            @acao, 
            id_categoria
        FROM inserted;
    END


    IF @acao = 'DELETE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Categoria', 
            @acao, 
            id_categoria
        FROM deleted;
    END


    IF @acao = 'UPDATE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Categoria', 
            @acao, 
            id_categoria
        FROM inserted;
    END

END;





/***********************************************************/






CREATE TRIGGER tg_log_alteracoes_categoria_prod_set
ON Categoria_prod_set
AFTER INSERT, UPDATE, DELETE
AS
BEGIN

    DECLARE @acao VARCHAR(20);

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @acao = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @acao = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @acao = 'DELETE';


    IF @acao = 'INSERT'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Categoria_prod_set', 
            @acao, 
            ('id categoria: ' + fkcategoria + ' e id setor: ' + fksetor)
        FROM inserted;
    END


    IF @acao = 'DELETE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Categoria_prod_set', 
            @acao, 
            ('id categoria: ' + fkcategoria + ' e id setor: ' + fksetor)
        FROM deleted;
    END


    IF @acao = 'UPDATE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Categoria_prod_set', 
            @acao, 
            ('id categoria: ' + fkcategoria + ' e id setor: ' + fksetor)
        FROM inserted;
    END

END;




/***********************************************************/





CREATE TRIGGER tg_log_alteracoes_endereco_fornecedor
ON Endereco_fornecedor
AFTER INSERT, UPDATE, DELETE
AS
BEGIN

    DECLARE @acao VARCHAR(20);

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @acao = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @acao = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @acao = 'DELETE';


    IF @acao = 'INSERT'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Endereco_fornecedor', 
            @acao, 
            id_end_forn
        FROM inserted;
    END


    IF @acao = 'DELETE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Endereco_fornecedor', 
            @acao, 
            id_end_forn
        FROM deleted;
    END


    IF @acao = 'UPDATE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Endereco_fornecedor', 
            @acao, 
            id_end_forn
        FROM inserted;
    END

END;




/***********************************************************/






CREATE TRIGGER tg_log_alteracoes_endereco_funcionario
ON Endereco_funcionario
AFTER INSERT, UPDATE, DELETE
AS
BEGIN

    DECLARE @acao VARCHAR(20);

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @acao = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @acao = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @acao = 'DELETE';


    IF @acao = 'INSERT'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Endereco_funcionario', 
            @acao, 
            id_end_fun
        FROM inserted;
    END


    IF @acao = 'DELETE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Endereco_funcionario', 
            @acao, 
            id_end_fun
        FROM deleted;
    END


    IF @acao = 'UPDATE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Endereco_funcionario', 
            @acao, 
            id_end_fun
        FROM inserted;
    END

END;





/***********************************************************/






CREATE TRIGGER tg_log_alteracoes_entrada
ON Entrada
AFTER INSERT, UPDATE, DELETE
AS
BEGIN

    DECLARE @acao VARCHAR(20);

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @acao = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @acao = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @acao = 'DELETE';


    IF @acao = 'INSERT'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Entrada', 
            @acao, 
            id_entrada
        FROM inserted;
    END


    IF @acao = 'DELETE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Entrada', 
            @acao, 
            id_entrada
        FROM deleted;
    END


    IF @acao = 'UPDATE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Entrada', 
            @acao, 
            id_entrada
        FROM inserted;
    END

END;





/***********************************************************/






CREATE TRIGGER tg_log_alteracoes_fornecedor
ON Fornecedor
AFTER INSERT, UPDATE, DELETE
AS
BEGIN

    DECLARE @acao VARCHAR(20);

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @acao = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @acao = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @acao = 'DELETE';


    IF @acao = 'INSERT'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Fornecedor', 
            @acao, 
            id_fornecedor
        FROM inserted;
    END


    IF @acao = 'DELETE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Fornecedor', 
            @acao, 
            id_fornecedor
        FROM deleted;
    END


    IF @acao = 'UPDATE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Fornecedor', 
            @acao, 
            id_fornecedor
        FROM inserted;
    END

END;




/***********************************************************/





CREATE TRIGGER tg_log_alteracoes_funcionario
ON Funcionario
AFTER INSERT, UPDATE, DELETE
AS
BEGIN

    DECLARE @acao VARCHAR(20);

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @acao = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @acao = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @acao = 'DELETE';


    IF @acao = 'INSERT'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Funcionario', 
            @acao, 
            id_funcionario
        FROM inserted;
    END


    IF @acao = 'DELETE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Funcionario', 
            @acao, 
            id_funcionario
        FROM deleted;
    END


    IF @acao = 'UPDATE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Funcionario', 
            @acao, 
            id_funcionario
        FROM inserted;
    END

END;




/***********************************************************/






CREATE TRIGGER tg_log_alteracoes_saida
ON Saida
AFTER INSERT, UPDATE, DELETE
AS
BEGIN

    DECLARE @acao VARCHAR(20);

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @acao = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @acao = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @acao = 'DELETE';


    IF @acao = 'INSERT'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Saida', 
            @acao, 
            id_saida
        FROM inserted;
    END


    IF @acao = 'DELETE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Saida', 
            @acao, 
            id_saida
        FROM deleted;
    END


    IF @acao = 'UPDATE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Saida', 
            @acao, 
            id_saida
        FROM inserted;
    END

END;





/***********************************************************/






CREATE TRIGGER tg_log_alteracoes_setor
ON Setor
AFTER INSERT, UPDATE, DELETE
AS
BEGIN

    DECLARE @acao VARCHAR(20);

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @acao = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @acao = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @acao = 'DELETE';


    IF @acao = 'INSERT'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Setor', 
            @acao, 
            id_setor
        FROM inserted;
    END


    IF @acao = 'DELETE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Setor', 
            @acao, 
            id_setor
        FROM deleted;
    END


    IF @acao = 'UPDATE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Setor', 
            @acao, 
            id_setor
        FROM inserted;
    END

END;




/***********************************************************/






CREATE TRIGGER tg_log_alteracoes_telefone_funcionario
ON Telefone_funcionario
AFTER INSERT, UPDATE, DELETE
AS
BEGIN

    DECLARE @acao VARCHAR(20);

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @acao = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @acao = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @acao = 'DELETE';


    IF @acao = 'INSERT'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Telefone_funcionario', 
            @acao, 
            id_telefone_fun
        FROM inserted;
    END


    IF @acao = 'DELETE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Telefone_funcionario', 
            @acao, 
            id_telefone_fun
        FROM deleted;
    END


    IF @acao = 'UPDATE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Telefone_funcionario', 
            @acao, 
            id_telefone_fun
        FROM inserted;
    END

END;





/***********************************************************/






CREATE TRIGGER tg_log_alteracoes_telefone_fornecedor
ON Telefone_fornecedor
AFTER INSERT, UPDATE, DELETE
AS
BEGIN

    DECLARE @acao VARCHAR(20);

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @acao = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @acao = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @acao = 'DELETE';


    IF @acao = 'INSERT'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Telefone_fornecedor', 
            @acao, 
            id_telefone_for
        FROM inserted;
    END


    IF @acao = 'DELETE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Telefone_fornecedor', 
            @acao, 
            id_telefone_for
        FROM deleted;
    END


    IF @acao = 'UPDATE'
    BEGIN
        INSERT INTO log_alteracoes (nome_tabela, acao, id_registro_afetado)
        SELECT 
            'Telefone_fornecedor', 
            @acao, 
            id_telefone_for
        FROM inserted;
    END

END;






/***********************************************************/





