/** Tiny syntax highlighter for the code blocks of the showcase (TS / JS / CSS / HTML / shell). */

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const KEYWORDS = new Set(
  (
    'import from export default const let var function return if else for of in while do switch case break continue new ' +
    'class extends implements interface type enum async await try catch finally throw typeof instanceof void null undefined ' +
    'true false this super readonly private public protected static as keyof declare'
  ).split(' '),
);

const TOKEN = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|\b\d[\d_.]*\b|\b[A-Za-z_$][\w$]*\b)/g;

export function highlight(code: string, lang = 'ts'): string {
  if (lang === 'bash' || lang === 'sh' || lang === 'shell') {
    return esc(code)
      .split('\n')
      .map((l) => (l.trim().startsWith('#') ? `<span class="hl-c">${l}</span>` : l.replace(/^(\s*)(npm|npx|git|cd)\b/, '$1<span class="hl-k">$2</span>')))
      .join('\n');
  }
  if (lang === 'html') {
    return esc(code).replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="hl-k">$2</span>').replace(/([\w-]+)=(".*?")/g, '<span class="hl-p">$1</span>=<span class="hl-s">$2</span>');
  }
  if (lang === 'css') {
    return esc(code)
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-c">$1</span>')
      .replace(/(--[\w-]+|[\w-]+)(\s*:)/g, '<span class="hl-p">$1</span>$2');
  }
  let out = '';
  let last = 0;
  for (const m of code.matchAll(TOKEN)) {
    const t = m[0];
    out += esc(code.slice(last, m.index));
    last = m.index! + t.length;
    let cls = '';
    if (t.startsWith('//') || t.startsWith('/*')) cls = 'hl-c';
    else if (t[0] === "'" || t[0] === '"' || t[0] === '`') cls = 'hl-s';
    else if (/^\d/.test(t)) cls = 'hl-n';
    else if (KEYWORDS.has(t)) cls = 'hl-k';
    else if (code[last] === '(') cls = 'hl-f';
    else if (/^[A-Z]/.test(t)) cls = 'hl-t';
    else if (code[last] === ':' && code[last + 1] !== ':') cls = 'hl-p';
    out += cls ? `<span class="${cls}">${esc(t)}</span>` : esc(t);
  }
  return out + esc(code.slice(last));
}
