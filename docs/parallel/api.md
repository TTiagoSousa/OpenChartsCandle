# Paralelas · referência da API

```ts
import { createParallelChart } from 'openchartscandle/parallel';
import 'openchartscandle/style.css';

const chart = createParallelChart(el, {
  axes: [
    { name: 'P/E', min: 0 },
    { name: 'Beta' },
    { name: 'Cap. (mil M$)', type: 'log' },
    { name: 'Setor', type: 'category', data: ['Tecnologia', 'Saúde', 'Energia'] },
  ],
  series: [
    {
      name: 'Empresas',
      data: [
        { name: 'AAA', value: [28.4, 1.3, 850, 'Tecnologia'] },
        { name: 'BBB', value: [14.1, 0.8, 120, 'Saúde'] },
        [9.6, 1.1, 64, 'Energia'],
      ],
    },
  ],
  visualMap: { dimension: 1 },
});

chart.on('brush', (e) => console.log(`${e.count} de ${e.total}`, e.ranges));
```

O elemento tem de ter altura (o gráfico ocupa o espaço todo). Cada linha de dados é uma linha que atravessa todos os eixos, com um valor por eixo, pela ordem de `axes`.

## Eixos (axes)

| Campo | |
|---|---|
| `name` | Nome do eixo (arrasta-o para mudar o eixo de lugar) |
| `type` | `'value'` (por omissão), `'log'` ou `'category'` (por omissão quando há `data` ou os valores são texto) |
| `data` | Categorias, do início para o fim do eixo. Sem ela, as categorias são os nomes encontrados nos dados, pela ordem em que aparecem |
| `min` / `max` | Número ou `'dataMin'` / `'dataMax'`. Por omissão o menor e o maior valor, arredondados (3 → 0, 47 → 50) |
| `nice` | Arredondar os extremos automáticos (`true`) |
| `inverse` | Valores pequenos no fim do eixo em vez do início |
| `splitNumber` | Número de intervalos entre marcas (5) |
| `formatter` | `(valor) => texto` das etiquetas das marcas |
| `color` | Cor da linha e do nome do eixo |

No layout horizontal o início do eixo é em baixo; no vertical é à esquerda. Os eixos log usam décadas inteiras (1, 10, 100…) e ignoram valores ≤ 0. Em eixos curtos há menos etiquetas, e as que não cabem entre dois eixos são cortadas com `…`.

## Séries

| Campo | |
|---|---|
| `name` | Nome na legenda e no tooltip |
| `data` | Linhas: `[v1, v2, …]` ou `{ name, value: [v1, v2, …], color }`. Um valor é um número, um nome de categoria ou `null` (sem valor: a linha interrompe-se) |
| `color` | Cor (por omissão a paleta `colors`) |
| `width` | Espessura da linha (`lineWidth`, 1.2) |
| `opacity` | Opacidade 0–1 (`opacity`, 0.75) |
| `smooth` | Curvas entre eixos: `true` ou uma tensão 0–1 (`smooth`) |
| `hidden` | Começa escondida |

## Cores por valor (visualMap)

```ts
// gradiente contínuo pelo valor do eixo 4
visualMap: { dimension: 4, colors: ['#2962ff', '#ffc107', '#f23645'] }

// por intervalos (min incluído, max excluído) ou por categoria
visualMap: {
  dimension: 1,
  pieces: [
    { max: 50, color: '#50a3ba' },
    { min: 50, max: 100, color: '#eac736', label: 'Moderado' },
    { min: 100, color: '#d94e5d' },
  ],
}
```

| Campo | |
|---|---|
| `dimension` | Índice do eixo (pela ordem de `axes`) |
| `colors` | Cores do mínimo ao máximo (contínuo) |
| `min` / `max` | Extremos do gradiente; por omissão os do eixo |
| `pieces` | `{ min, max, value, color, label }`: um clique num intervalo esconde as suas linhas |
| `show` | Mostrar a barra / os intervalos por baixo do gráfico (`true`) |
| `title` | Texto antes da barra (por omissão o nome do eixo) |
| `format` | `(v) => texto` dos extremos e dos intervalos |

Num eixo de categorias, o gradiente vai da primeira à última categoria. A cor própria de uma linha (`{ color }`) ganha ao visualMap.

## Seleção (brush)

Arrasta ao longo de um eixo para selecionar um intervalo: as linhas fora dele ficam cinzentas e deixam de responder ao rato. Seleções em vários eixos juntam-se (E). Arrasta dentro de uma seleção para a mover; um clique no eixo limpa a seleção desse eixo.

| Opção | |
|---|---|
| `brush` | `true` (por omissão), `false` ou `{ fill, border }` |
| `inactive` | Linhas fora da seleção: `{ color, opacity }` (cor do tema, 0.12) |

```ts
chart.setBrush([{ axis: 2, from: 1.2, to: 3 }, { axis: 3, categories: ['Tecnologia'] }]);
chart.clearBrush();
const { count, total, selected } = chart.getSelection();
```

O evento `brush` (e `getSelection()`) devolve `{ ranges, selected, count, total }`:

- `ranges`: `[{ axis, name, from, to }]`, ou `{ axis, name, categories }` num eixo de categorias;
- `selected`: `[{ seriesIndex, name, indices }]` por série visível, com os índices das linhas em `data`;
- `count` / `total`: linhas selecionadas / visíveis.

O evento também é enviado quando escondes uma série ou um intervalo do visualMap.

## Layout e aparência

| Opção | | Por omissão |
|---|---|---|
| `layout` | `'horizontal'`: eixos lado a lado, cada um na vertical; `'vertical'`: eixos empilhados, cada um na horizontal | `'horizontal'` |
| `colors` | Paleta das séries | `PARALLEL_COLORS` |
| `lineWidth` / `opacity` / `smooth` | Valores por omissão das séries | `1.2` / `0.75` / `false` |
| `axisReorder` | Arrastar o nome de um eixo muda-o de lugar | `true` |
| `axisLabel` | Etiquetas das marcas: `true`, `false` ou `{ color, fontSize }` | ligado, 11 px |
| `axisName` | `{ color, fontSize }` dos nomes dos eixos | 12 px |
| `legend` | `true`, `false` ou `{ position: 'top' \| 'bottom' \| 'left' \| 'right', interactive }`. Ligada quando há mais de uma série; num gráfico pequeno fica numa só linha com scroll | `'bottom'` |
| `tooltip` | `true`, `false` ou `{ formatter(info) }` | ligado |
| `valueFormatter` | `(v, axis) => texto`, para o tooltip | |
| `title` | Texto ou `{ text, subtext, align }` | |
| `theme` | `'dark'`, `'light'` ou um objeto com `background`, `text`, `muted`, `axis`, `inactive`, `brushFill`, `brushBorder`, `tooltipBg`, `tooltipText`, `tooltipBorder`, `font` | `'dark'` |
| `background` | Atalho para `theme.background`; `'transparent'` para cards | |
| `padding` | Margem em px | `12` |
| `animation` | `true`, `false` ou `{ duration }`: as linhas desenham-se do primeiro ao último eixo | `true` (900 ms) |

O tooltip e os eventos `hover` / `click` recebem `{ series, seriesIndex, index, name, value, color, axes }`.

## Muitas linhas

Milhares de linhas desenham-se depressa: são agrupadas por cor (o gradiente do visualMap tem 49 tons), desenhadas num só traço por grupo e guardadas numa camada; o rato só redesenha a linha por baixo dele. Com muitas linhas usa `opacity` baixa (0.2–0.5) e `lineWidth: 1`.

## Métodos e eventos

| | |
|---|---|
| `setSeries(series, animate?)` | Troca as séries (a seleção mantém-se) |
| `setOptions(opções, animate?)` | Muda opções (`layout`, `visualMap`, `axes`…) |
| `toggle(id, hidden?)` | Mostra / esconde uma série (id ou nome) |
| `setBrush(ranges)`, `clearBrush()`, `getSelection()` | Seleção por código |
| `axisOrder`, `setAxisOrder(ordem)` | Ordem em que os eixos aparecem (índices de `axes`) |
| `on('hover' \| 'click' \| 'toggle' \| 'brush' \| 'axisorder', fn)` | Devolve a função para desligar |
| `resize()`, `screenshot()`, `destroy()` | |

Também exporta as funções puras `buildParallelScale` (a escala de um eixo), `parallelInRanges` (o filtro da seleção), `parallelPieceIndex` (em que intervalo cai um valor), `parallelRangeValues` e `parallelSegmentAt`, e os temas `parallelDarkTheme` / `parallelLightTheme`.
