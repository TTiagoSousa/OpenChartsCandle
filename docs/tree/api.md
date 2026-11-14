# Árvores · referência da API

```ts
import { createTreeChart } from 'openchartscandle/tree';
import 'openchartscandle/style.css';

const chart = createTreeChart(el, {
  data: {
    name: 'Mercados',
    children: [
      { name: 'Ações', children: [{ name: 'Apple', value: 3400 }, { name: 'Nvidia', value: 3300 }] },
      { name: 'Cripto', children: [{ name: 'Bitcoin' }, { name: 'Ethereum' }] },
    ],
  },
  orient: 'LR',
});
```

O elemento tem de ter altura (a árvore ocupa o espaço todo). Os nomes dos tipos começam por `TreeChart…` (`TreeChartNode`, `TreeChartOptions`…) para não chocarem com o `TreeNode` do treemap.

## Nós (data)

| Campo | |
|---|---|
| `name` | Nome (etiqueta e tooltip) |
| `value` | Número ou texto, mostrado no tooltip |
| `children` | Os filhos |
| `collapsed` | Começa fechado (abre com um click) |
| `color` | Cor do símbolo deste nó |
| `symbol`, `symbolSize` | Símbolo e tamanho só deste nó |
| `lineColor` | Cor da ligação que chega a este nó |
| `label` | Etiqueta deste nó (junta-se à da árvore) |

## A árvore

Estas opções vão no topo, ou em cada árvore de `trees`.

| Opção | | Por omissão |
|---|---|---|
| `layout` | `'orthogonal'` ou `'radial'` (a raiz no centro, um anel por nível) | `'orthogonal'` |
| `orient` | `'LR'` (esquerda → direita), `'RL'`, `'TB'` (cima → baixo) ou `'BT'` | `'LR'` |
| `edgeShape` | `'curve'` ou `'polyline'` (em cotovelo, como num organigrama) | `'curve'` |
| `edge` | `{ color, width, curveness (0–1), dash }` | tema, 1.5, 0.5 |
| `symbol` | `'emptyCircle'`, `'circle'`, `'rect'`, `'roundRect'`, `'diamond'`, `'triangle'` ou `'none'` | `'emptyCircle'` |
| `symbolSize` | Tamanho em px | `7` |
| `color` | Cor dos símbolos | a paleta, uma cor por árvore |
| `label` | Etiquetas (ver abaixo) | ligadas |
| `leaves` | `{ label }`: etiquetas só das folhas, por cima de `label` | |
| `initialDepth` | Níveis abertos no início (0 = só a raiz) | todos |
| `expandAndCollapse` | Click num nó abre-o ou fecha-o | `true` |
| `left`, `right`, `top`, `bottom` | Espaço da árvore no gráfico, em px ou `'%'`, com as etiquetas lá dentro | 10 px |

Com `emptyCircle`, os nós abertos e as folhas são ocos e os nós fechados com filhos são cheios; com os outros símbolos os fechados têm um anel à volta.

A árvore é arrumada (Reingold–Tilford): cada pai fica ao centro dos filhos, as subárvores ficam o mais juntas possível sem se cruzarem e os primos ficam o dobro da distância dos irmãos. Ao abrir ou fechar, a árvore volta a ocupar o espaço todo, com animação.

### Etiquetas

| Campo | | Por omissão |
|---|---|---|
| `show` | Mostrar | `true` |
| `format` | `(node) => texto` | o nome |
| `color`, `fontSize`, `fontWeight` | | tema, 12, 400 |
| `position` | `'auto'`, `'left'`, `'right'`, `'top'`, `'bottom'` ou `'inside'` | `'auto'` |
| `rotate` | Graus (no sentido dos ponteiros) ou `'auto'` | `'auto'` |
| `distance` | Espaço entre o símbolo e o texto em px | `6` |
| `background` | Caixa por trás do texto | |

Em `'auto'`, os nós com filhos têm o nome do lado da raiz e as folhas do outro lado. Nas árvores `TB` e `BT` o texto roda e segue a profundidade; na radial segue o raio e nunca fica de pernas para o ar. As etiquetas que tapariam outras escondem-se (as dos níveis de cima e as do caminho realçado ganham). A margem para as etiquetas da raiz e das folhas é calculada sozinha.

### Várias árvores

```ts
createTreeChart(el, {
  trees: [
    { name: 'Ações', data: acoes, left: '1%', right: '50%' },
    { name: 'Cripto', data: cripto, left: '52%', right: '1%', symbol: 'diamond' },
  ],
});
```

As opções do topo servem de base para todas; a legenda aparece com mais de uma árvore e esconde-as com um click.

## Interação e aparência

| Opção | |
|---|---|
| `emphasis` | Com o rato num nó: `'ancestor'` realça o caminho até à raiz, `'descendant'` a subárvore, `'none'` nada (`'ancestor'`) |
| `roam` | Zoom com a roda do rato e arrastar para mover (`false`) |
| `tooltip` | `true`, `false` ou `{ formatter(info) }`. Por omissão: o caminho, o nome, o valor e quantos filhos tem |
| `legend` | `true`, `false` ou `{ position: 'top' \| 'bottom', interactive }` |
| `colors` | Paleta, uma cor por árvore (`TREE_COLORS`) |
| `title` | Texto ou `{ text, subtext, align }` |
| `theme` | `'dark'`, `'light'` ou um objeto com `background`, `text`, `muted`, `edge`, `symbolFill`, `tooltipBg`, `tooltipText`, `tooltipBorder`, `font` |
| `background` | Atalho para `theme.background`; `'transparent'` para cards |
| `animation` | `true`, `false` ou `{ duration }` (600 ms): a árvore cresce da raiz e os nós saem do pai ao abrir e voltam a ele ao fechar |

O tooltip e os eventos `hover` e `click` recebem `{ node, name, value, path, depth, treeIndex, hasChildren, collapsed }`.

## Métodos e eventos

| | |
|---|---|
| `setData(data \| trees, animate?)` | Troca os dados; os nós com o mesmo caminho de nomes mantêm o lugar e se estão abertos |
| `setOptions(opções, animate?)` | Muda opções (orientação, layout…) com animação |
| `setCollapsed(nó \| caminho, fechado, treeIndex?)` | Abre ou fecha um nó, dado como o objeto dos dados ou `['Mercados', 'Ações']` |
| `expandAll(depth?)` | Abre tudo (ou só até `depth`) |
| `collapseAll(depth?)` | Fecha a partir de `depth` (1: só a raiz e os filhos) |
| `toggle(nome \| índice, hidden?)` | Mostra / esconde uma árvore |
| `resetView()` | Tira o zoom e o pan |
| `on('hover' \| 'click' \| 'toggle' \| 'collapse', fn)` | Devolve a função para desligar. `collapse` recebe `{ node, collapsed }` |
| `resize()`, `screenshot()`, `destroy()` | |

Também exporta `treeTidyLayout(root)`, o layout sozinho: devolve a posição de cada nó (`x` em unidades de separação e `depth`).
