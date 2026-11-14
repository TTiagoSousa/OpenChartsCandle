import { createPieChart, type PieChart } from 'openchartscandle/pie';

// Calendário com uma pizza em cada dia: como se dividiram as horas entre trabalho, lazer e sono.
// Os fins de semana têm menos trabalho. Passa o rato para ver as horas.
const KINDS = ['Trabalho', 'Lazer', 'Sono'];
const COLORS = ['#2962ff', '#ff9800', '#7e57c2'];
const WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function mount(el: HTMLElement): () => void {
  const year = 2026;
  const month = 9; // outubro
  const days = new Date(year, month + 1, 0).getDate();
  const first = (new Date(year, month, 1).getDay() + 6) % 7; // monday = 0
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;height:100%;padding:6px;box-sizing:border-box;gap:4px';
  const head = document.createElement('div');
  head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;font-size:13px';
  head.innerHTML = `<b>Outubro ${year}</b><span style="display:flex;gap:10px;font-size:11px">${KINDS.map((k, i) => `<span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${COLORS[i]};margin-right:4px"></i>${k}</span>`).join('')}</span>`;
  const grid = document.createElement('div');
  grid.style.cssText = 'flex:1;min-height:0;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:3px';
  for (const d of WEEK) {
    const c = document.createElement('div');
    c.textContent = d;
    c.style.cssText = 'font-size:11px;opacity:.6;text-align:center;align-self:end';
    grid.append(c);
  }
  grid.style.gridTemplateRows = `18px repeat(${Math.ceil((first + days) / 7)}, minmax(0,1fr))`;
  wrap.append(head, grid);
  el.append(wrap);
  for (let i = 0; i < first; i++) grid.append(document.createElement('div'));
  let seed = 5;
  const rnd = (): number => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const charts: PieChart[] = [];
  for (let d = 1; d <= days; d++) {
    const weekend = (first + d - 1) % 7 >= 5;
    const work = weekend ? Math.round(rnd() * 3) : 6 + Math.round(rnd() * 4);
    const sleep = 6 + Math.round(rnd() * 3);
    const cell = document.createElement('div');
    cell.style.cssText = 'position:relative;border:1px solid rgba(120,123,134,.18);border-radius:4px;min-width:0;min-height:0';
    const n = document.createElement('span');
    n.textContent = String(d);
    n.style.cssText = 'position:absolute;top:1px;left:4px;font-size:10px;opacity:.6;z-index:1;pointer-events:none';
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;inset:2px';
    cell.append(n, host);
    grid.append(cell);
    charts.push(
      createPieChart(host, {
        data: [work, 24 - work - sleep, sleep].map((value, i) => ({ label: KINDS[i], value, color: COLORS[i] })),
        background: 'transparent',
        innerRadius: 0.3,
        center: { show: false },
        labels: { show: false },
        legend: { show: false },
        hoverOffset: 2,
        selectable: false,
        animation: false,
        valueFormatter: (v) => `${v} h`,
        tooltip: { formatter: (s) => `<b>${d} out.</b><br>${s.label}: ${s.value} h` },
      }),
    );
  }
  return () => {
    charts.forEach((c) => c.destroy());
    wrap.remove();
  };
}
