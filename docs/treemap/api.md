# Treemap · Referência da API

```ts
import { createTreemap } from 'openchartscandle/treemap';
import 'openchartscandle/style.css';

const chart = createTreemap(document.getElementById('mapa')!, {
  data: [
    { name: 'Tecnologia', children: [{ name: 'AAPL', value: 3400 }, { name: 'MSFT', value: 3100 }] },
    { name: 'Energia', children: [{ name: 'XOM', value: 480 }, { name: 'CVX', value: 290 }] },
  ],
  upperLabel: true,
});

chart.setType('sunburst'); // cada retângulo transforma-se no seu setor
```

O contentor tem de ter **altura definida**. O gráfico ocupa todo o espaço.

---

## Dados — `TreeNode`

| Campo | Descrição |
|---|---|
| `name` | Nome (etiqueta, tooltip, caminho) |
| `value` | Número, ou várias dimensões: `[tamanho, 2011, crescimento]`. Nos pais é opcional: o tamanho é a soma dos filhos |
| `children` | Filhos |
| `id` | Identificador estável para as animações e para `zoomTo`. Por omissão é o caminho de nomes: `'src/bar/bar.ts'` |
| `color` | Cor fixa deste nó (os filhos herdam-na) |
| `data` | Qualquer coisa tua, devolvida em `info.node` |
| `itemStyle` | Aspeto só deste nó: `{ color, borderRadius, borderWidth, borderColor, opacity }` (ganha ao do nível) |
| `label` | Etiqueta só deste nó (`false` esconde-a; ganha à do nível), p. ex. `{ rotate: 45 }` |

Nós com tamanho 0 não aparecem. Nos pais, as dimensões que não forem dadas são a soma das dos filhos; as dadas ganham (útil para uma variação média, por exemplo).

`fromPaths([{ path: 'src/app/main.ts', value: 1200 }, …])` cria a árvore a partir de caminhos (ficheiros, categorias `'A/B/C'`…). `treeTotal(data)` devolve a soma.

---

## Opções

### Forma e tamanho

| Opção | Por defeito | Descrição |
|---|---|---|
| `type` | `'treemap'` | `'treemap'` (retângulos) ou `'sunburst'` (anéis) |
| `sizeDimension` | `0` | Que dimensão de `value` define a área |
| `sort` | `'desc'` | Ordem dos irmãos: `'desc'`, `'asc'` ou `false` (a dos dados) |
| `gap` | `1` (`2` no 1.º nível) | Espaço entre nós em px |
| `visibleMin` | `4` | Nós com área menor (px²) não são desenhados |
| `leafDepth` | — | Quantos níveis se veem de cada vez abaixo do nó atual. Clicar entra no nó |
| `sunburst` | — | Opções do sunburst (ver abaixo) |

### Sunburst — `sunburst`

| Campo | Por defeito | Descrição |
|---|---|---|
| `innerRadius` | `0.15` | Buraco ao centro: fração do raio, ou `'20%'` de metade do lado menor |
| `radius` | `0.95` | Raio de fora: fração de metade do lado menor, ou `'90%'` |
| `center` | o meio | `[x, y]` em px ou `'%'` da largura / altura |
| `gap` | `1` | Espaço entre setores (px) |
| `padAngle` | `0` | Ângulo extra entre irmãos (graus) |
| `borderRadius` | `0` | Cantos arredondados de todos os setores (px), ou `[dentro, fora]` |
| `labelRotate` | `'radial'` | `'radial'`, `'tangential'`, `'none'` ou graus (`0` = horizontal). `label.rotate` muda-o por nível ou por nó |
| `startAngle` | `0` | Graus, 0 = em cima, sentido horário |
| `centerLabel` | `true` | Total no buraco quando não há zoom |

Os anéis podem ter raios próprios em `levels[i].r0` / `levels[i].r` (px ou `'%'` de metade do lado menor). Contam-se a partir do centro tal como se veem (`levels[0]` é o primeiro anel, também depois de entrar num setor); os anéis sem raios repartem o espaço que sobra. Um anel fino por fora, com as etiquetas do lado de fora:

```ts
levels: [
  { r0: '12%', r: '34%', label: { rotate: 'tangential' } },
  { r0: '34%', r: '62%', label: { align: 'right' } },
  { r0: '62%', r: '65%', label: { position: 'outside' } },
]
```

Clicar num setor põe-no ao centro e clicar no centro sobe um nível (`drilldown: false` desliga, como o `nodeClick: false` do ECharts).

### Níveis — `levels`

`levels[0]` aplica-se aos nós de topo, `levels[1]` aos filhos destes, e assim por diante.

| Campo | Descrição |
|---|---|
| `gap` | Espaço entre os nós deste nível (px) |
| `borderWidth` | Moldura dentro dos nós deste nível, à volta dos filhos (px) |
| `borderColor` | Cor da moldura, dos espaços entre os filhos e do cabeçalho. Por omissão, a cor do nó escurecida |
| `color` | Lista de cores para os nós do nível (substitui a cor herdada) |
| `colorMappingBy` | `'value'` (gradiente pelo valor; por omissão quando há `color`), `'index'` (cores por ordem) ou `'id'` |
| `colorSaturation` | `[min, max]` (0–1): saturação diferente entre irmãos |
| `colorLightness` | `[min, max]` (0–1): luminosidade diferente entre irmãos |
| `colorAlpha` | `[min, max]` (0–1): transparência diferente entre irmãos |
| `visualDimension` | Que dimensão de `value` decide a cor (por omissão a do tamanho) |
| `visualMin` / `visualMax` | Limites da escala de cor (por omissão, o mínimo e o máximo dos irmãos) |
| `upperLabel` | Cabeçalho com o nome nos nós deste nível que mostram filhos |
| `label` | Etiquetas deste nível (`false` esconde-as) |
| `itemStyle` | Aspeto dos nós deste nível: `{ color, borderRadius, borderWidth, borderColor, opacity }`. `opacity` é só do preenchimento; o contorno e a etiqueta ficam opacos |
| `r0` / `r` | Sunburst: raio de dentro e de fora deste anel (px ou `'%'`) |

As cores: os nós de topo usam `colors` (ou `TREEMAP_COLORS`), os outros herdam a do pai, e depois cada nível aplica `color` e as variações. Para pintar pela variação (vermelho → verde), usa `CHANGE_COLORS`:

```ts
levels: [{ gap: 3 }, { color: CHANGE_COLORS, colorMappingBy: 'value', visualDimension: 1, visualMin: -3, visualMax: 3 }]
```

### Etiquetas

| Opção | Descrição |
|---|---|
| `label` | `false` ou `{ show, formatter(info), showValue, position, fontSize, fontWeight, color, rotate, minAngle, align, distance }` (ver abaixo). Por omissão, o nome no canto. `formatter` pode ter várias linhas (`'\n'`) |
| `upperLabel` | `true` ou `{ height: 20, formatter, color }`: faixa com o nome dos pais por cima dos filhos |
| `valueFormatter` | `(valor, dimensão) => string`, usado nas etiquetas, tooltip e centro do sunburst |
| `dimensions` | Nomes das dimensões de `value`, mostrados no tooltip: `['2012', '2011', 'Crescimento']` |

A cor do texto escolhe-se sozinha (escura em fundos claros, clara em fundos escuros).

A etiqueta junta-se por camadas: `label` global, depois `levels[i].label`, depois o `label` do nó.

| Campo | Descrição |
|---|---|
| `position` | Treemap: `'top-left'` (por omissão) ou `'center'`. Sunburst: `'inside'` (por omissão) ou `'outside'` (radial, logo a seguir à borda de fora; corta com `…` no limite do gráfico) |
| `rotate` | Sunburst: `'radial'`, `'tangential'`, `'none'` ou graus (sentido anti-horário). Radiais e tangenciais viram-se para nunca ficarem de pernas para o ar |
| `minAngle` | Sunburst: setores mais estreitos do que isto (graus) ficam sem etiqueta |
| `align` | Sunburst, texto radial: `'left'` encosta à borda de dentro, `'right'` à de fora |
| `distance` | Sunburst: px até à borda para `align` e `position: 'outside'` (por omissão 4) |
| `fontWeight` | `400`, `600`, `'bold'`… |

### Cor por valor — `visualMap`

Pinta cada nó pelo seu valor num gradiente contínuo e mostra uma barra de cores, com uma marca no valor do nó debaixo do rato. Ganha à paleta e às cores dos níveis; a cor própria de um nó (`color`, `itemStyle.color`) ganha-lhe.

| Campo | Descrição |
|---|---|
| `colors` | Gradiente do menor para o maior valor |
| `min` / `max` | Limites (por omissão, o menor e o maior de todos os nós) |
| `dimension` | Que dimensão de `value` (por omissão a do tamanho). Nos pais, dá o valor próprio quando a soma não faz sentido (p. ex. por pessoa) |
| `show` | Barra de cores (por omissão `true`) |
| `position` | `'left'` (por omissão), `'right'` ou `'bottom'` |
| `text` | Textos `[alto, baixo]` nas pontas (por omissão, o máximo e o mínimo formatados) |

```ts
visualMap: { colors: ['#2f93c8', '#aec48f', '#ffdb5c', '#f98862'], dimension: 1, min: 0, max: 16 }
```

### Destaque — `emphasis`

`emphasis: { focus, blurOpacity }`: ao passar o rato, o que fica aceso; o resto esbate-se para `blurOpacity` (por omissão `0.35`).

| `focus` | Fica aceso |
|---|---|
| `'relative'` | O nó, os antepassados e os descendentes (por omissão no sunburst) |
| `'ancestor'` | O nó e o caminho até ao centro |
| `'descendant'` | O nó e o que está por baixo dele |
| `'self'` | Só o nó |
| `'none'` | Tudo (por omissão no treemap) |

### Navegar

| Opção | Por defeito | Descrição |
|---|---|---|
| `drilldown` | `true` | Clicar num nó entra no seu ramo (no treemap, o ramo debaixo do nó atual; num cabeçalho, esse pai; no sunburst, o setor clicado; o centro sobe um nível) |
| `breadcrumb` | `true` | Caminho de volta: `false`, ou `{ position: 'top' \| 'bottom' }` |
| `rootName` | `'Total'` | Nome da raiz no caminho, tooltip e centro do sunburst |

### Aparência

| Opção | Descrição |
|---|---|
| `theme` | `'dark'` (por omissão), `'light'` ou um objeto parcial `TreemapTheme` (`background`, `text`, `muted`, `labelDark`, `labelLight`, `tooltipBg`, `tooltipText`, `tooltipBorder`, `font`) |
| `background` | Substitui o fundo do tema; `'transparent'` para cards |
| `colors` | Paleta dos nós de topo |
| `tooltip` | `false` ou `{ formatter(info) => html }` |
| `animation` | `false` ou `{ duration: 750 }` |

---

## Métodos

| Método | Descrição |
|---|---|
| `setData(data, animate?)` | Dados novos. Nós com o mesmo `id` deslizam para o novo lugar, os novos crescem, os que saem encolhem |
| `setOptions(patch, animate?)` | Muda opções (cores, níveis, `sizeDimension`…), com animação |
| `setType('treemap' \| 'sunburst', animate?)` | Troca a forma; cada nó transforma-se na nova |
| `zoomTo(id \| null)` | Entra num nó (`null` = tudo) |
| `zoomOut()` | Sobe um nível |
| `node(id)` | `TreemapNodeInfo` de um nó |
| `type` / `zoomed` | Forma atual e nó onde se está (`null` = tudo) |
| `on(evento, fn)` | Devolve uma função para desligar |
| `screenshot()` | PNG em data URL |
| `destroy()` | Remove o gráfico |

## Eventos

| Evento | Recebe |
|---|---|
| `'click'` | `TreemapNodeInfo` do nó clicado |
| `'hover'` | `TreemapNodeInfo` ou `null` |
| `'zoom'` | `TreemapNodeInfo` do novo nó atual, ou `null` ao voltar ao topo |

`TreemapNodeInfo`: `{ id, name, path, depth, value, values, percent, totalPercent, color, isLeaf, node }` — `percent` é a parte do pai e `totalPercent` a de tudo (0–1).

## Outras exportações

`squarify(valores, caixa)` (o algoritmo de layout), `gradientAt(cores, t)`, `mix(a, b, t)`, `TREEMAP_COLORS`, `CHANGE_COLORS`, `treemapDarkTheme`, `treemapLightTheme`.
