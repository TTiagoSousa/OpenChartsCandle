# Radar · referência da API

```ts
import { createRadarChart } from 'openchartscandle/radar';
import 'openchartscandle/style.css';

const chart = createRadarChart(el, {
  indicators: [
    { name: 'Vendas', max: 6500 },
    { name: 'TI', max: 30000 },
    { name: 'Marketing', max: 25000 },
  ],
  series: [
    { name: 'Orçamento', data: [4200, 20000, 18000] },
    { name: 'Gasto real', data: [5000, 28000, 21000], area: true },
  ],
});
```

O elemento tem de ter altura (o radar ocupa o espaço todo).

## Eixos (indicators)

Um eixo por indicador, pela ordem dada, a começar em cima e no sentido dos ponteiros do relógio.

| Campo | |
|---|---|
| `name` | Nome no fim do eixo |
| `max` | Valor no anel de fora. Por omissão o maior valor desse eixo, arredondado para cima (87 → 100) |
| `min` | Valor no centro (0) |
| `color` | Cor do nome |

## Séries

| Campo | |
|---|---|
| `name` | Nome na legenda e no tooltip |
| `data` | Um valor por indicador (`[4200, 20000, 18000]`), ou vários polígonos: `[{ name, value: [...], color }]`. `null` = sem valor (vai ao centro) |
| `color` | Cor (por omissão a paleta `colors`) |
| `width` | Espessura da linha (2); `0` = só a área |
| `dash` | Linha tracejada, por exemplo `[6, 4]` |
| `area` | Área por dentro: `true` ou `{ opacity, gradient }`. `gradient: true` vai do centro (transparente) até à borda; ou a tua lista de cores |
| `points` | Pontos nos vértices: `true` (círculo de 4 px), `false`, ou `{ size, symbol: 'circle' \| 'square' \| 'diamond' \| 'triangle' \| 'none', hollow }` |
| `labels` | Valor ao lado de cada vértice: `true` ou `{ format(v, indicator), color }` |
| `radar` | Em que radar fica (com `radars`), por omissão 0 |
| `hidden` | Começa escondida |

Uma série com vários polígonos (um por dia, um por ano) esconde-se toda com um clique na legenda.

## O radar

Estas opções vão no topo, ou em cada radar de `radars`.

| Opção | | Por omissão |
|---|---|---|
| `shape` | `'polygon'` ou `'circle'` | `'polygon'` |
| `splitNumber` | Número de anéis | `5` |
| `splitArea` | Faixas alternadas entre anéis: `true` (cores do tema) ou `{ colors }` | desligado |
| `splitLine` | Linhas dos anéis: `true`, `false` ou `{ color, width, dash }` | ligado |
| `axisLine` | Linhas do centro a cada eixo: `true`, `false` ou `{ color }` | ligado |
| `axisName` | Nomes dos eixos: `true`, `false` ou `{ color, fontSize, format(name, indicator), background, borderRadius, padding }` (com `\n` para várias linhas) | ligado |
| `axisLabel` | Valores dos anéis no primeiro eixo: `true` ou `{ format, color }` | desligado |
| `startAngle` | Ângulo do primeiro eixo em graus (90 = em cima, 0 = à direita) | `90` |
| `clockwise` | Eixos no sentido dos ponteiros do relógio | `true` |
| `center` | Centro em % do gráfico | `[50, 50]` |
| `radius` | Raio em % de metade do lado menor | `70` |

### Vários radares

```ts
createRadarChart(el, {
  radars: [
    { title: 'Telemóveis', indicators: [...], center: [25, 50], radius: 55 },
    { title: 'Chuva', indicators: [...], center: [75, 50], radius: 55, shape: 'circle' },
  ],
  series: [
    { name: 'A', radar: 0, data: [...] },
    { name: 'Lisboa', radar: 1, data: [...] },
  ],
});
```

## Cores, legenda e tooltip

| Opção | |
|---|---|
| `colors` | Paleta das séries (`RADAR_COLORS`) |
| `visualMap` | `{ colors, title, show }`: pinta os polígonos de cada série do primeiro ao último (por exemplo anos), com uma barra que mostra o nome do primeiro e do último |
| `legend` | `true`, `false` ou `{ position: 'top' \| 'bottom' \| 'left' \| 'right', interactive }`. Ligada quando há mais de uma série |
| `tooltip` | `true`, `false` ou `{ formatter(info) }` |
| `valueFormatter` | `(v, indicator) => texto`, para o tooltip e as etiquetas |
| `hoverDim` | Opacidade dos outros polígonos com o rato num deles (0.25) |
| `title` | Texto ou `{ text, subtext, align }` |
| `theme` | `'dark'`, `'light'` ou um objeto com `background`, `text`, `muted`, `grid`, `bands`, `tooltipBg`, `tooltipText`, `tooltipBorder`, `font` |
| `background` | Atalho para `theme.background`; `'transparent'` para cards |
| `padding` | Margem em px (10) |
| `animation` | `true`, `false` ou `{ duration }`: os polígonos crescem do centro e mudam de forma com `setSeries` |

O tooltip e os eventos recebem `{ series, seriesIndex, index, name, value, color, indicators }`.

## Métodos e eventos

| | |
|---|---|
| `setSeries(series, animate?)` | Troca as séries; os polígonos com a mesma série e posição mudam de forma |
| `setOptions(opções, animate?)` | Muda opções |
| `toggle(id, hidden?)` | Mostra / esconde uma série (id ou nome) |
| `on('hover' \| 'click' \| 'toggle', fn)` | Devolve a função para desligar |
| `resize()`, `screenshot()`, `destroy()` | |

Também exporta `radarNiceMax` (o arredondamento dos máximos) e `radarGradientAt` (a cor num gradiente).
