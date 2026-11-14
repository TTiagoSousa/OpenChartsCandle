# Funil · referência da API

```ts
import { createFunnelChart } from 'openchartscandle/funnel';
import 'openchartscandle/style.css';

const chart = createFunnelChart(el, {
  data: [
    { name: 'Visitas', value: 48000 },
    { name: 'Registos', value: 12600 },
    { name: 'Primeiro depósito', value: 3900 },
    { name: 'Primeira ordem', value: 2600 },
  ],
});
```

O elemento tem de ter altura (o funil ocupa o espaço todo).

## Etapas (data)

| Campo | |
|---|---|
| `name` | Nome (legenda, etiqueta e tooltip) |
| `value` | Valor; dá a largura da etapa |
| `color` | Cor (por omissão a paleta `colors`, uma cor por nome, a mesma em todos os funis) |
| `itemStyle` | Aspeto só desta etapa (ver abaixo) |
| `label` | Etiqueta só desta etapa |

## O funil

Estas opções vão no topo, ou em cada funil de `funnels`.

| Opção | | Por omissão |
|---|---|---|
| `sort` | `'descending'` (a maior em cima), `'ascending'` (pirâmide) ou `'none'` (pela ordem dada) | `'descending'` |
| `orient` | `'vertical'` (de cima para baixo) ou `'horizontal'` (da esquerda para a direita) | `'vertical'` |
| `gap` | Espaço entre etapas em px | `2` |
| `min`, `max` | Valores que correspondem a `minSize` e `maxSize` | `0` e o maior valor |
| `minSize`, `maxSize` | Largura de `min` e de `max`, em `'%'` do espaço do funil ou px | `'0%'`, `'100%'` |
| `funnelAlign` | `'center'`, `'left'` / `'right'` (ou `'top'` / `'bottom'` num funil horizontal) | `'center'` |
| `left`, `right`, `top`, `bottom` | Espaço do funil no gráfico, em px ou `'%'`, com as etiquetas lá dentro | 10 px |
| `label` | Etiquetas (ver abaixo) | por fora |
| `labelLine` | Linha das etiquetas de fora: `true`, `false` ou `{ length, color }` | `true`, 18 px |
| `itemStyle` | `{ color, opacity, borderColor, borderWidth, borderDash }`. `color: 'transparent'` desenha só o contorno | borda de 1 px na cor do fundo |
| `name`, `showName` | Nome no tooltip e, com `showName`, por cima do funil | |
| `silent` | O rato ignora este funil (um contorno por baixo de outro) | `false` |

Cada etapa é um trapézio: num funil começa com a sua largura e acaba com a da etapa seguinte (a última acaba em `minSize`); numa pirâmide é ao contrário.

### Etiquetas

| Campo | | Por omissão |
|---|---|---|
| `show` | Mostrar | `true` |
| `position` | `'outside'` (à direita; por baixo num funil horizontal), `'left'`, `'right'`, `'top'`, `'bottom'`, `'inside'`, `'insideLeft'`, `'insideRight'` ou `'none'` | `'outside'` |
| `format` | `(info) => texto`, com `\n` para várias linhas | o nome |
| `color`, `fontSize`, `fontWeight` | Por dentro, a cor escolhe-se sozinha para se ler | |

As etiquetas de fora ficam alinhadas numa coluna e o espaço delas é reservado sozinho.

### Vários funis

```ts
createFunnelChart(el, {
  funnels: [
    { name: 'Meta', data: meta, left: '4%', right: '51%', funnelAlign: 'right', showName: true },
    { name: 'Real', data: real, left: '51%', right: '4%', funnelAlign: 'left', showName: true },
  ],
  label: { position: 'inside' },
});
```

As opções do topo servem de base para todos. Dois funis no mesmo espaço desenham-se um por cima do outro: por exemplo a meta só com o contorno (`itemStyle: { color: 'transparent', borderDash: [4, 3] }`, `silent: true`) e o real por dentro, com `maxSize: '80%'`.

## Legenda, tooltip e aparência

| Opção | |
|---|---|
| `colors` | Paleta (`FUNNEL_COLORS`) |
| `legend` | `true`, `false` ou `{ position: 'top' \| 'bottom' \| 'left' \| 'right', interactive }`. Um click esconde a etapa em todos os funis e o funil volta a ocupar o espaço |
| `tooltip` | `true`, `false` ou `{ formatter(info) }`. Por omissão: o valor e a conversão desde a primeira etapa e desde a anterior |
| `valueFormatter` | `(v) => texto` |
| `hoverDim` | Opacidade das outras etapas com o rato numa (0.35) |
| `title` | Texto ou `{ text, subtext, align }` |
| `theme` | `'dark'`, `'light'` ou um objeto com `background`, `text`, `muted`, `border`, `tooltipBg`, `tooltipText`, `tooltipBorder`, `font` |
| `background` | Atalho para `theme.background`; `'transparent'` para cards |
| `animation` | `true`, `false` ou `{ duration }` (650 ms): o funil cresce de cima e muda de forma |

O tooltip e os eventos recebem `{ item, name, value, color, funnelIndex, funnelName, index, percentOfFirst, percentOfPrevious, percent }`.

## Métodos e eventos

| | |
|---|---|
| `setData(etapas \| funis, animate?)` | Troca os dados; as etapas com o mesmo nome mudam de forma |
| `setOptions(opções, animate?)` | Muda opções (ordem, orientação, etiquetas…) com animação |
| `toggle(nome, hidden?)` | Mostra / esconde uma etapa |
| `on('hover' \| 'click' \| 'toggle', fn)` | Devolve a função para desligar |
| `resize()`, `screenshot()`, `destroy()` | |

Também exporta `funnelShapes`, `funnelOrder` e `funnelWidth`, a geometria sozinha.
