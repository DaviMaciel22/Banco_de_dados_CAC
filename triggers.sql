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


