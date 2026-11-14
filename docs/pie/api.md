# Pizza · Referência da API

```ts
import { createPieChart, type PieDatum, type PieSlice } from 'openchartscandle/pie';
import 'openchartscandle/style.css';

const chart = createPieChart(document.getElementById('pizza')!, {
  data: [
    { label: 'Ações', value: 60 },
    { label: 'Obrigações', value: 25 },
    { label: 'Liquidez', value: 15 },
  ],
  innerRadius: 0.6, // donut
});
```

O contentor tem de ter **altura definida** (por exemplo `height: 360px`). O gráfico ajusta-se sozinho quando o contentor muda de tamanho.

---

## Dados

```ts
interface PieDatum {
  label: string;
  value: number;   // valores ≤ 0 ou inválidos são ignorados
  color?: string;  // cor fixa (senão vem da paleta)
  id?: string;     // chave estável (por defeito o label)
  pattern?: PiePattern; // textura desta fatia (ver `patterns`)
}
```

As cores são atribuídas pela **posição nos dados originais**. Por isso não mudam quando ordenas, escondes fatias ou atualizas valores.

---

## Opções

### Contentor e fundo

| Opção | Por defeito | Descrição |
|---|---|---|
| `background` | do tema | Cor de fundo. **`'transparent'`** usa a cor, o gradiente ou a imagem do card onde o gráfico está, e os espaços entre fatias também ficam transparentes (são cortados, não pintados) |
| `padding` | `0` | Margem interior (px) |
| `scale` | `1` | Tamanho da pizza no espaço disponível (0.3–1) |
| `emptyText` | `'Sem dados'` | Texto quando não há fatias visíveis |
| `title` | — | Título por cima: `'Texto'` ou `{ text, subtext?, align?: 'left' \| 'center' \| 'right', color? }` |

### Forma

| Opção | Por defeito | Descrição |
|---|---|---|
| `innerRadius` | `0` | Tamanho do buraco, de 0 a 0.95 do raio. `0` = pizza, `0.5`–`0.75` = donut |
| `startAngle` | `-90` | Graus onde começa (−90 = topo, 0 = três horas) |
| `endAngle` | `start + 360` | Graus onde acaba. `-180 → 0` dá um **meio donut / gauge** |
| `padAngle` | `0` | Espaço entre fatias, em graus |
| `cornerRadius` | `0` | Cantos arredondados, em px |
| `rose` | `false` | **Rosa (Nightingale)**. `true`: ângulos iguais e raio pela raiz do valor; `'area'`: ângulos iguais e raio pelo valor; `'radius'`: ângulo e raio pelo valor |
| `outerRadius` | `1` | Raio exterior dos dados principais (0–1), para pizzas aninhadas |
| `rings` | — | Mais anéis de dados: `[{ name?, data, innerRadius, outerRadius, labels?, colors?, padAngle?, cornerRadius?, rose?, sort? }]` (ver **Pizzas aninhadas**) |
| `clockwise` | `true` | Sentido das fatias |
| `minSliceAngle` | `0` | Ângulo mínimo de uma fatia (graus): valores muito pequenos continuam visíveis |
| `borderWidth` | `1` | Contorno entre fatias, na cor `theme.sliceBorder`. Com fundo transparente é um **corte** transparente |

### Efeitos

| Opção | Por defeito | Descrição |
|---|---|---|
| `gradient` | `false` | Gradiente radial em cada fatia |
| `patterns` | `false` | Texturas sobre as cores: `true` (uma diferente por fatia) ou uma lista de `'stripes'`, `'diagonal'`, `'dots'`, `'grid'`, `'cross'`, `'checker'`, `'zigzag'` |
| `shadow` | — | Sombra: `{ color?, blur?, offsetY? }` (por exemplo `{ blur: 14, offsetY: 4 }`) |
| `hoverDim` | `0.55` | Opacidade das outras fatias quando uma está sob o rato (`1` = não escurece) |

### Dados

| Opção | Por defeito | Descrição |
|---|---|---|
| `sort` | `'none'` | `'desc'` ou `'asc'` ordena as fatias |
| `groupBelow` | `0` | Junta as fatias abaixo deste % numa fatia "Outros" (é preciso haver pelo menos 2) |
| `othersLabel` | `'Outros'` | Nome da fatia agrupada |

### Cores e tema

| Opção | Por defeito | Descrição |
|---|---|---|
| `colors` | paleta de 12 cores | Cores usadas por ordem (`PIE_COLORS` é a paleta por defeito) |
| `theme` | `'dark'` | `'dark'`, `'light'` ou um objeto `PieTheme` parcial |

`PieTheme`:

| Chave | Para quê |
|---|---|
| `background` | Fundo (`'transparent'` para usar o da página) |
| `text` / `muted` | Texto principal e secundário |
| `line` | Linhas-guia das etiquetas de fora |
| `sliceBorder` | Contorno entre fatias (por defeito igual ao fundo, o que parece um espaço) |
| `tooltipBg` / `tooltipText` / `tooltipBorder` | Cores do tooltip |
| `font` | Fonte |

### Etiquetas — `labels`

| Campo | Por defeito | Descrição |
|---|---|---|
| `show` | `true` | Mostrar etiquetas |
| `position` | `'auto'` | `'inside'`, `'outside'` (com linhas-guia que não se sobrepõem) ou `'auto'` (dentro quando cabe) |
| `content` | `'percent'` | `'percent'`, `'value'`, `'label'`, `'label-percent'`, `'label-value'` ou `(slice) => string` |
| `minPercent` | `3` | Esconde as etiquetas de fatias mais pequenas |
| `fontSize` | `12` | Tamanho do texto |
| `fontWeight` | `600` | Peso da letra |
| `color` | `theme.text` | Cor das etiquetas de fora |
| `insideColor` | automático | Cor das etiquetas de dentro (por defeito preto ou branco, conforme a fatia) |
| `lineLength` | `18` | Comprimento da parte horizontal das linhas-guia (px) |
| `radialLength` | `12` | Comprimento da parte radial das linhas-guia (px) |
| `alignTo` | `'line'` | Onde ficam as etiquetas de fora: `'line'` (em duas colunas ao lado da pizza), `'none'` (logo a seguir à linha) ou `'edge'` (encostadas às margens) |
| `edgeDistance` | `10` | Distância às margens com `alignTo: 'edge'` (px) |
| `lineSmooth` | `false` | Linhas-guia curvas |
| `showLine` | `true` | Mostrar as linhas-guia |
| `rich` | — | Texto rico: `(slice) => PieRichRun[][]`, linhas de pedaços `{ text, color?, fontSize?, fontWeight?, background?, padding?, radius? }`. Ganha a `content` |

Com `content` em função, `'\n'` parte o texto em várias linhas. As etiquetas de fora afastam-se umas das outras conforme a altura de cada uma.

### Legenda — `legend`

| Campo | Por defeito | Descrição |
|---|---|---|
| `show` | `true` | Mostrar a legenda |
| `position` | `'right'` | `'right'`, `'left'`, `'top'` ou `'bottom'` |
| `interactive` | `true` | Clicar esconde/mostra a fatia; passar o rato destaca-a |
| `values` | `true` | Mostrar o valor e a % ao lado do nome |
| `marker` | `'square'` | `'square'`, `'circle'` ou `'line'` |
| `fontSize` | `13` | Tamanho do texto (px) |
| `align` | `'center'` | `'start'`, `'center'` ou `'end'` |

### Tooltip — `tooltip`

| Campo | Por defeito | Descrição |
|---|---|---|
| `show` | `true` | Mostrar o tooltip ao passar o rato |
| `formatter` | — | `(slice, total) => string` com o HTML do tooltip |
| `followCursor` | `true` | Segue o rato; com `false` fica junto à fatia |
| `showValue` / `showPercent` | `true` | O que o tooltip por defeito mostra |

O tooltip por defeito mostra o nome, o valor e a %. Para a fatia "Outros", mostra também a lista do que lá está dentro.

### Centro do donut — `center`

| Campo | Por defeito | Descrição |
|---|---|---|
| `show` | `true` se `innerRadius > 0` | Texto no centro |
| `title` | `'Total'` | Texto pequeno |
| `value` | total formatado | Texto grande: `string` ou `(total) => string` |
| `followHover` | `true` | Ao passar o rato, mostra a fatia em vez do total |
| `valueColor` / `titleColor` | do tema | Cores do texto grande e do pequeno |
| `fontScale` | `1` | Multiplica o tamanho automático do texto |

O texto do centro é escondido automaticamente quando o buraco é demasiado pequeno.

### Interação e animação

| Opção | Por defeito | Descrição |
|---|---|---|
| `hoverOffset` | `8` | Quanto a fatia se afasta ao passar o rato (px) |
| `selectable` | `true` | Clicar seleciona a fatia, que fica afastada |
| `selectOffset` | `14` | Distância da fatia selecionada (px) |
| `animation` | `true` | `false`, ou `{ duration: 700, type?: 'sweep' \| 'scale', easing?: 'cubic' \| 'elastic', stagger? }`. `'scale'` faz cada fatia crescer do centro; `stagger` é o atraso entre fatias em ms ou `'random'` |
| `seriesName` | — | Nome dos dados principais, mostrado no tooltip quando há `rings` |

### Formatação

| Opção | Descrição |
|---|---|
| `valueFormatter` | `(v) => string`, por exemplo `v => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })` |
| `percentFormatter` | `(p) => string`. Por defeito 1 casa decimal + `%` |

---

## Métodos

| Método | Descrição |
|---|---|
| `setData(data)` | Substitui os dados, com animação para os novos ângulos |
| `setOptions(patch, animate = true)` | Muda opções depois de criado (forma, cores, legenda…). Usa `animate = false` para alterações contínuas, como sliders |
| `slices` | Fatias como estão desenhadas (`PieSlice[]`), depois de ordenar e agrupar |
| `total` | Soma das fatias visíveis |
| `toggle(id, hidden?)` | Esconde/mostra uma fatia (como clicar na legenda) |
| `select(id \| null)` | Seleciona uma fatia (ou limpa a seleção) |
| `highlight(id \| null)` | Destaca uma fatia, como ao passar o rato |
| `on(evento, fn)` | Subscreve um evento; devolve a função para cancelar |
| `screenshot()` | PNG (data URL) do gráfico |
| `destroy()` | Remove o gráfico e os listeners |

`id` é o `id` do dado, ou o `label` se não tiver `id`. A fatia agrupada tem o id `__others__`.

## Eventos

| Evento | Recebe | Quando |
|---|---|---|
| `hover` | `PieSlice \| null` | O rato entra numa fatia (ou num item da legenda) ou sai |
| `click` | `PieSlice` | Clique numa fatia |
| `select` | `PieSlice \| null` | A seleção mudou |
| `toggle` | `PieSlice` | Uma fatia foi escondida ou mostrada |

```ts
const off = chart.on('select', (s) => {
  if (s) abrirDetalhe(s.label);
});
```

## `PieSlice`

```ts
interface PieSlice {
  id: string;
  label: string;
  value: number;
  percent: number;     // 0–100, do total visível
  color: string;
  index: number;       // posição no desenho
  hidden: boolean;
  ring: number;        // 0 = dados principais, 1… = rings[i - 1]
  ringName?: string;
  selected: boolean;
  grouped: boolean;    // é a fatia "Outros"
  children?: PieDatum[]; // o que está dentro de "Outros"
  datum: PieDatum;
}
```

---

## Receitas

### Pizzas aninhadas

```ts
createPieChart(el, {
  data: [{ label: 'Direto', value: 1548 }, { label: 'Marketing', value: 775 }],
  outerRadius: 0.4,                 // pizza pequena no centro
  labels: { position: 'inside', content: 'label' },
  rings: [{
    name: 'Fonte',
    innerRadius: 0.6, outerRadius: 0.85,
    data: [{ label: 'Google', value: 900 }, { label: 'Email', value: 648 }, { label: 'Anúncios', value: 775 }],
    labels: { position: 'outside', rich: (s) => [[{ text: s.label, fontWeight: 700 }], [{ text: `${s.percent.toFixed(1)}%`, background: s.color, color: '#fff' }]] },
  }],
});
```

A legenda mostra cada nome uma vez; escondê-lo esconde-o em todos os anéis.

**Meio donut (gauge) com um valor:**

```ts
createPieChart(el, {
  data: [{ label: 'Valor', value: 72, color: '#089981' }, { label: 'Resto', value: 28, color: '#2a2e39' }],
  startAngle: -180, endAngle: 0, innerRadius: 0.72, cornerRadius: 8, borderWidth: 0,
  hoverOffset: 0, selectable: false, tooltip: { show: false }, labels: { show: false }, legend: { show: false },
  center: { title: 'Medo & ganância', value: '72', followHover: false },
});
```

**Dentro de um card (fundo transparente):**

```html
<div class="card" style="background: linear-gradient(135deg, #2962ff, #e040fb); border-radius: 16px; padding: 16px">
  <h3>Carteira</h3>
  <div id="pizza" style="height: 260px"></div>
</div>
```

```ts
createPieChart(document.getElementById('pizza')!, {
  data,
  background: 'transparent', // o card aparece por trás, incluindo nos espaços entre fatias
  innerRadius: 0.62,
  padAngle: 1.5,
  cornerRadius: 5,
  legend: { position: 'bottom', marker: 'circle', values: false },
  theme: { text: '#ffffff', muted: 'rgba(255,255,255,.75)' }, // texto claro sobre o card
});
```

Se preferires um contorno pintado numa cor, em vez dos cortes transparentes, usa `theme: { sliceBorder: '#1b2030' }`.

**Atualizar a cada segundo:**

```ts
setInterval(async () => chart.setData(await fetch('/api/carteira').then((r) => r.json())), 1000);
```
