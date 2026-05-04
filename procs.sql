alter proc sp_insert_update_produto
(@id_produto bigint,
@fkcategoria bigint,
@status1 varchar(50),
@quantidade_estoque numeric (4,0),
@preco_compra numeric (18,2),
@descricao varchar(200),
@nome varchar(50))
as
if @id_produto in (select id_produto from Produto)
begin
update Produto
set fkcategoria = @fkcategoria,
status1 = @status1,
quantidade_estoque = @quantidade_estoque,
preco_compra = @preco_compra,
descricao = @descricao,
nome = @nome
where id_produto = @id_produto
end

else if @id_produto not in(select id_produto from Produto)
begin
insert into Produto (id_produto, fkcategoria, status1, quantidade_estoque, preco_compra, descricao, nome)
values (@id_produto, @fkcategoria, @status1, @quantidade_estoque, @preco_compra, @descricao, @nome)
end

/***********************************************/

create proc sp_deletar_produto
( @id_produto bigint )
as
delete from Produto 
where id_produto = @id_produto



















/* ALAN *********************************************************/

CREATE PROCEDURE stp_CalcularPrecoMedioProduto
    @id_prod BIGINT
AS
BEGIN

    IF NOT EXISTS (SELECT 1 FROM Entrada WHERE fkproduto = @id_prod)
    BEGIN
        SELECT 'Este produto ainda não possui registros de entrada para cálculo.' AS Mensagem;
    END


    SELECT AVG(valor_unitario)
    from Entrada
    WHERE fkproduto = @id_prod
END;
