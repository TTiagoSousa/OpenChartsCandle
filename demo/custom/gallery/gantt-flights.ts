import { createCustomChart } from 'openchartscandle/custom';
import { flights } from '../data';

// Gantt das portas de embarque de um aeroporto num dia: cada voo ocupa a sua porta da chegada à partida.
// Arrasta um voo para outra porta ou outra hora (encaixa de 5 em 5 minutos); a roda faz zoom nas horas.
export function mount(el: HTMLElement): () => void {
  const gates = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'];
  let data = flights();
  const hm = (t: number): string => new Date(t).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  let drag: { i: number; start: number; at: number } | null = null;
  const chart = createCustomChart(el, {
    xAxis: { type: 'time', splitLine: true },
    yAxis: { type: 'category', data: gates, inverse: true, splitLine: true },
    zoom: { axis: 'x' },
    series: [
      {
        name: 'Voos',
        data,
        encode: { x: [1, 2], y: 0 },
        tooltip: (p) => `<b>${p.value[3]}</b> → ${p.value[4]}<br>Porta ${p.value[0]} · ${hm(p.value[1] as number)}–${hm(p.value[2] as number)}`,
        renderItem: (p, api) => {
          const [x0, y] = api.coord([api.value(1), api.value(0)]);
          const [x1] = api.coord([api.value(2), api.value(0)]);
          const h = api.size([0, 1])[1] * 0.62;
          const active = drag?.i === p.dataIndex;
          return {
            type: 'rect',
            id: `f${p.dataIndex}`,
            shape: { x: x0, y: y - h / 2, width: Math.max(2, x1 - x0), height: h, r: 3 },
            style: { fill: active ? '#ff9800' : p.dataIndex % 3 ? '#2962ff' : '#00bcd4', shadowBlur: active ? 10 : 0, shadowColor: 'rgba(0,0,0,0.5)' },
            label: { text: api.value(3), position: 'insideLeft', fontSize: 10, fontWeight: 600 },
            draggable: true,
          };
        },
      },
    ],
    animation: { duration: 350 },
  });
  const set = (i: number, gate: unknown, start: number, animate: boolean): void => {
    const f = data[i];
    const d = f[2] - f[1];
    data = data.map((x, k) => (k === i ? [typeof gate === 'string' ? gate : x[0], start, start + d, x[3], x[4]] : x));
    chart.setData(data, 0, animate);
  };
  chart.on('dragstart', (e) => (drag = { i: e.dataIndex, start: data[e.dataIndex][1], at: Number(e.at[0]) }));
  chart.on('drag', (e) => drag && set(drag.i, e.at[1], drag.start + Number(e.at[0]) - drag.at, false));
  chart.on('dragend', (e) => {
    if (!drag) return;
    const step = 5 * 6e4;
    const i = drag.i;
    const t = Math.round((drag.start + Number(e.at[0]) - drag.at) / step) * step;
    drag = null;
    set(i, e.at[1], t, true);
  });
  return () => chart.destroy();
}
