# Boxplot · referência da API

```ts
import { createBoxplotChart } from 'openchartscandle/boxplot';
import 'openchartscandle/style.css';

const chart = createBoxplotChart(el, {
  categories: ['Seg', 'Ter', 'Qua'],
  series: [
    // valores em bruto: a biblioteca calcula as caixas
    { name: 'API', samples: [[120, 135, 180, 410], [98, 140, 150], [110, 125, 160, 170]] },
    // ou caixas prontas: [mínimo, Q1, mediana, Q3, máximo]
    { name: 'Cache', data: [[20, 30, 38, 45, 60], [18, 28, 35, 41, 55], { value: [22, 31, 37, 44, 58], outliers: [95] }] },
  ],
});
```

O elemento tem de ter altura (o gráfico ocupa o espaço todo).

## Como as caixas são calculadas

Com `samples` (ou `data: [{ samples }]`), cada caixa é calculada a partir dos valores (os que não são números são ignorados):

- **Quartis** Q1, mediana e Q3 por interpolação linear entre as posições mais próximas: posição `(n − 1) × p` nos valores ordenados (Hyndman & Fan tipo 7, o mesmo do R, NumPy e `QUARTIL.INC` do Excel).
- **Bigodes** até ao valor mais extremo dentro de `Q1 − k × IQR` e `Q3 + k × IQR`, com `IQR = Q3 − Q1` e `k = 1,5` (Tukey). Muda com a opção `whisker`: outro `k`, ou `'range'` para ir do mínimo ao máximo sem outliers.
- **Outliers**: os valores para lá dos bigodes, desenhados como pontos.
- **Média** e número de valores, para o tooltip e o marcador `mean`.

Nos tooltips, "Mínimo" e "Máximo" são as pontas dos bigodes (sem os outliers).

## Séries

| Campo | |
|---|---|
| `name` | Nome na legenda e no tooltip |
| `data` | Uma caixa por categoria: `[mínimo, Q1, mediana, Q3, máximo]`, ou `{ value, outliers, mean, samples, name, color }`, ou `null` (sem caixa) |
| `samples` | Atalho para valores em bruto: uma lista de valores por categoria |
| `color` | Cor (por omissão a paleta `colors`) |
| `fill` | Enchimento da caixa: opacidade da cor (`0.2`) ou uma cor CSS |
| `width` | Espessura das linhas (1.5) |
| `mean` | Marcador da média: `true` ou `{ symbol, size, color }` (sobrepõe a opção do gráfico) |
| `outliers` | `true` (por omissão), `false` ou `{ size, symbol, color }` |
| `points` | Cada valor em bruto como ponto disperso (sobrepõe a opção do gráfico), ver abaixo |
| `hidden` | Começa escondida |

Os símbolos são `'circle'`, `'square'`, `'diamond'` e `'cross'`.

### Pontos dispersos (points)

`true` ou `{ position, size, opacity, jitter, color }`. Só para caixas calculadas a partir de valores.

| Campo | | Por omissão |
|---|---|---|
| `position` | `'over'` por cima da caixa, ou `'beside'` ao lado (a caixa e os pontos dividem o espaço) | `'over'` |
| `size` | Raio em px | `2.5` |
| `opacity` | | `0.55` |
| `jitter` | Largura da dispersão, em fração da largura da caixa | `0.8` |

## Eixos e tamanhos

| Opção | | Por omissão |
|---|---|---|
| `categories` | Nomes das categorias | os nomes dos itens da primeira série, ou 1, 2, 3… |
| `orient` | `'vertical'` (categorias em baixo) ou `'horizontal'` (categorias à esquerda, a primeira em cima) | `'vertical'` |
| `whisker` | `k` dos bigodes, ou `'range'` | `1.5` |
| `categoryAxis` | `{ show, title, format(categoria, i), rotate, grid, color }`. As etiquetas rodam sozinhas quando não cabem; `grid` desenha linhas entre categorias | |
| `valueAxis` | `{ show, title, format(v), min, max, beginAtZero, ticks, grid, gridDash, color }`. Por omissão um intervalo com valores redondos à volta dos dados | |
| `bandWidth` | Parte do espaço de cada categoria usada pelas suas caixas (0–1) | `0.7` |
| `boxWidth` | Largura mínima e máxima de cada caixa, px | `[7, 50]` |

Com várias séries, as caixas de cada categoria ficam lado a lado, pela ordem das séries.

## Cores, legenda e tooltip

| Opção | |
|---|---|
| `colors` | Paleta das séries (`BOXPLOT_COLORS`) |
| `mean` | Marcador da média em todas as séries (desligado) |
| `points` | Pontos dispersos em todas as séries com valores em bruto (desligado) |
| `legend` | `true`, `false` ou `{ position: 'top' \| 'bottom' \| 'left' \| 'right', interactive }`. Ligada quando há mais de uma série |
| `tooltip` | `true`, `false` ou `{ formatter(info) }` |
| `valueFormatter` | `(v) => texto`, para o tooltip |
| `hoverDim` | Opacidade das outras séries com o rato numa caixa (0.4) |
| `title` | Texto ou `{ text, subtext, align }` |
| `theme` | `'dark'`, `'light'` ou um objeto com `background`, `text`, `muted`, `grid`, `axis`, `tooltipBg`, `tooltipText`, `tooltipBorder`, `font` |
| `background` | Atalho para `theme.background`; `'transparent'` para cards |
| `padding` | Margem em px (10) |
| `animation` | `true`, `false` ou `{ duration }`: as caixas abrem a partir da mediana e mudam de tamanho com `setSeries` |

O tooltip e os eventos recebem `{ series, seriesIndex, category, categoryIndex, name, color, kind, value, stats, point }`: `kind` é `'box'`, `'outlier'` ou `'point'`, `value` é `[mínimo, Q1, mediana, Q3, máximo]`, `stats` tem também `mean`, `count` e `outliers`, e `point` é o valor do outlier ou do ponto.

## Métodos e eventos

| | |
|---|---|
| `setSeries(series, animate?)` | Troca as séries; as caixas com a mesma série e categoria mudam de tamanho |
| `setOptions(opções, animate?)` | Muda opções |
| `toggle(id, hidden?)` | Mostra / esconde uma série (id ou nome) |
| `on('hover' \| 'click' \| 'toggle', fn)` | Devolve a função para desligar |
| `resize()`, `screenshot()`, `destroy()` | |

## Funções de estatística

```ts
import { boxplotAggregate, boxplotQuantile, boxplotStats } from 'openchartscandle/boxplot';

boxplotStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 100]);
// { low: 1, q1: 3.25, median: 5.5, q3: 7.75, high: 9, iqr: 4.5, min: 1, max: 100, mean: 14.5, count: 10, outliers: [100] }

boxplotQuantile([1, 2, 3, 4], 0.25); // 1.75 (valores já ordenados)

// linhas em bruto → categorias e séries prontas a usar
const { categories, series } = boxplotAggregate(rows, { category: 'country', value: 'income', series: 'continent' });
createBoxplotChart(el, { categories, series });
```

| | |
|---|---|
| `boxplotStats(valores, { whisker })` | A caixa dos valores (ou `null` se não houver nenhum número): `low` e `high` são as pontas dos bigodes, `min` e `max` os extremos com os outliers |
| `boxplotQuantile(ordenados, p)` | O quantil `p` (0–1) de valores ordenados, tipo 7 |
| `boxplotAggregate(linhas, { category, value, series, name, sort })` | Agrupa linhas: uma categoria por cada `category` diferente e uma série por cada `series` (ou uma só série chamada `name`). Cada campo é o nome de uma coluna ou uma função `(linha) => valor`. As categorias ficam pela ordem em que aparecem, ou ordenadas com `sort(a, b)` |
