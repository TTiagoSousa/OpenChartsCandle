import { createPieChart, type PieChart } from 'openchartscandle/pie';

// Disposição automática: várias pizzas sem posições definidas arrumam-se sozinhas numa grelha
// que se adapta à largura (CSS grid com auto-fill). Uma pizza por região.
const REGIONS: Record<string, number[]> = {
  Norte: [42, 28, 18, 12],
  Centro: [35, 30, 20, 15],
  Lisboa: [25, 22, 38, 15],
  Alentejo: [55, 15, 10, 20],
  Algarve: [20, 18, 45, 17],
  Açores: [30, 40, 15, 15],
  Madeira: [28, 25, 35, 12],
};
const KINDS = ['Indústria', 'Serviços', 'Turismo', 'Agricultura'];

export function mount(el: HTMLElement): () => void {
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));grid-auto-rows:150px;gap:6px;height:100%;overflow:auto;padding:4px;box-sizing:border-box;color-scheme:dark;scrollbar-width:thin';
  el.append(grid);
  const charts: PieChart[] = Object.entries(REGIONS).map(([name, values]) => {
    const host = document.createElement('div');
    grid.append(host);
    return createPieChart(host, {
      title: name,
      data: values.map((value, i) => ({ label: KINDS[i], value })),
      innerRadius: 0.45,
      center: { show: false },
      labels: { show: false },
      legend: { show: false },
      hoverOffset: 4,
    });
  });
  return () => {
    charts.forEach((c) => c.destroy());
    grid.remove();
  };
}
