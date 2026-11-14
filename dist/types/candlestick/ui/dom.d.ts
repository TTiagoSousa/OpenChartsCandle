type Attrs = Record<string, string | number | boolean | ((e: Event) => void) | undefined>;
export declare function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Attrs, ...children: (Node | string | null | undefined | false)[]): HTMLElementTagNameMap[K];
export declare function setPortalTheme(cssVars: string): void;
export declare function closePopover(): void;
/** Show a floating popover anchored below (or beside) an element. */
export declare function showPopover(content: HTMLElement, anchor: HTMLElement | {
    x: number;
    y: number;
}, opts?: {
    side?: 'bottom' | 'right' | 'top';
    onClose?: () => void;
    className?: string;
}): HTMLElement;
export declare function isPopoverOpen(): boolean;
export declare function tooltip(el: HTMLElement, text: string, hotkey?: string): void;
export interface MenuItem {
    label: string;
    icon?: string;
    hotkey?: string;
    active?: boolean;
    danger?: boolean;
    separator?: boolean;
    action?: () => void;
}
export declare function menu(items: MenuItem[]): HTMLElement;
export declare function modal(title: string, body: HTMLElement, opts?: {
    width?: number;
    footer?: HTMLElement;
    onClose?: () => void;
}): {
    el: HTMLElement;
    close: () => void;
};
export {};
