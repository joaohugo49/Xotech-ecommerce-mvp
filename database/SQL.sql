-- 1. Apaga a versão antiga para evitar conflitos de colunas ou chaves estrangeiras
DROP DATABASE IF EXISTS loja_simplificada;
CREATE DATABASE loja_simplificada;
USE loja_simplificada;

-- 2. Tabela de Usuários com controle de papéis (role)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'cliente'
);

-- 3. Tabela de Catálogo de Eletrônicos
CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    estoque INT NOT NULL DEFAULT 10
);

-- 4. Tabela de Pedidos (Capa / RF02)
CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    metodo_pagamento VARCHAR(30) NOT NULL,
    chave_fiscal VARCHAR(100) NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 5. Tabela de Itens do Pedido (Relacionamento N:N com suporte a deleção em Cascata)
CREATE TABLE pedidos_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_produto) REFERENCES produtos(id) ON DELETE CASCADE
);

-- 6. Inserção do Catálogo Inicial de Eletrônicos
INSERT INTO produtos (nome, preco, descricao, estoque) VALUES 
('Smartphone Mock Pro 14', 4999.90, 'Tela de 120Hz, Câmera Tripla Simulada e 256GB.', 15),
('Notebook Gamer Virtual', 6200.00, 'Processador Virtual Ultra Rápido e 16GB RAM.', 5),
('Fone Bluetooth Teste Som', 299.00, 'Isolamento acústico por software e bateria virtual de 40h.', 20);

-- 7. Massa de testes para autenticação (Senhas em texto limpo para evitar erros de login)
INSERT INTO usuarios (nome, email, senha, role) VALUES
('Comprador Teste', 'teste@gmail.com', '123456', 'cliente'),
('Diretor Admin', 'admin@gmail.com', 'admin123', 'admin');
