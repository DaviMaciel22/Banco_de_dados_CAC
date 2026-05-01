CREATE TABLE Endereco_Fornecedor(
    id_end_forn BIGINT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    fkfornecedor BIGINT NOT NULL,
    rua VARCHAR(255) NOT NULL,
    cep VARCHAR(255) NOT NULL,
    cidade VARCHAR(255) NOT NULL,
    numero INT NOT NULL
);

CREATE TABLE Endereco_Funcionario(
    id_end_fun BIGINT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    fkfuncionario BIGINT NOT NULL,
    rua VARCHAR(255) NOT NULL,
    cep VARCHAR(255) NOT NULL,
    cidade VARCHAR(255) NOT NULL,
    numero INT NOT NULL
);

CREATE TABLE Produto(
    id_produto BIGINT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    fkcategoria BIGINT NOT NULL,
    status1 VARCHAR(255) NOT NULL,
    quantidade_estoque BIGINT NOT NULL,
    preco_compra numeric(18,2) NOT NULL,
    preco_venda numeric(18,2) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL
);

CREATE TABLE Fornecedor(
    id_fornecedor BIGINT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    cnpj VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
);

CREATE TABLE Categoria(
    id_categoria BIGINT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    nome_categoria VARCHAR(255) NOT NULL
);

CREATE TABLE Setor(
    id_setor BIGINT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    nome_setor BIGINT NOT NULL,
    numero_funcionarios BIGINT NOT NULL
);

CREATE TABLE Funcionario(
    id_funcionario BIGINT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    fksetor BIGINT NOT NULL,
    nome_funcionario VARCHAR(255) NOT NULL,
    tipo_funcionario VARCHAR(255) NOT NULL
);

CREATE TABLE Saida(
    fkproduto BIGINT NOT NULL,
    fksetor BIGINT NOT NULL,
    data_vendas DATETIME NOT NULL,
    valor_vendas numeric(18,2) NOT NULL,
    quantidade_venda INT NOT NULL,
    PRIMARY KEY(fksetor, fkproduto)
);

CREATE TABLE  Entrada(
    fkproduto BIGINT NOT NULL,
    fkfornecedor BIGINT NOT NULL,
    data_compra DATETIME NOT NULL,
    valor_compra numeric(18,2) NOT NULL,
    quantidade_compra BIGINT NOT NULL,
    PRIMARY KEY(fkfornecedor, fkproduto)
);

CREATE TABLE Categoria_prod_set(
    fksetor BIGINT NOT NULL,
    fkcategoria BIGINT NOT NULL,
    PRIMARY KEY(fkcategoria, fksetor)
);

CREATE TABLE Telefone(
    id_telefone BIGINT NOT NULL,
    fkfuncionario BIGINT NOT NULL,
    fkfornecedor BIGINT NOT NULL,
    fkconsumidor BIGINT NOT NULL,
    PRIMARY KEY(id_telefone)
);




ALTER TABLE Endereco_Fornecedor ADD CONSTRAINT FK_Endereco_Fornecedor FOREIGN KEY (fkfornecedor) REFERENCES Fornecedor(id_fornecedor);

ALTER TABLE Endereco_Funcionario ADD CONSTRAINT FK_Endereco_Funcionario FOREIGN KEY (fkfuncionario) REFERENCES Funcionario(id_funcionario);

ALTER TABLE Produto ADD CONSTRAINT FK_Produto_Categoria FOREIGN KEY (fkcategoria) REFERENCES Categoria(id_categoria);

ALTER TABLE Funcionario ADD CONSTRAINT FK_Funcionario_Setor FOREIGN KEY (fksetor) REFERENCES Setor(id_setor);

ALTER TABLE Saida ADD CONSTRAINT FK_Saida_Produto FOREIGN KEY (fkproduto) REFERENCES Produto(id_produto);
ALTER TABLE Saida ADD CONSTRAINT FK_Saida_Setor FOREIGN KEY (fksetor) REFERENCES Setor(id_setor);

ALTER TABLE Entrada ADD CONSTRAINT FK_Compras_Produto FOREIGN KEY (fkproduto) REFERENCES Produto(id_produto);
ALTER TABLE Entrada ADD CONSTRAINT FK_Compras_Fornecedor FOREIGN KEY (fkfornecedor) REFERENCES Fornecedor(id_fornecedor);

ALTER TABLE Categoria_prod_set ADD CONSTRAINT FK_Categoria_prod_set_Setor FOREIGN KEY (fksetor) REFERENCES Setor(id_setor);
ALTER TABLE Categoria_prod_set ADD CONSTRAINT FK_Categoria_prod_set_Categoria FOREIGN KEY (fkcategoria) REFERENCES Categoria(id_categoria);

ALTER TABLE Telefone ADD CONSTRAINT FK_Telefone_Funcionario FOREIGN KEY (fkfuncionario) REFERENCES Funcionario(id_funcionario);
ALTER TABLE Telefone ADD CONSTRAINT FK_Telefone_Fornecedor FOREIGN KEY (fkfornecedor) REFERENCES Fornecedor(id_fornecedor);
