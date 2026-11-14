import { createCustomChart, customPack, type CustomPackedNode } from 'openchartscandle/custom';
import { SECTORS } from '../data';

// Empacotamento de círculos (sem d3: customPack() usa o mesmo algoritmo de cadeia frontal): o mercado
// dividido em setores e cada setor nas suas empresas, com a área proporcional à capitalização.
// Clica num setor para entrar nele (zoom animado); clica fora ou no fundo para voltar.
export function mount(el: HTMLElement): () => void {
  const colors = ['#2962ff', '#00bcd4', '#089981', '#ff9800', '#e91e63', '#9c27b0', '#8bc34a', '#ffc107', '#f23645', '#607d8b', '#3f51b5'];
  const nodes = customPack(
    { name: 'Mercado', children: Object.entries(SECTORS).map(([s, list]) => ({ name: s, children: list.map(([t, v]) => ({ name: t, value: v })) })) },
    { width: 1000, height: 1000, padding: 6 },
  );
  const sectorOf = (n: CustomPackedNode): CustomPackedNode => (n.depth <= 1 ? n : sectorOf(n.parent!));
  const sectors = nodes.filter((n) => n.depth === 1);
  let focus = nodes[0];
  const chart = createCustomChart(el, {
    coordinateSystem: 'none',
    animation: { duration: 750, easing: 'cubicInOut' },
    series: [
      {
        name: 'Mercado',
        data: nodes,
        emphasis: { style: { stroke: '#ffffff', lineWidth: 2 } },
        tooltip: (p) => {
          const n = nodes[p.dataIndex];
          return n.depth ? `<b>${n.data.name}</b>${n.depth === 2 ? ` · ${n.parent!.data.name}` : ''}<br>${n.value.toLocaleString('pt-PT')} mil M$` : '';
        },
        renderItem: (p, api) => {
          const n = nodes[p.dataIndex];
          const R = api.rect;
          const k = (Math.min(R.width, R.height) / 2 - 4) / focus.r;
          const x = R.x + R.width / 2 + (n.x - focus.x) * k;
          const y = R.y + R.height / 2 + (n.y - focus.y) * k;
          const r = n.r * k;
          const c = n.depth ? colors[sectors.indexOf(sectorOf(n)) % colors.length] : '#ffffff';
          const showName = n.depth === 2 ? r > 14 : n.depth === 1 && (focus === n ? false : r > 30 && focus.depth === 0);
          return {
            type: 'group',
            children: [
              {
                type: 'circle',
                id: `c${p.dataIndex}`,
                shape: { cx: x, cy: y, r },
                style: n.depth === 0 ? { fill: 'rgba(255,255,255,0.03)', stroke: 'rgba(255,255,255,0.12)' } : n.depth === 1 ? { fill: c, fillOpacity: 0.16, stroke: c, lineWidth: 1 } : { fill: c, fillOpacity: 0.85 },
                silent: n.depth === 0,
              },
              showName
                ? {
                    type: 'text',
                    id: `t${p.dataIndex}`,
                    x,
                    y: n.depth === 1 ? y - r + 6 : y,
                    silent: true,
                    style: { text: n.data.name, fill: n.depth === 1 ? c : '#ffffff', fontSize: n.depth === 1 ? 11 : Math.min(12, Math.max(8, r / 3)), fontWeight: 600, align: 'center', verticalAlign: n.depth === 1 ? 'top' : 'middle' },
                  }
                : null,
            ],
          };
        },
      },
    ],
  });
  chart.on('click', (e) => {
    const n = nodes[e.dataIndex];
    const target = n.depth === 1 ? n : n.depth === 2 ? (focus === n.parent ? nodes[0] : n.parent!) : nodes[0];
    focus = target === focus ? nodes[0] : target;
    chart.refresh(true);
  });
  const back = (e: MouseEvent): void => {
    if (e.target === chart.canvas && focus !== nodes[0] && chart.canvas.style.cursor !== 'pointer') {
      focus = nodes[0];
      chart.refresh(true);
    }
  };
  el.addEventListener('click', back);
  return () => {
    el.removeEventListener('click', back);
    chart.destroy();
  };
}
