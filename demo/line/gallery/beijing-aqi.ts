import { createLineChart, type LinePoint } from 'openchartscandle/line';

// Índice de qualidade do ar diário: a linha muda de cor por nível (valuePieces),
// com linhas de referência nos limites e a barra de zoom em baixo.
const LEVELS = [
  { to: 50, color: '#93ce07', label: 'Bom' },
  { from: 50, to: 100, color: '#fbdb0f', label: 'Moderado' },
  { from: 100, to: 150, color: '#fc7d02', label: 'Sensível' },
  { from: 150, to: 200, color: '#fd0100', label: 'Mau' },
  { from: 200, to: 300, color: '#aa069f', label: 'Muito mau' },
  { from: 300, color: '#ac3b2a', label: 'Perigoso' },
];

function makeData(): LinePoint[] {
  let seed = 3;
  const rand = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const start = Date.UTC(2021, 0, 1) / 1000;
  let v = 80;
  return Array.from({ length: 1460 }, (_, i) => {
    const winter = 1 + 0.6 * Math.cos(((i % 365) / 365) * Math.PI * 2);
    v = Math.max(15, v * 0.75 + (rand() * 90 + (rand() > 0.93 ? 220 : 0)) * 0.25 * winter);
    return { x: start + i * 86400, y: Math.round(v) };
  });
}

export function mount(el: HTMLElement): () => void {
  const chart = createLineChart(el, {
    series: [{ name: 'AQI', data: makeData(), width: 1.5, valuePieces: LEVELS }],
    zoom: { slider: true, start: 70, end: 100 },
    legend: { show: false },
    annotations: { y: [50, 100, 150, 200, 300].map((value) => ({ value, color: 'rgba(149,152,161,0.6)', dash: [3, 4] })) },
    valueFormatter: (v) => `${v} · ${LEVELS.find((l) => v >= (l.from ?? -1) && v <= (l.to ?? Infinity))!.label}`,
  });
  return () => chart.destroy();
}
