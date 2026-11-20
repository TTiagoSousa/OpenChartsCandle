# Referência da API

```ts
import {
  createTerminal, createChart, createIndicator, setTheme,
  TIMEFRAMES, aggregate, bucketStart, normalizeBars,
  type Bar, type Datafeed, type SymbolInfo, type Timeframe,
} from 'openchartscandle/candlestick';
import 'openchartscandle/style.css'; // obrigatório para o Terminal (barras, menus, diálogos)
```

> Todas as classes CSS da biblioteca usam o prefixo `tc-`, por isso não interferem com o CSS da tua aplicação.

---

## `createTerminal(container, options): Terminal`

Cria a interface completa dentro de `container`. O contentor tem de ter **altura definida**.

| Opção | Tipo | Por defeito | Descrição |
|---|---|---|---|
| `datafeed` | `Datafeed` | — (obrigatório) | Fonte de dados. Ver [datafeed.md](datafeed.md) |
| `symbol` | `string` | último usado / 1.º da lista | Símbolo inicial |
| `timeframe` | `string` | `'5'` | Timeframe inicial (`'1'`, `'5'`, `'60'`, `'1D'`, `'1W'`…) |
| `timeframes` | `(Timeframe \| string)[]` | `TIMEFRAMES` | Timeframes disponíveis: objetos ou textos (`'1'`, `'15m'`, `'1h'`, `'4h'`, `'1D'`, `'1W'`). Os `timeframes` de cada símbolo (`getSymbols`) têm prioridade |
| `initialTime` | `number` | — | Abrir o primeiro símbolo neste instante (unix s ou ms) em vez das últimas velas |
| `countBack` | `number` | `1000` | Velas pedidas em cada `getBars` (datafeed aos blocos) |
| `loadingIndicator` | `boolean` | `true` | Spinner enquanto as primeiras velas carregam |
| `timezone` | `TimeZoneId` | `'local'` | Fuso do eixo do tempo, da cruz e do relógio: `'local'` (o do browser), `'UTC'`, um nome IANA (`'Europe/Lisbon'`, `'America/New_York'`…) ou `'exchange'` (`SymbolInfo.timezone`). O relógio da barra de baixo abre um menu para o mudar |
| `timezones` | `{ id, label }[]` | `TIMEZONES` | Fusos do menu do relógio |
| `watchlist` | `boolean \| string[]` | `true` | `false` esconde o painel direito (watchlist + detalhes). Uma lista limita os símbolos mostrados |
| `topbar` | `boolean` | `true` | Barra de topo (símbolo, timeframes, tipo de gráfico, indicadores, desfazer) |
| `leftToolbar` | `boolean` | `true` | Barra de ferramentas de desenho |
| `bottomBar` | `boolean` | `true` | Barra de baixo (1D/5D/…, relógio, `%`/`log`/`auto`) |
| `brand` | `string \| null` | `null` | Texto à direita da barra de topo |
| `storageKey` | `string \| null` | `'openchartscandle'` | Prefixo no `localStorage` para o estado e os desenhos. `null` desliga |
| `indicators` | `{ type, params? }[]` | SMA 50 | Indicadores iniciais (quando não há estado guardado) |
| `simulationIndicators` | `SimulationIndicator[]` | | Indicadores de uma simulação, com as definições dela: aparecem em "Indicadores" › "Da simulação" com uma caixa para os mostrar ou esconder. Ver [entradas-saidas.md](entradas-saidas.md#indicadores-da-simulação) |
| `simulationTitle` | `string` | `'Da simulação'` | Título dessa secção |
| `chartType` | `ChartType` | `'candles'` | Tipo de gráfico inicial |
| `keyboard` | `boolean` | `true` | Atalhos globais de teclado |

#### O que aparece na interface

Todas as opções são `true` por defeito. Com `false` a peça desaparece; com uma lista ficam só os itens indicados.

| Opção | Tipo | Descrição |
|---|---|---|
| `symbolSearch` | `boolean` | Botão de pesquisa de símbolo |
| `timeframeSelector` | `boolean \| string[]` | Seletor de timeframes. Exemplo: `['1', '5', '60', '1D']` mostra só esses. Sem barra de topo (`minimal`) aparece um seletor pequeno no canto do gráfico |
| `chartTypes` | `boolean \| ChartType[]` | Menu de tipos de gráfico. Exemplo: `['candles', 'line']` |
| `indicatorPicker` | `boolean \| string[]` | Botão "Indicadores". Uma lista limita os indicadores que aparecem (`['sma', 'rsi']`) |
| `undoRedo` | `boolean` | Botões desfazer / refazer |
| `screenshot` | `boolean` | Botão de captura |
| `fullscreen` | `boolean` | Botão de ecrã inteiro |
| `drawingTools` | `boolean \| string[]` | Ferramentas na barra da esquerda (ids em [desenhos.md](desenhos.md)) |
| `legend` | `boolean` | Legenda OHLC e dos indicadores |
| `rangeButtons` | `boolean` | Botões 1D · 5D · 1M… na barra de baixo |

```ts
createTerminal(el, {
  datafeed,
  watchlist: false,
  timeframeSelector: ['5', '15', '60', '240', '1D'],
  chartTypes: ['candles', 'heikin', 'line'],
  indicatorPicker: ['sma'],
  drawingTools: ['trendline', 'hline', 'fib', 'long', 'short', 'rect'],
  screenshot: false,
});
```

A **Demo 3** (`/custom.html`) tem um painel com estas opções todas e gera o código correspondente.

#### Aparência

| Opção | Tipo | Descrição |
|---|---|---|
| `theme` | `Partial<Theme>` | Cores do gráfico **e** da interface: fundo, grelha, bordas, texto, velas (corpo, pavio, contorno)… Ver [aparencia.md](aparencia.md) |
| `minimal` | `boolean` | Só o gráfico (desliga barras, watchlist e legenda; cada uma pode ser religada) |
| `compact` | `boolean` | Barras e botões mais pequenos, para cards |
| `border` | `string` | Borda CSS à volta de tudo, por exemplo `'1px solid #2a2e39'` |
| `radius` | `number` | Cantos arredondados (px) |
| `priceAxis` / `timeAxis` | `boolean` | Mostrar as escalas |
| `crosshair` | `boolean` | Cursor em cruz |
| `lastPriceLine` | `boolean` | Linha e etiqueta do último preço |
| `mouseWheel` | `boolean` | Zoom com a roda (usa `false` em páginas com scroll) |
| `tradeColors` | `Partial<TradeColors>` | Cores das entradas e saídas |
| `tradeDisplay` | `Partial<TradeDisplay>` | O que se vê dos trades: `{ entries, exits, lines }` (tudo `true` por defeito) |
| `tradeList` | `boolean \| TradeListOptions` | Lista de trades por baixo do gráfico, com Ambas / Entradas / Saídas, a linha e "Ir para id…" |
| `tradeListHeight` | `number` | Altura da lista de trades (px). Por defeito 200 |

### `Terminal`

| Membro | Descrição |
|---|---|
| `chart: Chart` | O gráfico interno. Tudo o que está em [`Chart`](#chart) funciona aqui |
| `ready: Promise<void>` | Resolve quando o primeiro símbolo terminou de carregar |
| `setSymbol(symbol: string): Promise<void>` | Muda de símbolo |
| `setTimeframe(id: string \| Timeframe): Promise<void>` | Muda de timeframe (`'60'`, `'1h'`, `'4h'`…), mantendo o instante do centro |
| `timeframe: Timeframe` | Timeframe atual |
| `reload(): Promise<void>` | Volta a carregar o símbolo e o intervalo atuais (por exemplo depois de um `error`) |
| `setTimezone(tz)` / `timezone` | Fuso do eixo, da cruz e do relógio (fica guardado com `storageKey`). Evento `timezoneChanged` |
| Eventos `timeframeChanged`, `symbolChanged` | O intervalo (`Timeframe`) ou o símbolo (`SymbolInfo`) mudou |
| Eventos `loadingChanged`, `error` | Pedidos `getBars` em curso (`boolean`) e pedidos falhados. A biblioteca não mostra mensagens próprias |
| `applyTheme(patch)` | Muda as cores do gráfico e da interface em tempo real |
| `tradeList: TradeList \| null` | A lista de trades (opção `tradeList`) |
| `destroy()` | Remove tudo, cancela as subscrições e os listeners |

```ts
const t = createTerminal(el, { datafeed, watchlist: false });
await t.ready;
await t.setTimeframe('60');
t.chart.drawings.setTool('trendline');
```

---

## `createChart(container, options?): Chart`

Cria só o gráfico (canvas). Não precisa de CSS e não tem barras nem legenda.

| Opção | Tipo | Descrição |
|---|---|---|
| `symbol` | `SymbolInfo` | Símbolo (usa `precision` para formatar preços) |
| `chartType` | `ChartType` | `'candles'`, `'hollow'`, `'bars'`, `'heikin'`, `'line'`, `'step'`, `'area'`, `'baseline'` |
| `drawingStorage` | `DrawingStorage \| null` | Onde guardar os desenhos. Por defeito `localStorage`. `null` = tu geres |
| `theme` | `Partial<Theme>` | Cores (ver [aparencia.md](aparencia.md)) |
| `priceAxis`, `timeAxis`, `crosshair`, `lastPriceLine`, `mouseWheel` | `boolean` | Partes do gráfico (todas `true` por defeito) |
| `tradeColors` | `Partial<TradeColors>` | Cores das entradas e saídas |
| `tradeDisplay` | `Partial<TradeDisplay>` | Mostrar entradas, saídas e a linha entre elas |
| `timezone` | `TimeZoneId` | Fuso do eixo do tempo e da cruz: `'local'` (por defeito), `'UTC'`, `'Europe/Lisbon'`, `'exchange'`… |

## `Chart`

### Dados

| Método | Descrição |
|---|---|
| `setSymbol(info: SymbolInfo)` | Define o símbolo e carrega os desenhos guardados para ele |
| `setData(bars: Bar[], timeframeSeconds: number, resetView = true)` | Substitui o histórico. `timeframeSeconds`: 60 = 1m, 3600 = 1h, 86400 = 1D |
| `update(bar: Bar)` | Tempo real. A mesma `time` da última vela substitui-a; uma `time` maior acrescenta uma vela nova |
| `setDataSource(source, timeframeSeconds, { time?, align?, countBack?, maxJump? }): Promise<boolean>` | Histórico aos blocos: `source({ to, countBack, signal, firstRequest })` devolve `{ bars, noMore }` (ou `Bar[]` com tudo). Ver [datafeed.md](datafeed.md#histórico-aos-blocos-como-o-tradingview) |
| `resync()` | Depois de perder a ligação: pede as velas desde a última e preenche o buraco |
| `ensureHistory(time): Promise<boolean>` | Garante que as velas carregadas incluem `time` |
| `setTimeframeFeed({ getBars(tf, request), subscribeBars?(tf, onBar) })` | De onde vêm as velas dos indicadores com tempo gráfico próprio (mesmo contrato do `setDataSource`, mais o `Timeframe`). Volta a definir quando o símbolo muda. O Terminal define-o a partir do `Datafeed` |
| `goToTime(time, { align?: 'center' \| 'start', animate? }): Promise<boolean>` | Vai até um instante, carregando o que faltar |
| `centerTime(): number` | O instante no centro do gráfico |
| `isLoading` | Pedidos da fonte em curso |
| `prependBars(bars)` / `appendBars(bars, follow?)` | Juntar velas mais antigas / mais recentes sem a vista saltar |
| `bars: Bar[]` | Velas atuais (só leitura) |
| `symbol: SymbolInfo` | Símbolo atual |

### Aparência e vista

| Método | Descrição |
|---|---|
| `setChartType(type)` | Tipo de gráfico |
| `resetView()` | Volta ao zoom e posição por defeito |
| `showLastBars(n)` | Ajusta o zoom para mostrar as últimas `n` velas |
| `scrollBars(n)` / `zoomStep(1 \| -1)` | Scroll e zoom programáticos |
| `scrollToRealtime()` | Anima até à vela mais recente |
| `setAutoScale(on)`, `setLog(on)`, `setPercent(on)`, `setInvert(on)` | Modos da escala de preço |
| `cursorMode` | `'cross' \| 'dot' \| 'arrow' \| 'eraser'` |
| `screenshot(): string` | PNG em data URL |
| `requestRender()` | Pede um redesenho (por exemplo depois de `setTheme`) |
| `setTimezone(tz)` / `timezone` | Fuso do eixo do tempo e da cruz. Um nome desconhecido lança `RangeError`. Evento `timezoneChanged` |
| `timeZone` | O fuso em uso (`'exchange'` já resolvido): `offset(t)`, `wall(t)`, `label()` (`'UTC+1'`) |
| `formatTime(time, withTime?)` | Um instante formatado como na cruz, no fuso do gráfico |
| `destroy()` | Remove o canvas e para os observers |

### Entradas e saídas

| Método | Descrição |
|---|---|
| `setTrades(trades)` | Desenha operações (entrada, saída, P&L). Ver [entradas-saidas.md](entradas-saidas.md) |
| `addTrade(trade)` / `updateTrade(id, patch)` | Acrescentar ou fechar um trade |
| `trade(id)` | O trade com esse id |
| `setTradeDisplay({ entries?, exits?, lines? })` | Só entradas, só saídas, ou ambas com ou sem a linha |
| `goToTrade(id, 'entry' \| 'exit' \| 'both'): Promise<boolean>` | Desliza até à entrada, à saída ou ao trade inteiro e marca-o. Carrega antes as velas que faltem |
| `selectTrade(id \| null)` / `selectedTradeId` | Marcar um trade (anel na entrada e na saída) |
| `tradeAt(x, y)` | O trade debaixo de um ponto do painel principal |
| Eventos `tradeClick`, `tradeSelected`, `tradesChanged`, `tradeDisplayChanged` | Clique num trade (`{ trade, point }`), seleção, trades e visibilidade mudaram |
| `setMarkers(markers)` | Marcadores simples (setas, círculos, texto) |
| `setTimeRanges(ranges)` / `addTimeRange(r)` / `removeTimeRange(id)` | Linhas verticais e zonas no tempo (início da simulação, aquecimento, períodos excluídos). Ver [entradas-saidas.md](entradas-saidas.md#zonas-e-linhas-no-tempo) |
| `applyTheme(patch)` / `applyOptions(opts)` | Mudar cores ou opções depois de criado |

### Indicadores

```ts
import { createIndicator, INDICATORS } from 'openchartscandle/candlestick';

const ma = createIndicator('sma', { length: 200, color: '#ff9800', source: 'close', width: 2 })!;
chart.addIndicator(ma);
ma.params.length = 100;
chart.updateIndicator(ma);  // recalcula
chart.removeIndicator(ma);
chart.indicators;           // lista atual
```

| Indicador | `type` | Parâmetros |
|---|---|---|
| Média Móvel Simples | `sma` | `length` (50), `source`, `offset` (0), `timeframe`, `color` (`'#2962ff'`), `width` (1). Na janela de definições: Período, Fonte, Deslocamento, Tempo gráfico e, em Estilo, Cor e Espessura |
| Média Móvel Exponencial | `ema` | Os mesmos, com `length` 9. `α = 2 / (length + 1)`, a começar no primeiro valor (como o `ta.ema`) |
| Índice de Força Relativa | `rsi` | Ver a tabela abaixo. Painel próprio, com a escala ajustada aos valores à vista e às bandas; médias de Wilder como o `ta.rsi`; o valor é cortado às 2 casas como no TradingView |
| Session Volume Profile HD | `svp` | Um perfil de volume por sessão. Ver [Perfil de volume por sessão](#perfil-de-volume-por-sessão-svp) |
| Volume | `volume` | Colunas verdes / vermelhas, média do volume |
| Moving Average Weighted | `wma` | Período, fonte, deslocamento |
| Volume Weighted Moving Average | `vwma` | Período, fonte, deslocamento |
| Hull Moving Average | `hma` | Período, fonte, deslocamento |
| Bollinger Bands | `bb` | Período, tipo da média base (SMA, EMA, SMMA, WMA, VWMA), fonte, desvio padrão, deslocamento; base, superior, inferior e fundo |
| MACD | `macd` | Rápido, lento, fonte, suavização do sinal, tipo de média do oscilador e do sinal (SMA / EMA); histograma com quatro cores, MACD, sinal, linha zero |
| Stochastic | `stoch` | Período %K, suavização %K, suavização %D; bandas 80 / 50 / 20 e fundo |
| Stochastic RSI | `stochrsi` | K, D, período do RSI, período do estocástico, fonte; bandas e fundo |
| Average True Range | `atr` | Período, suavização (RMA, SMA, EMA, WMA) |
| Volume Weighted Average Price | `vwap` | Ancoragem (sessão, semana, mês, trimestre, ano), fonte, três bandas de desvio padrão com multiplicador e fundo próprios |
| Supertrend | `supertrend` | Período da ATR, fator; linhas de alta / baixa com fundo |
| Parabolic SAR | `sar` | Início, incremento, máximo |
| Directional Movement Index | `dmi` | Suavização do ADX, período DI; ADX, +DI, −DI |
| On Balance Volume | `obv` | Linha |
| Commodity Channel Index | `cci` | Período, fonte; bandas ±100 e fundo |
| Williams %R | `willr` | Período, fonte; bandas −20 / −50 / −80 |
| Money Flow Index | `mfi` | Período; bandas 80 / 50 / 20 |
| Momentum | `mom` | Período, fonte |
| Rate Of Change | `roc` | Período, fonte, linha zero |
| Awesome Oscillator | `ao` | Histograma verde a subir / vermelho a descer |
| Chaikin Money Flow | `cmf` | Período, linha zero |
| Aroon | `aroon` | Período; Aroon Up e Down |
| Keltner Channels | `kc` | Período, multiplicador, fonte, EMA ou SMA, estilo das bandas (ATR, amplitude verdadeira, amplitude), período da ATR |
| Donchian Channels | `dc` | Período, deslocamento |
| Ichimoku Cloud | `ichimoku` | Conversão, base, Leading Span B e deslocamento; a nuvem desenhada à frente, verde ou vermelha |
| Double EMA | `dema` | Período, fonte, deslocamento |
| Triple EMA | `tema` | Período, fonte, deslocamento |
| Smoothed Moving Average | `smma` | Período, fonte, deslocamento |
| McGinley Dynamic | `mgd` | Período, fonte, deslocamento |
| Arnaud Legoux Moving Average | `alma` | Período, offset, sigma, fonte |
| Least Squares Moving Average | `lsma` | Período, offset, fonte |
| Envelopes | `env` | Período, percentagem, fonte, exponencial; base, superior, inferior e fundo |
| Williams Alligator | `alligator` | Período e deslocamento da maxila, dos dentes e dos lábios |
| Average Directional Index | `adx` | Suavização do ADX, período DI |
| Ultimate Oscillator | `uo` | Rápido, médio, lento |
| TRIX | `trix` | Período, linha zero |
| True Strength Index | `tsi` | Longo, curto, sinal; TSI, sinal, linha zero |
| Chande Momentum Oscillator | `cmo` | Período, fonte, linha zero |
| Detrended Price Oscillator | `dpo` | Período, centrado |
| Coppock Curve | `coppock` | Período da WMA, ROC longo e curto |
| Fisher Transform | `fisher` | Período; Fisher, gatilho, níveis ±1,5, ±0,75, 0 |
| Relative Vigor Index | `rvi` | Período; RVGI e sinal |
| Choppiness Index | `chop` | Período; bandas 61,8 / 50 / 38,2 e fundo |
| Vortex Indicator | `vortex` | Período; VI+ e VI− |
| Balance of Power | `bop` | Linha |
| Bollinger Bands %B | `bbr` | Período, fonte, desvio padrão; bandas 1 / 0,5 / 0 |
| Bollinger BandWidth | `bbw` | Período, fonte, desvio padrão |
| Historical Volatility | `hv` | Período (anualizada, em %) |
| Accumulation/Distribution | `ad` | Linha |
| Chaikin Oscillator | `chaikinosc` | Rápido, lento, linha zero |
| Elder Force Index | `efi` | Período, linha zero |
| Ease of Movement | `eom` | Período, divisor, linha zero |
| Price Volume Trend | `pvt` | Linha |

**Parâmetros dos outros indicadores.** As entradas têm os nomes da tabela (`createIndicator('macd', { fast: 8, slow: 21 })`; `createIndicator('x')!.params` mostra todos). Cada linha `k` tem `kShow`, `kColor` e `kWidth`; cada nível `k` (ex.: `upper`) tem `kShow`, `k` (o valor) e `kColor`; cada fundo tem `kShow` e `kColor`. A fonte pode ser também `'hl2'`, `'hlc3'`, `'ohlc4'` ou `'hlcc4'`. O VWAP recomeça no início de cada dia, semana, mês… em UTC.

`source`: `'open'` (Abertura), `'high'` (Máxima), `'low'` (Mínima), `'close'` (Fechamento) ou `'volume'`. Outra passa a `'close'`. `offset` (Deslocamento) move a linha `offset` velas para a direita (passa da última vela) ou, negativo, para a esquerda; a legenda mostra o valor desenhado nessa vela.

Parâmetros do RSI (os nomes entre parênteses são os da janela de definições):

| Parâmetro | Por omissão | |
|---|---|---|
| `length` | `14` | Período IFR |
| `source` | `'close'` | Fonte |
| `timeframe` | `''` | Tempo gráfico (`''` = o do gráfico; `'60'`, `'4h'`, `'1D'`…) |
| `maType` | `'none'` | Média do RSI: `'none'`, `'sma'` ou `'ema'` |
| `maLength` | `14` | Período da média |
| `showRsi`, `color`, `width` | `true`, `'#7e57c2'`, `1` | Linha do RSI: mostrar, cor, espessura |
| `maColor` | `'#fdd835'` | Cor da média |
| `showUpper`, `upper`, `upperColor` | `true`, `70`, `'#787b86'` | Banda superior: mostrar, nível, cor |
| `showMiddle`, `middle`, `middleColor` | `true`, `50`, `'rgba(120,123,134,0.5)'` | Banda do meio |
| `showLower`, `lower`, `lowerColor` | `true`, `30`, `'#787b86'` | Banda inferior |
| `showBg`, `bgColor` | `true`, `'rgba(126,87,194,0.1)'` | Fundo entre a banda superior e a inferior |

As cores aceitam `#rrggbb`, `#rrggbbaa` ou `rgba(…)` (o seletor de cor tem opacidade).

**Média do RSI (suavização).** Como no TradingView, o RSI pode ter uma média por cima: `maType` `'sma'` (média móvel simples) ou `'ema'` (exponencial), com `maLength` velas e a cor `maColor` (amarelo). Seguem o `ta.*` do Pine: a EMA começa no primeiro valor do RSI. A média aparece na legenda e no eixo. `createIndicator('rsi', { maType: 'sma', maLength: 14 })`. Um estado guardado com uma das médias que saíram (`'sma_bb'`, `'rma'`, `'wma'`, `'vwma'`) passa a `'sma'`.

O cálculo é incremental: a cada `update()` só é recalculada a última vela. Quando chegam velas mais antigas (histórico aos blocos) os indicadores são recalculados desde o início.

**Aquecimento.** O gráfico carrega velas suficientes antes da primeira à vista para os indicadores estarem prontos desde ela: `length − 1` para a SMA, `10 × length` para a EMA e o RSI, mais `maLength` da média (`10 × maLength` na EMA) (com isso o início do histórico muda o RSI menos de 0.01). Vale também depois de `goToTime` / `goToTrade` para uma data antiga.

#### Perfil de volume por sessão (`svp`)

Como o "Session Volume Profile HD" do TradingView: o gráfico é cortado nas sessões do dia e cada sessão tem o seu perfil de volume, desenhado nas suas velas sobre um fundo próprio (a caixa da sessão, do mínimo ao máximo), com o POC (o nível com mais volume) e a área de valor (VAH / VAL). As linhas são HD: o número acompanha a altura da sessão no ecrã. O POC continua para a direita até uma vela o tocar. A sessão em curso cresce em tempo real. Fica por trás das velas e não mexe na escala.

```ts
chart.addIndicator(createIndicator('svp', { session: 'regular', exchange: 'NYSE', showVah: true, showVal: true })!);
```

Valores:

| Parâmetro | Por omissão | |
|---|---|---|
| `session` | `'each'` | Sessões: `'each'` (Cada: um perfil para o pré-mercado, outro para o mercado, o pós-mercado e o noturno), `'all'` (Todos: um perfil por dia com todas as partes), `'pre'` (Somente o pré-mercado), `'regular'` (Somente o mercado), `'post'` (Somente o pós-mercado), `'overnight'` (Apenas noturno), `'custom'` (Personalizado) |
| `customSession` | `'0930-1600'` | Sessão customizada (`'custom'`), na hora da bolsa: `'HHMM-HHMM'` (na janela, duas horas: 09:30 – 16:00), várias com vírgula (`'0900-1130,1230-1530'`); pode passar a meia-noite (`'2200-0300'`) |
| `exchange` | `''` | Bolsa de onde vêm os horários e o fuso: `''` (a do símbolo) ou um id de `EXCHANGE_SESSIONS`: `'NYSE'`, `'CME'`, `'B3'`, `'EURONEXT'`, `'XETRA'`, `'LSE'`, `'TSE'`, `'HKEX'`, `'FOREX'`, `'CRYPTO'` |
| `rowsLayout`, `rowSize` | `'auto'`, `24` | Layout das linhas: `'auto'` (HD: cerca de uma linha por 3 px da altura da sessão), `'rows'` = `rowSize` linhas por perfil, `'ticks'` = cada linha tem `rowSize` ticks de preço |
| `volume` | `'updown'` | `'updown'` (alta e baixa lado a lado), `'total'` ou `'delta'` (alta − baixa) |
| `vaPct` | `70` | Volume da Área do Valor (%) |
| `extendPoc`, `extendVah`, `extendVal` | `true`, `false`, `false` | Estender POC / VAH / VAL à direita: a linha continua depois da sessão até à primeira vela que lhe toca (ou até à direita do gráfico) |

Estilo:

| Parâmetro | Por omissão | |
|---|---|---|
| `showProfile` | `true` | Perfil de Volume (o histograma) |
| `showValues`, `valuesColor` | `false`, `'#b2b5be'` | Valores: o volume de cada linha ao lado dela |
| `widthPct` | `30` | Largura (% da caixa): a linha com mais volume ocupa esta parte da largura da sessão |
| `placement` | `'left'` | Posição: `'left'` (a partir do início da sessão) ou `'right'` |
| `upColor`, `downColor` | azul e amarelo a 25% | Volume de alta / de baixa fora da área de valor |
| `vaUpColor`, `vaDownColor` | azul e amarelo a 60% | Área de Valor de Alta / de Baixa |
| `showVah`, `vahColor`, `vahStyle` | `false`, `'#787b86'`, `'solid'` | VAH: mostrar, cor, estilo (`'solid'`, `'dashed'`, `'dotted'`) |
| `showVal`, `valColor`, `valStyle` | `false`, `'#787b86'`, `'solid'` | VAL |
| `showPoc`, `pocColor`, `pocStyle` | `true`, `'#ff9800'`, `'dotted'` | POC |
| `showDevPoc`, `devPocColor`, `devPocStyle` | `false`, `'#787b86'`, `'solid'` | Desenvolvendo o POC: o POC da sessão até cada vela |
| `showDevVa`, `devVaColor`, `devVaStyle` | `false`, `'#00838f'`, `'solid'` | VA em desenvolvimento: VAH e VAL até cada vela |
| `boxColor` | `'rgba(120,134,170,0.08)'` | Caixa do Histograma: fundo de cada sessão, do início ao fim e do mínimo ao máximo, para distinguir as sessões |
| `labelsOnScale` | `true` | Legendas na escala de preço: POC / VAH / VAL da última sessão |
| `legendValues` | `true` | Valores na linha de status: POC / VAH / VAL da sessão debaixo do cursor |
| `inputsInTitle` | `true` | Inputs na barra de status: o título com as definições (`SVP HD Cada Alta/Baixa 70`); sem eles só `SVP HD` |

**Horários das bolsas.** Cada bolsa tem o seu fuso e as horas de cada parte do dia (`EXCHANGE_SESSIONS`, indicativas: feriados e meios dias não entram):

| Bolsa | Fuso | Pré-mercado | Mercado | Pós-mercado | Noturno |
|---|---|---|---|---|---|
| `NYSE` (NASDAQ, AMEX, ARCA…) | America/New_York | 04:00–09:30 | 09:30–16:00 | 16:00–20:00 | 20:00–04:00 |
| `CME` (CBOT, NYMEX, COMEX) | America/Chicago | | 08:30–15:00 | 15:00–16:00 | 17:00–08:30 |
| `B3` | America/Sao_Paulo | 09:45–10:00 | 10:00–17:55 | 17:55–18:00 | |
| `EURONEXT` | Europe/Paris | 07:15–09:00 | 09:00–17:30 | 17:30–17:40 | |
| `XETRA` | Europe/Berlin | 08:00–09:00 | 09:00–17:30 | 17:30–22:00 | |
| `LSE` | Europe/London | 07:50–08:00 | 08:00–16:30 | 16:30–16:35 | |
| `TSE` | Asia/Tokyo | | 09:00–11:30, 12:30–15:30 | | |
| `HKEX` | Asia/Hong_Kong | 09:00–09:30 | 09:30–12:00, 13:00–16:00 | 16:00–16:10 | |
| `FOREX` | America/New_York | | 24h a partir das 17:00 | | |
| `CRYPTO` (BINANCE, COINBASE…) | UTC | | 24h | | |

- **A bolsa do símbolo** (`exchange: ''`): `SymbolInfo.sessions` se o símbolo tiver as suas, senão a bolsa de `SymbolInfo.exchange` (pelo id ou por um dos nomes entre parênteses), senão cripto / forex pelo `type`, senão o dia inteiro no `timezone` do símbolo (UTC sem ele).
- Um símbolo com horas suas: `{ symbol: 'ACME', precision: 2, timezone: 'America/New_York', sessions: { pre: '0400-0930', regular: '0930-1600', post: '1600-2000' } }`. Outra bolsa para todos: `EXCHANGE_SESSIONS.push({ id: 'BME', label: 'Madrid', timezone: 'Europe/Madrid', regular: '0900-1730' })`.
- Uma parte que passa a meia-noite (o noturno das 20:00 às 04:00) conta para o dia seguinte, como no TradingView: o dia de NYSE vai das 20:00 da véspera às 20:00.
- O pré e o pós-mercado só têm perfil se o datafeed mandar essas velas (horário estendido). Velas fora de todas as partes ficam sem perfil.
- Cada vela entra na sessão onde abre. Em velas de 1 dia ou mais, cada vela é uma sessão.
- O gráfico carrega um dia de velas antes da primeira à vista, para o primeiro perfil estar completo.

#### Janela de definições e visibilidade

A janela de definições de cada indicador (roda dentada ou duplo clique na legenda) tem os separadores do TradingView: **Valores** (as entradas), **Estilo** (cores, linhas, o que se mostra) e **Visibilidade**. "Padrões › Repor padrões" volta às predefinições; "Cancelar" desfaz tudo o que se mudou.

**Visibilidade**: em que tempos gráficos o indicador aparece. Uma linha por unidade (Segundos 1–59, Minutos 1–59, Horas 1–24, Dias 1–366, Semanas 1–52, Meses 1–12), cada uma com uma caixa e o intervalo. Num tempo gráfico fora disso o indicador não é desenhado e fica esbatido na legenda. Por código:

```ts
const svp = createIndicator('svp')!;
svp.visibility = { minutes: { on: true, min: 1, max: 30 }, days: { on: false, min: 1, max: 366 } }; // até 30m, nunca em D
chart.addIndicator(svp);
```

Uma unidade que não esteja lá aparece em todos os seus tempos gráficos; `null` em todos. Fica guardada com o indicador (`toJSON().visibility`).

#### Tempo gráfico próprio

Como no TradingView: a média de 4h num gráfico de 1h, 15m ou 1m.

```ts
chart.setTimeframeFeed({
  getBars: (tf, { to, countBack, signal }) => api.bars('BTCUSDT', tf.id, to, countBack, signal),
  subscribeBars: (tf, onBar) => api.subscribe('BTCUSDT', tf.id, onBar), // opcional: tempo real
});
chart.addIndicator(createIndicator('sma', { length: 200, timeframe: '4h' })!); // '240' também serve
```

- `timeframe` aceita os ids de `TIMEFRAMES` (`'15'`, `'60'`, `'240'`, `'1D'`) ou texto (`'4h'`); fica guardado como id. Vazio ou igual ao do gráfico: usa as velas do gráfico, como sem ele.
- As velas desse tempo gráfico vêm do feed aos blocos de `countBack`, só as que a zona à vista precisa (com o aquecimento): ao arrastar, ao mudar de tempo gráfico e depois de `goToTime` / `goToTrade`. Não se agregam a partir das velas do gráfico.
- **Sem olhar para o futuro.** Num tempo gráfico maior, cada vela usa a última vela desse tempo gráfico já fechada quando ela abre: num gráfico de 1h, as velas das 12:00 às 15:00 usam a vela de 4h que fechou às 12:00, e a das 16:00 a seguinte. A linha liga as velas onde entra um valor novo de 4h (a das 12:00, a das 16:00…), em reta de uma para a outra como no TradingView, sem degraus; a vela de 4h em curso nunca entra (`request.security` com `lookahead_off`, sem repintar). Num tempo gráfico menor, cada vela usa a última vela fechada até ao seu fecho.
- O título mostra o tempo gráfico quando é diferente do do gráfico: `MA 200 close · 4h`.
- No Terminal não é preciso `setTimeframeFeed`: as velas vêm do `Datafeed` (`getBars` e `subscribeBars` com esse intervalo).

### Desenhos — `chart.drawings`

`setTool(id)`, `add(tipo, pontos, opções)`, `toJSON()`, `fromJSON()`, `undo()`, `redo()`, `clearAll()`… Ver [desenhos.md](desenhos.md).

### Eventos

Cada evento tem `.on(handler)`, que devolve uma função para cancelar a subscrição.

| Evento | Payload | Quando |
|---|---|---|
| `crosshairMoved` | `number \| null` (índice da vela) | O cursor mexe-se sobre o gráfico |
| `dataUpdated` | — | Depois de `setData` / `update` |
| `viewChanged` | — | Zoom, scroll ou mudança de modo de escala |
| `indicatorsChanged` | — | Um indicador foi adicionado, removido ou alterado |
| `layoutChanged` | — | Os painéis mudaram de tamanho |
| `drawingDblClick` | `Drawing` | Duplo clique num desenho |
| `contextMenu` | `{ clientX, clientY, drawing, pane }` | Botão direito |
| `loadingChanged` | `boolean` | Pedidos da fonte (`setDataSource`) começaram / acabaram |
| `historyError` | `unknown` | Um pedido da fonte falhou |
| `historyLoaded` | `{ added, direction: 'back' \| 'forward' \| 'reset' }` | Chegaram velas da fonte |
| `drawings.changed` | — | Um desenho foi criado, alterado ou apagado |
| `drawings.selection` | `Drawing \| null` | A seleção mudou |

```ts
const off = chart.crosshairMoved.on((i) => {
  if (i !== null) console.log(chart.bars[i]);
});
off(); // cancelar
```

---

## Tema

```ts
import { createChart, lightTheme, setTheme } from 'openchartscandle/candlestick';

const chart = createChart(el, { theme: { ...lightTheme, up: '#26a69a' } }); // por gráfico
chart.applyTheme({ bg: '#000000' });                                       // depois de criado
setTheme({ up: '#26a69a' });                                               // por defeito, para os próximos gráficos
```

Todas as chaves e exemplos estão em [aparencia.md](aparencia.md).

---

## Utilitários

| Função | Descrição |
|---|---|
| `aggregate(bars1m, tfSeconds)` | Agrega velas (por exemplo de 1m) num timeframe maior |
| `bucketStart(time, tfSeconds)` | Início do período que contém `time` (semanas começam à segunda-feira, UTC) |
| `normalizeBars(bars)` | Ordena, remove duplicados e converte milissegundos para segundos |
| `TIMEFRAMES` | Lista de timeframes por defeito (`id`, `label`, `short`, `seconds`) |
| `parseTimeframe('4h')` | `Timeframe` a partir de um texto (`'1'`, `'15m'`, `'1h'`, `'1D'`, `'1W'`) |
| `TIMEZONES` | Fusos do menu do relógio do Terminal (`id`, `label`) |
