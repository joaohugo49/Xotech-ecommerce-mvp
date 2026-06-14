'use strict';

// 1. CARREGAMENTO DE VARIÁVEIS DE AMBIENTE (SEMPRE A PRIMEIRA LINHA)
require('dotenv').config(); 

// 2. IMPORTAÇÕES DE MÓDULOS DO NODE E DEPENDÊNCIAS (PACOTES)
const path = require('path');
const express = require('express');
const cors = require('cors');

// 3. IMPORTAÇÕES DE ARQUIVOS LOCAIS DO PROJETO
const db = require('./src/config/database');
const apiRoutes = require('./src/routes/api'); // 👈 ADICIONE ESTA LINHA AQUI!

// 4. INICIALIZAÇÃO DA APLICAÇÃO EXPRESS
const app = express();

// 5. CONFIGURAÇÃO DE MIDDLEWARES (POLÍTICAS E PARSERS)
app.use(cors());
app.use(express.json());

// 6. SERVIR ARQUIVOS ESTÁTICOS DA PASTA FRONTEND
app.use(express.static(path.join(__dirname, 'public')));

// ATIVAÇÃO DAS ROTAS DA API
app.use('/api', apiRoutes); // 👈 ADICIONE ESTA LINHA AQUI!

// IMPORTAÇÕES DA ARQUITETURA EXTRAÍDA
const { verificarAdmin } = require('./src/middlewares/authMiddleware');
const pedidoSubject = require('./src/services/faturamentoService');

//  START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
