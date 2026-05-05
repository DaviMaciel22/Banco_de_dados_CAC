-- Davi
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

/***************************************/

create proc sp_inserir_atualizar_fornecedor
(@id_fornecedor bigint,
@cnpj varchar(14),
@email varchar(100),
@razao_social varchar(100),
@fkcategoria bigint 
)
as
if @id_fornecedor not in (select id_fornecedor from Fornecedor)
begin
insert into Fornecedor (id_fornecedor, cnpj, email, razao_social, fkcategoria)
values (@id_fornecedor, @cnpj, @email, @razao_social, @fkcategoria)
end

else if @id_fornecedor in (select id_fornecedor from Fornecedor)
begin
update Fornecedor
set cnpj = @cnpj,
email = @email,
razao_social = @razao_social,
fkcategoria = @fkcategoria
where id_fornecedor = @id_fornecedor
end

/***************************************************/

create proc sp_deletar_fornecedor
(
@id_fornecedor bigint
)
as
delete from Fornecedor
where id_fornecedor = @id_fornecedor


/********************************/
create proc sp_inserir_atualizar_categoria
( @id_categoria bigint,
@nome_categoria varchar(50)
)
as
if @id_categoria not in (Select id_categoria from Categoria_Produto)
begin
insert into Categoria_Produto (id_categoria, nome_categoria)
values (@id_categoria, @nome_categoria)
end

else if @id_categoria in (Select id_categoria from Categoria_Produto)
begin
update Categoria_Produto 
set nome_categoria = @nome_categoria
where id_categoria = @id_categoria
end

/************************************************/

create proc sp_deletar_categoria
(@id_categoria bigint)
as
delete from Categoria_Produto
where id_categoria = @id_categoria

/************************************************/

create proc sp_inserir_atualizar_setor
( @id_setor bigint,
@nome_sertor varchar(20),
@numero_funcionarios int)
as
if @id_setor not in (select id_setor from Setor)
begin
insert into Setor (id_setor, nome_setor, numero_funcionarios)
values (@id_setor, @nome_sertor, @numero_funcionarios)
end

else if @id_setor in (select id_setor from Setor)
begin
update Setor
set nome_setor = @nome_sertor,
numero_funcionarios = @numero_funcionarios
where id_setor = @id_setor
end

/***********************************************/

create proc sp_deletar_setor
(@id_setor bigint)
as
delete from Setor
where id_setor = @id_setor


























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
/************************************************/

