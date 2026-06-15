# Xotech - MVP de E-commerce de Eletrônicos Local

MVP funcional desenvolvido como projeto prático para a disciplina de **Projeto de Arquitetura de Sistemas**. 

## 🏛️ Arquitetura do Sistema e Infraestrutura
Optamos por uma estrutura unificada local. O cliente web, o servidor de aplicação e o banco de dados compartilham a mesma máquina. Em vez de utilizarmos servidores em nuvem distribuídos nesta fase de validação, essa escolha local elimina os trade-offs de latência de rede, permitindo focar os testes estritamente na integridade das nossas regras de negócio.

O software segue a Arquitetura em Três Camadas tradicional (3-Tier). Aplicamos o conceito de Ocultamento de Informação, onde a tela de apresentação é apenas a vitrine, enquanto toda a mecânica de banco de dados e as credenciais críticas ficam ocultas e protegidas na aplicação. O acoplamento evolutivo ruim foi cortado, pois as camadas conversam apenas via dados abstratos em formato JSON.

## 🔑 Padrões de Projeto Aplicados (Design Patterns)
- **Singleton:** Aplicado na nossa conexão com o MySQL, garantindo que o sistema crie apenas uma instância ativa de comunicação, poupando memória do computador.
- **Facade (Fachada):** A nossa API encapsulada no Backend atua como uma Fachada, implementada através do Express. Ela esconde toda a complexidade de tabelas, consultas e relacionamentos do banco de dados, oferecendo para a nossa interface endpoints limpos e de uma única linha.
- **Observer:** Desacoplamento assíncrono do pós-venda. Quando o pedido é salvo, o sistema dispara uma notificação que aciona os observadores fiscais e financeiros de forma assíncrona e independente, gerando a Nota Fiscal simulada.
- **Strategy:** Algoritmos intercambiáveis de faturamento acionados pelo observador financeiro para alternar entre PIX, Cartão e Boleto de forma dinâmica.
- **GRASP:** Respeita a diretriz do Especialista da Informação, fazendo com que o servidor consulte o inventário da tabela especialista (estoque) antes de liberar qualquer faturamento.

## 🛠️ Tecnologias Utilizadas
- **Frontend (Apresentação):** HTML5, CSS3 e JavaScript Vanilla (Isolados na pasta `/public`)
- **Backend (Lógica):** Node.js, Express.js e CORS (Modularizado na pasta `/src`)
- **Banco de Dados (Dados):** MySQL Server (Driver `mysql2/promise`)

## 🚀 Como Rodar o Projeto Localmente

1. **Configurar o Banco de Dados:**
   - Abra o MySQL Workbench.
   - Execute o script contido no arquivo `database/SQL.sql` para criar a base `loja_simplificada` e as tabelas relacionais.

2. **Configurar as Variáveis de Ambiente:**
   - Na raiz do projeto, duplique o arquivo `.env.example` e renomeie a cópia para `.env`.
   - Abra o arquivo `.env` e preencha com o usuário e a senha do seu MySQL local.

3. **Instalar Dependências:**
   No diretório raiz do projeto, abra o terminal e execute:
   ```bash
   npm install
   ```

4. **Iniciar o Servidor Backend:**
   ```bash
   npm run dev
   ```

5. **Acessar a Plataforma:**
   - Abra o seu navegador de internet e acesse: **`http://localhost:3000`**
   - Para testar como **Cliente Comum**: use `teste@email.com` | senha `123456`.
   - Para testar como **Administrador (Gerente)**: use `admin@email.com` | senha `admin123`.
