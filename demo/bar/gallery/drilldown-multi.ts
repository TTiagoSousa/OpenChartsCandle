import { createBarChart } from 'openchartscandle/bar';

// Drilldown em vários níveis: Continentes → Países → Cidades; o caminho em cima volta a qualquer nível.
type Node = number | { [name: string]: Node };
const WORLD: Record<string, Node> = {
  Europa: {
    Portugal: { Lisboa: 545, Porto: 232, Braga: 193, Coimbra: 140 },
    Espanha: { Madrid: 3305, Barcelona: 1620, Valência: 791, Sevilha: 684 },
    França: { Paris: 2161, Marselha: 870, Lyon: 516, Toulouse: 479 },
  },
  América: {
    Brasil: { 'São Paulo': 12325, Rio: 6748, Brasília: 3055, Salvador: 2887 },
    EUA: { 'Nova Iorque': 8336, 'Los Angeles': 3979, Chicago: 2693 },
  },
  Ásia: {
    Japão: { Tóquio: 13960, Osaka: 2691, Nagoya: 2296 },
    Índia: { Mumbai: 12442, Deli: 11034, Bangalore: 8443 },
  },
};

const total = (n: Node): number => (typeof n === 'number' ? n : Object.values(n).reduce((a: number, c) => a + total(c), 0));

export function mount(el: HTMLElement): () => void {
  el.style.position = 'relative';
  const path: string[] = [];
  const nodeAt = (p: string[]): Record<string, Node> => p.reduce((n, k) => n[k] as Record<string, Node>, WORLD);
  const dataAt = (p: string[]) => {
    const n = nodeAt(p);
    return { categories: Object.keys(n), series: [{ name: p[p.length - 1] ?? 'Mundo', data: Object.values(n).map(total) }] };
  };
  const first = dataAt(path);
  const chart = createBarChart(el, { ...first, labels: { show: true }, legend: { show: false }, valueFormatter: (v) => `${v.toLocaleString('pt-PT')} mil` });
  const crumbs = document.createElement('div');
  crumbs.style.cssText = 'position:absolute;right:16px;top:8px;z-index:2;font-size:12px;display:flex;gap:6px';
  el.append(crumbs);
  const go = (p: string[]): void => {
    path.splice(0, path.length, ...p);
    const d = dataAt(path);
    chart.setData(d.categories, d.series);
    crumbs.replaceChildren(
      ...['Mundo', ...path].map((name, i) => {
        const a = document.createElement('a');
        a.textContent = i ? `› ${name}` : name;
        a.style.cssText = `cursor:pointer;${i === path.length ? 'font-weight:700' : 'opacity:.7'}`;
        a.addEventListener('click', () => go(path.slice(0, i)));
        return a;
      }),
    );
  };
  const off = chart.on('click', (d) => {
    if (typeof nodeAt(path)[d.category] === 'object') go([...path, d.category]);
  });
  go([]);
  return () => {
    off();
    chart.destroy();
    crumbs.remove();
  };
}
