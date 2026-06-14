// src/routes/api.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');


// Importações necessárias para as rotas funcionarem
const db = require('../config/database');
const { verificarAdmin } = require('../middlewares/authMiddleware');
const pedidoSubject = require('../services/faturamentoService');

//  POST /registrar - Cadastro de novo cliente comum
router.post('/registrar', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, senha.' });
  }
  try {
    const [rows] = await db.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    }
    const [result] = await db.execute(
      'INSERT INTO usuarios (nome, email, senha, role) VALUES (?, ?, ?, ?)',
      [nome, email, senha, 'cliente']
    );
    return res.status(201).json({ mensagem: 'Conta criada com sucesso.', id: result.insertId });
  } catch (err) {
    console.error('[REGISTRAR]', err.message);
    return res.status(500).json({ erro: 'Erro interno ao registrar usuário.' });
  }
});

//  POST /login - Autenticação plaintext; retorna id, nome e role

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Campos obrigatórios: email, senha.' });
  }
  try {
    // Busca pelo e-mail e compara a senha em plaintext diretamente no SQL
    const [rows] = await db.execute(
      'SELECT id, nome, role FROM usuarios WHERE email = ? AND BINARY senha = ?',
      [email, String(senha)]
    );
    if (rows.length === 0) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }
    const { id, nome, role } = rows[0];
    return res.status(200).json({ id, nome, role });
  } catch (err) {
    console.error('[LOGIN]', err.message);
    return res.status(500).json({ erro: 'Erro interno ao autenticar.' });
  }
});

//  GET /produtos - Catálogo completo (público)

router.get('/produtos', async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM produtos ORDER BY id ASC');
    return res.status(200).json(rows);
  } catch (err) {
    console.error('[PRODUTOS GET]', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar produtos.' });
  }
});

//  POST /produtos - Criação de produto (somente admin)

router.post('/produtos', async (req, res) => {
  const { nome, preco, descricao, estoque, id_usuario } = req.body;
  try {
    const bloqueio = await verificarAdmin(id_usuario);
    if (bloqueio) return res.status(bloqueio.status).json({ erro: bloqueio.erro });

    if (!nome || preco === undefined || estoque === undefined) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, preco, estoque.' });
    }
    const [result] = await db.execute(
      'INSERT INTO produtos (nome, preco, descricao, estoque) VALUES (?, ?, ?, ?)',
      [nome, preco, descricao ?? '', estoque]
    );
    const [created] = await db.execute('SELECT * FROM produtos WHERE id = ?', [result.insertId]);
    return res.status(201).json({ mensagem: 'Produto criado com sucesso.', produto: created[0] });
  } catch (err) {
    console.error('[PRODUTOS POST]', err.message);
    return res.status(500).json({ erro: 'Erro ao criar produto.' });
  }
});

//  PUT /produtos/:id - Edição de produto (somente admin)

router.put('/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, preco, descricao, estoque, id_usuario } = req.body;
  try {
    const bloqueio = await verificarAdmin(id_usuario);
    if (bloqueio) return res.status(bloqueio.status).json({ erro: bloqueio.erro });

    const [result] = await db.execute(
      'UPDATE produtos SET nome = ?, preco = ?, descricao = ?, estoque = ? WHERE id = ?',
      [nome, preco, descricao, estoque, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }
    const [updated] = await db.execute('SELECT * FROM produtos WHERE id = ?', [id]);
    return res.status(200).json({ mensagem: 'Produto atualizado com sucesso.', produto: updated[0] });
  } catch (err) {
    console.error('[PRODUTOS PUT]', err.message);
    return res.status(500).json({ erro: 'Erro ao atualizar produto.' });
  }
});

//  DELETE /produtos/:id - Remoção de produto (somente admin)

router.delete('/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const { id_usuario } = req.body;
  try {
    const bloqueio = await verificarAdmin(id_usuario);
    if (bloqueio) return res.status(bloqueio.status).json({ erro: bloqueio.erro });

    const [result] = await db.execute('DELETE FROM produtos WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }
    return res.status(200).json({ mensagem: 'Produto removido com sucesso.' });
  } catch (err) {
    console.error('[PRODUTOS DELETE]', err.message);
    return res.status(500).json({ erro: 'Erro ao remover produto.' });
  }
});

//  GET /pedidos - Auditoria de pedidos (somente admin) [RF02]

router.get('/pedidos', async (req, res) => {
  const id_usuario = req.query.id_usuario;
  try {
    const bloqueio = await verificarAdmin(id_usuario);
    if (bloqueio) return res.status(bloqueio.status).json({ erro: bloqueio.erro });

    const [rows] = await db.execute(`
      SELECT
        p.id            AS pedido_id,
        u.nome          AS cliente,
        p.total,
        p.metodo_pagamento,
        p.chave_fiscal,
        p.data_criacao
      FROM pedidos p
      INNER JOIN usuarios u ON u.id = p.id_usuario
      ORDER BY p.data_criacao DESC
    `);
    return res.status(200).json(rows);
  } catch (err) {
    console.error('[PEDIDOS GET]', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar pedidos.' });
  }
});

//  POST /pedidos - Checkout com validação de estoque

router.post('/pedidos', async (req, res) => {
  const { id_usuario, itens, metodo_pagamento } = req.body;

  if (!id_usuario || !itens?.length || !metodo_pagamento) {
    return res.status(400).json({ erro: 'Campos obrigatórios: id_usuario, itens, metodo_pagamento.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let total = 0;
    const linhasItens = [];

    for (const item of itens) {
      const [rows] = await conn.execute(
        'SELECT id, nome, preco, estoque FROM produtos WHERE id = ? FOR UPDATE',
        [item.id_produto]
      );
      if (rows.length === 0) throw new Error(`Produto ${item.id_produto} não encontrado.`);
      const produto = rows[0];
      if (produto.estoque < item.quantidade) {
        throw new Error(`Estoque insuficiente para "${produto.nome}". Disponível: ${produto.estoque}.`);
      }
      total += produto.preco * item.quantidade;
      linhasItens.push({ ...item, preco_unitario: produto.preco });
    }

    const chave_fiscal = crypto.randomBytes(16).toString('hex').toUpperCase();

    const [pedidoResult] = await conn.execute(
      'INSERT INTO pedidos (id_usuario, total, metodo_pagamento, chave_fiscal) VALUES (?, ?, ?, ?)',
      [id_usuario, total.toFixed(2), metodo_pagamento, chave_fiscal]
    );
    const pedidoId = pedidoResult.insertId;

    for (const item of linhasItens) {
      await conn.execute(
        'INSERT INTO pedidos_itens (id_pedido, id_produto, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
        [pedidoId, item.id_produto, item.quantidade, item.preco_unitario]
      );
      await conn.execute(
        'UPDATE produtos SET estoque = estoque - ? WHERE id = ?',
        [item.quantidade, item.id_produto]
      );
    }

    await conn.commit();

    const [uRows] = await db.execute('SELECT nome FROM usuarios WHERE id = ?', [id_usuario]);
    const nomeUsuario = uRows[0]?.nome ?? 'Desconhecido';

    pedidoSubject.notify({
      pedidoId,
      chave_fiscal,
      total: total.toFixed(2),
      metodo_pagamento,
      usuario: nomeUsuario,
    });

    return res.status(201).json({
      mensagem:         'Pedido realizado com sucesso.',
      pedido_id:        pedidoId,
      total:            parseFloat(total.toFixed(2)),
      metodo_pagamento,
      chave_fiscal,
    });
  } catch (err) {
    await conn.rollback();
    console.error('[PEDIDOS POST]', err.message);
    return res.status(422).json({ erro: err.message });
  } finally {
    conn.release();
  }
});

//EXPORTAÇÃO DO ROUTER PARA USO NO SERVER.JS
module.exports = router;