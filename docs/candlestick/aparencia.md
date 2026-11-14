# Aparência e tamanhos

## Tema (cores)

O mesmo objeto `theme` pinta o **gráfico** (canvas) e a **interface** (barras, menus, diálogos). Só precisas de indicar as cores que queres mudar.

```ts
import { createTerminal, lightTheme } from 'openchartscandle/candlestick';

createTerminal(el, {
  datafeed,
  theme: {
    bg: '#0b1020',            // fundo do gráfico e dos painéis
    appBg: '#05070d',         // fundo entre painéis
    grid: 'transparent',      // sem grelha
    border: '#1c2333',        // separadores e bordas
    text: '#9aa4b2',          // texto dos eixos
    textStrong: '#e6e9ef',
    up: '#00e0c6',            // corpo da vela de alta
    down: '#ff4d8d',          // corpo da vela de baixa
    wickUp: '#00e0c6',        // pavios (por defeito iguais ao corpo)
    wickDown: '#ff4d8d',
    candleBorder: true,       // contorno nas velas
    borderUp: '#00e0c6',
    borderDown: '#ff4d8d',
    line: '#f7a600',          // gráficos de linha / área
    accent: '#00e0c6',        // seleção, ferramenta ativa, destaques
    crosshair: '#9598a1',
  },
});

// tema claro pronto a usar (e podes alterar o que quiseres por cima)
createTerminal(el, { datafeed, theme: { ...lightTheme, up: '#26a69a', down: '#ef5350' } });
```

| Chave | Para quê |
|---|---|
| `bg` | Fundo do gráfico e dos painéis |
| `appBg` | Fundo atrás dos painéis (os espaços entre barras) |
| `grid` | Linhas da grelha (`'transparent'` esconde) |
| `border` | Bordas e separadores |
| `text` / `textStrong` / `muted` | Texto secundário, principal e apagado |
| `up` / `down` | Corpo das velas de alta e de baixa |
| `wickUp` / `wickDown` | Pavios (por defeito iguais a `up` / `down`) |
| `candleBorder` | `true` desenha contorno nos corpos |
| `borderUp` / `borderDown` | Cor do contorno |
| `line` | Gráfico de linha, degraus e área |
| `crosshair` / `crosshairLabel` | Linhas do cursor e as etiquetas nos eixos |
| `accent` | Seleção, ferramenta ativa, botões ativos |
| `fontSize` | Tamanho do texto no canvas |

Também podes mudar o tema **com o gráfico já aberto**:

```ts
terminal.applyTheme({ bg: '#000000', up: '#00ff88' }); // terminal completo
chart.applyTheme({ up: '#00ff88' });                    // só o gráfico (createChart)
```

`darkTheme` e `lightTheme` são exportados. `setTheme(patch)` muda o tema por defeito dos gráficos criados depois.

---

## Só o gráfico

```ts
createTerminal(el, { datafeed, minimal: true });               // só o canvas
createTerminal(el, { datafeed, minimal: true, legend: true }); // + legenda OHLC
```

`minimal` desliga a barra de topo, as ferramentas, a barra de baixo, a watchlist e a legenda. Qualquer uma pode ser ligada outra vez individualmente.

Partes do próprio gráfico:

| Opção | Por defeito | Descrição |
|---|---|---|
| `priceAxis` | `true` | Escala de preço à direita |
| `timeAxis` | `true` | Escala de tempo em baixo |
| `crosshair` | `true` | Cursor em cruz |
| `lastPriceLine` | `true` | Linha pontilhada e etiqueta do último preço |
| `mouseWheel` | `true` | Zoom com a roda. Usa `false` em páginas com scroll (dashboards) |

Um gráfico tipo "sparkline":

```ts
createTerminal(el, {
  datafeed, minimal: true, chartType: 'area',
  priceAxis: false, timeAxis: false, crosshair: false, lastPriceLine: false,
  theme: { grid: 'transparent', line: '#f7a600' },
});
```

---

## Tamanho, bordas e cards

| Opção | Descrição |
|---|---|
| `compact: true` | Barras e botões mais pequenos, para cards e contentores pequenos |
| `border: '1px solid #2a2e39'` | Borda à volta de tudo |
| `radius: 10` | Cantos arredondados (px) |

O tamanho vem sempre do **contentor**: dá-lhe largura e altura (`height: 300px`, `flex: 1`, grid…) e o gráfico ajusta-se sozinho, incluindo quando o contentor muda de tamanho.

```html
<div class="card">
  <h3>BTC · 5m</h3>
  <div id="mini" style="height: 280px"></div>
</div>
```

```ts
createTerminal(document.getElementById('mini')!, {
  datafeed, symbol: 'BTCUSDT', minimal: true, legend: true, compact: true,
  radius: 8, mouseWheel: false,
});
```

A **Demo 4** (`/cards.html`) tem vários exemplos lado a lado. A **Demo 3** (`/custom.html`) tem uma secção "Aparência" com todas estas opções e mostra o código gerado.

---

## CSS

A interface usa variáveis CSS, por isso também podes ajustar com CSS em vez do `theme`:

```css
#meu-grafico .tc-terminal {
  --tc-bg: #0b1020;
  --tc-accent: #00e0c6;
  --tc-topbar-h: 34px;
}
```

Variáveis: `--tc-bg`, `--tc-app-bg`, `--tc-border`, `--tc-text`, `--tc-text-strong`, `--tc-muted`, `--tc-accent`, `--tc-up`, `--tc-down`, `--tc-topbar-h`, `--tc-bottombar-h`, `--tc-left-w`, `--tc-gap`, `--tc-tool-size`, `--tc-btn-h`.

## Fuso horário

O eixo do tempo e a cruz usam a hora do browser. Para outro fuso:

```ts
createTerminal(el, { datafeed, timezone: 'UTC' });   // ou 'Europe/Lisbon', 'America/New_York', 'exchange'…
terminal.setTimezone('Asia/Tokyo');
terminal.timezoneChanged.on((tz) => console.log(tz));

const chart = createChart(el, { timezone: 'America/New_York' });
chart.setTimezone('local');                           // de volta à hora do browser
```

- `'exchange'` usa o `timezone` do símbolo (`SymbolInfo.timezone`), ou UTC se não tiver.
- No Terminal, o relógio da barra de baixo abre um menu com os fusos (`timezones` muda a lista). A escolha fica guardada com `storageKey`.
- As mudanças de hora (verão/inverno) são tidas em conta, com a API `Intl` do browser e sem bibliotecas externas.
- As velas diárias e semanais mostram sempre a data da vela, em qualquer fuso: a vela de dia 15 é sempre "15".
- Um nome que o browser não conhece lança `RangeError`.
