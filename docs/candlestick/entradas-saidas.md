# Entradas e saídas (trades)

O gráfico desenha operações à maneira de um testador de estratégias:

- **seta e etiqueta na entrada:** azul para long, laranja para short;
- **seta na saída**, a verde (lucro) ou a vermelho (perda);
- **linha tracejada** da entrada à saída, com o **P&L em %** no meio;
- **trade aberto:** a linha vai até ao último preço, com P&L ao vivo ("Long aberto +1.34%"), e há uma linha e uma etiqueta no eixo com o preço de entrada.

```ts
chart.setTrades([
  { id: 'a', side: 'long',  entryTime: 1760371200, entryPrice: 64100, exitTime: 1760385600, exitPrice: 64850, qty: 0.1 },
  { id: 'b', side: 'short', entryTime: 1760385600, entryPrice: 64850, exitTime: 1760392800, exitPrice: 64600 },
  { id: 'c', side: 'long',  entryTime: 1760392800, entryPrice: 64600 },  // aberto (sem saída)
]);

// fechar um trade aberto mais tarde
chart.updateTrade('c', { exitTime: 1760400000, exitPrice: 65010 });

// acrescentar um novo
chart.addTrade({ id: 'd', side: 'short', entryTime: 1760400000, entryPrice: 65010 });
```

Com o Terminal usa `terminal.chart.setTrades(...)`.

## `Trade`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string?` | Identifica o trade (`updateTrade`, `goToTrade`, lista). Sem id, recebe a posição ("1", "2"…) |
| `side` | `'long' \| 'short'` | Direção |
| `entryTime` / `entryPrice` | `number` | Entrada (tempo em segundos ou ms) |
| `exitTime` / `exitPrice` | `number?` | Saída. Sem eles o trade está **aberto** |
| `qty` | `number?` | Quantidade: aparece na etiqueta e entra no P&L absoluto |
| `label` | `string?` | Texto da etiqueta de entrada (por defeito "Long" / "Short") |
| `exitLabel` | `string?` | Texto da saída (por defeito o P&L em %) |

## Ver só entradas, só saídas, ou ambas sem a linha

```ts
chart.setTradeDisplay({ exits: false });                 // só entradas
chart.setTradeDisplay({ entries: false, exits: true });  // só saídas (o P&L fica ao lado da seta)
chart.setTradeDisplay({ entries: true, exits: true, lines: false }); // ambas, sem a linha tracejada

createChart(el, { tradeDisplay: { lines: false } });     // também como opção (e no createTerminal)
chart.tradeDisplayChanged.on((d) => console.log(d));     // { entries, exits, lines }
```

A linha só aparece com as duas pontas visíveis.

## Ir até um trade pelo id

```ts
chart.goToTrade('T-1042');          // desliza até à entrada e marca o trade
chart.goToTrade('T-1042', 'exit');  // até à saída
chart.goToTrade('T-1042', 'both');  // ajusta o zoom para ver o trade inteiro
chart.selectTrade(null);            // tirar a marca
```

`goToTrade` devolve uma `Promise<boolean>`. Com um datafeed aos blocos, carrega primeiro as velas do trade, mesmo que seja de há anos. Resolve `false` quando o id não existe ou o trade é anterior ao histórico.

Os trades ficam na vela que contém o instante, em qualquer intervalo: uma entrada às 10:37 aparece na vela das 10:00 no 1h.

## Clicar num trade no gráfico

Clicar na seta ou na etiqueta de uma entrada ou saída marca o trade e emite `tradeClick`:

```ts
chart.tradeClick.on(({ trade, point }) => {
  // point: 'entry' | 'exit'
  // por exemplo, ir até à outra ponta:
  chart.goToTrade(trade.id!, point === 'entry' ? 'exit' : 'entry');
});
```

## Lista de trades

Uma tabela ligada ao gráfico com:
- os botões **Ambas / Entradas / Saídas** e o interruptor **Linha**;
- o campo **Ir para id…**: Enter vai à entrada e Shift+Enter à saída;
- uma linha por trade com id, tipo, entrada, saída, quantidade e P&L (ao vivo nos abertos).

Clicar numa linha vai à entrada. Clicar no preço de entrada ou de saída vai a esse ponto. Clicar num trade no gráfico seleciona a linha.

```ts
// no Terminal
createTerminal(el, { datafeed, tradeList: true, tradeListHeight: 220 });

// com createChart, em qualquer elemento
import { createTradeList } from 'openchartscandle/candlestick';
const list = createTradeList(document.getElementById('trades')!, chart, { rowClick: 'both' });
```

| Opção | Por defeito | Descrição |
|---|---|---|
| `title` | `'Lista de trades'` | Título (`null` esconde) |
| `toggles` | `true` | Ambas / Entradas / Saídas e Linha |
| `search` | `true` | Campo "Ir para id…" |
| `stats` | `true` | Trades, taxa de acerto e P&L |
| `table` | `true` | A tabela (`false` deixa só a barra de botões) |
| `rowClick` | `'entry'` | O que faz o clique numa linha: `'entry'`, `'exit'` ou `'both'` |
| `newestFirst` | `true` | O trade mais recente em cima |
| `collapsible` / `collapsed` | `false` | O título abre e fecha a tabela |
| `formatTime` / `formatPrice` | — | Formatos próprios |

## Cores

```ts
createTerminal(el, { datafeed, tradeColors: { long: '#2962ff', short: '#ff6d00', profit: '#089981', loss: '#f23645' } });
chart.applyOptions({ tradeColors: { long: '#00e0c6' } });
```

## Estatísticas

```ts
import { tradeStats, tradePnl } from 'openchartscandle/candlestick';

const last = chart.bars[chart.bars.length - 1].close;
const s = tradeStats(chart.trades, last);
// { total, closed, open, wins, losses, winRate, pnl, pnlPct }

tradePnl(trade, last); // { abs, pct } de um trade
```

## Marcadores simples

Para sinais, notas ou execuções sem par entrada/saída:

```ts
chart.setMarkers([
  { time: 1760371200, price: 64100, shape: 'arrowUp', color: '#089981', text: 'Sinal' },
  { time: 1760385600, price: 64850, shape: 'circle', color: '#f7a600' },
]);
```

Formas: `arrowUp`, `arrowDown`, `circle`, `square`.

## Exemplo: estratégia simulada

A **Demo 4** (`/cards.html`) tem uma estratégia de cruzamento de médias 9/21 (`demo/strategy.ts`) que corre ao vivo:

1. a cada vela fechada volta a calcular os sinais;
2. chama `chart.setTrades(...)`;
3. mostra as estatísticas no topo do card (trades, taxa de acerto, ganhos e perdas, P&L total e posição atual).

```ts
let barCount = 0;
terminal.chart.dataUpdated.on(() => {
  const bars = terminal.chart.bars;
  if (bars.length !== barCount) {
    barCount = bars.length;
    terminal.chart.setTrades(minhaEstrategia(bars));
  }
});
```

Num caso real, os trades vêm do teu backend ou da corretora (ordens executadas). O gráfico só os desenha.

## Indicadores da simulação

A simulação (o teu backtest, a tua estratégia) usou indicadores com certas definições. Passa-os ao terminal e a pessoa vê-os em **Indicadores › Da simulação**, cada um com uma caixa para o mostrar ou esconder no gráfico, já com as definições certas.

```ts
const terminal = createTerminal(el, {
  datafeed,
  simulationIndicators: [
    { id: 'ema-rapida', type: 'ema', label: 'EMA rápida (entrada)', params: { length: 9, color: '#ff9800', width: 2 } },
    { id: 'ema-lenta', type: 'ema', label: 'EMA lenta (saída)', params: { length: 21, color: '#2962ff', width: 2 } },
    { id: 'rsi-filtro', type: 'rsi', label: 'RSI de filtro', params: { length: 14, upper: 65, lower: 35, maType: 'sma', maLength: 9 }, visible: false },
  ],
});

// ou depois, quando a simulação acabar (substitui os da simulação anterior):
const problemas = terminal.setSimulationIndicators(resultado.indicadores);
if (problemas.length) console.log(problemas);
```

### Formato

Uma lista; cada indicador é um objeto:

| Campo | Obrigatório | |
|---|---|---|
| `id` | sim | Texto único na lista (`'rsi-filtro'`). Se voltares a chamar com o mesmo `id`, `type` e `params`, o indicador fica como está (aberto ou fechado, com as mudanças que a pessoa fez) |
| `type` | sim | `'sma'`, `'ema'`, `'rsi'` ou `'svp'` |
| `params` | não | As definições, com os nomes das tabelas de [api.md](api.md#indicadores). O que faltar fica com o valor por omissão |
| `label` | não | Nome na lista (por omissão o do indicador, ex.: "Relative Strength Index"). Ao lado aparece o título com as definições (`RSI 14 close SMA 9`) |
| `visible` | não | `false` = começa escondido (a caixa desligada). Por omissão `true` |

Regras para vir tudo certo:

- **Números são números** (`14`, não `'14'`), **sim/não são `true` / `false`** e **o resto é texto** (`source: 'close'`, `maType: 'sma'`, cores `'#ff9800'` ou `'rgba(255,152,0,0.5)'`).
- `source`: `'open'`, `'high'`, `'low'`, `'close'` ou `'volume'`.
- `timeframe`: `''` (o do gráfico) ou um tempo gráfico: `'1'`, `'5'`, `'60'`, `'240'`, `'4h'`, `'1D'`, `'1W'`… O RSI e as médias são calculados com as velas desse tempo gráfico, pedidas ao mesmo `datafeed`.
- Intervalos: `length` 1–1000 nas médias e 1–500 no RSI; `offset` −500 a 500; bandas do RSI 0–100; `width` 1–4.
- Em JSON (vindo de um servidor) é igual: `{"id":"rsi-filtro","type":"rsi","params":{"length":14,"upper":65,"lower":35}}`.

`setSimulationIndicators` devolve a lista de problemas (e escreve-a na consola), em português, por exemplo:

```
simulationIndicators[2] (rsi-filtro): 'lenght' não existe no rsi (existem: length, source, …)
simulationIndicators[2] (rsi-filtro): 'upper' devia ser um número, veio "70"
simulationIndicators[3]: tipo 'macd' desconhecido (existem: sma, ema, rsi)
```

Um indicador com `type` desconhecido ou sem `id` fica de fora; num indicador válido, os campos errados são ignorados (ficam com o valor por omissão) e o resto é usado. Para validar antes de enviar: `checkIndicatorParams('rsi', params)` devolve a mesma lista de problemas (vazia se estiver tudo certo).

### No terminal

- Em **Indicadores**, a secção **Da simulação** (o título muda com `simulationTitle`) lista-os por cima dos indicadores técnicos. A caixa põe ou tira o indicador do gráfico; a pesquisa também os filtra.
- No gráfico são indicadores normais: legenda, definições (roda dentada), olho e ✕. Tirar com o ✕ é o mesmo que desligar a caixa; as definições ficam para quando voltar.
- Não são guardados no `localStorage` com os indicadores da pessoa: vêm sempre do código. A pessoa pode juntar os seus indicadores ao lado deles.
- `terminal.getSimulationIndicators()` diz quais há, com as definições atuais e se estão no gráfico; `terminal.showSimulationIndicator(id, true | false)` faz o mesmo que a caixa; `terminal.setSimulationIndicators([])` tira-os todos.

## Zonas e linhas no tempo

Para marcar no gráfico o que rodeia um backtest: o início da simulação, o aquecimento dos indicadores, períodos excluídos, sessões…

```ts
chart.setTimeRanges([
  { from: inicioAquecimento, to: inicioSimulacao, color: '#787b86', label: 'Aquecimento' },
  { from: inicioSimulacao, color: '#2962ff', label: 'Início da simulação', lineStyle: 'solid', lineWidth: 2 },
  { from: excluidoDe, to: excluidoAte, color: '#f23645', label: 'Excluído', opacity: 0.1, border: true },
]);
chart.addTimeRange({ id: 'fim', from: fimSimulacao, label: 'Fim' }); // devolve o id
chart.removeTimeRange('fim');
```

| Campo | Descrição |
|---|---|
| `from` | Onde fica a linha, ou o primeiro instante da zona (unix s ou ms) |
| `to` | Fim da zona (exclusivo). Sem `to` é uma linha vertical |
| `color`, `label` | Cor e texto (em baixo, no painel principal; textos que se sobrepõem empilham-se) |
| `lineStyle`, `lineWidth` | `'solid'`, `'dashed'` (linhas, por defeito) ou `'dotted'` |
| `opacity`, `border` | Opacidade da zona (0.12) e linhas nos limites (`false`) |
| `allPanes` | Também nos painéis de indicadores (`true`) |

Cada limite fica na vela que contém o instante, em qualquer intervalo: uma zona das 10:30 às 14:00 pinta a vela das 10:00 até à das 13:00 no 1h. A linha fica no início da vela que contém `from`.
