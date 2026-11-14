import { createLineChart, type LinePoint } from 'openchartscandle/line';

// Cinco dias de negociação seguidos: as noites, os fins de semana e a pausa de almoço ficam
// escondidos. O botão mostra o tempo real (sem quebras), para ver a diferença.
const H = 3600;

function build(): { data: LinePoint[]; breaks: { from: number; to: number }[] } {
  let s = 21;
  const rand = (): number => ((s = (s * 16807) % 2147483647) / 2147483647);
  let v = 100;
  const data: LinePoint[] = [];
  const breaks: { from: number; to: number }[] = [];
  const first = Date.UTC(2026, 9, 12) / 1000; // Monday
  let prevClose: number | null = null;
  for (let d = 0; d < 5; d++) {
    const day = first + d * 24 * H;
    const sessions: [number, number][] = [
      [day + 9.5 * H, day + 11.5 * H],
      [day + 13 * H, day + 15 * H],
    ];
    for (const [from, to] of sessions) {
      if (prevClose !== null) breaks.push({ from: prevClose, to: from });
      for (let t = from; t <= to; t += 5 * 60) {
        v *= 1 + (rand() - 0.5) * 0.004;
        data.push({ x: t, y: +v.toFixed(2) });
      }
      prevClose = to;
    }
  }
  return { data, breaks };
}

export function mount(el: HTMLElement): () => void {
  const { data, breaks } = build();
  const btn = document.createElement('button');
  btn.className = 'ex-btn';
  btn.style.cssText = 'position:absolute;right:16px;top:12px;z-index:2';
  btn.textContent = 'Mostrar tempo real';
  el.style.position = 'relative';
  el.append(btn);
  const chart = createLineChart(el, {
    series: [{ name: 'Preço', data, width: 1.5, area: { opacity: 0.15 } }],
    xAxis: { breaks },
    zoom: { slider: true },
    legend: { show: false },
    valueFormatter: (v) => v.toFixed(2),
  });
  let on = true;
  btn.addEventListener('click', () => {
    on = !on;
    btn.textContent = on ? 'Mostrar tempo real' : 'Esconder noites e almoços';
    chart.setOptions({ xAxis: { breaks: on ? breaks : [] } });
  });
  return () => {
    chart.destroy();
    btn.remove();
  };
}
