import { SCATTER_COLORS, ScatterChart } from './scatter';
import type { ScatterPointInfo, ScatterSeries, ScatterTheme, ScatterValue } from './types';

export interface ScatterMatrixOptions {
  /** Rows of values, in the order of `dimensions` */
  rows: ScatterValue[][];
  /** Names of the numeric columns to cross (indexes into each row are 0, 1, 2…) */
  dimensions: string[];
  /** Index of the column with the group (color) of each row, e.g. the species */
  groupBy?: number;
  /** Which columns to show (default: every dimension except `groupBy`) */
  columns?: number[];
  colors?: string[];
  theme?: 'dark' | 'light' | Partial<ScatterTheme>;
  background?: string;
  /** Diameter px. Default 5 */
  symbolSize?: number;
  /** Drag in any cell to select rows in every cell. Default true */
  brush?: boolean;
  /** Space between cells px. Default 6 */
  gap?: number;
  format?: (v: number, dimension: number) => string;
  /** Legend of the groups. Default true when there are groups */
  legend?: boolean;
}

/**
 * Scatter matrix: every pair of columns in a grid of small scatter charts, colored by group, with
 * a brush that selects the same rows in every cell.
 */
export class ScatterMatrix {
  readonly root: HTMLElement;
  readonly charts: ScatterChart[] = [];
  private grid: HTMLElement;
  private legendEl: HTMLElement | null = null;
  private handlers = new Set<(rows: number[]) => void>();
  private opts: ScatterMatrixOptions;
  private hidden = new Set<string>();

  constructor(container: HTMLElement, options: ScatterMatrixOptions) {
    this.opts = options;
    this.root = container;
    container.classList.add('sc-matrix');
    this.grid = document.createElement('div');
    this.grid.className = 'sc-matrix__grid';
    container.append(this.grid);
    this.build();
  }

  private columns(): number[] {
    const o = this.opts;
    return o.columns ?? o.dimensions.map((_, i) => i).filter((i) => i !== o.groupBy);
  }

  private groups(): string[] {
    const g = this.opts.groupBy;
    if (g === undefined) return [''];
    return [...new Set(this.opts.rows.map((r) => String(r[g])))];
  }

  private build(): void {
    const o = this.opts;
    const cols = this.columns();
    const n = cols.length;
    const groups = this.groups();
    const palette = o.colors ?? SCATTER_COLORS;
    const dark = o.theme !== 'light' && (typeof o.theme !== 'object' || !o.theme.background?.startsWith('#f'));
    this.grid.style.gap = `${o.gap ?? 6}px`;
    this.grid.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    this.grid.style.gridTemplateRows = `repeat(${n}, minmax(0, 1fr))`;
    if (o.groupBy !== undefined && o.legend !== false) {
      this.legendEl = document.createElement('div');
      this.legendEl.className = 'sc-matrix__legend';
      this.legendEl.innerHTML = groups
        .map((g, i) => `<button type="button" data-g="${g}"><i style="background:${palette[i % palette.length]}"></i>${g}</button>`)
        .join('');
      this.legendEl.addEventListener('click', (e) => {
        const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
        if (!b) return;
        const g = b.dataset.g!;
        const h = !this.hidden.has(g);
        if (h) this.hidden.add(g);
        else this.hidden.delete(g);
        b.classList.toggle('is-off', h);
        for (const c of this.charts) c.toggle(g, h);
      });
      this.root.prepend(this.legendEl);
    }
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const cell = document.createElement('div');
        cell.className = 'sc-matrix__cell';
        this.grid.append(cell);
        const dx = cols[c];
        const dy = cols[r];
        if (r === c) {
          cell.classList.add('sc-matrix__name');
          cell.style.color = dark ? '#d1d4dc' : '#131722';
          cell.textContent = o.dimensions[dx];
          continue;
        }
        const series: ScatterSeries[] = groups.map((g, gi) => ({
          id: g || 'dados',
          name: g || 'dados',
          color: palette[gi % palette.length],
          symbolSize: o.symbolSize ?? 5,
          data: o.rows
            .map((row, i) => ({ row, i }))
            .filter(({ row }) => o.groupBy === undefined || String(row[o.groupBy]) === g)
            .map(({ row, i }) => ({ x: row[dx] as number, y: row[dy] as number, id: i, data: i })),
        }));
        const chart = new ScatterChart(cell, {
          series,
          theme: o.theme,
          background: o.background,
          padding: 2,
          legend: { show: false },
          brush: o.brush ?? true,
          dimensions: [o.dimensions[dx], o.dimensions[dy]],
          valueFormatter: o.format ? (v, d) => o.format!(v, d === 0 ? dx : dy) : undefined,
          xAxis: { show: r === n - 1, ticks: 3, line: false, grid: true },
          yAxis: { show: c === 0, ticks: 3, grid: true },
          animation: { duration: 400 },
        });
        chart.on('brush', (pts: ScatterPointInfo[]) => {
          const rows = pts.map((p) => p.data as number);
          this.applySelection(pts.length ? new Set(rows) : null, chart);
          this.handlers.forEach((h) => h(rows));
        });
        this.charts.push(chart);
      }
    }
  }

  private applySelection(rows: Set<number> | null, except?: ScatterChart): void {
    for (const c of this.charts) if (c !== except) c.select(rows ? (p) => rows.has(p.data as number) : null);
  }

  /** Highlight these rows (indexes) in every cell; null clears. */
  select(rows: number[] | null): void {
    this.applySelection(rows ? new Set(rows) : null);
  }

  /** Rows selected with the brush (indexes into `rows`). */
  on(event: 'brush', handler: (rows: number[]) => void): () => void {
    void event;
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  destroy(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts.length = 0;
    this.grid.remove();
    this.legendEl?.remove();
    this.root.classList.remove('sc-matrix');
  }
}

export function createScatterMatrix(container: HTMLElement, options: ScatterMatrixOptions): ScatterMatrix {
  return new ScatterMatrix(container, options);
}
