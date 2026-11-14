# Calendário · referência da API

```ts
import { createCalendarChart } from 'openchartscandle/calendar';
import 'openchartscandle/style.css';

const chart = createCalendarChart(el, {
  range: 2026,
  data: [['2026-01-05', 12], ['2026-01-06', 30]],          // ou { date, value }
  visualMap: { min: 0, max: 40, title: 'Commits' },
});
chart.on('click', (dia) => console.log(dia.key, dia.value));
```

O elemento tem de ter altura (o calendário ocupa o espaço todo).

## O que mostra

| Opção | Valores | Por omissão |
|---|---|---|
| `range` | `2026` (um ano), `'2026-10'` (um mês), `['2026-01-01', '2026-06-30']` (um intervalo), ou uma lista: `[2024, 2025, 2026]` dá um calendário por ano | o ano atual |
| `orient` | `'horizontal'`: uma coluna por semana, como o GitHub. `'vertical'`: uma linha por semana, como um calendário de parede | `'horizontal'` |
| `firstDay` | `1` = segunda, `0` = domingo | `1` |
| `cellSize` | `'auto'` (enche o espaço), um número (quadrado) ou `[largura, altura]` em px | `'auto'` |
| `gap` | Espaço entre calendários, px | `28` |

Com vários calendários, na horizontal ficam um por baixo do outro e na vertical lado a lado.

## Dados

`data` é uma lista de dias: `[data, valor]` ou objetos.

```ts
data: [
  { date: '2026-04-25', value: 80, label: 'Dia da Liberdade', color: '#f23645' },
  ['2026-04-26', 12],
]
```

- `date`: `'YYYY-MM-DD'`, `Date` ou timestamp (segundos ou ms).
- `value`: número, ou `null` (dia vazio).
- `color`: cor própria do dia, por cima da do visualMap.
- `label`: texto extra para as etiquetas e o tooltip.
- Qualquer outro campo fica em `cell.datum` (para `renderCell` e o tooltip).

`setData(data)` troca os dados.

## Como se desenha um valor

| `type` | |
|---|---|
| `'heatmap'` | Pinta o dia com a cor do valor (por omissão) |
| `'scatter'` | Um círculo do tamanho do valor; `symbolSize: [0.15, 0.95]` é o raio do menor e do maior (fração de meia célula), `color` a cor sem visualMap, `effect: { top: 12 }` faz pulsar os maiores |
| `'none'` | Só a grelha (para etiquetas e `renderCell`); `color` de um dia continua a pintá-lo |

### visualMap

```ts
visualMap: { min: 0, max: 1000, colors: ['#0e2a47', '#2962ff', '#7fb2ff'], title: 'Passos', position: 'bottom' }
visualMap: {
  pieces: [
    { max: 200, color: '#1b3a2b', label: '< 200' },
    { min: 200, max: 600, color: '#26a641' },
    { min: 600, color: '#39d353' },
  ],
}
```

- Contínuo: as cores de `colors` (do menor para o maior), entre `min` e `max` (por omissão os dos dados).
- `pieces`: intervalos `[min, max[` ou um `value` exato. Na legenda, um clique num intervalo esconde os seus dias.
- `position`: `'bottom'`, `'top'` ou `'right'`. `show: false` usa as cores sem a legenda. `format` formata os números.
- Sem `visualMap` as cores usam `CALENDAR_COLORS` e não há legenda; `visualMap: false` desliga as cores.

## Aparência

| Opção | |
|---|---|
| `cell` | `{ color, borderColor, borderWidth, radius, gap }`: dia vazio, linhas entre dias, cantos e espaço entre células |
| `splitLine` | Linha à volta de cada mês: `true`, `false` ou `{ color, width }` |
| `dayLabel` | Dias da semana: `true`, `false` ou `{ names, color }` (por omissão Seg, Ter…) |
| `monthLabel` | Meses: `true`, `false` ou `{ names, color }` |
| `yearLabel` | Ano de cada calendário: ligado quando há mais de um |
| `label` | Texto nos dias: `true` mostra o dia do mês. `{ format, position, color, fontSize }`: `format(cell)` devolve um texto ou várias linhas, `position` é `'center'`, `'top-left'` ou `'top'` |
| `title` | Texto ou `{ text, subtext, align }` |
| `theme` | `'dark'`, `'light'` ou um objeto com `background`, `text`, `muted`, `cell`, `cellBorder`, `splitLine`, `tooltipBg`, `tooltipText`, `tooltipBorder`, `font` |
| `background` | Atalho para `theme.background`; `'transparent'` para cards |
| `padding` | Margem em px (10) |
| `animation` | Entrada animada (`true`), `false`, ou `{ duration }` |

## Desenho próprio

`renderCell(ctx, cell, api)` desenha dentro de cada dia, depois da cor e antes da etiqueta: pizzas, ícones, barras.
`graphic(ctx, api)` desenha por cima de tudo: ligações entre dias, notas.

```ts
renderCell: (ctx, c, api) => {
  if (c.value === null) return;
  ctx.fillStyle = '#2962ff';
  ctx.fillRect(c.x + 6, c.y + c.h - 9, (c.w - 12) * (c.value / 100) * api.progress, 4);
},
```

`cell` tem `key` (`'YYYY-MM-DD'`), `date`, `weekday` (0 = primeiro dia da semana), `week`, `calendar`, `value`, `datum`, `color` e a caixa `x`, `y`, `w`, `h` em px.

`api` tem `width`, `height`, `theme`, `cell(data)` (a caixa de um dia ou `null`), `cells`, `colorOf(valor)`, `progress` (0 a 1 durante a entrada) e `time`. Com `animate: true` o gráfico redesenha a cada frame, para animações próprias.

## Tooltip e eventos

- `tooltip`: `true` (data e valor), `false`, ou `{ formatter: (cell) => html }`. `valueFormatter` formata o valor.
- `on('click', (cell) => …)`, `on('hover', (cell | null) => …)`. Devolvem a função para desligar.

## Métodos

| Método | |
|---|---|
| `setData(data, animate?)` | Troca os dados |
| `setOptions(opções, animate?)` | Muda opções (por exemplo `range` para mudar de mês) |
| `cellAt(data)` | A caixa de um dia, ou `null` |
| `colorOf(valor)` | A cor de um valor no visualMap |
| `cells` | Todos os dias mostrados |
| `resize()` | Volta a medir (é automático com o `ResizeObserver`) |
| `screenshot()` | PNG em data URL |
| `destroy()` | Remove o gráfico |

Também exporta `parseDay`, `dayKey` e `rangeDays` para trabalhar com datas como o calendário.
