import { createPieChart, type PieSlice } from 'openchartscandle/pie';
import { eur, portfolio } from '../data';

// Tooltip personalizado: o formatter recebe a fatia e o total e devolve HTML.
// Aqui mostra o valor, a % e quanto falta para a meta de cada classe de ativo.
const targets: Record<string, number> = { 'Ações EUA': 40, 'Ações Europa': 20, Obrigações: 20, Cripto: 5, Ouro: 10, Liquidez: 5 };

function tooltip(s: PieSlice, total: number): string {
  const target = targets[s.label] ?? 0;
  const diff = s.percent - target;
  const action = Math.abs(diff) < 0.5 ? 'Na meta ✔' : diff > 0 ? `Vender ${eur((diff / 100) * total)}` : `Comprar ${eur((-diff / 100) * total)}`;
  return `
    <div style="display:flex;align-items:center;gap:8px;font-weight:700">
      <span style="width:10px;height:10px;border-radius:50%;background:${s.color}"></span>${s.label}
    </div>
    <div style="font-size:18px;font-weight:700;margin:6px 0 2px">${eur(s.value)}</div>
    <div style="opacity:.75">${s.percent.toFixed(1)}% da carteira · meta ${target}%</div>
    <div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(128,128,128,.3);color:${diff > 0.5 ? '#f23645' : diff < -0.5 ? '#089981' : 'inherit'}">${action}</div>`;
}

export function mount(el: HTMLElement): () => void {
  const chart = createPieChart(el, {
    data: portfolio,
    innerRadius: 0.6,
    padAngle: 1,
    valueFormatter: eur,
    tooltip: { formatter: tooltip },
    center: { title: 'Rebalancear?' },
  });

  return () => chart.destroy();
}
