import { createScatterChart, type ScatterSymbol } from 'openchartscandle/scatter';

// Os símbolos transformam-se uns nos outros: a cada 1,6 s todos os pontos mudam de forma e de lugar
// (círculo, quadrado, triângulo, losango, pino, seta, estrela…) e cada contorno passa suavemente para o seguinte.
const SYMBOLS: ScatterSymbol[] = ['circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'star', 'cross'];
const N = 36;

function layout(step: number): { x: number; y: number }[] {
  return Array.from({ length: N }, (_, i) => {
    const kind = step % 3;
    if (kind === 0) {
      const a = (i / N) * Math.PI * 2;
      return { x: 50 + Math.cos(a) * 38, y: 50 + Math.sin(a) * 38 };
    }
    if (kind === 1) return { x: 12 + (i % 6) * 15, y: 12 + Math.floor(i / 6) * 15 };
    const a = i * 0.5;
    return { x: 50 + Math.cos(a) * (6 + i * 1.1), y: 50 + Math.sin(a) * (6 + i * 1.1) };
  });
}

export function mount(el: HTMLElement): () => void {
  let step = 0;
  const series = () => [
    {
      name: 'Formas',
      symbol: SYMBOLS[step % SYMBOLS.length],
      symbolSize: 18,
      opacity: 0.9,
      data: layout(step).map((p, i) => ({ ...p, id: i, color: `hsl(${(i * 10 + step * 40) % 360}, 70%, 58%)` })),
    },
  ];
  const chart = createScatterChart(el, {
    series: series(),
    title: { text: SYMBOLS[0], align: 'left' },
    xAxis: { min: 0, max: 100, show: false },
    yAxis: { min: 0, max: 100, show: false },
    aspect: 'equal',
    animation: { duration: 900 },
  });
  const timer = window.setInterval(() => {
    step++;
    chart.setOptions({ title: { text: SYMBOLS[step % SYMBOLS.length], align: 'left' } }, false);
    chart.setSeries(series());
  }, 1600);
  return () => {
    clearInterval(timer);
    chart.destroy();
  };
}
