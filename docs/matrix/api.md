# Matrizes · referência da API

```ts
import { createMatrixChart } from 'openchartscandle/matrix';
import 'openchartscandle/style.css';

const chart = createMatrixChart(el, {
  x: { data: [{ value: '2025', children: ['T1', 'T2'] }, { value: '2026', children: ['T1', 'T2'] }] },
  y: { data: ['Norte', 'Centro', 'Sul'] },
  data: [
    [120, 134, 141, 158],
    [88, 91, 97, 104],
    [210, 225, 248, 262],
  ],
  visualMap: { min: 80, max: 270 },
});
```

O elemento tem de ter altura (a matriz ocupa o espaço todo). Os nomes começam por `Matrix…` / `createMatrixChart` para não chocarem com o `ScatterMatrix` da família scatter.

A matriz é uma grelha: as colunas vêm de `x`, as linhas de `y`, e cada célula do corpo pode ter um valor, uma cor, um desenho próprio em canvas ou um gráfico inteiro de outra família.

## Dimensões (x e y)

| Opção | | Por omissão |
|---|---|---|
| `data` | Árvore de cabeçalhos (ver abaixo) ou um número de colunas / linhas sem nome | |
| `show` | Mostrar o cabeçalho | `true` (`false` quando `data` é um número) |
| `cellSize` | Tamanho de cada coluna / linha: um valor ou um por folha. Px (`40`), peso (`'2fr'`), parte do espaço (`'25%'`) ou `'auto'` (= `'1fr'`) | `'1fr'` |
| `minCellSize` | Mínimo em px das colunas / linhas com peso | `0` |
| `levelSize` | Espessura de cada nível do cabeçalho em px (altura em x, largura em y): um valor ou um por nível | automática (pelo texto) |
| `levels` | `[{ size, itemStyle, label }]`, um por nível (0 = o de fora) | |
| `itemStyle`, `label` | Aspeto de todas as células do cabeçalho | |

Primeiro tiram-se os tamanhos fixos e o resto divide-se pelos pesos. Se os fixos não couberem, encolhem todos na mesma proporção.

### Cabeçalhos com vários níveis

Cada item é um texto, um número ou `{ value, children, size, color, itemStyle, label, data }`. Um pai ocupa todas as suas folhas; uma folha num nível de cima desce até ao fundo do cabeçalho.

```ts
x: {
  data: [
    { value: '2025', children: [{ value: 'T1', children: ['Jan', 'Fev', 'Mar'] }, 'T2'] },
    'Total',
  ],
}
```

## Células (data)

`data` é uma lista de células ou, mais simples, os valores por linha: `data[y][x]` (`null` = vazia).

| Campo | |
|---|---|
| `coord` | `[x, y]`. Cada parte é o índice da folha, o nome de um cabeçalho (um pai ocupa as folhas dele; `'2025/T1'` para um caminho) ou um intervalo `[de, até]` |
| `value` | Número (pintado pelo `visualMap`), texto, ou qualquer coisa para `renderCell` / `mount` |
| `text` | Texto fixo (passa à frente do formatter) |
| `colSpan`, `rowSpan` | Unir para a direita / para baixo |
| `color`, `itemStyle` | Fundo e aspeto só desta célula (o visualMap não a repinta) |
| `label` | Etiqueta só desta célula |
| `hidden` | Não se desenha (um buraco) |
| `silent` | Sem rato, tooltip nem click |
| `render`, `mount` | Desenho próprio ou elemento embutido só desta célula (`mount: null` desliga o da matriz) |
| `id` | Chave estável (por omissão vem da posição); os elementos embutidos com o mesmo `id` não são recriados |
| `data` | O que quiseres; volta em `cell.data.data` |

Células unidas (um intervalo, um pai ou `colSpan` / `rowSpan`) ganham às simples; entre iguais ganha a última e a que fica por baixo desaparece.

### Aspeto das células

| Opção | | Por omissão |
|---|---|---|
| `itemStyle` | `{ color, borderColor, borderWidth, radius, opacity }` para todas as células do corpo | linhas de 1 px no tema |
| `label` | `{ show, formatter(cell), color, fontSize, fontWeight, align, verticalAlign, padding }`. Sem `color`, escolhe-se branco ou escuro para se ler no fundo | o valor |
| `gap` | Espaço entre células em px; com espaço não há linhas e os cantos ficam redondos (3 px) | `0` |
| `cellAspect` | Largura / altura fixa das células (1 = quadradas); a matriz fica ao centro | |
| `emptyCells` | `'show'` (células vazias com borda) ou `'hide'` | `'show'` |
| `corner` | Célula do canto: `{ text, color, itemStyle, label }` | |
| `padding` | Espaço à volta, px ou `[cima, direita, baixo, esquerda]` | `8` |
| `valueFormatter` | `(v) => texto` para os números | `pt-PT`, até 2 casas |

Textos que não cabem encolhem até 7 px e depois são cortados com `…`; numa célula pequena demais não se escrevem.

## visualMap

| Campo | | Por omissão |
|---|---|---|
| `min`, `max` | Intervalo das cores | o dos dados |
| `colors` | Gradiente, do mais baixo ao mais alto | azul → claro → vermelho (`MATRIX_VISUAL_COLORS`) |
| `pieces` | Por peças: `[{ min, max, color, label }]` (de `min` incluído a `max` excluído) ou categorias `[{ value, color, label }]` (número ou texto) | |
| `dimension` | `(cell) => número \| texto \| null`: o que se pinta | o valor |
| `show`, `position` | Barra de cores / legenda à direita (`'right'`) ou por baixo (`'bottom'`) | `true`, `'right'` |
| `text` | Textos das pontas da barra `[alto, baixo]` | `max` e `min` |
| `formatter` | Números da barra e das peças | |
| `outOfRange` | Cor fora das peças / do intervalo | sem cor |

Com peças, um click na legenda apaga as células dessa peça (`togglePiece(i)`).

## Desenho próprio: renderCell

```ts
renderCell: (ctx, rect, cell, api) => {
  drawSparkline(ctx, rect, cell.value as number[]);
},
label: { show: false },
```

Corre para cada célula do corpo (ou só numa, com `cell.render`) já recortado à célula, depois do fundo e antes do texto. É canvas puro: aguenta milhares de células. `api.progress` vai de 0 a 1 durante a animação de entrada.

## Gráficos nas células: mount

```ts
import { createPieChart } from 'openchartscandle/pie';

mount: (el, cell) => {
  const pie = createPieChart(el, { data: cell.value as PieDatum[], background: 'transparent', legend: { show: false } });
  return () => pie.destroy();
},
mountPadding: 4,
```

Para cada célula a matriz cria um `div` (`.mx-cell-host`) posto por cima dela, com o tamanho dela menos `mountPadding` (2 px), e chama `mount`. Qualquer família (ou HTML teu) cabe lá dentro. A função devolvida é chamada quando a célula desaparece, os dados mudam ou a matriz é destruída. Quando o tamanho ou as regras `media` mudam, os elementos só mudam de sítio (com transição); são recriados quando muda o `id`, o `mount`, o `value` ou o `data` da célula.

## Por cima de tudo: graphic

```ts
graphic: (ctx, api) => {
  const a = api.cellRect('Ideia', 'Quant');
  const b = api.cellRect('Backtest', 'Risco');
  // … uma seta de a para b
},
```

`api` tem `cellRect(x, y)` (por nomes, índices ou intervalos), `column(i)`, `row(i)`, `body`, `width`, `height`, `theme`, `hover` (a célula debaixo do rato), `progress`, `cells` e `colorOf(valor)` (a cor do visualMap). Com `graphic`, o desenho repete-se quando o rato muda de célula.

## Responsivo: media

```ts
media: [
  { query: { maxWidth: 620 }, option: { x: { data: 2, show: false }, data: duasColunas } },
  { query: { maxWidth: 250 }, option: { x: { data: 1, show: false }, data: umaColuna } },
],
```

`query` aceita `minWidth`, `maxWidth`, `minHeight`, `maxHeight`, `minAspectRatio`, `maxAspectRatio` (do elemento da matriz). As regras que servem juntam-se por cima das opções, pela ordem, e o evento `'media'` diz quais estão ativas. Com `id` nas células e `mount`, faz-se um dashboard que passa de 3 colunas para 2 e para 1 sem recriar os gráficos.

## Interação e aparência

| Opção | | Por omissão |
|---|---|---|
| `emphasis` | Realce debaixo do rato: `'cross'` (linha e coluna), `'row'`, `'column'`, `'cell'` ou `false`. Num cabeçalho acende a linha / coluna dele | `'cross'` |
| `select` | `true` / `'single'` ou `'multiple'`: um click seleciona a célula; num cabeçalho, a linha ou a coluna toda | `false` |
| `tooltip` | `true`, `false` ou `{ formatter(cell), headers }` (`headers: true` também nos cabeçalhos). As células com `mount` não têm tooltip da matriz | `true` |
| `title` | Texto ou `{ text, subtext, align }` | |
| `theme` | `'dark'`, `'light'` ou um objeto com `background`, `text`, `muted`, `border`, `cellBg`, `headerBg`, `headerText`, `cornerBg`, `hover`, `select`, `tooltipBg`, `tooltipText`, `tooltipBorder`, `font` | `'dark'` |
| `background` | Atalho para `theme.background`; `'transparent'` para cards (cabeçalhos e linhas ficam translúcidos) | |
| `animation` | `true`, `false` ou `{ duration, stagger }`: as células aparecem e crescem da esquerda-cima para a direita-baixo | 600 ms |

O tooltip, os desenhos e os eventos recebem a célula: `{ kind ('body' \| 'x' \| 'y' \| 'corner'), id, x, y, xSpan, ySpan, xName, yName, xPath, yPath, value, text, color, level, rect, data }`.

## Métodos e eventos

| | |
|---|---|
| `setData(células \| valores, animate?)` | Troca as células |
| `setOptions(opções, animate?)` | Muda opções (junta-se às de antes) |
| `getOptions()` | As opções em uso (depois das regras `media`) |
| `getCell(x, y)`, `getCells()` | Uma célula por coordenadas / todas |
| `cellRect(x, y)` | Retângulo de uma célula ou intervalo, em px |
| `getSelection()`, `setSelection([[x, y], …])`, `clearSelection()` | Seleção |
| `togglePiece(i, hidden?)` | Mostra / apaga uma peça do visualMap |
| `refresh()` | Volta a desenhar (estado usado em `renderCell` / `graphic` mudou) |
| `on('hover' \| 'click' \| 'select' \| 'media', fn)` | Devolve a função para desligar |
| `resize()`, `screenshot()`, `destroy()` | `screenshot()` inclui os canvas dos gráficos embutidos |

Também exporta a geometria sozinha: `matrixHeader`, `matrixSizes`, `matrixOffsets`, `matrixIndexAt`, `matrixResolve`, `matrixPlace`, `matrixGridCells`, `matrixMedia`, e `MATRIX_COLORS`, `MATRIX_VISUAL_COLORS`, `matrixDarkTheme`, `matrixLightTheme`.
