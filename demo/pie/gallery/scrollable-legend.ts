import { createPieChart, type PieDatum } from 'openchartscandle/pie';

// Muitas fatias: a legenda à direita faz scroll. Clica num nome para esconder a fatia.
const FIRST = ['Ana', 'Bruno', 'Carla', 'Diogo', 'Eva', 'Filipe', 'Gabriela', 'Hugo', 'Inês', 'João', 'Leonor', 'Miguel', 'Nuno', 'Olga', 'Pedro', 'Rita', 'Sofia', 'Tiago', 'Vera', 'Xavier'];
const LAST = ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Costa', 'Martins', 'Sousa', 'Rodrigues', 'Gomes', 'Lopes'];

export function mount(el: HTMLElement): () => void {
  let s = 17;
  const rnd = (): number => (s = (s * 16807) % 2147483647) / 2147483647;
  const data: PieDatum[] = Array.from({ length: 50 }, (_, i) => ({
    label: `${FIRST[i % FIRST.length]} ${LAST[Math.floor(rnd() * LAST.length)]}`,
    id: `p${i}`,
    value: Math.round(rnd() * 100000),
  }));
  const chart = createPieChart(el, {
    title: 'Vendas por vendedor',
    data,
    labels: { show: false },
    legend: { position: 'right', values: false, fontSize: 12 },
    valueFormatter: (v) => `${v.toLocaleString('pt-PT')} €`,
  });
  return () => chart.destroy();
}
