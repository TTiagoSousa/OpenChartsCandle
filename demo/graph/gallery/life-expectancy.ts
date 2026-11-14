import { createGraphChart, type GraphLink, type GraphNode } from 'openchartscandle/graph';
import { countries, YEARS, type CountryYear } from '../data';

// Rendimento (PIB por pessoa, eixo logarítmico) e esperança de vida de seis países de 1950 a 2015: um nó
// por país e ano, ligado ao ano seguinte, com o nome no último. Clica na legenda para esconder um país.
// Valores aproximados e interpolados (os mesmos do exemplo de dispersão).
const PICK = ['China', 'Índia', 'Portugal', 'Estados Unidos', 'Nigéria', 'Brasil'];

export function mount(el: HTMLElement): () => void {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  for (const year of YEARS)
    for (const c of countries(year)) {
      if (!PICK.includes(c.name)) continue;
      const id = `${c.name}-${year}`;
      const last = year === YEARS[YEARS.length - 1];
      nodes.push({ id, name: `${c.name} ${year}`, x: c.gdp, y: c.life, value: year, category: c.name, size: last ? 12 : 7, label: last ? { format: () => c.name } : false });
      if (year > YEARS[0]) links.push({ source: `${c.name}-${year - 5}`, target: id });
    }
  const data = new Map<string, CountryYear>(YEARS.flatMap((y) => countries(y).map((c): [string, CountryYear] => [`${c.name}-${y}`, c])));
  const chart = createGraphChart(el, {
    nodes,
    links,
    categories: PICK,
    axes: {
      x: { type: 'log', min: 300, max: 200000, name: 'PIB por pessoa (US$)', format: (v) => (v >= 1000 ? `${v / 1000}k` : String(v)) },
      y: { min: 25, max: 90, name: 'Esperança de vida (anos)' },
    },
    label: { show: true, fontWeight: 600 },
    edge: { color: 'source', width: 1.5, opacity: 0.7, arrow: true, arrowSize: 5 },
    tooltip: {
      formatter: (p) => {
        const c = p.type === 'node' ? data.get(p.node!.id) : null;
        return c ? `<b>${c.name} ${c.year}</b><br>PIB por pessoa: ${Math.round(c.gdp).toLocaleString('pt-PT')} US$<br>Esperança de vida: ${c.life.toFixed(1)} anos` : p.name;
      },
    },
    legend: { position: 'right' },
  });
  return () => chart.destroy();
}
