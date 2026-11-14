import type { Drawing, DrawingOptions, SerializedDrawing } from './base';
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
export declare const TOOL_GROUPS: ToolGroup[];
export declare const ALL_TOOLS: ToolDef[];
export declare function toolById(id: string): ToolDef | undefined;
export declare function deserializeDrawing(s: SerializedDrawing): Drawing | null;
