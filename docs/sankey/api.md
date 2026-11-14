# Sankey · referência da API

```ts
import { createSankeyChart } from 'openchartscandle/sankey';
import 'openchartscandle/style.css';

const chart = createSankeyChart(el, {
  nodes: [{ name: 'Salário' }, { name: 'Orçamento' }, { name: 'Casa' }, { name: 'Poupança' }],
  links: [
    { source: 'Salário', target: 'Orçamento', value: 2400 },
    { source: 'Orçamento', target: 'Casa', value: 900 },
    { source: 'Orçamento', target: 'Poupança', value: 1500 },
  ],
});
```

O elemento tem de ter altura (o sankey ocupa o espaço todo). Os nomes exportados começam por `Sankey…` / `sankey…` para não chocarem com as outras famílias.

## Nós e ligações

| Nó (`nodes`) | |
|---|---|
| `name` | Nome, único (as ligações apontam para ele) |
| `value` | Valor mínimo. Por omissão o valor é o maior entre o que entra e o que sai |
| `depth` | Coluna do nó (0 = a primeira), por cima da automática |
| `itemStyle` | `{ color, borderColor, borderWidth, borderRadius, opacity }` só deste nó |
| `label` | Etiqueta deste nó (junta-se à dos níveis e à do gráfico) |

| Ligação (`links`) | |
|---|---|
| `source`, `target` | Nome (ou índice em `nodes`) do nó de onde sai e do nó onde chega |
| `value` | Tamanho do fluxo (negativos contam como 0) |
| `lineStyle` | `{ color, opacity, curveness }` só desta ligação |

A altura de cada nó e a largura de cada ligação são proporcionais ao valor; a coluna mais cheia ocupa a altura toda.

### Ciclos

O sankey tem de ser um grafo sem ciclos. As ligações de um nó para ele próprio e as que fecham um ciclo (encontradas por uma pesquisa em profundidade pela ordem dos dados) **ficam de fora** do desenho: aparece um aviso na consola e `chart.getIgnoredLinks()` devolve-as (`{ index, source, target, reason: 'cycle' | 'self' }`). Um nome repetido em `nodes` ou uma ligação para um nó que não existe lançam um erro com a explicação.

## Layout

| Opção | | Por omissão |
|---|---|---|
| `orient` | `'horizontal'` (da esquerda para a direita) ou `'vertical'` (de cima para baixo) | `'horizontal'` |
| `nodeAlign` | `'justify'`, `'left'` ou `'right'` (ver abaixo) | `'justify'` |
| `nodeWidth` | Espessura dos nós em px | `20` |
| `nodeGap` | Espaço entre os nós de uma coluna em px (encolhe se não couber) | `8` |
| `layoutIterations` | Passagens de relaxação; `0` mantém a ordem dos dados | `32` |
| `draggable` | Arrastar os nós ao longo da coluna | `true` |
| `left`, `right`, `top`, `bottom` | Margens em px ou `'%'`; o espaço das etiquetas junta-se sozinho | 12 / 10 px |

Cada nó tem uma **profundidade** (o caminho mais longo desde uma fonte) e uma **altura** (o caminho mais longo até um destino). A coluna depende de `nodeAlign`:

- `'left'`: a profundidade. Os nós que acabam cedo ficam a meio.
- `'right'`: encostado ao fim, pela altura. Os nós que começam tarde ficam mais à direita.
- `'justify'`: como `'left'`, mas os nós sem saídas vão todos para a última coluna.

Depois de arrumar as colunas, o layout faz várias passagens (da direita para a esquerda e da esquerda para a direita) que puxam cada nó para o centro pesado dos vizinhos e afastam os que se tocam, como o d3-sankey, para as ligações se cruzarem o menos possível. As ligações de cada nó ficam empilhadas pela posição do outro extremo.

## Cores e estilos

| Opção | |
|---|---|
| `colors` | Paleta dos nós, uma cor por nó pela ordem dos dados (`SANKEY_COLORS`) |
| `itemStyle` | Estilo de todos os nós: `{ color, borderColor, borderWidth, borderRadius, opacity }` |
| `lineStyle` | Estilo de todas as ligações (ver abaixo) |
| `label` | Etiquetas de todos os nós (ver abaixo) |
| `levels` | Estilo por coluna: `[{ depth, itemStyle, lineStyle, label }]` |

O estilo de um nó junta, por esta ordem: `itemStyle` do gráfico → o nível da sua coluna → o `itemStyle` do nó. O de uma ligação: `lineStyle` do gráfico → o nível da coluna do nó de onde sai → o `lineStyle` da ligação.

| `lineStyle` | | Por omissão |
|---|---|---|
| `color` | `'source'` (cor do nó de onde sai), `'target'` (do nó onde chega), `'gradient'` (de uma à outra) ou uma cor CSS | `'source'` |
| `opacity` | 0–1 | `0.35` |
| `curveness` | 0–1 (0 = reta) | `0.5` |

```ts
createSankeyChart(el, {
  nodes,
  links,
  levels: [
    { depth: 0, lineStyle: { color: 'source', opacity: 0.45 } },
    { depth: 1, itemStyle: { color: '#2962ff' } },
    { depth: 4, label: { fontWeight: 600 } },
  ],
});
```

### Etiquetas

| Campo | | Por omissão |
|---|---|---|
| `show` | Mostrar | `true` |
| `position` | `'auto'`, `'left'`, `'right'`, `'top'`, `'bottom'` ou `'inside'` | `'auto'` |
| `formatter` | `(info) => texto`; `\n` parte em várias linhas | o nome |
| `color`, `fontSize`, `fontWeight` | | tema, 12, 400 |
| `distance` | Espaço entre o nó e o texto em px | `5` |

Em `'auto'` a etiqueta fica depois do nó, no sentido do fluxo: à direita (ou por baixo num sankey vertical); a margem para as etiquetas da última coluna é reservada sozinha (até 30% do gráfico). As etiquetas nunca saem do canvas e as que tapariam outras escondem-se (ganham as dos nós realçados e as dos nós maiores). `formatter` recebe a mesma `info` do tooltip, por isso dá para mostrar o valor: `` (n) => `${n.name}\n${n.value} €` ``.

## Interação e aparência

| Opção | |
|---|---|
| `emphasis` | Com o rato num nó ou numa ligação: `'adjacency'` (o nó, as suas ligações e os vizinhos), `'trajectory'` (todo o fluxo que passa por ali, para trás e para a frente), `'self'` ou `'none'`. Também aceita `{ focus }` (`'adjacency'`) |
| `tooltip` | `true`, `false` ou `{ formatter(info) }`. Por omissão: numa ligação `A → B` com o valor e a parte do que sai de A; num nó a entrada e a saída |
| `valueFormat` | `(v) => texto` para os valores do tooltip (número pt-PT) |
| `title` | Texto ou `{ text, subtext, align }` |
| `theme` | `'dark'`, `'light'` ou um objeto com `background`, `text`, `muted`, `nodeBorder`, `tooltipBg`, `tooltipText`, `tooltipBorder`, `font` |
| `background` | Atalho para `theme.background`; `'transparent'` para cards |
| `animation` | `true`, `false` ou `{ duration }` (700 ms): o fluxo entra no sentido do fluxo e, com dados ou opções novas, os nós deslizam para o novo lugar (os novos aparecem aos poucos) |

Os eventos e o tooltip recebem, num nó, `{ dataType: 'node', node, name, index, value, inValue, outValue, depth, color }` e, numa ligação, `{ dataType: 'link', link, index, source, target, value }`.

Arrastar um nó move-o ao longo da coluna e as ligações seguem-no (reordenadas pela nova posição). A posição fica guardada num `resize`; `resetLayout()` ou dados novos voltam ao layout automático.

## Métodos e eventos

| | |
|---|---|
| `setData({ nodes, links }, animate?)` | Troca os dados; os nós com o mesmo nome e as ligações entre os mesmos nós deslizam para o novo lugar |
| `setOptions(opções, animate?)` | Muda opções (alinhamento, cores, níveis…) com animação; mudar `orient` repete a entrada |
| `getIgnoredLinks()` | As ligações que ficaram de fora (ciclos e ligações para o próprio nó) |
| `resetLayout()` | Desfaz os nós arrastados à mão |
| `on('hover' \| 'click' \| 'drag', fn)` | Devolve a função para desligar. `hover` recebe `null` ao sair; `drag` recebe o nó no fim do arrasto |
| `resize()`, `screenshot()`, `destroy()` | |

Também exporta o layout sozinho, sem DOM: `sankeyLayout(nodes, links, { width, height, nodeWidth, nodeGap, nodeAlign, iterations })` devolve os nós (`x0`, `x1`, `y0`, `y1`, `layer`, `depth`, `height`, `value`, `inValue`, `outValue`, `sourceLinks`, `targetLinks`), as ligações (`width`, `y0`, `y1`) e as ignoradas, num referencial em que `x` segue o fluxo; `sankeyLinkBreadths(nodes)` volta a arrumar as ligações depois de mexer nos nós.

Ainda não há etiquetas nas ligações (`edgeLabel` do ECharts), zoom / pan nem nós arrastados na direção do fluxo.
