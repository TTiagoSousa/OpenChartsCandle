# Séries próprias · referência da API

```ts
import { createCustomChart } from 'openchartscandle/custom';
import 'openchartscandle/style.css';

const chart = createCustomChart(el, {
  xAxis: { type: 'category' },
  series: [
    {
      name: 'Resultado',
      data: [['Jan', 42], ['Fev', -18], ['Mar', 65]],
      renderItem: (params, api) => {
        const [x, y] = api.coord([api.value(0), api.value(1)]);
        const [, y0] = api.coord([api.value(0), 0]);
        const w = api.size([1, 0])[0] * 0.6;
        return { type: 'rect', shape: { x: x - w / 2, y: Math.min(y, y0), width: w, height: Math.abs(y0 - y) }, style: api.style() };
      },
    },
  ],
});
```

O elemento tem de ter altura. Cada item da série passa pelo `renderItem`, que devolve as formas a desenhar (ou `null` para não desenhar nada). O gráfico desenha-as, trata do tooltip, do hover, do click, do arrastar e das animações.

## Sistemas de coordenadas

| `coordinateSystem` | | `api.coord(valores)` |
|---|---|---|
| `'cartesian'` (por omissão) | Eixos `xAxis` e `yAxis` numa grelha | `[x, y]` → px |
| `'polar'` | `angleAxis` (à volta) e `radiusAxis` (do centro para fora); `polar: { center, radius }` | `[ângulo, raio]` → px |
| `'none'` | Píxeis; `api.rect` é a área do gráfico (menos `grid`) | devolve os valores |

### Eixos

| Opção | | Por omissão |
|---|---|---|
| `type` | `'value'`, `'category'`, `'time'` (ms, `Date` ou `'2026-10-19 14:30'`) ou `'log'` | pelos dados |
| `data` | Categorias por ordem | pela ordem em que aparecem |
| `min`, `max` | Número, `'dataMin'` / `'dataMax'` ou `(extensão) => número` | arredondado |
| `beginAtZero` | Eixos de valor incluem o 0 | `true` |
| `splitNumber`, `interval` | Número aproximado de marcas, ou intervalo fixo | pelo tamanho |
| `inverse`, `opposite` | Ao contrário; do outro lado (x em cima, y à direita) | |
| `boundaryGap` | Categorias no meio de cada faixa | `true` |
| `splitLine`, `splitArea`, `axisLine`, `axisTick` | Grelha, faixas alternadas, linha do eixo, marcas | grelha em y |
| `format` | `(v, categoria?) => texto` | |
| `name`, `nameLocation` | Título do eixo, `'end'` ou `'middle'` | |
| `rotate`, `labelInterval` | Rodar as etiquetas; mostrar uma em cada n | automático |
| `startAngle`, `clockwise` | Só `angleAxis`: ângulo do primeiro valor (graus, 90 = 12 h) e sentido | `90`, `true` |
| `show`, `color` | | |

O intervalo de cada eixo vem das dimensões em `encode.x` / `encode.y` (ou `angle` / `radius`) de todas as séries visíveis. `grid: { left, right, top, bottom }` (px ou `'%'`) fixa a grelha; por omissão há espaço para as etiquetas.

## Séries

| Campo | |
|---|---|
| `name`, `color` | Legenda, tooltip e `api.visual('color')` (por omissão a paleta `colors`) |
| `data` | Itens: arrays (`[x, y, …]`), objetos ou números |
| `renderItem(params, api)` | Devolve um elemento, um grupo ou `null` |
| `dimensions` | Nomes das dimensões: `api.value('Mínimo')` e as linhas do tooltip |
| `encode` | `{ x, y, angle, radius, tooltip, itemName }`: dimensões de cada eixo (número, nome ou lista), do tooltip e do nome do item |
| `clip` | Cortar pela grelha (por omissão `true` em cartesiano) |
| `emphasis` | `{ style, focus: 'self' \| 'series', scope: 'element', disabled }` |
| `tooltip` | `false` ou `(params) => html` |
| `z`, `silent`, `excludeFromRange`, `legend` | Ordem, sem rato, fora dos eixos, fora da legenda |

### `params`

`{ seriesIndex, seriesName, dataIndex, dataCount, data, color, coordSys, time, hoverIndex }`. `coordSys` tem o retângulo (e `cx`, `cy`, `r0`, `r` em polar); `hoverIndex` é o item com o rato (para desenhar outra coisa no hover).

### `api`

| | |
|---|---|
| `value(dim, índice?)` | Valor de uma dimensão (número ou nome) deste item ou de outro |
| `coord(valores)` | Dados → px |
| `size(intervalo, em?)` | Tamanho em px de um intervalo de dados: `[dx, dy]` → `[w, h]` (uma categoria = a faixa); em polar `[radianos, px]` |
| `style(extra?)` | `{ fill: cor da série, ...extra }` |
| `visual('color')` | Cor da série |
| `barLayout({ count, gap, categoryGap })` | `[{ offset, width }]` de `count` barras lado a lado numa categoria |
| `scale(eixo, v)`, `categories(eixo)` | Posição num só eixo; nomes das categorias |
| `rect`, `width`, `height` | Grelha / área e tamanho do canvas |
| `polar` | `{ cx, cy, r0, r, angle(v), radius(v), point(ângulo, raio) }` |
| `time`, `progress` | ms desde a criação; progresso 0–1 da transição atual |
| `theme`, `view` | Cores do tema; intervalo com zoom |
| `measureText(texto, tamanho?, peso?)`, `ctx` | Para medir texto |

## Elementos

Todos aceitam `id`, `x`, `y`, `rotation` (radianos), `scaleX`, `scaleY`, `originX`, `originY`, `style`, `emphasis: { style }`, `label`, `z`, `silent`, `ignore`, `enterFrom`, `leaveTo`, `info`, `draggable` e `cursor`.

| `type` | `shape` |
|---|---|
| `'rect'` | `{ x, y, width, height, r }` (`r` canto ou `[tl, tr, br, bl]`) |
| `'circle'`, `'ellipse'` | `{ cx, cy, r }`, `{ cx, cy, rx, ry }` |
| `'sector'` | `{ cx, cy, r, r0, startAngle, endAngle }` (radianos, 0 = 3 h, sentido horário) |
| `'arc'` | `{ cx, cy, r, startAngle, endAngle }` (só traço) |
| `'polygon'`, `'polyline'` | `{ points: [[x, y], …], smooth }` |
| `'line'` | `{ x1, y1, x2, y2 }` |
| `'path'` | `{ pathData, x, y, width, height, layout: 'center' \| 'cover' }`: um `d` de SVG, encaixado na caixa se tiver `width` / `height` |
| `'text'` | sem `shape`: `style.text`, `fontSize`, `fontWeight`, `align`, `verticalAlign`, `fill`, `stroke` (halo) |
| `'image'` | `{ x, y, width, height }` e `style.image` (URL ou imagem) |
| `'group'` | `children: [...]`; o `style` e o `enterFrom` passam aos filhos |

`style`: `fill`, `stroke`, `lineWidth`, `opacity`, `fillOpacity`, `strokeOpacity`, `lineDash`, `lineCap`, `lineJoin`, `shadowBlur`, `shadowColor`, `shadowOffsetX/Y`, mais os de texto. `fill` / `stroke` podem ser gradientes `{ type: 'linear' \| 'radial', x, y, x2, y2, r, stops: [[0, cor], [1, cor]], global }` (frações da caixa da forma, ou px com `global: true`).

`label: { text, position, color, fontSize, fontWeight, distance, overflow, stroke }` põe texto na caixa da forma: `'inside'`, `'insideLeft'`, `'insideRight'`, `'insideTop'`, `'insideBottom'`, `'top'`, `'bottom'`, `'left'` ou `'right'`. Por dentro é cortado com "…" quando não cabe (`overflow: 'hide'` esconde) e a cor escolhe-se para se ler.

## Animações

- Ao criar e com `setData` / `setOptions` / `refresh(true)`, cada forma vai do estado anterior ao novo. A chave é o `id` (comum a todas as séries) ou, sem `id`, a série + o item + a posição no grupo.
- Formas do mesmo tipo interpolam os números (posições, tamanhos, ângulos, pontos, cores, rotação). Tipos diferentes (um círculo e um setor, um retângulo e um polígono) transformam-se pelo contorno. Texto e imagens só aparecem / desaparecem.
- `enterFrom` (por omissão `{ opacity: 0 }`) e `leaveTo` dizem de onde vem e para onde vai: `{ opacity, scale, x, y, rotation, shape: {...}, style: {...} }`, por exemplo `enterFrom: { shape: { y: y0, height: 0 } }` para uma barra crescer.
- `animation: { duration, easing, delay(dataIndex, seriesIndex) }`; `easing` `'linear'`, `'cubicOut'`, `'cubicInOut'`, `'quadOut'`, `'backOut'` ou `'elasticOut'`.
- `live: true` corre o `renderItem` a cada frame (com `api.time`), para efeitos contínuos.

## Opções gerais

| Opção | |
|---|---|
| `colors` | Paleta (`CUSTOM_COLORS`) |
| `legend` | `true`, `false` ou `{ position, interactive }`: uma entrada por série com nome (aparece com mais de uma) |
| `tooltip` | `true`, `false` ou `{ formatter(params) }`. Por omissão: o nome e as dimensões de `encode.tooltip` |
| `valueFormatter` | `(v) => texto` dos números do tooltip |
| `zoom` | `true` ou `{ axis: 'x' \| 'y' \| 'xy', minSpan }`: roda do rato, arrastar e duplo clique para repor |
| `graphic` | Elementos em px por cima das séries, ou `(info) => elementos` (com `rect`, `theme`, `time`) |
| `title`, `theme`, `background` | Como nas outras famílias; `theme` tem `background`, `text`, `muted`, `grid`, `axis`, `tooltipBg`, `tooltipText`, `tooltipBorder`, `font` |

Os eventos recebem `{ seriesIndex, seriesName, dataIndex, data, value, name, color, info, x, y }`.

## Métodos e eventos

| | |
|---|---|
| `setData(dados, série?, animate?)` | Troca os dados de uma série |
| `setOptions(opções, animate?)` | Muda opções e séries |
| `refresh(animate?)` | Corre o `renderItem` outra vez (estado de fora mudou) |
| `toggle(nome, hidden?)` | Mostra / esconde uma série |
| `zoomTo('x' \| 'y', min, max, animate?)`, `resetZoom()` | |
| `convertToPixel(valores)`, `convertFromPixel([x, y])`, `getRect()` | |
| `on('hover' \| 'click' \| 'toggle' \| 'zoom', fn)` | Devolve a função para desligar |
| `on('dragstart' \| 'drag' \| 'dragend', fn)` | Em formas com `draggable: true`; recebe também `dx`, `dy` e `at` (os dados por baixo do rato) |
| `resize()`, `screenshot()`, `destroy()` | |

## Ajudantes

| | |
|---|---|
| `customHistogram(valores, { bins, binWidth, min, max })` | Classes `{ x0, x1, count }` com limites redondos |
| `customHexbin(pontos, raio)`, `customHexagon(x, y, raio)` | Agrupar pontos em hexágonos; os vértices de um hexágono |
| `customPack(raiz, { width, height, padding })` | Círculos encaixados de uma hierarquia (como `d3.pack`) |
| `customPackSiblings(círculos)`, `customEnclose(círculos)` | Encostar círculos sem sobreposição; o menor círculo que os contém |
| `customParsePath(d)`, `customPathBounds`, `customFlattenPath` | Caminhos SVG |
| `customScale(eixo, valores, [px0, px1])`, `customTimeTicks` | As escalas sozinhas |
