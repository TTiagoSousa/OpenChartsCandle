/**
 * openchartscandle — coleção de gráficos financeiros.
 *
 * Cada família de gráficos vive na sua pasta e tem a sua entrada:
 *   - openchartscandle/candlestick  → velas ao estilo TradingView
 *   - openchartscandle/pie          → pizza, donut, meio donut, rosa
 *   - openchartscandle/line         → linhas e áreas com várias séries
 *   - openchartscandle/bar          → barras e colunas
 *   - openchartscandle/gauge        → velocímetros e medidores
 *   - openchartscandle/treemap      → treemap e sunburst
 *   - openchartscandle/scatter      → dispersão e bolhas
 *   - openchartscandle/calendar     → calendários (mapa de calor por dia)
 *   - openchartscandle/radar        → radar (teia de indicadores)
 *   - openchartscandle/boxplot      → caixas de bigodes
 *   - openchartscandle/heatmap      → mapas de calor
 *   - openchartscandle/graph        → grafos e redes
 *   - openchartscandle/tree         → árvores
 *   - openchartscandle/parallel     → coordenadas paralelas
 *   - openchartscandle/sankey       → fluxos sankey
 *   - openchartscandle/funnel       → funis
 *   - openchartscandle/matrix       → matrizes e grelhas
 *   - openchartscandle/custom       → séries próprias
 *
 * A raiz re-exporta a família candlestick por compatibilidade
 * (`import { createTerminal } from 'openchartscandle'` continua a funcionar).
 */
export * from './candlestick';
export * from './pie';
export * from './line';
export * from './bar';
export * from './gauge';
export * from './treemap';
export * from './scatter';
export * from './calendar';
export * from './radar';
export * from './boxplot';
export * from './heatmap';
export * from './graph';
export * from './tree';
export * from './parallel';
export * from './sankey';
export * from './funnel';
export * from './matrix';
export * from './custom';
