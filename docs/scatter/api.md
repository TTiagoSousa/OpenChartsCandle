# Dispersão · Referência da API

```ts
import { createScatterChart } from 'openchartscandle/scatter';
import 'openchartscandle/style.css';

const chart = createScatterChart(document.getElementById('dispersao')!, {
  series: [
    { name: 'Mulheres', data: [[161.2, 51.6], [167.5, 59.0], [159.5, 49.2]] },
    { name: 'Homens', data: [[174.0, 65.6], [175.3, 71.8], [193.5, 80.7]] },
  ],
  xAxis: { title: 'Altura (cm)' },
  yAxis: { title: 'Peso (kg)' },
});
```

O contentor tem de ter **altura definida**. O gráfico ocupa todo o espaço.

---

## Dados

Cada série tem `data`: uma lista de **tuplos** ou de **objetos**.

```ts
data: [[10, 8.04], [8, 6.95]]                        // [x, y]
data: [[1990, 77, 17096869, 'Austrália']]            // [x, y, extra…] — os extras servem para tamanho, cor, tooltip
data: [{ x: 10, y: 8, name: 'A', size: 20, color: '#f23645' }]
data: [['Seg', 'Ter'], ['3h', 'Qua', 12]]            // texto → eixo de categorias
```

### `ScatterPoint` (objeto)

| Campo | Descrição |
|---|---|
| `x`, `y` | Valores (números ou categorias) |
| `values` | Valores extra, a seguir a x e y (`values[0]` é a dimensão 2) |
| `id` | Chave estável **em todo o gráfico**: depois de `setSeries` o ponto com o mesmo id anda para o novo lugar, mesmo para outra série |
| `name` | Nome (tooltip, etiquetas) |
| `size` | Diâmetro em px (ganha a `symbolSize`) |
| `color`, `symbol`, `opacity` | Aparência só deste ponto |
| `label` | Texto da etiqueta |
| `effect` | Ondas à volta só deste ponto |
| `y0`, `width` | Desenha um retângulo de `y0` a `y` (uma fatia de barra) em vez de um símbolo |
| `data` | O que quiseres, devolvido nos eventos e no tooltip |

## Séries — `ScatterSeries`

| Opção | Por omissão | Descrição |
|---|---|---|
| `name` | — | Nome (legenda, tooltip) |
| `id` | `name` | Chave estável |
| `data` | — | Pontos |
| `color` | paleta | Cor da série |
| `symbol` | `'circle'` | `'circle'`, `'rect'`, `'roundRect'`, `'triangle'`, `'diamond'`, `'pin'`, `'arrow'`, `'star'`, `'cross'`, ou uma função `(valores, i) => símbolo` |
| `symbolSize` | `10` (`4` em `large`) | Diâmetro em px, ou `(valores, i) => px` |
| `opacity` | `0.85` | Opacidade |
| `borderColor`, `borderWidth` | — | Contorno dos símbolos |
| `gradient` | `false` | Bolhas com brilho (aspeto 3D) |
| `shadow` | `false` | Sombra: `true` ou `{ color, blur, offsetY }` |
| `effect` | `false` | Ondas à volta dos pontos: `true` ou `{ period: 3, scale: 2.5, count: 3, type: 'stroke' \| 'fill' }`. Se algum ponto tiver `effect`, só esses pulsam |
| `labels` | `false` | Etiquetas (ver abaixo) |
| `regression` | — | Curva ajustada: `'linear'`, `'exponential'`, `'logarithmic'`, `'polynomial'` ou `{ type, order: 2, label: true \| 'formula' \| 'r2', color, width, dash }` |
| `marks` | — | `{ max, min, average: true \| 'x' \| 'y' \| 'both', area: true \| 'Nome' }`: pinos no máximo e no mínimo de y, linhas de média e a caixa com o intervalo dos dados |
| `hull` | `false` | Contorno convexo à volta dos pontos (clusters): `true` ou `{ opacity }` |
| `line` | `false` | Liga os pontos pela ordem dos dados: `true` ou `{ width, dash, color }` |
| `barWidth` | `'50%'` | Largura dos retângulos `y0`: px ou `'60%'` da categoria |
| `large` | auto (> 4000 pontos) | Desenho rápido: pontos agrupados por cor, sem bordas, gradiente nem animação por ponto |
| `blend` | `'normal'` | `'lighter'` soma as cores onde os pontos se juntam (brilho, nebulosas) |
| `hidden` | `false` | Começa escondida |
| `legend` | `true` | `false` tira a série da legenda |

### Etiquetas — `labels`

| Opção | Por omissão | Descrição |
|---|---|---|
| `content` | nome | Função `(ponto) => texto`, ou o índice da dimensão a mostrar |
| `position` | `'top'` | `'top'`, `'right'`, `'bottom'`, `'left'`, `'inside'` |
| `layout` | — | `'top'`: todas numa linha em cima; `'right'`: numa coluna à direita. Afastam-se umas das outras e têm uma linha até ao ponto. As que não cabem escondem-se (os pontos maiores primeiro) |
| `hideOverlap` | `true` | Esconde etiquetas que se sobrepõem |
| `color`, `fontSize` (11), `fontWeight` (500) | — | Texto |

## Opções do gráfico — `ScatterOptions`

| Opção | Por omissão | Descrição |
|---|---|---|
| `series` | `[]` | Séries |
| `dimensions` | — | Nomes das dimensões (x, y, extras) para o tooltip |
| `colors` | `SCATTER_COLORS` | Paleta |
| `title` | — | `'Texto'` ou `{ text, subtext, align }` |
| `theme` | `'dark'` | `'dark'`, `'light'` ou um objeto parcial de `ScatterTheme` |
| `background` | tema | `'transparent'` para cards |
| `padding` | `8` | Espaço à volta, em px |
| `xAxis`, `yAxis` | — | Eixos (ver abaixo) |
| `aspect` | — | `'equal'` (mesmos px por unidade nos dois eixos) ou a razão y/x. Para mapas com longitude e latitude: `1 / cos(latitude)` |
| `polar` | `false` | Coordenadas polares: x é o ângulo e y o raio. `true` ou `{ startAngle: 90, clockwise: true, innerRadius: 0 }` |
| `visualMap` | — | Cor, tamanho ou opacidade por valor (ver abaixo); um ou uma lista |
| `legend` | auto | `{ show, position: 'top' \| 'bottom' \| 'left' \| 'right', align, interactive }`. Aparece com mais de uma série |
| `tooltip` | — | `{ show, formatter: (ponto) => html }` |
| `hoverScale` | `1.35` | Aumento do ponto debaixo do rato |
| `hoverDim` | `0.15` | Opacidade das outras séries quando uma está destacada |
| `zoom` | `false` | Roda do rato para zoom, arrastar para mover, duplo clique repõe. `true`, `'x'` ou `'y'` |
| `brush` | `false` | Arrastar desenha um retângulo de seleção (evento `brush`); os outros pontos esbatem-se |
| `underlay` | — | `(ctx, api) => void`: desenha por baixo dos pontos (mapas, calendários, fundos) |
| `graphic` | — | `(ctx, api) => void`: desenha por cima |
| `valueFormatter` | — | `(valor, dimensão) => texto` no tooltip, etiquetas e marcas |
| `animation` | `true` | `false` ou `{ duration: 700, delay }`. `delay` em ms por ponto, `'x'` (da esquerda para a direita) ou `(i) => ms` |
| `emptyText` | `'Sem dados'` | Texto sem pontos |

### Eixos — `ScatterAxisOptions`

| Opção | Por omissão | Descrição |
|---|---|---|
| `show` | `true` | Mostrar o eixo |
| `type` | auto | `'value'`, `'log'` ou `'category'` (automático quando há texto) |
| `categories` | ordem dos dados | Categorias e a sua ordem |
| `title` | — | Título do eixo |
| `format` | — | `(valor, categoria?) => texto` |
| `min`, `max` | dados | Número fixo, ou `'dataMin'` / `'dataMax'` |
| `beginAtZero` | `false` | Incluir o zero |
| `ticks` | auto | Número aproximado de marcas |
| `grid`, `gridDash` | `true` (`false` com o eixo escondido) | Linhas da grelha |
| `inverse` | `false` | Eixo ao contrário |
| `logBase` | `10` | Base do eixo log |
| `boundaryGap` | `true` | Categorias: pontos no meio de cada faixa (ou nas marcas) |
| `jitter` | — | Espalha os pontos de cada categoria por esta largura em px |
| `jitterOverlap` | `false` | `false`: lado a lado sem sobreposição (colmeia); `true`: ao acaso |
| `color`, `rotate` | — | Cor e rotação das etiquetas |
| `opposite` | `false` | Eixo do outro lado (em cima / à direita) |
| `line` | `true` em x | Linha ao longo do eixo |

### Cor e tamanho por valor — `visualMap`

```ts
visualMap: [
  { dimension: 2, sizes: [6, 30], title: 'PM2.5' },                      // tamanho
  { dimension: 5, colors: ['#50a3ba', '#eac736', '#d94e5d'], title: 'NO2' }, // cor
]
```

| Opção | Por omissão | Descrição |
|---|---|---|
| `dimension` | `2` (ou `1`) | Dimensão dos valores: 0 = x, 1 = y, 2… = extras |
| `min`, `max` | dados | Intervalo da escala |
| `colors` | `VISUAL_COLORS` | Cores do valor mais baixo ao mais alto |
| `sizes` | — | Diâmetros `[baixo, alto]` em px |
| `opacity` | — | Opacidades `[baixo, alto]` |
| `pieces` | — | Peças em vez de escala contínua: `[{ min, max, value, label, color, size }]` (clicar liga/desliga) |
| `series` | todas | Só estas séries (índices); `[]` mostra só a legenda |
| `show` | `true` | Mostrar o controlo |
| `position` | `'right'` | `'right'`, `'left'`, `'bottom'`, `'top'` |
| `title`, `format` | — | Título e formato dos números |
| `interactive` | `true` | Arrastar as pontas (ou clicar nas peças) filtra |
| `range` | tudo | Intervalo inicial do filtro |
| `outOfRange` | `'dim'` | Pontos fora do intervalo: esbatidos ou `'hide'` |

### API do `underlay` / `graphic`

| Campo | Descrição |
|---|---|
| `plot` | Área dos pontos `{ x, y, w, h }` |
| `width`, `height`, `theme` | Tamanho e tema |
| `x(v)`, `y(v)` | Valor → px num eixo (aceita categorias) |
| `point(x, y)` | Ponto → px (funciona em polar) |
| `toData(px, py)` | px → valores |

## Métodos

| Método | Descrição |
|---|---|
| `setSeries(series, animate = true)` | Troca as séries; os pontos com a mesma chave andam para o novo lugar, mudam de forma e de cor |
| `setOptions(patch, animate = true)` | Muda opções (eixos, visualMap…) |
| `appendData(id, data)` | Acrescenta pontos sem animação (streams) |
| `toggle(id, hidden?)` | Mostra / esconde uma série |
| `highlight(id \| null)` | Destaca uma série |
| `select(filtro \| null)` | Mantém em destaque os pontos que passam no filtro `(ponto) => boolean` |
| `setVisualRange(i, [baixo, alto])` | Intervalo de um `visualMap` contínuo |
| `setZoom({ x?, y? })`, `resetZoom()` | Zoom nos eixos de valor |
| `toPixel(x, y)`, `toData(px, py)` | Conversões |
| `screenshot()` | PNG em data URL |
| `destroy()` | Remove o gráfico |

## Eventos

```ts
chart.on('click', (p) => console.log(p.name, p.values));
chart.on('brush', (pontos) => console.log(pontos.length));
```

| Evento | Recebe |
|---|---|
| `hover` | `ScatterPointInfo` ou `null` |
| `click` | `ScatterPointInfo` |
| `toggle` | `{ id, hidden }` |
| `brush` | `ScatterPointInfo[]` (vazio quando a seleção é limpa) |
| `zoom` | `{ x: [a, b], y: [a, b] }` |

`ScatterPointInfo`: `{ series, seriesIndex, dataIndex, values, x, y, name, color, size, data }`.

## Matriz de dispersão — `createScatterMatrix`

```ts
import { createScatterMatrix } from 'openchartscandle/scatter';

const matrix = createScatterMatrix(el, {
  rows: [[5.1, 3.5, 1.4, 0.2, 'setosa'], /* … */],
  dimensions: ['Sépala C', 'Sépala L', 'Pétala C', 'Pétala L', 'Espécie'],
  groupBy: 4,
});
matrix.on('brush', (linhas) => console.log(linhas)); // índices das linhas selecionadas
```

| Opção | Por omissão | Descrição |
|---|---|---|
| `rows` | — | Linhas de valores, na ordem de `dimensions` |
| `dimensions` | — | Nomes das colunas |
| `groupBy` | — | Coluna com o grupo (cor) de cada linha |
| `columns` | todas menos `groupBy` | Colunas a cruzar |
| `colors`, `theme`, `background` | — | Aparência |
| `symbolSize` | `5` | Diâmetro dos pontos |
| `brush` | `true` | Seleção ligada entre células |
| `gap` | `6` | Espaço entre células |
| `legend` | `true` | Legenda dos grupos (clicar esconde) |

Métodos: `select(linhas | null)`, `on('brush', fn)`, `destroy()` e `charts` (os gráficos de cada célula).

## Estatística

Funções puras, sem gráfico:

```ts
import { regression, kmeans, convexHull, beeswarm } from 'openchartscandle/scatter';

const r = regression('linear', [[1, 2], [2, 4.1], [3, 5.9]]);
r.expression; // 'y = 1.95x + 0.1'
r.r2;         // 0.998…
r.predict(10);

const k = kmeans(pontos, 3, { seed: 7 });
k.labels;     // grupo de cada ponto
k.steps;      // cada iteração (para animar)
```

| Função | Descrição |
|---|---|
| `regression(tipo, pontos, ordem = 2)` | `{ coefficients, predict, expression, r2 }` |
| `kmeans(pontos, k, { maxIterations, seed })` | `{ centroids, labels, steps }` com k-means++ |
| `convexHull(pontos)` | Contorno convexo |
| `beeswarm(posições, raios, máximo)` | Desvios laterais para pontos não se sobreporem |

## Receitas

### De dispersão para barras

Dá a cada ponto um `id` e, na vista de barras, passa `y0` e `y` (uma fatia da barra por ponto). Com `setOptions` os pontos voam para a barra e passam de círculo a retângulo. Vê `Aggregate Scatter to Bar` na galeria.

### Mapa por baixo dos pontos

Usa longitude e latitude como x e y, `aspect: 1 / Math.cos(lat * Math.PI / 180)`, eixos escondidos e desenha as regiões no `underlay` com `api.point(lon, lat)`. Vê `Geo Choropleth and Scatter` na galeria.
