# Linhas · Referência da API

```ts
import { createLineChart } from 'openchartscandle/line';
import 'openchartscandle/style.css';

const chart = createLineChart(document.getElementById('linhas')!, {
  series: [
    { name: 'Bitcoin', data: [{ x: 1760000000, y: 64000 }, { x: 1760086400, y: 65200 } /* … */] },
    { name: 'Ether', data: [{ x: 1760000000, y: 3100 }, { x: 1760086400, y: 3180 }], axis: 'right' },
  ],
});
```

O contentor tem de ter **altura definida**. O gráfico ajusta-se quando o contentor muda de tamanho.

---

## Séries

```ts
interface LineSeries {
  name: string;
  data: { x: number | string; y: number | null }[] | (number | null)[];
  id?: string;                 // chave estável (por defeito o name)
  color?: string;
  width?: number;              // 2 (0 = sem linha, só a área)
  dash?: number[];             // [6, 4] = tracejado
  curve?: 'linear' | 'smooth' | 'step' | 'step-start' | 'step-middle' | 'step-end';
  sortByX?: boolean;           // false = mantém a ordem dos dados (percursos, x/y livres)
  draggable?: boolean | 'y' | 'xy'; // pontos arrastáveis (evento 'change')
  area?: boolean | { opacity?: number; gradient?: boolean | string[]; ranges?: [x, x][] };
  pieces?: { from: x; to: x; color: string }[];       // troços da linha com outra cor
  lineGradient?: { colors: string[]; by?: 'value' | 'x'; min?: number; max?: number };
  endLabel?: boolean | { format?: (nome, valor) => string; color?: string };
  marks?: { max?: boolean; min?: boolean; average?: boolean };
  points?: boolean | { size?: number; shape?: 'circle' | 'square' | 'diamond' | 'triangle'; hollow?: boolean; color?: string; borderColor?: string; borderWidth?: number };
  band?: { lower: (number | null)[]; upper: (number | null)[]; color?: string; opacity?: number }; // intervalo de confiança
  valuePieces?: { from?: number; to?: number; color: string }[];  // cor por nível de valor
  shadow?: boolean | { color?: string; blur?: number; offsetY?: number };
  axis?: 'left' | 'right';     // eixo Y
  hidden?: boolean;            // começa escondida
  labels?: boolean;            // valor por cima de cada ponto
}
```

**Tipos de eixo X**, detetados automaticamente (ou com `xType`):

| Dados | Tipo |
|---|---|
| `x` = timestamps (segundos ou milissegundos) | `'time'`: datas, horas, meses e anos formatados sozinhos |
| `x` = texto (`'Jan'`, `'Fev'`…) ou `data: [1, 2, 3]` com `categories` | `'category'` |
| `x` = números | `'number'` |

**Falhas:** um `y: null` parte a linha. Com `spanGaps: true` a linha liga por cima da falha.

**Destaques por série:**

| Opção | O que faz |
|---|---|
| `area.ranges` | Preenche a área só nesses intervalos de x (`[['2026-10-02', '2026-10-04']]`, ou índices de categoria) |
| `pieces` | Pinta troços da linha com outra cor, por exemplo as horas de pico a vermelho |
| `lineGradient` | A cor da linha muda pelo valor (`by: 'value'`, do mais baixo para o mais alto) ou ao longo do eixo X (`by: 'x'`) |
| `endLabel` | Nome da série (ou texto próprio) depois do último ponto; nomes que se tocariam afastam-se sozinhos |
| `marks` | Balões no valor mais alto (`max`) e mais baixo (`min`), e uma linha tracejada na média (`average`) |
| `band` | Faixa sombreada entre `lower` e `upper` (um valor por ponto), por exemplo um intervalo de confiança; o tooltip mostra o intervalo |
| `valuePieces` | Cor da linha por nível de valor (ex.: qualidade do ar boa, moderada, má); o tooltip usa a cor do nível |
| `shadow` | Sombra suave por baixo da linha |
| `points.color` / `borderColor` / `borderWidth` | Preenchimento e borda próprios dos pontos |

---

## Opções

### Para todas as séries

| Opção | Por defeito | Descrição |
|---|---|---|
| `curve` | `'linear'` | `'linear'`, `'smooth'` (monotónica, não inventa máximos/mínimos) ou `'step'` |
| `area` | `false` | Área sob as linhas: `true` ou `{ opacity, gradient }`. `gradient: ['#80FFA5', '#01BFEC']` usa as tuas cores (de cima para baixo) |
| `points` | `false` | Pontos em todas as linhas (no hover aparecem sempre) |
| `stacked` | `false` | `true` empilha as séries; `'percent'` empilha em 100%. Leva área por defeito; com `area: false` ficam só as linhas empilhadas |
| `spanGaps` | `false` | Ligar a linha por cima de valores `null` |
| `colors` | paleta de 10 | Cores por ordem (`LINE_COLORS`) |
| `categories` | — | Nomes do eixo X quando os dados são só números |
| `xType` | automático | `'time'`, `'category'` ou `'number'` |

### Contentor

| Opção | Por defeito | Descrição |
|---|---|---|
| `background` | do tema | `'transparent'` para usar dentro de cards |
| `padding` | `8` | Margem à volta (px) |
| `theme` | `'dark'` | `'dark'`, `'light'` ou `LineTheme` parcial (`background`, `text`, `muted`, `grid`, `axis`, `crosshair`, `tooltipBg`, `tooltipText`, `tooltipBorder`, `font`) |
| `emptyText` | `'Sem dados'` | Texto sem séries visíveis |

### Eixos — `xAxis`, `yAxis`, `y2Axis`

| Campo | Descrição |
|---|---|
| `show` | Mostrar o eixo (por defeito `true`) |
| `title` | Título junto ao eixo |
| `grid` | Linhas de grelha (X e Y esquerdo: `true`; Y direito: `false`) |
| `format` | Formatar as etiquetas: `(v) => string` (no X recebe `(x, categoria?)`) |
| `min` / `max` | Escala fixa (Y) |
| `beginAtZero` | Incluir o zero (Y) |
| `inverse` | Eixo Y ao contrário: o menor valor em cima (rankings, 1.º lugar no topo) |
| `log` | Escala logarítmica: `true` (base 10) ou a base, ex. `3`. Só valores positivos |

No `xAxis`, `min` / `max` fixam o intervalo do eixo X (números e tempo), e `breaks: [{ from, to }]` esconde intervalos de tempo (noite, almoço, fins de semana): não ocupam espaço e ficam marcados com um tracejado.
| `ticks` | Número aproximado de marcas |

O `y2Axis` (direito) só aparece quando há séries com `axis: 'right'`. Com zoom, o eixo Y ajusta-se à parte visível.

`xAxis.color` muda a cor das etiquetas do eixo X. `x2Axis: { categories, format, title, color }` acrescenta uma segunda fila de etiquetas por cima do gráfico, nas mesmas posições (ex.: os meses de outro ano); aparece também no cabeçalho do tooltip.

### Legenda — `legend`

| Campo | Por defeito | Descrição |
|---|---|---|
| `show` | `true` | |
| `position` | `'top'` | `'top'`, `'bottom'`, `'left'`, `'right'` |
| `interactive` | `true` | Clicar esconde/mostra a série; passar o rato destaca-a |
| `marker` | `'line'` | `'line'` (mostra o tracejado), `'circle'`, `'square'` |
| `align` | `'start'` | `'start'`, `'center'`, `'end'` |
| `fontSize` | `12` | |

### Tooltip e crosshair

| Opção | Descrição |
|---|---|
| `tooltip.show` | Mostrar o tooltip (por defeito `true`) |
| `tooltip.mode` | `'shared'` (todas as séries no x do cursor, por defeito) ou `'single'` (ponto mais próximo) |
| `tooltip.sort` | Ordenar as séries pelo valor |
| `tooltip.formatter` | `(ctx) => html`, com `ctx = { x, label, points: [{ series, y, color, … }] }` |
| `crosshair.show` | Linha vertical no cursor (por defeito `true`) |
| `crosshair.horizontal` | Também a linha horizontal |
| `crosshair.color` / `dash` | Estilo |
| `hoverDim` | Opacidade das outras séries quando uma está destacada (`0.25`) |
| `valueFormatter` | `(v, series) => string`, para o tooltip e as etiquetas |

### Anotações — `annotations`

```ts
annotations: {
  y: [{ value: 70000, label: 'Alvo', color: '#089981' }, { value: 0, axis: 'right', dash: [2, 3] }],
  x: [{ value: 1760000000, label: 'Halving', color: '#ff9800' }],
  bands: [{ from: 60000, to: 62000, label: 'Zona de compra', color: '#2962ff' }],
  xBands: [{ from: '07:30', to: '10:00', label: 'Pico da manhã', color: '#ff9800' }], // faixas verticais
  segments: [{ from: { x: 'Qua', y: 701 }, to: { x: 'Sáb', y: 1330 }, label: '+629' }], // segmento com seta
}
```

### Zoom, tempo real e animação

| Opção | Por defeito | Descrição |
|---|---|---|
| `zoom` | `false` | Roda do rato = zoom no X, arrastar = mover, duplo clique = repor. `{ slider: true, start: 0, end: 20 }` acrescenta uma barra em baixo com uma miniatura dos dados: arrastar a janela move, as pegas mudam o intervalo, clicar fora salta para lá. `start`/`end` em % dos dados |
| `maxPoints` | — | Com `appendPoint`, guarda só os últimos N pontos (janela deslizante) |
| `animation` | `true` | `false` ou `{ duration }`. Entrada da esquerda para a direita; transições suaves ao mudar os dados |

### Modos especiais

| Opção | Descrição |
|---|---|
| `sparkline` | Preset de mini gráfico: sem eixos, grelha, legenda nem crosshair, margem mínima (tabelas, KPIs) |
| `fisheye` | Lupa que alarga o eixo X à volta do rato: `true` ou `{ radius, strength }` |
| `polar` | Coordenadas polares: x é o ângulo (usa `xAxis.min/max`, ex. 0–360) e y o raio. `{ startAngle: 90, clockwise: true }` |
| `graphic` | `(ctx, api) => void`: desenha formas e texto por cima. `api.x(v)`, `api.y(v)`, `api.toData(px, py)`, `api.plot`, `api.theme` |

**Toque (telemóvel):** um dedo a arrastar mostra os valores; com `zoom`, dois dedos fazem zoom e a barra (`slider`) escolhe o intervalo.

---

## Métodos

| Método | Descrição |
|---|---|
| `setSeries(series)` | Substitui todas as séries. Mesmas séries com o mesmo tamanho fazem uma transição suave |
| `setOptions(patch, animate = true)` | Muda opções depois de criado |
| `updateSeries(id, patch)` | Muda uma série (dados, cor, área…) |
| `addSeries(series)` / `removeSeries(id)` | Acrescenta ou remove uma série |
| `appendPoint(id, point)` | Tempo real: acrescenta um ponto, ou substitui o último se o `x` for igual. O gráfico segue os dados novos |
| `toggle(id, hidden?)` | Esconde/mostra uma série |
| `highlight(id \| null)` | Destaca uma série (as outras ficam esbatidas) |
| `setZoom(de, até)` / `resetZoom()` | Zoom programático no eixo X (um intervalo igual ao atual não emite evento, para poderes ligar dois gráficos sem ciclos) |
| `showHover(x \| null, tooltip = true)` | Mostra a linha vertical e o tooltip em x, como se o rato lá estivesse. Para ligar gráficos: `a.on('hover', (c) => b.showHover(c?.x ?? null))` |
| `series` | Séries atuais |
| `toData(px, py)` / `toPixel(x, y)` | Converte entre píxeis (relativos ao gráfico) e valores |
| `on(evento, fn)` | Devolve a função para cancelar |
| `screenshot()` | PNG (data URL) |
| `destroy()` | Remove o gráfico e os listeners |

## Eventos

| Evento | Recebe |
|---|---|
| `hover` | `{ x, label, points } \| null` |
| `click` | `{ x, label, points }` |
| `toggle` | `{ id, hidden }` |
| `zoom` | `{ from, to } \| null` (null = zoom reposto) |
| `plotclick` | `{ x, y, px, py }`: qualquer clique dentro do gráfico, com os valores debaixo do rato |
| `change` | `{ series, index, x, y }`: um ponto foi arrastado (`draggable`) |

---

## Receitas

**Mini gráfico (KPI) dentro de um card:**

```ts
createLineChart(el, {
  series: [{ name: 'Receita', data: valores, area: true }],
  background: 'transparent',
  curve: 'smooth',
  legend: { show: false },
  xAxis: { show: false, grid: false },
  yAxis: { show: false, grid: false },
  crosshair: { show: false },
  padding: 0,
});
```

**Comparar ativos em %:**

```ts
const rebase = (pts) => pts.map((p) => ({ x: p.x, y: (p.y / pts[0].y - 1) * 100 }));
createLineChart(el, {
  series: ativos.map((a) => ({ name: a.nome, data: rebase(a.precos) })),
  yAxis: { format: (v) => `${v.toFixed(0)}%` },
  tooltip: { sort: true },
  annotations: { y: [{ value: 0, color: '#787b86', dash: [2, 3] }] },
});
```

**Tempo real a partir de um WebSocket:**

```ts
const chart = createLineChart(el, { series: [{ name: 'Preço', data: [] }], maxPoints: 500, animation: false });
ws.onmessage = (e) => {
  const { time, price } = JSON.parse(e.data);
  chart.appendPoint('Preço', { x: time, y: price });
};
```
