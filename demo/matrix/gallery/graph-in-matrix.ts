import { createMatrixChart, type MatrixCell } from 'openchartscandle/matrix';

// Um grafo dentro da matriz: cada tarefa de um projeto quantitativo fica na célula da sua fase (colunas) e da
// sua equipa (linhas), e as dependências são setas desenhadas por cima de tudo com `graphic`, que sabe onde
// fica cada célula (api.cellRect). O rato numa tarefa acende as setas que lhe tocam.
const PHASES = ['Ideia', 'Pesquisa', 'Backtest', 'Validação', 'Produção'];
const TEAMS = ['Quant', 'Dados', 'Risco', 'Engenharia'];
const NODES: { id: string; label: string; phase: string; team: string; color: string }[] = [
  { id: 'a', label: 'Momentum', phase: 'Ideia', team: 'Quant', color: '#2962ff' },
  { id: 'b', label: 'Fatores', phase: 'Pesquisa', team: 'Quant', color: '#2962ff' },
  { id: 'c', label: 'Preços', phase: 'Pesquisa', team: 'Dados', color: '#26a69a' },
  { id: 'd', label: 'Backtest', phase: 'Backtest', team: 'Quant', color: '#2962ff' },
  { id: 'e', label: 'Limpeza', phase: 'Backtest', team: 'Dados', color: '#26a69a' },
  { id: 'f', label: 'Stress', phase: 'Backtest', team: 'Risco', color: '#ef5350' },
  { id: 'g', label: 'Limites', phase: 'Validação', team: 'Risco', color: '#ef5350' },
  { id: 'h', label: 'API', phase: 'Validação', team: 'Engenharia', color: '#ffb74d' },
  { id: 'i', label: 'Execução', phase: 'Produção', team: 'Engenharia', color: '#ffb74d' },
  { id: 'j', label: 'Alertas', phase: 'Produção', team: 'Risco', color: '#ef5350' },
];
const EDGES: [string, string][] = [
  ['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'e'], ['e', 'd'], ['d', 'f'], ['f', 'g'], ['d', 'h'], ['g', 'i'], ['h', 'i'], ['g', 'j'], ['i', 'j'],
];

export function mount(el: HTMLElement): () => void {
  const byId = new Map(NODES.map((n) => [n.id, n]));
  const data: MatrixCell[] = NODES.map((n) => ({ coord: [n.phase, n.team], id: n.id, value: n.label, label: { show: false }, data: n }));
  const chart = createMatrixChart(el, {
    title: { text: 'Do sinal à produção', subtext: 'Tarefas por fase e equipa, com as dependências', align: 'left' },
    x: { data: PHASES },
    y: { data: TEAMS },
    data,
    emphasis: 'cell',
    tooltip: { formatter: (c) => `<b>${c.value}</b><br/>${c.yName} · ${c.xName}` },
    graphic: (ctx, api) => {
      const center = (id: string): { x: number; y: number; r: number } | null => {
        const n = byId.get(id)!;
        const r = api.cellRect(n.phase, n.team);
        return r ? { x: r.x + r.w / 2, y: r.y + r.h / 2 - 5, r: Math.max(4, Math.min(r.w, r.h) * 0.2) } : null;
      };
      const hover = api.hover?.kind === 'body' ? api.hover.id : null;
      const p = api.progress;
      // edges first, under the nodes
      for (const [s, t] of EDGES) {
        const a = center(s);
        const b = center(t);
        if (!a || !b) continue;
        const lit = hover === s || hover === t;
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        const x0 = a.x + Math.cos(ang) * a.r;
        const y0 = a.y + Math.sin(ang) * a.r;
        const x1 = a.x + (b.x - Math.cos(ang) * (b.r + 3) - a.x) * p;
        const y1 = a.y + (b.y - Math.sin(ang) * (b.r + 3) - a.y) * p;
        ctx.strokeStyle = lit ? '#ffffff' : 'rgba(178, 181, 190, 0.45)';
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = lit ? 2 : 1.2;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - 7 * Math.cos(ang - 0.4), y1 - 7 * Math.sin(ang - 0.4));
        ctx.lineTo(x1 - 7 * Math.cos(ang + 0.4), y1 - 7 * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fill();
      }
      for (const n of NODES) {
        const c = center(n.id);
        if (!c) continue;
        ctx.globalAlpha = p;
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * (hover === n.id ? 1.15 : 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = api.theme.background;
        ctx.lineWidth = 2;
        ctx.stroke();
        const fs = Math.max(8, Math.min(11, c.r * 0.9));
        ctx.font = `${fs}px ${api.theme.font}`;
        ctx.fillStyle = api.theme.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        if (c.r >= 6) ctx.fillText(n.label, c.x, c.y + c.r + 3);
        ctx.globalAlpha = 1;
      }
    },
  });
  return () => chart.destroy();
}
