/** Data and helpers for the graph examples (generated or approximate, see each comment). */
export { cells, countries, seeded, select, withToolbar, YEARS, type CountryYear } from '../scatter/data';
import type { GraphCategory, GraphLink, GraphNode } from 'openchartscandle/graph';
import { seeded } from '../scatter/data';

export interface Network {
  nodes: GraphNode[];
  links: GraphLink[];
  categories: GraphCategory[];
}

/** Sum of the link values of each node (or the number of links), as node values. */
export function withDegree(nodes: GraphNode[], links: GraphLink[], weighted = false): GraphNode[] {
  const d = new Map<string, number>();
  for (const l of links) {
    const w = weighted ? (l.value ?? 1) : 1;
    d.set(l.source, (d.get(l.source) ?? 0) + w);
    d.set(l.target, (d.get(l.target) ?? 0) + w);
  }
  return nodes.map((n) => ({ ...n, value: d.get(n.id) ?? 0 }));
}

/**
 * A network with communities (generated): each node links to one or two earlier nodes, mostly of its own
 * category and more often to nodes that already have many links (so there are hubs).
 */
export function communityNetwork(n: number, categories: string[], seed: number, sameCategory = 0.85): Network {
  const rnd = seeded(seed);
  const cat: number[] = [];
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  // endpoints of every link: picking one at random favours nodes with many links
  const ends: number[][] = categories.map(() => []);
  for (let i = 0; i < n; i++) {
    const c = i < categories.length ? i : Math.floor(rnd() * categories.length);
    cat.push(c);
    nodes.push({ id: `n${i}`, name: `${categories[c]} ${i + 1}`, category: c });
    if (i < categories.length) {
      if (i) links.push({ source: `n${i}`, target: `n${Math.floor(rnd() * i)}` });
      ends[c].push(i, i);
      continue;
    }
    const k = rnd() < 0.3 ? 2 : 1;
    const used = new Set<number>();
    for (let j = 0; j < k; j++) {
      const own = rnd() < sameCategory;
      const pool = own ? ends[c] : ends[Math.floor(rnd() * categories.length)];
      const t = pool.length ? pool[Math.floor(rnd() * pool.length)] : Math.floor(rnd() * i);
      if (used.has(t) || t === i) continue;
      used.add(t);
      links.push({ source: `n${i}`, target: `n${t}` });
      ends[cat[t]].push(t);
      ends[c].push(i);
    }
    ends[c].push(i);
  }
  return { nodes: withDegree(nodes, links), links, categories: categories.map((name) => ({ name })) };
}

const FIRST = ['Ana', 'João', 'Maria', 'Pedro', 'Inês', 'Rui', 'Sofia', 'Tiago', 'Marta', 'Nuno', 'Carla', 'Luís', 'Beatriz', 'Miguel', 'Joana', 'André', 'Rita', 'Paulo', 'Filipa', 'Hugo'];
const LAST = ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Almeida', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira'];

/** n different made-up Portuguese names (generated). */
export function personNames(n: number, seed: number): string[] {
  const rnd = seeded(seed);
  const out = new Set<string>();
  while (out.size < Math.min(n, FIRST.length * LAST.length)) out.add(`${FIRST[Math.floor(rnd() * FIRST.length)]} ${LAST[Math.floor(rnd() * LAST.length)]}`);
  return [...out];
}

const SYL = ['re', 'act', 'lo', 'dash', 'ex', 'press', 'web', 'pack', 'babel', 'core', 'type', 'script', 'vue', 'node', 'fs', 'path', 'mini', 'match', 'glob', 'chalk', 'debug', 'ms', 'yargs', 'util', 'stream', 'parse', 'json', 'semver', 'uuid', 'async'];

/**
 * A big dependency graph like npm (generated): packages depend on older ones, mostly popular ones of their
 * own ecosystem (`category`, 0 to groups − 1, whose first package is its root), so a few are used by hundreds.
 */
export function npmGraph(n: number, groups: number, seed: number): { nodes: GraphNode[]; links: GraphLink[] } {
  const rnd = seeded(seed);
  const names = new Set<string>();
  const name = (): string => {
    let s = '';
    do s = SYL[Math.floor(rnd() * SYL.length)] + (rnd() < 0.7 ? `-${SYL[Math.floor(rnd() * SYL.length)]}` : '') + (rnd() < 0.25 ? `-${Math.floor(rnd() * 9) + 2}` : '');
    while (names.has(s));
    names.add(s);
    return s;
  };
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  // endpoints of the links of each ecosystem: picking one at random favours popular packages
  const ends: number[][] = Array.from({ length: groups }, () => []);
  for (let i = 0; i < n; i++) {
    const g = i < groups ? i : Math.floor(rnd() * groups);
    nodes.push({ id: `p${i}`, name: name(), category: g });
    if (i < groups) {
      if (i) links.push({ source: `p${i}`, target: `p${Math.floor(rnd() * i)}` });
      ends[g].push(i);
      continue;
    }
    const k = 1 + (rnd() < 0.25 ? 1 : 0) + (rnd() < 0.08 ? 1 : 0);
    const used = new Set<number>();
    for (let j = 0; j < k; j++) {
      const pool = ends[rnd() < 0.9 ? g : Math.floor(rnd() * groups)];
      const t = pool[Math.floor(rnd() * pool.length)];
      if (used.has(t)) continue;
      used.add(t);
      links.push({ source: `p${i}`, target: `p${t}` });
      ends[nodes[t].category as number].push(t);
    }
    ends[g].push(i);
  }
  return { nodes: withDegree(nodes, links), links };
}

/**
 * Les Misérables (Victor Hugo): the 77 characters and the 11 groups of Knuth's co-occurrence dataset
 * (as used by d3 and ECharts). The links are a reduced, approximate version written from the story
 * (value ≈ chapters together), not the original list.
 */
const LES_MIS_GROUPS: string[][] = [
  ['Myriel', 'Napoleon', 'Mlle.Baptistine', 'Mme.Magloire', 'CountessDeLo', 'Geborand', 'Champtercier', 'Cravatte', 'Count', 'OldMan'],
  ['Labarre', 'Valjean', 'Marguerite', 'Mme.deR', 'Isabeau', 'Gervais'],
  ['Tholomyes', 'Listolier', 'Fameuil', 'Blacheville', 'Favourite', 'Dahlia', 'Zephine', 'Fantine'],
  ['Mme.Thenardier', 'Thenardier', 'Cosette', 'Javert', 'Fauchelevent'],
  ['Bamatabois', 'Perpetue', 'Simplice', 'Scaufflaire', 'Woman1', 'Judge', 'Champmathieu', 'Brevet', 'Chenildieu', 'Cochepaille'],
  ['Pontmercy', 'Boulatruelle', 'Eponine', 'Anzelma', 'Woman2', 'MotherInnocent', 'Gribier'],
  ['Jondrette', 'Mme.Burgon'],
  ['Gavroche', 'Gillenormand', 'Magnon', 'Mlle.Gillenormand', 'Mme.Pontmercy', 'Mlle.Vaubois', 'Lt.Gillenormand', 'Marius', 'BaronessT'],
  ['Mabeuf', 'Enjolras', 'Combeferre', 'Prouvaire', 'Feuilly', 'Courfeyrac', 'Bahorel', 'Bossuet', 'Joly', 'Grantaire', 'MotherPlutarch'],
  ['Gueulemer', 'Babet', 'Claquesous', 'Montparnasse', 'Brujon'],
  ['Toussaint', 'Child1', 'Child2', 'Mme.Hucheloup'],
];

// "a b value" per link (approximate, see above)
const LES_MIS_LINKS = `
Myriel Napoleon 1|Myriel Mlle.Baptistine 8|Myriel Mme.Magloire 10|Myriel CountessDeLo 1|Myriel Geborand 1|Myriel Champtercier 1
Myriel Cravatte 1|Myriel Count 2|Myriel OldMan 1|Myriel Valjean 5|Mlle.Baptistine Mme.Magloire 6|Mlle.Baptistine Valjean 3|Mme.Magloire Valjean 3
Valjean Labarre 1|Valjean Marguerite 1|Valjean Mme.deR 1|Valjean Isabeau 1|Valjean Gervais 1|Valjean Fantine 9|Valjean Mme.Thenardier 7
Valjean Thenardier 12|Valjean Cosette 31|Valjean Javert 17|Valjean Fauchelevent 8|Valjean Bamatabois 2|Valjean Simplice 3|Valjean Scaufflaire 1
Valjean Woman1 2|Valjean Judge 3|Valjean Champmathieu 3|Valjean Brevet 2|Valjean Chenildieu 2|Valjean Cochepaille 2|Valjean Woman2 3
Valjean MotherInnocent 3|Valjean Gavroche 1|Valjean Gillenormand 5|Valjean Mlle.Gillenormand 1|Valjean Marius 19|Valjean Enjolras 4
Valjean Toussaint 1|Valjean Gueulemer 1|Valjean Babet 2|Valjean Claquesous 2|Valjean Montparnasse 1|Valjean Child1 1
Tholomyes Listolier 4|Tholomyes Fameuil 4|Tholomyes Blacheville 4|Tholomyes Favourite 3|Tholomyes Dahlia 3|Tholomyes Zephine 3|Tholomyes Fantine 3
Listolier Fameuil 4|Listolier Blacheville 4|Fameuil Blacheville 4|Favourite Dahlia 5|Favourite Zephine 4|Dahlia Zephine 4|Fantine Favourite 4
Fantine Dahlia 4|Fantine Zephine 4|Fantine Listolier 3|Fantine Fameuil 3|Fantine Blacheville 3|Listolier Favourite 3|Fameuil Dahlia 3
Blacheville Zephine 3|Fantine Marguerite 2|Fantine Mme.Thenardier 2|Fantine Thenardier 1|Fantine Javert 5|Fantine Bamatabois 1|Fantine Simplice 2
Fantine Perpetue 1|Mme.Thenardier Thenardier 13|Mme.Thenardier Cosette 4|Thenardier Cosette 4|Mme.Thenardier Javert 1|Thenardier Javert 5
Javert Cosette 1|Fauchelevent Javert 1|Fauchelevent MotherInnocent 4|Fauchelevent Gribier 2|Thenardier Eponine 3|Mme.Thenardier Eponine 2
Thenardier Anzelma 1|Mme.Thenardier Anzelma 1|Eponine Anzelma 2|Thenardier Boulatruelle 1|Thenardier Pontmercy 1|Thenardier Gavroche 1
Thenardier Marius 2|Thenardier Gueulemer 5|Thenardier Babet 6|Thenardier Claquesous 4|Thenardier Montparnasse 4|Thenardier Brujon 1
Mme.Thenardier Babet 1|Mme.Thenardier Gueulemer 1|Mme.Thenardier Claquesous 1|Mme.Thenardier Magnon 1|Magnon Gillenormand 1
Javert Bamatabois 1|Javert Simplice 1|Javert Woman1 1|Javert Gavroche 1|Javert Enjolras 6|Javert Marius 1|Javert Gueulemer 1|Javert Babet 2
Javert Claquesous 1|Javert Montparnasse 1|Javert Toussaint 1|Champmathieu Judge 3|Champmathieu Brevet 2|Champmathieu Chenildieu 2
Champmathieu Cochepaille 2|Brevet Chenildieu 2|Brevet Cochepaille 2|Chenildieu Cochepaille 2|Judge Brevet 2|Judge Chenildieu 2|Judge Cochepaille 2
Bamatabois Judge 2|Bamatabois Champmathieu 2|Bamatabois Brevet 1|Bamatabois Chenildieu 1|Bamatabois Cochepaille 1|Perpetue Simplice 2
Scaufflaire Simplice 1|Woman2 Cosette 1|Cosette Marius 21|Cosette Gillenormand 3|Cosette Mlle.Gillenormand 2|Cosette Toussaint 2
MotherInnocent Cosette 1|Jondrette Mme.Burgon 1|Mme.Burgon Gavroche 2|Jondrette Marius 1|Gillenormand Mlle.Gillenormand 9|Gillenormand Marius 12
Gillenormand Lt.Gillenormand 1|Mlle.Gillenormand Lt.Gillenormand 2|Mlle.Gillenormand Marius 6|Mlle.Gillenormand Mme.Pontmercy 1
Mlle.Gillenormand Mlle.Vaubois 1|Lt.Gillenormand Marius 1|Lt.Gillenormand Cosette 1|Gillenormand BaronessT 1|Marius BaronessT 1|Pontmercy Marius 1
Pontmercy Mme.Pontmercy 1|Marius Eponine 5|Marius Gavroche 4|Marius Mabeuf 1|Marius Enjolras 7|Marius Combeferre 5|Marius Courfeyrac 21
Marius Bossuet 5|Marius Joly 2|Marius Feuilly 1|Marius Bahorel 1|Marius Prouvaire 1|Eponine Gueulemer 1|Eponine Montparnasse 1|Eponine Brujon 1
Eponine Courfeyrac 1|Eponine Mabeuf 1|Gavroche Mabeuf 1|Gavroche Enjolras 7|Gavroche Combeferre 6|Gavroche Prouvaire 2|Gavroche Feuilly 7
Gavroche Courfeyrac 13|Gavroche Bahorel 5|Gavroche Bossuet 5|Gavroche Joly 4|Gavroche Grantaire 1|Gavroche Montparnasse 1|Gavroche Brujon 1
Gavroche Child1 2|Gavroche Child2 2|Gavroche Mme.Hucheloup 1|Mabeuf Enjolras 1|Mabeuf Combeferre 2|Mabeuf Feuilly 1|Mabeuf Courfeyrac 2
Mabeuf Bahorel 1|Mabeuf Bossuet 1|Mabeuf Joly 1|Mabeuf MotherPlutarch 3|Gueulemer Babet 6|Gueulemer Claquesous 4|Gueulemer Montparnasse 3
Gueulemer Brujon 3|Babet Claquesous 4|Babet Montparnasse 2|Babet Brujon 3|Claquesous Montparnasse 2|Claquesous Brujon 1|Montparnasse Brujon 1
Child1 Child2 3|Mme.Hucheloup Bossuet 1|Mme.Hucheloup Joly 1|Mme.Hucheloup Grantaire 1|Mme.Hucheloup Enjolras 1|Mme.Hucheloup Courfeyrac 1
Napoleon Count 1|Geborand Champtercier 1|Isabeau Gervais 1|Woman1 Simplice 1|Gribier MotherInnocent 1|Boulatruelle Mme.Thenardier 1
`;

/** The Les Misérables network (see above): node value = sum of its link values. */
export function lesMiserables(): Network {
  const nodes: GraphNode[] = LES_MIS_GROUPS.flatMap((g, c) => g.map((id) => ({ id, name: id, category: c })));
  const links: GraphLink[] = LES_MIS_LINKS.trim()
    .split(/[|\n]/)
    .map((s) => s.trim().split(' '))
    .map(([source, target, v]) => ({ source, target, value: Number(v) }));
  // the friends of the ABC (the students on the barricade) all know each other
  const abc = ['Enjolras', 'Combeferre', 'Prouvaire', 'Feuilly', 'Courfeyrac', 'Bahorel', 'Bossuet', 'Joly', 'Grantaire'];
  abc.forEach((a, i) => abc.slice(i + 1).forEach((b, j) => links.push({ source: a, target: b, value: 2 + ((i * 7 + j * 3) % 12) })));
  return { nodes: withDegree(nodes, links, true), links, categories: LES_MIS_GROUPS.map((_, i) => ({ name: `Grupo ${i + 1}` })) };
}

// ---------------------------------------------------------------- Portugal (approximate)

/** Outline of mainland Portugal [lon, lat] — the same approximate outline as the scatter geo example. */
export const PT_OUTLINE: [number, number][] = [
  [-8.87, 41.87], [-8.65, 42.05], [-8.2, 42.13], [-8.08, 42.03], [-7.6, 41.87], [-7.2, 41.98], [-6.6, 41.96], [-6.2, 41.6],
  [-6.45, 41.3], [-6.8, 41.05], [-6.93, 40.6], [-6.85, 40.25], [-7.0, 39.67], [-7.5, 39.66], [-7.3, 39.45], [-7.03, 39.1],
  [-7.15, 38.8], [-7.3, 38.45], [-7.0, 38.05], [-7.45, 37.6], [-7.42, 37.18], [-7.9, 36.98], [-8.5, 37.1], [-8.99, 37.02],
  [-8.8, 37.4], [-8.85, 37.95], [-8.9, 38.45], [-9.2, 38.65], [-9.5, 38.72], [-9.4, 39.1], [-9.08, 39.6], [-8.88, 40.15],
  [-8.75, 40.6], [-8.67, 41.15], [-8.78, 41.6],
];

/** Cities [name, lon, lat, population in thousands] (approximate; the scatter geo cities plus Guarda and Vila Real). */
export const PT_CITIES: [string, number, number, number][] = [
  ['Lisboa', -9.14, 38.72, 545], ['Porto', -8.61, 41.15, 232], ['Vila Nova de Gaia', -8.6, 41.12, 304], ['Braga', -8.42, 41.55, 193],
  ['Amadora', -9.23, 38.75, 171], ['Guimarães', -8.3, 41.44, 156], ['Coimbra', -8.43, 40.2, 140], ['Leiria', -8.81, 39.74, 128],
  ['Setúbal', -8.89, 38.52, 123], ['Viseu', -7.91, 40.66, 99], ['Aveiro', -8.65, 40.64, 80], ['Faro', -7.93, 37.02, 64],
  ['Portimão', -8.54, 37.14, 59], ['Évora', -7.91, 38.57, 53], ['Castelo Branco', -7.49, 39.82, 52], ['Bragança', -6.76, 41.81, 34],
  ['Beja', -7.86, 38.02, 33], ['Guarda', -7.27, 40.54, 40], ['Vila Real', -7.74, 41.3, 50],
];

/** Main motorways between those cities (approximate): [from, to, name]. */
export const PT_ROADS: [string, string, string][] = [
  ['Lisboa', 'Amadora', 'IC19'], ['Lisboa', 'Leiria', 'A1'], ['Leiria', 'Coimbra', 'A1'], ['Coimbra', 'Aveiro', 'A1'], ['Aveiro', 'Vila Nova de Gaia', 'A1'],
  ['Vila Nova de Gaia', 'Porto', 'A1'], ['Porto', 'Braga', 'A3'], ['Porto', 'Guimarães', 'A7'], ['Braga', 'Guimarães', 'A11'], ['Porto', 'Vila Real', 'A4'],
  ['Vila Real', 'Bragança', 'A4'], ['Vila Real', 'Viseu', 'A24'], ['Aveiro', 'Viseu', 'A25'], ['Viseu', 'Guarda', 'A25'], ['Guarda', 'Castelo Branco', 'A23'],
  ['Castelo Branco', 'Lisboa', 'A23'], ['Coimbra', 'Viseu', 'IP3'], ['Lisboa', 'Setúbal', 'A2'], ['Lisboa', 'Évora', 'A6'], ['Évora', 'Beja', 'IP2'],
  ['Setúbal', 'Faro', 'A2'], ['Faro', 'Portimão', 'A22'], ['Beja', 'Faro', 'IP2'],
];
