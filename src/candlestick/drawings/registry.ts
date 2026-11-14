import type { Drawing, DrawingOptions, SerializedDrawing } from './base';
import {
  AnchoredVwap, ArrowLine, Brush, CrossLine, DatePriceRange, DateRange, Ellipse, ExtendedLine, FibChannel, FibExtension,
  FibRetracement, FixedRangeVP, HorizontalLine, HorizontalRay, InfoLine, ParallelChannel, PathTool, Position, PriceRange,
  Ray, Rectangle, TextNote, TrendLine, Triangle, VerticalLine,
} from './tools';

export interface ToolDef {
  id: string;
  title: string;
  icon: string;
  hotkey?: string;
  create: (opts?: Partial<DrawingOptions>) => Drawing;
}

export interface ToolGroup {
  id: string;
  title: string;
  tools: ToolDef[];
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'lines',
    title: 'Ferramentas de linha',
    tools: [
      { id: 'trendline', title: 'Linha de tendência', icon: 'trendline', hotkey: 'Alt + T', create: (o) => new TrendLine(o) },
      { id: 'ray', title: 'Raio', icon: 'ray', create: (o) => new Ray(o) },
      { id: 'infoline', title: 'Linha de informação', icon: 'infoline', create: (o) => new InfoLine(o) },
      { id: 'extended', title: 'Linha estendida', icon: 'extended', create: (o) => new ExtendedLine(o) },
      { id: 'arrow', title: 'Seta', icon: 'arrow', create: (o) => new ArrowLine(o) },
      { id: 'hline', title: 'Linha horizontal', icon: 'hline', hotkey: 'Alt + H', create: (o) => new HorizontalLine(o) },
      { id: 'hray', title: 'Raio horizontal', icon: 'hray', hotkey: 'Alt + J', create: (o) => new HorizontalRay(o) },
      { id: 'vline', title: 'Linha vertical', icon: 'vline', hotkey: 'Alt + V', create: (o) => new VerticalLine(o) },
      { id: 'crossline', title: 'Linha cruzada', icon: 'crossline', hotkey: 'Alt + C', create: (o) => new CrossLine(o) },
      { id: 'channel', title: 'Canal paralelo', icon: 'channel', create: (o) => new ParallelChannel(o) },
    ],
  },
  {
    id: 'fib',
    title: 'Ferramentas de Fibonacci',
    tools: [
      { id: 'fib', title: 'Retração de Fibonacci', icon: 'fib', hotkey: 'Alt + F', create: (o) => new FibRetracement(o) },
      { id: 'fibext', title: 'Extensão de Fibonacci baseada em tendência', icon: 'fibext', create: (o) => new FibExtension(o) },
      { id: 'fibchannel', title: 'Canal de Fibonacci', icon: 'fibchannel', create: (o) => new FibChannel(o) },
    ],
  },
  {
    id: 'forecast',
    title: 'Previsão e medição',
    tools: [
      { id: 'long', title: 'Posição comprada', icon: 'long', create: (o) => new Position(true, o) },
      { id: 'short', title: 'Posição vendida', icon: 'short', create: (o) => new Position(false, o) },
      { id: 'pricerange', title: 'Intervalo de preço', icon: 'pricerange', create: (o) => new PriceRange(o) },
      { id: 'daterange', title: 'Intervalo de data', icon: 'daterange', create: (o) => new DateRange(o) },
      { id: 'datepricerange', title: 'Intervalo de data e preço', icon: 'datepricerange', create: (o) => new DatePriceRange(o) },
    ],
  },
  {
    id: 'volume',
    title: 'Ferramentas de volume',
    tools: [
      { id: 'frvp', title: 'Perfil de volume de intervalo fixo', icon: 'frvp', create: (o) => new FixedRangeVP(o) },
      { id: 'avwap', title: 'VWAP ancorado', icon: 'avwap', create: (o) => new AnchoredVwap(o) },
    ],
  },
  {
    id: 'shapes',
    title: 'Formas geométricas',
    tools: [
      { id: 'brush', title: 'Pincel', icon: 'brush', create: (o) => new Brush(o) },
      { id: 'rect', title: 'Retângulo', icon: 'rect', create: (o) => new Rectangle(o) },
      { id: 'ellipse', title: 'Elipse', icon: 'ellipse', create: (o) => new Ellipse(o) },
      { id: 'triangle', title: 'Triângulo', icon: 'triangle', create: (o) => new Triangle(o) },
      { id: 'path', title: 'Caminho', icon: 'path', create: (o) => new PathTool(o) },
    ],
  },
  {
    id: 'text',
    title: 'Anotação',
    tools: [{ id: 'text', title: 'Texto', icon: 'text', create: (o) => new TextNote(o) }],
  },
];

export const ALL_TOOLS: ToolDef[] = TOOL_GROUPS.flatMap((g) => g.tools);

export function toolById(id: string): ToolDef | undefined {
  return ALL_TOOLS.find((t) => t.id === id);
}

export function deserializeDrawing(s: SerializedDrawing): Drawing | null {
  const def = toolById(s.type);
  if (!def) return null;
  const d = def.create(s.opts);
  d.id = s.id;
  d.points = s.points.map((p) => ({ ...p }));
  d.locked = !!s.locked;
  d.hidden = !!s.hidden;
  return d;
}
