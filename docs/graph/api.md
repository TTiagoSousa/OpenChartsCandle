# Grafos · referência da API

```ts
import { createGraphChart } from 'openchartscandle/graph';
import 'openchartscandle/style.css';

const chart = createGraphChart(el, {
  nodes: [
    { id: 'a', name: 'Ana', category: 0, value: 12 },
    { id: 'b', name: 'Rui', category: 1, value: 5 },
    { id: 'c', name: 'Inês', category: 1, value: 8 },
  ],
  links: [
    { source: 'a', target: 'b' },
    { source: 'a', target: 'c', value: 3 },
  ],
  categories: ['Equipa A', 'Equipa B'],
  symbolSize: [10, 30],
  label: { show: true },
});
```

O elemento tem de ter altura (o grafo ocupa o espaço todo). Sem `layout`, os nós organizam-se com o layout de forças; se todos tiverem `x` e `y`, ficam nessas posições.

## Nós

| Campo | |
|---|---|
| `id` | Chave única (as ligações usam-na) |
| `name` | Texto da etiqueta e do tooltip (por omissão o `id`) |
| `value` | Valor: mostrado no tooltip e usado por `symbolSize: [min, max]` |
| `category` | Índice em `categories` ou o nome de uma categoria (nomes novos juntam-se à legenda) |
| `x`, `y` | Posição. Com `layout: 'none'` são unidades livres (o grafo ajusta-se à caixa, y para baixo); com `axes` são valores dos eixos (y para cima); com forças é o ponto de partida |
| `size` | Diâmetro em px (passa à frente de `symbolSize`) |
| `color`, `symbol` | Cor e símbolo próprios (por omissão os da categoria) |
| `fixed` | Layout de forças: fica parado em `x` / `y` |
| `label` | `true` / `false` para mostrar ou esconder esta etiqueta, ou opções próprias (como `label` em baixo) |

## Ligações

| Campo | |
|---|---|
| `source`, `target` | `id` dos nós |
| `value` | Valor no tooltip; com `force.edgeLength: [min, max]` um valor maior dá uma ligação mais curta |
| `color`, `width`, `dash` | Cor, espessura e tracejado próprios |
| `curveness` | Curva: `0` reta, `0.2` suave; negativo dobra para o outro lado. Duas ligações A→B e B→A com a mesma curva ficam uma de cada lado |
| `label` | Texto no meio da ligação (`true` = o valor) |

## Categorias e legenda

`categories` é uma lista de nomes ou de `{ name, color, symbol, hidden }`. A legenda mostra uma entrada por categoria; um clique esconde ou mostra os nós dessa categoria (e as suas ligações).

| Opção | |
|---|---|
| `colors` | Paleta das categorias (`GRAPH_COLORS`) |
| `legend` | `true`, `false` ou `{ position: 'top' \| 'bottom' \| 'left' \| 'right', interactive }`. Ligada quando há categorias |

## Layouts

| `layout` | |
|---|---|
| `'force'` | Simulação de forças: repulsão entre todos os nós (Barnes–Hut, rápida com milhares de nós), molas nas ligações, gravidade para o centro e arrefecimento animado. Ao arrastar um nó a rede volta a aquecer |
| `'circular'` | Nós num círculo, juntos por categoria |
| `'none'` | Nas posições `x` / `y` dadas, ajustadas à caixa sem deformar (`aspect`) |

### `force`

| Opção | | Por omissão |
|---|---|---|
| `repulsion` | Força com que os nós se afastam | `60` |
| `edgeLength` | Comprimento das molas: um número ou `[min, max]` pelo valor das ligações | `40` |
| `edgeStrength` | Multiplicador da força das molas | `1` |
| `gravity` | Atração para o centro | `0.08` |
| `friction` | Parte da velocidade perdida em cada passo (0–1) | `0.4` |
| `theta` | Precisão do Barnes–Hut (menor = mais exato e mais lento) | `0.9` |
| `collide` | Os nós não se sobrepõem: `true` ou a distância extra em px | desligado |
| `layoutAnimation` | `false` calcula tudo antes do primeiro desenho | `true` |
| `warmup` | Passos calculados antes do primeiro desenho | `0` |
| `alphaDecay` | Velocidade do arrefecimento (~300 passos) | `0.0228` |

Enquanto o layout se mexe o grafo vai-se ajustando à caixa; depois de um zoom, pan ou arrasto fica onde o puseste.

### `circular`

| Opção | | Por omissão |
|---|---|---|
| `rotateLabel` | Nomes ao longo do raio, por fora do círculo | `false` |
| `sort` | `'category'`, `'value'` ou `'none'` | `'category'` |
| `startAngle` | Ângulo do primeiro nó em graus (90 = em cima) | `90` |
| `clockwise` | Sentido dos ponteiros do relógio | `true` |
| `radius` | Raio em % de metade do lado menor | `75` (`65` com `rotateLabel`) |

## Nós, etiquetas e ligações

| Opção | |
|---|---|
| `symbol` | `'circle'`, `'rect'`, `'roundRect'`, `'triangle'`, `'diamond'` ou `'none'` |
| `symbolSize` | Diâmetro em px: um número (`10`), `[min, max]` pelo valor (escala raiz quadrada) ou `(node) => px` |
| `nodeStyle` | `{ borderColor, borderWidth, opacity }` (contorno de 1 px na cor do fundo) |
| `label` | `true` ou `{ show, position: 'right' \| 'left' \| 'top' \| 'bottom' \| 'inside', color, fontSize, fontWeight, format(node), halo, hideOverlap }`. `hideOverlap` esconde as etiquetas que se tapam, ficando as dos nós maiores. A etiqueta do nó com o rato aparece sempre |
| `edge` | `{ color: 'source' \| 'target' \| cor, width, opacity, curveness, arrow: true \| 'end' \| 'both', arrowSize, label }`. `label: true` mostra o valor no meio; ou `{ show, format(link), color, fontSize }` |
| `focus` | Ao passar o rato: `'adjacency'` (o nó, os vizinhos e as ligações), `'self'` ou `'none'` |
| `hoverDim` | Opacidade do resto durante o destaque (`0.12`) |
| `nodeScaleRatio` | Quanto os nós crescem com o zoom: `0` nunca, `1` como o mapa (`0.5`) |

## Interação

| Opção | | Por omissão |
|---|---|---|
| `draggable` | Arrastar nós | `true` (`false` com `axes`) |
| `roam` | Zoom com a roda do rato e pan a arrastar o fundo: `true`, `false`, `'zoom'` ou `'move'` | `true` |
| `scaleLimit` | Zoom mínimo e máximo | `[0.2, 12]` |

Um duplo clique no fundo volta à vista inicial.

## Eixos e coordenadas

Com `axes` os `x` / `y` dos nós são valores de dados em eixos numéricos (y para cima), com grelha e valores que acompanham o zoom e o pan:

```ts
createGraphChart(el, {
  nodes: [{ id: 'a', x: 1, y: 42 }, { id: 'b', x: 2, y: 58 }],
  links: [{ source: 'a', target: 'b' }],
  axes: { x: { min: 0, max: 13, name: 'Mês' }, y: { name: 'Valor' } },
});
```

Cada eixo aceita `{ min, max, type: 'value' | 'log', name, show, format(v), splitLine }`. Com `show: false` nos dois eixos fica só o sistema de coordenadas: é assim que se põe um grafo sobre um mapa, com longitude e latitude e `aspect: 1 / cos(latitude)`.

| Opção | |
|---|---|
| `aspect` | px por unidade de y ÷ px por unidade de x. Por omissão `1` com `layout: 'none'` (sem deformar) e livre com `axes` |
| `extent` | `layout: 'none'`: a caixa `[x0, y0, x1, y1]` a mostrar (por omissão a dos nós) |

## Desenho próprio

`underlay(ctx, api)` desenha por baixo das ligações (mapas, calendários…) e `graphic(ctx, api)` por cima de tudo. O `api` tem:

| | |
|---|---|
| `toPixel(x, y)` | Coordenadas dos nós (valores dos eixos com `axes`) → px, com o zoom e o pan |
| `fromPixel(x, y)` | O inverso |
| `nodePosition(id)` | Onde um nó está desenhado agora: `{ x, y, r }` em px, ou `null` se estiver escondido |
| `plot` | Área de desenho `{ x, y, w, h }` |
| `width`, `height`, `theme`, `zoom` | |
| `progress`, `time` | Progresso da animação de entrada (0–1) e `performance.now()` |

## Tooltip, tema e título

| Opção | |
|---|---|
| `tooltip` | `true`, `false` ou `{ formatter(info) }` |
| `valueFormatter` | `(v) => texto`, para o tooltip e as etiquetas das ligações |
| `title` | Texto ou `{ text, subtext, align }` |
| `theme` | `'dark'`, `'light'` ou um objeto com `background`, `text`, `muted`, `grid`, `edge`, `nodeBorder`, `tooltipBg`, `tooltipText`, `tooltipBorder`, `font` |
| `background` | Atalho para `theme.background`; `'transparent'` para cards |
| `padding` | Margem em px (10) |
| `animation` | `true`, `false` ou `{ duration }`: os nós crescem ao entrar e mudam de lugar com `setData` |

O tooltip e os eventos recebem `{ type: 'node' | 'link', index, name, value, color, node, link, source, target, category, degree }`.

## Métodos e eventos

| | |
|---|---|
| `setData({ nodes, links, categories }, animate?)` | Troca os dados. Os nós mantêm o lugar pelo `id`: com forças os novos nascem junto de um vizinho e o layout aquece um pouco; nos outros layouts os nós deslizam para o novo lugar |
| `setOptions(opções, animate?)` | Muda opções |
| `toggle(categoria, hidden?)` | Mostra / esconde uma categoria (pelo nome) |
| `reheat(alpha?)` | Volta a aquecer o layout de forças |
| `resetView()` | Tira o zoom e o pan |
| `nodePosition(id)` | Onde está um nó, nas coordenadas dos nós |
| `nodes`, `links` | Cópias dos dados (os nós com a posição atual) |
| `on('hover' \| 'click' \| 'toggle', fn)` | Devolve a função para desligar |
| `resize()`, `screenshot()`, `destroy()` | |

## Funções

| | |
|---|---|
| `graphForceLayout(nodes, links, { repulsion, edgeLength, gravity, friction, theta, iterations })` | Corre o layout de forças até ao fim e devolve `[{ x, y }]`. Útil para calcular uma vez grafos muito grandes e desenhá-los com `layout: 'none'` |
| `graphCircularLayout(nodes, { sort, startAngle, clockwise })` | Posições num círculo de raio 1 |
| `graphHideOverlaps(rects)` | Que retângulos ficam quando se escondem os que se sobrepõem (por ordem de importância) |

Também exporta `GRAPH_COLORS`, `graphDarkTheme` e `graphLightTheme`.
