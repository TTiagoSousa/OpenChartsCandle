import { highlight } from './highlight';

/** Minimal Markdown → HTML for the docs/*.md files (headings, lists, tables, code, quotes, links). */

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Rewrites links between markdown files into site routes:
 *   api.md (inside a family doc)  → #/<family>/docs/api
 *   docs/candlestick/api.md       → #/candlestick/docs/api
 *   docs/versoes.md, ../versoes.md → #/docs/versoes
 */
function linkHref(href: string, family: string | null): string {
  if (/^(https?:|#|mailto:)/.test(href)) return href;
  const m = href.match(/^(?:\.\/)?((?:\.\.\/)*)(?:docs\/)?(?:([\w-]+)\/)?([\w-]+)\.md(#.*)?$/);
  if (!m) return href;
  const [, up, folder, name] = m;
  if (name === 'README') return '#/instalacao';
  if (name === 'CHANGELOG') return '#/docs/changelog';
  const fam = folder ?? (up ? null : family);
  return fam ? `#/${fam}/docs/${name}` : `#/docs/${name}`;
}

function inline(text: string, family: string | null): string {
  const codes: string[] = [];
  let s = text.replace(/`([^`]+)`/g, (_, c: string) => {
    codes.push(`<code>${esc(c)}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    // images: the README's screenshots live in demo/public, served at the site's base
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt: string, src: string) => {
      const url = src.replace(/^(?:\.\/)?demo\/public\//, import.meta.env.BASE_URL);
      return `<img class="${/^https?:/.test(src) ? 'doc__badge' : 'doc__img'}" src="${url}" alt="${alt}" loading="lazy" />`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, href: string) => {
      const url = linkHref(href, family);
      const ext = url.startsWith('http') ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${url}"${ext}>${label}</a>`;
    });
  return s.replace(/\u0000(\d+)\u0000/g, (_, i: string) => codes[Number(i)]);
}

function cells(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, '|'));
}

export interface Heading {
  level: number;
  text: string;
  id: string;
}

export function renderMarkdown(md: string, family: string | null = null): { html: string; headings: Heading[] } {
  const inl = (t: string): string => inline(t, family);
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  const headings: Heading[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // fenced code
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      out.push(`<pre class="code"><code>${highlight(buf.join('\n'), fence[1] || 'ts')}</code></pre>`);
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2].replace(/`/g, '');
      const id = slug(text);
      headings.push({ level, text, id });
      out.push(`<h${level} id="${id}">${inl(h[2])}</h${level}>`);
      i++;
      continue;
    }
    if (/^---+\s*$/.test(line)) {
      out.push('<hr>');
      i++;
      continue;
    }
    // table
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++]));
      out.push(
        `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inl(c)}</th>`).join('')}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${inl(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`,
      );
      continue;
    }
    // blockquote
    if (line.startsWith('>')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${inl(buf.join(' '))}</blockquote>`);
      continue;
    }
    // lists (one level + simple nesting)
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        const nested = /^\s{2,}/.test(lines[i]);
        const text = inl(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ''));
        if (nested && items.length) items[items.length - 1] += `<ul><li>${text}</li></ul>`;
        else items.push(text);
        i++;
      }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map((x) => `<li>${x.replace(/<\/ul><ul>/g, '')}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    // paragraph
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|\||>|\s*([-*]|\d+\.)\s|---)/.test(lines[i])) buf.push(lines[i++]);
    if (buf.length) out.push(`<p>${inl(buf.join(' '))}</p>`);
    else i++;
  }
  return { html: out.join('\n'), headings };
}
