import { createLineChart } from 'openchartscandle/line';

// Desenho próprio com `graphic`: uma marca de água, uma caixa de texto com o resumo
// e uma seta que aponta para o valor mais alto (usando api.x / api.y para converter valores em px).
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const values = [42, 48, 51, 49, 58, 63, 61, 67, 92, 70, 78, 86];

export function mount(el: HTMLElement): () => void {
  const iMax = values.indexOf(Math.max(...values));
  const chart = createLineChart(el, {
    categories: MONTHS,
    series: [{ name: 'Receita', data: values, area: true, curve: 'smooth' }],
    legend: { show: false },
    graphic: (ctx, api) => {
      const { plot } = api;
      // watermark
      ctx.save();
      ctx.translate(plot.x + plot.w / 2, plot.y + plot.h / 2);
      ctx.rotate(-0.25);
      ctx.font = `800 64px ${api.theme.font}`;
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TRADING-CHART', 0, 0);
      ctx.restore();
      // summary box
      const bx = plot.x + 14;
      const by = plot.y + 12;
      ctx.fillStyle = 'rgba(41,98,255,0.15)';
      ctx.strokeStyle = '#2962ff';
      ctx.beginPath();
      ctx.roundRect(bx, by, 190, 52, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = api.theme.text;
      ctx.font = `700 13px ${api.theme.font}`;
      ctx.textBaseline = 'top';
      ctx.fillText('Receita anual: 765 M€', bx + 12, by + 10);
      ctx.font = `12px ${api.theme.font}`;
      ctx.fillStyle = api.theme.muted;
      ctx.fillText('+105% de Jan para Dez', bx + 12, by + 30);
      // arrow to the highest month
      const tx = api.x(MONTHS[iMax]);
      const ty = api.y(values[iMax]);
      const sx = tx - 90;
      const sy = ty - 10;
      ctx.strokeStyle = '#ff9800';
      ctx.fillStyle = '#ff9800';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(tx - 40, ty - 40, tx - 6, ty - 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tx - 4, ty - 2);
      ctx.lineTo(tx - 16, ty - 4);
      ctx.lineTo(tx - 9, ty - 14);
      ctx.closePath();
      ctx.fill();
      ctx.font = `700 12px ${api.theme.font}`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('Campanha de setembro', sx - 6, sy);
    },
  });
  return () => chart.destroy();
}
