# Banco_de_dados_CAC
Um trabalho da universidade que consiste em desenvolver um banco de dados estrutura para a empresa CAC

# CAC LTDA — Setup do Banco de Dados

## Requisitos
- SQL Server 2019 ou 2021
- SSMS (SQL Server Management Studio)

## Ordem de Execução

Execute os scripts no SSMS **nessa ordem**:

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `estrutura.sql` | Cria o banco e todas as tabelas |
| 2 | `procs.sql` | Stored procedures (CRUD + relatórios) |
| 3 | `views.sql` | Views para relatórios e alertas |
| 4 | `triggers.sql` | Triggers de negócio (estoque, preço médio, etc.) |
| 5 | `dados_iniciais.sql` | Usuário admin e configurações padrão |

## Acesso Inicial

```
URL:    http://localhost:5500/html/index.html
E-mail: admin@cac.com
Senha:  Admin@123
```

⚠️ **Troque a senha no primeiro acesso** em Configurações → Segurança → Alterar Senha

## Configuração do Backend (.env)

```env
DB_SERVER=localhost
DB_DATABASE=banco_cac
DB_USER=sa
DB_PASSWORD=sua_senha_aqui
DB_PORT=1433
JWT_SECRET=cac_ltda_secret_2024
PORT=3000
```

## Rodar o Backend

```bash
cd backend
npm install
npm run dev
```

## Estrutura do Banco

### Tabelas Principais
- **Produto** — catálogo com estoque_minimo individual e preco_medio automático
- **Fornecedor** — com telefones e endereços vinculados
- **Categoria** — grupos de produtos
- **Setor** — departamentos da empresa
- **Funcionario** — com telefones e endereços vinculados
- **Entrada** — compras de produtos (atualiza estoque e preço médio via trigger)
- **Saida** — requisições de produtos pelos setores

### Tabelas do Sistema
- **Usuarios** — usuários da aplicação (admin/gestor/operador)
- **Configuracoes** — configurações do sistema (estoque mínimo, paginação, etc.)
- **log_alteracoes** — histórico de todas as alterações com nome do usuário

### Observação sobre Logs
O log **não usa triggers** para registrar alterações — isso é feito pelo backend via `sp_registrar_log` após cada operação, garantindo que o **nome real do usuário logado** apareça no histórico (e não "sa").
