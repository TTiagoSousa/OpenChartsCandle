# Barras · Referência da API

```ts
import { createBarChart } from 'openchartscandle/bar';
import 'openchartscandle/style.css';

const chart = createBarChart(document.getElementById('barras')!, {
  categories: ['T1', 'T2', 'T3', 'T4'],
  series: [
    { name: '2024', data: [118, 131, 139, 162] },
    { name: '2025', data: [131, 149, 158, 181] },
  ],
});
```

O contentor tem de ter **altura definida**. O gráfico ajusta-se quando o contentor muda de tamanho.

---

## Séries

```ts
interface BarSeries {
  name: string;
  data: (number | null | BarItem)[]; // um valor por categoria (null = sem barra)
  id?: string;               // chave estável (por defeito o name)
  color?: string;
  negativeColor?: string;    // cor dos valores negativos
  gradient?: string[];       // gradiente ao longo da barra, da ponta para a base
  borderColor?: string;
  borderWidth?: number;
  stack?: string;            // séries com o mesmo stack empilham juntas
  axis?: 'left' | 'right' | 'right2'; // eixo de valores
  background?: boolean | string;      // trilho atrás de cada barra
  silent?: boolean;          // série auxiliar: sem tooltip, legenda nem hover (ex.: base da cascata)
  marks?: { max?: boolean; min?: boolean; average?: boolean };
  hidden?: boolean;          // começa escondida
}

// estilo de uma barra só
interface BarItem { value: number | null; color?: string; gradient?: string[]; borderColor?: string; borderWidth?: number; opacity?: number; label?: string }
```

Valores positivos e negativos empilham em separado: um negativo nunca "come" uma barra positiva. Séries em eixos diferentes nunca empilham entre si.

---

## Opções

### Barras

| Opção | Por defeito | Descrição |
|---|---|---|
| `categories` | `1, 2, 3…` | Nomes das categorias |
| `orientation` | `'vertical'` | `'vertical'` (colunas) ou `'horizontal'` (barras deitadas) |
| `stacked` | `false` | `true` empilha; `'percent'` empilha em 100%. Com `stack` nas séries há várias pilhas lado a lado |
| `categoryGap` | `0.25` | Espaço vazio entre categorias (0–0.9 da largura) |
| `barGap` | `3` | Espaço entre barras da mesma categoria (px) |
| `maxBarWidth` | — | Espessura máxima das barras (px) |
| `radius` | `3` | Cantos arredondados na ponta da barra (px) |
| `sort` | `'none'` | `'asc'` ou `'desc'`: ordena as categorias pelo total. Quando a ordem muda, as barras deslizam para o novo lugar |
| `limit` | — | Mostra só as primeiras N categorias (depois de ordenar): corridas de barras "top 10" |
| `widthBy` | `'equal'` | `'total'`: cada categoria fica tão larga quanto o seu total (Mekko) |

### Cores e contentor

| Opção | Por defeito | Descrição |
|---|---|---|
| `colors` | paleta de 10 | Cores por ordem (`BAR_COLORS`) |
| `colorBy` | — | `(valor, categoria, série) => cor`, por exemplo verde/vermelho para P&L |
| `background` | do tema | `'transparent'` para usar dentro de cards |
| `theme` | `'dark'` | `'dark'`, `'light'` ou `BarTheme` parcial (`background`, `text`, `muted`, `grid`, `axis`, `hover`, `tooltipBg`, `tooltipText`, `tooltipBorder`, `font`) |
| `padding` | `8` | Margem à volta (px) |
| `emptyText` | `'Sem dados'` | Texto sem séries visíveis |

### Eixos

| Opção | Campos |
|---|---|
| `categoryAxis` | `show`, `title`, `format(categoria, índice)`, `grid`, `ticks` (`'center'` ou `'edge'`: marcas no eixo) |
| `valueAxis` | `show`, `title`, `format(v)`, `grid`, `min`, `max`, `ticks`, `breaks: [{ from, to }]` (corta intervalos do eixo, ex.: uma barra enorme) |
| `rightAxis` | Eixo da direita (em cima nas barras horizontais) para séries e linhas com `axis: 'right'` |
| `right2Axis` | Terceiro eixo, a seguir ao da direita, para `axis: 'right2'` |

Nomes de categorias que não cabem são saltados (colunas) ou cortados com "…" (barras horizontais).

### Valores nas barras — `labels`

| Campo | Por defeito | Descrição |
|---|---|---|
| `show` | `false` | |
| `position` | `'outside'` (empilhadas: `'center'`) | `'outside'`, `'inside'`, `'center'` ou `'base'` (dentro, junto à base) |
| `rotate` | `0` | Rotação em graus (ex.: `90` para texto vertical em colunas finas) |
| `format` | `valueFormatter` | `(v, datum) => string` |
| `color` | automático | Dentro das barras escolhe branco ou preto conforme a cor |
| `fontSize` | `11` | |

Etiquetas que não cabem dentro da barra não são desenhadas.

### Legenda, tooltip e referências

| Opção | Descrição |
|---|---|
| `legend` | `show`, `position` (`top`/`bottom`/`left`/`right`), `interactive`, `marker` (`square`/`circle`), `align`, `fontSize`. Com uma série só aparece se pedires `show: true` |
| `tooltip.mode` | `'shared'` (todas as séries da categoria, por defeito) ou `'single'` (só a barra) |
| `tooltip.total` | Mostrar o total da categoria (por defeito quando empilhado) |
| `tooltip.formatter` | `(ctx) => html`, com `ctx = { category, categoryIndex, items, total }` |
| `annotations` | `[{ value, label?, color?, dash? }]`: linhas de média, meta ou limite |
| `hoverDim` | Opacidade das outras séries quando uma está destacada (`0.3`) |
| `valueFormatter` | `(v, série) => string`, para o tooltip e as etiquetas |
| `animation` | `true`, `false` ou `{ duration, stagger }`. As barras crescem ao entrar e mudam suavemente ao atualizar; `stagger` atrasa cada categoria (ms), para aparecerem uma a uma. Os valores nas barras contam durante a animação |

### Médias e tendências — `overlays`

Linhas desenhadas por cima das barras, calculadas a partir de uma série (ou do total).

```ts
createBarChart(el, {
  categories: dias,
  series: [{ name: 'Volume', data: volumes }],
  overlays: [
    { type: 'sma', period: 7 },                  // média móvel simples de 7 barras
    { type: 'ema', period: 7 },                  // média móvel exponencial
    { type: 'exponential' },                     // tendência exponencial (+x%/período na legenda)
    { type: 'line', name: 'Meta', data: metas },  // valores próprios (por exemplo do backend)
  ],
});
```

| `type` | O que desenha |
|---|---|
| `'sma'` | Média móvel simples das últimas `period` barras |
| `'ema'` | Média móvel exponencial (α = 2 / (period + 1)), reage mais depressa |
| `'wma'` | Média móvel ponderada (as barras mais recentes pesam mais) |
| `'linear'` | Tendência linear (mínimos quadrados) |
| `'exponential'` | Tendência exponencial y = a·eᵇˣ; o nome mostra o crescimento por período |
| `'average'` | Linha horizontal na média |
| `'cumulative'` | Acumulado; com `percent: true` é a curva de Pareto (0–100%) |
| `'line'` | Os teus valores em `data`, um por categoria |

| Campo | Por defeito | Descrição |
|---|---|---|
| `source` | primeira série | Série usada no cálculo (id ou nome), ou `'total'` para a soma das séries visíveis |
| `period` | `3` | Janela das médias móveis |
| `percent` | `false` | Acumulado em % do total |
| `name` / `id` | automático | Nome na legenda e no tooltip; id para `toggle()` |
| `color`, `width`, `dash` | automático | Estilo (tendências e média tracejadas) |
| `smooth` | médias: `true` | Curva suave (monotónica, sem inventar picos) |
| `points` | `false` | Pontos em todas as categorias |
| `axis` | `'left'` (acumulado: `'right'`) | `'right'` usa uma segunda escala (à direita; em cima nas barras horizontais), configurada com `rightAxis: { show, title, format, min, max }` |
| `hidden` | `false` | Começa escondida |

Os cálculos seguem a ordem mostrada no ecrã (importante com `sort`, por exemplo no Pareto). As linhas aparecem na legenda (clicar esconde-as) e no tooltip partilhado (`ctx.overlays`). `chart.overlayValues` devolve os valores calculados e `chart.setOverlays([...])` troca as linhas.

Com `stacked: 'percent'`, usa `axis: 'right'` nas linhas (o eixo da esquerda está em %).

### Interação e modos especiais

| Opção | Descrição |
|---|---|
| `zoom` | Zoom nas categorias: roda do rato, arrastar para mover, duplo clique repõe. `{ slider: true, start, end }` acrescenta uma barra em baixo (colunas) |
| `brush` | Arrastar um retângulo seleciona barras (evento `brush`); as outras ficam esbatidas; um clique limpa |
| `polar` | Coordenadas polares: `{ categories: 'angle' }` (cada categoria é uma fatia e as barras crescem para fora) ou `{ categories: 'radius' }` (cada categoria é um anel e as barras dão a volta). `startAngle`/`endAngle` em graus (0 = topo), `innerRadius` (0–0.9), `roundCap` |
| `sparkline` | Preset de mini gráfico: sem eixos, grelha nem legenda |
| `graphic` | `(ctx, api) => void`: desenha por cima (marca de água, textos). `api.category(c)`, `api.value(v, eixo)`, `api.plot` |

### Helpers de dados

```ts
import { waterfall, colorScale, fromDataset } from 'openchartscandle/bar';

// cascata: base invisível + subidas + descidas
const w = waterfall([-1200, -300, 500], 2900);
series: [
  { name: 'Base', data: w.base, color: 'transparent', silent: true },
  { name: 'Sobe', data: w.up, color: '#089981' },
  { name: 'Desce', data: w.down, color: '#f23645' },
], stacked: true

// cor contínua por valor
colorBy: (v) => colorScale(0, 100, ['#65B581', '#FFCE34', '#FD665F'])(v)

// tabela (1.ª linha = cabeçalho) ou lista de objetos → categorias e séries
const { categories, series } = fromDataset(tabela, { seriesLayoutBy: 'row' });
```

---

## Métodos

| Método | Descrição |
|---|---|
| `setData(categorias, séries)` | Substitui os dados. Com a mesma forma faz uma transição suave |
| `setOptions(patch, animate = true)` | Muda opções depois de criado (incluindo `orientation` e `stacked`) |
| `setOverlays(linhas)` | Troca as médias e tendências |
| `overlayValues` | Valores calculados de cada linha (`{ id, name, color, values }`) |
| `updateSeries(id, patch)` | Muda uma série |
| `setValue(id, categoria, valor)` | Muda um valor (tempo real) |
| `setZoom(de, até)` / `resetZoom()` | Zoom nas categorias (índices ou nomes) |
| `select(itens \| null)` | Seleciona barras por código (`{ seriesIndex, categoryIndex }`) |
| `toggle(id, hidden?)` | Esconde ou mostra uma série |
| `highlight(id \| null)` | Destaca uma série |
| `series` | Séries atuais |
| `on(evento, fn)` | Devolve a função para cancelar |
| `screenshot()` | PNG (data URL) |
| `destroy()` | Remove o gráfico e os listeners |

## Eventos

| Evento | Recebe |
|---|---|
| `hover` | `{ category, categoryIndex, items, total, overlays } \| null` |
| `click` | `{ series, category, categoryIndex, value, color, percent }` |
| `toggle` | `{ id, hidden }` |
| `zoom` | `{ from, to } \| null` (posições das categorias) |
| `brush` | Lista das barras selecionadas (`BarDatum[]`) |

---

## Receitas

**P&L com verde e vermelho:**

```ts
createBarChart(el, {
  categories: meses,
  series: [{ name: 'P&L', data: pnl }],
  colorBy: (v) => (v >= 0 ? '#089981' : '#f23645'),
  labels: { show: true },
});
```

**Pareto:**

```ts
createBarChart(el, {
  categories: causas,
  series: [{ name: 'Perdas', data: perdas }],
  sort: 'desc',
  overlays: [{ type: 'cumulative', percent: true, points: true }],
});
```

**Ranking horizontal:**

```ts
createBarChart(el, {
  orientation: 'horizontal',
  categories: nomes,
  series: [{ name: 'Volume', data: volumes }],
  sort: 'desc',
  labels: { show: true },
});
```

**Mini gráfico (KPI) dentro de um card:**

```ts
createBarChart(el, {
  series: [{ name: 'Ordens', data: valores }],
  background: 'transparent',
  categoryAxis: { show: false },
  valueAxis: { show: false, grid: false },
  padding: 0,
});
```
