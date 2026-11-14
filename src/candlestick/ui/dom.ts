type Attrs = Record<string, string | number | boolean | ((e: Event) => void) | undefined>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else if (k === 'class') {
      el.className = String(v);
    } else if (k === 'html') {
      el.innerHTML = String(v);
    } else if (k === 'text') {
      el.textContent = String(v);
    } else if (v === true) {
      el.setAttribute(k, '');
    } else {
      el.setAttribute(k, String(v));
    }
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(c));
  }
  return el;
}

let openPopover: { el: HTMLElement; anchor: HTMLElement | null; onClose?: () => void } | null = null;

/** CSS variables (theme) of the terminal the user is interacting with; applied to floating UI. */
let portalVars = '';
export function setPortalTheme(cssVars: string): void {
  portalVars = cssVars;
}
function themed<T extends HTMLElement>(el: T): T {
  if (portalVars) el.style.cssText += portalVars;
  return el;
}

export function closePopover(): void {
  if (!openPopover) return;
  const p = openPopover;
  openPopover = null;
  p.el.remove();
  p.anchor?.classList.remove('is-open');
  p.onClose?.();
}

/** Show a floating popover anchored below (or beside) an element. */
export function showPopover(
  content: HTMLElement,
  anchor: HTMLElement | { x: number; y: number },
  opts: { side?: 'bottom' | 'right' | 'top'; onClose?: () => void; className?: string } = {},
): HTMLElement {
  const wasSame = openPopover && anchor instanceof HTMLElement && openPopover.anchor === anchor;
  closePopover();
  if (wasSame) return content;
  const el = themed(h('div', { class: `tc-popover ${opts.className ?? ''}` }, content));
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  document.body.appendChild(el);
  const side = opts.side ?? 'bottom';
  const pr = el.getBoundingClientRect();
  let x: number;
  let y: number;
  if (anchor instanceof HTMLElement) {
    const r = anchor.getBoundingClientRect();
    anchor.classList.add('is-open');
    if (side === 'right') {
      x = r.right + 4;
      y = r.top;
    } else if (side === 'top') {
      x = r.left;
      y = r.top - pr.height - 4;
    } else {
      x = r.left;
      y = r.bottom + 4;
    }
  } else {
    x = anchor.x;
    y = anchor.y;
  }
  x = Math.max(4, Math.min(x, window.innerWidth - pr.width - 4));
  y = Math.max(4, Math.min(y, window.innerHeight - pr.height - 4));
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  openPopover = { el, anchor: anchor instanceof HTMLElement ? anchor : null, onClose: opts.onClose };
  return el;
}

export function isPopoverOpen(): boolean {
  return openPopover !== null;
}

document.addEventListener('pointerdown', (e) => {
  if (!openPopover) return;
  const t = e.target as Node;
  if (openPopover.el.contains(t)) return;
  if (openPopover.anchor && openPopover.anchor.contains(t)) return;
  closePopover();
});

export function tooltip(el: HTMLElement, text: string, hotkey?: string): void {
  let tip: HTMLElement | null = null;
  let timer = 0;
  el.addEventListener('pointerenter', () => {
    timer = window.setTimeout(() => {
      if (el.classList.contains('is-open')) return;
      tip = themed(h('div', { class: 'tc-tooltip' }, text, hotkey ? h('span', { class: 'tc-tooltip__key' }, hotkey) : null));
      document.body.appendChild(tip);
      const r = el.getBoundingClientRect();
      const tr = tip.getBoundingClientRect();
      const vertical = el.closest('.tc-left-toolbar') !== null;
      let x = vertical ? r.right + 8 : r.left + r.width / 2 - tr.width / 2;
      let y = vertical ? r.top + r.height / 2 - tr.height / 2 : r.bottom + 8;
      x = Math.max(4, Math.min(x, window.innerWidth - tr.width - 4));
      y = Math.max(4, Math.min(y, window.innerHeight - tr.height - 4));
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
    }, 450);
  });
  const hide = (): void => {
    clearTimeout(timer);
    tip?.remove();
    tip = null;
  };
  el.addEventListener('pointerleave', hide);
  el.addEventListener('pointerdown', hide);
}

export interface MenuItem {
  label: string;
  icon?: string;
  hotkey?: string;
  active?: boolean;
  danger?: boolean;
  separator?: boolean;
  action?: () => void;
}

export function menu(items: MenuItem[]): HTMLElement {
  const el = h('div', { class: 'tc-menu' });
  for (const it of items) {
    if (it.separator) {
      el.append(h('div', { class: 'tc-menu__sep' }));
      continue;
    }
    el.append(
      h(
        'button',
        {
          class: `tc-menu__item${it.active ? ' is-active' : ''}${it.danger ? ' is-danger' : ''}`,
          onclick: () => {
            closePopover();
            it.action?.();
          },
        },
        it.icon ? h('span', { class: 'tc-menu__icon', html: it.icon }) : null,
        h('span', { class: 'tc-menu__label' }, it.label),
        it.hotkey ? h('span', { class: 'tc-menu__hotkey' }, it.hotkey) : null,
      ),
    );
  }
  return el;
}

export function modal(title: string, body: HTMLElement, opts: { width?: number; footer?: HTMLElement; onClose?: () => void } = {}): { el: HTMLElement; close: () => void } {
  const backdrop = themed(h('div', { class: 'tc-modal-backdrop' }));
  const close = (): void => {
    backdrop.remove();
    document.removeEventListener('keydown', onKey, true);
    opts.onClose?.();
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  };
  const dialog = h(
    'div',
    { class: 'tc-modal', style: `width:${opts.width ?? 460}px` },
    h('div', { class: 'tc-modal__header' }, h('div', { class: 'tc-modal__title' }, title), h('button', { class: 'tc-icon-btn tc-modal__close', html: closeSvg, onclick: close })),
    h('div', { class: 'tc-modal__body' }, body),
    opts.footer ? h('div', { class: 'tc-modal__footer' }, opts.footer) : null,
  );
  backdrop.append(dialog);
  backdrop.addEventListener('pointerdown', (e) => {
    if (e.target === backdrop) close();
  });
  document.addEventListener('keydown', onKey, true);
  document.body.appendChild(backdrop);
  return { el: dialog, close };
}

const closeSvg =
  '<svg viewBox="0 0 28 28" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M8 8l12 12M20 8L8 20"/></svg>';
