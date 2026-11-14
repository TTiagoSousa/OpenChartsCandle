# Ligar dados — `Datafeed`

O `Terminal` não sabe de onde vêm os preços: pede-os a um objeto `Datafeed` que tu implementas.
O simulador das demos (`demo/simulator.ts`) é um exemplo completo.

```ts
interface Datafeed {
  // Símbolos disponíveis (pesquisa e watchlist)
  getSymbols(): SymbolInfo[] | Promise<SymbolInfo[]>;

  // Histórico, da vela mais antiga para a mais recente.
  // Aos blocos: devolve as `countBack` velas mais recentes com time < `to`, e noMore quando não há mais.
  // Tudo de uma vez (modo antigo): ignora o request e devolve Bar[].
  getBars(symbol: string, timeframe: Timeframe, request: BarsRequest): Promise<{ bars: Bar[]; noMore?: boolean } | Bar[]>;

  // Tempo real: chama onBar com a vela atual sempre que muda,
  // e com a vela nova quando começa um período novo. Devolve a função para cancelar.
  // Depois de perder a ligação, chama onResync(): o gráfico pede as velas que faltam.
  subscribeBars(symbol: string, timeframe: Timeframe, onBar: (bar: Bar) => void, onResync?: () => void): () => void;

  // (opcional) Cotações para a watchlist e o painel de detalhes
  subscribeQuotes?(symbols: string[], onQuote: (q: Quote) => void): () => void;
}

interface SymbolInfo {
  symbol: string;     // 'BTCUSDT'
  precision: number;  // casas decimais do preço
  name?: string;      // 'Bitcoin / TetherUS'
  exchange?: string;  // 'BINANCE'
  type?: string;      // separador da pesquisa: crypto, forex, stock…
  currency?: string;  // 'USDT'
  timeframes?: string[]; // intervalos deste símbolo: ['1', '5', '1h', '4h', '1D']
  timezone?: string;     // fuso da bolsa, 'America/New_York' (usado com timezone: 'exchange')
}

interface BarsRequest {
  to: number;          // limite superior EXCLUSIVO, unix segundos
  countBack: number;   // quantas velas (as mais recentes antes de `to`); devolver menos não faz mal
  signal: AbortSignal; // abortado quando o pedido deixa de interessar (mudou o mercado ou o intervalo)
  firstRequest: boolean;
}

interface Quote {
  symbol: string;
  last: number;
  change: number;
  changePct: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}
```

`timeframe` é um objeto `{ id: '5', label: '5 minutos', short: '5m', seconds: 300 }`. Usa `timeframe.seconds` ou `timeframe.id` para traduzir para o formato da tua fonte.

Quando o utilizador muda de símbolo ou de timeframe, o Terminal cancela a subscrição anterior, aborta os pedidos em curso e chama `getBars` + `subscribeBars` de novo. Uma resposta que chegue para um mercado ou intervalo que já não é o atual é descartada, mesmo que o datafeed ignore o `signal`.

---

## Histórico aos blocos (como o TradingView)

Com um gateway que serve o histórico por intervalo, o gráfico só pede o que precisa:

1. **Primeiro pedido:** as últimas `countBack` velas (1000 por omissão) até agora, ou à volta de `initialTime` se o passares.
2. **Ao arrastar para a esquerda:** quando a vista fica a menos de um ecrã da vela mais antiga, pede o bloco anterior (`to` = hora da vela mais antiga) e junta-o à esquerda. A vista não salta e as velas repetidas são ignoradas.
3. **`noMore: true`:** o gráfico deixa de pedir para trás.
4. **Um pedido de cada vez** por mercado e intervalo.

```ts
const datafeed: Datafeed = {
  getSymbols: () => fetch('/api/symbols').then((r) => r.json()),

  async getBars(symbol, tf, { to, countBack, signal }) {
    const url = `/api/candles?symbol=${symbol}&tf=${tf.id}&to=${to}&limit=${countBack}`;
    const bars = await fetch(url, { signal }).then((r) => r.json()); // velas com time < to, da mais antiga para a mais recente
    return { bars, noMore: bars.length < countBack };
  },

  subscribeBars(symbol, tf, onBar, onResync) {
    const ws = new WebSocket(`wss://o-teu-gateway/candles?symbol=${symbol}&tf=${tf.id}`);
    ws.onmessage = (e) => onBar(JSON.parse(e.data));
    ws.onopen = () => onResync?.(); // ao voltar a ligar, o gráfico preenche o buraco
    return () => ws.close();
  },
};

createTerminal(el, { datafeed, countBack: 1000, initialTime: Date.UTC(2022, 2, 1) / 1000 });
```

> Se o gateway devolver sempre no máximo N velas, não faz mal: o gráfico pede mais quando precisa.

### Tempo real

- `onBar(bar)` com o `time` da última vela atualiza-a; com um `time` maior acrescenta uma vela; mais antigo é ignorado.
- Se a vista estiver na vela mais recente, acompanha a vela nova. Se estiveres a ver o passado, a vista não mexe.
- `onResync()` depois de perder a ligação: o gráfico pede as velas desde a última que tem (`to` = agora) e preenche o buraco.

### Ir a datas e trades que ainda não estão carregados

`chart.goToTime(time)` e `chart.goToTrade(id, 'entry' | 'exit' | 'both')` devolvem uma `Promise`. Se o instante for mais antigo do que a vela mais antiga carregada, pedem os blocos que faltam. Se estiver muito longe (mais de 20 000 velas, opção `maxJump` do `setDataSource`), carregam só uma janela à volta da data. Arrastar para a direita carrega o resto, e "Mais recente" (o botão » ou `scrollToRealtime()`) volta às últimas velas.

Os trades e os marcadores ficam na vela que contém o instante, em qualquer intervalo: uma entrada às 10:37 fica na vela das 10:00 no 1h. Os desenhos ficam presos a (tempo, preço).

### Trocar de intervalo

`terminal.setTimeframe('4h')` mantém no centro o instante que estava no centro (março de 2022 no 1h → março de 2022 no 4h) e carrega o histórico necessário até lá. Se estiveres nas velas mais recentes, continuas nelas.

### Estado e erros

```ts
terminal.loadingChanged.on((loading) => spinner.hidden = !loading);
terminal.error.on((err) => mostrarAviso(`Falha a carregar velas: ${err}`)); // e terminal.reload() para tentar de novo
terminal.timeframeChanged.on((tf) => console.log(tf.id));
terminal.symbolChanged.on((info) => console.log(info.symbol));
```

A biblioteca não mostra mensagens por cima do gráfico (`loadingIndicator: false` tira também o spinner).

### Sem Terminal: `chart.setDataSource`

```ts
const chart = createChart(el);
chart.setSymbol({ symbol: 'BTCUSDT', precision: 2 });
await chart.setDataSource(({ to, countBack, signal }) => api.candles('BTCUSDT', '1h', to, countBack, signal), 3600);
socket.on('candle', (bar) => chart.update(bar));
socket.on('reconnect', () => chart.resync());
chart.loadingChanged.on(...);  chart.historyError.on(...);
```

---

## Modo antigo: tudo de uma vez

Um datafeed cujo `getBars(symbol, tf)` devolve um `Bar[]` com todo o histórico continua a funcionar. O gráfico pede uma vez e não volta a pedir para trás.


## Exemplo: base de dados própria

O teu backend devolve as velas já no timeframe pedido:

```ts
import { createTerminal, type Datafeed } from 'openchartscandle/candlestick';
import 'openchartscandle/style.css';

const datafeed: Datafeed = {
  getSymbols: () => fetch('/api/symbols').then((r) => r.json()),

  getBars: async (symbol, tf) => {
    const r = await fetch(`/api/candles?symbol=${symbol}&tf=${tf.id}&limit=5000`);
    return r.json(); // [{ time, open, high, low, close, volume }, …]
  },

  subscribeBars: (symbol, tf, onBar) => {
    const ws = new WebSocket(`wss://o-teu-servidor/candles?symbol=${symbol}&tf=${tf.id}`);
    ws.onmessage = (e) => onBar(JSON.parse(e.data));
    return () => ws.close();
  },
};

createTerminal(document.getElementById('grafico')!, { datafeed, watchlist: false });
```

Se só guardares velas de **1 minuto**, agrega no frontend com `aggregate`:

```ts
import { aggregate } from 'openchartscandle/candlestick';

getBars: async (symbol, tf) => {
  const m1 = await fetch(`/api/candles?symbol=${symbol}&tf=1`).then((r) => r.json());
  return tf.seconds === 60 ? m1 : aggregate(m1, tf.seconds);
},
```

Se não tiveres tempo real, devolve uma função vazia em `subscribeBars`: `subscribeBars: () => () => {}`.

---

## Exemplo: Binance (dados públicos, sem chave)

```ts
import type { Bar, Datafeed, Quote, Timeframe } from 'openchartscandle/candlestick';

const REST = 'https://api.binance.com/api/v3';
const WS = 'wss://stream.binance.com:9443';

// timeframe da biblioteca -> intervalo da Binance
const INTERVAL: Record<string, string> = {
  '1': '1m', '3': '3m', '5': '5m', '15': '15m', '30': '30m',
  '60': '1h', '120': '2h', '240': '4h', '1D': '1d', '1W': '1w',
};

const toBar = (k: (string | number)[]): Bar => ({
  time: Number(k[0]) / 1000, open: +k[1], high: +k[2], low: +k[3], close: +k[4], volume: +k[5],
});

export const binance: Datafeed = {
  getSymbols: () => [
    { symbol: 'BTCUSDT', name: 'Bitcoin / TetherUS', exchange: 'BINANCE', type: 'crypto', precision: 2, currency: 'USDT' },
    { symbol: 'ETHUSDT', name: 'Ethereum / TetherUS', exchange: 'BINANCE', type: 'crypto', precision: 2, currency: 'USDT' },
    { symbol: 'SOLUSDT', name: 'Solana / TetherUS', exchange: 'BINANCE', type: 'crypto', precision: 2, currency: 'USDT' },
  ],

  // A Binance devolve no máximo 1000 velas por pedido: pede várias páginas para trás.
  async getBars(symbol: string, tf: Timeframe): Promise<Bar[]> {
    const pages = 5;
    let endTime: number | undefined;
    let all: Bar[] = [];
    for (let i = 0; i < pages; i++) {
      const url = `${REST}/klines?symbol=${symbol}&interval=${INTERVAL[tf.id]}&limit=1000${endTime ? `&endTime=${endTime}` : ''}`;
      const rows: (string | number)[][] = await fetch(url).then((r) => r.json());
      if (!rows.length) break;
      all = rows.map(toBar).concat(all);
      endTime = Number(rows[0][0]) - 1;
      if (rows.length < 1000) break;
    }
    return all;
  },

  // Stream de klines: a vela atual chega atualizada a cada ~1–2 s.
  subscribeBars(symbol, tf, onBar) {
    const ws = new WebSocket(`${WS}/ws/${symbol.toLowerCase()}@kline_${INTERVAL[tf.id]}`);
    ws.onmessage = (e) => {
      const k = JSON.parse(e.data).k;
      onBar({ time: k.t / 1000, open: +k.o, high: +k.h, low: +k.l, close: +k.c, volume: +k.v });
    };
    return () => ws.close();
  },

  // Ticker de 24h para a watchlist.
  subscribeQuotes(symbols, onQuote) {
    const streams = symbols.map((s) => `${s.toLowerCase()}@ticker`).join('/');
    const ws = new WebSocket(`${WS}/stream?streams=${streams}`);
    ws.onmessage = (e) => {
      const t = JSON.parse(e.data).data;
      const q: Quote = { symbol: t.s, last: +t.c, change: +t.p, changePct: +t.P, open: +t.o, high: +t.h, low: +t.l, volume: +t.v };
      onQuote(q);
    };
    return () => ws.close();
  },
};
```

### Movimento mais fluido (tick a tick)

O stream de `kline` só atualiza a cada 1–2 segundos. Para o preço mexer a cada negócio, como no TradingView, usa `@aggTrade` e constrói a vela atual no browser:

```ts
import { bucketStart } from 'openchartscandle/candlestick';

subscribeBars(symbol, tf, onBar) {
  let cur: Bar | null = null;
  const ws = new WebSocket(`${WS}/ws/${symbol.toLowerCase()}@aggTrade`);
  ws.onmessage = (e) => {
    const t = JSON.parse(e.data);           // { p: preço, q: quantidade, T: hora em ms }
    const price = +t.p;
    const time = bucketStart(t.T / 1000, tf.seconds);
    if (!cur || time > cur.time) cur = { time, open: price, high: price, low: price, close: price, volume: 0 };
    cur.high = Math.max(cur.high, price);
    cur.low = Math.min(cur.low, price);
    cur.close = price;
    cur.volume += +t.q;
    onBar({ ...cur });
  };
  return () => ws.close();
},
```

> Junta as duas abordagens se quiseres o volume exato da Binance: usa a `kline` para fechar cada vela e o `aggTrade` para o movimento entre atualizações.

### Enviar ordens

Os dados de mercado são públicos, mas **as ordens exigem a API key e o secret**, que nunca podem estar no frontend. Cria um endpoint no teu backend (por exemplo `POST /api/orders`) que assina o pedido e o envia à Binance. O gráfico só chama esse endpoint.
