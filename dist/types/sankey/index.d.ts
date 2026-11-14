/**
 * openchartscandle/sankey — diagramas de Sankey: fluxos entre nós em colunas (ou linhas), com a altura de cada nó
 * proporcional ao valor, ligações coloridas pela origem, pelo destino ou em gradiente, destaque das adjacências,
 * nós que se arrastam, níveis, tooltip e atualizações animadas.
 */
export { SANKEY_COLORS, SankeyChart, createSankeyChart, sankeyDarkTheme, sankeyLightTheme } from './sankey';
export { sankeyLayout, sankeyLinkBreadths } from './layout';
export type { SankeyLayoutLink, SankeyLayoutLinkInput, SankeyLayoutNode, SankeyLayoutNodeInput, SankeyLayoutOptions, SankeyLayoutResult } from './layout';
export type { SankeyEvent, SankeyInfo, SankeyItemStyle, SankeyLabel, SankeyLevel, SankeyLineStyle, SankeyLink, SankeyLinkColor, SankeyLinkInfo, SankeyNode, SankeyNodeAlign, SankeyNodeInfo, SankeyOptions, SankeyTheme, } from './types';
