import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const r = (p: string): string => fileURLToPath(new URL(p, import.meta.url));

/**
 * Dev server + demo build.
 * The demos import "openchartscandle" exactly like an external app would;
 * the alias points it to the library source for instant hot reload.
 */
export default defineConfig({
  root: 'demo',
  // GitHub Pages serves the demo under /OpenChartsCandle/ (set by the pages workflow)
  base: process.env.DEMO_BASE ?? '/',
  resolve: {
    alias: [
      { find: /^openchartscandle\/style\.css$/, replacement: r('./src/style.scss') },
      { find: /^openchartscandle\/candlestick$/, replacement: r('./src/candlestick/index.ts') },
      { find: /^openchartscandle\/pie$/, replacement: r('./src/pie/index.ts') },
      { find: /^openchartscandle\/line$/, replacement: r('./src/line/index.ts') },
      { find: /^openchartscandle\/bar$/, replacement: r('./src/bar/index.ts') },
      { find: /^openchartscandle\/gauge$/, replacement: r('./src/gauge/index.ts') },
      { find: /^openchartscandle\/treemap$/, replacement: r('./src/treemap/index.ts') },
      { find: /^openchartscandle\/scatter$/, replacement: r('./src/scatter/index.ts') },
      { find: /^openchartscandle\/calendar$/, replacement: r('./src/calendar/index.ts') },
      { find: /^openchartscandle\/radar$/, replacement: r('./src/radar/index.ts') },
      { find: /^openchartscandle\/graph$/, replacement: r('./src/graph/index.ts') },
      { find: /^openchartscandle\/heatmap$/, replacement: r('./src/heatmap/index.ts') },
      { find: /^openchartscandle\/boxplot$/, replacement: r('./src/boxplot/index.ts') },
      { find: /^openchartscandle\/tree$/, replacement: r('./src/tree/index.ts') },
      { find: /^openchartscandle\/sankey$/, replacement: r('./src/sankey/index.ts') },
      { find: /^openchartscandle\/parallel$/, replacement: r('./src/parallel/index.ts') },
      { find: /^openchartscandle\/funnel$/, replacement: r('./src/funnel/index.ts') },
      { find: /^openchartscandle\/matrix$/, replacement: r('./src/matrix/index.ts') },
      { find: /^openchartscandle\/custom$/, replacement: r('./src/custom/index.ts') },
      { find: /^openchartscandle$/, replacement: r('./src/index.ts') },
    ],
  },
  server: { port: 5190, strictPort: true, watch: { ignored: ['**/lightweight-charts-master/**'] } },
  build: {
    outDir: r('./dist-demo'),
    emptyOutDir: true,
    rollupOptions: {
      input: { site: r('./demo/index.html') },
    },
  },
});
