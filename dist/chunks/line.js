import { t as e } from "./curve.js";
import { n as t, r as n, t as r } from "./format.js";
//#region src/line/scale.ts
var i = [
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
], a = (e) => (e < 10 ? "0" : "") + e, o = [
	1,
	5,
	15,
	30,
	60,
	300,
	900,
	1800,
	3600,
	7200,
	10800,
	21600,
	43200,
	86400,
	172800,
	604800
], s = [
	1,
	2,
	3,
	6
];
function c(e, t, r) {
	let a = t - e;
	if (!(a > 0)) return [{
		value: e,
		label: l(e, 60)
	}];
	let c = a / Math.max(1, r), u = o.find((e) => e >= c), d = [];
	if (u) {
		let n = /* @__PURE__ */ new Date(e * 1e3), r;
		if (u >= 86400) for (r = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime() / 1e3; r < e;) r += u;
		else {
			let t = -n.getTimezoneOffset() * 60;
			r = Math.ceil((e + t) / u) * u - t;
		}
		let a = -1;
		for (; r <= t && d.length < 200; r += u) {
			let e = /* @__PURE__ */ new Date(r * 1e3), t = e.getDate(), n = a !== -1 && t !== a;
			a = t;
			let o = e.getHours() === 0 && e.getMinutes() === 0 && e.getSeconds() === 0;
			d.push({
				value: r,
				label: u >= 86400 || o && u >= 3600 ? `${t} ${i[e.getMonth()]}` : l(r, u),
				major: n || o
			});
		}
		return d;
	}
	let f = a / 2630016, p = s.find((e) => f / e <= r), m = /* @__PURE__ */ new Date(e * 1e3);
	if (p) {
		let n = m.getFullYear(), r = Math.ceil((m.getMonth() + +(m.getDate() > 1)) / p) * p;
		for (; d.length < 200;) {
			let a = new Date(n, r, 1).getTime() / 1e3;
			if (a > t) break;
			let o = /* @__PURE__ */ new Date(a * 1e3);
			a >= e && d.push({
				value: a,
				label: o.getMonth() === 0 ? String(o.getFullYear()) : `${i[o.getMonth()]} ${String(o.getFullYear()).slice(2)}`,
				major: o.getMonth() === 0
			}), r += p, r >= 12 && (n += Math.floor(r / 12), r %= 12);
		}
		return d;
	}
	let h = f / 12, g = n(h / r);
	for (let n = Math.ceil(m.getFullYear() / g) * g; d.length < 200; n += g) {
		let r = new Date(n, 0, 1).getTime() / 1e3;
		if (r > t) break;
		r >= e && d.push({
			value: r,
			label: String(n),
			major: !0
		});
	}
	return d;
}
function l(e, t) {
	let n = /* @__PURE__ */ new Date(e * 1e3);
	return t < 60 ? `${a(n.getHours())}:${a(n.getMinutes())}:${a(n.getSeconds())}` : t < 86400 ? `${a(n.getHours())}:${a(n.getMinutes())}` : `${n.getDate()} ${i[n.getMonth()]} ${n.getFullYear()}`;
}
function u(e, t) {
	let n = /* @__PURE__ */ new Date(e * 1e3), r = `${n.getDate()} ${i[n.getMonth()]} ${n.getFullYear()}`;
	return t >= 86400 ? r : t >= 60 ? `${r}, ${a(n.getHours())}:${a(n.getMinutes())}` : `${r}, ${a(n.getHours())}:${a(n.getMinutes())}:${a(n.getSeconds())}`;
}
function d(e, t) {
	if (!e.length) return -1;
	let n = 0, r = e.length - 1;
	for (; r - n > 1;) {
		let i = n + r >> 1;
		e[i] <= t ? n = i : r = i;
	}
	return Math.abs(e[n] - t) <= Math.abs(e[r] - t) ? n : r;
}
function f(e) {
	if (e.some((e) => typeof e == "string")) return "category";
	let t = e;
	return t.length && t.every((e) => e > 1e9) ? "time" : "number";
}
//#endregion
//#region src/line/line.ts
var p = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", m = [
	"#2962ff",
	"#ff9800",
	"#089981",
	"#f23645",
	"#9c27b0",
	"#00bcd4",
	"#e91e63",
	"#4caf50",
	"#ffc107",
	"#3f51b5"
], h = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	grid: "rgba(42, 46, 57, 0.7)",
	axis: "#2a2e39",
	crosshair: "#9598a1",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: p
}, g = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	grid: "rgba(42, 46, 57, 0.08)",
	axis: "#e0e3eb",
	crosshair: "#9598a1",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: p
};
function _(e) {
	if (!e) return null;
	let t = typeof e == "object" ? e : {};
	return {
		opacity: Array.isArray(t.gradient) ? 1 : .28,
		gradient: !0,
		...t
	};
}
function v(e) {
	return e ? {
		size: 4,
		shape: "circle",
		hollow: !1,
		...typeof e == "object" ? e : {}
	} : null;
}
function y(e, t) {
	let n = e.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i);
	if (n) return `rgba(${parseInt(n[1], 16)},${parseInt(n[2], 16)},${parseInt(n[3], 16)},${t})`;
	let r = e.match(/rgba?\(([^)]+)\)/);
	if (r) {
		let [e, n, i] = r[1].split(",").map((e) => e.trim());
		return `rgba(${e},${n},${i},${t})`;
	}
	return e;
}
var b = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), x = (e) => 1 - (1 - e) ** 3, S = (e) => e > 1e11 ? e / 1e3 : e;
function C(e) {
	return e.sparkline ? {
		padding: 2,
		...e,
		legend: {
			show: !1,
			...e.legend ?? {}
		},
		xAxis: {
			show: !1,
			grid: !1,
			...e.xAxis ?? {}
		},
		yAxis: {
			show: !1,
			grid: !1,
			...e.yAxis ?? {}
		},
		crosshair: {
			show: !1,
			...e.crosshair ?? {}
		}
	} : e;
}
var w = class {
	constructor(e, t = {}) {
		this.seriesList = [], this.hiddenKeys = /* @__PURE__ */ new Set(), this.model = [], this.xType = "number", this.categories = [], this.dataX = [0, 1], this.view = null, this.yLeft = {
			min: 0,
			max: 1,
			ticks: []
		}, this.yRight = null, this.plot = {
			x: 0,
			y: 0,
			w: 1,
			h: 1
		}, this.width = 0, this.height = 0, this.dpr = 1, this.hover = null, this.highlighted = null, this.reveal = 1, this.morph = 1, this.animStart = 0, this.animKind = null, this.fromTop = /* @__PURE__ */ new Map(), this.fromLeft = null, this.fromRight = null, this.raf = 0, this.handlers = /* @__PURE__ */ new Map(), this.drag = null, this.sliderRect = null, this.sliderDrag = null, this.breaks = [], this.lensX = null, this.pointDrag = null, this.opts = C({ ...t }), this.root = e, e.classList.add("lc-root"), this.plotEl = document.createElement("div"), this.plotEl.className = "lc-plot", this.canvas = document.createElement("canvas"), this.canvas.className = "lc-canvas", this.canvas.setAttribute("role", "img"), this.ctx = this.canvas.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "lc-tooltip", this.legendEl = document.createElement("ul"), this.legendEl.className = "lc-legend", this.plotEl.append(this.canvas, this.tooltipEl), e.append(this.plotEl, this.legendEl), this.seriesList = (t.series ?? []).map((e) => ({ ...e }));
		for (let e of this.seriesList) e.hidden && this.hiddenKeys.add(this.keyOf(e));
		this.applyLook(), this.bind(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(this.plotEl), this.resize(), this.rebuild("reveal"), this.applyInitialZoom();
	}
	applyInitialZoom() {
		let e = this.opts.zoom;
		if (typeof e != "object" || e.start === void 0 && e.end === void 0) return;
		let [t, n] = this.dataX, r = t + (n - t) * Math.max(0, e.start ?? 0) / 100, i = t + (n - t) * Math.min(100, e.end ?? 100) / 100;
		i - r >= n - t - 1e-9 || i <= r || (this.view = [r, i], this.layout(), this.draw());
	}
	get series() {
		return this.seriesList.map((e) => ({ ...e }));
	}
	setSeries(e) {
		let t = e.length === this.seriesList.length && e.every((e, t) => this.keyOf(e) === this.keyOf(this.seriesList[t]) && e.data.length === this.seriesList[t].data.length);
		this.seriesList = e.map((e) => ({ ...e })), this.rebuild(t ? "morph" : "reveal");
	}
	setOptions(e, t = !0) {
		e.series && (this.seriesList = e.series.map((e) => ({ ...e }))), this.opts = C({
			...this.opts,
			...e
		}), this.applyLook(), this.rebuild(t ? "morph" : null);
	}
	updateSeries(e, t) {
		let n = this.seriesList.findIndex((t) => this.keyOf(t) === e);
		if (n < 0) return;
		let r = !t.data || t.data.length === this.seriesList[n].data.length;
		this.seriesList[n] = {
			...this.seriesList[n],
			...t
		}, this.rebuild(r ? "morph" : "reveal");
	}
	addSeries(e) {
		this.seriesList.push({ ...e }), this.rebuild("morph");
	}
	removeSeries(e) {
		this.seriesList = this.seriesList.filter((t) => this.keyOf(t) !== e), this.hiddenKeys.delete(e), this.rebuild("morph");
	}
	appendPoint(e, t) {
		let n = this.seriesList.find((t) => this.keyOf(t) === e);
		if (!n) return;
		let r = [...n.data];
		if (typeof t == "number") r.push(t);
		else {
			let e = r[r.length - 1];
			e && typeof e == "object" && e.x === t.x ? r[r.length - 1] = t : r.push(t);
		}
		let i = this.opts.maxPoints;
		n.data = i && r.length > i ? r.slice(r.length - i) : r;
		let a = !this.view || this.view[1] >= this.dataX[1] - 1e-9, o = this.view ? this.view[1] - this.view[0] : 0;
		this.rebuild(null), a && this.view && (this.view = [this.dataX[1] - o, this.dataX[1]]), this.draw();
	}
	toggle(e, t) {
		let n = t ?? !this.hiddenKeys.has(e);
		n ? this.hiddenKeys.add(e) : this.hiddenKeys.delete(e), this.rebuild("morph"), this.emit("toggle", {
			id: e,
			hidden: n
		});
	}
	highlight(e) {
		this.highlighted = e, this.legendEl.querySelectorAll(".lc-legend__item").forEach((t) => t.classList.toggle("is-hover", t.dataset.id === e)), this.draw();
	}
	setZoom(e, t) {
		let n = Math.min(this.xValue(e), this.xValue(t)), r = Math.max(this.xValue(e), this.xValue(t));
		this.view && Math.abs(this.view[0] - n) < 1e-9 && Math.abs(this.view[1] - r) < 1e-9 || (this.view = [n, r], this.rebuild(null), this.emit("zoom", {
			from: this.view[0],
			to: this.view[1]
		}));
	}
	resetZoom() {
		this.view && (this.view = null, this.rebuild("morph"), this.emit("zoom", null));
	}
	showHover(e, t = !0) {
		if (e === null) {
			this.hover = null, this.tooltipEl.classList.remove("is-visible"), this.draw();
			return;
		}
		let n = this.xValue(e), r = this.model.filter((e) => !e.hidden && e.xs.length), i = r.length ? this.sharedAt(n, r) : null, a = this.plot.y + this.plot.h / 2;
		this.hover = i ? {
			...i,
			my: a
		} : null, this.draw(), t ? this.showTooltip(this.xToPx(n), a) : this.tooltipEl.classList.remove("is-visible");
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
		cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("lc-root", "lc-legend-top", "lc-legend-bottom", "lc-legend-left", "lc-legend-right"), this.plotEl.remove(), this.legendEl.remove();
	}
	keyOf(e) {
		return e.id ?? e.name;
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t));
	}
	applyLook() {
		let e = this.opts, t = e.theme === "light" ? g : h;
		this.theme = {
			...t,
			...typeof e.theme == "object" ? e.theme : {}
		}, e.background !== void 0 && (this.theme.background = e.background);
		let n = {
			position: "top",
			marker: "line",
			align: "start",
			fontSize: 12,
			show: !0,
			...e.legend ?? {}
		};
		this.root.classList.remove("lc-legend-top", "lc-legend-bottom", "lc-legend-left", "lc-legend-right"), this.root.classList.add(`lc-legend-${n.position}`), this.legendEl.style.display = n.show ? "" : "none", this.legendEl.className = `lc-legend lc-legend--${n.marker} lc-legend--align-${n.align}`, this.legendEl.style.fontSize = `${n.fontSize}px`;
		let r = this.theme, i = {
			"--lc-bg": r.background,
			"--lc-text": r.text,
			"--lc-muted": r.muted,
			"--lc-tt-bg": r.tooltipBg,
			"--lc-tt-text": r.tooltipText,
			"--lc-tt-border": r.tooltipBorder,
			"--lc-font": r.font
		};
		for (let [e, t] of Object.entries(i)) this.root.style.setProperty(e, t);
	}
	xValue(e) {
		if (typeof e == "string") {
			let t = this.categories.indexOf(e);
			return t < 0 ? 0 : t;
		}
		return this.xType === "time" ? S(e) : e;
	}
	normalize() {
		let e = this.opts, t = e.colors?.length ? e.colors : m, n = [];
		for (let e of this.seriesList) for (let t of e.data) typeof t == "object" && t && n.push(t.x);
		let r = n.length === 0;
		if (this.xType = e.xType ?? (r ? e.categories ? "category" : "number" : f(n)), this.xType === "category") {
			let t = [...e.categories ?? []];
			for (let e of n) typeof e == "string" && !t.includes(e) && t.push(e);
			if (!t.length) {
				let e = Math.max(0, ...this.seriesList.map((e) => e.data.length));
				for (let n = 0; n < e; n++) t.push(String(n + 1));
			}
			this.categories = t;
		} else this.categories = [];
		return this.seriesList.map((n, r) => {
			let i = (e) => e == null || !Number.isFinite(e) ? null : e, a = n.data.map((e, t) => {
				let r = i(n.band?.lower[t]), a = i(n.band?.upper[t]);
				return e === null || typeof e == "number" ? {
					x: t,
					y: e,
					lo: r,
					hi: a,
					i: t
				} : {
					x: typeof e.x == "string" ? Math.max(0, this.categories.indexOf(e.x)) : this.xType === "time" ? S(e.x) : e.x,
					y: e.y === null || !Number.isFinite(e.y) ? null : e.y,
					lo: r,
					hi: a,
					i: t
				};
			}), o = n.sortByX !== !1;
			o && a.sort((e, t) => e.x - t.x);
			let s = this.keyOf(n);
			return {
				src: n,
				key: s,
				index: r,
				color: n.color ?? t[r % t.length],
				xs: a.map((e) => e.x),
				ys: a.map((e) => e.y),
				top: a.map((e) => e.y),
				base: null,
				sorted: o,
				srcIdx: a.map((e) => e.i),
				bandLo: n.band ? a.map((e) => e.lo) : null,
				bandHi: n.band ? a.map((e) => e.hi) : null,
				axis: n.axis ?? "left",
				curve: n.curve ?? e.curve ?? "linear",
				area: _(n.area ?? e.area),
				points: v(n.points ?? e.points),
				width: n.width ?? 2,
				dash: n.dash ?? [],
				labels: n.labels ?? !1,
				hidden: this.hiddenKeys.has(s)
			};
		});
	}
	stack(e) {
		let t = this.opts.stacked;
		if (t) for (let n of ["left", "right"]) {
			let r = e.filter((e) => !e.hidden && e.axis === n), i = /* @__PURE__ */ new Map();
			if (t === "percent") for (let e of r) e.xs.forEach((t, n) => i.set(t, (i.get(t) ?? 0) + Math.abs(e.ys[n] ?? 0)));
			let a = /* @__PURE__ */ new Map();
			for (let e of r) e.base = e.xs.map((e) => a.get(e) ?? 0), e.top = e.xs.map((n, r) => {
				let o = e.ys[r], s = o ?? 0;
				t === "percent" && (s = i.get(n) ? s / i.get(n) * 100 : 0);
				let c = (a.get(n) ?? 0) + s;
				return a.set(n, c), o === null && !this.opts.spanGaps ? null : c;
			}), !e.area && (e.src.area ?? this.opts.area) !== !1 && (e.area = _(!0));
		}
	}
	domain(e, n, r) {
		let i = this.model.filter((t) => !t.hidden && t.axis === e);
		if (!i.length && e === "right") return null;
		let a = Infinity, o = -Infinity;
		for (let e of i) for (let t = 0; t < e.xs.length; t++) {
			if (e.xs[t] < r[0] || e.xs[t] > r[1]) continue;
			let n = e.top[t];
			if (n !== null && (a = Math.min(a, n, e.base ? e.base[t] : n), o = Math.max(o, n), e.bandLo)) {
				let n = e.bandLo[t], r = e.bandHi[t];
				n !== null && (a = Math.min(a, n)), r !== null && (o = Math.max(o, r));
			}
		}
		let s = this.opts.annotations ?? {};
		for (let t of s.y ?? []) (t.axis ?? "left") === e && (a = Math.min(a, t.value), o = Math.max(o, t.value));
		for (let t of s.bands ?? []) (t.axis ?? "left") === e && (a = Math.min(a, t.from, t.to), o = Math.max(o, t.from, t.to));
		Number.isFinite(a) || (a = 0, o = 1);
		let c = n.log === !0 ? 10 : typeof n.log == "number" && n.log > 1 ? n.log : 0;
		if (c) {
			let e = i.flatMap((e) => e.top.filter((e) => e !== null && e > 0)), t = n.min ?? (e.length ? Math.min(...e) : 1), r = n.max ?? (e.length ? Math.max(...e) : c), a = (e) => Math.log(e) / Math.log(c), o = Math.floor(a(t) + 1e-9), s = Math.ceil(a(r) - 1e-9);
			s <= o && (s = o + 1);
			let l = Math.max(1, Math.ceil((s - o) / Math.max(2, Math.round(this.plot.h / 40)))), u = [];
			for (let e = o; e <= s; e += l) u.push(+(c ** +e).toPrecision(12));
			return n.min !== void 0 && (o = a(n.min)), n.max !== void 0 && (s = a(n.max)), {
				min: c ** +o,
				max: c ** +s,
				ticks: u
			};
		}
		(n.beginAtZero || this.opts.stacked) && (a = Math.min(a, 0), o = Math.max(o, 0)), this.opts.stacked === "percent" && (a = 0, o = 100), n.min !== void 0 && (a = n.min), n.max !== void 0 && (o = n.max);
		let l = n.ticks ?? Math.max(2, Math.round(this.plot.h / 55)), u = t(a, o, l), d = n.min === void 0 ? u.min : n.min, f = n.max === void 0 ? u.max : n.max;
		return {
			min: d,
			max: f,
			ticks: u.ticks.filter((e) => e >= d - 1e-9 && e <= f + 1e-9)
		};
	}
	rebuild(e) {
		this.fromTop = new Map(this.model.map((e) => [e.key, e.top.slice()])), this.fromLeft = this.yLeft, this.fromRight = this.yRight, this.model = this.normalize(), this.stack(this.model);
		let t = this.model.filter((e) => !e.hidden), n = (t.length ? t : this.model).flatMap((e) => e.xs);
		this.dataX = this.xType === "category" ? [-.5, Math.max(0, this.categories.length - 1) + .5] : n.length ? [Math.min(...n), Math.max(...n)] : [0, 1];
		let r = this.opts.xAxis;
		if (this.xType !== "category" && r?.min !== void 0 && (this.dataX[0] = r.min), this.xType !== "category" && r?.max !== void 0 && (this.dataX[1] = r.max), this.dataX[0] === this.dataX[1] && (this.dataX = [this.dataX[0] - 1, this.dataX[1] + 1]), this.breaks = (r?.breaks ?? []).map((e) => [this.xValue(e.from), this.xValue(e.to)]).filter(([e, t]) => t > e).sort((e, t) => e[0] - t[0]), this.view) {
			let [e, t] = this.dataX, n = Math.min(this.view[1] - this.view[0], t - e), r = Math.max(e, Math.min(this.view[0], t - n));
			this.view = [r, r + n], n >= t - e - 1e-9 && (this.view = null);
		}
		this.layout(), this.renderLegend(), this.canvas.setAttribute("aria-label", `Gráfico de linhas: ${this.model.map((e) => e.src.name).join(", ")}`);
		let i = this.duration();
		!e || i === 0 ? (this.animKind = null, this.reveal = 1, this.morph = 1, this.draw()) : (this.animKind = e, this.animStart = performance.now(), e === "reveal" ? this.reveal = 0 : this.morph = 0, this.tick());
	}
	duration() {
		let e = this.opts.animation ?? !0;
		return e === !1 ? 0 : typeof e == "object" ? e.duration ?? 800 : 800;
	}
	tick() {
		cancelAnimationFrame(this.raf), this.raf = requestAnimationFrame((e) => {
			let t = Math.min(1, (e - this.animStart) / this.duration()), n = x(t);
			this.animKind === "reveal" ? this.reveal = n : this.morph = n, this.draw(), t < 1 ? this.tick() : this.animKind = null;
		});
	}
	resize() {
		let e = this.plotEl.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height)), this.canvas.width = Math.round(this.width * this.dpr), this.canvas.height = Math.round(this.height * this.dpr), this.canvas.style.width = `${this.width}px`, this.canvas.style.height = `${this.height}px`, this.layout(), this.draw();
	}
	get xView() {
		return this.view ?? this.dataX;
	}
	axisOpts(e) {
		let t = this.opts;
		return e === "x" ? {
			show: !0,
			grid: !0,
			...t.xAxis ?? {}
		} : e === "y" ? {
			show: !0,
			grid: !0,
			...t.yAxis ?? {}
		} : {
			show: !0,
			grid: !1,
			...t.y2Axis ?? {}
		};
	}
	fmtY(e, t) {
		let n = this.axisOpts(t).format;
		if (n) return n(e);
		if (this.opts.stacked === "percent") return `${+e.toFixed(0)}%`;
		let i = t === "y" ? this.yLeft : this.yRight, a = i && i.ticks.length > 1 ? Math.abs(i.ticks[1] - i.ticks[0]) : 0;
		if (!this.logBase(t === "y" ? "left" : "right") && a > 0 && a < 1 && Math.abs(e) < 1e4) {
			let t = 0;
			for (; t < 6 && Math.abs(Math.round(a * 10 ** t) - a * 10 ** t) > 1e-6;) t++;
			return e.toFixed(t);
		}
		return r(e);
	}
	layout() {
		let e = this.ctx, t = this.opts.padding ?? 8, n = this.axisOpts("y"), r = this.axisOpts("y2"), i = this.axisOpts("x");
		this.plot = {
			x: t,
			y: t + 6,
			w: Math.max(1, this.width - t * 2),
			h: Math.max(1, this.height - t * 2 - 30)
		};
		let a = this.xView;
		this.yLeft = this.domain("left", n, a) ?? {
			min: 0,
			max: 1,
			ticks: []
		}, this.yRight = this.domain("right", r, a), e.font = `11px ${this.theme.font}`;
		let o = (t, n) => t ? Math.max(...t.ticks.map((t) => e.measureText(this.fmtY(t, n)).width), 10) + 10 : 0, s = n.show ? o(this.yLeft, "y") + (n.title ? 16 : 0) : 0, c = (this.yRight && r.show ? o(this.yRight, "y2") + (r.title ? 16 : 0) : 0) + this.endLabelRoom(), l = typeof this.opts.zoom == "object" && this.opts.zoom.slider, u = (i.show ? 22 + (i.title ? 16 : 0) : 4) + (l ? 44 : 0), d = this.opts.x2Axis, f = d && d.show !== !1 ? 22 + (d.title ? 16 : 0) : 0, p = (this.model.some((e) => !e.hidden && (e.src.marks?.max || e.src.marks?.min)) ? 40 : this.model.some((e) => e.labels && !e.hidden) ? 18 : 8) + f;
		this.plot = {
			x: t + s,
			y: t + p,
			w: Math.max(10, this.width - t * 2 - s - c - (c ? 0 : 6)),
			h: Math.max(10, this.height - t * 2 - u - p)
		}, this.sliderRect = l ? {
			x: this.plot.x,
			y: this.height - t - 32,
			w: this.plot.w,
			h: 30
		} : null, this.polarCfg && (this.plot = {
			x: t,
			y: t + 4,
			w: Math.max(10, this.width - t * 2),
			h: Math.max(10, this.height - t * 2 - 8)
		}), this.yLeft = this.domain("left", n, a) ?? this.yLeft, this.yRight = this.domain("right", r, a);
	}
	endLabelRoom() {
		let e = this.ctx;
		e.font = `600 12px ${this.theme.font}`;
		let t = 0;
		for (let n of this.model) {
			if (n.hidden || !n.src.endLabel) continue;
			let r = this.lastPoint(n);
			r && (t = Math.max(t, e.measureText(this.endLabelText(n, r.raw)).width + 14));
		}
		return e.font = `11px ${this.theme.font}`, t;
	}
	endLabelText(e, t) {
		let n = e.src.endLabel;
		return typeof n == "object" && n.format ? n.format(e.src.name, t) : e.src.name;
	}
	lastPoint(e) {
		let t = this.xView[1];
		for (let n = e.xs.length - 1; n >= 0; n--) {
			if (e.xs[n] > t + 1e-9) continue;
			let r = e.ys[n];
			if (r !== null && e.top[n] !== null) return {
				i: n,
				raw: r
			};
		}
		return null;
	}
	xToPx(e) {
		let [t, n] = this.xView, r = this.xc(t), i = this.xc(n);
		return this.lens(this.plot.x + (this.xc(e) - r) / (i - r || 1) * this.plot.w);
	}
	pxToX(e) {
		let [t, n] = this.xView, r = this.xc(t), i = this.xc(n);
		return this.xu(r + (this.unlens(e) - this.plot.x) / this.plot.w * (i - r));
	}
	xc(e) {
		let t = e;
		for (let [n, r] of this.breaks) e >= r ? t -= r - n : e > n && (t -= e - n);
		return t;
	}
	xu(e) {
		let t = e;
		for (let [e, n] of this.breaks) if (t >= e) t += n - e;
		else break;
		return t;
	}
	insideBreak(e) {
		return this.breaks.some(([t, n]) => e > t && e < n);
	}
	lensCfg() {
		let e = this.opts.fisheye;
		if (!e || this.lensX === null) return null;
		let t = typeof e == "object" ? e : {};
		return {
			r: t.radius ?? 120,
			k: t.strength ?? 3
		};
	}
	lens(e) {
		let t = this.lensCfg();
		if (!t) return e;
		let n = e - this.lensX, r = Math.abs(n) / t.r;
		return r >= 1 ? e : this.lensX + Math.sign(n) * ((t.k + 1) * r / (t.k * r + 1)) * t.r;
	}
	unlens(e) {
		let t = this.lensCfg();
		if (!t) return e;
		let n = e - this.lensX, r = Math.abs(n) / t.r;
		return r >= 1 ? e : this.lensX + Math.sign(n) * (r / (t.k + 1 - t.k * r)) * t.r;
	}
	pyToY(e, t) {
		let n = this.dom(t), r = this.axisOpts(t === "left" ? "y" : "y2").inverse ? (e - this.plot.y) / this.plot.h : (this.plot.y + this.plot.h - e) / this.plot.h, i = this.logBase(t);
		if (i) {
			let e = Math.log(n.min) / Math.log(i);
			return i ** +(e + r * (Math.log(n.max) / Math.log(i) - e));
		}
		return n.min + r * (n.max - n.min);
	}
	logBase(e) {
		let t = this.axisOpts(e === "left" ? "y" : "y2").log;
		return t === !0 ? 10 : typeof t == "number" && t > 1 ? t : 0;
	}
	toData(e, t, n = "left") {
		return {
			x: this.pxToX(e),
			y: this.pyToY(t, n)
		};
	}
	toPixel(e, t, n = "left") {
		return {
			x: this.xToPx(this.xValue(e)),
			y: this.yToPx(t, n)
		};
	}
	dom(e) {
		let t = e === "left" ? this.yLeft : this.yRight ?? this.yLeft, n = e === "left" ? this.fromLeft : this.fromRight;
		if (this.animKind !== "morph" || !n) return t;
		let r = this.morph;
		return {
			min: n.min + (t.min - n.min) * r,
			max: n.max + (t.max - n.max) * r,
			ticks: t.ticks
		};
	}
	yToPx(e, t) {
		let n = this.dom(t), r = this.logBase(t) ? e > 0 ? (Math.log(e) - Math.log(n.min)) / (Math.log(n.max) - Math.log(n.min) || 1) : -.05 : (e - n.min) / (n.max - n.min || 1);
		return this.axisOpts(t === "left" ? "y" : "y2").inverse ? this.plot.y + r * this.plot.h : this.plot.y + this.plot.h - r * this.plot.h;
	}
	xSpan(e, t) {
		let n = this.xToPx(this.xValue(e)), r = this.xToPx(this.xValue(t));
		return [Math.min(n, r), Math.max(n, r)];
	}
	yAt(e, t) {
		let n = e.top[t];
		if (this.animKind !== "morph" || n === null) return n;
		let r = this.fromTop.get(e.key), i = r && r.length === e.top.length ? r[t] : null;
		return i == null ? n : i + (n - i) * this.morph;
	}
	xTicks() {
		let e = this.axisOpts("x"), [n, i] = this.xView, a = e.ticks ?? Math.max(2, Math.floor(this.plot.w / 90)), o = e.format;
		if (this.xType === "category") {
			let e = Math.max(0, Math.ceil(n)), t = Math.min(this.categories.length - 1, Math.floor(i)), r = Math.max(1, Math.ceil((t - e + 1) / a)), s = [];
			for (let n = e; n <= t; n += r) s.push({
				value: n,
				label: o ? o(n, this.categories[n]) : this.categories[n]
			});
			return s;
		}
		let s = this.breaks.length ? (i - n) / Math.max(1e-9, this.xc(i) - this.xc(n)) : 1;
		return this.xType === "time" ? c(n, i, Math.round(a * s)).filter((e) => !this.insideBreak(e.value)).map((e) => o ? {
			...e,
			label: o(e.value)
		} : e) : t(n, i, Math.round(a * s)).ticks.filter((e) => e >= n && e <= i && !this.insideBreak(e)).map((e) => ({
			value: e,
			label: o ? o(e) : r(e)
		}));
	}
	xLabel(e) {
		let t = this.axisOpts("x").format;
		if (this.xType === "category") return t ? t(e, this.categories[e]) : this.categories[e] ?? String(e);
		if (t) return t(e);
		if (this.xType === "time") {
			let t = this.model.find((e) => !e.hidden && e.xs.length > 1)?.xs ?? [];
			return u(e, t.length > 1 ? (t[t.length - 1] - t[0]) / (t.length - 1) : 86400);
		}
		return r(e);
	}
	draw() {
		let e = this.ctx, t = this.theme, n = this.plot;
		if (e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.clearRect(0, 0, this.width, this.height), t.background !== "transparent" && (e.fillStyle = t.background, e.fillRect(0, 0, this.width, this.height)), this.polarCfg) {
			this.drawPolar(), this.drawGraphic();
			return;
		}
		let r = this.model.filter((e) => !e.hidden), i = this.xTicks();
		if (this.drawGrid(i), this.drawBands(), !r.length || r.every((e) => !e.xs.length)) {
			e.fillStyle = t.muted, e.font = `13px ${t.font}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(this.opts.emptyText ?? "Sem dados", n.x + n.w / 2, n.y + n.h / 2), this.drawAxes(i);
			return;
		}
		e.save(), e.beginPath(), e.rect(n.x - 2, n.y - 20, n.w * this.reveal + 4, n.h + 22), e.clip();
		let a = (e) => this.highlighted && this.highlighted !== e.key ? this.opts.hoverDim ?? .25 : 1;
		for (let e of r) e.bandLo && this.drawBand(e, a(e));
		for (let e of r) e.area && this.drawArea(e, a(e));
		for (let e of r) this.drawLine(e, a(e));
		for (let e of r) e.points && this.drawPoints(e, a(e));
		for (let e of r) e.labels && this.drawDataLabels(e, a(e));
		e.restore();
		for (let e of r) e.src.marks && this.drawMarks(e, a(e));
		this.drawEndLabels(r.filter((e) => e.src.endLabel), a), this.drawReferenceLines(), this.drawGraphic(), this.drawAxes(i), this.drawHover(), this.drawSlider();
	}
	drawGraphic() {
		let e = this.opts.graphic;
		if (!e) return;
		let t = {
			plot: { ...this.plot },
			width: this.width,
			height: this.height,
			theme: this.theme,
			x: (e) => this.xToPx(this.xValue(e)),
			y: (e, t = "left") => this.yToPx(e, t),
			toData: (e, t) => this.toData(e, t)
		};
		this.ctx.save(), e(this.ctx, t), this.ctx.restore();
	}
	get polarCfg() {
		let e = this.opts.polar;
		if (!e) return null;
		let t = typeof e == "object" ? e : {};
		return {
			start: t.startAngle ?? 90,
			cw: t.clockwise ?? !0
		};
	}
	polarGeom() {
		let e = this.plot;
		return {
			cx: e.x + e.w / 2,
			cy: e.y + e.h / 2,
			R: Math.max(10, Math.min(e.w, e.h) / 2 - 24)
		};
	}
	polarPt(e, t) {
		let { cx: n, cy: r, R: i } = this.polarGeom(), [a, o] = this.dataX, s = this.dom("left"), c = this.polarCfg, l = -(c.start + (c.cw ? -1 : 1) * ((e - a) / (o - a || 1)) * 360) * Math.PI / 180, u = Math.max(0, (t - s.min) / (s.max - s.min || 1)) * i * this.reveal;
		return {
			x: n + Math.cos(l) * u,
			y: r + Math.sin(l) * u
		};
	}
	drawPolar() {
		let e = this.ctx, n = this.theme, { cx: i, cy: a, R: o } = this.polarGeom(), s = this.dom("left"), [c, l] = this.dataX, u = this.axisOpts("x").format;
		e.save(), e.strokeStyle = n.grid, e.lineWidth = 1;
		for (let t of this.yLeft.ticks) {
			let n = (t - s.min) / (s.max - s.min || 1) * o;
			n <= .5 || (e.beginPath(), e.arc(i, a, n, 0, Math.PI * 2), e.stroke());
		}
		e.strokeStyle = n.axis, e.beginPath(), e.arc(i, a, o, 0, Math.PI * 2), e.stroke();
		let d = Math.abs(l - c - 360) < 1e-9 || l - c >= 360, f = t(c, l, 12).ticks.filter((e) => e >= c - 1e-9 && (d ? e < l - 1e-9 : e <= l + 1e-9));
		e.font = `11px ${n.font}`, e.fillStyle = n.muted, e.textAlign = "center", e.textBaseline = "middle";
		let p = this.polarCfg;
		for (let t of f) {
			let s = -(p.start + (p.cw ? -1 : 1) * ((t - c) / (l - c || 1)) * 360) * Math.PI / 180;
			e.strokeStyle = n.grid, e.beginPath(), e.moveTo(i, a), e.lineTo(i + Math.cos(s) * o, a + Math.sin(s) * o), e.stroke(), e.fillText(u ? u(t) : r(t), i + Math.cos(s) * (o + 14), a + Math.sin(s) * (o + 14));
		}
		let m = -p.start * Math.PI / 180;
		e.textAlign = "left";
		for (let t of this.yLeft.ticks) {
			let n = (t - s.min) / (s.max - s.min || 1) * o;
			e.fillText(this.fmtY(t, "y"), i + Math.cos(m) * n + 4, a + Math.sin(m) * n + 8);
		}
		let h = this.model.filter((e) => !e.hidden);
		for (let t of h) {
			let n = this.highlighted && this.highlighted !== t.key ? this.opts.hoverDim ?? .25 : 1, r = [[]];
			if (t.xs.forEach((e, n) => {
				let i = this.yAt(t, n);
				i === null ? r[r.length - 1].length && r.push([]) : r[r.length - 1].push(this.polarPt(e, i));
			}), e.globalAlpha = n, t.area) {
				e.fillStyle = y(t.color, t.area.opacity);
				for (let t of r) if (!(t.length < 2)) {
					e.beginPath(), e.moveTo(i, a);
					for (let n of t) e.lineTo(n.x, n.y);
					e.closePath(), e.fill();
				}
			}
			if (t.width > 0) {
				e.strokeStyle = t.color, e.lineWidth = t.width, e.lineJoin = "round", e.setLineDash(t.dash), e.beginPath();
				for (let t of r) t.forEach((t, n) => n ? e.lineTo(t.x, t.y) : e.moveTo(t.x, t.y));
				e.stroke(), e.setLineDash([]);
			}
			if (t.points) for (let e of r) for (let n of e) this.marker(n.x, n.y, t.points.size, t.points.shape, t.points.color ?? t.color, t.points.hollow);
			e.globalAlpha = 1;
		}
		for (let t of this.hover?.points ?? []) {
			let n = this.polarPt(t.x, t.drawnY);
			e.beginPath(), e.arc(n.x, n.y, 6, 0, Math.PI * 2), e.fillStyle = y(t.color, .25), e.fill(), e.beginPath(), e.arc(n.x, n.y, 3.5, 0, Math.PI * 2), e.fillStyle = t.color, e.fill();
		}
		e.restore();
	}
	polarHit(e, t) {
		let n = null, r = 24;
		for (let i of this.model) i.hidden || i.xs.forEach((a, o) => {
			let s = i.ys[o], c = i.top[o];
			if (s === null || c === null) return;
			let l = this.polarPt(a, c), u = Math.hypot(l.x - e, l.y - t);
			u < r && (r = u, n = {
				series: i.src,
				seriesIndex: i.index,
				index: o,
				x: a,
				y: s,
				color: this.colorAt(i, s),
				drawnY: c
			});
		});
		return n ? {
			x: n.x,
			points: [n]
		} : null;
	}
	drawGrid(e) {
		let t = this.ctx, n = this.plot, r = (e) => (Math.round(e * this.dpr) + .5) / this.dpr;
		if (t.save(), t.strokeStyle = this.theme.grid, t.lineWidth = 1 / this.dpr, t.beginPath(), this.axisOpts("x").grid) for (let i of e) {
			let e = r(this.xToPx(i.value));
			e < n.x || e > n.x + n.w || (t.moveTo(e, n.y), t.lineTo(e, n.y + n.h));
		}
		if (this.axisOpts("y").grid) for (let e of this.yLeft.ticks) {
			let i = r(this.yToPx(e, "left"));
			t.moveTo(n.x, i), t.lineTo(n.x + n.w, i);
		}
		if (this.yRight && this.axisOpts("y2").grid) for (let e of this.yRight.ticks) {
			let i = r(this.yToPx(e, "right"));
			t.moveTo(n.x, i), t.lineTo(n.x + n.w, i);
		}
		t.stroke();
		let i = this.lensCfg();
		if (i) {
			let e = t.createLinearGradient(this.lensX - i.r, 0, this.lensX + i.r, 0);
			e.addColorStop(0, y(this.theme.crosshair, 0)), e.addColorStop(.5, y(this.theme.crosshair, .09)), e.addColorStop(1, y(this.theme.crosshair, 0)), t.fillStyle = e, t.fillRect(Math.max(n.x, this.lensX - i.r), n.y, Math.min(n.x + n.w, this.lensX + i.r) - Math.max(n.x, this.lensX - i.r), n.h);
		}
		let [a, o] = this.xView;
		t.strokeStyle = y(this.theme.muted, .7), t.lineWidth = 1;
		for (let [e] of this.breaks) {
			if (e <= a || e >= o) continue;
			let i = r(this.xToPx(e));
			t.setLineDash([3, 4]), t.beginPath(), t.moveTo(i, n.y), t.lineTo(i, n.y + n.h), t.stroke(), t.setLineDash([]), t.beginPath();
			let s = n.y + n.h;
			t.moveTo(i - 5, s + 4), t.lineTo(i - 2, s - 4), t.moveTo(i + 2, s + 4), t.lineTo(i + 5, s - 4), t.stroke();
		}
		t.restore();
	}
	drawBands() {
		let e = this.ctx, t = this.plot;
		for (let n of this.opts.annotations?.xBands ?? []) {
			let [r, i] = this.xSpan(n.from, n.to), a = Math.max(t.x, r), o = Math.min(t.x + t.w, i);
			if (o <= a) continue;
			let s = n.color ?? "#ff9800";
			e.fillStyle = y(s, .12), e.fillRect(a, t.y, o - a, t.h), n.label && (e.font = `600 11px ${this.theme.font}`, e.fillStyle = y(s, .95), e.textAlign = "center", e.textBaseline = "top", e.fillText(n.label, (a + o) / 2, t.y + 4));
		}
		for (let n of this.opts.annotations?.bands ?? []) {
			let r = n.axis ?? "left";
			if (r === "right" && !this.yRight) continue;
			let i = this.yToPx(n.from, r), a = this.yToPx(n.to, r), o = n.color ?? "#2962ff";
			e.fillStyle = y(o, .1), e.fillRect(t.x, Math.min(i, a), t.w, Math.abs(a - i)), n.label && (e.font = `600 11px ${this.theme.font}`, e.fillStyle = y(o, .9), e.textAlign = "left", e.textBaseline = "top", e.fillText(n.label, t.x + 6, Math.min(i, a) + 4));
		}
	}
	nearest(e, t) {
		if (e.sorted) return d(e.xs, t);
		let n = 0;
		for (let r = 1; r < e.xs.length; r++) Math.abs(e.xs[r] - t) < Math.abs(e.xs[n] - t) && (n = r);
		return n;
	}
	range(e) {
		let [t, n] = this.xView;
		return e.xs.length ? e.sorted ? [Math.max(0, this.nearest(e, t) - 1), Math.min(e.xs.length - 1, this.nearest(e, n) + 1)] : [0, e.xs.length - 1] : [0, -1];
	}
	runs(e, t) {
		let [n, r] = this.range(e), i = [], a = [];
		for (let o = n; o <= r; o++) {
			let n = t(o);
			n === null ? !this.opts.spanGaps && a.length && (i.push(a), a = []) : a.push({
				x: this.xToPx(e.xs[o]),
				y: this.yToPx(n, e.axis)
			});
		}
		return a.length && i.push(a), i;
	}
	trace(t, n, r = !0) {
		let i = this.ctx;
		if (t.length) {
			if (r ? i.moveTo(t[0].x, t[0].y) : i.lineTo(t[0].x, t[0].y), n === "step" || n === "step-end") for (let e = 1; e < t.length; e++) i.lineTo(t[e].x, t[e - 1].y), i.lineTo(t[e].x, t[e].y);
			else if (n === "step-start") for (let e = 1; e < t.length; e++) i.lineTo(t[e - 1].x, t[e].y), i.lineTo(t[e].x, t[e].y);
			else if (n === "step-middle") for (let e = 1; e < t.length; e++) {
				let n = (t[e - 1].x + t[e].x) / 2;
				i.lineTo(n, t[e - 1].y), i.lineTo(n, t[e].y), i.lineTo(t[e].x, t[e].y);
			}
			else if (n === "smooth" && t.length > 2) {
				let n = e(t.map((e) => e.x), t.map((e) => e.y));
				for (let e = 0; e < t.length - 1; e++) {
					let r = (t[e + 1].x - t[e].x) / 3;
					i.bezierCurveTo(t[e].x + r, t[e].y + n[e] * r, t[e + 1].x - r, t[e + 1].y - n[e + 1] * r, t[e + 1].x, t[e + 1].y);
				}
			} else for (let e = 1; e < t.length; e++) i.lineTo(t[e].x, t[e].y);
		}
	}
	drawLine(e, t) {
		let n = this.ctx;
		if (e.width <= 0) return;
		n.save(), n.globalAlpha = t, n.strokeStyle = this.lineGradient(e) ?? e.color, n.lineWidth = e.width + +(this.highlighted === e.key);
		let r = e.src.shadow;
		if (r) {
			let t = typeof r == "object" ? r : {};
			n.shadowColor = t.color ?? y(e.color, .55), n.shadowBlur = t.blur ?? 10, n.shadowOffsetY = t.offsetY ?? 6;
		}
		n.lineJoin = "round", n.lineCap = "round", n.setLineDash(e.dash);
		let i = this.runs(e, (t) => this.yAt(e, t)), a = () => {
			n.beginPath();
			for (let t of i) this.trace(t, e.curve);
		};
		a(), n.stroke();
		for (let t of e.src.pieces ?? []) {
			let [e, r] = this.xSpan(t.from, t.to);
			n.save(), n.beginPath(), n.rect(e, this.plot.y - 10, r - e, this.plot.h + 20), n.clip(), n.strokeStyle = t.color, n.lineCap = "butt", a(), n.stroke(), n.restore();
		}
		if (e.src.valuePieces?.length) {
			let t = this.dom(e.axis), r = (t.max - t.min) * 2 || 1;
			for (let i of e.src.valuePieces) {
				let o = Math.max(i.from ?? -Infinity, t.min - r), s = Math.min(i.to ?? Infinity, t.max + r);
				if (s <= o) continue;
				let c = this.yToPx(o, e.axis), l = this.yToPx(s, e.axis);
				n.save(), n.beginPath(), n.rect(this.plot.x - 10, Math.min(c, l), this.plot.w + 20, Math.abs(l - c)), n.clip(), n.strokeStyle = i.color, a(), n.stroke(), n.restore();
			}
		}
		n.restore();
	}
	colorAt(e, t) {
		return e.src.valuePieces?.find((e) => t >= (e.from ?? -Infinity) && t <= (e.to ?? Infinity))?.color ?? e.color;
	}
	drawBand(e, t) {
		let n = this.ctx, r = e.src.band, [i, a] = this.range(e);
		n.save(), n.globalAlpha = t, n.fillStyle = y(r.color ?? e.color, r.opacity ?? .18);
		let o = [], s = () => {
			if (o.length > 1) {
				let t = o.map((t) => ({
					x: this.xToPx(e.xs[t]),
					y: this.yToPx(e.bandHi[t], e.axis)
				})), r = o.map((t) => ({
					x: this.xToPx(e.xs[t]),
					y: this.yToPx(e.bandLo[t], e.axis)
				})).reverse();
				n.beginPath(), this.trace(t, e.curve), this.trace(r, e.curve, !1), n.closePath(), n.fill();
			}
			o = [];
		};
		for (let t = i; t <= a; t++) e.bandLo[t] === null || e.bandHi[t] === null ? s() : o.push(t);
		s(), n.restore();
	}
	lineGradient(e) {
		let t = e.src.lineGradient;
		if (!t || !t.colors.length) return null;
		let n = this.ctx, r = t.colors.length === 1 ? [t.colors[0], t.colors[0]] : t.colors, i;
		if (t.by === "x") {
			let [t, r] = [0, e.xs.length - 1];
			i = n.createLinearGradient(this.xToPx(e.xs[t] ?? 0), 0, this.xToPx(e.xs[r] ?? 1), 0);
		} else {
			let r = e.top.filter((e) => e !== null), a = t.min ?? Math.min(...r), o = t.max ?? Math.max(...r), s = this.yToPx(a, e.axis), c = this.yToPx(o, e.axis);
			i = n.createLinearGradient(0, s, 0, c === s ? s - 1 : c);
		}
		return r.forEach((e, t) => i.addColorStop(t / (r.length - 1), e)), i;
	}
	drawArea(e, t) {
		let n = this.ctx, r = e.area, i = this.plot, a = this.dom(e.axis), o = this.yToPx(Math.min(Math.max(0, a.min), a.max), e.axis);
		if (n.save(), n.globalAlpha = t, Array.isArray(r.gradient) && r.gradient.length) {
			let e = n.createLinearGradient(0, i.y, 0, i.y + i.h), a = r.gradient.length === 1 ? [r.gradient[0], r.gradient[0]] : r.gradient;
			a.forEach((t, n) => e.addColorStop(n / (a.length - 1), t)), n.globalAlpha = t * r.opacity, n.fillStyle = e;
		} else if (r.gradient) {
			let t = n.createLinearGradient(0, i.y, 0, i.y + i.h);
			t.addColorStop(0, y(e.color, r.opacity)), t.addColorStop(1, y(e.color, r.opacity * .08)), n.fillStyle = t;
		} else n.fillStyle = y(e.color, r.opacity);
		if (r.ranges?.length) {
			n.beginPath();
			for (let [e, t] of r.ranges) {
				let [r, a] = this.xSpan(e, t);
				n.rect(r, i.y - 2, a - r, i.h + 4);
			}
			n.clip();
		}
		for (let t of this.runs(e, (t) => this.yAt(e, t))) {
			if (n.beginPath(), this.trace(t, e.curve), e.base) {
				let [n, r] = this.range(e), i = t.map((e) => e.x), a = [];
				for (let t = n; t <= r; t++) {
					let n = this.xToPx(e.xs[t]);
					n >= i[0] - .5 && n <= i[i.length - 1] + .5 && a.push({
						x: n,
						y: this.yToPx(e.base[t], e.axis)
					});
				}
				a.reverse(), this.trace(a, e.curve === "smooth" ? "smooth" : e.curve, !1);
			} else n.lineTo(t[t.length - 1].x, o), n.lineTo(t[0].x, o);
			n.closePath(), n.fill();
		}
		n.restore();
	}
	marker(e, t, n, r, i, a, o) {
		let s = this.ctx;
		s.beginPath(), r === "square" ? s.rect(e - n, t - n, n * 2, n * 2) : r === "diamond" ? (s.moveTo(e, t - n * 1.3), s.lineTo(e + n * 1.3, t), s.lineTo(e, t + n * 1.3), s.lineTo(e - n * 1.3, t), s.closePath()) : r === "triangle" ? (s.moveTo(e, t - n * 1.3), s.lineTo(e + n * 1.2, t + n), s.lineTo(e - n * 1.2, t + n), s.closePath()) : s.arc(e, t, n, 0, Math.PI * 2), a ? (s.fillStyle = this.theme.background === "transparent" ? "#ffffff" : this.theme.background, s.fill(), s.lineWidth = 2, s.strokeStyle = i, s.stroke()) : (s.fillStyle = i, s.fill(), o && (s.lineWidth = o.width, s.strokeStyle = o.color, s.stroke()));
	}
	drawPoints(e, t) {
		let n = e.points, [r, i] = this.range(e), a = (i - r + 1) / Math.max(1, this.plot.w), o = a > .25 ? this.lensCfg() : null;
		if (!(a > .25 && !o)) {
			this.ctx.save(), this.ctx.globalAlpha = t;
			for (let t = r; t <= i; t++) {
				let r = this.yAt(e, t);
				if (r === null || o && Math.abs(this.xToPx(e.xs[t]) - this.lensX) > o.r * .8) continue;
				let i = n.borderColor ? {
					color: n.borderColor,
					width: n.borderWidth ?? 2
				} : void 0;
				this.marker(this.xToPx(e.xs[t]), this.yToPx(r, e.axis), n.size, n.shape, n.color ?? (n.hollow ? e.color : this.colorAt(e, e.ys[t] ?? r)), n.hollow, i);
			}
			this.ctx.restore();
		}
	}
	fmtValue(e, t) {
		return this.opts.valueFormatter ? this.opts.valueFormatter(e, t) : r(e);
	}
	drawDataLabels(e, t) {
		let n = this.ctx, [r, i] = this.range(e);
		if (!((i - r + 1) * 28 > this.plot.w)) {
			n.save(), n.globalAlpha = t, n.font = `600 11px ${this.theme.font}`, n.fillStyle = e.color, n.textAlign = "center", n.textBaseline = "bottom";
			for (let t = r; t <= i; t++) {
				let r = e.ys[t], i = this.yAt(e, t);
				r !== null && i !== null && n.fillText(this.fmtValue(r, e.src), this.xToPx(e.xs[t]), this.yToPx(i, e.axis) - 7);
			}
			n.restore();
		}
	}
	drawMarks(e, t) {
		let n = e.src.marks, r = this.ctx, i = this.plot, a = e.ys.map((t, n) => t === null || e.top[n] === null ? -1 : n).filter((e) => e >= 0);
		if (!a.length) return;
		if (r.save(), r.globalAlpha = t * this.reveal, n.average) {
			let t = a.reduce((t, n) => t + e.ys[n], 0) / a.length, n = Math.round(this.yToPx(t, e.axis)) + .5;
			r.strokeStyle = e.color, r.lineWidth = 1, r.setLineDash([5, 4]), r.beginPath(), r.moveTo(i.x, n), r.lineTo(i.x + i.w, n), r.stroke(), r.setLineDash([]), r.font = `600 11px ${this.theme.font}`, r.fillStyle = e.color, r.textAlign = "right", r.textBaseline = "bottom", r.fillText(`Média ${this.fmtValue(Math.round(t * 100) / 100, e.src)}`, i.x + i.w - 4, n - 3);
		}
		let o = (t) => {
			let n = this.xToPx(e.xs[t]);
			if (n < i.x - 1 || n > i.x + i.w + 1) return;
			let a = this.yToPx(this.yAt(e, t) ?? e.top[t], e.axis), o = this.fmtValue(e.ys[t], e.src);
			r.font = `700 10px ${this.theme.font}`;
			let s = Math.max(12, r.measureText(o).width / 2 + 5), c = a - s * 2.6 > 2, l = c ? a - s * 1.75 : a + s * 1.75, u = Math.acos(1 / 1.75);
			r.fillStyle = e.color, r.beginPath(), c ? r.arc(n, l, s, Math.PI / 2 + u, Math.PI / 2 - u) : r.arc(n, l, s, -Math.PI / 2 + u, -Math.PI / 2 - u), r.lineTo(n, a), r.closePath(), r.fill(), r.fillStyle = "#ffffff", r.textAlign = "center", r.textBaseline = "middle", r.fillText(o, n, l + .5);
		};
		n.max && o(a.reduce((t, n) => e.ys[n] > e.ys[t] ? n : t, a[0])), n.min && o(a.reduce((t, n) => e.ys[n] < e.ys[t] ? n : t, a[0])), r.restore();
	}
	drawEndLabels(e, t) {
		let n = this.ctx, r = [];
		for (let t of e) {
			let e = this.lastPoint(t), n = e ? this.yAt(t, e.i) : null;
			if (!e || n === null) continue;
			let i = this.yToPx(n, t.axis);
			r.push({
				s: t,
				x: this.xToPx(t.xs[e.i]),
				y: i,
				ty: i,
				text: this.endLabelText(t, e.raw)
			});
		}
		r.sort((e, t) => e.y - t.y);
		for (let e = 1; e < r.length; e++) r[e].ty = Math.max(r[e].ty, r[e - 1].ty + 15);
		let i = r.length ? r[r.length - 1].ty - (this.plot.y + this.plot.h + 6) : 0;
		if (i > 0) {
			for (let e of r) e.ty -= i;
			for (let e = r.length - 2; e >= 0; e--) r[e].ty = Math.min(r[e].ty, r[e + 1].ty - 15);
		}
		n.save(), n.font = `600 12px ${this.theme.font}`, n.textAlign = "left", n.textBaseline = "middle";
		for (let e of r) {
			let r = e.s.src.endLabel, i = typeof r == "object" && r.color || e.s.color;
			n.globalAlpha = t(e.s) * this.reveal, Math.abs(e.ty - e.y) > 1 && (n.strokeStyle = i, n.lineWidth = 1, n.beginPath(), n.moveTo(e.x + 2, e.y), n.lineTo(e.x + 6, e.ty), n.stroke()), n.fillStyle = i, n.fillText(e.text, e.x + 8, e.ty);
		}
		n.restore();
	}
	drawReferenceLines() {
		let e = this.ctx, t = this.plot, n = this.opts.annotations ?? {};
		e.save(), e.font = `600 11px ${this.theme.font}`;
		for (let r of n.y ?? []) {
			let n = r.axis ?? "left";
			if (n === "right" && !this.yRight) continue;
			let i = Math.round(this.yToPx(r.value, n)) + .5, a = r.color ?? "#f23645";
			if (e.strokeStyle = a, e.lineWidth = 1, e.setLineDash(r.dash ?? [5, 4]), e.beginPath(), e.moveTo(t.x, i), e.lineTo(t.x + t.w, i), e.stroke(), r.label) {
				let n = e.measureText(r.label).width + 10;
				e.setLineDash([]), e.fillStyle = a, e.beginPath(), e.roundRect(t.x + t.w - n - 4, i - 9, n, 18, 3), e.fill(), e.fillStyle = "#ffffff", e.textAlign = "center", e.textBaseline = "middle", e.fillText(r.label, t.x + t.w - n / 2 - 4, i + .5);
			}
		}
		for (let t of n.segments ?? []) {
			let n = t.axis ?? "left", r = this.xToPx(this.xValue(t.from.x)), i = this.yToPx(t.from.y, n), a = this.xToPx(this.xValue(t.to.x)), o = this.yToPx(t.to.y, n), s = t.color ?? this.theme.text;
			e.strokeStyle = s, e.fillStyle = s, e.lineWidth = 1.5, e.setLineDash(t.dash ?? []), e.beginPath(), e.moveTo(r, i), e.lineTo(a, o), e.stroke(), e.setLineDash([]), e.beginPath(), e.arc(r, i, 3, 0, Math.PI * 2), e.fill();
			let c = Math.atan2(o - i, a - r);
			e.beginPath(), e.moveTo(a, o), e.lineTo(a - 9 * Math.cos(c - .4), o - 9 * Math.sin(c - .4)), e.lineTo(a - 9 * Math.cos(c + .4), o - 9 * Math.sin(c + .4)), e.closePath(), e.fill(), t.label && (e.textAlign = "center", e.textBaseline = "bottom", e.fillText(t.label, (r + a) / 2, (i + o) / 2 - 6));
		}
		for (let r of n.x ?? []) {
			let n = Math.round(this.xToPx(this.xValue(r.value))) + .5;
			if (n < t.x || n > t.x + t.w) continue;
			let i = r.color ?? "#9598a1";
			e.strokeStyle = i, e.lineWidth = 1, e.setLineDash(r.dash ?? [4, 4]), e.beginPath(), e.moveTo(n, t.y), e.lineTo(n, t.y + t.h), e.stroke(), r.label && (e.setLineDash([]), e.fillStyle = i, e.textAlign = "left", e.textBaseline = "top", e.fillText(r.label, n + 4, t.y + 2));
		}
		e.restore();
	}
	drawAxes(e) {
		let t = this.ctx, n = this.plot, r = this.theme, i = this.axisOpts("x"), a = this.axisOpts("y"), o = this.axisOpts("y2");
		if (t.save(), t.font = `11px ${r.font}`, t.fillStyle = r.muted, t.fillStyle = r.axis, i.show && t.fillRect(n.x, Math.round(n.y + n.h), n.w, 1), i.show) {
			t.textAlign = "center", t.textBaseline = "top";
			let a = -Infinity;
			for (let o of e) {
				let e = this.xToPx(o.value);
				if (e < n.x - 1 || e > n.x + n.w + 1) continue;
				let s = t.measureText(o.label).width;
				e - s / 2 < a + 8 || (t.font = `${o.major ? "600 " : ""}11px ${r.font}`, t.fillStyle = i.color ?? (o.major ? r.text : r.muted), t.fillText(o.label, Math.min(Math.max(e, n.x + s / 2), n.x + n.w - s / 2), n.y + n.h + 6), a = e + s / 2);
			}
			i.title && (t.font = `600 11px ${r.font}`, t.fillStyle = r.muted, t.fillText(i.title, n.x + n.w / 2, n.y + n.h + 22));
		}
		let s = this.opts.x2Axis;
		if (s && s.show !== !1) {
			t.fillStyle = r.axis, t.fillRect(n.x, Math.round(n.y), n.w, 1), t.font = `11px ${r.font}`, t.textAlign = "center", t.textBaseline = "bottom", t.fillStyle = s.color ?? r.muted;
			let i = -Infinity;
			for (let r of e) {
				let e = this.xToPx(r.value);
				if (e < n.x - 1 || e > n.x + n.w + 1) continue;
				let a = s.categories ? s.categories[r.value] ?? "" : s.format ? s.format(r.value) : "", o = t.measureText(a).width;
				!a || e - o / 2 < i + 8 || (t.fillText(a, Math.min(Math.max(e, n.x + o / 2), n.x + n.w - o / 2), n.y - 6), i = e + o / 2);
			}
			s.title && (t.font = `600 11px ${r.font}`, t.fillText(s.title, n.x + n.w / 2, n.y - 22));
		}
		if (t.font = `11px ${r.font}`, t.fillStyle = r.muted, t.textBaseline = "middle", a.show) {
			t.textAlign = "right";
			for (let e of this.yLeft.ticks) t.fillText(this.fmtY(e, "y"), n.x - 8, this.yToPx(e, "left"));
			a.title && this.verticalTitle(a.title, (this.opts.padding ?? 8) + 6, n.y + n.h / 2);
		}
		if (this.yRight && o.show) {
			t.textAlign = "left";
			for (let e of this.yRight.ticks) t.fillText(this.fmtY(e, "y2"), n.x + n.w + 8, this.yToPx(e, "right"));
			o.title && this.verticalTitle(o.title, this.width - (this.opts.padding ?? 8) - 6, n.y + n.h / 2);
		}
		t.restore();
	}
	verticalTitle(e, t, n) {
		let r = this.ctx;
		r.save(), r.translate(t, n), r.rotate(-Math.PI / 2), r.font = `600 11px ${this.theme.font}`, r.fillStyle = this.theme.muted, r.textAlign = "center", r.textBaseline = "middle", r.fillText(e, 0, 0), r.restore();
	}
	drawHover() {
		let e = this.hover;
		if (!e) return;
		let t = this.ctx, n = this.plot, r = {
			show: !0,
			horizontal: !1,
			dash: [4, 4],
			...this.opts.crosshair ?? {}
		}, i = Math.round(this.xToPx(e.x)) + .5;
		if (t.save(), r.show) {
			if (t.strokeStyle = r.color ?? this.theme.crosshair, t.lineWidth = 1, t.setLineDash(r.dash), t.beginPath(), t.moveTo(i, n.y), t.lineTo(i, n.y + n.h), r.horizontal && e.my >= n.y && e.my <= n.y + n.h) {
				let r = Math.round(e.my) + .5;
				t.moveTo(n.x, r), t.lineTo(n.x + n.w, r);
			}
			t.stroke();
		}
		t.setLineDash([]);
		for (let n of e.points) {
			let e = this.model[n.seriesIndex], r = this.xToPx(n.x), i = this.yToPx(n.drawnY, e.axis);
			t.beginPath(), t.arc(r, i, 6, 0, Math.PI * 2), t.fillStyle = y(n.color, .25), t.fill(), t.beginPath(), t.arc(r, i, 3.5, 0, Math.PI * 2), t.fillStyle = n.color, t.fill(), t.lineWidth = 1.5, t.strokeStyle = this.theme.background === "transparent" ? "#ffffff" : this.theme.background, t.stroke();
		}
		t.restore();
	}
	sliderWindow() {
		let e = this.sliderRect, [t, n] = this.dataX, [r, i] = this.xView;
		return [e.x + (r - t) / (n - t) * e.w, e.x + (i - t) / (n - t) * e.w];
	}
	drawSlider() {
		let e = this.sliderRect;
		if (!e) return;
		let t = this.ctx, n = this.theme, [r, i] = this.dataX;
		t.save(), t.fillStyle = y(n.muted, .08), t.strokeStyle = y(n.muted, .35), t.lineWidth = 1, t.beginPath(), t.roundRect(e.x + .5, e.y + .5, e.w - 1, e.h - 1, 4), t.fill(), t.stroke();
		let a = this.model.find((e) => !e.hidden && e.xs.length);
		if (a) {
			let n = a.top.filter((e) => e !== null), o = Math.min(...n), s = Math.max(...n), c = Math.max(1, Math.floor(a.xs.length / e.w)), l = (t) => e.x + (t - r) / (i - r) * e.w, u = (t) => e.y + e.h - 3 - (t - o) / (s - o || 1) * (e.h - 6);
			t.beginPath();
			let d = -1, f = 0;
			for (let e = 0; e < a.xs.length; e += c) {
				let n = a.top[e];
				if (n === null) continue;
				let r = l(a.xs[e]);
				d < 0 ? (d = r, t.moveTo(r, u(n))) : t.lineTo(r, u(n)), f = r;
			}
			t.strokeStyle = y(a.color, .7), t.stroke(), d >= 0 && (t.lineTo(f, e.y + e.h), t.lineTo(d, e.y + e.h), t.closePath(), t.fillStyle = y(a.color, .15), t.fill());
		}
		let [o, s] = this.sliderWindow();
		t.fillStyle = "rgba(0, 0, 0, 0.28)", t.fillRect(e.x, e.y, Math.max(0, o - e.x), e.h), t.fillRect(s, e.y, Math.max(0, e.x + e.w - s), e.h), t.fillStyle = y("#2962ff", .14), t.fillRect(o, e.y, s - o, e.h), t.strokeStyle = "#2962ff", t.strokeRect(o + .5, e.y + .5, Math.max(1, s - o - 1), e.h - 1);
		for (let n of [o, s]) t.fillStyle = "#2962ff", t.beginPath(), t.roundRect(n - 4, e.y + e.h / 2 - 10, 8, 20, 3), t.fill(), t.strokeStyle = "#ffffff", t.beginPath(), t.moveTo(n - 1, e.y + e.h / 2 - 4), t.lineTo(n - 1, e.y + e.h / 2 + 4), t.moveTo(n + 1, e.y + e.h / 2 - 4), t.lineTo(n + 1, e.y + e.h / 2 + 4), t.stroke();
		t.font = `10px ${n.font}`, t.fillStyle = n.muted, t.textBaseline = "middle";
		let [c, l] = this.xView;
		t.textAlign = "right", o - e.x > 50 && t.fillText(this.xLabel(Math.round(c)), o - 7, e.y + e.h / 2), t.textAlign = "left", e.x + e.w - s > 50 && t.fillText(this.xLabel(Math.round(l)), s + 7, e.y + e.h / 2), t.restore();
	}
	inSlider(e, t) {
		let n = this.sliderRect;
		return !!n && e >= n.x - 6 && e <= n.x + n.w + 6 && t >= n.y - 4 && t <= n.y + n.h + 4;
	}
	sliderMove(e) {
		let t = this.sliderDrag, n = this.sliderRect, [r, i] = this.dataX, a = i - r, o = (e - t.x) / n.w * a, s = this.xType === "category" ? 2 : a / 500, [c, l] = t.view;
		if (t.mode === "move") {
			let e = l - c;
			c = Math.min(Math.max(c + o, r), i - e), l = c + e;
		} else t.mode === "l" ? c = Math.min(Math.max(r, c + o), l - s) : l = Math.max(Math.min(i, l + o), c + s);
		this.view = l - c >= a - 1e-9 ? null : [c, l], this.layout(), this.hover = null, this.tooltipEl.classList.remove("is-visible"), this.draw();
	}
	hitTest(e, t) {
		if (this.polarCfg) return this.polarHit(e, t);
		let n = this.plot;
		if (e < n.x - 4 || e > n.x + n.w + 4 || t < n.y - 10 || t > n.y + n.h + 4) return null;
		let r = this.model.filter((e) => !e.hidden && e.xs.length);
		if (!r.length) return null;
		let i = this.pxToX(e), a = this.opts.tooltip?.mode ?? "shared", o = (e, t) => {
			let n = e.ys[t], r = e.top[t];
			return n === null || r === null ? null : {
				series: e.src,
				seriesIndex: e.index,
				index: t,
				x: e.xs[t],
				y: n,
				color: this.colorAt(e, n),
				drawnY: r
			};
		};
		if (a === "single") {
			let n = null, a = 28;
			for (let s of r) {
				let r = this.nearest(s, i);
				for (let i of [
					r - 1,
					r,
					r + 1
				]) {
					if (i < 0 || i >= s.xs.length) continue;
					let r = o(s, i);
					if (!r) continue;
					let c = Math.hypot(this.xToPx(r.x) - e, this.yToPx(r.drawnY, s.axis) - t);
					c < a && (a = c, n = r);
				}
			}
			return n ? {
				x: n.x,
				points: [n]
			} : null;
		}
		return this.sharedAt(i, r);
	}
	sharedAt(e, t) {
		let n = (e, t) => {
			let n = e.ys[t], r = e.top[t];
			return n === null || r === null ? null : {
				series: e.src,
				seriesIndex: e.index,
				index: t,
				x: e.xs[t],
				y: n,
				color: this.colorAt(e, n),
				drawnY: r
			};
		}, r = NaN, i = Infinity;
		for (let n of t) {
			let t = this.nearest(n, e), a = Math.abs(n.xs[t] - e);
			a < i && (i = a, r = n.xs[t]);
		}
		let a = [];
		for (let e of t) {
			let t = this.nearest(e, r), i = e.xs.length > 1 ? (e.xs[e.xs.length - 1] - e.xs[0]) / (e.xs.length - 1) : 1;
			if (Math.abs(e.xs[t] - r) > i * .5 + 1e-9) continue;
			let o = n(e, t);
			o && a.push(o);
		}
		return a.length ? {
			x: r,
			points: a
		} : null;
	}
	tooltipContext(e) {
		return {
			x: e.x,
			label: this.xLabel(e.x),
			points: e.points.map((e) => ({ ...e }))
		};
	}
	x2Label(e) {
		let t = this.opts.x2Axis;
		if (!t || t.show === !1) return "";
		let n = t.categories ? t.categories[e] : t.format ? t.format(e) : "";
		return n ? ` <span class="lc-tooltip__sub" style="color:${t.color ?? "inherit"}">· ${b(n)}</span>` : "";
	}
	showTooltip(e, t) {
		let n = this.tooltipEl, r = this.opts.tooltip ?? {};
		if (!this.hover || r.show === !1) {
			n.classList.remove("is-visible");
			return;
		}
		let i = this.tooltipContext(this.hover), a = i.points;
		r.sort && (a = [...a].sort((e, t) => t.y - e.y)), n.innerHTML = r.formatter ? r.formatter(i) : `<div class="lc-tooltip__head">${b(i.label)}${this.x2Label(this.hover.x)}</div>${a.map((e) => {
			let t = this.model[e.seriesIndex], n = t.bandLo?.[e.index], r = t.bandHi?.[e.index], i = n != null && r != null ? ` <small>${b(this.fmtValue(n, e.series))} – ${b(this.fmtValue(r, e.series))}</small>` : "";
			return `<div class="lc-tooltip__row"><span class="lc-tooltip__dot" style="background:${e.color}"></span><span class="lc-tooltip__name">${b(e.series.name)}</span><b>${b(this.fmtValue(e.y, e.series))}${i}</b></div>`;
		}).join("")}`, n.classList.add("is-visible");
		let o = n.offsetWidth, s = n.offsetHeight, c = this.plot, l = this.polarCfg ? e : this.xToPx(this.hover.x), u = l + 14;
		u + o > this.width - 4 && (u = l - o - 14);
		let d = Math.min(Math.max(t - s / 2, c.y), c.y + c.h - s);
		d = Math.max(4, d), n.style.transform = `translate(${Math.max(4, u)}px, ${d}px)`;
	}
	bind() {
		let e = this.canvas, t = (t) => {
			let n = e.getBoundingClientRect();
			return {
				x: t.clientX - n.left,
				y: t.clientY - n.top
			};
		}, n = /* @__PURE__ */ new Map(), r = null;
		e.addEventListener("pointerdown", (i) => {
			let a = t(i);
			if (i.pointerType === "touch" && !this.inSlider(a.x, a.y)) {
				if (n.set(i.pointerId, a), e.setPointerCapture(i.pointerId), n.size === 2 && this.opts.zoom) {
					let [e, t] = [...n.values()];
					r = {
						d: Math.abs(e.x - t.x) || 1,
						view: [...this.xView],
						cx: (e.x + t.x) / 2
					};
				} else n.size === 1 && this.pointerHover(a.x, a.y);
				i.stopImmediatePropagation();
				return;
			}
			let o = i.button === 0 ? this.draggableAt(a.x, a.y) : null;
			o && (this.pointDrag = o, e.setPointerCapture(i.pointerId), i.stopImmediatePropagation());
		}), e.addEventListener("pointermove", (e) => {
			let i = t(e);
			if (n.has(e.pointerId)) {
				if (n.set(e.pointerId, i), r && n.size >= 2) {
					let [e, t] = [...n.values()];
					this.zoomAround(r.view, r.d / (Math.abs(e.x - t.x) || 1), r.cx);
				} else n.size === 1 && this.pointerHover(i.x, i.y);
				e.stopImmediatePropagation();
			} else this.pointDrag && (this.movePoint(i.x, i.y), e.stopImmediatePropagation());
		});
		let i = (t) => {
			n.has(t.pointerId) ? (n.delete(t.pointerId), n.size < 2 && (r = null), t.stopImmediatePropagation()) : this.pointDrag && (this.pointDrag = null, e.hasPointerCapture(t.pointerId) && e.releasePointerCapture(t.pointerId), t.stopImmediatePropagation());
		};
		e.addEventListener("pointerup", i), e.addEventListener("pointercancel", i), e.addEventListener("pointermove", (n) => {
			let { x: r, y: i } = t(n);
			if (this.opts.fisheye && (this.lensX = r >= this.plot.x && r <= this.plot.x + this.plot.w ? r : null), this.sliderDrag) {
				this.sliderMove(r);
				return;
			}
			if (this.inSlider(r, i)) {
				let [t, n] = this.sliderWindow();
				e.style.cursor = Math.abs(r - t) <= 7 || Math.abs(r - n) <= 7 ? "ew-resize" : "grab", this.hover && (this.hover = null, this.tooltipEl.classList.remove("is-visible"), this.draw());
				return;
			}
			if (this.drag) {
				let [e, t] = this.drag.view, n = (r - this.drag.x) / this.plot.w * (t - e), [i, a] = this.dataX, o = t - e, s = Math.min(Math.max(e - n, i), a - o);
				this.view = [s, s + o], this.layout(), this.hover = null, this.tooltipEl.classList.remove("is-visible"), this.draw();
				return;
			}
			let a = this.hitTest(r, i), o = this.hover ? `${this.hover.x}|${this.hover.points.length}` : "";
			this.hover = a ? {
				...a,
				my: i
			} : null, e.style.cursor = this.draggableAt(r, i) ? "move" : this.opts.zoom ? "grab" : a ? "crosshair" : "default", this.draw(), this.showTooltip(r, i), (a ? `${a.x}|${a.points.length}` : "") !== o && this.emit("hover", a ? this.tooltipContext(a) : null);
		}), e.addEventListener("pointerleave", () => {
			this.drag || (this.lensX = null, this.hover = null, this.tooltipEl.classList.remove("is-visible"), this.draw(), this.emit("hover", null));
		}), e.addEventListener("click", (e) => {
			let { x: n, y: r } = t(e), i = this.hitTest(n, r);
			i && this.emit("click", this.tooltipContext(i));
			let a = this.plot;
			if (n >= a.x && n <= a.x + a.w && r >= a.y && r <= a.y + a.h) {
				let e = this.toData(n, r);
				this.emit("plotclick", {
					x: e.x,
					y: e.y,
					px: n,
					py: r
				});
			}
		}), e.addEventListener("pointerdown", (n) => {
			if (!this.opts.zoom || n.button !== 0) return;
			let r = t(n);
			if (this.inSlider(r.x, r.y)) {
				let [t, i] = this.sliderWindow(), a = Math.abs(r.x - t) <= 7 ? "l" : Math.abs(r.x - i) <= 7 ? "r" : "move";
				if (a === "move" && (r.x < t || r.x > i)) {
					let e = this.sliderRect, [t, n] = this.dataX, [i, o] = this.xView, s = o - i, c = t + (r.x - e.x) / e.w * (n - t), l = Math.min(Math.max(c - s / 2, t), n - s);
					this.view = s >= n - t - 1e-9 ? null : [l, l + s], this.layout(), this.draw(), a = "move";
				}
				e.setPointerCapture(n.pointerId), this.sliderDrag = {
					mode: a,
					x: r.x,
					view: [...this.xView]
				};
			} else e.setPointerCapture(n.pointerId), this.drag = {
				x: t(n).x,
				view: [...this.xView]
			}, e.style.cursor = "grabbing";
		});
		let a = (t) => {
			this.sliderDrag ? (this.sliderDrag = null, e.hasPointerCapture(t.pointerId) && e.releasePointerCapture(t.pointerId), this.emit("zoom", this.view ? {
				from: this.view[0],
				to: this.view[1]
			} : null)) : this.drag && (this.drag = null, e.hasPointerCapture(t.pointerId) && e.releasePointerCapture(t.pointerId), e.style.cursor = "grab", this.view && this.emit("zoom", {
				from: this.view[0],
				to: this.view[1]
			}));
		};
		e.addEventListener("pointerup", a), e.addEventListener("pointercancel", a), e.addEventListener("wheel", (e) => {
			if (!this.opts.zoom) return;
			e.preventDefault();
			let { x: n } = t(e), [r, i] = this.xView, [a, o] = this.dataX, s = this.pxToX(Math.min(Math.max(n, this.plot.x), this.plot.x + this.plot.w)), c = Math.exp(e.deltaY * .0015), l = this.xType === "category" ? 2 : (o - a) / 500, u = Math.min(o - a, Math.max(l, (i - r) * c)), d = (s - r) / (i - r), f = s - u * d;
			f = Math.min(Math.max(f, a), o - u), u >= o - a - 1e-9 ? (this.view = null, u = o - a) : this.view = [f, f + u], this.layout(), this.draw(), this.emit("zoom", this.view ? {
				from: this.view[0],
				to: this.view[1]
			} : null);
		}, { passive: !1 }), e.addEventListener("dblclick", () => {
			this.opts.zoom && this.view && this.resetZoom();
		});
	}
	pointerHover(e, t) {
		let n = this.hitTest(e, t), r = this.hover ? `${this.hover.x}|${this.hover.points.length}` : "";
		this.hover = n ? {
			...n,
			my: t
		} : null, this.draw(), this.showTooltip(e, t), (n ? `${n.x}|${n.points.length}` : "") !== r && this.emit("hover", n ? this.tooltipContext(n) : null);
	}
	zoomAround(e, t, n) {
		let [r, i] = this.dataX, a = e[1] - e[0], o = e[0] + (n - this.plot.x) / this.plot.w * a, s = this.xType === "category" ? 2 : (i - r) / 500, c = Math.min(i - r, Math.max(s, a * t)), l = Math.min(Math.max(o - c * ((o - e[0]) / a), r), i - c);
		this.view = c >= i - r - 1e-9 ? null : [l, l + c], this.layout(), this.draw(), this.emit("zoom", this.view ? {
			from: this.view[0],
			to: this.view[1]
		} : null);
	}
	draggableAt(e, t) {
		if (this.opts.stacked) return null;
		for (let n of this.model) {
			if (n.hidden || !n.src.draggable) continue;
			let [r, i] = this.range(n);
			for (let a = r; a <= i; a++) {
				let r = n.top[a];
				if (r !== null && Math.hypot(this.xToPx(n.xs[a]) - e, this.yToPx(r, n.axis) - t) <= 10) return {
					key: n.key,
					orig: n.srcIdx[a]
				};
			}
		}
		return null;
	}
	movePoint(e, t) {
		let n = this.pointDrag, r = this.seriesList.find((e) => this.keyOf(e) === n.key), i = this.model.find((e) => e.key === n.key);
		if (!r || !i) return;
		let a = r.draggable === "y" ? "y" : r.draggable === "xy" || this.xType === "number" ? "xy" : "y", o = this.plot, s = +this.pyToY(Math.min(Math.max(t, o.y), o.y + o.h), i.axis).toPrecision(6), c = [...r.data], l = c[n.orig], u;
		typeof l == "object" && l ? (u = a === "xy" ? +this.pxToX(Math.min(Math.max(e, o.x), o.x + o.w)).toPrecision(6) : this.xValue(l.x), c[n.orig] = {
			x: a === "xy" ? u : l.x,
			y: s
		}) : (u = n.orig, c[n.orig] = s), r.data = c, this.hover = null, this.tooltipEl.classList.remove("is-visible"), this.rebuild(null), this.emit("change", {
			series: r,
			index: n.orig,
			x: u,
			y: s
		});
	}
	renderLegend() {
		let e = this.legendEl, t = this.opts.legend?.interactive ?? !0;
		e.innerHTML = "";
		for (let n of this.model) {
			let r = document.createElement("li");
			r.className = `lc-legend__item${n.hidden ? " is-hidden" : ""}${t ? " is-interactive" : ""}`, r.dataset.id = n.key, r.innerHTML = `<span class="lc-legend__marker${n.dash.length ? " is-dashed" : ""}" style="--c:${n.color}"></span><span class="lc-legend__label">${b(n.src.name)}</span>`, r.addEventListener("mouseenter", () => !n.hidden && this.highlight(n.key)), r.addEventListener("mouseleave", () => this.highlight(null)), t && r.addEventListener("click", () => this.toggle(n.key)), e.append(r);
		}
	}
};
function T(e, t = {}) {
	return new w(e, t);
}
//#endregion
export { g as a, h as i, w as n, c as o, T as r, m as t };

//# sourceMappingURL=line.js.map