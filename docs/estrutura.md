# Estrutura e famílias de gráficos

A biblioteca está organizada por **famílias de gráficos**. Uma família é um tipo de gráfico com o seu próprio motor, API, estilos, docs, testes e exemplos. Por exemplo:

- **candlestick**: velas ao estilo TradingView (disponível);
- **pie**: pizza, donut, meio donut (gauge) e rosa (disponível). É um bom exemplo de família pequena e independente: `src/pie/`;
- **line**: linhas e áreas com várias séries (disponível);
- **bar**: barras e colunas, agrupadas ou empilhadas (disponível);
- **gauge**: velocímetros e medidores com ponteiro e zonas (disponível);
- **treemap**: treemap e sunburst de hierarquias (disponível);
- **scatter**: dispersão e bolhas, com regressões, clusters e matriz de dispersão (disponível);
- **calendar**: calendários de dias, com mapa de calor, círculos e desenho próprio por dia (disponível);
- **radar**: radar (teia) de indicadores, com vários polígonos por série e vários radares (disponível);
- **boxplot**: caixas de bigodes, prontas ou calculadas a partir dos valores (disponível);
- **heatmap**: mapas de calor cartesianos e matrizes de correlação (disponível);
- **graph**: grafos e redes, com layout de forças, circular ou fixo (disponível);
- **tree**: árvores de hierarquias, em quatro orientações ou radial (disponível);
- **parallel**: coordenadas paralelas, com seleção nos eixos (disponível);
- **sankey**: diagramas de fluxos (disponível);
- **funnel**: funis e pirâmides (disponível);
- **matrix**: matrizes e grelhas, com gráficos dentro das células (disponível);
- **custom**: séries desenhadas com renderItem (disponível);
- outras no futuro: profundidade do order book, treemaps…

As famílias não dependem umas das outras. Uma app que só usa heatmaps não precisa de carregar o código das velas.

## Como se importa

```ts
import { createTerminal } from 'openchartscandle/candlestick'; // recomendado
import { createTerminal } from 'openchartscandle';             // também funciona (compatibilidade)
import 'openchartscandle/style.css';                           // estilos de todas as famílias
```

Cada família é uma entrada própria no `package.json` (`exports`) e no build (`vite.lib.config.ts`).

## Onde fica cada coisa

| Parte | Caminho |
|---|---|
| Código | `src/<familia>/` com um `index.ts` (a API pública da família) |
| Estilos | `src/<familia>/styles/`, com classes prefixadas para não colidirem (candlestick usa `tc-`) |
| Docs | `docs/<familia>/*.md` |
| Testes | `tests/<familia>/*.test.ts` |
| Exemplos | `demo/<familia>/examples/*.ts` (cada um exporta `mount(el)`, que devolve uma função de limpeza) |
| Dados de demo | `demo/<familia>/data/` |

## Acrescentar uma família nova (exemplo: heatmap)

1. **Código:** cria `src/heatmap/index.ts` com a API pública (por exemplo `createHeatmap(el, opções)`).
2. **Raiz:** em `src/index.ts`, junta `export * as heatmap from './heatmap';` (ou exports com nomes próprios, sem colidir com os da candlestick).
3. **Estilos:** se tiver CSS, acrescenta-o a `src/style.scss` (`@use './heatmap/styles/main';`). Usa um prefixo próprio, por exemplo `hm-` (a candlestick usa `tc-`, a pizza `pc-`, as linhas `lc-`, as barras `bc-`, o velocímetro `gc-`, o treemap `tm-`, a dispersão `sc-`, o calendário `cc-`, o radar `rc-`, o boxplot `bx-`, o heatmap `hm-`, os grafos `gr-`, as árvores `tr-`, as paralelas `pl-`, o sankey `sk-`, o funil `fn-`, a matrix `mx-` e o custom `cu-`).
4. **Build:** em `vite.lib.config.ts` acrescenta a entrada `heatmap: r('./src/heatmap/index.ts')`.
5. **package.json:** em `exports` acrescenta
   ```json
   "./heatmap": { "types": "./dist/types/heatmap/index.d.ts", "import": "./dist/heatmap.js" }
   ```
6. **Desenvolvimento:** em `vite.config.ts` acrescenta o alias `openchartscandle/heatmap` → `src/heatmap/index.ts`, e em `tsconfig.json` o `paths` equivalente.
7. **Testes:** em `tests/heatmap/`.
8. **Docs:** em `docs/heatmap/`.
9. **Site:** cria os exemplos em `demo/heatmap/examples/`, e em `demo/site/registry.ts` passa a família de `soon: true` para a lista de exemplos e docs.
10. **Versão:** uma família nova é uma versão **minor** (`npm run release:minor`), com a entrada no `CHANGELOG.md`.
