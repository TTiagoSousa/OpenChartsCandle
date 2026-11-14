# Ferramentas de desenho

Todas as ferramentas estão em `chart.drawings` (um `DrawingManager`).

```ts
chart.drawings.setTool('fib');   // ativa a ferramenta
chart.drawings.setTool(null);    // volta ao cursor
chart.drawings.magnet = 'weak';  // 'off' | 'weak' | 'strong'
chart.drawings.stayInDrawMode = true; // não volta ao cursor depois de desenhar
```

## Ferramentas (`id`)

| Grupo | Ferramenta | `id` | Pontos |
|---|---|---|---|
| Linhas | Linha de tendência | `trendline` | 2 |
| | Raio | `ray` | 2 |
| | Linha de informação (Δ preço, %, barras, ângulo) | `infoline` | 2 |
| | Linha estendida | `extended` | 2 |
| | Seta | `arrow` | 2 |
| | Linha horizontal | `hline` | 1 |
| | Raio horizontal | `hray` | 1 |
| | Linha vertical | `vline` | 1 |
| | Linha cruzada | `crossline` | 1 |
| | Canal paralelo | `channel` | 3 |
| Fibonacci | Retração | `fib` | 2 |
| | Extensão baseada em tendência | `fibext` | 3 |
| | Canal de Fibonacci | `fibchannel` | 3 |
| Previsão | Posição comprada | `long` | 1 |
| | Posição vendida | `short` | 1 |
| | Intervalo de preço | `pricerange` | 2 |
| | Intervalo de data | `daterange` | 2 |
| | Intervalo de data e preço | `datepricerange` | 2 |
| Volume | Perfil de volume de intervalo fixo | `frvp` | 2 |
| | VWAP ancorado | `avwap` | 1 |
| Formas | Pincel | `brush` | arrastar |
| | Retângulo | `rect` | 2 |
| | Elipse | `ellipse` | 2 |
| | Triângulo | `triangle` | 3 |
| | Caminho | `path` | vários (duplo clique ou Enter para terminar) |
| Anotação | Texto | `text` | 1 |

`TOOL_GROUPS` e `ALL_TOOLS` (exportados) têm esta lista com títulos e ícones, para montares a tua própria barra.

## Como se desenha

- **Clique, clique:** o primeiro clique fixa o ponto 1 e a linha segue o rato até ao segundo clique.
- **Arrastar:** carrega, arrasta e larga para criar com 2 pontos.
- **Shift:** prende o ângulo a múltiplos de 45° (horizontal, vertical e diagonal).
- **Íman:** fraco cola ao OHLC quando estás perto; forte cola sempre.
- **Editar:** clica no desenho para o selecionar. Arrastas os pontos para os mudar, ou o corpo para o mover. Duplo clique abre as definições.
- **Botão direito:** menu com clonar, trazer para a frente, bloquear, ocultar e remover.

## Atalhos de teclado (Terminal)

| Tecla | Ação |
|---|---|
| `Alt + T` / `H` / `J` / `V` / `C` / `F` | Linha de tendência, horizontal, raio horizontal, vertical, cruzada, Fibonacci |
| `Del` / `Backspace` | Apagar o desenho selecionado |
| `Esc` | Cancelar o desenho atual, sair da ferramenta, desselecionar |
| `Enter` | Terminar um caminho |
| `Ctrl + Z` / `Ctrl + Y` | Desfazer / refazer |
| `Ctrl + C` / `Ctrl + V` | Copiar / colar o desenho selecionado |
| `Alt + R` | Repor a vista do gráfico |
| `←` `→` / `↑` `↓` | Scroll / zoom |
| `15` + `Enter`, `4h`, `D`, `W` | Mudar de timeframe a escrever |

## Criar desenhos por código

```ts
const dm = chart.drawings;

dm.add('trendline', [{ time: t1, price: 64000 }, { time: t2, price: 65500 }], { color: '#ff9800', width: 2, extendRight: true });
dm.add('hline', [{ time: t1, price: 66000 }], { color: '#f23645', text: 'Resistência' });
dm.add('fib', [{ time: tMin, price: minimo }, { time: tMax, price: maximo }]);
dm.add('long', [
  { time: t, price: entrada },
  { time: tFim, price: alvo },
  { time: tFim, price: stop },
]);
```

O `add` devolve o desenho criado (ou `null` se o id não existir), regista-o no desfazer e guarda-o no storage. Os ids das ferramentas estão na tabela acima.

## Guardar os desenhos

Por defeito ficam no `localStorage`, um conjunto por símbolo. Para os guardar no **teu backend**, passa um `DrawingStorage`:

```ts
import { createChart, type DrawingStorage, type SerializedDrawing } from 'openchartscandle/candlestick';

const cache: Record<string, SerializedDrawing[]> = await fetch('/api/drawings').then((r) => r.json());

const storage: DrawingStorage = {
  load: (symbol) => cache[symbol] ?? [],
  save: (symbol, drawings) => {
    cache[symbol] = drawings;
    fetch(`/api/drawings/${symbol}`, { method: 'PUT', body: JSON.stringify(drawings) });
  },
};

const chart = createChart(el, { drawingStorage: storage });
```

Também podes fazer tudo à mão, com `drawingStorage: null`:

```ts
const json = chart.drawings.toJSON();   // SerializedDrawing[]
chart.drawings.fromJSON(json);          // substitui todos
chart.drawings.changed.on(() => guardar(chart.drawings.toJSON()));
```

Os pontos estão ancorados a **tempo + preço**, por isso os desenhos ficam no mesmo sítio quando mudas de timeframe.

## Outras operações

```ts
const dm = chart.drawings;
dm.selected;              // Drawing | null
dm.updateOptions(d, { color: '#f23645', width: 2, dash: 'dashed' });
dm.remove(d);
dm.clearAll();
dm.undo(); dm.redo();
dm.lockAll = true;        // nada pode ser movido
dm.hideAll = true;        // esconde todos
```
