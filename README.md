# Xotech - MVP de E-commerce de Eletrônicos Local

MVP funcional desenvolvido como projeto prático para a disciplina de **Projeto de Arquitetura de Sistemas**. O sistema implementa uma arquitetura em três camadas (3-Tier) local com controle de acessos (RBAC) e mocks comportamentais para faturamento e emissão de notas fiscais.

## Tecnologias Utilizadas
- **Frontend:** HTML5, CSS3 e JavaScript Vanilla (SPA nativo)
- **Backend:** Node.js, Express.js e CORS
- **Banco de Dados:** MySQL Server (Driver `mysql2`)

## Padrões de Projeto Aplicados
- **Singleton:** Instância única de conexão com o banco de dados.
- **Facade:** Endpoints REST ocultando a complexidade relacional do SQL.
- **Observer:** Desacoplamento assíncrono do pós-venda (Módulo Fiscal e Financeiro).
- **Strategy:** Algoritmos intercambiáveis de faturamento (Cartão, PIX, Boleto).
- **GRASP:** Controlador e Especialista da Informação (validação de estoque).

## Como Rodar o Projeto Localmente

1. **Configurar o Banco de Dados:**
   - Abra o MySQL Workbench.
   - Execute o script contido no arquivo `banco.sql` na raiz do projeto para criar a base `loja_simplificada` e as tabelas relacionais.

2. **Instalar Dependências:**
   No diretório do projeto, abra o terminal e execute:
   ```bash
   npm install
   ```

3. **Iniciar o Servidor Backend:**
   ```bash
   npm run dev
   ```

4. **Acessar o Frontend:**
   - Dê um duplo clique ou abra o arquivo `index.html` em qualquer navegador de internet.
   - Para testar como **Cliente Comum**: use `teste@email.com` | senha `123456`.
   - Para testar como **Administrador (Gerente)**: use `admin@email.com` | senha `admin123`.
