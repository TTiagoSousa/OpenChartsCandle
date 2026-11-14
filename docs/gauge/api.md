# Velocímetro · Referência da API

```ts
import { createGauge, trafficZones } from 'openchartscandle/gauge';
import 'openchartscandle/style.css';

const gauge = createGauge(document.getElementById('velocimetro')!, {
  value: 90,
  max: 240,
  unit: 'km/h',
  zones: trafficZones(0, 240),
});

gauge.setValue(130); // o ponteiro anima até ao novo valor
```

O contentor tem de ter **altura definida**. O mostrador ajusta-se ao espaço disponível.

---

## Opções

### Valor

| Opção | Por defeito | Descrição |
|---|---|---|
| `value` | `min` | Valor inicial. Fora de `min`/`max` o ponteiro fica no limite (o valor real continua no tooltip e nos eventos) |
| `min` / `max` | `0` / `100` | Escala |
| `unit` | — | Texto depois do valor (`'km/h'`, `'%'`…) |
| `title` | — | Texto por baixo do valor |
| `valueFormatter` | automático | `(v) => string`. Por defeito, sem casas decimais (ou uma casa em escalas até 10) |
| `valueColorByZone` | `true` | O valor fica com a cor da zona onde está |
| `valueSize` | `'auto'` | Tamanho do valor em px |
| `showMinMax` | automático | Mínimo e máximo por baixo das pontas do arco (quando as marcas não têm números) |

### Formato

| Opção | Por defeito | Descrição |
|---|---|---|
| `shape` | `'speedometer'` | `'speedometer'` (240°), `'semi'` (180°) ou `'full'` (anel 360°) |
| `startAngle` / `endAngle` | — | Ângulos próprios em graus (0 = topo, sentido dos ponteiros); substituem `shape` |
| `thickness` | `0.16` | Espessura do arco: fração do raio (0–1) ou px |
| `rounded` | `true` | Pontas do arco redondas |
| `padding` | `10` | Margem à volta (px) |

### Arco

| Opção | Descrição |
|---|---|
| `zones` | `[{ from, to, color, label? }]`: zonas de cor. O `label` aparece no tooltip e no evento `zone` |
| `zoneGap` | Espaço entre zonas, em graus (`1.2`) |
| `gradient` | `['#089981', '#ffb300', '#f23645']`: gradiente ao longo do arco, em vez de zonas |
| `progress` | `true` ou `{ color }`: pinta o arco do mínimo até ao valor. Por defeito ligado quando não há ponteiro |

`trafficZones(min, max, [0.6, 0.85])` cria as zonas Normal / Atenção / Crítico (verde, amarelo e vermelho).

### Ponteiro — `needle`

| Campo | Por defeito | Descrição |
|---|---|---|
| `show` | `true` | `needle: false` esconde o ponteiro (mostrador de progresso) |
| `shape` | `'classic'` | `'classic'` (afunilado), `'line'` ou `'arrow'` |
| `color` | do tema | `'zone'` pinta o ponteiro com a cor da zona para onde aponta |
| `width` | automático | Espessura (px) |
| `length` | `0.82` | Comprimento em fração do raio |
| `hub` | `true` | Círculo central |

### Marcas — `ticks`

| Campo | Por defeito | Descrição |
|---|---|---|
| `show` | `true` | |
| `major` | `6` | Número de marcas grandes (com número) |
| `minor` | `4` | Marcas pequenas entre cada par de grandes |
| `labels` | `true` | Números nas marcas grandes |
| `format` | compacto | `(v) => string` |
| `position` | `'inside'` | `'inside'` ou `'outside'` do arco, ou `'on'` por cima da faixa de cor (marcas brancas) |
| `color` | do tema | |

### Vários valores

| Opção | Descrição |
|---|---|
| `pointers` | `[{ value, label?, color?, shape?, width?, length? }]`: vários ponteiros no mesmo mostrador (ex.: Bom / Melhor / Perfeito, ponteiros de um relógio). Os nomes e valores aparecem por baixo; `pointerValues: false` esconde-os |
| `rings` | `[{ value, label?, color? }]`: vários valores em anéis concêntricos (de fora para dentro), com a lista ao centro |

Muda-os com `setOptions({ pointers })` ou `setOptions({ rings })`: animam até aos novos valores (`setOptions(..., false)` salta sem animar).

### Escalas e nomes

| Opção | Descrição |
|---|---|
| `zoneLabels` | `true` ou `{ color, fontSize }`: escreve o `label` de cada zona no mostrador, a meio da zona (ex.: "Nota A", "Bom tempo") |
| `secondaryScale` | `{ min, max, major, minor, format, color, label }`: uma segunda escala por dentro, nos mesmos ângulos (ex.: hPa por fora, mmHg por dentro) |

### Outros

| Opção | Descrição |
|---|---|
| `markers` | `[{ value, label?, color? }]`: triângulos à volta do arco (meta, máximo de ontem…) |
| `tooltip` | `true`, `false` ou `{ formatter(ctx) }`, com `ctx = { value, zone, hovered }`. Ao passar o rato sobre uma zona mostra o intervalo; sobre um marcador mostra o valor dele; ao centro mostra o valor atual |
| `animation` | `true`, `false` ou `{ duration, easing }`, com `easing` `'spring'` (mola, por defeito), `'smooth'` ou `'linear'` |
| `background` | `'transparent'` para usar dentro de cards |
| `theme` | `'dark'`, `'light'` ou `GaugeTheme` parcial (`background`, `text`, `muted`, `track`, `needle`, `tooltipBg`, `tooltipText`, `tooltipBorder`, `font`) |

---

## Métodos

| Método | Descrição |
|---|---|
| `setValue(valor, animate = true)` | Move o ponteiro. Pode ser chamado a qualquer ritmo (cada chamada continua a partir da posição atual) |
| `value` | Valor atual |
| `setOptions(patch, animate = true)` | Muda opções depois de criado |
| `on('change', fn)` | Cada novo valor |
| `on('zone', fn)` | Quando o valor muda de zona (recebe a zona ou `null`) |
| `screenshot()` | PNG (data URL) |
| `destroy()` | Remove o mostrador e os listeners |

---

## Receitas

**KPI de progresso em anel:**

```ts
createGauge(el, { value: 78, shape: 'full', needle: false, unit: '%', title: 'Meta', ticks: { show: false }, background: 'transparent' });
```

**RSI com zonas:**

```ts
createGauge(el, {
  value: rsi,
  shape: 'semi',
  zones: [
    { from: 0, to: 30, color: '#089981', label: 'Sobrevendido' },
    { from: 30, to: 70, color: '#5d606b', label: 'Neutro' },
    { from: 70, to: 100, color: '#f23645', label: 'Sobrecomprado' },
  ],
});
```

**Tempo real a partir de um WebSocket:**

```ts
const gauge = createGauge(el, { max: 100, unit: '%', zones: trafficZones(0, 100), animation: { easing: 'smooth', duration: 400 } });
ws.onmessage = (e) => gauge.setValue(JSON.parse(e.data).cpu);
gauge.on('zone', (z) => z?.label === 'Crítico' && alert('CPU crítico'));
```
