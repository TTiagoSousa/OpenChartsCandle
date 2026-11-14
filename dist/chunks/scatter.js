import { n as e, t } from "./format.js";
import { a as n, n as r } from "./color.js";
//#region src/scatter/stats.ts
var i = (e) => {
	let t = Math.abs(e);
	return t !== 0 && (t >= 1e5 || t < .001) ? e.toExponential(2) : String(+e.toFixed(t >= 100 ? 1 : t >= 1 ? 3 : 4));
}, a = [
	"",
	"",
	"²",
	"³",
	"⁴",
	"⁵",
	"⁶",
	"⁷",
	"⁸",
	"⁹"
];
function o(e, t) {
	let n = t.length, r = e.map((e, n) => [...e, t[n]]);
	for (let e = 0; e < n; e++) {
		let t = e;
		for (let i = e + 1; i < n; i++) Math.abs(r[i][e]) > Math.abs(r[t][e]) && (t = i);
		[r[e], r[t]] = [r[t], r[e]];
		let i = r[e][e] || 1e-12;
		for (let t = 0; t < n; t++) {
			if (t === e) continue;
			let a = r[t][e] / i;
			for (let i = e; i <= n; i++) r[t][i] -= a * r[e][i];
		}
	}
	return r.map((e, t) => e[n] / (e[t] || 1e-12));
}
function s(e, t, n) {
	let r = n + 1, i = Array.from({ length: r }, () => Array(r).fill(0)), a = Array(r).fill(0);
	for (let n = 0; n < e.length; n++) {
		let o = [1];
		for (let t = 1; t < 2 * r; t++) o.push(o[t - 1] * e[n]);
		for (let e = 0; e < r; e++) {
			a[e] += o[e] * t[n];
			for (let t = 0; t < r; t++) i[e][t] += o[e + t];
		}
	}
	return o(i, a);
}
function c(e, t, n = 2) {
	let r = t.filter(([e, t]) => Number.isFinite(e) && Number.isFinite(t));
	e === "exponential" && (r = r.filter(([, e]) => e > 0)), e === "logarithmic" && (r = r.filter(([e]) => e > 0));
	let o = r.map((e) => e[0]), c = r.map((e) => e[1]), l, u, d;
	if (e === "exponential") {
		let [e, t] = s(o, c.map(Math.log), 1), n = Math.exp(e);
		l = [n, t], u = (e) => n * Math.exp(t * e), d = `y = ${i(n)}e^(${i(t)}x)`;
	} else if (e === "logarithmic") {
		let [e, t] = s(o.map(Math.log), c, 1);
		l = [e, t], u = (n) => e + t * Math.log(n), d = `y = ${i(e)} ${t < 0 ? "-" : "+"} ${i(Math.abs(t))}ln(x)`;
	} else {
		l = s(o, c, Math.min(e === "linear" ? 1 : Math.max(1, Math.min(9, Math.round(n))), Math.max(1, r.length - 1)));
		let t = l;
		u = (e) => t.reduceRight((t, n) => t * e + n, 0), d = "y = " + (t.map((e, t) => ({
			k: e,
			i: t
		})).reverse().filter(({ k: e }) => Math.abs(e) > 1e-12).map(({ k: e, i: t }, n) => {
			let r = i(Math.abs(e)), o = t === 0 ? r : `${r === "1" ? "" : r}x${a[t] ?? `^${t}`}`;
			return n === 0 ? (e < 0 ? "-" : "") + o : `${e < 0 ? " - " : " + "}${o}`;
		}).join("") || "0");
	}
	let f = c.reduce((e, t) => e + t, 0) / (c.length || 1), p = 0, m = 0;
	for (let e = 0; e < o.length; e++) p += (c[e] - u(o[e])) ** 2, m += (c[e] - f) ** 2;
	return {
		type: e,
		coefficients: l,
		predict: u,
		expression: d,
		r2: m ? Math.max(0, 1 - p / m) : 1
	};
}
function l(e) {
	let t = Math.max(1, Math.floor(e)) % 2147483647;
	return () => (t = t * 16807 % 2147483647) / 2147483647;
}
var u = (e, t) => e.reduce((e, n, r) => e + (n - t[r]) ** 2, 0);
function d(e, t, n = {}) {
	let r = l(n.seed ?? 7), i = e.length;
	if (t = Math.max(1, Math.min(t, i)), !i) return {
		centroids: [],
		labels: [],
		steps: []
	};
	let a = [e[Math.floor(r() * i)].slice()];
	for (; a.length < t;) {
		let t = e.map((e) => Math.min(...a.map((t) => u(e, t)))), n = r() * t.reduce((e, t) => e + t, 0), o = 0;
		for (; o < i - 1 && (n -= t[o]) > 0;) o++;
		a.push(e[o].slice());
	}
	let o = [], s = [];
	for (let r = 0; r < (n.maxIterations ?? 50); r++) {
		let n = e.map((e) => {
			let n = 0;
			for (let r = 1; r < t; r++) u(e, a[r]) < u(e, a[n]) && (n = r);
			return n;
		}), r = n.some((e, t) => e !== s[t]);
		if (s = n, o.push({
			centroids: a.map((e) => e.slice()),
			labels: s.slice()
		}), !r) break;
		for (let n = 0; n < t; n++) {
			let t = e.filter((e, t) => s[t] === n);
			t.length && (a[n] = t[0].map((e, n) => t.reduce((e, t) => e + t[n], 0) / t.length));
		}
	}
	let c = o[o.length - 1];
	return {
		centroids: c.centroids,
		labels: c.labels,
		steps: o
	};
}
function f(e) {
	let t = [...e].sort((e, t) => e[0] - t[0] || e[1] - t[1]);
	if (t.length < 3) return t;
	let n = (e, t, n) => (t[0] - e[0]) * (n[1] - e[1]) - (t[1] - e[1]) * (n[0] - e[0]), r = [];
	for (let e of t) {
		for (; r.length >= 2 && n(r[r.length - 2], r[r.length - 1], e) <= 0;) r.pop();
		r.push(e);
	}
	let i = [];
	for (let e = t.length - 1; e >= 0; e--) {
		for (; i.length >= 2 && n(i[i.length - 2], i[i.length - 1], t[e]) <= 0;) i.pop();
		i.push(t[e]);
	}
	return r.slice(0, -1).concat(i.slice(0, -1));
}
function p(e, t, n) {
	let r = e.map((e, t) => t).sort((t, n) => e[t] - e[n]), i = Array(e.length).fill(0), a = [];
	for (let o of r) {
		let r = a.filter((n) => Math.abs(e[n] - e[o]) < t[o] + t[n]), s = [0];
		for (let n of r) {
			let r = t[o] + t[n] + .5, a = e[n] - e[o], c = Math.sqrt(Math.max(0, r * r - a * a));
			s.push(i[n] + c, i[n] - c);
		}
		s.sort((e, t) => Math.abs(e) - Math.abs(t));
		let c = (n) => r.every((r) => (i[r] - n) ** 2 + (e[r] - e[o]) ** 2 >= (t[o] + t[r]) ** 2 - .01);
		i[o] = s.find((e) => Math.abs(e) <= n && c(e)) ?? s.find((e) => Math.abs(e) <= n) ?? 0, a.push(o);
	}
	return i;
}
//#endregion
//#region src/scatter/symbols.ts
var m = (e, t, n, r, i, a) => Array.from({ length: a + 1 }, (o, s) => {
	let c = r + (i - r) * s / a;
	return [e + n * Math.cos(c), t + n * Math.sin(c)];
}), h = Math.PI / 180;
function g(e) {
	switch (e) {
		case "rect": return [
			[0, -.5],
			[.5, -.5],
			[.5, .5],
			[-.5, .5],
			[-.5, -.5]
		];
		case "roundRect": {
			let e = .18, t = .32;
			return [
				[0, -.5],
				...m(t, -.32, e, -90 * h, 0, 4),
				...m(t, t, e, 0, 90 * h, 4),
				...m(-.32, t, e, 90 * h, 180 * h, 4),
				...m(-.32, -.32, e, 180 * h, 270 * h, 4)
			];
		}
		case "triangle": return [
			[0, -.5],
			[.5, .5],
			[-.5, .5]
		];
		case "diamond": return [
			[0, -.5],
			[.5, 0],
			[0, .5],
			[-.5, 0]
		];
		case "pin": {
			let e = -.14, t = .36, n = Math.asin(t / .64);
			return [
				[0, -.5],
				...m(0, e, t, -90 * h, 90 * h - n, 10).slice(1),
				[0, .5],
				...m(0, e, t, 90 * h + n, 270 * h, 10).slice(0, -1)
			];
		}
		case "arrow": return [
			[0, -.5],
			[.5, .5],
			[0, .2],
			[-.5, .5]
		];
		case "star": return Array.from({ length: 10 }, (e, t) => {
			let n = t % 2 ? .21 : .5, r = -90 * h + t * 36 * h;
			return [n * Math.cos(r), n * Math.sin(r) + .04];
		});
		case "cross": {
			let e = .17;
			return [
				[0, -.5],
				[e, -.5],
				[e, -.17],
				[.5, -.17],
				[.5, e],
				[e, e],
				[e, .5],
				[-.17, .5],
				[-.17, e],
				[-.5, e],
				[-.5, -.17],
				[-.17, -.17],
				[-.17, -.5]
			];
		}
		default: return m(0, 0, .5, -90 * h, 270 * h, 40).slice(0, -1);
	}
}
var _ = /* @__PURE__ */ new Map(), v = /* @__PURE__ */ new Map();
function y(e) {
	let t = _.get(e);
	return t || _.set(e, t = g(e)), t;
}
function b(e) {
	let t = v.get(e);
	if (t) return t;
	let n = y(e), r = [], i = 0;
	for (let e = 0; e < n.length; e++) {
		let [t, a] = n[e], [o, s] = n[(e + 1) % n.length], c = Math.hypot(o - t, s - a);
		r.push(c), i += c;
	}
	t = [];
	let a = 0, o = 0;
	for (let e = 0; e < 48; e++) {
		let s = e / 48 * i;
		for (; a < n.length - 1 && o + r[a] < s;) o += r[a++];
		let c = r[a] ? (s - o) / r[a] : 0, [l, u] = n[a], [d, f] = n[(a + 1) % n.length];
		t.push([l + (d - l) * c, u + (f - u) * c]);
	}
	return v.set(e, t), t;
}
function x(e, t, n, r, i, a) {
	if (t === "circle" && Math.abs(i - a) < .01) {
		e.moveTo(n + i / 2, r), e.arc(n, r, Math.max(0, i / 2), 0, Math.PI * 2);
		return;
	}
	let o = y(t);
	e.moveTo(n + o[0][0] * i, r + o[0][1] * a);
	for (let t = 1; t < o.length; t++) e.lineTo(n + o[t][0] * i, r + o[t][1] * a);
	e.closePath();
}
function S(e, t, n, r, i, a, o, s, c, l, u, d) {
	let f = b(t), p = b(o), m = n + (s - n) * d, h = r + (c - r) * d;
	for (let t = 0; t < 48; t++) {
		let n = m + f[t][0] * i * (1 - d) + p[t][0] * l * d, r = h + f[t][1] * a * (1 - d) + p[t][1] * u * d;
		t ? e.lineTo(n, r) : e.moveTo(n, r);
	}
	e.closePath();
}
//#endregion
//#region src/scatter/scatter.ts
var C = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", w = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	grid: "rgba(42, 46, 57, 0.7)",
	axis: "#2a2e39",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: C
}, T = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	grid: "rgba(42, 46, 57, 0.08)",
	axis: "#e0e3eb",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: C
}, E = [
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
], D = [
	"#50a3ba",
	"#eac736",
	"#d94e5d"
], O = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), k = (e) => 1 - (1 - e) ** 3, A = (e, t, n) => Math.min(n, Math.max(t, e)), j = 4e3, M = Math.PI * 2, N = (e, t = e[3]) => `rgba(${Math.round(e[0])},${Math.round(e[1])},${Math.round(e[2])},${+t.toFixed(3)})`;
function P(e) {
	return !e || typeof e == "object" && e.show === !1 ? null : {
		position: "top",
		hideOverlap: !0,
		fontSize: 11,
		fontWeight: 500,
		...typeof e == "object" ? e : {}
	};
}
var F = class {
	constructor(e, t = {}) {
		this.list = [], this.hiddenKeys = /* @__PURE__ */ new Set(), this.models = [], this.items = [], this.ghosts = [], this.viewX = null, this.viewY = null, this.plot = {
			x: 0,
			y: 0,
			w: 1,
			h: 1
		}, this.width = 0, this.height = 0, this.dpr = 1, this.vms = [], this.hover = null, this.highlighted = null, this.selection = null, this.brushRect = null, this.labelsCache = [], this.grid = null, this.animStart = 0, this.animEnd = 0, this.raf = 0, this.handlers = /* @__PURE__ */ new Map(), this.colorCache = /* @__PURE__ */ new Map(), this.drag = null, this.destroyed = !1, this.opts = { ...t }, this.root = e, e.classList.add("sc-root"), this.titleEl = document.createElement("div"), this.titleEl.className = "sc-title", this.bodyEl = document.createElement("div"), this.bodyEl.className = "sc-body", this.plotEl = document.createElement("div"), this.plotEl.className = "sc-plot", this.canvas = document.createElement("canvas"), this.canvas.className = "sc-canvas", this.canvas.setAttribute("role", "img"), this.ctx = this.canvas.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "sc-tooltip", this.legendEl = document.createElement("ul"), this.legendEl.className = "sc-legend", this.plotEl.append(this.canvas, this.tooltipEl), this.bodyEl.append(this.plotEl, this.legendEl), e.append(this.titleEl, this.bodyEl), this.list = (t.series ?? []).map((e) => ({ ...e }));
		for (let e of this.list) e.hidden && this.hiddenKeys.add(this.keyOf(e));
		this.applyLook(), this.bind(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(this.plotEl), this.measure(), this.rebuild("enter");
	}
	get series() {
		return this.list.map((e) => ({ ...e }));
	}
	setSeries(e, t = !0) {
		this.list = e.map((e) => ({ ...e })), this.hiddenKeys = new Set([...this.hiddenKeys].filter((e) => this.list.some((t) => this.keyOf(t) === e)));
		for (let e of this.list) e.hidden && this.hiddenKeys.add(this.keyOf(e));
		this.rebuild(t ? "morph" : null);
	}
	setOptions(e, t = !0) {
		e.series && (this.list = e.series.map((e) => ({ ...e }))), e.visualMap !== void 0 && (this.vms = []), this.opts = {
			...this.opts,
			...e
		}, this.applyLook(), this.rebuild(t ? "morph" : null);
	}
	appendData(e, t) {
		let n = this.list.find((t) => this.keyOf(t) === e);
		n && (n.data = n.data.concat(t), this.rebuild(null));
	}
	toggle(e, t) {
		let n = t ?? !this.hiddenKeys.has(e);
		n ? this.hiddenKeys.add(e) : this.hiddenKeys.delete(e), this.emit("toggle", {
			id: e,
			hidden: n
		}), this.rebuild("morph");
	}
	highlight(e) {
		this.highlighted = e, this.renderLegend(), this.draw();
	}
	select(e) {
		this.selection = e ? new Set(this.items.filter((t) => e(this.info(t)))) : null, this.draw();
	}
	setVisualRange(e, t) {
		let n = this.vms[e];
		n && (n.range = [Math.min(...t), Math.max(...t)], this.applyRanges(), this.renderVisual(), this.draw());
	}
	setZoom(e) {
		e.x && (this.viewX = [this.T(this.ax, e.x[0]), this.T(this.ax, e.x[1])]), e.y && (this.viewY = [this.T(this.ay, e.y[0]), this.T(this.ay, e.y[1])]), this.afterZoom();
	}
	resetZoom() {
		this.viewX = this.viewY = null, this.afterZoom();
	}
	toPixel(e, t) {
		return this.pt(this.num(this.ax, e), this.num(this.ay, t));
	}
	toData(e, t) {
		let [n, r] = this.domX(), [i, a] = this.domY(), o = (e - this.plot.x) / this.plot.w, s = (this.plot.y + this.plot.h - t) / this.plot.h;
		return this.ax.inverse && (o = 1 - o), this.ay.inverse && (s = 1 - s), {
			x: this.U(this.ax, n + o * (r - n)),
			y: this.U(this.ay, i + s * (a - i))
		};
	}
	on(e, t) {
		this.handlers.has(e) || this.handlers.set(e, /* @__PURE__ */ new Set());
		let n = t;
		return this.handlers.get(e).add(n), () => this.handlers.get(e)?.delete(n);
	}
	screenshot() {
		return this.draw(), this.canvas.toDataURL("image/png");
	}
	destroy() {
		this.destroyed = !0, cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("sc-root"), this.titleEl.remove(), this.bodyEl.remove();
	}
	keyOf(e) {
		return e.id ?? e.name;
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t));
	}
	rgbaOf(e) {
		let t = this.colorCache.get(e);
		return t || (t = n(e), this.colorCache.size > 5e3 && this.colorCache.clear(), this.colorCache.set(e, t)), t;
	}
	applyLook() {
		let e = this.opts, t = e.theme === "light" ? T : w;
		this.theme = {
			...t,
			...typeof e.theme == "object" ? e.theme : {}
		}, e.background !== void 0 && (this.theme.background = e.background);
		let n = this.theme, r = {
			"--sc-bg": n.background,
			"--sc-text": n.text,
			"--sc-muted": n.muted,
			"--sc-tt-bg": n.tooltipBg,
			"--sc-tt-text": n.tooltipText,
			"--sc-tt-border": n.tooltipBorder,
			"--sc-font": n.font
		};
		for (let [e, t] of Object.entries(r)) this.root.style.setProperty(e, t);
		let i = {
			position: "top",
			align: "center",
			...e.legend ?? {}
		};
		this.bodyEl.className = `sc-body sc-legend-${i.position}`, this.legendEl.className = `sc-legend sc-legend--align-${i.align}`;
		let a = typeof e.title == "string" ? { text: e.title } : e.title;
		this.titleEl.style.display = a ? "" : "none", a && (this.titleEl.style.textAlign = a.align ?? "center", this.titleEl.innerHTML = `<b>${O(a.text)}</b>${a.subtext ? `<small>${O(a.subtext)}</small>` : ""}`);
	}
	categories(e) {
		let t = (e === "x" ? this.opts.xAxis : this.opts.yAxis) ?? {};
		if (t.categories) return t.categories;
		let n = /* @__PURE__ */ new Set();
		for (let t of this.list) for (let r of t.data) {
			let t = Array.isArray(r) ? r[e === "x" ? 0 : 1] : e === "x" ? r.x : r.y;
			typeof t == "string" && n.add(t);
		}
		return [...n];
	}
	axisType(e, t) {
		return ((e === "x" ? this.opts.xAxis : this.opts.yAxis) ?? {}).type ?? (t.length ? "category" : "value");
	}
	num(e, t) {
		if (t == null || t === "") return NaN;
		if (e.type === "category") {
			if (typeof t == "number") return t;
			let n = e.cats.indexOf(t);
			return n < 0 ? NaN : n;
		}
		return typeof t == "number" ? t : parseFloat(t);
	}
	T(e, t) {
		return e.type === "log" ? Math.log(t) / Math.log(e.base) : t;
	}
	U(e, t) {
		return e.type === "log" ? e.base ** +t : t;
	}
	normalize() {
		let e = this.opts, t = e.colors ?? E, n = this.categories("x"), r = this.categories("y"), i = (t, n) => {
			let r = (t === "x" ? e.xAxis : e.yAxis) ?? {};
			return {
				type: this.axisType(t, n),
				cats: n,
				min: 0,
				max: 1,
				ticks: [],
				base: r.logBase ?? 10,
				inverse: !!r.inverse,
				gap: r.boundaryGap ?? !0,
				opts: r
			};
		};
		this.ax = i("x", n), this.ay = i("y", r), this.models = this.list.map((e, n) => {
			let r = this.keyOf(e), i = {
				src: e,
				key: r,
				index: n,
				color: e.color ?? t[n % t.length],
				items: [],
				hidden: this.hiddenKeys.has(r),
				large: e.large ?? e.data.length > j,
				labels: P(e.labels),
				effect: {
					period: 3,
					scale: 2.5,
					count: 3,
					type: "stroke",
					...typeof e.effect == "object" ? e.effect : {}
				}
			}, a = /* @__PURE__ */ new Map(), o = i.large ? 4 : 10, s = e.data.some((e) => !Array.isArray(e) && e.effect !== void 0);
			return i.items = e.data.map((t, n) => {
				let c = Array.isArray(t) ? null : t, l = c ? [
					c.x,
					c.y ?? null,
					...c.values ?? []
				] : t, u = c?.id === void 0 ? `${r}|${c?.name ?? n}` : `#${c.id}`, d = a.get(u) ?? 0;
				a.set(u, d + 1), d && (u += `#${d}`);
				let f = c?.size ?? (typeof e.symbolSize == "function" ? e.symbolSize(l, n) : e.symbolSize ?? o), p = c?.symbol ?? (typeof e.symbol == "function" ? e.symbol(l, n) : e.symbol ?? "circle"), m = {
					key: u,
					s: i,
					i: n,
					vals: l,
					xv: this.num(this.ax, l[0]),
					yv: this.num(this.ay, l[1]),
					y0: c?.y0,
					bw: c?.width,
					name: c?.name,
					label: c?.label,
					data: c?.data,
					color: c?.color ?? i.color,
					size: Math.max(0, f),
					symbol: p,
					opacity: c?.opacity ?? e.opacity ?? (i.large ? .8 : .85),
					effect: s ? !!c?.effect : !!e.effect,
					inRange: !0,
					jit: 0,
					to: {
						x: 0,
						y: 0,
						w: 0,
						h: 0,
						sym: p,
						c: [
							0,
							0,
							0,
							1
						],
						a: 1
					},
					from: null,
					delay: 0
				};
				return m.y0 !== void 0 && (m.symbol = "rect"), m;
			}), i;
		}), this.items = this.models.filter((e) => !e.hidden).flatMap((e) => e.items), this.selection = null, this.applyVisual();
	}
	visualMaps() {
		let e = this.opts.visualMap;
		return e ? Array.isArray(e) ? e : [e] : [];
	}
	applyVisual() {
		let e = this.visualMaps(), t = this.vms;
		this.vms = e.map((e, n) => {
			let i = this.models.filter((t) => !e.series || e.series.includes(t.index)).flatMap((e) => e.items), a = e.dimension ?? (i.some((e) => e.vals.length > 2) ? 2 : 1), o = Infinity, s = -Infinity;
			for (let e of i) {
				let t = this.dimValue(e, a);
				Number.isFinite(t) && (t < o && (o = t), t > s && (s = t));
			}
			let c = e.min ?? (Number.isFinite(o) ? o : 0), l = e.max ?? (Number.isFinite(s) ? s : 1), u = t[n], d = e.colors ?? (e.sizes || e.opacity ? null : D);
			return {
				o: e,
				dim: a,
				min: c,
				max: l,
				range: u && u.o === e ? u.range : e.range ?? [c, l],
				off: u && u.o === e ? u.off : /* @__PURE__ */ new Set(),
				el: u?.el ?? null,
				palette: d ? Array.from({ length: 64 }, (e, t) => r(d, t / 63)) : []
			};
		});
		for (let e = this.vms.length; e < t.length; e++) t[e].el?.remove();
		for (let e of this.vms) {
			let t = e.o, n = e.max - e.min || 1;
			for (let r of this.models) if (!t.series || t.series.includes(r.index)) for (let i of r.items) {
				let a = this.dimValue(i, e.dim);
				if (!Number.isFinite(a)) continue;
				let o = r.src.data[i.i], s = Array.isArray(o) ? null : o;
				if (t.pieces) {
					let e = t.pieces[this.pieceOf(t, a)];
					if (!e) continue;
					e.color && !s?.color && (i.color = e.color), e.size !== void 0 && s?.size === void 0 && (i.size = e.size);
					continue;
				}
				let c = A((a - e.min) / n, 0, 1);
				e.palette.length && !s?.color && (i.color = e.palette[Math.round(c * 63)]), t.sizes && s?.size === void 0 && (i.size = t.sizes[0] + (t.sizes[1] - t.sizes[0]) * c), t.opacity && (i.opacity = t.opacity[0] + (t.opacity[1] - t.opacity[0]) * c);
			}
		}
		this.applyRanges(), this.renderVisual();
	}
	dimValue(e, t) {
		if (t === 0) return e.xv;
		if (t === 1) return e.yv;
		let n = e.vals[t];
		return typeof n == "number" ? n : n == null ? NaN : parseFloat(n);
	}
	pieceOf(e, t) {
		return (e.pieces ?? []).findIndex((e) => e.value === void 0 ? (e.min === void 0 || t >= e.min) && (e.max === void 0 || t < e.max) : e.value === t);
	}
	applyRanges() {
		for (let e of this.items) e.inRange = !0;
		for (let e of this.vms) {
			let t = e.o, [n, r] = e.range, i = n <= e.min && r >= e.max;
			if (t.pieces || !i) for (let i of this.items) {
				if (t.series && !t.series.includes(i.s.index)) continue;
				let a = this.dimValue(i, e.dim);
				Number.isFinite(a) && (t.pieces ? e.off.has(this.pieceOf(t, a)) && (i.inRange = !1) : (a < n || a > r) && (i.inRange = !1));
			}
		}
	}
	renderVisual() {
		for (let e of this.vms) {
			let n = e.o;
			if (n.show === !1) {
				e.el?.remove(), e.el = null;
				continue;
			}
			e.el || (e.el = document.createElement("div"), this.plotEl.append(e.el), this.bindVisual(e));
			let r = n.position ?? "right", i = r === "right" || r === "left", a = n.format ?? ((e) => t(e)), o = e.el;
			if (n.pieces) {
				o.className = `sc-vm sc-vm--pieces sc-vm--${i ? "v" : "h"}`, o.innerHTML = (n.title ? `<div class="sc-vm__title">${O(n.title)}</div>` : "") + n.pieces.map((t, n) => {
					let r = t.label ?? (t.value === void 0 ? t.min === void 0 ? `< ${a(t.max)}` : t.max === void 0 ? `≥ ${a(t.min)}` : `${a(t.min)} – ${a(t.max)}` : a(t.value)), i = t.size ? Math.min(18, Math.max(6, t.size)) : 10;
					return `<button type="button" class="sc-vm__piece${e.off.has(n) ? " is-off" : ""}" data-i="${n}"><i style="background:${t.color ?? this.theme.muted};width:${i}px;height:${i}px"></i>${O(r)}</button>`;
				}).join("");
				continue;
			}
			let s = e.max - e.min || 1, c = A((e.range[0] - e.min) / s, 0, 1), l = A((e.range[1] - e.min) / s, 0, 1), u = i ? "to top" : "to right", d = e.palette.length ? `background:linear-gradient(${u},${e.palette.filter((e, t) => t % 9 == 0 || t === 63).join(",")})` : `background:${this.theme.muted};clip-path:${i ? "polygon(35% 100%, 65% 100%, 100% 0, 0 0)" : "polygon(0 35%, 0 65%, 100% 100%, 100% 0)"}`;
			o.className = `sc-vm sc-vm--${i ? "v" : "h"}${n.interactive === !1 ? "" : " is-interactive"}`;
			let f = (e) => i ? `bottom:${e * 100}%` : `left:${e * 100}%`;
			o.innerHTML = `
        ${n.title ? `<div class="sc-vm__title">${O(n.title)}</div>` : ""}
        <div class="sc-vm__end">${O(a(i ? e.max : e.min))}</div>
        <div class="sc-vm__track">
          <div class="sc-vm__bar" style="${d}"></div>
          <div class="sc-vm__mask" style="${i ? `bottom:0;height:${c * 100}%` : `left:0;width:${c * 100}%`}"></div>
          <div class="sc-vm__mask" style="${i ? `top:0;height:${(1 - l) * 100}%` : `right:0;width:${(1 - l) * 100}%`}"></div>
          ${n.interactive === !1 ? "" : `<div class="sc-vm__handle" data-h="0" style="${f(c)}">${c > .001 ? `<span>${O(a(e.range[0]))}</span>` : ""}</div><div class="sc-vm__handle" data-h="1" style="${f(l)}">${l < .999 ? `<span>${O(a(e.range[1]))}</span>` : ""}</div>`}
        </div>
        <div class="sc-vm__end">${O(a(i ? e.min : e.max))}</div>`;
		}
		this.placeVisual();
	}
	bindVisual(e) {
		let t = e.el;
		t.addEventListener("click", (t) => {
			let n = t.target.closest(".sc-vm__piece");
			if (!n || e.o.interactive === !1) return;
			let r = Number(n.dataset.i);
			e.off.has(r) ? e.off.delete(r) : e.off.add(r), this.applyRanges(), this.renderVisual(), this.draw();
		}), t.addEventListener("pointerdown", (n) => {
			if (e.o.pieces || e.o.interactive === !1) return;
			let r = t.querySelector(".sc-vm__track");
			if (!r) return;
			let i = (e.o.position ?? "right") === "right" || e.o.position === "left", a = (t) => {
				let n = r.getBoundingClientRect(), a = i ? 1 - (t.clientY - n.top) / n.height : (t.clientX - n.left) / n.width;
				return e.min + A(a, 0, 1) * (e.max - e.min);
			}, o = n.target.closest(".sc-vm__handle"), s = a(n), c = o ? Number(o.dataset.h) : Math.abs(s - e.range[0]) < Math.abs(s - e.range[1]) ? 0 : 1;
			if (!o && !n.target.closest(".sc-vm__track")) return;
			n.preventDefault(), t.setPointerCapture(n.pointerId);
			let l = (t) => {
				let n = a(t), r = [...e.range];
				r[c] = n, r[0] > r[1] && (r.reverse(), c = 1 - c), e.range = r, this.applyRanges(), this.renderVisual(), this.draw();
			};
			l(n);
			let u = () => {
				t.removeEventListener("pointermove", l), t.removeEventListener("pointerup", u), t.removeEventListener("pointercancel", u);
			};
			t.addEventListener("pointermove", l), t.addEventListener("pointerup", u), t.addEventListener("pointercancel", u);
		});
	}
	visualRoom() {
		let e = {
			right: 0,
			left: 0,
			bottom: 0,
			top: 0
		};
		for (let t of this.vms) {
			if (t.o.show === !1) continue;
			let n = t.o.position ?? "right", r = n === "right" || n === "left" ? t.o.pieces ? 96 : 66 : t.o.pieces ? 30 : 48;
			e[n] = Math.max(e[n], r);
		}
		return e;
	}
	placeVisual() {
		let e = {};
		for (let t of this.vms) t.el && (e[t.o.position ?? "right"] ??= []).push(t);
		let t = this.plot;
		for (let [n, r] of Object.entries(e)) {
			let e = n === "right" || n === "left";
			r.forEach((i, a) => {
				let o = i.el.style;
				if (e) {
					let e = (t.h - (r.length - 1) * 12) / r.length, s = this.opts.padding ?? 8;
					o.left = n === "right" ? `${this.width - s - (i.o.pieces ? 92 : 58)}px` : `${s}px`, o.top = `${t.y + a * (e + 12)}px`, o.height = `${i.o.pieces ? "auto" : `${Math.max(60, e)}px`}`, o.width = "";
				} else {
					let e = Math.min(t.w, 420), r = this.opts.padding ?? 8;
					o.left = `${t.x + (t.w - e) / 2}px`, o.width = `${e}px`, o.top = n === "bottom" ? `${this.height - r - (i.o.pieces ? 26 : 40) - a * 44}px` : `${r + a * 44}px`, o.height = "";
				}
			});
		}
	}
	duration() {
		let e = this.opts.animation ?? !0;
		return e === !1 ? 0 : typeof e == "object" ? e.duration ?? 700 : 700;
	}
	rebuild(e) {
		let t = performance.now(), n = /* @__PURE__ */ new Map();
		if (e === "morph") for (let e of this.items) n.set(e.key, this.current(e, t));
		let r = this.items;
		this.normalize(), this.layout(), this.ghosts = [];
		let i = this.items.length, a = this.duration(), o = e !== null && a > 0 && i <= j * 1.5 && this.width > 1;
		for (let e of this.items) e.delay = 0, e.from = null, o && (e.from = n.get(e.key) ?? {
			...e.to,
			w: 0,
			h: 0
		});
		if (o) {
			if (e === "enter") {
				let e = this.opts.animation, t = typeof e == "object" ? e.delay : void 0, n = this.items.map((e) => e.to.x), r = Math.min(...n), i = Math.max(...n) - r || 1;
				this.items.forEach((e, n) => {
					e.delay = typeof t == "function" ? t(n) : typeof t == "number" ? t * n : t === "x" ? (e.to.x - r) / i * 500 : 0;
				});
			}
			let i = new Set(this.items.map((e) => e.key));
			for (let e of r) {
				let t = n.get(e.key);
				!i.has(e.key) && t && this.ghosts.push({
					...e,
					from: t,
					to: {
						...t,
						w: 0,
						h: 0,
						a: 0
					},
					delay: 0
				});
			}
			this.animStart = t, this.animEnd = t + a + Math.max(0, ...this.items.map((e) => e.delay));
		} else this.animEnd = 0;
		this.hover = null, this.hideTooltip(), this.renderLegend(), this.loop();
	}
	progress(e, t) {
		if (!e.from) return 1;
		let n = (t - this.animStart - e.delay) / this.duration();
		return n >= 1 ? 1 : n <= 0 ? 0 : k(n);
	}
	current(e, t) {
		let n = this.progress(e, t);
		if (n >= 1 || !e.from) return e.to;
		let r = e.from, i = e.to, a = (e, t) => e + (t - e) * n;
		return {
			x: a(r.x, i.x),
			y: a(r.y, i.y),
			w: a(r.w, i.w),
			h: a(r.h, i.h),
			sym: n < .5 ? r.sym : i.sym,
			c: [
				a(r.c[0], i.c[0]),
				a(r.c[1], i.c[1]),
				a(r.c[2], i.c[2]),
				a(r.c[3], i.c[3])
			],
			a: a(r.a, i.a)
		};
	}
	hasEffects() {
		return this.items.some((e) => e.effect);
	}
	loop() {
		if (cancelAnimationFrame(this.raf), !this.destroyed) {
			if (this.draw(), performance.now() < this.animEnd || this.hasEffects()) this.raf = requestAnimationFrame(() => this.loop());
			else {
				this.ghosts = [];
				for (let e of this.items) e.from = null;
			}
		}
	}
	measure() {
		let e = this.plotEl.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height)), this.canvas.width = Math.round(this.width * this.dpr), this.canvas.height = Math.round(this.height * this.dpr), this.canvas.style.width = `${this.width}px`, this.canvas.style.height = `${this.height}px`;
	}
	resize() {
		this.measure(), this.layout(), this.draw();
	}
	get polarCfg() {
		let e = this.opts.polar;
		if (!e) return null;
		let t = typeof e == "object" ? e : {};
		return {
			start: (t.startAngle ?? 90) * Math.PI / 180,
			cw: t.clockwise ?? !0,
			inner: A(t.innerRadius ?? 0, 0, .9)
		};
	}
	domX() {
		return this.viewX ?? [this.ax.min, this.ax.max];
	}
	domY() {
		return this.viewY ?? [this.ay.min, this.ay.max];
	}
	scale(t, n, r) {
		let i = t.opts;
		if (t.type === "category") {
			let e = Math.max(1, t.cats.length), r = n === "x" && this.polarCfg;
			t.min = r ? 0 : t.gap ? -.5 : 0, t.max = r ? e : t.gap ? e - .5 : Math.max(1, e - 1), t.ticks = t.cats.map((e, t) => t);
			return;
		}
		let a = Infinity, o = -Infinity, s = (e) => {
			if (e === void 0 || !Number.isFinite(e) || t.type === "log" && e <= 0) return;
			let n = this.T(t, e);
			n < a && (a = n), n > o && (o = n);
		};
		for (let e of this.items) n === "x" ? s(e.xv) : (s(e.yv), s(e.y0));
		if (Number.isFinite(a) || ([a, o] = (t.type, [0, 1])), t.type === "log") {
			t.min = typeof i.min == "number" ? this.T(t, i.min) : Math.floor(a), t.max = typeof i.max == "number" ? this.T(t, i.max) : Math.ceil(o), t.max <= t.min && (t.max = t.min + 1), t.ticks = [];
			for (let e = Math.ceil(t.min); e <= Math.floor(t.max); e++) t.ticks.push(e);
			if (t.ticks.length < 3) {
				let e = [2, 5].map((e) => Math.log(e) / Math.log(t.base));
				t.ticks = t.ticks.flatMap((t) => [t, ...e.map((e) => t + e)]).filter((e) => e >= t.min && e <= t.max);
			}
			return;
		}
		i.beginAtZero && (a = Math.min(a, 0), o = Math.max(o, 0));
		let c = i.ticks ?? Math.max(2, Math.round(r / (n === "x" ? 90 : 48))), l = e(a, o, c);
		t.min = typeof i.min == "number" ? i.min : i.min === "dataMin" ? a : l.min, t.max = typeof i.max == "number" ? i.max : i.max === "dataMax" ? o : l.max, t.max <= t.min && (t.max = t.min + 1), t.ticks = this.ticksOf(t, [t.min, t.max], c);
	}
	ticksOf(t, [n, r], i) {
		return t.type === "category" ? t.ticks : t.type === "log" ? t.ticks.filter((e) => e >= n - 1e-9 && e <= r + 1e-9) : e(n, r, i).ticks.filter((e) => e >= n - 1e-9 && e <= r + 1e-9);
	}
	fmtTick(e, n) {
		if (e.type === "category") {
			let t = e.cats[Math.round(n)] ?? "";
			return e.opts.format ? e.opts.format(Math.round(n), t) : t;
		}
		let r = this.U(e, n);
		return e.opts.format ? e.opts.format(r) : t(e.type === "log" ? +r.toPrecision(6) : r);
	}
	font(e = 11, t = 400) {
		return `${t} ${e}px ${this.theme.font}`;
	}
	layout() {
		let e = this.opts, t = e.padding ?? 8, n = this.polarCfg, r = this.visualRoom(), i = {
			top: 0,
			right: 0
		};
		for (let e of this.models) if (!e.hidden && e.labels?.layout) {
			if (e.labels.layout === "top") i.top = 30;
			else {
				this.ctx.font = this.font(e.labels.fontSize, e.labels.fontWeight);
				let t = Math.max(0, ...e.items.map((t) => this.ctx.measureText(this.labelText(t, e.labels)).width));
				i.right = Math.max(i.right, Math.min(160, t + 26));
			}
		}
		let a = this.width, o = this.height, s = this.ax.opts, c = this.ay.opts, l = s.show !== !1 && !n, u = c.show !== !1 && !n;
		this.scale(this.ax, "x", a - 80), this.scale(this.ay, "y", o - 50), this.ctx.font = this.font(11);
		let d = this.ticksOf(this.ay, this.domY(), 5), f = u ? Math.max(0, ...d.map((e) => this.ctx.measureText(this.fmtTick(this.ay, e)).width)) + 10 + (c.title ? 18 : 0) : 0, p = (s.rotate ?? 0) * Math.PI / 180, m = l && p ? Math.max(0, ...this.ax.ticks.map((e) => this.ctx.measureText(this.fmtTick(this.ax, e)).width)) : 0, h = l ? 20 + Math.abs(Math.sin(p)) * m + (s.title ? 18 : 0) : 0, g = t + r.left + (c.opposite ? 6 : f), _ = t + r.right + i.right + (c.opposite ? f : 10), v = t + r.top + i.top + (s.opposite ? h : 6), y = t + r.bottom + (s.opposite ? 6 : h);
		if (!l && !u && !n) {
			let e = Math.min(14, Math.max(4, ...this.items.slice(0, 2e3).map((e) => e.size / 2 + 1)));
			g = t + r.left + e, _ = t + r.right + i.right + e, v = Math.max(v, t + r.top + i.top + e), y = t + r.bottom + e;
		}
		if (this.plot = {
			x: g,
			y: v,
			w: Math.max(10, a - g - _),
			h: Math.max(10, o - v - y)
		}, n && (this.plot = {
			x: g + 22,
			y: v + 22,
			w: Math.max(10, a - g - _ - 44),
			h: Math.max(10, o - v - y - 44)
		}), this.scale(this.ax, "x", this.plot.w), this.scale(this.ay, "y", this.plot.h), e.aspect && !n && this.ax.type === "value" && this.ay.type === "value") {
			let t = typeof e.aspect == "number" ? e.aspect : 1, [n, r] = this.domX(), [i, a] = this.domY(), o = this.plot.w / (r - n), s = this.plot.h / (a - i) / t, c = Math.min(o, s), l = c * (r - n), u = c * t * (a - i);
			this.plot = {
				x: this.plot.x + (this.plot.w - l) / 2,
				y: this.plot.y + (this.plot.h - u) / 2,
				w: l,
				h: u
			};
		}
		this.layoutItems(), this.placeVisual();
	}
	pt(e, t) {
		let [n, r] = this.domX(), [i, a] = this.domY(), o = (this.T(this.ax, e) - n) / (r - n || 1), s = (this.T(this.ay, t) - i) / (a - i || 1);
		this.ax.inverse && (o = 1 - o), this.ay.inverse && (s = 1 - s);
		let c = this.plot, l = this.polarCfg;
		if (l) {
			let { cx: e, cy: t, R: n } = this.polarGeom(), r = n * (l.inner + (1 - l.inner) * s), i = l.start + (l.cw ? -1 : 1) * o * M;
			return {
				x: e + r * Math.cos(i),
				y: t - r * Math.sin(i)
			};
		}
		return {
			x: c.x + o * c.w,
			y: c.y + c.h - s * c.h
		};
	}
	polarGeom() {
		let e = this.plot;
		return {
			cx: e.x + e.w / 2,
			cy: e.y + e.h / 2,
			R: Math.min(e.w, e.h) / 2
		};
	}
	band(e, t) {
		let [n, r] = e === this.ax ? this.domX() : this.domY();
		return t / Math.max(1e-9, r - n);
	}
	layoutItems() {
		let e = this.plot, t = !!this.polarCfg;
		for (let n of this.items) {
			let r = this.rgbaOf(n.color), { x: i, y: a } = this.pt(n.xv, n.yv), o = n.size, s = n.size;
			if (n.y0 !== void 0 && !t) {
				let t = this.pt(n.xv, n.y0).y;
				s = Math.abs(t - a), a = (a + t) / 2;
				let r = n.bw ?? n.s.src.barWidth ?? "50%", i = this.ax.type === "category" ? this.band(this.ax, e.w) : e.w / 12;
				o = typeof r == "number" ? r : i * parseFloat(r) / 100;
			}
			(!Number.isFinite(i) || !Number.isFinite(a)) && (i = a = NaN), n.to = {
				x: i,
				y: a,
				w: o,
				h: s,
				sym: n.symbol,
				c: [
					r[0],
					r[1],
					r[2],
					1
				],
				a: n.opacity * r[3]
			};
		}
		this.jitter(), this.grid = null, this.layoutLabels();
	}
	jitter() {
		for (let [e, t] of [[this.ax, "x"], [this.ay, "y"]]) {
			let n = e.opts.jitter;
			if (!n || e.type !== "category" || this.polarCfg) continue;
			let r = /* @__PURE__ */ new Map();
			for (let e of this.items) {
				let n = t === "x" ? e.xv : e.yv;
				if (!Number.isFinite(n)) continue;
				let i = r.get(n);
				i || r.set(n, i = []), i.push(e);
			}
			for (let i of r.values()) {
				let r;
				r = e.opts.jitterOverlap ? i.map((e) => {
					let t = 0;
					for (let n = 0; n < e.key.length; n++) t = t * 31 + e.key.charCodeAt(n) | 0;
					return ((t >>> 0) % 1e3 / 1e3 - .5) * n;
				}) : p(i.map((e) => t === "x" ? e.to.y : e.to.x), i.map((e) => e.size / 2), n / 2), i.forEach((e, n) => {
					e.jit = r[n], t === "x" ? e.to.x += r[n] : e.to.y += r[n];
				});
			}
		}
	}
	fmtVal(e, t) {
		return e == null ? "–" : typeof e == "string" ? e : t === 0 && this.ax.type === "category" ? this.ax.cats[e] ?? String(e) : t === 1 && this.ay.type === "category" ? this.ay.cats[e] ?? String(e) : this.opts.valueFormatter ? this.opts.valueFormatter(e, t) : e.toLocaleString("pt-PT", { maximumFractionDigits: Math.abs(e) >= 100 ? 1 : 2 });
	}
	labelText(e, t) {
		return typeof t.content == "function" ? t.content(this.info(e)) : typeof t.content == "number" ? this.fmtVal(e.vals[t.content] ?? null, t.content) : e.label ?? e.name ?? "";
	}
	layoutLabels() {
		let e = [], t = this.plot, n = [], r = (e) => !n.some((t) => e.x < t.x + t.w && e.x + e.w > t.x && e.y < t.y + t.h && e.y + e.h > t.y), i = {
			top: [],
			right: []
		};
		for (let t of this.models) {
			let a = t.labels;
			if (t.hidden || !a) continue;
			let o = this.font(a.fontSize, a.fontWeight);
			this.ctx.font = o;
			let s = a.fontSize + 4, c = t.items.filter((e) => Number.isFinite(e.to.x)).map((e) => ({
				it: e,
				text: this.labelText(e, a)
			})).filter((e) => e.text).map((e) => ({
				...e,
				w: this.ctx.measureText(e.text).width + 4
			})), l = (e) => a.color ?? (a.position === "inside" ? "#fff" : e.color);
			if (a.layout) {
				for (let e of c) i[a.layout].push({
					...e,
					h: s,
					color: l(e.it),
					font: o
				});
				continue;
			}
			let u = a.hideOverlap ? [...c].sort((e, t) => t.it.size - e.it.size) : c;
			for (let t of u) {
				let i = t.it.to, [c, u] = a.position === "inside" ? [i.x, i.y] : a.position === "right" ? [i.x + i.w / 2 + 3 + t.w / 2, i.y] : a.position === "left" ? [i.x - i.w / 2 - 3 - t.w / 2, i.y] : a.position === "bottom" ? [i.x, i.y + i.h / 2 + 3 + s / 2] : [i.x, i.y - i.h / 2 - 3 - s / 2], d = {
					x: c - t.w / 2,
					y: u - s / 2,
					w: t.w,
					h: s
				};
				(!a.hideOverlap || r(d)) && (n.push(d), e.push({
					text: t.text,
					x: c,
					y: u,
					w: t.w,
					h: s,
					color: l(t.it),
					font: o
				}));
			}
		}
		for (let n of ["top", "right"]) {
			let r = i[n];
			if (!r.length) continue;
			let a = n === "top", o = a ? t.x : t.y, s = a ? t.x + t.w : t.y + t.h, c = (e) => a ? e.w + 6 : e.h + 1, l = [...r].sort((e, t) => t.it.size - e.it.size), u = l.reduce((e, t) => e + c(t), 0);
			for (; l.length && u > s - o;) u -= c(l.pop());
			l.sort((e, t) => a ? e.it.to.x - t.it.to.x : e.it.to.y - t.it.to.y);
			let d = l.map((e) => (a ? e.it.to.x : e.it.to.y) - c(e) / 2);
			for (let e = 0; e < d.length; e++) d[e] = Math.max(d[e], e ? d[e - 1] + c(l[e - 1]) : o);
			for (let e = d.length - 1; e >= 0; e--) d[e] = Math.min(d[e], e < d.length - 1 ? d[e + 1] - c(l[e]) : s - c(l[e]));
			l.forEach((n, r) => {
				let i = n.it.to, o = d[r] + c(n) / 2;
				if (a) {
					let r = t.y - 16;
					e.push({
						text: n.text,
						x: o,
						y: r,
						w: n.w,
						h: n.h,
						color: n.color,
						font: n.font,
						line: [
							i.x,
							i.y - i.h / 2 - 2,
							o,
							r + n.h / 2 + 6,
							o,
							r + n.h / 2 + 1
						]
					});
				} else {
					let r = t.x + t.w + 16 + n.w / 2;
					e.push({
						text: n.text,
						x: r,
						y: o,
						w: n.w,
						h: n.h,
						color: n.color,
						font: n.font,
						line: [
							i.x + i.w / 2 + 2,
							i.y,
							t.x + t.w + 6,
							o,
							t.x + t.w + 13,
							o
						]
					});
				}
			});
		}
		this.labelsCache = e;
	}
	api() {
		return {
			plot: { ...this.plot },
			width: this.width,
			height: this.height,
			theme: this.theme,
			x: (e) => this.pt(this.num(this.ax, e), this.ay.type === "category" ? 0 : this.U(this.ay, this.domY()[0])).x,
			y: (e) => this.pt(this.ax.type === "category" ? 0 : this.U(this.ax, this.domX()[0]), this.num(this.ay, e)).y,
			point: (e, t) => this.pt(this.num(this.ax, e), this.num(this.ay, t)),
			toData: (e, t) => this.toData(e, t)
		};
	}
	draw() {
		if (this.destroyed) return;
		let e = this.ctx, t = this.theme;
		e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.clearRect(0, 0, this.width, this.height), t.background !== "transparent" && (e.fillStyle = t.background, e.fillRect(0, 0, this.width, this.height));
		let n = performance.now();
		this.polarCfg ? this.drawPolarGrid() : this.drawGrid(), this.opts.underlay && (e.save(), this.opts.underlay(e, this.api()), e.restore()), !this.items.length && !this.ghosts.length && (e.fillStyle = t.muted, e.font = this.font(13), e.textAlign = "center", e.textBaseline = "middle", e.fillText(this.opts.emptyText ?? "Sem dados", this.width / 2, this.height / 2));
		let r = !!(this.viewX || this.viewY);
		e.save(), r && (e.beginPath(), e.rect(this.plot.x, this.plot.y, this.plot.w, this.plot.h), e.clip());
		for (let e of this.models) {
			if (e.hidden) continue;
			let t = this.seriesAlpha(e);
			this.drawMarkArea(e, t), this.drawHull(e, t), this.drawLine(e, t);
		}
		for (let e of this.models) e.hidden || (e.large && !this.animating(n) ? this.drawLarge(e) : this.drawItems(e, n));
		this.drawGhosts(n);
		for (let e of this.models) {
			if (e.hidden) continue;
			let t = this.seriesAlpha(e);
			this.drawRegression(e, t), this.drawMarks(e, t);
		}
		if (e.restore(), this.animating(n) || this.drawLabels(), this.polarCfg || this.drawAxes(), this.opts.graphic && (e.save(), this.opts.graphic(e, this.api()), e.restore()), this.drawHover(), this.brushRect) {
			let [t, n, r, i] = this.brushRect;
			e.fillStyle = "rgba(41, 98, 255, 0.12)", e.strokeStyle = "rgba(41, 98, 255, 0.8)", e.lineWidth = 1, e.fillRect(Math.min(t, r), Math.min(n, i), Math.abs(r - t), Math.abs(i - n)), e.strokeRect(Math.min(t, r) + .5, Math.min(n, i) + .5, Math.abs(r - t), Math.abs(i - n));
		}
	}
	animating(e) {
		return e < this.animEnd;
	}
	seriesAlpha(e) {
		return this.highlighted && this.highlighted !== e.key ? this.opts.hoverDim ?? .15 : 1;
	}
	alphaOf(e, t) {
		let n = t;
		return e.inRange || (n *= .1), this.selection && !this.selection.has(e) && (n *= .12), n;
	}
	hidden(e) {
		return !e.inRange && this.vms.some((e) => e.o.outOfRange === "hide");
	}
	drawItems(e, t) {
		let n = this.ctx, r = e.src, i = this.seriesAlpha(e), a = r.shadow ? {
			color: "rgba(0,0,0,0.35)",
			blur: 10,
			offsetY: 3,
			...typeof r.shadow == "object" ? r.shadow : {}
		} : null;
		n.globalCompositeOperation = r.blend === "lighter" ? "lighter" : "source-over";
		let o = t / 1e3;
		for (let s of e.items) {
			if (this.hidden(s)) continue;
			let c = this.progress(s, t), l = c >= 1 ? s.to : this.current(s, t);
			if (!(l.w > .2 || l.h > .2) || !Number.isFinite(l.x)) continue;
			let u = this.alphaOf(s, l.a * i);
			if (s.effect && c >= 1 && this.drawRipple(s, l, e.effect, o, u), n.globalAlpha = u, n.beginPath(), c < 1 && s.from && (s.from.sym !== s.to.sym || s.from.w !== s.from.h || s.to.w !== s.to.h) ? S(n, s.from.sym, s.from.x, s.from.y, s.from.w, s.from.h, s.to.sym, s.to.x, s.to.y, s.to.w, s.to.h, c) : x(n, l.sym, l.x, l.y, l.w, l.h), r.gradient) {
				let e = Math.max(l.w, l.h) / 2, t = n.createRadialGradient(l.x - e * .35, l.y - e * .35, e * .05, l.x, l.y, e);
				t.addColorStop(0, N([
					Math.min(255, l.c[0] + 110),
					Math.min(255, l.c[1] + 110),
					Math.min(255, l.c[2] + 110),
					1
				])), t.addColorStop(1, N(l.c, 1)), n.fillStyle = t;
			} else n.fillStyle = N(l.c, 1);
			a && (n.shadowColor = a.color, n.shadowBlur = a.blur, n.shadowOffsetY = a.offsetY), n.fill(), a && (n.shadowColor = "transparent", n.shadowBlur = 0, n.shadowOffsetY = 0), r.borderWidth && (n.lineWidth = r.borderWidth, n.strokeStyle = r.borderColor ?? this.theme.background, n.stroke());
		}
		n.globalAlpha = 1, n.globalCompositeOperation = "source-over";
	}
	drawRipple(e, t, n, r, i) {
		let a = this.ctx, o = Math.max(t.w, t.h) / 2;
		a.lineWidth = 1.5;
		for (let s = 0; s < n.count; s++) {
			let c = (r / n.period + s / n.count + e.i % 7 * .037) % 1, l = o * (1 + (n.scale - 1) * c);
			a.globalAlpha = i * (1 - c) * (n.type === "fill" ? .35 : .8), a.beginPath(), a.arc(t.x, t.y, l, 0, M), n.type === "fill" ? (a.fillStyle = N(t.c, 1), a.fill()) : (a.strokeStyle = N(t.c, 1), a.stroke());
		}
	}
	drawLarge(e) {
		let t = this.ctx, n = this.seriesAlpha(e);
		t.globalCompositeOperation = e.src.blend === "lighter" ? "lighter" : "source-over";
		let r = /* @__PURE__ */ new Map();
		for (let t of e.items) {
			if (this.hidden(t) || !Number.isFinite(t.to.x)) continue;
			let e = this.alphaOf(t, t.to.a * n), i = `${t.color}|${e.toFixed(2)}`, a = r.get(i);
			a || r.set(i, a = []), a.push(t);
		}
		for (let [e, n] of r) {
			let [r, i] = e.split("|");
			t.globalAlpha = Number(i), t.fillStyle = r, t.beginPath();
			for (let e of n) {
				let { x: n, y: r, w: i } = e.to;
				i <= 3 || e.symbol !== "circle" ? t.rect(n - i / 2, r - i / 2, i, i) : (t.moveTo(n + i / 2, r), t.arc(n, r, i / 2, 0, M));
			}
			t.fill();
		}
		t.globalAlpha = 1, t.globalCompositeOperation = "source-over";
	}
	drawGhosts(e) {
		if (!this.ghosts.length) return;
		let t = this.ctx;
		for (let n of this.ghosts) {
			let r = this.current(n, e);
			r.w <= .2 || (t.globalAlpha = r.a, t.fillStyle = N(r.c, 1), t.beginPath(), x(t, r.sym, r.x, r.y, r.w, r.h), t.fill());
		}
		t.globalAlpha = 1;
	}
	visiblePts(e) {
		return e.items.filter((e) => Number.isFinite(e.to.x) && Number.isFinite(e.to.y) && !this.hidden(e));
	}
	drawHull(e, t) {
		if (!e.src.hull) return;
		let n = this.visiblePts(e).map((e) => [e.to.x, e.to.y]);
		if (n.length < 3) return;
		let r = f(n), i = this.ctx, a = typeof e.src.hull == "object" ? e.src.hull.opacity ?? .12 : .12;
		i.beginPath(), r.forEach(([e, t], n) => n ? i.lineTo(e, t) : i.moveTo(e, t)), i.closePath(), i.globalAlpha = a * t, i.fillStyle = e.color, i.fill(), i.globalAlpha = .6 * t, i.strokeStyle = e.color, i.lineWidth = 1.2, i.lineJoin = "round", i.stroke(), i.globalAlpha = 1;
	}
	drawLine(e, t) {
		let n = e.src.line;
		if (!n) return;
		let r = typeof n == "object" ? n : {}, i = this.visiblePts(e);
		if (i.length < 2) return;
		let a = this.ctx;
		a.beginPath(), i.forEach((e, t) => t ? a.lineTo(e.to.x, e.to.y) : a.moveTo(e.to.x, e.to.y)), a.globalAlpha = .8 * t, a.strokeStyle = r.color ?? e.color, a.lineWidth = r.width ?? 1.5, a.setLineDash(r.dash ?? []), a.stroke(), a.setLineDash([]), a.globalAlpha = 1;
	}
	drawRegression(e, t) {
		let n = e.src.regression;
		if (!n || this.ax.type === "category" || this.polarCfg) return;
		let r = typeof n == "string" ? { type: n } : n, i = e.items.filter((e) => Number.isFinite(e.xv) && Number.isFinite(e.yv)).map((e) => [e.xv, e.yv]);
		if (i.length < 2) return;
		let a = c(r.type, i, r.order ?? 2), o = i.map((e) => e[0]).filter((e) => r.type !== "logarithmic" || e > 0), s = Math.min(...o), l = Math.max(...o), u = this.ctx, d = [];
		for (let e = 0; e <= 80; e++) {
			let t = s + (l - s) * e / 80, n = a.predict(t);
			Number.isFinite(n) && d.push(this.pt(t, n));
		}
		if (d.length < 2) return;
		u.save(), u.beginPath(), u.rect(this.plot.x, this.plot.y, this.plot.w, this.plot.h), u.clip(), u.beginPath(), d.forEach((e, t) => t ? u.lineTo(e.x, e.y) : u.moveTo(e.x, e.y)), u.globalAlpha = t, u.strokeStyle = r.color ?? e.color, u.lineWidth = r.width ?? 2, u.setLineDash(r.dash ?? []), u.stroke(), u.restore();
		let f = r.label ?? !0;
		if (!f) return;
		let p = f === "r2" ? `R² = ${a.r2.toFixed(3)}` : f === "formula" ? a.expression : `${a.expression}   R² = ${a.r2.toFixed(3)}`;
		u.font = this.font(11, 600);
		let m = u.measureText(p).width, h = d[d.length - 1], g = A(h.x - m, this.plot.x + 4, this.plot.x + this.plot.w - m - 4), _ = A(h.y - 12, this.plot.y + 10, this.plot.y + this.plot.h - 10);
		u.globalAlpha = t, u.fillStyle = this.theme.background === "transparent" ? "rgba(0,0,0,0.35)" : this.theme.background, u.globalAlpha = .75 * t, u.fillRect(g - 4, _ - 8, m + 8, 16), u.globalAlpha = t, u.fillStyle = r.color ?? e.color, u.textAlign = "left", u.textBaseline = "middle", u.fillText(p, g, _), u.globalAlpha = 1;
	}
	drawMarkArea(e, t) {
		let n = e.src.marks?.area;
		if (!n || this.polarCfg) return;
		let r = e.items.filter((e) => Number.isFinite(e.xv) && Number.isFinite(e.yv));
		if (!r.length) return;
		let i = this.pt(Math.min(...r.map((e) => e.xv)), Math.max(...r.map((e) => e.yv))), a = this.pt(Math.max(...r.map((e) => e.xv)), Math.min(...r.map((e) => e.yv))), o = this.ctx;
		o.globalAlpha = .08 * t, o.fillStyle = e.color, o.fillRect(Math.min(i.x, a.x), Math.min(i.y, a.y), Math.abs(a.x - i.x), Math.abs(a.y - i.y)), o.globalAlpha = .5 * t, o.strokeStyle = e.color, o.setLineDash([3, 3]), o.strokeRect(Math.min(i.x, a.x) + .5, Math.min(i.y, a.y) + .5, Math.abs(a.x - i.x), Math.abs(a.y - i.y)), o.setLineDash([]), typeof n == "string" && (o.globalAlpha = t, o.fillStyle = e.color, o.font = this.font(11, 600), o.textAlign = "left", o.textBaseline = "top", o.fillText(n, Math.min(i.x, a.x) + 5, Math.min(i.y, a.y) + 4)), o.globalAlpha = 1;
	}
	drawMarks(e, t) {
		let n = e.src.marks;
		if (!n || this.polarCfg) return;
		let r = this.ctx, i = e.items.filter((e) => Number.isFinite(e.xv) && Number.isFinite(e.yv));
		if (!i.length) return;
		let a = this.plot;
		r.globalAlpha = t;
		let o = n.average === !0 ? "y" : n.average, s = (e, t) => this.fmtVal(e, t);
		if (o) {
			if (r.strokeStyle = e.color, r.lineWidth = 1, r.setLineDash([5, 4]), r.font = this.font(10.5, 600), r.fillStyle = e.color, o === "y" || o === "both") {
				let e = +(i.reduce((e, t) => e + t.yv, 0) / i.length).toPrecision(4), t = Math.round(this.pt(i[0].xv, e).y) + .5;
				r.beginPath(), r.moveTo(a.x, t), r.lineTo(a.x + a.w, t), r.stroke(), r.textAlign = "right", r.textBaseline = "bottom", r.fillText(`Média ${s(e, 1)}`, a.x + a.w - 2, t - 2);
			}
			if (o === "x" || o === "both") {
				let e = +(i.reduce((e, t) => e + t.xv, 0) / i.length).toPrecision(4), t = Math.round(this.pt(e, i[0].yv).x) + .5;
				r.beginPath(), r.moveTo(t, a.y), r.lineTo(t, a.y + a.h), r.stroke(), r.textAlign = "left", r.textBaseline = "top", r.fillText(`Média ${s(e, 0)}`, t + 3, a.y + 2);
			}
			r.setLineDash([]);
		}
		let c = (t, n) => {
			let i = t.to, a = Math.max(26, (r.measureText(n).width || 0) + 10), o = a * 1.2;
			r.beginPath(), x(r, "pin", i.x, i.y - i.h / 2 - o / 2 + 2, a, o), r.fillStyle = e.color, r.fill(), r.fillStyle = "#fff", r.textAlign = "center", r.textBaseline = "middle", r.fillText(n, i.x, i.y - i.h / 2 - o / 2 - o * .12 + 2);
		};
		if (r.font = this.font(10, 700), n.max) {
			let e = i.reduce((e, t) => t.yv > e.yv ? t : e);
			c(e, s(e.yv, 1));
		}
		if (n.min) {
			let e = i.reduce((e, t) => t.yv < e.yv ? t : e);
			c(e, s(e.yv, 1));
		}
		r.globalAlpha = 1;
	}
	drawLabels() {
		let e = this.ctx;
		e.textAlign = "center", e.textBaseline = "middle";
		for (let t of this.labelsCache) {
			if (t.line) {
				let [n, r, i, a, o, s] = t.line;
				e.globalAlpha = .6, e.strokeStyle = t.color, e.lineWidth = 1, e.beginPath(), e.moveTo(n, r), e.lineTo(i, a), e.lineTo(o, s), e.stroke(), e.globalAlpha = 1;
			}
			e.font = t.font, e.fillStyle = t.color, e.fillText(t.text, t.x, t.y);
		}
	}
	gridDash(e) {
		return e.opts.gridDash ?? [];
	}
	drawGrid() {
		let e = this.ctx, t = this.plot;
		e.strokeStyle = this.theme.grid, e.lineWidth = 1;
		let [n, r] = this.domX(), [i, a] = this.domY();
		if (this.ax.opts.grid ?? this.ax.opts.show !== !1) {
			e.setLineDash(this.gridDash(this.ax)), e.beginPath();
			let i = this.ax.type === "category" && this.ax.gap ? this.ax.ticks.map((e) => e - .5).concat(this.ax.ticks.length - .5) : this.xTicks();
			for (let a of i) {
				if (a < n - 1e-9 || a > r + 1e-9) continue;
				let i = (a - n) / (r - n);
				this.ax.inverse && (i = 1 - i);
				let o = Math.round(t.x + i * t.w) + .5;
				e.moveTo(o, t.y), e.lineTo(o, t.y + t.h);
			}
			e.stroke();
		}
		if (this.ay.opts.grid ?? this.ay.opts.show !== !1) {
			e.setLineDash(this.gridDash(this.ay)), e.beginPath();
			let n = this.ay.type === "category" && this.ay.gap ? this.ay.ticks.map((e) => e - .5).concat(this.ay.ticks.length - .5) : this.yTicks();
			for (let r of n) {
				if (r < i - 1e-9 || r > a + 1e-9) continue;
				let n = (r - i) / (a - i);
				this.ay.inverse && (n = 1 - n);
				let o = Math.round(t.y + t.h - n * t.h) + .5;
				e.moveTo(t.x, o), e.lineTo(t.x + t.w, o);
			}
			e.stroke();
		}
		e.setLineDash([]);
	}
	xTicks() {
		return this.ticksOf(this.ax, this.domX(), this.ax.opts.ticks ?? Math.max(2, Math.round(this.plot.w / 90)));
	}
	yTicks() {
		return this.ticksOf(this.ay, this.domY(), this.ay.opts.ticks ?? Math.max(2, Math.round(this.plot.h / 48)));
	}
	drawAxes() {
		let e = this.ctx, t = this.plot, n = this.theme, r = this.ax.opts, i = this.ay.opts;
		if (e.font = this.font(11), r.show !== !1) {
			let i = r.opposite ? t.y : t.y + t.h;
			r.line !== !1 && (e.strokeStyle = n.axis, e.beginPath(), e.moveTo(t.x, Math.round(i) + .5), e.lineTo(t.x + t.w, Math.round(i) + .5), e.stroke()), e.fillStyle = r.color ?? n.muted;
			let a = this.xTicks(), [o, s] = this.domX(), c = (r.rotate ?? 0) * Math.PI / 180, l = a.map((t) => e.measureText(this.fmtTick(this.ax, t)).width), u = a.length > 1 ? t.w / (s - o) * Math.abs(a[1] - a[0]) : t.w, d = c ? 14 : Math.max(0, ...l) + 8, f = Math.max(1, Math.ceil(d / Math.max(1, u)));
			a.forEach((n, a) => {
				if (a % f) return;
				let u = (n - o) / (s - o);
				this.ax.inverse && (u = 1 - u);
				let d = t.x + u * t.w, p = this.fmtTick(this.ax, n), m = r.opposite ? i - 6 : i + 6;
				c ? (e.save(), e.translate(d, m), e.rotate(-c), e.textAlign = "right", e.textBaseline = "middle", e.fillText(p, 0, 0), e.restore()) : (e.textAlign = "center", e.textBaseline = r.opposite ? "bottom" : "top", e.fillText(p, A(d, t.x + l[a] / 2 - 6, this.width - l[a] / 2 - 2), m));
			}), r.title && (e.fillStyle = n.muted, e.font = this.font(11, 600), e.textAlign = "center", e.textBaseline = r.opposite ? "top" : "bottom", e.fillText(r.title, t.x + t.w / 2, r.opposite ? this.opts.padding ?? 8 : this.height - (this.opts.padding ?? 8) - this.visualRoom().bottom), e.font = this.font(11));
		}
		if (i.show !== !1) {
			let r = i.opposite ? t.x + t.w : t.x;
			i.line && (e.strokeStyle = n.axis, e.beginPath(), e.moveTo(Math.round(r) + .5, t.y), e.lineTo(Math.round(r) + .5, t.y + t.h), e.stroke()), e.fillStyle = i.color ?? n.muted, e.textAlign = i.opposite ? "left" : "right", e.textBaseline = "middle";
			let [a, o] = this.domY(), s = this.yTicks(), c = s.length > 1 ? t.h / (o - a) * Math.abs(s[1] - s[0]) : t.h, l = Math.max(1, Math.ceil(13 / Math.max(1, c)));
			if (s.forEach((n, s) => {
				if (s % l) return;
				let c = (n - a) / (o - a);
				this.ay.inverse && (c = 1 - c), e.fillText(this.fmtTick(this.ay, n), i.opposite ? r + 6 : r - 6, t.y + t.h - c * t.h);
			}), i.title) {
				e.save(), e.fillStyle = n.muted, e.font = this.font(11, 600);
				let r = (this.opts.padding ?? 8) + this.visualRoom().left;
				e.translate(i.opposite ? this.width - r - this.visualRoom().right : r + 7, t.y + t.h / 2), e.rotate(-Math.PI / 2), e.textAlign = "center", e.textBaseline = "middle", e.fillText(i.title, 0, 0), e.restore();
			}
		}
	}
	drawPolarGrid() {
		let e = this.polarCfg, t = this.ctx, n = this.theme, { cx: r, cy: i, R: a } = this.polarGeom(), [o, s] = this.domY(), [c, l] = this.domX();
		t.strokeStyle = n.grid, t.lineWidth = 1;
		let u = this.ay.type === "category" ? this.ay.ticks : this.yTicks();
		t.setLineDash(this.gridDash(this.ay));
		for (let n of u) {
			let c = (n - o) / (s - o), l = a * (e.inner + (1 - e.inner) * (this.ay.inverse ? 1 - c : c));
			t.beginPath(), t.arc(r, i, Math.max(0, l), 0, M), t.stroke();
		}
		t.setLineDash([]), t.strokeStyle = n.axis, t.beginPath(), t.arc(r, i, a, 0, M), t.stroke(), t.font = this.font(11), t.fillStyle = this.ax.opts.color ?? n.muted, t.textAlign = "center", t.textBaseline = "middle";
		let d = this.ax.type === "category" ? this.ax.ticks : this.xTicks().filter((e) => e < l - 1e-9 || c + M > l), f = Math.max(1, Math.ceil(d.length / Math.max(4, M * a / 34)));
		if (d.forEach((o, s) => {
			let u = (o - c) / (l - c);
			this.ax.inverse && (u = 1 - u);
			let d = e.start + (e.cw ? -1 : 1) * u * M, p = Math.cos(d), m = Math.sin(d);
			t.strokeStyle = n.grid, t.beginPath(), t.moveTo(r + p * a * e.inner, i - m * a * e.inner), t.lineTo(r + p * a, i - m * a), t.stroke(), this.ax.opts.show !== !1 && s % f === 0 && t.fillText(this.fmtTick(this.ax, o), r + p * (a + 13), i - m * (a + 11));
		}), this.ay.opts.show !== !1) {
			t.fillStyle = this.ay.opts.color ?? n.muted, t.textAlign = "left", t.font = this.font(10);
			let c = e.start;
			for (let n of u) {
				let l = (n - o) / (s - o), u = a * (e.inner + (1 - e.inner) * (this.ay.inverse ? 1 - l : l));
				t.fillText(this.fmtTick(this.ay, n), r + Math.cos(c) * u + 4, i - Math.sin(c) * u);
			}
		}
	}
	drawHover() {
		let e = this.hover;
		if (!e || !Number.isFinite(e.to.x)) return;
		let t = this.ctx, n = e.to, r = this.opts.hoverScale ?? 1.35, i = e.y0 !== void 0;
		t.beginPath(), x(t, n.sym, n.x, n.y, i ? n.w : n.w * r, i ? n.h : n.h * r), t.globalAlpha = 1, t.fillStyle = N(n.c, 1), t.fill(), t.lineWidth = 2, t.strokeStyle = this.theme.background === "transparent" ? "#fff" : this.theme.background, t.stroke();
	}
	info(e) {
		return {
			series: e.s.src,
			seriesIndex: e.s.index,
			dataIndex: e.i,
			values: e.vals,
			x: e.vals[0],
			y: e.vals[1],
			name: e.name,
			color: e.color,
			size: e.size,
			data: e.data
		};
	}
	buildGrid() {
		let e = /* @__PURE__ */ new Map();
		for (let t of this.items) {
			if (!Number.isFinite(t.to.x) || this.hidden(t) || !t.inRange) continue;
			let n = Math.floor(t.to.x / 24) * 1e5 + Math.floor(t.to.y / 24), r = e.get(n);
			r || e.set(n, r = []), r.push(t);
		}
		return e;
	}
	hitTest(e, t) {
		let n = null, r = Infinity, i = (i) => {
			let a = i.to;
			if (i.y0 !== void 0) {
				Math.abs(e - a.x) <= a.w / 2 && Math.abs(t - a.y) <= a.h / 2 + 1 && (n = i, r = 0);
				return;
			}
			let o = Math.hypot(e - a.x, t - a.y), s = Math.max(a.w, a.h) / 2 + 3;
			o <= Math.max(s, 6) && o - s < r && (r = o - s, n = i);
		};
		if (this.items.length > 1500) {
			this.grid ??= this.buildGrid();
			let n = Math.floor(e / 24), r = Math.floor(t / 24);
			for (let e = -1; e <= 1; e++) for (let t = -1; t <= 1; t++) this.grid.get((n + e) * 1e5 + r + t)?.forEach(i);
		} else for (let e = this.items.length - 1; e >= 0; e--) {
			let t = this.items[e];
			Number.isFinite(t.to.x) && !this.hidden(t) && t.inRange && (this.highlighted && t.s.key !== this.highlighted || i(t));
		}
		return n;
	}
	dimName(e) {
		let t = this.opts.dimensions;
		return t?.[e] ? t[e] : e === 0 ? this.ax.opts.title ?? "x" : e === 1 ? this.ay.opts.title ?? "y" : `#${e}`;
	}
	showTooltip(e, t, n) {
		let r = this.opts.tooltip ?? {};
		if (r.show === !1) return;
		let i = this.info(e), a;
		if (r.formatter) a = r.formatter(i);
		else {
			let t = this.models.length > 1 || !e.name ? `<div class="sc-tooltip__head"><i class="sc-tooltip__dot" style="background:${e.color}"></i>${O(e.s.src.name)}</div>` : "", n = e.name ? `<div class="sc-tooltip__name">${t ? "" : `<i class="sc-tooltip__dot" style="background:${e.color}"></i>`}${O(e.name)}</div>` : "", r = this.opts.dimensions ? Math.min(e.vals.length, this.opts.dimensions.length) : Math.min(e.vals.length, 2), i = e.vals.slice(0, Math.max(r, e.y0 === void 0 ? r : 2)).map((e, t) => `<div class="sc-tooltip__row"><span>${O(this.dimName(t))}</span><b>${O(this.fmtVal(e, t))}</b></div>`).join("");
			a = t + n + i;
		}
		if (!a) return this.hideTooltip();
		let o = this.tooltipEl;
		o.innerHTML = a, o.classList.add("is-visible");
		let s = o.offsetWidth, c = o.offsetHeight, l = t + 14, u = n - c - 10;
		l + s > this.width - 4 && (l = t - s - 14), u < 4 && (u = n + 16), o.style.transform = `translate(${Math.max(4, l)}px, ${Math.max(4, Math.min(u, this.height - c - 4))}px)`;
	}
	hideTooltip() {
		this.tooltipEl.classList.remove("is-visible");
	}
	zoomable(e) {
		let t = this.opts.zoom;
		return !t || this.polarCfg || (e === "x" ? this.ax : this.ay).type === "category" ? !1 : t === !0 || t === e;
	}
	afterZoom() {
		this.layout(), this.draw();
		let [e, t] = this.domX(), [n, r] = this.domY();
		this.emit("zoom", {
			x: [this.U(this.ax, e), this.U(this.ax, t)],
			y: [this.U(this.ay, n), this.U(this.ay, r)]
		});
	}
	bind() {
		let e = this.canvas, t = (t) => {
			let n = e.getBoundingClientRect();
			return {
				x: t.clientX - n.left,
				y: t.clientY - n.top
			};
		};
		e.addEventListener("pointermove", (n) => {
			let { x: r, y: i } = t(n);
			if (this.drag) {
				let e = this.drag;
				if (e.mode === "brush") {
					this.brushRect = [
						e.x,
						e.y,
						r,
						i
					], this.draw();
					return;
				}
				let t = this.plot;
				if (e.vx && this.zoomable("x")) {
					let n = (r - e.x) / t.w * (e.vx[1] - e.vx[0]) * (this.ax.inverse ? -1 : 1);
					this.viewX = [e.vx[0] - n, e.vx[1] - n];
				}
				if (e.vy && this.zoomable("y")) {
					let n = (i - e.y) / t.h * (e.vy[1] - e.vy[0]) * (this.ay.inverse ? -1 : 1);
					this.viewY = [e.vy[0] + n, e.vy[1] + n];
				}
				this.afterZoom();
				return;
			}
			if (this.animating(performance.now())) return;
			let a = this.hitTest(r, i);
			a !== this.hover && (this.hover = a, e.style.cursor = a ? "pointer" : this.opts.brush ? "crosshair" : this.opts.zoom ? "grab" : "", this.draw(), this.emit("hover", a ? this.info(a) : null)), a ? this.showTooltip(a, r, i) : this.hideTooltip();
		}), e.addEventListener("pointerleave", () => {
			this.drag || (this.hover && (this.hover = null, this.draw(), this.emit("hover", null)), this.hideTooltip());
		}), e.addEventListener("pointerdown", (n) => {
			let { x: r, y: i } = t(n), a = this.plot;
			if (!(this.polarCfg || r < a.x || r > a.x + a.w || i < a.y || i > a.y + a.h)) {
				if (this.opts.brush) this.drag = {
					x: r,
					y: i,
					vx: null,
					vy: null,
					mode: "brush"
				};
				else if (this.opts.zoom) this.drag = {
					x: r,
					y: i,
					vx: [...this.domX()],
					vy: [...this.domY()],
					mode: "pan"
				};
				else return;
				e.setPointerCapture(n.pointerId), this.hideTooltip();
			}
		});
		let n = (e) => {
			let n = this.drag;
			if (!n || (this.drag = null, n.mode !== "brush")) return;
			let { x: r, y: i } = t(e);
			if (this.brushRect = null, Math.abs(r - n.x) < 4 && Math.abs(i - n.y) < 4) {
				!this.hitTest(r, i) && this.selection && (this.selection = null, this.emit("brush", [])), this.draw();
				return;
			}
			let [a, o] = [Math.min(r, n.x), Math.max(r, n.x)], [s, c] = [Math.min(i, n.y), Math.max(i, n.y)], l = this.items.filter((e) => e.to.x >= a && e.to.x <= o && e.to.y >= s && e.to.y <= c && e.inRange);
			this.selection = new Set(l), this.draw(), this.emit("brush", l.map((e) => this.info(e)));
		};
		e.addEventListener("pointerup", n), e.addEventListener("pointercancel", n), e.addEventListener("click", (e) => {
			let { x: n, y: r } = t(e), i = this.hitTest(n, r);
			i && this.emit("click", this.info(i));
		}), e.addEventListener("wheel", (e) => {
			if (!this.opts.zoom || this.polarCfg) return;
			let { x: n, y: r } = t(e), i = this.plot;
			if (n < i.x || n > i.x + i.w || r < i.y || r > i.y + i.h) return;
			e.preventDefault();
			let a = Math.exp(e.deltaY * .0015);
			if (this.zoomable("x")) {
				let [e, t] = this.domX(), r = (n - i.x) / i.w;
				this.ax.inverse && (r = 1 - r);
				let o = e + r * (t - e);
				this.viewX = [o - (o - e) * a, o + (t - o) * a];
			}
			if (this.zoomable("y")) {
				let [e, t] = this.domY(), n = (i.y + i.h - r) / i.h;
				this.ay.inverse && (n = 1 - n);
				let o = e + n * (t - e);
				this.viewY = [o - (o - e) * a, o + (t - o) * a];
			}
			this.hover = null, this.hideTooltip(), this.afterZoom();
		}, { passive: !1 }), e.addEventListener("dblclick", () => {
			this.opts.zoom && (this.viewX || this.viewY) && this.resetZoom();
		});
	}
	renderLegend() {
		let e = this.opts.legend ?? {}, t = this.models.filter((e) => e.src.legend !== !1), n = e.show ?? t.length > 1;
		if (this.legendEl.style.display = n ? "" : "none", !n) {
			this.legendEl.innerHTML = "";
			return;
		}
		let r = e.interactive ?? !0;
		this.legendEl.innerHTML = t.map((e) => `<li class="sc-legend__item${r ? " is-interactive" : ""}${e.hidden ? " is-hidden" : ""}${this.highlighted === e.key ? " is-hover" : ""}" data-key="${O(e.key)}"><i class="sc-legend__marker" style="--c:${e.color}"></i><span>${O(e.src.name)}</span></li>`).join(""), r && this.legendEl.querySelectorAll(".sc-legend__item").forEach((e) => {
			let t = e.dataset.key;
			e.onclick = () => this.toggle(t), e.onmouseenter = () => {
				this.hiddenKeys.has(t) || (this.highlighted = t, this.draw());
			}, e.onmouseleave = () => {
				this.highlighted = null, this.draw();
			};
		});
	}
};
function I(e, t = {}) {
	return new F(e, t);
}
//#endregion
//#region src/scatter/matrix.ts
var L = class {
	constructor(e, t) {
		this.charts = [], this.legendEl = null, this.handlers = /* @__PURE__ */ new Set(), this.hidden = /* @__PURE__ */ new Set(), this.opts = t, this.root = e, e.classList.add("sc-matrix"), this.grid = document.createElement("div"), this.grid.className = "sc-matrix__grid", e.append(this.grid), this.build();
	}
	columns() {
		let e = this.opts;
		return e.columns ?? e.dimensions.map((e, t) => t).filter((t) => t !== e.groupBy);
	}
	groups() {
		let e = this.opts.groupBy;
		return e === void 0 ? [""] : [...new Set(this.opts.rows.map((t) => String(t[e])))];
	}
	build() {
		let e = this.opts, t = this.columns(), n = t.length, r = this.groups(), i = e.colors ?? E, a = e.theme !== "light" && (typeof e.theme != "object" || !e.theme.background?.startsWith("#f"));
		this.grid.style.gap = `${e.gap ?? 6}px`, this.grid.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`, this.grid.style.gridTemplateRows = `repeat(${n}, minmax(0, 1fr))`, e.groupBy !== void 0 && e.legend !== !1 && (this.legendEl = document.createElement("div"), this.legendEl.className = "sc-matrix__legend", this.legendEl.innerHTML = r.map((e, t) => `<button type="button" data-g="${e}"><i style="background:${i[t % i.length]}"></i>${e}</button>`).join(""), this.legendEl.addEventListener("click", (e) => {
			let t = e.target.closest("button");
			if (!t) return;
			let n = t.dataset.g, r = !this.hidden.has(n);
			r ? this.hidden.add(n) : this.hidden.delete(n), t.classList.toggle("is-off", r);
			for (let e of this.charts) e.toggle(n, r);
		}), this.root.prepend(this.legendEl));
		for (let o = 0; o < n; o++) for (let s = 0; s < n; s++) {
			let c = document.createElement("div");
			c.className = "sc-matrix__cell", this.grid.append(c);
			let l = t[s], u = t[o];
			if (o === s) {
				c.classList.add("sc-matrix__name"), c.style.color = a ? "#d1d4dc" : "#131722", c.textContent = e.dimensions[l];
				continue;
			}
			let d = new F(c, {
				series: r.map((t, n) => ({
					id: t || "dados",
					name: t || "dados",
					color: i[n % i.length],
					symbolSize: e.symbolSize ?? 5,
					data: e.rows.map((e, t) => ({
						row: e,
						i: t
					})).filter(({ row: n }) => e.groupBy === void 0 || String(n[e.groupBy]) === t).map(({ row: e, i: t }) => ({
						x: e[l],
						y: e[u],
						id: t,
						data: t
					}))
				})),
				theme: e.theme,
				background: e.background,
				padding: 2,
				legend: { show: !1 },
				brush: e.brush ?? !0,
				dimensions: [e.dimensions[l], e.dimensions[u]],
				valueFormatter: e.format ? (t, n) => e.format(t, n === 0 ? l : u) : void 0,
				xAxis: {
					show: o === n - 1,
					ticks: 3,
					line: !1,
					grid: !0
				},
				yAxis: {
					show: s === 0,
					ticks: 3,
					grid: !0
				},
				animation: { duration: 400 }
			});
			d.on("brush", (e) => {
				let t = e.map((e) => e.data);
				this.applySelection(e.length ? new Set(t) : null, d), this.handlers.forEach((e) => e(t));
			}), this.charts.push(d);
		}
	}
	applySelection(e, t) {
		for (let n of this.charts) n !== t && n.select(e ? (t) => e.has(t.data) : null);
	}
	select(e) {
		this.applySelection(e ? new Set(e) : null);
	}
	on(e, t) {
		return this.handlers.add(t), () => this.handlers.delete(t);
	}
	destroy() {
		this.charts.forEach((e) => e.destroy()), this.charts.length = 0, this.grid.remove(), this.legendEl?.remove(), this.root.classList.remove("sc-matrix");
	}
};
function R(e, t) {
	return new L(e, t);
}
//#endregion
export { D as a, T as c, d, c as f, F as i, p as l, R as n, I as o, E as r, w as s, L as t, f as u };

//# sourceMappingURL=scatter.js.map