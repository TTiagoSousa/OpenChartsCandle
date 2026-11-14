import { createLineChart, type LinePoint } from 'openchartscandle/line';

// No telemóvel: um dedo a arrastar mostra os valores (tooltip), dois dedos fazem zoom
// e a barra de baixo escolhe o intervalo. Aqui num ecrã com a largura de um telemóvel.
function makeData(): LinePoint[] {
  let seed = 9;
  const rand = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let v = 64000;
  const start = Date.UTC(2026, 0, 1) / 1000;
  return Array.from({ length: 280 }, (_, i) => {
    v *= 1 + (rand() - 0.49) * 0.03;
    return { x: start + i * 86400, y: Math.round(v) };
  });
}

export function mount(el: HTMLElement): () => void {
  const phone = document.createElement('div');
  phone.style.cssText =
    'width:min(360px,100%);height:100%;margin:0 auto;border:8px solid #2a2e39;border-radius:28px;overflow:hidden;display:flex;flex-direction:column;box-sizing:border-box';
  const head = document.createElement('div');
  head.textContent = 'BTCUSDT · toca e arrasta';
  head.style.cssText = 'font-size:12px;padding:10px 12px 0;opacity:.75';
  const box = document.createElement('div');
  box.style.cssText = 'flex:1;min-height:0';
  phone.append(head, box);
  el.append(phone);
  const chart = createLineChart(box, {
    series: [{ name: 'BTC', data: makeData(), area: true, width: 1.5 }],
    zoom: { slider: true, start: 60, end: 100 },
    legend: { show: false },
    padding: 6,
    valueFormatter: (v) => `$${v.toLocaleString('pt-PT')}`,
  });
  return () => {
    chart.destroy();
    phone.remove();
  };
}
