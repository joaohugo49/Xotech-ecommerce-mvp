const API = '/api';

// Estado Global
let sessao   = null;   // { id, nome, role }
let carrinho = [];     // [{ produto, quantidade }]
let produtos = [];     // cache do catálogo

// Utilitários
const fmt = v => parseFloat(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function mostrarMsg(id, texto, tipo) {
  const el = document.getElementById(id);
  el.className = `msg-painel ${tipo}`;
  el.textContent = texto;
  el.style.display = 'block';
}
function limparMsg(id) {
  const el = document.getElementById(id);
  el.style.display = 'none';
  el.textContent = '';
}

// ── Painéis / Overlays ───────────────────────────────────────
function abrirPainel(id) {
  document.getElementById('overlay').classList.add('ativo');
  document.getElementById(id).classList.add('ativo');
}
function fecharTudo() {
  document.getElementById('overlay').classList.remove('ativo');
  document.querySelectorAll('.painel-lateral').forEach(p => p.classList.remove('ativo'));
  fecharModal();
}
function fecharModal() {
  document.getElementById('modal-produto').classList.remove('ativo');
  limparMsg('msg-editar');
}
function abrirLogin()    { abrirPainel('painel-login'); }
function abrirCarrinho() { renderCarrinho(); abrirPainel('painel-carrinho'); }
function abrirGerente()  {
  trocarAba('novo');
  abrirPainel('painel-gerente');
}

function trocarAba(nome) {
  document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('ativa'));
  document.querySelectorAll('.aba-conteudo').forEach(c => c.classList.remove('ativa'));
  document.getElementById('aba-btn-' + nome).classList.add('ativa');
  document.getElementById('aba-' + nome).classList.add('ativa');
  if (nome === 'auditoria') carregarAuditoria();
}

function alternarFormAuth() {
  const fl = document.getElementById('form-login');
  const fr = document.getElementById('form-registro');
  const titulo = document.getElementById('titulo-form-auth');
  if (fl.style.display === 'none') {
    fl.style.display = 'block'; fr.style.display = 'none';
    titulo.textContent = 'Acesse sua conta';
  } else {
    fl.style.display = 'none'; fr.style.display = 'block';
    titulo.textContent = 'Criar conta';
  }
}

// Sessão / Navbar
function atualizarNavbar() {
  const label     = document.getElementById('sessao-label');
  const btnLogin  = document.getElementById('btn-login-nav');
  const btnLogout = document.getElementById('btn-logout-nav');
  const btnGer    = document.getElementById('btn-gerente-nav');

  if (sessao) {
    const badgeClass = sessao.role === 'admin' ? 'badge-admin' : 'badge-cliente';
    const badgeText  = sessao.role === 'admin' ? 'ADMIN' : 'CLIENTE';
    label.innerHTML = `Olá, ${sessao.nome} <span class="badge-role ${badgeClass}">${badgeText}</span>`;
    btnLogin.style.display  = 'none';
    btnLogout.style.display = 'inline-flex';
    btnGer.style.display    = sessao.role === 'admin' ? 'inline-flex' : 'none';
  } else {
    label.textContent = 'Olá, Visitante';
    btnLogin.style.display  = 'inline-flex';
    btnLogout.style.display = 'none';
    btnGer.style.display    = 'none';
  }
}

function logout() {
  sessao = null;
  carrinho = [];
  atualizarNavbar();
  renderCatalogo();
  atualizarBadgeCarrinho();
}

// Auth
async function fazerLogin() {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  limparMsg('msg-login');
  if (!email || !senha) { mostrarMsg('msg-login', 'Preencha e-mail e senha.', 'erro'); return; }

  try {
    const res  = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha: String(senha) }),
    });
    const data = await res.json();
    if (!res.ok) { mostrarMsg('msg-login', data.erro, 'erro'); return; }

    sessao = { id: data.id, nome: data.nome, role: data.role };
    atualizarNavbar();
    renderCatalogo();
    fecharTudo();
  } catch {
    mostrarMsg('msg-login', 'Falha de conexão com o servidor.', 'erro');
  }
}

async function registrar() {
  const nome  = document.getElementById('reg-nome').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const senha = document.getElementById('reg-senha').value;
  limparMsg('msg-registro');
  if (!nome || !email || !senha) { mostrarMsg('msg-registro', 'Todos os campos são obrigatórios.', 'erro'); return; }

  try {
    const res  = await fetch(`${API}/registrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }),
    });
    const data = await res.json();
    if (!res.ok) { mostrarMsg('msg-registro', data.erro, 'erro'); return; }
    mostrarMsg('msg-registro', 'Conta criada! Faça login.', 'sucesso');
    setTimeout(alternarFormAuth, 1500);
  } catch {
    mostrarMsg('msg-registro', 'Falha de conexão com o servidor.', 'erro');
  }
}

// Catálogo
async function carregarProdutos() {
  try {
    const res = await fetch(`${API}/produtos`);
    produtos = await res.json();
    renderCatalogo();
  } catch {
    document.getElementById('grid-produtos').innerHTML =
      '<p style="color:var(--accent)">Servidor offline. Inicie o server.js.</p>';
  }
}

function renderCatalogo() {
  const grid    = document.getElementById('grid-produtos');
  const isAdmin = sessao?.role === 'admin';

  if (!produtos.length) { grid.innerHTML = '<p>Nenhum produto encontrado.</p>'; return; }

  grid.innerHTML = produtos.map(p => `
    <div class="card-produto">
      <div class="card-nome">${p.nome}</div>
      <div class="card-desc">${p.descricao ?? ''}</div>
      <div class="card-footer">
        <div>
          <div class="card-preco">${fmt(p.preco)}</div>
          <div class="card-estoque">Estoque: ${p.estoque} un.</div>
        </div>
      </div>
      <div class="card-acoes">
        <button class="btn-comprar" onclick="adicionarAoCarrinho(${p.id})">Adicionar ao Carrinho</button>
        <button class="btn-editar"  style="display:${isAdmin ? 'inline-flex' : 'none'}"
                onclick="abrirEdicao(${p.id})">Editar</button>
        <button class="btn-excluir" style="display:${isAdmin ? 'inline-flex' : 'none'}"
                onclick="excluirProduto(${p.id})" title="Excluir produto">&#x1F5D1;</button>
      </div>
    </div>
  `).join('');
}

// Criar Produto (ADMIN)
async function criarProduto() {
  limparMsg('msg-novo');
  const nome     = document.getElementById('novo-nome').value.trim();
  const preco    = parseFloat(document.getElementById('novo-preco').value);
  const descricao= document.getElementById('novo-descricao').value.trim();
  const estoque  = parseInt(document.getElementById('novo-estoque').value, 10);

  if (!nome || isNaN(preco) || isNaN(estoque)) {
    mostrarMsg('msg-novo', 'Preencha nome, preço e estoque corretamente.', 'erro'); return;
  }

  try {
    const res  = await fetch(`${API}/produtos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, preco, descricao, estoque, id_usuario: sessao.id }),
    });
    const data = await res.json();
    if (!res.ok) { mostrarMsg('msg-novo', data.erro, 'erro'); return; }

    mostrarMsg('msg-novo', 'Produto criado com sucesso.', 'sucesso');
    document.getElementById('novo-nome').value      = '';
    document.getElementById('novo-preco').value     = '';
    document.getElementById('novo-descricao').value = '';
    document.getElementById('novo-estoque').value   = '';
    await carregarProdutos();
  } catch {
    mostrarMsg('msg-novo', 'Falha de conexão com o servidor.', 'erro');
  }
}

// Excluir Produto (ADMIN)
async function excluirProduto(idProduto) {
  if (!sessao || sessao.role !== 'admin') return;
  const confirmar = window.confirm('Confirma a exclusão permanente deste produto?');
  if (!confirmar) return;

  try {
    const res = await fetch(`${API}/produtos/${idProduto}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_usuario: sessao.id }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.erro); return; }
    await carregarProdutos();
  } catch {
    alert('Falha de conexão com o servidor.');
  }
}

// Editar Produto (ADMIN)
function abrirEdicao(idProduto) {
  if (!sessao || sessao.role !== 'admin') return;
  const p = produtos.find(pr => pr.id === idProduto);
  if (!p) return;
  document.getElementById('modal-titulo-texto').textContent = 'Editar Produto';
  document.getElementById('edit-id').value        = p.id;
  document.getElementById('edit-nome').value      = p.nome;
  document.getElementById('edit-preco').value     = p.preco;
  document.getElementById('edit-descricao').value = p.descricao ?? '';
  document.getElementById('edit-estoque').value   = p.estoque;
  limparMsg('msg-editar');
  document.getElementById('modal-produto').classList.add('ativo');
}

async function salvarEdicao() {
  limparMsg('msg-editar');
  const id        = document.getElementById('edit-id').value;
  const nome      = document.getElementById('edit-nome').value.trim();
  const preco     = parseFloat(document.getElementById('edit-preco').value);
  const descricao = document.getElementById('edit-descricao').value.trim();
  const estoque   = parseInt(document.getElementById('edit-estoque').value, 10);

  if (!nome || isNaN(preco) || isNaN(estoque)) {
    mostrarMsg('msg-editar', 'Preencha todos os campos corretamente.', 'erro'); return;
  }

  try {
    const res  = await fetch(`${API}/produtos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, preco, descricao, estoque, id_usuario: sessao.id }),
    });
    const data = await res.json();
    if (!res.ok) { mostrarMsg('msg-editar', data.erro, 'erro'); return; }
    fecharModal();
    await carregarProdutos();
  } catch {
    mostrarMsg('msg-editar', 'Falha de conexão com o servidor.', 'erro');
  }
}

// Auditoria de Pedidos RF02 (ADMIN)
async function carregarAuditoria() {
  if (!sessao || sessao.role !== 'admin') return;
  const corpo = document.getElementById('audit-corpo');
  corpo.innerHTML = '<div class="audit-loading">Consultando banco de dados...</div>';

  try {
    const res  = await fetch(`${API}/pedidos?id_usuario=${sessao.id}`);
    const data = await res.json();

    if (!res.ok) {
      corpo.innerHTML = `<div class="audit-loading" style="color:var(--accent)">${data.erro}</div>`;
      return;
    }

    if (!data.length) {
      corpo.innerHTML = '<div class="audit-loading">Nenhum pedido registrado ainda.</div>';
      return;
    }

    const metodoCss = { pix: 'metodo-pix', cartao: 'metodo-cartao', boleto: 'metodo-boleto' };
    const rows = data.map(p => `
      <tr>
        <td>#${p.pedido_id}</td>
        <td style="font-family:var(--font);color:var(--texto)">${p.cliente}</td>
        <td style="color:var(--amarelo)">${fmt(p.total)}</td>
        <td><span class="td-metodo ${metodoCss[p.metodo_pagamento] ?? ''}">${p.metodo_pagamento}</span></td>
        <td class="td-fiscal">${p.chave_fiscal}</td>
      </tr>
    `).join('');

    corpo.innerHTML = `
      <table class="tabela-auditoria">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Método</th>
            <th>Chave Fiscal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch {
    corpo.innerHTML = '<div class="audit-loading" style="color:var(--accent)">Falha de conexão com o servidor.</div>';
  }
}

// Carrinho
function adicionarAoCarrinho(idProduto) {
  const prod = produtos.find(p => p.id === idProduto);
  if (!prod) return;
  const idx = carrinho.findIndex(i => i.produto.id === idProduto);
  if (idx >= 0) {
    if (carrinho[idx].quantidade < prod.estoque) carrinho[idx].quantidade++;
  } else {
    carrinho.push({ produto: prod, quantidade: 1 });
  }
  atualizarBadgeCarrinho();
}

function alterarQtd(idProduto, delta) {
  const idx = carrinho.findIndex(i => i.produto.id === idProduto);
  if (idx < 0) return;
  carrinho[idx].quantidade += delta;
  if (carrinho[idx].quantidade <= 0) carrinho.splice(idx, 1);
  atualizarBadgeCarrinho();
  renderCarrinho();
}

function removerItem(idProduto) {
  carrinho = carrinho.filter(i => i.produto.id !== idProduto);
  atualizarBadgeCarrinho();
  renderCarrinho();
}

function atualizarBadgeCarrinho() {
  const total = carrinho.reduce((s, i) => s + i.quantidade, 0);
  const badge = document.getElementById('cart-count');
  badge.textContent = total;
  badge.style.display = total > 0 ? 'flex' : 'none';
}

function calcularTotal() {
  return carrinho.reduce((s, i) => s + i.produto.preco * i.quantidade, 0);
}

function renderCarrinho() {
  const lista  = document.getElementById('lista-carrinho');
  const vazio  = document.getElementById('carrinho-vazio');
  const resumo = document.getElementById('resumo-carrinho-box');
  limparMsg('msg-pedido');
  document.getElementById('confirmacao-box').classList.remove('visivel');

  if (!carrinho.length) {
    lista.innerHTML = '';
    vazio.style.display  = 'block';
    resumo.style.display = 'none';
    return;
  }

  vazio.style.display  = 'none';
  resumo.style.display = 'block';

  lista.innerHTML = carrinho.map(i => `
    <div class="item-carrinho">
      <div class="item-carrinho-info">
        <div class="item-nome">${i.produto.nome}</div>
        <div class="item-qtd-ctrl">
          <button class="btn-qtd" onclick="alterarQtd(${i.produto.id},-1)">&#x2212;</button>
          <span class="qtd-val">${i.quantidade}</span>
          <button class="btn-qtd" onclick="alterarQtd(${i.produto.id},1)">&#x2B;</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
        <span class="item-preco">${fmt(i.produto.preco * i.quantidade)}</span>
        <button class="btn-remover-item" onclick="removerItem(${i.produto.id})">&#x2715;</button>
      </div>
    </div>
  `).join('');

  const total = calcularTotal();
  document.getElementById('subtotal-val').textContent = fmt(total);
  document.getElementById('total-val').textContent    = fmt(total);
}

async function finalizarPedido() {
  limparMsg('msg-pedido');
  if (!sessao) { mostrarMsg('msg-pedido', 'Faça login para finalizar o pedido.', 'erro'); return; }
  if (!carrinho.length) { mostrarMsg('msg-pedido', 'Carrinho vazio.', 'erro'); return; }
  const metodo = document.getElementById('metodo-pagamento').value;
  if (!metodo) { mostrarMsg('msg-pedido', 'Selecione um método de pagamento.', 'erro'); return; }

  const payload = {
    id_usuario:       sessao.id,
    metodo_pagamento: metodo,
    itens: carrinho.map(i => ({ id_produto: i.produto.id, quantidade: i.quantidade })),
  };

  try {
    const res  = await fetch(`${API}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { mostrarMsg('msg-pedido', data.erro, 'erro'); return; }

    const metodosMap = { pix: 'PIX', cartao: 'Cartão de Crédito', boleto: 'Boleto Bancário' };
    const dataHora   = new Date().toLocaleString('pt-BR');

    document.getElementById('confirmacao-texto').textContent =
`Pedido Nº:       #${data.pedido_id}
Cliente:         ${sessao.nome}
Total:           ${fmt(data.total)}
Método:          ${metodosMap[data.metodo_pagamento] ?? data.metodo_pagamento}
Chave Fiscal:    ${data.chave_fiscal}
Data / Hora:     ${dataHora}

Obrigado por comprar na Xotech Ltda.`;

    document.getElementById('confirmacao-box').classList.add('visivel');
    carrinho = [];
    atualizarBadgeCarrinho();
    await carregarProdutos();
  } catch {
    mostrarMsg('msg-pedido', 'Falha de conexão com o servidor.', 'erro');
  }
}

// Inicialização
window.onload = () => {
  atualizarNavbar();
  carregarProdutos();
};