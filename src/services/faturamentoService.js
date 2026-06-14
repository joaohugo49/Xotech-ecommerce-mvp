//  OBSERVER - Faturamento Assíncrono
class PedidoSubject {
  constructor() { this._observers = []; }
  subscribe(observer) { this._observers.push(observer); }
  notify(payload) {
    for (const obs of this._observers) {
      setImmediate(() => obs.update(payload));
    }
  }
}

class FaturamentoFiscalObserver {
  update({ pedidoId, chave_fiscal, total, usuario }) {
    console.log(`[FISCAL] Pedido #${pedidoId} | NF-e chave: ${chave_fiscal} | Total: R$ ${total} | Comprador: ${usuario}`);
  }
}

//  STRATEGY - Faturamento Financeiro por Método de Pagamento

class PagamentoCartaoStrategy {
  processar({ pedidoId, total }) {
    const parcelas = total > 300 ? 12 : 3;
    console.log(`[FINANCEIRO] Pedido #${pedidoId} | Cartão de Crédito em até ${parcelas}x | Total: R$ ${total}`);
  }
}

class PagamentoPixStrategy {
  processar({ pedidoId, total }) {
    const desconto = (total * 0.05).toFixed(2);
    console.log(`[FINANCEIRO] Pedido #${pedidoId} | PIX aprovado | Desconto 5%: -R$ ${desconto} | Total: R$ ${total}`);
  }
}

class PagamentoBoletoStrategy {
  processar({ pedidoId, total }) {
    const vencimento = new Date(Date.now() + 3 * 86400000).toLocaleDateString('pt-BR');
    console.log(`[FINANCEIRO] Pedido #${pedidoId} | Boleto gerado | Vencimento: ${vencimento} | Total: R$ ${total}`);
  }
}

const estrategias = {
  cartao: new PagamentoCartaoStrategy(),
  pix:    new PagamentoPixStrategy(),
  boleto: new PagamentoBoletoStrategy(),
};

class FinanceiroObserver {
  update(payload) {
    const estrategia = estrategias[payload.metodo_pagamento];
    if (estrategia) estrategia.processar(payload);
    else console.warn(`[FINANCEIRO] Método desconhecido: ${payload.metodo_pagamento}`);
  }
}

const pedidoSubject = new PedidoSubject();
pedidoSubject.subscribe(new FaturamentoFiscalObserver());
pedidoSubject.subscribe(new FinanceiroObserver());
