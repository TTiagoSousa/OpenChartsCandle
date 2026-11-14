/**
 * openchartscandle/treemap — treemaps e sunbursts de uma árvore: retângulos ou anéis proporcionais ao valor,
 * cores por nível (paleta, saturação, gradiente por valor ou visualMap), cantos arredondados, raios por nível, etiquetas e cabeçalhos dos pais,
 * clique para entrar com breadcrumb, tooltip e transições animadas (zoom, dados, treemap ↔ sunburst).
 */
export { CHANGE_COLORS, TREEMAP_COLORS, TreemapChart, createTreemap, treemapDarkTheme, treemapLightTheme } from './treemap';
export { fromPaths, treeTotal } from './tree';
export { squarify, type Box } from './layout';
export { gradientAt, mix } from '../shared/color';
export type { TreeNode, TreeValue, TreemapEvent, TreemapFocus, TreemapItemStyle, TreemapLabelOptions, TreemapLength, TreemapLevel, TreemapNodeInfo, TreemapOptions, TreemapSunburstOptions, TreemapTheme, TreemapType, TreemapUpperLabelOptions, TreemapVisualMap, } from './types';
