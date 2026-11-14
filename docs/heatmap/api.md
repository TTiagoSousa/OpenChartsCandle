# Heatmap · referência da API

```ts
import { createHeatmapChart } from 'openchartscandle/heatmap';
import 'openchartscandle/style.css';

const chart = createHeatmapChart(el, {
  xAxis: { data: ['0h', '1h', '2h', '3h'] },
  yAxis: { data: ['Seg', 'Ter', 'Qua'] },
  data: [
    [0, 0, 5],
    [1, 0, 7],
    ['3h', 'Qua', 2],
  ],
  label: true,
  visualMap: { min: 0, max: 10 },
});
```

O elemento tem de ter altura (o mapa de calor ocupa o espaço todo).

## Dados

Uma célula por par (coluna x, linha y), de três formas:

- `data: [[x, y, valor], ...]`: x e y são o índice da categoria (`0`, `1`…) ou o seu nome (`'3h'`).
- `data: [{ x, y, value, color, label }, ...]`: `color` é uma cor própria (por cima da do visualMap) e `label` um texto extra no tooltip.
- `matrix: [[...], [...]]`: `matrix[linha][coluna]`, a linha é o índice em y e a coluna o índice em x.

`null` (ou sem valor) = célula vazia. Sem `data` nos eixos o tamanho da grelha é o maior índice encontrado.

## Eixos

`xAxis` e `yAxis` aceitam:

| Campo | | Por omissão |
|---|---|---|
| `data` | Nomes das categorias, por ordem | `0, 1, 2…` |
| `bins` | Intervalos numéricos em vez de nomes: `{ min, step, count }`. Um valor `v` vai para o intervalo `floor((v - min) / step)` e as etiquetas são o início de cada intervalo | |
| `name` | Título do eixo | |
| `show` | Mostrar as etiquetas | `true` |
| `format` | `(nome, índice) => texto` | |
| `rotate` | Rotação das etiquetas de x em graus, ou `'auto'`: rodam 45° quando não cabem e depois mostram-se só algumas (de 1 em 1, 2 em 2, 5 em 5, 10 em 10…) | `'auto'` |
| `inverse` | A primeira categoria no fim: x da direita, y de cima (em y a primeira fica em baixo por omissão) | `false` |
| `color`, `fontSize` | Cor e tamanho das etiquetas | tema, `11` |

## Cores (visualMap)

```ts
visualMap: { min: 0, max: 1, colors: ['#313695', '#ffffbf', '#a50026'], title: 'Valor', position: 'bottom' }
visualMap: {
  pieces: [
    { value: 1, color: '#ffd54f' }, // a primeira peça que serve ganha
    { max: 0.2, color: '#313695', label: '< 0,2' },
    { min: 0.2, max: 0.5, color: '#74add1' },
    { min: 0.5, color: '#a50026' },
  ],
}
visualMap: { min: 0, max: 100, splitNumber: 5 } // cinco peças iguais ao longo de `colors`
```

| Campo | | Por omissão |
|---|---|---|
| `min`, `max` | Intervalo das cores | o mínimo e o máximo dos dados |
| `colors` | Cores do menor para o maior (gradiente) | `HEATMAP_COLORS` (azul → amarelo → vermelho) |
| `pieces` | Peças fixas `{ min, max, value, color, label }`; um clique numa peça da legenda esconde / mostra as suas células | |
| `splitNumber` | Ou N peças iguais entre `min` e `max` | |
| `range` | Intervalo inicial das pegas (gradiente) | `[min, max]` |
| `interactive` | Pegas arrastáveis no gradiente e peças clicáveis | `true` |
| `show` | Mostrar a legenda | `true` |
| `position` | `'bottom'` ou `'right'` | `'bottom'` |
| `title`, `format` | Título e formato dos valores da legenda | |

No gradiente, arrastar uma pega (ou clicar na barra) filtra as células: as que ficam fora do intervalo passam a vazias. `visualMap: false` esconde a legenda (as cores continuam).

## Aparência

| Opção | | Por omissão |
|---|---|---|
| `cell` | `{ gap, radius, borderColor, borderWidth, emptyColor }`: espaço entre células, cantos, contorno e a cor das vazias (`'transparent'` não as desenha) | sem espaço, `emptyColor` do tema |
| `square` | Células quadradas, com a grelha centrada | `false` |
| `label` | Valor dentro das células: `true` ou `{ format(valor, célula), color, fontSize }`. Só aparece onde cabe; a cor do texto é preta ou branca conforme a célula | desligado |
| `emphasis` | O que fica aceso com o rato: `'cell'`, `'row'`, `'column'`, `'cross'` (linha e coluna; o resto fica velado) ou `false` | `'cell'` |
| `zoom` | `true`, `'x'` ou `'y'`: roda do rato faz zoom, arrastar move, duplo clique volta ao início | `false` |
| `title` | Texto ou `{ text, subtext, align }` | |
| `tooltip` | `true`, `false` ou `{ formatter(célula) }` (devolve HTML) | ligado |
| `valueFormatter` | `(v) => texto` para o tooltip e as etiquetas | |
| `theme` | `'dark'`, `'light'` ou um objeto com `background`, `text`, `muted`, `axis`, `cell`, `emphasis`, `tooltipBg`, `tooltipText`, `tooltipBorder`, `font` | `'dark'` |
| `background` | Atalho para `theme.background`; `'transparent'` para cards | |
| `padding` | Margem em px | `10` |
| `animation` | `true`, `false` ou `{ duration }`: as células crescem numa onda diagonal | ligado |

## Muitas células

O desenho agrupa as células por cor (uma mudança de cor por tom, não por célula), fica guardado numa camada e o rato só redesenha o destaque. O hit-test é aritmética de índices. 20 000 células (200 × 100) redesenham em poucos milissegundos, e as etiquetas desligam-se sozinhas quando as células são pequenas demais.

## Matriz de correlação

```ts
import { createHeatmapChart, heatmapCorrelation, heatmapReturns } from 'openchartscandle/heatmap';

const names = ['BTC', 'ETH', 'AAPL', 'Ouro'];
const returns = [btc, eth, aapl, ouro].map((closes) => heatmapReturns(closes));
createHeatmapChart(el, {
  xAxis: { data: names },
  yAxis: { data: names, inverse: true },
  matrix: heatmapCorrelation(returns),
  square: true,
  label: { format: (v) => v.toFixed(2) },
  visualMap: { min: -1, max: 1, colors: ['#f23645', '#f7f7f7', '#089981'] },
});
```

- `heatmapReturns(preços)`: retornos simples `p[i] / p[i-1] - 1`.
- `heatmapCorrelation(séries)`: matriz de Pearson, simétrica, 1 na diagonal. Cada par usa só as posições em que as duas séries têm valor; uma série constante dá 0.

## Métodos e eventos

O tooltip e os eventos recebem `{ x, y, xName, yName, value, color, datum, box }` (`x` e `y` são índices, `box` a caixa em px).

| | |
|---|---|
| `setData(data, animate?)` | Troca as células (`[x, y, valor]` ou objetos) |
| `setMatrix(matrix, animate?)` | Troca as células por uma matriz |
| `setOptions(opções, animate?)` | Muda opções |
| `cellAt(x, y)` | A célula da coluna x e linha y |
| `colorOf(valor)` | A cor de um valor no visualMap |
| `resetZoom()` | Volta à grelha toda |
| `on('hover' \| 'click' \| 'zoom', fn)` | Devolve a função para desligar; `zoom` recebe `{ x: [início, fim], y: [início, fim] }` em células |
| `resize()`, `screenshot()`, `destroy()` | |

Também exporta `HEATMAP_COLORS`, `heatmapDarkTheme` e `heatmapLightTheme`.
