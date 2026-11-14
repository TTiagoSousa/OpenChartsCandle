import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const r = (p: string): string => fileURLToPath(new URL(p, import.meta.url));

/**
 * Library build — one entry per chart family + the root:
 *   dist/openchartscandle.js   → `openchartscandle`              (root, re-exports every family)
 *   dist/candlestick.js     → `openchartscandle/candlestick`  (velas estilo TradingView)
 *   dist/pie.js             → `openchartscandle/pie`          (pizza, donut, gauge, rosa)
 *   dist/line.js            → `openchartscandle/line`         (linhas e áreas)
 *   dist/bar.js             → `openchartscandle/bar`          (barras e colunas)
 *   dist/gauge.js           → `openchartscandle/gauge`        (velocímetros)
 *   dist/treemap.js         → `openchartscandle/treemap`      (treemap e sunburst)
 *   dist/scatter.js         → `openchartscandle/scatter`      (dispersão e bolhas)
 *   dist/calendar.js        → `openchartscandle/calendar`     (calendários)
 *   dist/radar.js           → `openchartscandle/radar`        (radar / teia)
 *   dist/boxplot.js         → `openchartscandle/boxplot`      (caixas de bigodes)
 *   dist/heatmap.js         → `openchartscandle/heatmap`      (mapas de calor)
 *   dist/graph.js           → `openchartscandle/graph`        (grafos e redes)
 *   dist/tree.js            → `openchartscandle/tree`         (árvores)
 *   dist/parallel.js        → `openchartscandle/parallel`     (coordenadas paralelas)
 *   dist/sankey.js          → `openchartscandle/sankey`       (fluxos sankey)
 *   dist/funnel.js          → `openchartscandle/funnel`       (funis)
 *   dist/matrix.js          → `openchartscandle/matrix`       (matrizes e grelhas)
 *   dist/custom.js          → `openchartscandle/custom`       (séries próprias)
 *   dist/style.css          → `openchartscandle/style.css`
 * New families get their own entry here.
 */
export default defineConfig({
  publicDir: false,
  build: {
    outDir: r('./dist'),
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: {
        'openchartscandle': r('./src/bundle.ts'),
        candlestick: r('./src/candlestick/index.ts'),
        pie: r('./src/pie/index.ts'),
        line: r('./src/line/index.ts'),
        bar: r('./src/bar/index.ts'),
        gauge: r('./src/gauge/index.ts'),
        treemap: r('./src/treemap/index.ts'),
        scatter: r('./src/scatter/index.ts'),
        calendar: r('./src/calendar/index.ts'),
        radar: r('./src/radar/index.ts'),
        graph: r('./src/graph/index.ts'),
        heatmap: r('./src/heatmap/index.ts'),
        boxplot: r('./src/boxplot/index.ts'),
        tree: r('./src/tree/index.ts'),
        sankey: r('./src/sankey/index.ts'),
        parallel: r('./src/parallel/index.ts'),
        funnel: r('./src/funnel/index.ts'),
        matrix: r('./src/matrix/index.ts'),
        custom: r('./src/custom/index.ts'),
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
      cssFileName: 'style',
    },
    rollupOptions: {
      // stable names for code shared between entries (no hashes → clean diffs between releases)
      output: {
        // a family's code is named after its folder (src/bar/… → chunks/bar.js), whatever module
        // the bundler picks as the chunk name; shared helpers keep their own names
        chunkFileNames: (chunk) => {
          const families = new Set(chunk.moduleIds.map((id) => id.replace(/\\/g, '/').match(/\/src\/([^/]+)\//)?.[1]).filter(Boolean));
          const [family] = [...families];
          return families.size === 1 && family !== 'shared' ? `chunks/${family}.js` : 'chunks/[name].js';
        },
      },
    },
  },
});
