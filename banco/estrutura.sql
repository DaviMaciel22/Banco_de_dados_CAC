-- ============================================================
-- CAC LTDA — ESTRUTURA DO BANCO DE DADOS
-- SQL Server 2019/2021
-- Execução: rodar primeiro, antes dos demais scripts
-- ============================================================

-- Cria o banco se não existir
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'banco_cac')
BEGIN
    CREATE DATABASE banco_cac;
    PRINT 'Banco banco_cac criado.';
END
GO

USE banco_cac;
GO

-- ============================================================
-- TABELAS BASE (sem dependências)
-- ============================================================

-- Categorias / Grupos de produto
IF OBJECT_ID('Categoria', 'U') IS NULL
CREATE TABLE Categoria (
    id_categoria   BIGINT        IDENTITY(1,1) NOT NULL,
    nome_categoria VARCHAR(50)   NOT NULL,
    CONSTRAINT PK_Categoria PRIMARY KEY (id_categoria)
);
GO

-- Setores da empresa
IF OBJECT_ID('Setor', 'U') IS NULL
CREATE TABLE Setor (
    id_setor             BIGINT      IDENTITY(1,1) NOT NULL,
    nome_setor           VARCHAR(50) NOT NULL,
    numero_funcionarios  INT         NOT NULL DEFAULT 0,
    CONSTRAINT PK_Setor PRIMARY KEY (id_setor)
);
GO

-- Fornecedores
IF OBJECT_ID('Fornecedor', 'U') IS NULL
CREATE TABLE Fornecedor (
    id_fornecedor BIGINT        IDENTITY(1,1) NOT NULL,
    cnpj          VARCHAR(18)   NOT NULL UNIQUE,
    email         VARCHAR(100)  NOT NULL,
    razao_social  VARCHAR(100)  NOT NULL,
    CONSTRAINT PK_Fornecedor    PRIMARY KEY (id_fornecedor),
    CONSTRAINT UQ_Fornecedor_CNPJ UNIQUE (cnpj)
);
GO

-- ============================================================
-- TABELAS COM DEPENDÊNCIA SIMPLES
-- ============================================================

-- Produtos
IF OBJECT_ID('Produto', 'U') IS NULL
CREATE TABLE Produto (
    id_produto          BIGINT          IDENTITY(1,1) NOT NULL,
    fkcategoria         BIGINT          NOT NULL,
    status1             VARCHAR(50)     NOT NULL DEFAULT 'Ativo',
    quantidade_estoque  INT             NOT NULL DEFAULT 0,
    estoque_minimo      INT             NOT NULL DEFAULT 20,
    preco_compra        NUMERIC(18,2)   NOT NULL DEFAULT 0,
    preco_medio         NUMERIC(18,2)   NOT NULL DEFAULT 0,
    data_ultima_compra  DATETIME        NULL,
    descricao           VARCHAR(200)    NULL,
    nome                VARCHAR(50)     NOT NULL,
    CONSTRAINT PK_Produto         PRIMARY KEY (id_produto),
    CONSTRAINT FK_Produto_Cat     FOREIGN KEY (fkcategoria)
        REFERENCES Categoria(id_categoria)
);
GO

-- Funcionários
IF OBJECT_ID('Funcionario', 'U') IS NULL
CREATE TABLE Funcionario (
    id_funcionario   BIGINT      IDENTITY(1,1) NOT NULL,
    fksetor          BIGINT      NOT NULL,
    nome_funcionario VARCHAR(50) NOT NULL,
    tipo_funcionario VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Funcionario     PRIMARY KEY (id_funcionario),
    CONSTRAINT FK_Func_Setor      FOREIGN KEY (fksetor)
        REFERENCES Setor(id_setor)
);
GO

-- ============================================================
-- TABELAS DE MOVIMENTAÇÃO
-- ============================================================

-- Entradas (compras de produtos)
IF OBJECT_ID('Entrada', 'U') IS NULL
CREATE TABLE Entrada (
    id_entrada        BIGINT          IDENTITY(1,1) NOT NULL,
    fkproduto         BIGINT          NOT NULL,
    fkfornecedor      BIGINT          NOT NULL,
    data_compra       DATETIME        NOT NULL DEFAULT GETDATE(),
    valor_compra      NUMERIC(18,2)   NOT NULL,
    quantidade_compra INT             NOT NULL,
    valor_unitario    NUMERIC(18,2)   NOT NULL,
    CONSTRAINT PK_Entrada          PRIMARY KEY (id_entrada),
    CONSTRAINT FK_Entrada_Prod     FOREIGN KEY (fkproduto)
        REFERENCES Produto(id_produto),
    CONSTRAINT FK_Entrada_Forn     FOREIGN KEY (fkfornecedor)
        REFERENCES Fornecedor(id_fornecedor)
);
GO

-- Saídas (requisições de produtos pelos setores)
IF OBJECT_ID('Saida', 'U') IS NULL
CREATE TABLE Saida (
    id_saida         BIGINT          IDENTITY(1,1) NOT NULL,
    fkproduto        BIGINT          NOT NULL,
    fksetor          BIGINT          NOT NULL,
    data_saida       DATETIME        NOT NULL DEFAULT GETDATE(),
    valor_saida      NUMERIC(18,2)   NOT NULL,
    quantidade_venda INT             NOT NULL,
    CONSTRAINT PK_Saida            PRIMARY KEY (id_saida),
    CONSTRAINT FK_Saida_Prod       FOREIGN KEY (fkproduto)
        REFERENCES Produto(id_produto),
    CONSTRAINT FK_Saida_Setor      FOREIGN KEY (fksetor)
        REFERENCES Setor(id_setor)
);
GO

-- ============================================================
-- TABELAS DE RELACIONAMENTO
-- ============================================================

-- Categorias utilizadas por cada setor
IF OBJECT_ID('Categoria_prod_set', 'U') IS NULL
CREATE TABLE Categoria_prod_set (
    id_cat_prod_set BIGINT IDENTITY(1,1) NOT NULL,
    fkcategoria     BIGINT NOT NULL,
    fksetor         BIGINT NOT NULL,
    CONSTRAINT PK_CatProdSet    PRIMARY KEY (id_cat_prod_set),
    CONSTRAINT FK_CPS_Cat       FOREIGN KEY (fkcategoria)
        REFERENCES Categoria(id_categoria),
    CONSTRAINT FK_CPS_Setor     FOREIGN KEY (fksetor)
        REFERENCES Setor(id_setor),
    CONSTRAINT UQ_CPS           UNIQUE (fkcategoria, fksetor)
);
GO

-- ============================================================
-- TABELAS DE CONTATOS
-- ============================================================

-- Telefones de fornecedores
IF OBJECT_ID('Telefone_Fornecedor', 'U') IS NULL
CREATE TABLE Telefone_Fornecedor (
    id_telefone_for BIGINT      IDENTITY(1,1) NOT NULL,
    fkfornecedor    BIGINT      NOT NULL,
    telefone        VARCHAR(15) NOT NULL,
    CONSTRAINT PK_TelForn       PRIMARY KEY (id_telefone_for),
    CONSTRAINT FK_TelForn_Forn  FOREIGN KEY (fkfornecedor)
        REFERENCES Fornecedor(id_fornecedor)
);
GO

-- Telefones de funcionários
IF OBJECT_ID('Telefone_Funcionario', 'U') IS NULL
CREATE TABLE Telefone_Funcionario (
    id_telefone_fun BIGINT      IDENTITY(1,1) NOT NULL,
    fkfuncionario   BIGINT      NOT NULL,
    telefone        VARCHAR(15) NOT NULL,
    CONSTRAINT PK_TelFunc       PRIMARY KEY (id_telefone_fun),
    CONSTRAINT FK_TelFunc_Func  FOREIGN KEY (fkfuncionario)
        REFERENCES Funcionario(id_funcionario)
);
GO

-- Endereços de fornecedores
IF OBJECT_ID('Endereco_Fornecedor', 'U') IS NULL
CREATE TABLE Endereco_Fornecedor (
    id_end_forn   BIGINT       IDENTITY(1,1) NOT NULL,
    fkfornecedor  BIGINT       NOT NULL,
    rua           VARCHAR(255) NOT NULL,
    cep           VARCHAR(9)   NOT NULL,
    cidade        VARCHAR(255) NOT NULL,
    numero        INT          NOT NULL,
    CONSTRAINT PK_EndForn       PRIMARY KEY (id_end_forn),
    CONSTRAINT FK_EndForn_Forn  FOREIGN KEY (fkfornecedor)
        REFERENCES Fornecedor(id_fornecedor)
);
GO

-- Endereços de funcionários
IF OBJECT_ID('Endereco_Funcionario', 'U') IS NULL
CREATE TABLE Endereco_Funcionario (
    id_end_fun     BIGINT       IDENTITY(1,1) NOT NULL,
    fkfuncionario  BIGINT       NOT NULL,
    rua            VARCHAR(255) NOT NULL,
    cep            VARCHAR(9)   NOT NULL,
    cidade         VARCHAR(255) NOT NULL,
    numero         INT          NOT NULL,
    CONSTRAINT PK_EndFunc       PRIMARY KEY (id_end_fun),
    CONSTRAINT FK_EndFunc_Func  FOREIGN KEY (fkfuncionario)
        REFERENCES Funcionario(id_funcionario)
);
GO

-- ============================================================
-- TABELAS DO SISTEMA
-- ============================================================

-- Log de todas as alterações
IF OBJECT_ID('log_alteracoes', 'U') IS NULL
CREATE TABLE log_alteracoes (
    id_log              BIGINT       IDENTITY(1,1) NOT NULL,
    nome_tabela         VARCHAR(100) NOT NULL,
    acao                VARCHAR(20)  NOT NULL,   -- INSERT | UPDATE | DELETE
    id_registro_afetado BIGINT       NOT NULL,
    data_hora           DATETIME     NOT NULL DEFAULT GETDATE(),
    usuario_banco       VARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
    usuario_app         VARCHAR(100) NULL,        -- nome do usuário logado na aplicação
    CONSTRAINT PK_Log PRIMARY KEY (id_log)
);
GO

-- Usuários do sistema
IF OBJECT_ID('Usuarios', 'U') IS NULL
CREATE TABLE Usuarios (
    id_usuario  BIGINT       IDENTITY(1,1) NOT NULL,
    nome        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL,
    senha       VARCHAR(255) NOT NULL,    -- bcrypt hash
    perfil      VARCHAR(20)  NOT NULL DEFAULT 'operador',  -- admin | gestor | operador
    ativo       BIT          NOT NULL DEFAULT 1,
    criado_em   DATETIME     NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Usuarios      PRIMARY KEY (id_usuario),
    CONSTRAINT UQ_Usuario_Email UNIQUE (email),
    CONSTRAINT CK_Usuario_Perfil CHECK (perfil IN ('admin','gestor','operador'))
);
GO

-- Configurações do sistema
IF OBJECT_ID('Configuracoes', 'U') IS NULL
CREATE TABLE Configuracoes (
    id_config   BIGINT       IDENTITY(1,1) NOT NULL,
    chave       VARCHAR(100) NOT NULL,
    valor       VARCHAR(255) NOT NULL,
    descricao   VARCHAR(255) NULL,
    CONSTRAINT PK_Config      PRIMARY KEY (id_config),
    CONSTRAINT UQ_Config_Chave UNIQUE (chave)
);
GO

PRINT 'Estrutura criada com sucesso!';
PRINT 'Execute na ordem: estrutura.sql -> procs.sql -> views.sql -> triggers.sql -> dados_iniciais.sql';
GO
