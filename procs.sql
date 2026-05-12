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
insert into Produto (fkcategoria, status1, quantidade_estoque, preco_compra, descricao, nome)
values (@fkcategoria, @status1, @quantidade_estoque, @preco_compra, @descricao, @nome)
end

/************************************************************/

create proc sp_deletar_produto
( @id_produto bigint )
as
delete from Produto 
where id_produto = @id_produto

/************************************************************/

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
insert into Fornecedor (cnpj, email, razao_social, fkcategoria)
values (@cnpj, @email, @razao_social, @fkcategoria)
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

/************************************************************/

create proc sp_deletar_fornecedor
(
@id_fornecedor bigint
)
as
delete from Fornecedor
where id_fornecedor = @id_fornecedor


/************************************************************/

create proc sp_inserir_atualizar_categoria
( @id_categoria bigint,
@nome_categoria varchar(50)
)
as
if @id_categoria not in (Select id_categoria from Categoria_Produto)
begin
insert into Categoria_Produto (nome_categoria)
values (@nome_categoria)
end

else if @id_categoria in (Select id_categoria from Categoria_Produto)
begin
update Categoria_Produto 
set nome_categoria = @nome_categoria
where id_categoria = @id_categoria
end

/************************************************************/

create proc sp_deletar_categoria
(@id_categoria bigint)
as
delete from Categoria_Produto
where id_categoria = @id_categoria

/************************************************************/

create proc sp_inserir_atualizar_setor
( @id_setor bigint,
@nome_sertor varchar(20),
@numero_funcionarios int)
as
if @id_setor not in (select id_setor from Setor)
begin
insert into Setor (nome_setor, numero_funcionarios)
values (@nome_sertor, @numero_funcionarios)
end

else if @id_setor in (select id_setor from Setor)
begin
update Setor
set nome_setor = @nome_sertor,
numero_funcionarios = @numero_funcionarios
where id_setor = @id_setor
end

/************************************************************/

create proc sp_deletar_setor
(@id_setor bigint)
as
delete from Setor
where id_setor = @id_setor

/************************************************************/

create proc sp_inserir_atualizar_funcionario
( @idfuncionario bigint,
@fksetor bigint,
@nome_funcionario varchar(50),
@tipo_funcionario varchar(50)
) as
if @idfuncionario not in (Select id_funcionario from Funcionario)
begin
insert into Funcionario (fksetor, nome_funcionario, tipo_funcionario)
values (@fksetor, @nome_funcionario, @tipo_funcionario)
end

else if @idfuncionario in (Select id_funcionario from Funcionario)
begin
update Funcionario
set fksetor = @fksetor,
nome_funcionario = @nome_funcionario,
tipo_funcionario = @tipo_funcionario
where id_funcionario = @idfuncionario
end

/************************************************************/

create proc sp_deletar_funcionario
( @id_funcionario bigint)
as
delete from Funcionario
where id_funcionario = @id_funcionario

/************************************************************/

create proc sp_inserir_atualizar_saida 
(@id_saida bigint,
@fkproduto bigint,
@fksetor bigint,
@data_saida datetime,
@valor_saida numeric(18,2),
@quantidade_produto int)
as
if @id_saida not in (select id_saida from Saida)
begin
insert into Saida (fkproduto, fksetor, data_saida, valor_saida, quantidade_venda)
values (@fkproduto, @fksetor, @data_saida, @valor_saida, @quantidade_produto)
end

else if @id_saida in (Select id_saida from Saida)
begin
update Saida
set fkproduto = @fkproduto,
fksetor = @fksetor,
data_saida = @data_saida,
valor_saida = @valor_saida,
quantidade_venda = @quantidade_produto
where id_saida = @id_saida
end

/************************************************************/

create proc sp_deletar_saida
( @id_saida bigint)
as
delete from Saida
where id_saida = @id_saida


/************************************************************/

create proc sp_inserir_atualizar_entrada 
(@id_entrada bigint,
@fkproduto bigint,
@fkfornecedor bigint,
@data_compra datetime,
@valor_compra numeric(18,2),
@valor_unitario numeric(18,2))
as
if @id_entrada not in (select id_entrada from Entrada)
begin
insert into Entrada(fkproduto, fkfornecedor, data_compra, valor_compra, valor_unitario)
values (@fkproduto, @fkfornecedor, @data_compra, @valor_compra, @valor_unitario)
end

else if @id_entrada in (Select id_entrada from Entrada)
begin
update Entrada
set fkproduto = @fkproduto,
fkfornecedor = @fkfornecedor,
data_compra = @data_compra,
valor_compra = @valor_compra,
valor_unitario = @valor_unitario
where id_entrada = @id_entrada
end

/************************************************************/

create proc sp_deletar_entrada
( @id_entrada bigint)
as
delete from Entrada
where id_entrada = @id_entrada

/************************************************************/


create proc sp_inserir_atualizar_endereco_fornecedor
(@id_end_forn bigint,
@fkfornecedor bigint,
@rua varchar(100),
@cep varchar(9),
@cidade varchar(20),
@numero int)
as
if @id_end_forn not in (select id_end_forn from Endereco_Fornecedor)
begin
insert into Endereco_Fornecedor (fkfornecedor, rua, cep, cidade, numero)
values (@fkfornecedor, @rua, @cep, @cidade, @numero)
end

else if @id_end_forn in (select id_end_forn from Endereco_Fornecedor)
begin
update Endereco_Fornecedor
set fkfornecedor = @fkfornecedor,
rua = @rua,
cep = @cep,
cidade = @cidade,
numero = @numero
where id_end_forn = @id_end_forn
end

/************************************************************/

create proc deletar_endereco_fornecedor
(@id_end_forn bigint)
as
delete from Endereco_Fornecedor
where id_end_forn = @id_end_forn

/************************************************************/

create proc sp_inserir_atualizar_endereco_funcionario
(@id_end_fun bigint,
@fkfuncionario bigint,
@rua varchar(100),
@cep varchar(9),
@cidade varchar(20),
@numero int)
as
if @id_end_fun not in (select id_end_fun from Endereco_Funcionario)
begin
insert into Endereco_Funcionario(fkfuncionario, rua, cep, cidade, numero)
values (@fkfuncionario, @rua, @cep, @cidade, @numero)
end

else if @id_end_fun in (select id_end_fun from Endereco_Funcionario)
begin
update Endereco_Funcionario
set fkfuncionario = @fkfuncionario,
rua = @rua,
cep = @cep,
cidade = @cidade,
numero = @numero
where @id_end_fun = @id_end_fun
end

/************************************************************/

create proc deletar_endereco_funcionario
(@id_end_fun bigint)
as
delete from Endereco_Funcionario
where id_end_fun = @id_end_fun

/************************************************************/

create proc sp_insert_update_telefone_for
(@id_telefone bigint,
@fkfornecedor bigint,
@telefone_for varchar(15)
)
as
if @id_telefone not in (select id_telefone from Telefone_Fornecedor)
begin
insert into Telefone_Fornecedor (fkfornecedor, telefone_for)
values(@fkfornecedor, @telefone_for)
end

else if @id_telefone in (select id_telefone from Telefone_Fornecedor)
begin
update Telefone_Fornecedor
set fkfornecedor = @fkfornecedor,
telefone_for = @telefone_for
where id_telefone = @id_telefone
end


/*********************************************************/

create proc sp_deletar_telefone_for
(@id_telefone bigint)
as
delete from Telefone_Fornecedor
where id_telefone_for = @id_telefone


/*********************************************************/
create proc sp_insert_update_telefone_fun
(@id_telefone bigint,
@fkfuncionario bigint,
@telefone_fun varchar(15)
)
as
if @id_telefone not in (select id_telefone from Telefone_Funcionario)
begin
insert into Telefone_Funcionario(fkfuncionario, telefone_fun)
values(@fkfuncionario, @telefone_fun)
end

else if @id_telefone in (select id_telefone from Telefone_Funcionario)
begin
update Telefone_Funcionario
set fkfuncionario = @fkfuncionario,
telefone_fun = @telefone_fun
where id_telefone = @id_telefone
end

/*********************************************************/
create proc sp_deletar_telefone_fun
(@id_telefone bigint)
as
delete from Telefone_Funcionario
where id_telefone_fun = @id_telefone


/*********************************************************/








/* ALAN *********************************************************/ 

create procedure sp_preco_medio
    @id_prod bigint
as
begin

    if not exists (select * from Entrada where fkproduto = @id_prod)
    begin
        select 'Este produto ainda não possui registros de entrada para cálculo.' as Mensagem;
    end
    else 
    begin
    select avg(valor_unitario)
    from Entrada
    where fkproduto = @id_prod
    end
end;

/************************************************/

create procedure sp_em_falta
as
begin

    select nome, id_produto, quantidade_estoque
    from Produto
    where quantidade_estoque = 0

end;

/************************************************/

create procedure sp_consumo_por_setor_30
@id_prod bigint
as
begin

    select fksetor as 'Setor', sum(quantidade_venda) as 'Quantidade', sum(valor_saida) as 'Valor', fkproduto as 'Produto'
    from Saida
    where datediff(day, data_saida, getdate()) <= 30
    and datediff(day, data_saida, getdate()) >= 0
    and fkproduto = @id_prod
    group by fksetor, fkproduto

end;

/************************************************/

create procedure sp_consumo_por_setor_180
@id_prod bigint
as
begin

    select fksetor as 'Setor', sum(quantidade_venda) as 'Quantidade', sum(valor_saida) as 'Valor', fkproduto as 'Produto'
    from Saida
    where datediff(day, data_saida, getdate()) <= 180
    and datediff(day, data_saida, getdate()) >= 0
    and fkproduto = @id_prod
    group by fksetor, fkproduto

end;

/************************************************/

create procedure sp_consumo_por_setor_365
@id_prod bigint
as
begin

    select fksetor as 'Setor', sum(quantidade_venda) as 'Quantidade', sum(valor_saida) as 'Valor', fkproduto as 'Produto'
    from Saida
    where datediff(day, data_saida, getdate()) <= 365
    and datediff(day, data_saida, getdate()) >= 0
    and fkproduto = @id_prod
    group by fksetor, fkproduto

end;

/************************************************/

create procedure sp_consumo_por_setor
@id_prod bigint
as
begin

    select fksetor as 'Setor', sum(quantidade_venda) as 'Quantidade', sum(valor_saida) as 'Valor', fkproduto as 'Produto'
    from Saida
    where fkproduto = @id_prod
    group by fksetor, fkproduto

end;

/************************************************/

create procedure sp_ficha_produto
@id_prod bigint
as
begin

    select id_produto, c.nome_categoria as 'categoria', status1 as 'status', quantidade_estoque, preco_compra, descricao, nome
    from Produto p, Categoria c
    where id_produto = @id_prod
   
end;

/************************************************/

create procedure sp_melhor_fornecedor
@id_prod bigint
as
begin

    select f.razao_social, e.fkfornecedor, e.valor_unitario, e.data_compra, e.id_entrada
    from Entrada e, Fornecedor f
    where e.fkfornecedor = f.id_fornecedor
    and e.fkproduto = @id_prod
    order by e.valor_unitario asc
   

end;

/************************************************/

