import { n as e, r as t, t as n } from "./format.js";
import { a as r, o as i, r as a, s as o } from "./color.js";
//#region src/custom/scale.ts
var s = [
	"Jan",
	"Fev",
	"Mar",
	"Abr",
	"Mai",
	"Jun",
	"Jul",
	"Ago",
	"Set",
	"Out",
	"Nov",
	"Dez"
], c = (e) => (e < 10 ? "0" : "") + e;
function l(e) {
	if (typeof e == "number") return e;
	if (e instanceof Date) return e.getTime();
	if (typeof e == "string") {
		let t = e.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
		if (t) return new Date(+t[1], t[2] - 1, +t[3], +(t[4] ?? 0), +(t[5] ?? 0), +(t[6] ?? 0)).getTime();
		let n = Date.parse(e);
		return Number.isNaN(n) ? NaN : n;
	}
	return NaN;
}
var u = [
	1,
	2,
	5,
	10,
	20,
	50,
	100,
	200,
	500,
	1e3,
	2e3,
	5e3,
	1e4,
	15e3,
	3e4,
	6e4,
	12e4,
	3e5,
	6e5,
	9e5,
	18e5,
	36e5,
	72e5,
	108e5,
	216e5,
	432e5,
	864e5,
	1728e5,
	6048e5
];
function d(e, n, r) {
	let i = n - e;
	if (!(i > 0)) return [{
		value: e,
		label: f(e, 6e4)
	}];
	let a = i / Math.max(1, r), o = u.find((e) => e >= a), c = [];
	if (o) {
		let t = new Date(e), r;
		if (o >= 864e5) for (r = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(); r < e;) r += o;
		else {
			let n = -t.getTimezoneOffset() * 6e4;
			r = Math.ceil((e + n) / o) * o - n;
		}
		let i = -1;
		for (; r <= n + 1e-6 && c.length < 400; r += o) {
			let e = new Date(r), t = e.getDate(), n = e.getHours() === 0 && e.getMinutes() === 0 && e.getSeconds() === 0 && e.getMilliseconds() === 0, a = i !== -1 && t !== i;
			i = t, c.push({
				value: r,
				label: o >= 864e5 || n && o >= 36e5 ? `${t} ${s[e.getMonth()]}` : f(r, o),
				major: a || n
			});
		}
		return c;
	}
	let l = i / 2630016e3, d = [
		1,
		2,
		3,
		6
	].find((e) => l / e <= r), p = new Date(e);
	if (d) {
		let t = p.getFullYear(), r = Math.ceil((p.getMonth() + +(p.getDate() > 1 || p.getHours() > 0)) / d) * d;
		for (; c.length < 400;) {
			let i = new Date(t, r, 1).getTime();
			if (i > n) break;
			let a = new Date(i);
			i >= e && c.push({
				value: i,
				label: a.getMonth() === 0 ? String(a.getFullYear()) : s[a.getMonth()],
				major: a.getMonth() === 0
			}), r += d, r >= 12 && (t += Math.floor(r / 12), r %= 12);
		}
		return c;
	}
	let m = Math.max(1, t(l / 12 / r));
	for (let t = Math.ceil(p.getFullYear() / m) * m; c.length < 400; t += m) {
		let r = new Date(t, 0, 1).getTime();
		if (r > n) break;
		r >= e && c.push({
			value: r,
			label: String(t),
			major: !0
		});
	}
	return c;
}
function f(e, t) {
	let n = new Date(e);
	return t < 1e3 ? `${c(n.getMinutes())}:${c(n.getSeconds())}.${String(n.getMilliseconds()).padStart(3, "0")}` : t < 6e4 ? `${c(n.getHours())}:${c(n.getMinutes())}:${c(n.getSeconds())}` : `${c(n.getHours())}:${c(n.getMinutes())}`;
}
function p(e) {
	let t = new Date(e), n = `${t.getDate()} ${s[t.getMonth()]} ${t.getFullYear()}`;
	return t.getHours() === 0 && t.getMinutes() === 0 && t.getSeconds() === 0 ? n : `${n}, ${c(t.getHours())}:${c(t.getMinutes())}${t.getSeconds() ? ":" + c(t.getSeconds()) : ""}`;
}
function m(e, t = "value") {
	for (let t of e) {
		if (t instanceof Date) return "time";
		if (typeof t == "string") return l(t) === l(t) && /^\d{4}-\d/.test(t) ? "time" : "category";
	}
	return t;
}
function h(t, r, i, a, o = 5) {
	let s = t.type ?? (t.data ? "category" : m(r)), c = t.inverse ? [i[1], i[0]] : [i[0], i[1]], u = [], f, h, g, _ = null, v = t.splitNumber ?? o;
	if (s === "category") {
		if (u = t.data ? [...t.data] : [], !t.data) for (let e of r) e != null && typeof e != "number" && !u.includes(String(e)) && u.push(String(e));
		if (!t.data && !u.length) {
			let e = Math.max(0, ...r.filter((e) => typeof e == "number").map((e) => Math.floor(e))) + 1;
			u = Array.from({ length: e }, (e, t) => String(t));
		}
		f = (e) => typeof e == "number" ? e : u.indexOf(String(e));
		let e = Math.max(1, u.length), n = t.boundaryGap ?? !0;
		h = n || e === 1 ? -.5 : 0, g = n || e === 1 ? e - .5 : e - 1;
	} else {
		f = s === "time" ? l : (e) => typeof e == "number" ? e : e == null || e === "" ? NaN : Number(e);
		let n = r.map(f).filter((e) => Number.isFinite(e) && (s !== "log" || e > 0)), i = n.length ? Math.min(...n) : +(s === "log"), a = n.length ? Math.max(...n) : s === "log" ? 10 : 1, o = {
			min: i,
			max: a
		}, c = typeof t.min == "number" ? t.min : typeof t.min == "function" ? t.min(o) : null, u = typeof t.max == "number" ? t.max : typeof t.max == "function" ? t.max(o) : null;
		if (s === "value" && (t.beginAtZero ?? !0) && c === null && t.min !== "dataMin" && (i = Math.min(i, 0), a = Math.max(a, 0)), s === "log") {
			let e = t.logBase ?? 10, n = Math.log(e);
			i = c ?? (t.min === "dataMin" ? i : e ** Math.floor(Math.log(i) / n + 1e-9)), a = u ?? (t.max === "dataMax" ? a : e ** Math.ceil(Math.log(a) / n - 1e-9)), a <= i && (a = i * e);
		} else if (s === "time") i = c ?? i, a = u ?? a, a <= i && (i -= 432e5, a += 432e5);
		else if (t.interval && t.interval > 0) {
			let e = t.interval, n = c ?? (t.min === "dataMin" ? i : Math.floor(i / e + 1e-9) * e), r = u ?? (t.max === "dataMax" ? a : Math.ceil(a / e - 1e-9) * e);
			i = n, a = r > n ? r : n + e, _ = [];
			for (let t = Math.ceil(i / e - 1e-9) * e; t <= a + e * 1e-6 && _.length < 500; t += e) _.push(+t.toPrecision(12));
		} else {
			let n = e(c ?? i, u ?? a, v);
			if (i = c ?? (t.min === "dataMin" ? i : n.min), a = u ?? (t.max === "dataMax" ? a : n.max), a <= i) {
				let e = Math.abs(i) * .1 || 1;
				i -= e, a += e;
			}
			_ = n.ticks.filter((e) => e >= i - 1e-9 && e <= a + 1e-9);
		}
		h = i, g = a;
	}
	let y = h, b = g;
	a && ([h, g] = a);
	let x = s === "log", S = Math.log(t.logBase ?? 10), C = (e) => x ? Math.log(Math.max(e, 1e-300)) / S : e, w = () => C(h), T = () => C(g) - C(h) || 1, E = (e) => c[0] + (C(e) - w()) / T() * (c[1] - c[0]), D = (e) => {
		let t = w() + (e - c[0]) / (c[1] - c[0] || 1) * T();
		return x ? Math.exp(t * S) : t;
	}, O = (e) => t.format ? t.format(e, s === "category" ? u[Math.round(e)] : void 0) : s === "category" ? u[Math.round(e)] ?? "" : s === "time" ? p(e) : n(e);
	return {
		type: s,
		get min() {
			return h;
		},
		get max() {
			return g;
		},
		fullMin: y,
		fullMax: b,
		range: c,
		categories: u,
		toNumber: f,
		map: (e) => E(f(e)),
		mapNum: E,
		invert: D,
		band: () => s === "category" ? Math.abs(E(1) - E(0)) : 0,
		ticks: (n = v) => {
			if (s === "category") {
				let e = [];
				for (let t = Math.max(0, Math.ceil(h - 1e-9)); t <= Math.min(u.length - 1, Math.floor(g + 1e-9)); t++) e.push({
					value: t,
					label: O(t)
				});
				return e;
			}
			if (s === "time") {
				let e = d(h, g, n);
				return t.format ? e.map((e) => ({
					...e,
					label: t.format(e.value)
				})) : e;
			}
			if (s === "log") {
				let e = t.logBase ?? 10, r = [], i = Math.floor(Math.log(h) / S + 1e-9), a = Math.ceil(Math.log(g) / S - 1e-9), o = Math.max(1, Math.ceil((a - i) / Math.max(1, n + 2)));
				for (let t = i; t <= a; t += o) {
					let n = e ** t;
					n >= h * (1 - 1e-9) && n <= g * (1 + 1e-9) && r.push({
						value: n,
						label: O(n)
					});
				}
				return r;
			}
			return _ && !a && n === v ? _.map((e) => ({
				value: e,
				label: O(e)
			})) : e(h, g, n).ticks.filter((e) => e >= h - 1e-9 && e <= g + 1e-9).map((e) => ({
				value: e,
				label: O(e)
			}));
		},
		label: O
	};
}
//#endregion
//#region src/custom/path.ts
var g = {
	m: 2,
	l: 2,
	h: 1,
	v: 1,
	c: 6,
	s: 4,
	q: 4,
	t: 2,
	a: 7,
	z: 0
};
function _(e) {
	let t = [], n = 0, r = e.length, i = (e) => e === " " || e === "," || e === "\n" || e === "	" || e === "\r", a = "", o = [], s = () => {
		for (; n < r && i(e[n]);) n++;
		let t = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(e.slice(n, n + 40));
		return t ? (n += t[0].length, parseFloat(t[0])) : null;
	}, c = () => {
		for (; n < r && i(e[n]);) n++;
		return e[n] === "0" || e[n] === "1" ? +e[n++] : null;
	};
	for (; n < r;) {
		let r = e[n];
		if (i(r)) {
			n++;
			continue;
		}
		if (/[a-zA-Z]/.test(r)) {
			if (!(r.toLowerCase() in g)) throw Error(`path: unknown command ${r}`);
			if (a = r, n++, g[r.toLowerCase()] === 0) {
				t.push([a, []]);
				continue;
			}
		}
		if (!a) throw Error("path: must start with a command");
		let l = g[a.toLowerCase()];
		o = [];
		for (let e = 0; e < l; e++) {
			let n = a.toLowerCase() === "a" && (e === 3 || e === 4) ? c() : s();
			if (n === null) {
				if (e === 0) return t;
				throw Error("path: missing numbers");
			}
			o.push(n);
		}
		t.push([a, o]), a === "M" ? a = "L" : a === "m" && (a = "l");
	}
	return t;
}
function v(e, t, n, r, i, a, o, s, c) {
	if (n === 0 || r === 0 || e === s && t === c) return [[
		"L",
		s,
		c
	]];
	let l = i * Math.PI / 180, u = Math.cos(l), d = Math.sin(l);
	n = Math.abs(n), r = Math.abs(r);
	let f = (e - s) / 2, p = (t - c) / 2, m = u * f + d * p, h = -d * f + u * p, g = m * m / (n * n) + h * h / (r * r);
	g > 1 && (n *= Math.sqrt(g), r *= Math.sqrt(g));
	let _ = n * n * r * r - n * n * h * h - r * r * m * m, v = n * n * h * h + r * r * m * m, y = Math.sqrt(Math.max(0, _ / v));
	a === o && (y = -y);
	let b = y * n * h / r, x = -y * r * m / n, S = u * b - d * x + (e + s) / 2, C = d * b + u * x + (t + c) / 2, w = (e, t, n, r) => Math.atan2(e * r - t * n, e * n + t * r), T = w(1, 0, (m - b) / n, (h - x) / r), E = w((m - b) / n, (h - x) / r, (-m - b) / n, (-h - x) / r);
	!o && E > 0 ? E -= 2 * Math.PI : o && E < 0 && (E += 2 * Math.PI);
	let D = Math.max(1, Math.ceil(Math.abs(E) / (Math.PI / 2) - 1e-9)), O = E / D, k = 4 / 3 * Math.tan(O / 4), A = [], j = (e) => {
		let t = Math.cos(e), i = Math.sin(e), a = n * t, o = r * i, s = -n * i, c = r * t;
		return [
			S + u * a - d * o,
			C + d * a + u * o,
			u * s - d * c,
			d * s + u * c
		];
	}, M = T;
	for (let e = 0; e < D; e++) {
		let [e, t, n, r] = j(M), [i, a, o, s] = j(M + O);
		A.push([
			"C",
			e + k * n,
			t + k * r,
			i - k * o,
			a - k * s,
			i,
			a
		]), M += O;
	}
	let N = A[A.length - 1];
	return N[5] = s, N[6] = c, A;
}
function y(e) {
	let t = [], n = 0, r = 0, i = 0, a = 0, o = null, s = null;
	for (let [c, l] of _(e)) {
		let e = c === c.toLowerCase(), u = e ? n : 0, d = e ? r : 0, f = null, p = null;
		switch (c.toUpperCase()) {
			case "M":
				n = l[0] + u, r = l[1] + d, i = n, a = r, t.push([
					"M",
					n,
					r
				]);
				break;
			case "L":
				n = l[0] + u, r = l[1] + d, t.push([
					"L",
					n,
					r
				]);
				break;
			case "H":
				n = l[0] + (e ? n : 0), t.push([
					"L",
					n,
					r
				]);
				break;
			case "V":
				r = l[0] + (e ? r : 0), t.push([
					"L",
					n,
					r
				]);
				break;
			case "C": {
				let e = [
					l[0] + u,
					l[1] + d,
					l[2] + u,
					l[3] + d,
					l[4] + u,
					l[5] + d
				];
				t.push([
					"C",
					e[0],
					e[1],
					e[2],
					e[3],
					e[4],
					e[5]
				]), f = [e[2], e[3]], n = e[4], r = e[5];
				break;
			}
			case "S": {
				let e = o ? 2 * n - o[0] : n, i = o ? 2 * r - o[1] : r, a = [
					l[0] + u,
					l[1] + d,
					l[2] + u,
					l[3] + d
				];
				t.push([
					"C",
					e,
					i,
					a[0],
					a[1],
					a[2],
					a[3]
				]), f = [a[0], a[1]], n = a[2], r = a[3];
				break;
			}
			case "Q": {
				let e = [
					l[0] + u,
					l[1] + d,
					l[2] + u,
					l[3] + d
				];
				t.push([
					"Q",
					e[0],
					e[1],
					e[2],
					e[3]
				]), p = [e[0], e[1]], n = e[2], r = e[3];
				break;
			}
			case "T": {
				let e = s ? 2 * n - s[0] : n, i = s ? 2 * r - s[1] : r, a = l[0] + u, o = l[1] + d;
				t.push([
					"Q",
					e,
					i,
					a,
					o
				]), p = [e, i], n = a, r = o;
				break;
			}
			case "A": {
				let e = l[5] + u, i = l[6] + d;
				t.push(...v(n, r, l[0], l[1], l[2], l[3], l[4], e, i)), n = e, r = i;
				break;
			}
			case "Z": t.push(["Z"]), n = i, r = a;
		}
		o = f, s = p;
	}
	return t;
}
function b(e, t, n = (e, t) => [e, t]) {
	for (let r of t) if (r[0] === "M") e.moveTo(...n(r[1], r[2]));
	else if (r[0] === "L") e.lineTo(...n(r[1], r[2]));
	else if (r[0] === "C") {
		let [t, i] = n(r[1], r[2]), [a, o] = n(r[3], r[4]), [s, c] = n(r[5], r[6]);
		e.bezierCurveTo(t, i, a, o, s, c);
	} else if (r[0] === "Q") {
		let [t, i] = n(r[1], r[2]), [a, o] = n(r[3], r[4]);
		e.quadraticCurveTo(t, i, a, o);
	} else e.closePath();
}
function x(e, t = 8) {
	let n = [], r = null, i = 0, a = 0, o = (e, t) => {
		r = {
			points: [[e, t]],
			closed: !1
		}, n.push(r);
	};
	for (let n of e) {
		if (n[0] === "M") {
			i = n[1], a = n[2], o(i, a);
			continue;
		}
		r || o(i, a);
		let e = r.points;
		if (n[0] === "L") i = n[1], a = n[2], e.push([i, a]);
		else if (n[0] === "C") {
			for (let r = 1; r <= t; r++) {
				let o = r / t, s = 1 - o;
				e.push([s * s * s * i + 3 * s * s * o * n[1] + 3 * s * o * o * n[3] + o * o * o * n[5], s * s * s * a + 3 * s * s * o * n[2] + 3 * s * o * o * n[4] + o * o * o * n[6]]);
			}
			i = n[5], a = n[6];
		} else if (n[0] === "Q") {
			for (let r = 1; r <= t; r++) {
				let o = r / t, s = 1 - o;
				e.push([s * s * i + 2 * s * o * n[1] + o * o * n[3], s * s * a + 2 * s * o * n[2] + o * o * n[4]]);
			}
			i = n[3], a = n[4];
		} else {
			r.closed = !0;
			let t = e[0];
			i = t[0], a = t[1], r = null;
		}
	}
	return n.filter((e) => e.points.length > 1);
}
function S(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a of x(e, 12)) for (let [e, o] of a.points) e < t && (t = e), o < n && (n = o), e > r && (r = e), o > i && (i = o);
	return Number.isFinite(t) ? {
		x: t,
		y: n,
		width: r - t,
		height: i - n
	} : {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
}
//#endregion
//#region src/custom/shapes.ts
var C = {
	x: 0,
	y: 0,
	rot: 0,
	sx: 1,
	sy: 1
}, w = (e, t) => [
	e[0] * t[0] + e[2] * t[1],
	e[1] * t[0] + e[3] * t[1],
	e[0] * t[2] + e[2] * t[3],
	e[1] * t[2] + e[3] * t[3],
	e[0] * t[4] + e[2] * t[5] + e[4],
	e[1] * t[4] + e[3] * t[5] + e[5]
];
function T(e) {
	let t = Math.cos(e.rot), n = Math.sin(e.rot);
	return [
		e.sx * t,
		e.sx * n,
		-e.sy * n,
		e.sy * t,
		e.x,
		e.y
	];
}
function E(e) {
	let t = Math.hypot(e[0], e[1]) || 0, n = Math.atan2(e[1], e[0]), r = t ? (e[0] * e[3] - e[1] * e[2]) / t : Math.hypot(e[2], e[3]);
	return {
		x: e[4],
		y: e[5],
		rot: n,
		sx: t,
		sy: r
	};
}
function D(e) {
	let t = e[0] * e[3] - e[1] * e[2];
	return t ? [
		e[3] / t,
		-e[1] / t,
		-e[2] / t,
		e[0] / t,
		(e[2] * e[5] - e[3] * e[4]) / t,
		(e[1] * e[4] - e[0] * e[5]) / t
	] : null;
}
var O = (e, t, n) => [e[0] * t + e[2] * n + e[4], e[1] * t + e[3] * n + e[5]], k = /* @__PURE__ */ new Map();
function A(e) {
	let t = k.get(e);
	if (!t) {
		let n = [];
		try {
			n = y(e);
		} catch {
			n = [];
		}
		t = {
			cmds: n,
			b: S(n)
		}, k.size > 500 && k.clear(), k.set(e, t);
	}
	return t;
}
function j(e, t, n = {
	m: [
		1,
		0,
		0,
		1,
		0,
		0
	],
	opacity: 1,
	style: {},
	z: 0
}, r = "0") {
	if (!e || e.ignore) return;
	let i = e.originX ?? 0, a = e.originY ?? 0, o = T({
		x: (e.x ?? 0) + i,
		y: (e.y ?? 0) + a,
		rot: e.rotation ?? 0,
		sx: e.scaleX ?? 1,
		sy: e.scaleY ?? 1
	}), s = w(w(n.m, o), [
		1,
		0,
		0,
		1,
		-i,
		-a
	]), { opacity: c, ...l } = e.style ?? {}, u = n.opacity * (c ?? 1), d = n.z + (e.z ?? 0);
	if (e.type === "group") {
		let i = {
			...n.style,
			...l
		}, a = (e) => e ? {
			opacity: e.opacity,
			scale: e.scale,
			style: e.style
		} : void 0, o = a(e.enterFrom) ?? n.enter, c = a(e.leaveTo) ?? n.leave;
		e.children.forEach((e, n) => {
			e && j(e, t, {
				m: s,
				opacity: u,
				style: i,
				z: d,
				enter: o,
				leave: c
			}, `${r}.${n}`);
		});
		return;
	}
	let f = e.id !== void 0 && e.id !== null ? `#${e.id}` : `${t.si}:${t.di}:${r}`;
	t.out.push({
		key: f,
		type: e.type,
		shape: "shape" in e ? { ...e.shape } : {},
		style: {
			...n.style,
			...l
		},
		emphasis: e.emphasis?.style,
		tf: E(s),
		opacity: u,
		scale: 1,
		z: d,
		order: t.out.length,
		si: t.si,
		di: t.di,
		silent: e.silent,
		label: e.label,
		enterFrom: e.enterFrom ?? n.enter,
		leaveTo: e.leaveTo ?? n.leave,
		info: e.info,
		draggable: e.draggable,
		cursor: e.cursor,
		clip: t.clip ?? null
	});
}
var M = (e, t) => e.length * (parseFloat(t.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? "12") * .58);
function N(e, t) {
	return e.font ? e.font : `${e.fontWeight ?? 400} ${e.fontSize ?? 12}px ${e.fontFamily ?? t}`;
}
function P(e) {
	let t = +e.x || 0, n = +e.y || 0, r = +e.width || 0, i = +e.height || 0;
	return r < 0 && (t += r, r = -r), i < 0 && (n += i, i = -i), {
		x: t,
		y: n,
		w: r,
		h: i
	};
}
function ee(e) {
	let { cmds: t, b: n } = A(String(e.pathData ?? "")), r = e.x ?? n.x, i = e.y ?? n.y;
	if (e.width === void 0 && e.height === void 0) {
		let r = (e.x ?? n.x) - n.x, i = (e.y ?? n.y) - n.y;
		return {
			cmds: t,
			f: (e, t) => [e + r, t + i]
		};
	}
	let a = e.width ?? n.width, o = e.height ?? n.height, s = n.width ? a / n.width : 1, c = n.height ? o / n.height : 1, l = r, u = i;
	if ((e.layout ?? "center") === "center") {
		let e = Math.min(s, c);
		l += (a - n.width * e) / 2, u += (o - n.height * e) / 2, s = c = e;
	}
	return {
		cmds: t,
		f: (e, t) => [l + (e - n.x) * s, u + (t - n.y) * c]
	};
}
function F(e, t, n) {
	let r = e.style, i = String(r.text ?? "").split("\n"), a = r.fontSize ?? 12, o = r.lineHeight ?? a * 1.25, s = e.textW ?? Math.max(0, ...i.map((e) => t(e, N(r, n)))), c = i.length * o, l = r.align ?? "left", u = l === "center" ? -s / 2 : l === "right" || l === "end" ? -s : 0, d = r.verticalAlign ?? "top";
	return {
		x: u,
		y: d === "middle" ? -c / 2 : d === "bottom" ? -c : 0,
		w: s,
		h: c
	};
}
function te(e, t = M, n = "sans-serif") {
	let r = e.shape;
	switch (e.type) {
		case "rect":
		case "image": return P(r);
		case "circle": return {
			x: r.cx - r.r,
			y: r.cy - r.r,
			w: 2 * r.r,
			h: 2 * r.r
		};
		case "ellipse": return {
			x: r.cx - r.rx,
			y: r.cy - r.ry,
			w: 2 * r.rx,
			h: 2 * r.ry
		};
		case "line": return {
			x: Math.min(r.x1, r.x2),
			y: Math.min(r.y1, r.y2),
			w: Math.abs(r.x2 - r.x1),
			h: Math.abs(r.y2 - r.y1)
		};
		case "text": return F(e, t, n);
		default: {
			let t = ne(e, 48);
			if (!t.length) return {
				x: 0,
				y: 0,
				w: 0,
				h: 0
			};
			let n = Infinity, r = Infinity, i = -Infinity, a = -Infinity;
			for (let [e, o] of t) n = Math.min(n, e), r = Math.min(r, o), i = Math.max(i, e), a = Math.max(a, o);
			return {
				x: n,
				y: r,
				w: i - n,
				h: a - r
			};
		}
	}
}
function ne(e, t = 48) {
	let n = e.shape;
	switch (e.type) {
		case "rect":
		case "image":
		case "text": {
			let t = e.type === "text" ? F(e, M, "sans-serif") : P(n);
			return [
				[t.x, t.y],
				[t.x + t.w, t.y],
				[t.x + t.w, t.y + t.h],
				[t.x, t.y + t.h]
			];
		}
		case "circle":
		case "ellipse": {
			let r = e.type === "circle" ? n.r : n.rx, i = e.type === "circle" ? n.r : n.ry;
			return Array.from({ length: t }, (e, a) => {
				let o = -Math.PI / 2 + a / t * Math.PI * 2;
				return [n.cx + r * Math.cos(o), n.cy + i * Math.sin(o)];
			});
		}
		case "sector":
		case "arc": {
			let r = n.startAngle, i = n.endAngle, a = Math.max(2, Math.ceil(Math.abs(i - r) / (Math.PI * 2) * t)), o = [];
			for (let e = 0; e <= a; e++) {
				let t = r + (i - r) * e / a;
				o.push([n.cx + n.r * Math.cos(t), n.cy + n.r * Math.sin(t)]);
			}
			if (e.type === "arc") return o;
			let s = n.r0 ?? 0;
			if (s > 0) for (let e = a; e >= 0; e--) {
				let t = r + (i - r) * e / a;
				o.push([n.cx + s * Math.cos(t), n.cy + s * Math.sin(t)]);
			}
			else o.push([n.cx, n.cy]);
			return o;
		}
		case "polygon":
		case "polyline": return (n.points ?? []).map((e) => [e[0], e[1]]);
		case "line": return [[n.x1, n.y1], [n.x2, n.y2]];
		case "path": {
			let { cmds: e, f: t } = ee(n), r = x(e, 8), i = [], a = -1;
			for (let e of r) {
				let n = e.points.map(([e, n]) => t(e, n)), r = Math.abs(I(n));
				r > a && (a = r, i = n);
			}
			return i;
		}
	}
	return [];
}
function I(e) {
	let t = 0;
	for (let n = 0, r = e.length - 1; n < e.length; r = n++) t += (e[r][0] - e[n][0]) * (e[r][1] + e[n][1]);
	return t / 2;
}
function L(e, t, n = !0) {
	if (!e.length) return Array.from({ length: t }, () => [0, 0]);
	if (e.length === 1) return Array.from({ length: t }, () => [e[0][0], e[0][1]]);
	let r = n ? [...e, e[0]] : e, i = [0];
	for (let e = 1; e < r.length; e++) i.push(i[e - 1] + Math.hypot(r[e][0] - r[e - 1][0], r[e][1] - r[e - 1][1]));
	let a = i[i.length - 1];
	if (!a) return Array.from({ length: t }, () => [e[0][0], e[0][1]]);
	let o = [], s = 1;
	for (let e = 0; e < t; e++) {
		let c = n ? e / t * a : e / Math.max(1, t - 1) * a;
		for (; s < i.length - 1 && i[s] < c;) s++;
		let l = i[s] - i[s - 1] || 1, u = (c - i[s - 1]) / l;
		o.push([r[s - 1][0] + (r[s][0] - r[s - 1][0]) * u, r[s - 1][1] + (r[s][1] - r[s - 1][1]) * u]);
	}
	return o;
}
function re(e, t) {
	let n = t.length;
	if (n !== e.length || n < 3) return t;
	let r = t;
	Math.sign(I(e)) !== Math.sign(I(t)) && I(e) && I(t) && (r = [...t].reverse());
	let i = 0, a = Infinity, o = n > 64 ? 2 : 1;
	for (let t = 0; t < n; t += o) {
		let o = 0;
		for (let i = 0; i < n && o < a; i++) {
			let a = e[i], s = r[(i + t) % n];
			o += (a[0] - s[0]) ** 2 + (a[1] - s[1]) ** 2;
		}
		o < a && (a = o, i = t);
	}
	return i ? r.map((e, t) => r[(t + i) % n]) : r;
}
function ie(e, t = 48) {
	let n = R(e);
	return ne(e, t).map(([e, t]) => O(n, e, t));
}
function R(e, t, n) {
	let r = T(e.tf);
	if (e.scale !== 1) {
		let i = te(e, t, n), a = i.x + i.w / 2, o = i.y + i.h / 2;
		r = w(r, [
			e.scale,
			0,
			0,
			e.scale,
			a * (1 - e.scale),
			o * (1 - e.scale)
		]);
	}
	return r;
}
function ae(e, t, n) {
	let r = !1;
	for (let i = 0, a = n.length - 1; i < n.length; a = i++) {
		let [o, s] = n[i], [c, l] = n[a];
		s > t != l > t && e < (c - o) * (t - s) / (l - s) + o && (r = !r);
	}
	return r;
}
function z(e, t, n, r) {
	let i = r[0] - n[0], a = r[1] - n[1], o = i * i + a * a, s = o ? Math.max(0, Math.min(1, ((e - n[0]) * i + (t - n[1]) * a) / o)) : 0;
	return Math.hypot(e - n[0] - s * i, t - n[1] - s * a);
}
function B(e, t, n, r, i = !1) {
	for (let i = 1; i < n.length; i++) if (z(e, t, n[i - 1], n[i]) <= r) return !0;
	return i && n.length > 2 && z(e, t, n[n.length - 1], n[0]) <= r;
}
var V = (e) => e !== void 0 && e !== "none" && e !== "transparent";
function oe(e, t, n) {
	let r = Math.min(t, n), i = Math.max(t, n);
	if (i - r >= Math.PI * 2 - 1e-9) return !0;
	let a = Math.PI * 2;
	r = (r % a + a) % a;
	let o = i - Math.min(t, n);
	return ((e - r) % a + a) % a <= o + 1e-9;
}
function se(e, t, n, r = 3, i = M, a = "sans-serif") {
	if (e.opacity <= .02 || e.scale <= .01 || e.clip && (t < e.clip.x || n < e.clip.y || t > e.clip.x + e.clip.width || n > e.clip.y + e.clip.height)) return !1;
	let o = D(R(e, i, a));
	if (!o) return !1;
	let [s, c] = O(o, t, n), l = Math.hypot(e.tf.sx, 0) * e.scale || 1, u = e.shape, d = e.style, f = V(d.stroke) ? d.lineWidth ?? 1 : 0, p = (Math.max(f / 2, r) + 0) / l, m = V(d.fill);
	switch (e.type) {
		case "rect":
		case "image": {
			let t = P(u), n = m || e.type === "image" ? f / 2 : 0;
			return m || e.type === "image" ? s >= t.x - n && s <= t.x + t.w + n && c >= t.y - n && c <= t.y + t.h + n : B(s, c, ne(e), p, !0);
		}
		case "text": {
			let t = F(e, i, a);
			return s >= t.x - 2 && s <= t.x + t.w + 2 && c >= t.y - 2 && c <= t.y + t.h + 2;
		}
		case "circle":
		case "ellipse": {
			let t = e.type === "circle" ? u.r : u.rx, n = e.type === "circle" ? u.r : u.ry;
			if (!(t > 0 && n > 0)) return !1;
			let r = s - u.cx, i = c - u.cy;
			if (m) return (r / (t + f / 2)) ** 2 + (i / (n + f / 2)) ** 2 <= 1;
			let a = Math.hypot(r / t, i / n);
			return Math.abs(a - 1) * Math.min(t, n) <= p;
		}
		case "sector": {
			let e = s - u.cx, t = c - u.cy, n = Math.hypot(e, t);
			return n < (u.r0 ?? 0) || n > u.r + f / 2 ? !1 : oe(Math.atan2(t, e), u.startAngle, u.endAngle);
		}
		case "arc": {
			let e = s - u.cx, t = c - u.cy;
			return Math.abs(Math.hypot(e, t) - u.r) <= p && oe(Math.atan2(t, e), u.startAngle, u.endAngle);
		}
		case "polygon": {
			let e = u.points ?? [];
			return m && ae(s, c, e) || B(s, c, e, p, !0);
		}
		case "polyline": return B(s, c, u.points ?? [], p);
		case "line": return z(s, c, [u.x1, u.y1], [u.x2, u.y2]) <= p;
		case "path": {
			let { cmds: e, f: t } = ee(u), n = x(e, 8).map((e) => ({
				closed: e.closed,
				pts: e.points.map(([e, n]) => t(e, n))
			}));
			if (m) {
				let e = !1;
				for (let t of n) ae(s, c, t.pts) && (e = !e);
				if (e) return !0;
			}
			return n.some((e) => B(s, c, e.pts, p, e.closed));
		}
	}
	return !1;
}
var H = (e, t, n) => e + (t - e) * n, U = /* @__PURE__ */ new Map();
function W(e) {
	let t = U.get(e);
	return t || (t = r(e), U.size > 2e3 && U.clear(), U.set(e, t)), t;
}
function G(e, t, n) {
	if (e === t) return t;
	if (typeof e != "string" || typeof t != "string" || !V(e) || !V(t)) {
		if (typeof e == "string" && typeof t == "string") {
			if (!V(e)) return o([...W(t).slice(0, 3), W(t)[3] * n]);
			if (!V(t)) return o([...W(e).slice(0, 3), W(e)[3] * (1 - n)]);
		}
		return e === void 0 ? t : t === void 0 ? n < 1 ? e : t : n < .5 ? e : t;
	}
	let r = W(e), i = W(t);
	return o([
		H(r[0], i[0], n),
		H(r[1], i[1], n),
		H(r[2], i[2], n),
		H(r[3], i[3], n)
	]);
}
function ce(e, t, n) {
	let r = { ...t };
	r.fill = G(e.fill, t.fill, n), r.stroke = G(e.stroke, t.stroke, n);
	for (let i of [
		"lineWidth",
		"fillOpacity",
		"strokeOpacity",
		"fontSize",
		"shadowBlur"
	]) {
		let a = e[i], o = t[i];
		typeof a == "number" && typeof o == "number" && (r[i] = H(a, o, n));
	}
	return e.text !== t.text && n < .5 && (r.text = e.text), r;
}
function le(e, t, n) {
	let r = (t - e) % (Math.PI * 2);
	return r > Math.PI && (r -= Math.PI * 2), r < -Math.PI && (r += Math.PI * 2), e + r * n;
}
function ue(e, t, n, r) {
	let i = e, a = t;
	if (i.length !== a.length) {
		let e = Math.max(i.length, a.length);
		i = L(i, e, r), a = L(a, e, r);
	}
	return a.map((e, t) => [H(i[t][0], e[0], n), H(i[t][1], e[1], n)]);
}
function de(e, t) {
	return e.type === t.type ? e.type !== "path" || e.shape.pathData === t.shape.pathData : !1;
}
function fe(e, t) {
	if (de(e, t)) return !0;
	let n = (e) => e.type !== "text" && e.type !== "image";
	return n(e) && n(t);
}
function K(e, t, n) {
	if (n >= 1) return t;
	let r = {
		...t,
		style: ce(e.style, t.style, n),
		opacity: H(e.opacity, t.opacity, n),
		scale: H(e.scale, t.scale, n)
	};
	if (de(e, t)) {
		let i = { ...t.shape };
		for (let r of Object.keys(t.shape)) {
			let a = e.shape[r], o = t.shape[r];
			typeof a == "number" && typeof o == "number" ? i[r] = H(a, o, n) : r === "points" && Array.isArray(a) && Array.isArray(o) ? i[r] = ue(a, o, n, t.type === "polygon") : r === "r" && Array.isArray(o) && (i[r] = o.map((e, t) => H(Array.isArray(a) ? a[t] ?? e : typeof a == "number" ? a : e, e, n)));
		}
		return r.shape = i, r.tf = {
			x: H(e.tf.x, t.tf.x, n),
			y: H(e.tf.y, t.tf.y, n),
			rot: le(e.tf.rot, t.tf.rot, n),
			sx: H(e.tf.sx, t.tf.sx, n),
			sy: H(e.tf.sy, t.tf.sy, n)
		}, r;
	}
	let i = (e) => e.type === "polyline" || e.type === "line" || e.type === "arc", a = L(ie(e), 40, !i(e)), o = re(a, L(ie(t), 40, !i(t)));
	return r.type = "polygon", r.shape = { points: a.map((e, t) => [H(e[0], o[t][0], n), H(e[1], o[t][1], n)]) }, r.tf = { ...C }, r.scale = 1, r.label = n > .5 ? t.label : e.label, !V(e.style.fill) && V(t.style.fill) && typeof t.style.fill == "string" && (r.style.fill = G("transparent", t.style.fill, n)), V(e.style.fill) && !V(t.style.fill) && typeof e.style.fill == "string" && (r.style.fill = G(e.style.fill, "transparent", n)), r;
}
function pe(e, t, n) {
	let r = t ?? n, i = {
		...e,
		tf: { ...e.tf },
		shape: {
			...e.shape,
			...r.shape ?? {}
		},
		style: {
			...e.style,
			...r.style ?? {}
		}
	};
	return r.opacity !== void 0 && (i.opacity = r.opacity * 1), r.scale !== void 0 && (i.scale = r.scale), r.x !== void 0 && (i.tf.x = r.x), r.y !== void 0 && (i.tf.y = r.y), r.rotation !== void 0 && (i.tf.rot = r.rotation), i;
}
var me = /* @__PURE__ */ new Map();
function he(e, t) {
	if (typeof e != "string") return e;
	let n = me.get(e);
	return n || (n = new Image(), n.onload = t, n.src = e, me.set(e, n)), n.complete && n.naturalWidth ? n : null;
}
function q(e, t, n) {
	if (typeof t == "string") return t;
	let r = t, i = (e, t) => r.global ? e ?? t : n.x + (e ?? t) * n.w, a = (e, t) => r.global ? e ?? t : n.y + (e ?? t) * n.h, o = r.type === "radial" ? e.createRadialGradient(i(r.x, .5), a(r.y, .5), 0, i(r.x, .5), a(r.y, .5), Math.max(.001, r.global ? r.r ?? 1 : (r.r ?? .5) * Math.max(n.w, n.h))) : e.createLinearGradient(i(r.x, 0), a(r.y, 0), i(r.x2, 0), a(r.y2, 1));
	for (let [e, t] of r.stops) o.addColorStop(Math.min(1, Math.max(0, e)), t);
	return o;
}
function ge(e, t, n) {
	let r = t.length;
	if (r < 3) {
		t.forEach((t, n) => n ? e.lineTo(t[0], t[1]) : e.moveTo(t[0], t[1]));
		return;
	}
	let i = (e) => n ? t[(e + r) % r] : t[Math.max(0, Math.min(r - 1, e))];
	e.moveTo(t[0][0], t[0][1]);
	let a = n ? r : r - 1;
	for (let t = 0; t < a; t++) {
		let n = i(t - 1), r = i(t), a = i(t + 1), o = i(t + 2);
		e.bezierCurveTo(r[0] + (a[0] - n[0]) / 6, r[1] + (a[1] - n[1]) / 6, a[0] - (o[0] - r[0]) / 6, a[1] - (o[1] - r[1]) / 6, a[0], a[1]);
	}
}
function _e(e, t, n, r, i, a) {
	let o = (Array.isArray(a) ? [
		a[0] ?? 0,
		a[1] ?? a[0] ?? 0,
		a[2] ?? a[0] ?? 0,
		a[3] ?? a[1] ?? a[0] ?? 0
	] : [
		a ?? 0,
		a ?? 0,
		a ?? 0,
		a ?? 0
	]).map((e) => Math.max(0, Math.min(e, r / 2, i / 2)));
	o.some((e) => e > 0) ? (e.moveTo(t + o[0], n), e.lineTo(t + r - o[1], n), e.arcTo(t + r, n, t + r, n + o[1], o[1]), e.lineTo(t + r, n + i - o[2]), e.arcTo(t + r, n + i, t + r - o[2], n + i, o[2]), e.lineTo(t + o[3], n + i), e.arcTo(t, n + i, t, n + i - o[3], o[3]), e.lineTo(t, n + o[0]), e.arcTo(t, n, t + o[0], n, o[0]), e.closePath()) : e.rect(t, n, r, i);
}
function ve(e, t) {
	let n = t.shape;
	switch (e.beginPath(), t.type) {
		case "rect": {
			let t = P(n);
			_e(e, t.x, t.y, t.w, t.h, n.r);
			break;
		}
		case "circle":
			n.r > 0 && e.arc(n.cx, n.cy, n.r, 0, Math.PI * 2);
			break;
		case "ellipse":
			n.rx > 0 && n.ry > 0 && e.ellipse(n.cx, n.cy, n.rx, n.ry, 0, 0, Math.PI * 2);
			break;
		case "sector": {
			let t = Math.max(0, n.r0 ?? 0), r = Math.max(0, n.r), i = n.endAngle < n.startAngle;
			e.arc(n.cx, n.cy, r, n.startAngle, n.endAngle, i), t > 0 ? e.arc(n.cx, n.cy, t, n.endAngle, n.startAngle, !i) : e.lineTo(n.cx, n.cy), e.closePath();
			break;
		}
		case "arc":
			e.arc(n.cx, n.cy, Math.max(0, n.r), n.startAngle, n.endAngle, n.endAngle < n.startAngle);
			break;
		case "polygon":
		case "polyline": {
			let r = n.points ?? [];
			n.smooth ? ge(e, r, t.type === "polygon") : r.forEach((t, n) => n ? e.lineTo(t[0], t[1]) : e.moveTo(t[0], t[1])), t.type === "polygon" && e.closePath();
			break;
		}
		case "line":
			e.moveTo(n.x1, n.y1), e.lineTo(n.x2, n.y2);
			break;
		case "path": {
			let { cmds: t, f: r } = ee(n);
			b(e, t, r);
			break;
		}
	}
}
function ye(e, t, n, r = t.style) {
	let i = t.opacity;
	if (i <= .002 || t.scale <= .001) return;
	let a = R(t, (t, n) => (e.font = n, e.measureText(t).width), n.family), o = n.dpr;
	if (e.setTransform(a[0] * o, a[1] * o, a[2] * o, a[3] * o, a[4] * o, a[5] * o), r.shadowBlur && (e.shadowBlur = r.shadowBlur * o, e.shadowColor = r.shadowColor ?? "rgba(0,0,0,0.4)", e.shadowOffsetX = (r.shadowOffsetX ?? 0) * o, e.shadowOffsetY = (r.shadowOffsetY ?? 0) * o), t.type === "text") {
		let a = String(r.text ?? "");
		if (a) {
			e.font = N(r, n.family), e.textAlign = r.align ?? "left";
			let o = r.verticalAlign ?? "top";
			e.textBaseline = o === "middle" ? "middle" : o === "bottom" ? "alphabetic" : "top";
			let s = a.split("\n"), c = r.fontSize ?? 12, l = r.lineHeight ?? c * 1.25;
			t.textW = Math.max(...s.map((t) => e.measureText(t).width));
			let u = o === "middle" ? -((s.length - 1) * l) / 2 : o === "bottom" ? -(s.length - 1) * l - c * .2 : 0, d = F(t, M, n.family);
			V(r.stroke) && (e.globalAlpha = i * (r.strokeOpacity ?? 1), e.strokeStyle = q(e, r.stroke, d), e.lineWidth = r.lineWidth ?? 3, e.lineJoin = "round", s.forEach((t, n) => e.strokeText(t, 0, u + n * l))), e.globalAlpha = i * (r.fillOpacity ?? 1), e.fillStyle = q(e, r.fill ?? n.text, d), s.forEach((t, n) => e.fillText(t, 0, u + n * l));
		}
	} else if (t.type === "image") {
		let a = r.image ? he(r.image, n.onImage) : null, o = P(t.shape);
		a && (e.globalAlpha = i, e.drawImage(a, o.x, o.y, o.w, o.h));
	} else {
		ve(e, t);
		let n = t.type === "line" || t.type === "polyline" || t.type === "arc", a = te(t);
		!n && V(r.fill) && (e.globalAlpha = i * (r.fillOpacity ?? 1), e.fillStyle = q(e, r.fill, a), e.fill(t.type === "path" ? "evenodd" : "nonzero"));
		let o = r.stroke ?? (n ? r.fill : void 0);
		V(o) && (r.lineWidth ?? 1) > 0 && (e.shadowBlur = n ? e.shadowBlur : 0, e.globalAlpha = i * (r.strokeOpacity ?? 1), e.strokeStyle = q(e, o, a), e.lineWidth = r.lineWidth ?? 1, e.lineCap = r.lineCap ?? "butt", e.lineJoin = r.lineJoin ?? "miter", e.setLineDash(r.lineDash ?? []), e.stroke(), e.setLineDash([]));
	}
	e.shadowBlur = 0, e.shadowOffsetX = 0, e.shadowOffsetY = 0, e.globalAlpha = 1;
}
function be(e, t, n) {
	let r = te(e, t, n), i = R(e, t, n), a = [
		O(i, r.x, r.y),
		O(i, r.x + r.w, r.y),
		O(i, r.x + r.w, r.y + r.h),
		O(i, r.x, r.y + r.h)
	], o = a.map((e) => e[0]), s = a.map((e) => e[1]), c = Math.min(...o), l = Math.min(...s);
	return {
		x: c,
		y: l,
		w: Math.max(...o) - c,
		h: Math.max(...s) - l
	};
}
function xe(e, t, n) {
	if (n(e) <= t) return e;
	if (n("…") > t) return "";
	let r = 0, i = e.length;
	for (; r < i;) {
		let a = r + i + 1 >> 1;
		n(e.slice(0, a) + "…") <= t ? r = a : i = a - 1;
	}
	return r ? e.slice(0, r) + "…" : "";
}
function Se(e, t, n, r) {
	let i = t.label;
	if (!i || i.text === "" || i.text === void 0 || t.opacity <= .02) return;
	let a = be(t, (t, n) => (e.font = n, e.measureText(t).width), n.family), o = i.position ?? "inside";
	if (t.clip && o.startsWith("inside")) {
		let e = Math.max(a.x, t.clip.x), n = Math.min(a.x + a.w, t.clip.x + t.clip.width), r = Math.max(a.y, t.clip.y), i = Math.min(a.y + a.h, t.clip.y + t.clip.height);
		if (n <= e || i <= r) return;
		a.x = e, a.y = r, a.w = n - e, a.h = i - r;
	}
	let s = i.fontSize ?? 12, c = i.distance ?? 4, l = `${i.fontWeight ?? 400} ${s}px ${n.family}`;
	e.setTransform(n.dpr, 0, 0, n.dpr, 0, 0), e.font = l;
	let u = String(i.text), d = o.startsWith("inside");
	if (d && (i.overflow ?? "truncate") !== "none") {
		let t = a.w - c * 2;
		if (a.h < s * .9 || (u = i.overflow === "hide" ? e.measureText(u).width <= t ? u : "" : xe(u, t, (t) => e.measureText(t).width), !u)) return;
	}
	let f = a.x + a.w / 2, p = a.y + a.h / 2, m = "center", h = "middle";
	o === "insideLeft" ? (f = a.x + c, m = "left") : o === "insideRight" ? (f = a.x + a.w - c, m = "right") : o === "insideTop" ? (p = a.y + c, h = "top") : o === "insideBottom" ? (p = a.y + a.h - c, h = "bottom") : o === "top" ? (p = a.y - c, h = "bottom") : o === "bottom" ? (p = a.y + a.h + c, h = "top") : o === "left" ? (f = a.x - c, m = "right") : o === "right" && (f = a.x + a.w + c, m = "left"), e.textAlign = m, e.textBaseline = h, e.globalAlpha = Math.min(1, t.opacity), i.stroke && (e.strokeStyle = i.stroke, e.lineWidth = 3, e.lineJoin = "round", e.strokeText(u, f, p)), e.fillStyle = i.color ?? (d ? r(t.style.fill) : n.text), e.fillText(u, f, p), e.globalAlpha = 1;
}
//#endregion
//#region src/custom/custom.ts
var Ce = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", we = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	grid: "rgba(42, 46, 57, 0.75)",
	axis: "#363a45",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: Ce
}, Te = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	grid: "rgba(42, 46, 57, 0.08)",
	axis: "#d1d4dc",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: Ce
}, Ee = [
	"#2962ff",
	"#ff9800",
	"#089981",
	"#f23645",
	"#9c27b0",
	"#00bcd4",
	"#e91e63",
	"#8bc34a",
	"#ffc107",
	"#607d8b"
], J = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), Y = (e, t, n) => Math.min(n, Math.max(t, e)), X = {
	linear: (e) => e,
	cubicOut: (e) => 1 - (1 - e) ** 3,
	cubicInOut: (e) => e < .5 ? 4 * e * e * e : 1 - (-2 * e + 2) ** 3 / 2,
	quadOut: (e) => 1 - (1 - e) * (1 - e),
	backOut: (e) => 1 + 2.70158 * (e - 1) ** 3 + 1.70158 * (e - 1) ** 2,
	elasticOut: (e) => e === 0 || e === 1 ? e : 2 ** (-10 * e) * Math.sin((e * 10 - .75) * (2 * Math.PI / 3)) + 1
};
function Z(e, t, n) {
	if (e === void 0) return n;
	if (typeof e == "number") return e;
	let r = parseFloat(e);
	return e.trim().endsWith("%") ? r / 100 * t : r;
}
var De = class {
	constructor(e, t) {
		this.width = 0, this.height = 0, this.dpr = 1, this.rect = {
			x: 0,
			y: 0,
			width: 0,
			height: 0
		}, this.sx = null, this.sy = null, this.sa = null, this.sr = null, this.polarGeo = null, this.view = {
			x: null,
			y: null
		}, this.hidden = /* @__PURE__ */ new Set(), this.nodes = [], this.drawn = /* @__PURE__ */ new Map(), this.drawnList = [], this.leavingKeys = /* @__PURE__ */ new Set(), this.trans = null, this.hover = null, this.t0 = performance.now(), this.raf = 0, this.handlers = /* @__PURE__ */ new Map(), this.destroyed = !1, this.drag = null, this.lastMouse = null, this.opts = { ...t }, this.root = e, e.classList.add("cu-root"), this.titleEl = document.createElement("div"), this.titleEl.className = "cu-title", this.bodyEl = document.createElement("div"), this.plotEl = document.createElement("div"), this.plotEl.className = "cu-plot", this.canvas = document.createElement("canvas"), this.canvas.className = "cu-canvas", this.canvas.setAttribute("role", "img"), this.ctx = this.canvas.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "cu-tooltip", this.resetEl = document.createElement("button"), this.resetEl.type = "button", this.resetEl.className = "cu-reset", this.resetEl.textContent = "Repor zoom", this.resetEl.addEventListener("click", () => this.resetZoom(!0)), this.legendEl = document.createElement("ul"), this.plotEl.append(this.canvas, this.tooltipEl, this.resetEl), this.bodyEl.append(this.plotEl, this.legendEl), e.append(this.titleEl, this.bodyEl), this.applyLook(), this.renderLegend(), this.bind(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(this.plotEl), this.measure(), this.rebuild(!0);
	}
	setOptions(e, t = !0) {
		this.opts = {
			...this.opts,
			...e
		}, (e.xAxis || e.yAxis || e.coordinateSystem) && (this.view = {
			x: null,
			y: null
		}), this.applyLook(), this.renderLegend(), this.rebuild(t);
	}
	setData(e, t = 0, n = !0) {
		let r = this.opts.series.slice();
		r[t] && (r[t] = {
			...r[t],
			data: e
		}, this.opts = {
			...this.opts,
			series: r
		}, this.rebuild(n));
	}
	refresh(e = !1) {
		this.rebuild(e);
	}
	toggle(e, t) {
		let n = t ?? !this.hidden.has(e);
		n ? this.hidden.add(e) : this.hidden.delete(e), this.renderLegend(), this.emit("toggle", {
			name: e,
			hidden: n
		}), this.rebuild(!0);
	}
	zoomTo(e, t, n, r = !0) {
		let i = e === "x" ? this.sx : this.sy;
		if (!i) return;
		let a = i.toNumber(t), o = i.toNumber(n);
		Number.isFinite(a) && Number.isFinite(o) && a !== o && (this.view[e] = [Math.min(a, o), Math.max(a, o)], this.rebuild(r), this.emitZoom());
	}
	resetZoom(e = !0) {
		(this.view.x || this.view.y) && (this.view = {
			x: null,
			y: null
		}, this.rebuild(e), this.emitZoom());
	}
	convertToPixel(e) {
		return this.coord(e);
	}
	convertFromPixel(e) {
		let t = (e, t) => e.type === "category" ? e.categories[Y(Math.round(t), 0, e.categories.length - 1)] : t;
		if (this.sx && this.sy) return [t(this.sx, this.sx.invert(e[0])), t(this.sy, this.sy.invert(e[1]))];
		if (this.sa && this.sr && this.polarGeo) {
			let n = this.polarGeo, r = (Math.atan2(e[1] - n.cy, e[0] - n.cx) - n.start) * n.dir / (Math.PI * 2);
			return r = (r % 1 + 1) % 1, [t(this.sa, this.sa.invert(r)), t(this.sr, this.sr.invert(Math.hypot(e[0] - n.cx, e[1] - n.cy)))];
		}
		return [e[0], e[1]];
	}
	getRect() {
		return { ...this.rect };
	}
	on(e, t) {
		this.handlers.has(e) || this.handlers.set(e, /* @__PURE__ */ new Set());
		let n = t;
		return this.handlers.get(e).add(n), () => this.handlers.get(e)?.delete(n);
	}
	resize() {
		this.destroyed || (this.measure(), this.rebuild(!1));
	}
	screenshot() {
		return this.frame(), this.canvas.toDataURL("image/png");
	}
	destroy() {
		this.destroyed = !0, cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("cu-root"), this.titleEl.remove(), this.bodyEl.remove();
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t));
	}
	emitZoom() {
		this.emit("zoom", {
			x: this.view.x,
			y: this.view.y
		});
	}
	applyLook() {
		let e = this.opts, t = {
			...e.theme === "light" ? Te : we,
			...typeof e.theme == "object" ? e.theme : {}
		};
		e.background && (t.background = e.background), this.theme = t;
		let n = {
			"--cu-bg": t.background,
			"--cu-text": t.text,
			"--cu-muted": t.muted,
			"--cu-tt-bg": t.tooltipBg,
			"--cu-tt-text": t.tooltipText,
			"--cu-tt-border": t.tooltipBorder,
			"--cu-font": t.font
		};
		for (let [e, t] of Object.entries(n)) this.root.style.setProperty(e, t);
		let r = typeof e.title == "string" ? { text: e.title } : e.title;
		this.titleEl.style.display = r ? "" : "none", r && (this.titleEl.style.textAlign = r.align ?? "left", this.titleEl.innerHTML = `<b>${J(r.text)}</b>${r.subtext ? `<small>${J(r.subtext)}</small>` : ""}`);
	}
	colorOf(e) {
		let t = this.opts.series[e], n = this.opts.colors ?? Ee;
		return t?.color ?? n[e % n.length];
	}
	legendCfg() {
		let e = this.opts.legend, t = typeof e == "object" ? e : {}, n = this.opts.series.filter((e) => e.name && e.legend !== !1).length;
		return {
			show: (typeof e == "boolean" ? e : t.show) ?? n > 1,
			position: t.position ?? "top",
			interactive: t.interactive ?? !0
		};
	}
	renderLegend() {
		let e = this.legendCfg();
		if (this.bodyEl.className = `cu-body cu-legend-${e.position}`, this.legendEl.className = "cu-legend", this.legendEl.style.display = e.show ? "" : "none", !e.show) return;
		let t = /* @__PURE__ */ new Set();
		this.legendEl.innerHTML = this.opts.series.map((n, r) => {
			if (!n.name || n.legend === !1 || t.has(n.name)) return "";
			t.add(n.name);
			let i = this.hidden.has(n.name);
			return `<li class="cu-legend__item${e.interactive ? " is-interactive" : ""}${i ? " is-hidden" : ""}" data-name="${J(n.name)}"><i class="cu-legend__marker" style="--c:${this.colorOf(r)}"></i><span>${J(n.name)}</span></li>`;
		}).join("");
	}
	measure() {
		let e = this.plotEl.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height)), this.canvas.width = Math.round(this.width * this.dpr), this.canvas.height = Math.round(this.height * this.dpr), this.canvas.style.width = `${this.width}px`, this.canvas.style.height = `${this.height}px`;
	}
	font(e, t = 400) {
		return `${t} ${e}px ${this.theme.font}`;
	}
	textWidth(e, t = 11, n = 400) {
		return this.ctx.font = this.font(t, n), this.ctx.measureText(e).width;
	}
	visibleSeries() {
		return this.opts.series.map((e, t) => t).filter((e) => !(this.opts.series[e].name && this.hidden.has(this.opts.series[e].name)));
	}
	valueOf(e, t, n) {
		if (t == null) return;
		let r = null, i = null;
		if (Array.isArray(t)) r = t;
		else if (typeof t == "object") i = t, Array.isArray(i.value) && (r = i.value);
		else if (n === 0) return t;
		if (typeof n == "string") {
			let t = e.dimensions ? e.dimensions.indexOf(n) : -1;
			return t >= 0 && r ? r[t] : i ? i[n] : void 0;
		}
		if (r) return r[n];
		if (i) {
			if (e.dimensions?.[n] !== void 0) return i[e.dimensions[n]];
			if (n === 0 && "value" in i) return i.value;
		}
	}
	dimsOf(e, t) {
		let n = e.encode?.[t];
		return n === void 0 ? [t === "x" || t === "angle" ? 0 : 1] : Array.isArray(n) ? n : [n];
	}
	axisValues(e) {
		let t = [];
		for (let n of this.visibleSeries()) {
			let r = this.opts.series[n];
			if (r.excludeFromRange) continue;
			let i = this.dimsOf(r, e);
			for (let e of r.data) for (let n of i) t.push(this.valueOf(r, e, n));
		}
		return t;
	}
	layout() {
		let e = this.width, t = this.height, n = this.opts.coordinateSystem ?? "cartesian", r = this.opts.grid ?? {};
		if (this.sx = this.sy = this.sa = this.sr = null, this.polarGeo = null, n === "cartesian") {
			let n = this.opts.xAxis ?? {}, i = this.opts.yAxis ?? {}, a = this.axisValues("x"), o = this.axisValues("y"), s = h(i, o, [t, 0], this.view.y, i.splitNumber ?? Math.max(2, Math.round(t / 60))), c = i.show ?? !0, l = n.show ?? !0, u = c ? Math.max(0, ...s.ticks().map((e) => this.textWidth(e.label))) : 0, d = c && i.name && i.nameLocation === "middle", f = c && i.name && i.nameLocation !== "middle", p = l && n.name ? 18 : 0, m = l ? 22 : 0, g = 0;
			if (l && n.rotate) {
				let r = h(n, a, [0, e]), i = r.ticks(), o = Math.max(0, ...i.map((e) => this.textWidth(e.label))), s = n.rotate * Math.PI / 180;
				if (m = Math.min(t * .4, Math.abs(Math.sin(s)) * o + 16), n.rotate > 0 && i.length) {
					let t = this.textWidth(i[0].label) * Math.cos(s), n = Math.max(1, r.categories.length || i.length);
					g = t + 6 - (r.type === "category" ? e / n / 2 : 0);
				}
			}
			let _ = c ? u + 10 + (d ? 18 : 0) : 0, v = Z(r.left, e, Math.max(g, i.opposite ? 14 : _ + 6)), y = Z(r.right, e, i.opposite ? _ + 6 : 16), b = Z(r.top, t, (f ? 22 : 10) + (n.opposite ? m + p : 0)), x = Z(r.bottom, t, n.opposite ? 10 : m + p + 6);
			this.rect = {
				x: v,
				y: b,
				width: Math.max(1, e - v - y),
				height: Math.max(1, t - b - x)
			};
			let S = this.rect;
			this.sx = h(n, a, [S.x, S.x + S.width], this.view.x, n.splitNumber ?? Math.max(2, Math.round(S.width / 90))), this.sy = h(i, o, [S.y + S.height, S.y], this.view.y, i.splitNumber ?? Math.max(2, Math.round(S.height / 55)));
		} else if (n === "polar") {
			let n = this.opts.polar ?? {}, r = Z(n.center?.[0] ?? "50%", e, e / 2), i = Z(n.center?.[1] ?? "50%", t, t / 2), a = Math.min(e, t) / 2, o = Array.isArray(n.radius) ? n.radius : [0, n.radius ?? Math.max(10, a - 30)], s = Z(o[0], a, 0), c = Z(o[1], a, a - 30), l = this.opts.angleAxis ?? {}, u = this.opts.radiusAxis ?? {};
			this.sa = h({
				...l,
				inverse: !1
			}, this.axisValues("angle"), [0, 1], null, l.splitNumber ?? 8), this.sr = h(u, this.axisValues("radius"), [s, c], null, u.splitNumber ?? 4), this.polarGeo = {
				cx: r,
				cy: i,
				r0: s,
				r: c,
				start: -(l.startAngle ?? 90) * Math.PI / 180,
				dir: (l.clockwise ?? !0) === !!l.inverse ? -1 : 1
			}, this.rect = {
				x: r - c,
				y: i - c,
				width: 2 * c,
				height: 2 * c
			};
		} else {
			let n = Z(r.left, e, 0), i = Z(r.top, t, 0);
			this.rect = {
				x: n,
				y: i,
				width: Math.max(1, e - n - Z(r.right, e, 0)),
				height: Math.max(1, t - i - Z(r.bottom, t, 0))
			};
		}
	}
	angleOf(e) {
		let t = this.polarGeo, n = this.sa.map(e);
		return t.start + t.dir * n * Math.PI * 2;
	}
	coord(e) {
		if (this.sx && this.sy) return [this.sx.map(e[0]), this.sy.map(e[1])];
		if (this.sa && this.sr && this.polarGeo) {
			let t = this.angleOf(e[0]), n = this.sr.map(e[1]);
			return [this.polarGeo.cx + n * Math.cos(t), this.polarGeo.cy + n * Math.sin(t)];
		}
		return [Number(e[0]) || 0, Number(e[1]) || 0];
	}
	size(e, t) {
		let n = (e, t, n, r) => {
			let i = Number(t) || 0;
			if (!e) return i;
			if (e.type === "category") return i * e.band() * r;
			let a = n === void 0 ? (e.type, e.min) : e.toNumber(n);
			return Math.abs(e.mapNum(a + i) - e.mapNum(a)) * r;
		};
		if (this.sx && this.sy) return [n(this.sx, e[0], t?.[0], 1), n(this.sy, e[1], t?.[1], 1)];
		if (this.sa && this.sr) {
			let r = this.sa;
			return [(r.type === "category" ? (Number(e[0]) || 0) * (r.band() || 1 / Math.max(1, r.max - r.min)) : Math.abs(r.mapNum(r.min + (Number(e[0]) || 0)) - r.mapNum(r.min))) * Math.PI * 2, n(this.sr, e[1], t?.[1], 1)];
		}
		return [Number(e[0]) || 0, Number(e[1]) || 0];
	}
	coordInfo() {
		let e = this.rect;
		if (this.polarGeo) {
			let t = this.polarGeo;
			return {
				type: "polar",
				cx: t.cx,
				cy: t.cy,
				r0: t.r0,
				r: t.r,
				...e
			};
		}
		return {
			type: this.sx ? "cartesian" : "none",
			...e
		};
	}
	time() {
		return performance.now() - this.t0;
	}
	progress() {
		return this.trans ? Y((performance.now() - this.trans.start) / (this.trans.duration + this.trans.maxDelay || 1), 0, 1) : 1;
	}
	polarHelpers() {
		let e = this.polarGeo;
		if (!e || !this.sr) return null;
		let t = this.sr;
		return {
			cx: e.cx,
			cy: e.cy,
			r0: e.r0,
			r: e.r,
			angle: (e) => this.angleOf(e),
			radius: (e) => t.map(e),
			point: (t, n) => [e.cx + n * Math.cos(t), e.cy + n * Math.sin(t)]
		};
	}
	makeApi(e, t, n) {
		let r = this.colorOf(t), i = (e) => e === "x" ? this.sx : e === "y" ? this.sy : e === "angle" ? this.sa : this.sr, a = this.ctx;
		return {
			value: (t, r) => this.valueOf(e, e.data[r ?? n.i], t),
			coord: (e) => this.coord(e),
			size: (e, t) => this.size(e, t),
			style: (e) => ({
				fill: r,
				...e ?? {}
			}),
			visual: () => r,
			barLayout: ({ count: e, gap: t = .2, categoryGap: n = .3 }) => {
				let r = this.sx?.type === "category" ? this.sx : this.sy?.type === "category" ? this.sy : this.sx, i = (r ? r.band() || this.rect.width / 10 : 20) * (1 - n), a = i / (e + (e - 1) * t);
				return Array.from({ length: e }, (e, n) => ({
					width: a,
					offset: -i / 2 + a / 2 + n * a * (1 + t)
				}));
			},
			scale: (e, t) => e === "angle" && this.polarGeo ? this.angleOf(t) : i(e)?.map(t) ?? NaN,
			categories: (e) => i(e)?.categories.slice() ?? [],
			rect: { ...this.rect },
			width: this.width,
			height: this.height,
			polar: this.polarHelpers(),
			ctx: a,
			progress: this.progress(),
			time: this.time(),
			theme: this.theme,
			view: {
				x: this.view.x,
				y: this.view.y
			},
			measureText: (e, t = 12, n = 400) => this.textWidth(e, t, n)
		};
	}
	render() {
		let e = [], t = this.opts.series, n = this.visibleSeries().sort((e, n) => (t[e].z ?? 0) - (t[n].z ?? 0) || e - n), r = this.coordInfo(), i = this.time(), a = this.opts.coordinateSystem ?? "cartesian";
		for (let o of n) {
			let n = t[o], s = { i: 0 }, c = this.makeApi(n, o, s), l = n.clip ?? a === "cartesian" ? { ...this.rect } : null, u = [];
			for (let e = 0; e < n.data.length; e++) {
				s.i = e;
				let t = {
					seriesIndex: o,
					seriesName: n.name ?? "",
					dataIndex: e,
					dataCount: n.data.length,
					data: n.data[e],
					color: this.colorOf(o),
					coordSys: r,
					time: i,
					hoverIndex: this.hover && this.hover.si === o ? this.hover.di : -1
				}, a = null;
				try {
					a = n.renderItem(t, c);
				} catch (e) {
					console.error("[custom] renderItem failed", e);
				}
				j(a, {
					si: o,
					di: e,
					out: u,
					clip: l
				});
			}
			u.forEach((e, t) => e.order = t), u.sort((e, t) => e.z - t.z || e.order - t.order), e.push(...u);
		}
		let o = this.opts.graphic;
		if (o) {
			let t = typeof o == "function" ? o({
				width: this.width,
				height: this.height,
				rect: { ...this.rect },
				theme: this.theme,
				time: i,
				ctx: this.ctx
			}) : o, n = Array.isArray(t) ? t : t ? [t] : [], r = [];
			n.forEach((e, t) => j(e, {
				si: -1,
				di: t,
				out: r,
				clip: null
			}));
			for (let e of r) e.silent = !0;
			e.push(...r);
		}
		return e;
	}
	animCfg() {
		let e = this.opts.animation ?? !0;
		if (e === !1) return {
			duration: 0,
			ease: X.cubicOut
		};
		let t = typeof e == "object" ? e : {};
		return {
			duration: t.duration ?? 700,
			ease: X[t.easing ?? "cubicOut"] ?? X.cubicOut,
			delay: t.delay
		};
	}
	rebuild(e) {
		if (this.destroyed) return;
		this.layout(), this.resetEl.classList.toggle("is-visible", !!(this.view.x || this.view.y));
		let t = this.render(), n = this.animCfg();
		if (e && n.duration > 0) {
			let e = new Set(t.map((e) => e.key)), r = [];
			for (let [t, n] of this.drawn) e.has(t) || r.push(n);
			let i = 0;
			if (n.delay) for (let e of t) e.si >= 0 && (i = Math.max(i, n.delay(e.di, e.si) || 0));
			this.trans = {
				start: performance.now(),
				duration: n.duration,
				maxDelay: i,
				from: new Map(this.drawn),
				leaving: r
			};
		} else this.trans = null;
		this.nodes = t, this.hover && !t.some((e) => e.si === this.hover.si && e.di === this.hover.di) && (this.hover = null), this.frame();
	}
	schedule() {
		cancelAnimationFrame(this.raf), !this.destroyed && (this.raf = requestAnimationFrame(() => this.frame()));
	}
	frame() {
		if (this.destroyed) return;
		let e = !!this.opts.live;
		e && (this.nodes = this.render());
		let t = [];
		this.leavingKeys.clear();
		let n = this.trans, r = !1;
		if (n) {
			let e = this.animCfg(), i = performance.now() - n.start, a = e.ease(Y(i / n.duration, 0, 1)), o = i >= n.duration + n.maxDelay;
			for (let e of n.leaving) {
				if (o) continue;
				let n = K(e, pe(e, e.leaveTo, { opacity: 0 }), a);
				n.opacity > .003 && (t.push(n), this.leavingKeys.add(n.key));
			}
			for (let r of this.nodes) {
				if (o) {
					t.push(r);
					continue;
				}
				let a = e.delay && r.si >= 0 && e.delay(r.di, r.si) || 0, s = e.ease(Y((i - a) / n.duration, 0, 1)), c = n.from.get(r.key);
				if (c && !fe(c, r)) {
					if (s < 1) {
						let e = {
							...K(c, pe(c, c.leaveTo, { opacity: 0 }), s),
							key: `${c.key}\u0001old`
						};
						t.push(e), this.leavingKeys.add(e.key);
					}
					c = void 0;
				}
				let l = c ?? pe(r, r.enterFrom, { opacity: 0 });
				t.push(s >= 1 ? r : K(l, r, s));
			}
			o ? this.trans = null : r = !0;
		} else t.push(...this.nodes);
		this.drawnList = t, this.drawn = /* @__PURE__ */ new Map();
		for (let e of t) this.leavingKeys.has(e.key) || this.drawn.set(e.key, e);
		for (let e of t) this.leavingKeys.has(e.key) && !this.drawn.has(e.key) && this.drawn.set(e.key, e);
		this.draw(), (r || e) && this.schedule();
	}
	draw() {
		let e = this.ctx, t = this.theme, n = this.dpr;
		e.setTransform(n, 0, 0, n, 0, 0), e.clearRect(0, 0, this.width, this.height), t.background !== "transparent" && (e.fillStyle = t.background, e.fillRect(0, 0, this.width, this.height)), this.sx && this.sy && this.drawCartesianGrid(), this.polarGeo && this.drawPolarGrid();
		let r = {
			dpr: n,
			family: t.font,
			text: t.text,
			onImage: () => this.frame()
		}, i = this.hover, a = this.opts.series, o = i ? a[i.si] : null, s = o && !o.emphasis?.disabled ? o.emphasis?.focus ?? "none" : "none", c = "";
		e.save();
		let l = (t) => {
			let r = t ? `${t.x},${t.y},${t.width},${t.height}` : "";
			r !== c && (e.restore(), e.save(), c = r, t && (e.setTransform(n, 0, 0, n, 0, 0), e.beginPath(), e.rect(t.x, t.y, t.width, t.height), e.clip()));
		}, u = [];
		for (let t of this.drawnList) {
			l(t.clip);
			let n = !!i && t.si === i.si && t.di === i.di && !this.leavingKeys.has(t.key) && (o?.emphasis?.scope !== "element" || t.key === i.node.key), a = t;
			s !== "none" && i && t.si >= 0 && !n && (s === "self" || t.si !== i.si) && (a = {
				...t,
				opacity: t.opacity * .22
			});
			let c = n && !o?.emphasis?.disabled ? this.emphasisStyle(t) : t.style;
			ye(e, a, r, c), t.label && u.push(a);
		}
		e.restore(), e.save();
		for (let t of u) t.clip && (e.restore(), e.save(), e.setTransform(n, 0, 0, n, 0, 0), e.beginPath(), e.rect(t.clip.x, t.clip.y, t.clip.width, t.clip.height), e.clip()), Se(e, t, r, (e) => this.readable(e));
		e.restore(), this.sx && this.sy && this.drawCartesianAxes(), this.polarGeo && this.drawPolarLabels();
	}
	readable(e) {
		return typeof e != "string" || e === "none" || e === "transparent" ? this.theme.text : a(e) > .45 ? "#131722" : "#ffffff";
	}
	emphasisStyle(e) {
		let t = this.opts.series[e.si]?.emphasis?.style;
		if (e.emphasis || t) return {
			...e.style,
			...t ?? {},
			...e.emphasis ?? {}
		};
		let n = { ...e.style };
		return typeof n.fill == "string" && n.fill !== "none" && n.fill !== "transparent" ? n.fill = i(n.fill, a(n.fill) > .6 ? -.08 : .1) : typeof n.stroke == "string" && n.stroke !== "none" && (n.lineWidth = (n.lineWidth ?? 1) + 1), n;
	}
	axisLabelInterval(e, t, n) {
		if (t.labelInterval !== void 0) return t.labelInterval + 1;
		if (e.type !== "category") return 1;
		let r = e.band() || 1;
		if (!n) return Math.max(1, Math.ceil(16 / r));
		let i = Math.abs(t.rotate ?? 0) > 30 ? 16 : Math.max(0, ...e.categories.map((e) => this.textWidth(e))) + 10;
		return Math.max(1, Math.ceil(i / r));
	}
	drawCartesianGrid() {
		let e = this.ctx, t = this.rect, n = this.theme, r = this.opts.xAxis ?? {}, i = this.opts.yAxis ?? {}, a = this.sx, o = this.sy;
		e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
		let s = (r, i, a) => {
			let o = i.show ?? !0, s = r.ticks(), c = r.type === "category", l = c ? Array.from({ length: r.categories.length + 1 }, (e, t) => r.mapNum(t - .5)) : s.map((e) => r.mapNum(e.value));
			if (i.splitArea) {
				e.fillStyle = n.grid;
				for (let n = 0; n < l.length - 1; n += 2) {
					let r = l[n], i = l[n + 1];
					e.globalAlpha = .35, a ? e.fillRect(Math.min(r, i), t.y, Math.abs(i - r), t.height) : e.fillRect(t.x, Math.min(r, i), t.width, Math.abs(i - r));
				}
				e.globalAlpha = 1;
			}
			if (i.splitLine ?? (o && !a && !c)) {
				e.strokeStyle = n.grid, e.lineWidth = 1, e.beginPath();
				for (let n of l) if (a) {
					if (n < t.x - .5 || n > t.x + t.width + .5) continue;
					let r = Math.round(n) + .5;
					e.moveTo(r, t.y), e.lineTo(r, t.y + t.height);
				} else {
					if (n < t.y - .5 || n > t.y + t.height + .5) continue;
					let r = Math.round(n) + .5;
					e.moveTo(t.x, r), e.lineTo(t.x + t.width, r);
				}
				e.stroke();
			}
		};
		s(a, r, !0), s(o, i, !1);
	}
	drawCartesianAxes() {
		let e = this.ctx, t = this.rect, n = this.theme, r = this.opts.xAxis ?? {}, i = this.opts.yAxis ?? {}, a = this.sx, o = this.sy;
		if (e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.font = this.font(11), r.show ?? !0) {
			let i = !!r.opposite, o = i ? t.y : t.y + t.height;
			(r.axisLine ?? !0) && (e.strokeStyle = n.axis, e.lineWidth = 1, e.beginPath(), e.moveTo(t.x, Math.round(o) + .5), e.lineTo(t.x + t.width, Math.round(o) + .5), e.stroke());
			let s = this.axisLabelInterval(a, r, !0), c = a.ticks(), l = -Infinity;
			if (e.fillStyle = r.color ?? n.muted, c.forEach((c, u) => {
				if (u % s) return;
				let d = a.mapNum(c.value);
				if (d < t.x - 1 || d > t.x + t.width + 1) return;
				if (r.axisTick && (e.strokeStyle = n.axis, e.beginPath(), e.moveTo(Math.round(d) + .5, o), e.lineTo(Math.round(d) + .5, o + (i ? -4 : 4)), e.stroke()), r.rotate) {
					e.save(), e.translate(d, o + (i ? -6 : 6)), e.rotate(-r.rotate * Math.PI / 180), e.textAlign = r.rotate > 0 ? "right" : "left", e.textBaseline = "middle", e.fillText(c.label, 0, 0), e.restore();
					return;
				}
				let f = e.measureText(c.label).width, p = d;
				p = Y(p, f / 2 + 2, this.width - f / 2 - 2), !(a.type !== "category" && p - f / 2 < l + 6) && (l = p + f / 2, e.textAlign = "center", e.textBaseline = i ? "bottom" : "top", e.fillStyle = c.major && a.type === "time" ? n.text : r.color ?? n.muted, e.fillText(c.label, p, o + (i ? -6 : 6)));
			}), r.name) {
				e.fillStyle = n.muted, e.font = this.font(11, 600);
				let a = r.nameLocation === "middle";
				e.textAlign = a ? "center" : "right", e.textBaseline = "bottom";
				let o = i ? t.y - 26 : this.height - 4;
				e.fillText(r.name, a ? t.x + t.width / 2 : t.x + t.width, o), e.font = this.font(11);
			}
		}
		if (i.show ?? !0) {
			let r = !!i.opposite, a = r ? t.x + t.width : t.x;
			(i.axisLine ?? o.type === "category") && (e.strokeStyle = n.axis, e.lineWidth = 1, e.beginPath(), e.moveTo(Math.round(a) + .5, t.y), e.lineTo(Math.round(a) + .5, t.y + t.height), e.stroke());
			let s = this.axisLabelInterval(o, i, !1);
			e.textAlign = r ? "left" : "right", e.textBaseline = "middle", e.fillStyle = i.color ?? n.muted;
			let c = Infinity;
			o.ticks().forEach((l, u) => {
				if (u % s) return;
				let d = o.mapNum(l.value);
				d < t.y - 1 || d > t.y + t.height + 1 || Math.abs(d - c) < 13 || (c = d, i.axisTick && (e.strokeStyle = n.axis, e.beginPath(), e.moveTo(a, Math.round(d) + .5), e.lineTo(a + (r ? 4 : -4), Math.round(d) + .5), e.stroke()), e.fillText(l.label, a + (r ? 8 : -8), Y(d, 7, this.height - 7)));
			}), i.name && (e.fillStyle = n.muted, e.font = this.font(11, 600), i.nameLocation === "middle" ? (e.save(), e.translate(r ? this.width - 6 : 8, t.y + t.height / 2), e.rotate(-Math.PI / 2), e.textAlign = "center", e.textBaseline = "top", e.fillText(i.name, 0, 0), e.restore()) : (e.textAlign = r ? "right" : "left", e.textBaseline = "bottom", e.fillText(i.name, r ? this.width - 6 : 6, t.y - 8)));
		}
	}
	drawPolarGrid() {
		let e = this.ctx, t = this.polarGeo, n = this.theme, r = this.sa, i = this.sr, a = this.opts.angleAxis ?? {}, o = this.opts.radiusAxis ?? {};
		if (e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.strokeStyle = n.grid, e.lineWidth = 1, o.splitLine ?? o.show ?? !0) {
			let n = i.type === "category" ? Array.from({ length: i.categories.length + 1 }, (e, t) => i.mapNum(t - .5)) : i.ticks().map((e) => i.mapNum(e.value));
			e.beginPath();
			for (let r of n) r <= .5 || (e.moveTo(t.cx + r, t.cy), e.arc(t.cx, t.cy, r, 0, Math.PI * 2));
			e.stroke();
		}
		if (a.splitLine ?? a.show ?? !0) {
			let n = r.type === "category" ? Array.from({ length: r.categories.length }, (e, t) => t - .5) : r.ticks().map((e) => e.value);
			e.beginPath();
			for (let i of n) {
				let n = t.start + t.dir * r.mapNum(i) * Math.PI * 2;
				e.moveTo(t.cx + t.r0 * Math.cos(n), t.cy + t.r0 * Math.sin(n)), e.lineTo(t.cx + t.r * Math.cos(n), t.cy + t.r * Math.sin(n));
			}
			e.stroke();
		}
		(a.axisLine ?? a.show ?? !0) && (e.strokeStyle = n.axis, e.beginPath(), e.arc(t.cx, t.cy, t.r, 0, Math.PI * 2), e.stroke());
	}
	drawPolarLabels() {
		let e = this.ctx, t = this.polarGeo, n = this.theme, r = this.sa, i = this.sr, a = this.opts.angleAxis ?? {}, o = this.opts.radiusAxis ?? {};
		if (e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.font = this.font(11), a.show ?? !0) {
			e.fillStyle = a.color ?? n.muted;
			let i = r.ticks().filter((e) => r.type === "category" || e.value < r.max - 1e-9 || r.mapNum(e.value) < .999), o = r.type === "category" ? Math.max(1, Math.ceil(i.length / Math.max(4, t.r * Math.PI * 2 / 46))) : 1;
			i.forEach((n, i) => {
				if (i % o) return;
				let a = t.start + t.dir * r.mapNum(n.value) * Math.PI * 2, s = t.cx + (t.r + 8) * Math.cos(a), c = t.cy + (t.r + 8) * Math.sin(a), l = Math.cos(a), u = Math.sin(a);
				e.textAlign = Math.abs(l) < .3 ? "center" : l > 0 ? "left" : "right", e.textBaseline = Math.abs(u) < .3 ? "middle" : u > 0 ? "top" : "bottom", e.fillText(n.label, s, c);
			});
		}
		if (o.show ?? !0) {
			e.fillStyle = o.color ?? n.muted, e.textAlign = "center", e.textBaseline = "middle";
			let r = t.start, a = i.type === "category" ? Math.max(1, Math.ceil(16 / (i.band() || 16))) : 1;
			i.ticks().forEach((o, s) => {
				if (s % a) return;
				let c = i.mapNum(o.value);
				if (c < 4 && i.type !== "category") return;
				let l = t.cx + c * Math.cos(r), u = t.cy + c * Math.sin(r);
				e.strokeStyle = n.background === "transparent" ? "rgba(0,0,0,0.4)" : n.background, e.lineWidth = 3, e.strokeText(o.label, l + 2, u), e.fillText(o.label, l + 2, u);
			});
		}
	}
	hitTest(e, t) {
		let n = (e, t) => (this.ctx.font = t, this.ctx.measureText(e).width);
		for (let r = this.drawnList.length - 1; r >= 0; r--) {
			let i = this.drawnList[r];
			if (!(i.si < 0 || i.silent || this.leavingKeys.has(i.key)) && !this.opts.series[i.si]?.silent && se(i, e, t, 3, n, this.theme.font)) return i;
		}
		return null;
	}
	params(e, t, n) {
		let r = this.opts.series[e.si], i = r.data[e.di], a;
		a = Array.isArray(i) ? i : i && typeof i == "object" && Array.isArray(i.value) ? i.value : i && typeof i == "object" && r.dimensions ? r.dimensions.map((e) => i[e]) : [i];
		let o = r.encode?.itemName, s = o === void 0 ? i && typeof i == "object" && !Array.isArray(i) ? i.name : void 0 : this.valueOf(r, i, o);
		return {
			seriesIndex: e.si,
			seriesName: r.name ?? "",
			dataIndex: e.di,
			data: i,
			value: a,
			name: s === void 0 ? void 0 : String(s),
			color: this.colorOf(e.si),
			info: e.info,
			x: t,
			y: n
		};
	}
	local(e) {
		let t = this.canvas.getBoundingClientRect();
		return {
			x: e.clientX - t.left,
			y: e.clientY - t.top
		};
	}
	zoomAxes() {
		let e = this.opts.zoom;
		if (!e || !this.sx) return [];
		let t = typeof e == "object" ? e.axis ?? "x" : "x";
		return t === "xy" ? ["x", "y"] : [t];
	}
	bind() {
		let e = this.canvas;
		e.addEventListener("pointermove", (e) => {
			let { x: t, y: n } = this.local(e);
			this.lastMouse = {
				x: t,
				y: n,
				cx: e.clientX,
				cy: e.clientY
			}, this.drag ? this.onDragMove(t, n) : this.updateHover(t, n, e);
		}), e.addEventListener("pointerleave", () => {
			this.drag || (this.lastMouse = null, this.setHover(null), this.tooltipEl.classList.remove("is-visible"));
		}), e.addEventListener("pointerdown", (t) => {
			if (t.button !== 0) return;
			let { x: n, y: r } = this.local(t), i = this.hitTest(n, r);
			if (i && i.draggable) {
				let a = this.params(i, n, r);
				this.drag = {
					kind: "item",
					params: a,
					x0: n,
					y0: r,
					moved: !1
				}, e.setPointerCapture(t.pointerId), e.style.cursor = "grabbing", this.tooltipEl.classList.remove("is-visible"), this.emit("dragstart", {
					...a,
					dx: 0,
					dy: 0,
					at: this.convertFromPixel([n, r])
				});
				return;
			}
			let a = this.rect;
			this.zoomAxes().length && (this.view.x || this.view.y) && n >= a.x && n <= a.x + a.width && r >= a.y && r <= a.y + a.height && (this.drag = {
				kind: "pan",
				x0: n,
				y0: r,
				vx: this.view.x,
				vy: this.view.y
			}, e.setPointerCapture(t.pointerId), e.style.cursor = "grabbing");
		});
		let t = (t) => {
			let n = this.drag;
			if (!n) return;
			this.drag = null, e.hasPointerCapture(t.pointerId) && e.releasePointerCapture(t.pointerId), e.style.cursor = "";
			let { x: r, y: i } = this.local(t);
			n.kind === "item" ? this.emit("dragend", {
				...n.params,
				dx: r - n.x0,
				dy: i - n.y0,
				at: this.convertFromPixel([r, i])
			}) : this.emitZoom();
		};
		e.addEventListener("pointerup", t), e.addEventListener("pointercancel", t), e.addEventListener("click", (e) => {
			let { x: t, y: n } = this.local(e), r = this.hitTest(t, n);
			r && this.emit("click", this.params(r, t, n));
		}), e.addEventListener("wheel", (e) => {
			let t = this.zoomAxes();
			if (!t.length) return;
			let { x: n, y: r } = this.local(e), i = this.rect;
			if (n < i.x || n > i.x + i.width || r < i.y || r > i.y + i.height) return;
			e.preventDefault();
			let a = Math.exp(e.deltaY * .0015);
			for (let e of t) {
				let t = e === "x" ? this.sx : this.sy, i = t.fullMax - t.fullMin, [o, s] = this.view[e] ?? [t.fullMin, t.fullMax], c = t.invert(e === "x" ? n : r), l = this.opts.zoom, u = typeof l == "object" && l.minSpan || (t.type === "category" ? 1 : i / 1e3), d = Math.min(i, Math.max(u, (s - o) * a)), f = c - d * ((c - o) / (s - o || 1));
				f = Y(f, t.fullMin, t.fullMax - d), this.view[e] = d >= i - 1e-9 ? null : [f, f + d];
			}
			this.tooltipEl.classList.remove("is-visible"), this.rebuild(!1), this.emitZoom();
		}, { passive: !1 }), e.addEventListener("dblclick", () => {
			this.zoomAxes().length && this.resetZoom(!0);
		}), this.legendEl.addEventListener("click", (e) => {
			let t = e.target.closest(".cu-legend__item");
			t && this.legendCfg().interactive && this.toggle(t.dataset.name);
		});
	}
	onDragMove(e, t) {
		let n = this.drag;
		if (n.kind === "item") n.moved = !0, this.emit("drag", {
			...n.params,
			dx: e - n.x0,
			dy: t - n.y0,
			at: this.convertFromPixel([e, t])
		});
		else {
			for (let r of this.zoomAxes()) {
				let i = r === "x" ? n.vx : n.vy, a = r === "x" ? this.sx : this.sy;
				if (!i) continue;
				let o = r === "x" ? e - n.x0 : t - n.y0, s = a.range[1] - a.range[0], c = -o / (s || 1) * (i[1] - i[0]), l = i[1] - i[0], u = Y(i[0] + c, a.fullMin, a.fullMax - l);
				this.view[r] = [u, u + l];
			}
			this.rebuild(!1);
		}
	}
	setHover(e) {
		let t = this.hover, n = !t && !e || t && e && t.si === e.si && t.di === e.di;
		this.hover = e ? {
			si: e.si,
			di: e.di,
			node: e
		} : null, n ? t && e && t.node.key !== e.key && this.opts.series[e.si]?.emphasis?.scope === "element" && this.draw() : (this.emit("hover", e && this.lastMouse ? this.params(e, this.lastMouse.x, this.lastMouse.y) : null), !this.trans && !this.opts.live ? (this.nodes = this.render(), this.frame()) : this.opts.live || this.draw());
	}
	updateHover(e, t, n) {
		let r = this.hitTest(e, t);
		this.setHover(r);
		let i = this.rect, a = e >= i.x && e <= i.x + i.width && t >= i.y && t <= i.y + i.height;
		this.canvas.style.cursor = r ? r.cursor ?? (r.draggable ? "grab" : "pointer") : this.zoomAxes().length && (this.view.x || this.view.y) && a ? "grab" : "", this.showTooltip(r, n);
	}
	fmtValue(e, t) {
		return e == null ? "–" : typeof e == "number" ? t?.type === "time" ? p(e) : this.opts.valueFormatter ? this.opts.valueFormatter(e) : e.toLocaleString("pt-PT", { maximumFractionDigits: 4 }) : e instanceof Date ? p(e.getTime()) : String(e);
	}
	tooltipHtml(e) {
		let t = this.opts.series[e.seriesIndex], n = t.encode?.tooltip ?? (t.dimensions ? t.dimensions.map((e, t) => t) : e.value.map((e, t) => t).slice(0, 8)), r = (e) => {
			for (let [n, r] of [
				["x", this.sx],
				["y", this.sy],
				["angle", this.sa],
				["radius", this.sr]
			]) if (r && this.dimsOf(t, n).includes(e)) return r;
			return null;
		}, i = e.name ?? t.name ?? "", a = n.map((n) => {
			let i = this.valueOf(t, e.data, n);
			if (i === void 0) return "";
			let a = typeof n == "string" ? n : t.dimensions?.[n] ?? `Valor ${n + 1}`;
			return typeof i == "object" && !(i instanceof Date) ? "" : `<div class="cu-tooltip__row"><span>${J(a)}</span><b>${J(this.fmtValue(i, r(n)))}</b></div>`;
		}).join("");
		return (e.name && t.name ? `<div class="cu-tooltip__sub">${J(t.name)}</div>` : "") + (i ? `<div class="cu-tooltip__head"><i class="cu-tooltip__dot" style="background:${e.color}"></i>${J(i)}</div>` : "") + a;
	}
	showTooltip(e, t) {
		let n = this.opts.tooltip ?? !0, r = this.tooltipEl, i = e ? this.opts.series[e.si] : null;
		if (!e || !i || n === !1 || typeof n == "object" && n.show === !1 || i.tooltip === !1) {
			r.classList.remove("is-visible");
			return;
		}
		let { x: a, y: o } = this.local(t), s = this.params(e, a, o), c = typeof i.tooltip == "function" ? i.tooltip(s) : typeof n == "object" && n.formatter ? n.formatter(s) : this.tooltipHtml(s);
		if (!c) {
			r.classList.remove("is-visible");
			return;
		}
		r.innerHTML = c, r.classList.add("is-visible");
		let l = r.offsetWidth, u = r.offsetHeight, d = a + 14 + l > this.width ? a - 14 - l : a + 14, f = Y(o + 14 + u > this.height ? o - 14 - u : o + 14, 0, Math.max(0, this.height - u));
		r.style.transform = `translate(${Math.max(0, d)}px, ${f}px)`;
	}
};
function Oe(e, t) {
	return new De(e, t);
}
//#endregion
//#region src/custom/layouts.ts
function Q(e, t) {
	let n = e.r - t.r, r = t.x - e.x, i = t.y - e.y;
	return n < 0 || n * n < r * r + i * i;
}
function ke(e, t) {
	let n = e.r - t.r + Math.max(e.r, t.r, 1) * 1e-9, r = t.x - e.x, i = t.y - e.y;
	return n > 0 && n * n > r * r + i * i;
}
function Ae(e, t) {
	return t.every((t) => ke(e, t));
}
function $(e, t) {
	let n = t.x - e.x, r = t.y - e.y, i = t.r - e.r, a = Math.sqrt(n * n + r * r) || 1e-12;
	return {
		x: (e.x + t.x + n / a * i) / 2,
		y: (e.y + t.y + r / a * i) / 2,
		r: (a + e.r + t.r) / 2
	};
}
function je(e, t, n) {
	let { x: r, y: i, r: a } = e, { x: o, y: s, r: c } = t, { x: l, y: u, r: d } = n, f = r - o, p = r - l, m = i - s, h = i - u, g = c - a, _ = d - a, v = r * r + i * i - a * a, y = v - o * o - s * s + c * c, b = v - l * l - u * u + d * d, x = p * m - f * h, S = (m * b - h * y) / (x * 2) - r, C = (h * g - m * _) / x, w = (p * y - f * b) / (x * 2) - i, T = (f * _ - p * g) / x, E = C * C + T * T - 1, D = 2 * (a + S * C + w * T), O = S * S + w * w - a * a, k = -(Math.abs(E) > 1e-6 ? (D + Math.sqrt(D * D - 4 * E * O)) / (2 * E) : O / D);
	return {
		x: r + S + C * k,
		y: i + w + T * k,
		r: k
	};
}
function Me(e) {
	return e.length === 1 ? {
		x: e[0].x,
		y: e[0].y,
		r: e[0].r
	} : e.length === 2 ? $(e[0], e[1]) : je(e[0], e[1], e[2]);
}
function Ne(e, t) {
	if (Ae(t, e)) return [t];
	for (let n of e) if (Q(t, n) && Ae($(n, t), e)) return [n, t];
	for (let n = 0; n < e.length - 1; n++) for (let r = n + 1; r < e.length; r++) if (Q($(e[n], e[r]), t) && Q($(e[n], t), e[r]) && Q($(e[r], t), e[n]) && Ae(je(e[n], e[r], t), e)) return [
		e[n],
		e[r],
		t
	];
	return [t];
}
function Pe(e) {
	let t = e.slice(), n = 1;
	for (let e = t.length - 1; e > 0; e--) {
		n = (n * 1664525 + 1013904223) % 4294967296;
		let r = Math.floor(n / 4294967296 * (e + 1));
		[t[e], t[r]] = [t[r], t[e]];
	}
	let r = [], i = null, a = 0, o = 0;
	for (; a < t.length && o++ < 1e6;) {
		let e = t[a];
		i && ke(i, e) ? a++ : (r = Ne(r, e), i = Me(r), a = 0);
	}
	return i;
}
function Fe(e, t, n) {
	let r = e.x - t.x, i = e.y - t.y, a = r * r + i * i;
	if (a) {
		let o = (t.r + n.r) ** 2, s = (e.r + n.r) ** 2;
		if (o > s) {
			let t = (a + s - o) / (2 * a), c = Math.sqrt(Math.max(0, s / a - t * t));
			n.x = e.x - t * r - c * i, n.y = e.y - t * i + c * r;
		} else {
			let e = (a + o - s) / (2 * a), c = Math.sqrt(Math.max(0, o / a - e * e));
			n.x = t.x + e * r - c * i, n.y = t.y + e * i + c * r;
		}
	} else n.x = t.x + n.r, n.y = t.y;
}
function Ie(e, t) {
	let n = e.r + t.r - 1e-6, r = t.x - e.x, i = t.y - e.y;
	return n > 0 && n * n > r * r + i * i;
}
function Le(e) {
	let t = e.c, n = e.next.c, r = t.r + n.r, i = (t.x * n.r + n.x * t.r) / r, a = (t.y * n.r + n.y * t.r) / r;
	return i * i + a * a;
}
function Re(e) {
	let t = e.length;
	if (!t) return 0;
	let n = e[0];
	if (n.x = 0, n.y = 0, t === 1) return n.r;
	let r = e[1];
	if (n.x = -r.r, r.x = n.r, r.y = 0, t === 2) return n.r + r.r;
	Fe(r, n, e[2]);
	let i = (e) => ({ c: e }), a = i(n), o = i(r), s = i(e[2]);
	a.next = s.prev = o, o.next = a.prev = s, s.next = o.prev = a;
	pack: for (let n = 3; n < t; n++) {
		Fe(a.c, o.c, e[n]), s = i(e[n]);
		let t = o.next, r = a.prev, c = o.c.r, l = a.c.r;
		do
			if (c <= l) {
				if (Ie(t.c, s.c)) {
					o = t, a.next = o, o.prev = a, n--;
					continue pack;
				}
				c += t.c.r, t = t.next;
			} else {
				if (Ie(r.c, s.c)) {
					a = r, a.next = o, o.prev = a, n--;
					continue pack;
				}
				l += r.c.r, r = r.prev;
			}
		while (t !== r.next);
		s.prev = a, s.next = o, a.next = o.prev = o = s;
		let u = Le(a);
		for (; (s = s.next) !== o;) {
			let e = Le(s);
			e < u && (a = s, u = e);
		}
		o = a.next;
	}
	let c = [o.c];
	for (let e = o.next; e !== o; e = e.next) c.push(e.c);
	let l = Pe(c);
	for (let t of e) t.x -= l.x, t.y -= l.y;
	return l.r;
}
function ze(e, t) {
	let n = t.padding ?? 3, r = (e, n, i) => {
		let a = {
			x: 0,
			y: 0,
			r: 0,
			depth: i,
			value: 0,
			data: e,
			parent: n,
			children: [],
			path: n ? `${n.path}/${e.name}` : e.name
		};
		return a.children = (e.children ?? []).map((e) => r(e, a, i + 1)), (t.sort ?? !0) && a.children.sort((e, t) => t.value - e.value), a.value = a.children.length ? a.children.reduce((e, t) => e + t.value, 0) : Math.max(0, e.value ?? 0), a;
	}, i = r(e, null, 0), a = [], o = (e) => {
		a.push(e), e.children.forEach(o);
	};
	o(i);
	let s = (e) => {
		let t = (n) => {
			if (!n.children.length) {
				n.r = Math.sqrt(n.value);
				return;
			}
			n.children.forEach(t);
			let r = n.children.filter((e) => e.r > 0);
			for (let t of r) t.r += e;
			let i = Re(r);
			for (let t of r) t.r -= e;
			n.r = i + e;
		};
		t(i);
	};
	s(0);
	let c = Math.min(t.width, t.height) / 2, l = i.r ? c / i.r : 1;
	n > 0 && s(n / l);
	let u = i.r ? c / i.r : 1, d = (e, t, n) => {
		e.x = t + e.x * u, e.y = n + e.y * u, e.r *= u;
		for (let t of e.children) d(t, e.x, e.y);
	};
	return i.x = 0, i.y = 0, d(i, t.width / 2, t.height / 2), a;
}
function Be(e, n = {}) {
	let r = e.filter((e) => Number.isFinite(e));
	if (!r.length) return [];
	let i = n.min ?? Math.min(...r), a = n.max ?? Math.max(...r);
	a === i && (a = i + 1);
	let o = n.binWidth ?? t((a - i) / (n.bins ?? Math.ceil(Math.log2(r.length) + 1)));
	n.min === void 0 && (i = Math.floor(i / o) * o), n.max === void 0 && (a = Math.ceil(a / o - 1e-9) * o), a <= i && (a = i + o);
	let s = Math.max(1, Math.round((a - i) / o)), c = Array.from({ length: s }, (e, t) => ({
		x0: +(i + t * o).toPrecision(12),
		x1: +(i + (t + 1) * o).toPrecision(12),
		count: 0
	}));
	for (let e of r) {
		if (e < i || e > a) continue;
		let t = Math.min(s - 1, Math.floor((e - i) / o));
		c[t].count++;
	}
	return c;
}
function Ve(e, t) {
	let n = t * Math.sqrt(3), r = t * 1.5, i = /* @__PURE__ */ new Map();
	return e.forEach(([e, t], a) => {
		if (!Number.isFinite(e) || !Number.isFinite(t)) return;
		let o = Math.round(t / r), s = Math.round(e / n - (o & 1) / 2), c = o * r;
		if (Math.abs(t - c) * 3 > r) {
			let i = (s + (o & 1) / 2) * n, a = t < c ? o - 1 : o + 1, l = Math.round(e / n - (a & 1) / 2), u = (l + (a & 1) / 2) * n, d = a * r;
			(e - u) ** 2 + (t - d) ** 2 < (e - i) ** 2 + (t - c) ** 2 && (o = a, s = l);
		}
		let l = `${o},${s}`, u = i.get(l);
		u || (u = {
			x: (s + (o & 1) / 2) * n,
			y: o * r,
			points: []
		}, i.set(l, u)), u.points.push(a);
	}), [...i.values()];
}
function He(e, t, n) {
	return Array.from({ length: 6 }, (r, i) => {
		let a = Math.PI / 6 + i * Math.PI / 3;
		return [e + n * Math.cos(a), t + n * Math.sin(a)];
	});
}
//#endregion
export { h as C, p as S, L as _, ze as a, y as b, De as c, Te as d, re as f, ae as g, K as h, Be as i, Oe as l, G as m, He as n, Re as o, se as p, Ve as r, Ee as s, Pe as t, we as u, xe as v, d as w, S as x, x as y };

//# sourceMappingURL=custom.js.map