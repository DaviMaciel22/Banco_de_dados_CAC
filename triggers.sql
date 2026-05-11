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




/***********************************************************/