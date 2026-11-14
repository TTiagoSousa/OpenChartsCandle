import { t as e } from "./curve.js";
import { n as t, t as n } from "./format.js";
//#region src/bar/layout.ts
function r(e, t, n) {
	let r = e.filter((e) => !e.hidden), i = [], a = (e) => n ? `${e.axis ?? "left"}|${e.group}` : e.key;
	for (let e of r) {
		let t = a(e);
		i.includes(t) || i.push(t);
	}
	let o = Array(t).fill(0);
	for (let e of r) for (let n = 0; n < t; n++) o[n] += Math.abs(e.values[n] ?? 0);
	let s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map();
	for (let e of i) s.set(e, Array(t).fill(0)), c.set(e, Array(t).fill(0));
	let l = 0, u = 0, d = {}, f = (e, t) => {
		let n = d[e] ??= {
			min: 0,
			max: 0
		};
		n.min = Math.min(n.min, t), n.max = Math.max(n.max, t);
	};
	return {
		segments: e.map((e) => {
			let r = [], d = a(e), p = i.indexOf(d);
			for (let i = 0; i < t; i++) {
				let t = e.values[i];
				if (e.hidden || t == null || !Number.isFinite(t) || p < 0) {
					r.push(null);
					continue;
				}
				let a = t;
				if (n === "percent" && (a = o[i] ? t / o[i] * 100 : 0), !n) {
					r.push({
						from: 0,
						to: a,
						slot: p
					}), l = Math.min(l, a), u = Math.max(u, a), f(e.axis ?? "left", a);
					continue;
				}
				let m = a >= 0 ? s.get(d) : c.get(d), h = m[i], g = h + a;
				m[i] = g, r.push({
					from: h,
					to: g,
					slot: p
				}), l = Math.min(l, g), u = Math.max(u, g), f(e.axis ?? "left", g);
			}
			return r;
		}),
		slots: Math.max(1, i.length),
		min: l,
		max: u,
		totals: o,
		ranges: d
	};
}
function i(e, t, n, r, i, a, o) {
	let s = t * (1 - Math.min(.9, Math.max(0, i))), c = Math.max(1, (s - a * (r - 1)) / r);
	return o && (c = Math.min(c, o)), {
		start: e + (t - (c * r + a * (r - 1))) / 2 + n * (c + a),
		size: c
	};
}
function a(e, t) {
	let n = e.map((e, t) => t);
	return t === "asc" && n.sort((t, n) => e[t] - e[n]), t === "desc" && n.sort((t, n) => e[n] - e[t]), n;
}
//#endregion
//#region src/bar/overlays.ts
var o = (e) => e != null && Number.isFinite(e);
function s(e, t) {
	let n = Math.max(1, Math.floor(t));
	return e.map((t, r) => {
		if (r < n - 1) return null;
		let i = 0;
		for (let t = r - n + 1; t <= r; t++) {
			let n = e[t];
			if (!o(n)) return null;
			i += n;
		}
		return i / n;
	});
}
function c(e, t) {
	let n = Math.max(1, Math.floor(t)), r = n * (n + 1) / 2;
	return e.map((t, i) => {
		if (i < n - 1) return null;
		let a = 0;
		for (let t = 0; t < n; t++) {
			let r = e[i - n + 1 + t];
			if (!o(r)) return null;
			a += r * (t + 1);
		}
		return a / r;
	});
}
function l(e, t) {
	let n = Math.max(1, Math.floor(t)), r = 2 / (n + 1), i = [], a = null, s = [];
	for (let t of e) if (!o(t)) i.push(null);
	else if (a === null) {
		if (s.push(t), s.length < n) {
			i.push(null);
			continue;
		}
		a = s.reduce((e, t) => e + t, 0) / n, i.push(a);
	} else a = t * r + a * (1 - r), i.push(a);
	return i;
}
function u(e) {
	let t = e.map((e, t) => [t, e]).filter((e) => o(e[1]));
	if (t.length < 2) return {
		values: e.map(() => null),
		slope: 0,
		intercept: 0,
		r2: 0
	};
	let n = t.length, r = t.reduce((e, t) => e + t[0], 0) / n, i = t.reduce((e, t) => e + t[1], 0) / n, a = 0, s = 0, c = 0;
	for (let [e, n] of t) a += (e - r) * (n - i), s += (e - r) ** 2, c += (n - i) ** 2;
	let l = s ? a / s : 0, u = i - l * r, d = c ? a * a / (s * c) : 1;
	return {
		values: e.map((e, t) => u + l * t),
		slope: l,
		intercept: u,
		r2: d
	};
}
function d(e) {
	let t = e.map((e) => o(e) && e > 0 ? Math.log(e) : null), n = u(t);
	return t.filter(o).length < 2 ? {
		values: e.map(() => null),
		growth: 0,
		r2: 0
	} : {
		values: e.map((e, t) => Math.exp(n.intercept + n.slope * t)),
		growth: Math.exp(n.slope) - 1,
		r2: n.r2
	};
}
function f(e, t = !1) {
	let n = e.reduce((e, t) => e + (o(t) ? t : 0), 0), r = 0;
	return e.map((e) => (o(e) && (r += e), t ? n ? r / n * 100 : 0 : r));
}
function p(e) {
	let t = e.filter(o), n = t.length ? t.reduce((e, t) => e + t, 0) / t.length : null;
	return e.map(() => n);
}
//#endregion
//#region src/bar/bar.ts
var m = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", h = [
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
], g = [
	"#ffd54f",
	"#ff4081",
	"#00e5ff",
	"#b2ff59",
	"#ea80fc",
	"#ffffff"
], _ = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	grid: "rgba(42, 46, 57, 0.7)",
	axis: "#2a2e39",
	hover: "rgba(255, 255, 255, 0.04)",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: m
}, v = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	grid: "rgba(42, 46, 57, 0.08)",
	axis: "#e0e3eb",
	hover: "rgba(41, 98, 255, 0.06)",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: m
}, y = {
	sma: "Média móvel",
	ema: "Média exponencial",
	wma: "Média ponderada",
	linear: "Tendência linear",
	exponential: "Tendência exponencial",
	average: "Média",
	cumulative: "Acumulado",
	line: "Linha"
}, b = [
	"left",
	"right",
	"right2"
], x = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), S = (e) => 1 - (1 - e) ** 3, C = (e, t, n) => Math.min(n, Math.max(t, e)), w = (e) => (e - 90) * Math.PI / 180;
function T(e) {
	let t = e.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i);
	if (!t) return "#ffffff";
	let [n, r, i] = [
		t[1],
		t[2],
		t[3]
	].map((e) => parseInt(e, 16));
	return .299 * n + .587 * r + .114 * i > 165 ? "#131722" : "#ffffff";
}
function E(e, t) {
	let n = e.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i);
	return n ? `rgba(${parseInt(n[1], 16)}, ${parseInt(n[2], 16)}, ${parseInt(n[3], 16)}, ${t})` : e;
}
var D = (e) => {
	if (e == null) return null;
	let t = typeof e == "object" ? e.value : e;
	return t === null || !Number.isFinite(t) ? null : t;
};
function O(e) {
	return e.sparkline ? {
		padding: 2,
		radius: 1,
		...e,
		legend: {
			show: !1,
			...e.legend ?? {}
		},
		categoryAxis: {
			show: !1,
			...e.categoryAxis ?? {}
		},
		valueAxis: {
			show: !1,
			grid: !1,
			...e.valueAxis ?? {}
		}
	} : e;
}
var k = class {
	constructor(e, t = {}) {
		this.categories = [], this.seriesList = [], this.vals = [], this.items = [], this.hidden = /* @__PURE__ */ new Set(), this.order = [], this.shown = [], this.posOf = /* @__PURE__ */ new Map(), this.prevPos = /* @__PURE__ */ new Map(), this.stacks = {
			segments: [],
			slots: 1,
			min: 0,
			max: 1,
			totals: [],
			ranges: {}
		}, this.prev = null, this.prevKeys = [], this.scales = {
			left: {
				min: 0,
				max: 1,
				ticks: [0, 1]
			},
			right: {
				min: 0,
				max: 1,
				ticks: [0, 1]
			},
			right2: {
				min: 0,
				max: 1,
				ticks: [0, 1]
			}
		}, this.prevScales = null, this.used = /* @__PURE__ */ new Set(["left"]), this.lines = [], this.prevLines = /* @__PURE__ */ new Map(), this.vbreaks = [], this.breakGap = 0, this.mekko = null, this.plot = {
			x: 0,
			y: 0,
			w: 1,
			h: 1
		}, this.width = 0, this.height = 0, this.dpr = 1, this.hoverCat = -1, this.hoverBar = null, this.highlighted = null, this.drawn = [], this.progress = 1, this.elapsed = 0, this.animKind = null, this.animStart = 0, this.raf = 0, this.view = null, this.drag = null, this.sliderRect = null, this.sliderDrag = null, this.brushRect = null, this.selected = null, this.handlers = /* @__PURE__ */ new Map(), this.opts = O({ ...t }), this.root = e, e.classList.add("bc-root"), this.plotEl = document.createElement("div"), this.plotEl.className = "bc-plot", this.canvas = document.createElement("canvas"), this.canvas.className = "bc-canvas", this.canvas.setAttribute("role", "img"), this.ctx = this.canvas.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "bc-tooltip", this.legendEl = document.createElement("ul"), this.legendEl.className = "bc-legend", this.plotEl.append(this.canvas, this.tooltipEl), e.append(this.plotEl, this.legendEl), this.categories = [...t.categories ?? []], this.seriesList = (t.series ?? []).map((e) => ({ ...e }));
		for (let e of this.seriesList) e.hidden && this.hidden.add(this.keyOf(e));
		(t.overlays ?? []).forEach((e, t) => e.hidden && this.hidden.add(this.overlayKey(e, t))), this.order = this.categories.map((e, t) => t), this.shown = [...this.order], this.order.forEach((e, t) => this.posOf.set(e, t)), this.applyLook(), this.bind(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(this.plotEl), this.resize(), this.rebuild("reveal"), this.applyInitialZoom();
	}
	get series() {
		return this.seriesList.map((e) => ({
			...e,
			data: [...e.data]
		}));
	}
	get overlayValues() {
		return this.lines.map((e) => ({
			id: e.id,
			name: e.name,
			color: e.color,
			values: [...e.values]
		}));
	}
	setOverlays(e, t = !0) {
		this.setOptions({ overlays: e }, t);
	}
	setData(e, t) {
		let n = e.length === this.categories.length && t.length === this.seriesList.length && t.every((e, t) => this.keyOf(e) === this.keyOf(this.seriesList[t]));
		this.categories = [...e], this.seriesList = t.map((e) => ({ ...e })), this.applyLook(), this.rebuild(n ? "morph" : "reveal");
	}
	setOptions(e, t = !0) {
		e.categories && (this.categories = [...e.categories]), e.series && (this.seriesList = e.series.map((e) => ({ ...e }))), (e.overlays ?? []).forEach((e, t) => e.hidden && this.hidden.add(this.overlayKey(e, t))), this.opts = O({
			...this.opts,
			...e
		}), this.applyLook(), this.rebuild(t ? "morph" : null);
	}
	updateSeries(e, t) {
		let n = this.seriesList.findIndex((t) => this.keyOf(t) === e);
		n < 0 || (this.seriesList[n] = {
			...this.seriesList[n],
			...t
		}, this.rebuild("morph"));
	}
	setValue(e, t, n) {
		let r = this.seriesList.find((t) => this.keyOf(t) === e);
		if (!r) return;
		r.data = [...r.data];
		let i = r.data[t];
		r.data[t] = typeof i == "object" && i ? {
			...i,
			value: n
		} : n, this.rebuild("morph");
	}
	toggle(e, t) {
		let n = t ?? !this.hidden.has(e);
		n ? this.hidden.add(e) : this.hidden.delete(e), this.rebuild("morph"), this.emit("toggle", {
			id: e,
			hidden: n
		});
	}
	highlight(e) {
		this.highlighted = e, this.legendEl.querySelectorAll(".bc-legend__item").forEach((t) => t.classList.toggle("is-hover", t.dataset.id === e)), this.draw();
	}
	setZoom(e, t) {
		let n = (e) => this.posOf.get(typeof e == "number" ? e : this.categories.indexOf(e)) ?? 0, r = Math.min(n(e), n(t)), i = Math.max(n(e), n(t)) + 1;
		this.view = i - r >= this.shown.length ? null : [r, i], this.layout(), this.draw(), this.emit("zoom", this.view ? {
			from: this.view[0],
			to: this.view[1]
		} : null);
	}
	resetZoom() {
		this.view && (this.view = null, this.layout(), this.draw(), this.emit("zoom", null));
	}
	select(e) {
		this.selected = e ? new Set(e.map((e) => `${e.seriesIndex}|${e.categoryIndex}`)) : null, this.draw();
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
		cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("bc-root", "bc-legend-top", "bc-legend-bottom", "bc-legend-left", "bc-legend-right"), this.plotEl.remove(), this.legendEl.remove();
	}
	keyOf(e) {
		return e.id ?? e.name;
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t));
	}
	get vertical() {
		return (this.opts.orientation ?? "vertical") === "vertical";
	}
	axisOf(e) {
		return e.axis ?? "left";
	}
	axisOpts(e) {
		let t = this.opts;
		return e === "left" ? {
			show: !0,
			grid: !0,
			...t.valueAxis ?? {}
		} : e === "right" ? {
			show: !0,
			grid: !1,
			...t.rightAxis ?? {}
		} : {
			show: !0,
			grid: !1,
			...t.right2Axis ?? {}
		};
	}
	colorOf(e, t) {
		let n = this.opts.colors?.length ? this.opts.colors : h;
		return e.color ?? n[t % n.length];
	}
	applyLook() {
		let e = this.opts, t = e.theme === "light" ? v : _;
		this.theme = {
			...t,
			...typeof e.theme == "object" ? e.theme : {}
		}, e.background !== void 0 && (this.theme.background = e.background);
		let n = {
			position: "top",
			marker: "square",
			align: "start",
			fontSize: 12,
			show: !0,
			...e.legend ?? {}
		};
		this.root.classList.remove("bc-legend-top", "bc-legend-bottom", "bc-legend-left", "bc-legend-right"), this.root.classList.add(`bc-legend-${n.position}`);
		let r = this.seriesList.filter((e) => !e.silent).length + (e.overlays?.length ?? 0);
		this.legendEl.style.display = n.show && (r > 1 || e.legend?.show) ? "" : "none", this.legendEl.className = `bc-legend bc-legend--${n.marker} bc-legend--align-${n.align}`, this.legendEl.style.fontSize = `${n.fontSize}px`;
		let i = this.theme, a = {
			"--bc-bg": i.background,
			"--bc-text": i.text,
			"--bc-muted": i.muted,
			"--bc-tt-bg": i.tooltipBg,
			"--bc-tt-text": i.tooltipText,
			"--bc-tt-border": i.tooltipBorder,
			"--bc-font": i.font
		};
		for (let [e, t] of Object.entries(a)) this.root.style.setProperty(e, t);
	}
	rebuild(e) {
		let t = this.seriesList.map((e) => this.keyOf(e)), n = this.prevKeys.length === t.length && t.every((e, t) => e === this.prevKeys[t]) && this.stacks.segments.length === t.length;
		this.prev = n ? this.currentSegments() : null;
		let i = this.animKind || this.prev;
		this.prevScales = i ? {
			left: this.rangeOf("left"),
			right: this.rangeOf("right"),
			right2: this.rangeOf("right2")
		} : null, this.prevLines = new Map(this.lines.map((e) => [e.id, this.lineNow(e)])), this.prevPos = new Map(this.shown.map((e) => [this.categories[e], this.aPos(e)])), this.prevKeys = t;
		let o = this.categories.length || Math.max(0, ...this.seriesList.map((e) => e.data.length));
		this.categories.length || (this.categories = Array.from({ length: o }, (e, t) => String(t + 1))), this.vals = this.seriesList.map((e) => Array.from({ length: o }, (t, n) => D(e.data[n]))), this.items = this.seriesList.map((e) => Array.from({ length: o }, (t, n) => {
			let r = e.data[n];
			return typeof r == "object" && r ? r : null;
		})), this.stacks = r(this.seriesList.map((e, t) => ({
			key: this.keyOf(e),
			group: e.stack ?? "__all__",
			values: this.vals[t],
			hidden: this.hidden.has(this.keyOf(e)),
			axis: this.axisOf(e)
		})), o, this.opts.stacked ?? !1), this.seriesList.some((e) => e.silent) && (this.stacks.totals = this.categories.map((e, t) => this.seriesList.reduce((e, n, r) => e + (this.hidden.has(this.keyOf(n)) || n.silent ? 0 : Math.abs(this.vals[r][t] ?? 0)), 0)));
		let s = this.categories.map((e, t) => this.seriesList.reduce((e, n, r) => e + (this.hidden.has(this.keyOf(n)) || n.silent ? 0 : this.vals[r][t] ?? 0), 0));
		if (this.order = a(s, this.opts.sort ?? "none"), this.shown = this.opts.limit ? this.order.slice(0, this.opts.limit) : [...this.order], this.posOf = new Map(this.shown.map((e, t) => [e, t])), this.view) {
			let e = Math.min(this.view[1] - this.view[0], this.shown.length), t = C(this.view[0], 0, Math.max(0, this.shown.length - e));
			this.view = e >= this.shown.length ? null : [t, t + e];
		}
		if (this.opts.widthBy === "total") {
			let e = this.shown.map((e) => Math.max(0, this.stacks.totals[e] ?? 0)), t = e.reduce((e, t) => e + t, 0) || 1;
			this.mekko = [0], e.forEach((e) => this.mekko.push(this.mekko[this.mekko.length - 1] + e / t));
		} else this.mekko = null;
		this.lines = this.computeLines(), this.layout(), this.renderLegend(), this.canvas.setAttribute("aria-label", `Gráfico de barras: ${this.seriesList.filter((e) => !e.silent).map((e) => e.name).join(", ")}`);
		let c = this.duration();
		if (!e || c === 0 || e === "morph" && !this.prev) {
			if (e === "morph" && !this.prev && c > 0) e = "reveal";
			else {
				this.animKind = null, this.progress = 1, this.draw();
				return;
			}
		}
		this.animKind = e, this.animStart = performance.now(), this.progress = 0, this.elapsed = 0, this.tick();
	}
	applyInitialZoom() {
		let e = this.opts.zoom;
		if (typeof e != "object" || e.start === void 0 && e.end === void 0) return;
		let t = this.shown.length, n = Math.floor(t * C(e.start ?? 0, 0, 100) / 100), r = Math.max(n + 1, Math.ceil(t * C(e.end ?? 100, 0, 100) / 100));
		r - n >= t || (this.view = [n, r], this.layout(), this.draw());
	}
	overlayKey(e, t) {
		return e.id ?? e.name ?? `${e.type}-${t}`;
	}
	sourceValues(e) {
		let t = this.categories.length, n = this.seriesList.map((e, t) => ({
			s: e,
			si: t
		})).filter(({ s: e }) => !this.hidden.has(this.keyOf(e)) && !e.silent);
		if (e === "total") return Array.from({ length: t }, (e, t) => {
			let r = n.map(({ si: e }) => this.vals[e][t]).filter((e) => e !== null);
			return r.length ? r.reduce((e, t) => e + t, 0) : null;
		});
		let r = e ? this.seriesList.findIndex((t) => this.keyOf(t) === e || t.name === e) : this.seriesList.findIndex((e) => !e.silent), i = this.seriesList[r];
		return !i || this.hidden.has(this.keyOf(i)) ? Array(t).fill(null) : Array.from({ length: t }, (e, t) => this.vals[r][t] ?? null);
	}
	computeLines() {
		let e = this.opts.overlays ?? [], t = this.categories.length, n = 0;
		return e.map((e, r) => {
			let i = this.overlayKey(e, r), a = e.color ?? g[n++ % g.length], o = e.axis ?? (e.type === "cumulative" ? "right" : "left"), m = e.period ?? 3, h = "", _;
			if (e.type === "line") _ = Array.from({ length: t }, (t, n) => e.data?.[n] ?? null);
			else {
				let n = this.sourceValues(e.source), r = this.order.map((e) => n[e] ?? null), i;
				switch (e.type) {
					case "sma":
						i = s(r, m);
						break;
					case "ema":
						i = l(r, m);
						break;
					case "wma":
						i = c(r, m);
						break;
					case "linear":
						i = u(r).values;
						break;
					case "exponential": {
						let e = d(r);
						i = e.values, h = ` (${e.growth >= 0 ? "+" : ""}${(e.growth * 100).toFixed(1)}%/período)`;
						break;
					}
					case "average":
						i = p(r);
						break;
					default: i = f(r, e.percent);
				}
				_ = Array(t).fill(null), this.order.forEach((e, t) => _[e] = i[t]), [
					"sma",
					"ema",
					"wma"
				].includes(e.type) && (h = ` (${m})`), e.type === "cumulative" && e.percent && (h = " %");
			}
			let v = this.seriesList.filter((e) => !e.silent), b = v.length > 1 && e.type !== "line", x = e.source === "total" ? "Total" : (this.seriesList.find((t) => this.keyOf(t) === e.source || t.name === e.source) ?? v[0])?.name;
			return {
				overlay: e,
				id: i,
				name: e.name ?? `${y[e.type]}${h}${b && x ? ` · ${x}` : ""}`,
				color: a,
				axis: o,
				values: _
			};
		});
	}
	lineNow(e) {
		if (this.animKind !== "morph" || this.progress >= 1) return e.values;
		let t = this.prevLines.get(e.id);
		if (!t || t.length !== e.values.length) return e.values;
		let n = this.progress;
		return e.values.map((e, r) => e === null || t[r] === null ? e : t[r] + (e - t[r]) * n);
	}
	fmtAxis(e, t) {
		let r = this.axisOpts(t).format;
		if (r) return r(e);
		if (t === "left" && this.opts.stacked === "percent" || this.lines.some((e) => e.axis === t && e.overlay.type === "cumulative" && e.overlay.percent) && t !== "left") return `${+e.toFixed(0)}%`;
		let i = this.scales[t], a = i.ticks.length > 1 ? Math.abs(i.ticks[1] - i.ticks[0]) : 0;
		if (a > 0 && a < 1 && Math.abs(e) < 1e4) {
			let t = 0;
			for (; t < 6 && Math.abs(Math.round(a * 10 ** t) - a * 10 ** t) > 1e-6;) t++;
			return e.toFixed(t);
		}
		return n(e);
	}
	fmtLine(e, t) {
		if (e.overlay.type === "cumulative" && e.overlay.percent) return `${t.toFixed(1)}%`;
		if (e.axis !== "left" && this.axisOpts(e.axis).format) return this.axisOpts(e.axis).format(t);
		let r = this.seriesList.find((t) => this.keyOf(t) === e.overlay.source || t.name === e.overlay.source) ?? this.seriesList[0];
		return this.opts.valueFormatter && r ? this.opts.valueFormatter(t, r) : n(t);
	}
	currentSegments() {
		return this.stacks.segments.map((e, t) => e.map((e, n) => e ? this.animated(e, t, n) : null));
	}
	get stagger() {
		let e = this.opts.animation;
		return typeof e == "object" ? e.stagger ?? 0 : 0;
	}
	catProgress(e) {
		if (!this.animKind) return 1;
		let t = this.posOf.get(e) ?? 0;
		return S(C((this.elapsed - this.stagger * t) / (this.duration() || 1), 0, 1));
	}
	animated(e, t, n) {
		if (!this.animKind) return e;
		let r = this.catProgress(n);
		if (r >= 1) return e;
		if (this.animKind === "reveal") return {
			...e,
			from: e.from * r,
			to: e.to * r
		};
		let i = this.prev?.[t]?.[n];
		return i ? {
			slot: e.slot,
			from: i.from + (e.from - i.from) * r,
			to: i.to + (e.to - i.to) * r
		} : {
			...e,
			from: e.from,
			to: e.from + (e.to - e.from) * r
		};
	}
	aPos(e) {
		let t = this.posOf.get(e) ?? this.shown.length;
		if (this.animKind !== "morph") return t;
		let n = this.prevPos.get(this.categories[e]) ?? this.shown.length;
		return n + (t - n) * this.catProgress(e);
	}
	duration() {
		let e = this.opts.animation ?? !0;
		return e === !1 ? 0 : typeof e == "object" ? e.duration ?? 700 : 700;
	}
	tick() {
		cancelAnimationFrame(this.raf), this.raf = requestAnimationFrame((e) => {
			let t = this.duration(), n = t + this.stagger * Math.max(0, this.shown.length - 1);
			this.elapsed = e - this.animStart, this.progress = S(Math.min(1, this.elapsed / t)), this.elapsed >= n && (this.animKind = null), this.draw(), this.animKind && this.tick();
		});
	}
	resize() {
		let e = this.plotEl.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height)), this.canvas.width = Math.round(this.width * this.dpr), this.canvas.height = Math.round(this.height * this.dpr), this.canvas.style.width = `${this.width}px`, this.canvas.style.height = `${this.height}px`, this.layout(), this.draw();
	}
	fmtCategory(e) {
		let t = this.opts.categoryAxis?.format;
		return t ? t(this.categories[e], e) : this.categories[e] ?? "";
	}
	domainOf(e, n) {
		let r = this.axisOpts(e), i = this.stacks.ranges[e] ?? {
			min: 0,
			max: 0
		}, a = Math.min(0, i.min), o = Math.max(0, i.max);
		if (e === "left") for (let e of this.opts.annotations ?? []) a = Math.min(a, e.value), o = Math.max(o, e.value);
		for (let t of this.lines) if (!(this.hidden.has(t.id) || t.axis !== e)) for (let e of t.values) e !== null && (a = Math.min(a, e), o = Math.max(o, e));
		let s = this.lines.some((t) => t.axis === e && t.overlay.type === "cumulative" && t.overlay.percent);
		(e === "left" && this.opts.stacked === "percent" || s) && (a = Math.min(0, a), o = 100), o === a && (o = a + 1), r.min !== void 0 && (a = r.min), r.max !== void 0 && (o = r.max);
		let c = e === "left" ? this.vbreaks.reduce((e, [t, n]) => e + (n - t), 0) : 0, l = c > 0 ? (o - a) / Math.max(1e-9, o - a - c) : 1, u = t(a, o, Math.round((r.ticks ?? Math.max(2, Math.round(n / 70))) * l)), d = r.min ?? u.min, f = r.max ?? u.max;
		(e === "left" && this.opts.stacked === "percent" || s) && r.max === void 0 && (f = 100);
		let p = u.ticks.filter((t) => t >= d - 1e-9 && t <= f + 1e-9 && !(e === "left" && this.vbreaks.some(([e, n]) => t > e && t < n)));
		return {
			min: d,
			max: f,
			ticks: p
		};
	}
	layout() {
		let e = this.ctx, t = this.opts, n = t.padding ?? 8, r = {
			show: !0,
			grid: !1,
			...t.categoryAxis ?? {}
		}, i = t.labels?.show && (t.labels.position ?? (t.stacked ? "center" : "outside")) === "outside";
		e.font = `11px ${this.theme.font}`, this.used = /* @__PURE__ */ new Set(["left"]), this.seriesList.forEach((e) => !this.hidden.has(this.keyOf(e)) && this.used.add(this.axisOf(e))), this.lines.forEach((e) => !this.hidden.has(e.id) && this.used.add(e.axis)), this.vbreaks = (t.valueAxis?.breaks ?? []).map((e) => [Math.min(e.from, e.to), Math.max(e.from, e.to)]).filter(([e, t]) => t > e).sort((e, t) => e[0] - t[0]);
		let a = this.vertical ? this.height : this.width;
		for (let e of b) this.scales[e] = this.domainOf(e, a);
		if (this.vbreaks.length) {
			let e = this.scales.left, t = e.max - e.min - this.vbreaks.reduce((e, [t, n]) => e + (n - t), 0);
			this.breakGap = Math.max(0, t) * .03;
		}
		let o = (t) => {
			let n = this.axisOpts(t);
			return !this.used.has(t) || !n.show ? 0 : Math.max(...this.scales[t].ticks.map((n) => e.measureText(this.fmtAxis(n, t)).width), 10) + 10 + (n.title ? 16 : 0);
		}, s = this.axisOpts("left"), c = r.show ? Math.min(this.width * .35, Math.max(...this.categories.map((t, n) => e.measureText(this.fmtCategory(n)).width), 10) + 12) : 0, l = i ? 22 : 6, u = typeof t.zoom == "object" && t.zoom.slider && this.vertical && !this.polarCfg;
		if (this.polarCfg) this.plot = {
			x: n,
			y: n + 4,
			w: Math.max(10, this.width - n * 2),
			h: Math.max(10, this.height - n * 2 - 8)
		};
		else if (this.vertical) {
			let e = s.show ? o("left") : 0, t = o("right") + o("right2"), a = (r.show ? 22 : 4) + (r.title ? 16 : 0) + (u ? 44 : 0), c = this.seriesList.some((e) => !this.hidden.has(this.keyOf(e)) && (e.marks?.max || e.marks?.min)) ? 40 : i ? 16 : 6;
			this.plot = {
				x: n + e,
				y: n + c,
				w: Math.max(10, this.width - n * 2 - e - Math.max(4, t)),
				h: Math.max(10, this.height - n * 2 - a - c)
			};
		} else {
			let e = c + (r.title ? 16 : 0), t = (s.show ? 22 : 4) + (s.title ? 16 : 0), i = this.axisOpts("right"), a = this.used.has("right") && i.show ? 20 + (i.title ? 16 : 0) : 4, o = this.seriesList.some((e) => !this.hidden.has(this.keyOf(e)) && (e.marks?.max || e.marks?.min));
			this.plot = {
				x: n + e,
				y: n + a,
				w: Math.max(10, this.width - n * 2 - e - (o ? 44 : l) - 8),
				h: Math.max(10, this.height - n * 2 - t - a)
			};
		}
		this.sliderRect = u ? {
			x: this.plot.x,
			y: this.height - n - 32,
			w: this.plot.w,
			h: 30
		} : null;
	}
	rangeOf(e) {
		let t = this.scales[e], n = this.prevScales?.[e];
		if (this.animKind === "morph" && n) {
			let e = this.progress;
			return {
				min: n.min + (t.min - n.min) * e,
				max: n.max + (t.max - n.max) * e
			};
		}
		return t;
	}
	vc(e) {
		let t = e;
		for (let [n, r] of this.vbreaks) {
			let i = this.breakGap / (r - n);
			e >= r ? t -= r - n - this.breakGap : e > n && (t -= (e - n) * (1 - i));
		}
		return t;
	}
	vPx(e, t = "left") {
		let { min: n, max: r } = this.rangeOf(t), i = (e) => t === "left" ? this.vc(e) : e, a = (i(e) - i(n)) / (i(r) - i(n) || 1);
		return this.vertical ? this.plot.y + this.plot.h - a * this.plot.h : this.plot.x + a * this.plot.w;
	}
	get viewRange() {
		return this.view ?? [0, Math.max(1, this.shown.length)];
	}
	band(e) {
		let t = this.vertical ? this.plot.w : this.plot.h, n = this.vertical ? this.plot.x : this.plot.y;
		if (this.mekko && !this.view) {
			let r = this.shown.length, i = C(Math.floor(e), 0, Math.max(0, r - 1)), a = this.mekko[i + 1] - this.mekko[i];
			return {
				start: n + (this.mekko[i] + (e - i) * a) * t,
				size: a * t
			};
		}
		let [r, i] = this.viewRange, a = t / (i - r);
		return {
			start: n + (e - r) * a,
			size: a
		};
	}
	draw() {
		let e = this.ctx, t = this.theme, n = this.plot, r = this.opts;
		e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.clearRect(0, 0, this.width, this.height), t.background !== "transparent" && (e.fillStyle = t.background, e.fillRect(0, 0, this.width, this.height)), this.drawn = [];
		let i = this.seriesList.some((e) => !this.hidden.has(this.keyOf(e)));
		if (this.polarCfg) this.drawPolar(), this.drawGraphic();
		else if (this.drawGrid(), !i || !this.categories.length) e.fillStyle = t.muted, e.font = `13px ${t.font}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(r.emptyText ?? "Sem dados", n.x + n.w / 2, n.y + n.h / 2), this.drawAxes();
		else {
			if (this.hoverCat >= 0 && this.posOf.has(this.hoverCat)) {
				let r = this.band(this.aPos(this.hoverCat));
				e.fillStyle = t.hover, this.vertical ? e.fillRect(r.start, n.y, r.size, n.h) : e.fillRect(n.x, r.start, n.w, r.size);
			}
			e.save(), (this.view || this.opts.limit) && (e.beginPath(), e.rect(n.x, n.y - 20, n.w, n.h + 40), e.clip()), this.drawBackgrounds(), this.drawBars(), this.drawLines(), e.restore(), this.drawMarks(), r.labels?.show && this.drawLabels(), this.drawBreaks(), this.drawAnnotations(), this.drawGraphic(), this.drawAxes(), this.drawBrush(), this.drawSlider();
		}
	}
	visibleCats() {
		let [e, t] = this.viewRange, n = [];
		if (this.animKind === "morph" || this.mekko) {
			for (let e of this.shown) n.push({
				c: e,
				pos: this.aPos(e)
			});
			return n;
		}
		for (let r = Math.max(0, Math.floor(e)); r < Math.min(this.shown.length, Math.ceil(t)); r++) n.push({
			c: this.shown[r],
			pos: r
		});
		return n;
	}
	barThickness() {
		let e = this.opts, t = e.categoryGap ?? .25, n = e.barGap ?? 3;
		return (r, a) => {
			let o = this.band(r);
			return i(o.start, o.size, a, this.stacks.slots, t, o.size < 6 ? 0 : n, e.maxBarWidth);
		};
	}
	drawBackgrounds() {
		let e = this.ctx, t = this.barThickness();
		this.seriesList.forEach((n, r) => {
			if (!n.background || this.hidden.has(this.keyOf(n))) return;
			let i = this.axisOf(n), { min: a, max: o } = this.rangeOf(i), s = this.vPx(Math.max(a, Math.min(0, o)), i), c = this.vPx(o, i);
			e.fillStyle = typeof n.background == "string" ? n.background : E(this.theme.muted, .14);
			for (let { c: n, pos: i } of this.visibleCats()) {
				let a = this.stacks.segments[r]?.[n];
				if (!a) continue;
				let o = t(i, a.slot), l = Math.min(this.opts.radius ?? 3, o.size / 2);
				e.beginPath(), this.vertical ? e.roundRect(o.start, Math.min(s, c), o.size, Math.abs(c - s), [
					l,
					l,
					0,
					0
				]) : e.roundRect(Math.min(s, c), o.start, Math.abs(c - s), o.size, [
					0,
					l,
					l,
					0
				]), e.fill();
			}
		});
	}
	drawBars() {
		let e = this.ctx, t = this.opts, n = t.radius ?? 3, r = this.barThickness(), i = this.visibleCats(), a = /* @__PURE__ */ new Map();
		this.stacks.segments.forEach((e, t) => {
			this.seriesList[t]?.silent || e.forEach((e, n) => {
				e && a.set(`${e.slot}|${n}|${e.to >= e.from ? "+" : "-"}`, t);
			});
		}), this.seriesList.forEach((o, s) => {
			let c = this.stacks.segments[s];
			if (!c) return;
			let l = this.keyOf(o), u = this.axisOf(o), d = this.colorOf(o, s), f = this.highlighted && this.highlighted !== l ? t.hoverDim ?? .3 : 1;
			for (let { c: l, pos: p } of i) {
				let i = c[l];
				if (!i) continue;
				let m = this.animated(i, s, l), h = r(p, m.slot), g = this.vPx(m.from, u), _ = this.vPx(m.to, u), v = this.vals[s][l] ?? 0, y = this.items[s][l], b = i.to >= i.from, x = b || !o.negativeColor ? d : o.negativeColor;
				t.colorBy && (x = t.colorBy(v, l, o)), y?.color && (x = y.color);
				let S = a.get(`${i.slot}|${l}|${b ? "+" : "-"}`) === s ? Math.min(n, h.size / 2, Math.abs(_ - g)) : 0, C, w;
				this.vertical ? (C = {
					x: h.start,
					y: Math.min(g, _),
					w: h.size,
					h: Math.max(.5, Math.abs(_ - g))
				}, w = b ? [
					S,
					S,
					0,
					0
				] : [
					0,
					0,
					S,
					S
				]) : (C = {
					x: Math.min(g, _),
					y: h.start,
					w: Math.max(.5, Math.abs(_ - g)),
					h: h.size
				}, w = b ? [
					0,
					S,
					S,
					0
				] : [
					S,
					0,
					0,
					S
				]);
				let T = this.stacks.totals[l] || 1, E = {
					series: o,
					seriesIndex: s,
					categoryIndex: l,
					category: this.categories[l],
					value: v,
					color: x,
					percent: Math.abs(v) / T * 100,
					item: y ?? void 0
				};
				if (o.silent) continue;
				let D = this.selected && !this.selected.has(`${s}|${l}`) ? .25 : 1, O = this.hoverBar && this.hoverBar.datum.seriesIndex === s && this.hoverBar.datum.categoryIndex === l;
				e.save(), e.globalAlpha = f * D * (y?.opacity ?? 1);
				let k = y?.gradient ?? o.gradient;
				if (k && k.length) {
					let t = this.vertical ? b ? C.y : C.y + C.h : b ? C.x + C.w : C.x, n = this.vertical ? b ? C.y + C.h : C.y : b ? C.x : C.x + C.w, r = this.vertical ? e.createLinearGradient(0, t, 0, n) : e.createLinearGradient(t, 0, n, 0), i = k.length === 1 ? [k[0], k[0]] : k;
					i.forEach((e, t) => r.addColorStop(t / (i.length - 1), e)), e.fillStyle = r;
				} else e.fillStyle = x;
				e.beginPath(), C.w < 1.5 || C.h < 1.5 || S === 0 ? e.rect(C.x, C.y, C.w, C.h) : e.roundRect(C.x, C.y, C.w, C.h, w), e.fill();
				let A = y?.borderWidth ?? o.borderWidth, j = y?.borderColor ?? o.borderColor;
				A && j && (e.lineWidth = A, e.strokeStyle = j, e.stroke()), O && (e.fillStyle = "rgba(255,255,255,0.15)", e.fill()), e.restore(), this.drawn.push({
					rect: C,
					datum: E
				});
			}
		});
	}
	drawGrid() {
		let e = this.ctx, t = this.plot, n = (e) => (Math.round(e * this.dpr) + .5) / this.dpr;
		e.save(), e.strokeStyle = this.theme.grid, e.lineWidth = 1 / this.dpr, e.beginPath();
		for (let r of b) if (this.used.has(r) && this.axisOpts(r).grid) for (let i of this.scales[r].ticks) {
			let a = n(this.vPx(i, r));
			this.vertical ? (e.moveTo(t.x, a), e.lineTo(t.x + t.w, a)) : (e.moveTo(a, t.y), e.lineTo(a, t.y + t.h));
		}
		if (this.opts.categoryAxis?.grid) for (let { pos: r } of this.visibleCats()) {
			let i = n(this.band(r).start);
			this.vertical ? (e.moveTo(i, t.y), e.lineTo(i, t.y + t.h)) : (e.moveTo(t.x, i), e.lineTo(t.x + t.w, i));
		}
		e.stroke(), e.restore();
	}
	drawBreaks() {
		if (!this.vbreaks.length) return;
		let e = this.ctx, t = this.plot, { min: n, max: r } = this.rangeOf("left");
		e.save();
		for (let [i, a] of this.vbreaks) {
			if (a <= n || i >= r) continue;
			let o = (this.vPx(i) + this.vPx(a)) / 2, s = (n) => {
				e.beginPath();
				let r = this.vertical ? t.w : t.h;
				for (let i = 0; i <= r; i += 6) {
					let r = i / 6 % 2 == 0 ? -3 : 3, a = (this.vertical ? t.x : t.y) + i, s = o + n + r;
					i === 0 ? this.vertical ? e.moveTo(a, s) : e.moveTo(s, a) : this.vertical ? e.lineTo(a, s) : e.lineTo(s, a);
				}
			};
			e.fillStyle = this.theme.background === "transparent" ? "rgba(0,0,0,0.5)" : this.theme.background, s(-4), this.vertical ? (e.lineTo(t.x + t.w, o + 4), e.lineTo(t.x, o + 4)) : (e.lineTo(o + 4, t.y + t.h), e.lineTo(o + 4, t.y)), e.closePath(), e.fill(), e.strokeStyle = this.theme.muted, e.lineWidth = 1, s(-4), e.stroke(), s(4), e.stroke();
		}
		e.restore();
	}
	fmtLabel(e, t) {
		let r = this.opts;
		return t.item?.label === void 0 ? r.labels?.format ? r.labels.format(e, t) : r.stacked === "percent" ? `${t.percent.toFixed(0)}%` : r.valueFormatter ? r.valueFormatter(e, t.series) : n(e) : t.item.label;
	}
	labelValue(e) {
		if (!this.animKind || this.opts.stacked === "percent") return e.datum.value;
		let t = this.stacks.segments[e.datum.seriesIndex]?.[e.datum.categoryIndex];
		if (!t) return e.datum.value;
		let n = this.animated(t, e.datum.seriesIndex, e.datum.categoryIndex), r = n.to - n.from, i = e.datum.value;
		return Number.isInteger(i) ? Math.round(r) : +r.toFixed(2);
	}
	drawLabels() {
		let e = this.ctx, t = this.opts, n = t.labels, r = n.position ?? (t.stacked ? "center" : "outside"), i = (n.rotate ?? 0) * Math.PI / 180;
		e.save(), e.font = `600 ${n.fontSize ?? 11}px ${this.theme.font}`;
		for (let t of this.drawn) {
			let a = t.rect, o = this.fmtLabel(this.labelValue(t), t.datum), s = e.measureText(o).width, c = t.datum.value >= 0, l, u, d = "center", f = n.color ?? this.theme.text, p = n.color ?? T(typeof t.datum.color == "string" ? t.datum.color : "#000000"), m = this.vertical ? a.h : a.w, h = this.vertical ? a.w : a.h, g = i ? h + 6 >= (n.fontSize ?? 11) && m >= s + 6 : (this.vertical ? h : m) >= s + 6;
			if (this.vertical) {
				if (l = a.x + a.w / 2, r === "center" ? (u = a.y + a.h / 2, f = p) : r === "inside" ? (u = c ? a.y + (i ? s / 2 + 6 : 9) : a.y + a.h - (i ? s / 2 + 6 : 9), f = p) : r === "base" ? (u = c ? a.y + a.h - (i ? s / 2 + 6 : 9) : a.y + (i ? s / 2 + 6 : 9), f = p) : u = c ? a.y - (i ? s / 2 + 6 : 8) : a.y + a.h + (i ? s / 2 + 6 : 8), r !== "outside" && (!g || a.h < 14) || r === "outside" && !i && s > a.w + 30) continue;
			} else if (u = a.y + a.h / 2, r === "center" ? (l = a.x + a.w / 2, f = p) : r === "inside" ? (l = c ? a.x + a.w - 6 : a.x + 6, f = p, d = c ? "right" : "left") : r === "base" ? (l = c ? a.x + 6 : a.x + a.w - 6, f = p, d = c ? "left" : "right") : (l = c ? a.x + a.w + 6 : a.x - 6, d = c ? "left" : "right"), r !== "outside" && (s > a.w - 8 || a.h < 12)) continue;
			e.fillStyle = f, e.textBaseline = "middle", i ? (e.save(), e.translate(l, u), e.rotate(-i), e.textAlign = "center", e.fillText(o, 0, 0), e.restore()) : (e.textAlign = d, e.fillText(o, l, u));
		}
		e.restore();
	}
	drawMarks() {
		let e = this.ctx, t = this.plot;
		this.seriesList.forEach((r, i) => {
			let a = r.marks;
			if (!a || this.hidden.has(this.keyOf(r))) return;
			let o = this.drawn.filter((e) => e.datum.seriesIndex === i);
			if (!o.length) return;
			let s = this.colorOf(r, i), c = this.axisOf(r), l = (e) => this.opts.valueFormatter ? this.opts.valueFormatter(e, r) : n(e);
			if (e.save(), e.globalAlpha = this.animKind ? this.progress : 1, a.average) {
				let n = this.shown.map((e) => this.vals[i][e]).filter((e) => e !== null), r = n.reduce((e, t) => e + t, 0) / (n.length || 1), a = Math.round(this.vPx(r, c)) + .5;
				e.strokeStyle = s, e.setLineDash([5, 4]), e.beginPath(), this.vertical ? (e.moveTo(t.x, a), e.lineTo(t.x + t.w, a)) : (e.moveTo(a, t.y), e.lineTo(a, t.y + t.h)), e.stroke(), e.setLineDash([]), e.font = `600 11px ${this.theme.font}`, e.fillStyle = s, e.textAlign = "right", e.textBaseline = "bottom", this.vertical ? e.fillText(`Média ${l(Math.round(r * 100) / 100)}`, t.x + t.w - 2, a - 3) : e.fillText(`Média ${l(Math.round(r * 100) / 100)}`, a - 3, t.y + 12);
			}
			let u = (t) => {
				let n = t.rect, r = t.datum.value >= 0, i = this.vertical ? n.x + n.w / 2 : r ? n.x + n.w : n.x, a = this.vertical ? r ? n.y : n.y + n.h : n.y + n.h / 2, o = l(t.datum.value);
				e.font = `700 10px ${this.theme.font}`;
				let c = Math.max(12, e.measureText(o).width / 2 + 5), u = Math.acos(1 / 1.75), d = !this.vertical || r, f = this.vertical ? i : i + (r ? c * 1.75 : -c * 1.75), p = this.vertical ? d ? a - c * 1.75 : a + c * 1.75 : a, m = this.vertical ? d ? Math.PI / 2 : -Math.PI / 2 : r ? Math.PI : 0;
				e.fillStyle = s, e.beginPath(), e.arc(f, p, c, m + u, m - u), e.lineTo(i, a), e.closePath(), e.fill(), e.fillStyle = T(s), e.textAlign = "center", e.textBaseline = "middle", e.fillText(o, f, p + .5);
			};
			a.max && u(o.reduce((e, t) => t.datum.value > e.datum.value ? t : e, o[0])), a.min && u(o.reduce((e, t) => t.datum.value < e.datum.value ? t : e, o[0])), e.restore();
		});
	}
	drawLines() {
		let e = this.ctx, t = this.plot;
		for (let n of this.lines) {
			if (this.hidden.has(n.id)) continue;
			let r = this.lineNow(n), i = [[]];
			for (let e of this.shown) {
				let t = this.aPos(e), a = r[e];
				if (a == null) {
					i[i.length - 1].length && i.push([]);
					continue;
				}
				let o = this.band(t), s = o.start + o.size / 2, c = this.vPx(a, n.axis);
				i[i.length - 1].push(this.vertical ? {
					x: s,
					y: c,
					c: e
				} : {
					x: c,
					y: s,
					c: e
				});
			}
			for (let e of i) e.sort((e, t) => this.vertical ? e.x - t.x : e.y - t.y);
			let a = n.overlay.smooth ?? [
				"sma",
				"ema",
				"wma",
				"cumulative"
			].includes(n.overlay.type), o = this.highlighted && this.highlighted !== n.id ? this.opts.hoverDim ?? .3 : 1;
			e.save(), this.animKind === "reveal" && this.progress < 1 && (e.beginPath(), this.vertical ? e.rect(t.x, 0, t.w * this.progress, this.height) : e.rect(0, t.y, this.width, t.h * this.progress), e.clip()), e.globalAlpha = o, e.strokeStyle = n.color, e.lineWidth = n.overlay.width ?? 2, e.lineJoin = "round", e.lineCap = "round", e.setLineDash(n.overlay.dash ?? (["linear", "exponential"].includes(n.overlay.type) ? [7, 5] : n.overlay.type === "average" ? [3, 4] : []));
			for (let t of ["halo", "line"]) {
				e.save(), t === "halo" && (e.strokeStyle = "rgba(0,0,0,0.35)", e.lineWidth = (n.overlay.width ?? 2) + 3);
				for (let e of i) this.strokePath(e, a);
				e.restore();
			}
			e.setLineDash([]);
			for (let t of i) for (let r of t) {
				let t = r.c === this.hoverCat;
				(n.overlay.points || t) && (e.fillStyle = t ? n.color : this.theme.background === "transparent" ? "rgba(0,0,0,0.6)" : this.theme.background, e.strokeStyle = n.color, e.lineWidth = 2, e.beginPath(), e.arc(r.x, r.y, t ? 4.5 : 3, 0, Math.PI * 2), e.fill(), e.stroke());
			}
			e.restore();
		}
	}
	strokePath(t, n) {
		let r = this.ctx;
		if (t.length) {
			if (r.beginPath(), r.moveTo(t[0].x, t[0].y), n && t.length > 2) {
				let n = t.map((e) => this.vertical ? e.x : e.y), i = t.map((e) => this.vertical ? e.y : e.x), a = e(n, i);
				for (let e = 0; e < t.length - 1; e++) {
					let i = (n[e + 1] - n[e]) / 3;
					this.vertical ? r.bezierCurveTo(t[e].x + i, t[e].y + a[e] * i, t[e + 1].x - i, t[e + 1].y - a[e + 1] * i, t[e + 1].x, t[e + 1].y) : r.bezierCurveTo(t[e].x + a[e] * i, t[e].y + i, t[e + 1].x - a[e + 1] * i, t[e + 1].y - i, t[e + 1].x, t[e + 1].y);
				}
			} else for (let e of t.slice(1)) r.lineTo(e.x, e.y);
			t.length === 1 && r.lineTo(t[0].x + .01, t[0].y), r.stroke();
		}
	}
	drawAnnotations() {
		let e = this.ctx, t = this.plot;
		e.save(), e.font = `600 11px ${this.theme.font}`;
		for (let n of this.opts.annotations ?? []) {
			let r = Math.round(this.vPx(n.value)) + .5, i = n.color ?? "#f23645";
			if (e.strokeStyle = i, e.lineWidth = 1, e.setLineDash(n.dash ?? [5, 4]), e.beginPath(), this.vertical ? (e.moveTo(t.x, r), e.lineTo(t.x + t.w, r)) : (e.moveTo(r, t.y), e.lineTo(r, t.y + t.h)), e.stroke(), n.label) {
				e.setLineDash([]);
				let a = e.measureText(n.label).width + 10;
				e.fillStyle = i, e.beginPath(), this.vertical ? e.roundRect(t.x + t.w - a, r - 9, a, 18, 3) : e.roundRect(r - a / 2, t.y - 2, a, 18, 3), e.fill(), e.fillStyle = "#fff", e.textAlign = "center", e.textBaseline = "middle", this.vertical ? e.fillText(n.label, t.x + t.w - a / 2, r + .5) : e.fillText(n.label, r, t.y + 7.5);
			}
		}
		e.restore();
	}
	drawGraphic() {
		let e = this.opts.graphic;
		if (!e) return;
		let t = {
			plot: { ...this.plot },
			width: this.width,
			height: this.height,
			theme: this.theme,
			vertical: this.vertical,
			category: (e) => {
				let t = typeof e == "number" ? e : this.categories.indexOf(e), n = this.band(this.aPos(t));
				return n.start + n.size / 2;
			},
			value: (e, t = "left") => this.vPx(e, t)
		};
		this.ctx.save(), e(this.ctx, t), this.ctx.restore();
	}
	drawAxes() {
		let e = this.ctx, t = this.plot, n = this.theme, r = this.axisOpts("left"), i = {
			show: !0,
			...this.opts.categoryAxis ?? {}
		};
		e.save(), e.font = `11px ${n.font}`;
		let { min: a, max: o } = this.rangeOf("left"), s = Math.round(this.vPx(Math.min(Math.max(0, a), o))) + .5;
		if (e.strokeStyle = n.axis, e.lineWidth = 1, e.beginPath(), this.vertical ? (e.moveTo(t.x, s), e.lineTo(t.x + t.w, s)) : (e.moveTo(s, t.y), e.lineTo(s, t.y + t.h)), e.stroke(), e.fillStyle = n.muted, r.show) for (let n of this.scales.left.ticks) {
			let r = this.vPx(n);
			this.vertical ? (e.textAlign = "right", e.textBaseline = "middle", e.fillText(this.fmtAxis(n, "left"), t.x - 8, r)) : (e.textAlign = "center", e.textBaseline = "top", e.fillText(this.fmtAxis(n, "left"), r, t.y + t.h + 6));
		}
		let c = 0;
		for (let r of ["right", "right2"]) {
			let i = this.axisOpts(r);
			if (!this.used.has(r) || !i.show) continue;
			e.font = `11px ${n.font}`, e.fillStyle = n.muted;
			let a = Math.max(...this.scales[r].ticks.map((t) => e.measureText(this.fmtAxis(t, r)).width), 10) + 10 + (i.title ? 16 : 0);
			for (let n of this.scales[r].ticks) {
				let i = this.vPx(n, r);
				this.vertical ? (e.textAlign = "left", e.textBaseline = "middle", e.fillText(this.fmtAxis(n, r), t.x + t.w + 8 + c, i)) : (e.textAlign = "center", e.textBaseline = "bottom", e.fillText(this.fmtAxis(n, r), i, t.y - 6));
			}
			this.vertical && c > 0 && (e.strokeStyle = n.axis, e.beginPath(), e.moveTo(t.x + t.w + c + 2.5, t.y), e.lineTo(t.x + t.w + c + 2.5, t.y + t.h), e.stroke()), i.title && (e.save(), e.font = `600 11px ${n.font}`, e.textAlign = "center", e.textBaseline = "middle", this.vertical ? (e.translate(t.x + t.w + c + a - 4, t.y + t.h / 2), e.rotate(Math.PI / 2), e.fillText(i.title, 0, 0)) : e.fillText(i.title, t.x + t.w / 2, (this.opts.padding ?? 8) + 6), e.restore()), c += a;
		}
		if (e.font = `11px ${n.font}`, i.show) {
			let r = this.visibleCats(), a = this.band(r[0]?.pos ?? 0);
			if (i.ticks) {
				e.strokeStyle = n.axis, e.beginPath();
				for (let { pos: n } of r) {
					let r = this.band(n), a = i.ticks === "center" ? r.start + r.size / 2 : r.start;
					this.vertical ? (e.moveTo(Math.round(a) + .5, t.y + t.h), e.lineTo(Math.round(a) + .5, t.y + t.h + 5)) : (e.moveTo(t.x, Math.round(a) + .5), e.lineTo(t.x - 5, Math.round(a) + .5));
				}
				e.stroke();
			}
			if (this.vertical) {
				let o = Math.max(...r.map(({ c: t }) => e.measureText(this.fmtCategory(t)).width), 1), s = this.mekko ? 1 : Math.max(1, Math.ceil((o + 8) / Math.max(1e-6, a.size)));
				e.textAlign = "center", e.textBaseline = "top", r.forEach(({ c: r, pos: a }, o) => {
					if (o % s) return;
					let c = this.band(a), l = c.start + c.size / 2;
					l < t.x - 1 || l > t.x + t.w + 1 || (e.fillStyle = r === this.hoverCat ? n.text : n.muted, e.fillText(this.fmtCategory(r), l, t.y + t.h + (i.ticks ? 8 : 6)));
				});
			} else {
				let i = Math.max(1, Math.ceil(14 / Math.max(1e-6, a.size)));
				e.textAlign = "right", e.textBaseline = "middle", r.forEach(({ c: r, pos: a }, o) => {
					if (o % i) return;
					let s = this.band(a), c = s.start + s.size / 2;
					if (c < t.y - 1 || c > t.y + t.h + 1) return;
					e.fillStyle = r === this.hoverCat ? n.text : n.muted;
					let l = this.fmtCategory(r), u = t.x - (this.opts.padding ?? 8) - 10;
					for (; l.length > 3 && e.measureText(l).width > u;) l = l.slice(0, -2) + "…";
					e.fillText(l, t.x - 8, c);
				});
			}
		}
		e.font = `600 11px ${n.font}`, e.fillStyle = n.muted;
		let l = this.vertical ? i.title : r.title, u = this.vertical ? r.title : i.title;
		l && (e.textAlign = "center", e.textBaseline = "top", e.fillText(l, t.x + t.w / 2, t.y + t.h + 22)), u && (e.translate((this.opts.padding ?? 8) + 6, t.y + t.h / 2), e.rotate(-Math.PI / 2), e.textAlign = "center", e.textBaseline = "middle", e.fillText(u, 0, 0)), e.restore();
	}
	drawBrush() {
		let e = this.brushRect;
		if (!e) return;
		let t = this.ctx;
		t.save(), t.fillStyle = "rgba(41, 98, 255, 0.12)", t.strokeStyle = "#2962ff", t.setLineDash([4, 3]);
		let n = Math.min(e.x0, e.x1), r = Math.min(e.y0, e.y1);
		t.fillRect(n, r, Math.abs(e.x1 - e.x0), Math.abs(e.y1 - e.y0)), t.strokeRect(n + .5, r + .5, Math.abs(e.x1 - e.x0), Math.abs(e.y1 - e.y0)), t.restore();
	}
	sliderWindow() {
		let e = this.sliderRect, t = Math.max(1, this.shown.length), [n, r] = this.viewRange;
		return [e.x + n / t * e.w, e.x + r / t * e.w];
	}
	drawSlider() {
		let e = this.sliderRect;
		if (!e) return;
		let t = this.ctx, n = this.theme, r = Math.max(1, this.shown.length);
		t.save(), t.fillStyle = E(n.muted, .08), t.strokeStyle = E(n.muted, .35), t.beginPath(), t.roundRect(e.x + .5, e.y + .5, e.w - 1, e.h - 1, 4), t.fill(), t.stroke();
		let i = this.seriesList.findIndex((e) => !e.silent && !this.hidden.has(this.keyOf(e)));
		if (i >= 0) {
			let n = this.shown.map((e) => Math.abs(this.vals[i]?.[e] ?? 0)), a = Math.max(...n, 1e-9);
			t.fillStyle = E(this.colorOf(this.seriesList[i], i), .45);
			let o = Math.min(r, Math.floor(e.w));
			for (let i = 0; i < o; i++) {
				let s = Math.floor(i * r / o), c = Math.max(s + 1, Math.floor((i + 1) * r / o)), l = 0;
				for (let e = s; e < c; e++) l = Math.max(l, n[e]);
				let u = l / a * (e.h - 6);
				t.fillRect(e.x + i * e.w / o, e.y + e.h - 3 - u, Math.max(1, e.w / o - +(o < e.w / 3)), u);
			}
		}
		let [a, o] = this.sliderWindow();
		t.fillStyle = "rgba(0, 0, 0, 0.28)", t.fillRect(e.x, e.y, Math.max(0, a - e.x), e.h), t.fillRect(o, e.y, Math.max(0, e.x + e.w - o), e.h), t.fillStyle = E("#2962ff", .14), t.fillRect(a, e.y, o - a, e.h), t.strokeStyle = "#2962ff", t.strokeRect(a + .5, e.y + .5, Math.max(1, o - a - 1), e.h - 1);
		for (let n of [a, o]) t.fillStyle = "#2962ff", t.beginPath(), t.roundRect(n - 4, e.y + e.h / 2 - 10, 8, 20, 3), t.fill();
		t.restore();
	}
	inSlider(e, t) {
		let n = this.sliderRect;
		return !!n && e >= n.x - 6 && e <= n.x + n.w + 6 && t >= n.y - 4 && t <= n.y + n.h + 4;
	}
	sliderMove(e) {
		let t = this.sliderDrag, n = this.sliderRect, r = Math.max(1, this.shown.length), i = (e - t.x) / n.w * r, [a, o] = t.view, s = Math.min(r, 2);
		if (t.mode === "move") {
			let e = o - a;
			a = C(a + i, 0, r - e), o = a + e;
		} else t.mode === "l" ? a = C(a + i, 0, o - s) : o = C(o + i, a + s, r);
		this.view = o - a >= r - 1e-9 ? null : [a, o], this.clearHover(), this.draw();
	}
	clearHover() {
		this.hoverCat = -1, this.hoverBar = null, this.tooltipEl.classList.remove("is-visible");
	}
	get polarCfg() {
		let e = this.opts.polar;
		if (!e) return null;
		let t = typeof e == "object" ? e : {}, n = t.startAngle ?? 0, r = t.endAngle ?? n + 360;
		return {
			cats: t.categories ?? "radius",
			a0: w(n),
			a1: w(r),
			inner: C(t.innerRadius ?? 0, 0, .9),
			round: t.roundCap ?? !1
		};
	}
	polarGeom() {
		let e = this.plot, t = Math.max(10, Math.min(e.w, e.h) / 2 - 26);
		return {
			cx: e.x + e.w / 2,
			cy: e.y + e.h / 2,
			R: t,
			r0: t * this.polarCfg.inner
		};
	}
	vFrac(e) {
		let { min: t, max: n } = this.rangeOf("left");
		return C((e - t) / (n - t || 1), 0, 1);
	}
	sectorPath(e, t, n, r) {
		let { cx: i, cy: a } = this.polarGeom(), o = this.ctx;
		o.beginPath(), o.arc(i, a, Math.max(e, t), n, r), o.arc(i, a, Math.min(e, t), r, n, !0), o.closePath();
	}
	drawPolar() {
		let e = this.ctx, t = this.opts, n = this.theme, r = this.polarCfg, { cx: a, cy: o, R: s, r0: c } = this.polarGeom(), l = Math.max(1, this.shown.length), u = r.a1 - r.a0, d = t.categoryGap ?? .25, f = this.scales.left.ticks;
		e.save(), e.lineWidth = 1, e.font = `11px ${n.font}`, e.fillStyle = n.muted, e.strokeStyle = n.grid;
		let p = Math.abs(u) >= Math.PI * 2 - 1e-6;
		if (r.cats === "angle") {
			for (let t of f) {
				let n = c + this.vFrac(t) * (s - c);
				e.beginPath(), e.arc(a, o, n, r.a0, r.a1), e.stroke();
			}
			for (let t = 0; t <= l && !(p && t === l); t++) {
				let n = r.a0 + t / l * u;
				e.beginPath(), e.moveTo(a + Math.cos(n) * c, o + Math.sin(n) * c), e.lineTo(a + Math.cos(n) * s, o + Math.sin(n) * s), e.stroke();
			}
			e.textAlign = "center", e.textBaseline = "middle", this.shown.forEach((t, i) => {
				let c = r.a0 + (i + .5) / l * u;
				e.fillStyle = t === this.hoverCat ? n.text : n.muted, e.fillText(this.fmtCategory(t), a + Math.cos(c) * (s + 14), o + Math.sin(c) * (s + 14));
			}), e.fillStyle = n.muted, e.textAlign = "left";
			for (let t of f) {
				let n = c + this.vFrac(t) * (s - c);
				e.fillText(this.fmtAxis(t, "left"), a + Math.cos(r.a0) * n + 3, o + Math.sin(r.a0) * n - 6);
			}
		} else {
			let t = (s - c) / l;
			for (let n = 0; n <= l; n++) e.beginPath(), e.arc(a, o, c + n * t, r.a0, r.a1), e.stroke();
			e.textAlign = "center", e.textBaseline = "middle";
			for (let t of f) {
				let i = r.a0 + this.vFrac(t) * u;
				e.strokeStyle = n.grid, e.beginPath(), e.moveTo(a + Math.cos(i) * c, o + Math.sin(i) * c), e.lineTo(a + Math.cos(i) * s, o + Math.sin(i) * s), e.stroke(), !(p && Math.abs(this.vFrac(t) - 1) < 1e-9) && (e.fillStyle = n.muted, e.fillText(this.fmtAxis(t, "left"), a + Math.cos(i) * (s + 14), o + Math.sin(i) * (s + 14)));
			}
			e.textAlign = "right", this.shown.forEach((i, s) => {
				let l = c + (s + .5) * t;
				e.fillStyle = i === this.hoverCat ? n.text : n.muted, e.fillText(this.fmtCategory(i), a + Math.cos(r.a0) * l - 6, o + Math.sin(r.a0) * l);
			});
		}
		let m = t.radius ?? 0;
		if (this.seriesList.forEach((f, p) => {
			let h = this.stacks.segments[p];
			if (!h || f.silent) return;
			let g = this.colorOf(f, p), _ = this.highlighted && this.highlighted !== this.keyOf(f) ? t.hoverDim ?? .3 : 1;
			this.shown.forEach((v, y) => {
				let b = h[v];
				if (!b) return;
				let x = this.animated(b, p, v), S = this.items[p][v], C = this.vals[p][v] ?? 0, w = b.to >= b.from || !f.negativeColor ? g : f.negativeColor;
				t.colorBy && (w = t.colorBy(C, v, f)), S?.color && (w = S.color);
				let T, E, D, O;
				if (r.cats === "angle") {
					let e = u / l, t = i(r.a0 + y * e, e, x.slot, this.stacks.slots, d, 0, void 0);
					D = t.start, O = t.start + t.size, T = c + this.vFrac(x.from) * (s - c), E = c + this.vFrac(x.to) * (s - c);
				} else {
					let e = (s - c) / l, t = i(c + y * e, e, x.slot, this.stacks.slots, d, 0, void 0);
					T = t.start, E = t.start + t.size, D = r.a0 + this.vFrac(x.from) * u, O = r.a0 + this.vFrac(x.to) * u;
				}
				let k = this.hoverBar && this.hoverBar.datum.seriesIndex === p && this.hoverBar.datum.categoryIndex === v;
				e.save(), e.globalAlpha = _ * (S?.opacity ?? 1) * (this.selected && !this.selected.has(`${p}|${v}`) ? .25 : 1), e.fillStyle = w, r.round && r.cats === "radius" && Math.abs(O - D) > .001 ? (e.strokeStyle = w, e.lineWidth = Math.abs(E - T), e.lineCap = "round", e.beginPath(), e.arc(a, o, (T + E) / 2, Math.min(D, O), Math.max(D, O)), e.stroke()) : (this.sectorPath(T, E, Math.min(D, O), Math.max(D, O)), e.fill(), m > 0 && (e.strokeStyle = n.background === "transparent" ? "rgba(0,0,0,0.2)" : n.background, e.lineWidth = 1, e.stroke())), k && (e.fillStyle = "rgba(255,255,255,0.15)", this.sectorPath(T, E, Math.min(D, O), Math.max(D, O)), e.fill()), e.restore();
				let A = this.stacks.totals[v] || 1;
				this.drawn.push({
					rect: {
						x: 0,
						y: 0,
						w: 0,
						h: 0
					},
					sector: {
						r0: Math.min(T, E),
						r1: Math.max(T, E),
						a0: Math.min(D, O),
						a1: Math.max(D, O)
					},
					datum: {
						series: f,
						seriesIndex: p,
						categoryIndex: v,
						category: this.categories[v],
						value: C,
						color: w,
						percent: Math.abs(C) / A * 100,
						item: S ?? void 0
					}
				});
			});
		}), t.labels?.show) {
			let i = t.labels, s = i.position ?? (t.stacked ? "center" : "outside");
			e.font = `600 ${i.fontSize ?? 11}px ${n.font}`, e.textAlign = "center", e.textBaseline = "middle";
			for (let t of this.drawn) {
				let c = t.sector, l = this.fmtLabel(this.labelValue(t), t.datum), u, d;
				if (r.cats === "angle") d = (c.a0 + c.a1) / 2, u = s === "outside" ? c.r1 + 10 : s === "inside" ? c.r1 - 10 : s === "base" ? c.r0 + 10 : (c.r0 + c.r1) / 2;
				else {
					u = (c.r0 + c.r1) / 2;
					let e = 12 / Math.max(1, u);
					d = s === "outside" ? c.a1 + e * 1.6 : s === "inside" ? c.a1 - e * 1.6 : s === "base" ? c.a0 + e * 1.6 : (c.a0 + c.a1) / 2;
				}
				e.fillStyle = s === "outside" ? i.color ?? n.text : i.color ?? T(t.datum.color), e.fillText(l, a + Math.cos(d) * u, o + Math.sin(d) * u);
			}
		}
		e.restore();
	}
	polarHit(e, t) {
		let n = this.polarCfg, { cx: r, cy: i, R: a, r0: o } = this.polarGeom(), s = Math.hypot(e - r, t - i), c = Math.atan2(t - i, e - r), l = Math.min(n.a0, n.a1);
		for (; c < l;) c += Math.PI * 2;
		for (; c > l + Math.PI * 2;) c -= Math.PI * 2;
		let u = this.shown.length, d = -1;
		if (s >= o && s <= a + 4 && u) {
			if (n.cats === "angle") {
				let e = (c - n.a0) / (n.a1 - n.a0);
				e >= 0 && e <= 1 && (d = this.shown[Math.min(u - 1, Math.floor(e * u))]);
			} else d = this.shown[Math.min(u - 1, Math.floor((s - o) / (a - o) * u))];
		}
		let f = this.drawn.find((e) => {
			let t = e.sector, n = c;
			for (; n < t.a0;) n += Math.PI * 2;
			for (; n > t.a0 + Math.PI * 2;) n -= Math.PI * 2;
			return s >= t.r0 && s <= t.r1 && n <= t.a1;
		}) ?? null;
		return {
			cat: d,
			bar: f
		};
	}
	categoryAt(e, t) {
		let n = this.plot;
		if (e < n.x || e > n.x + n.w || t < n.y - 4 || t > n.y + n.h + 4) return -1;
		let r = this.shown.length;
		if (!r) return -1;
		let i = this.vertical ? (e - n.x) / n.w : (t - n.y) / n.h;
		if (this.mekko && !this.view) {
			let e = this.mekko.findIndex((e, t) => t > 0 && i <= e);
			return this.shown[C(e - 1, 0, r - 1)];
		}
		let [a, o] = this.viewRange, s = C(Math.floor(a + i * (o - a)), 0, r - 1);
		return this.shown[s];
	}
	context(e) {
		let t = this.drawn.filter((t) => t.datum.categoryIndex === e).map((e) => e.datum), n = this.lines.filter((e) => !this.hidden.has(e.id)).map((t) => ({
			overlay: t.overlay,
			id: t.id,
			name: t.name,
			value: t.values[e] ?? null,
			color: t.color
		}));
		return {
			categoryIndex: e,
			category: this.categories[e],
			items: t,
			total: t.reduce((e, t) => e + t.value, 0),
			overlays: n
		};
	}
	showTooltip(e, t) {
		let r = this.tooltipEl, i = this.opts.tooltip ?? {};
		if (this.hoverCat < 0 || i.show === !1 || this.brushRect) {
			r.classList.remove("is-visible");
			return;
		}
		let a = i.mode ?? "shared", o = this.context(this.hoverCat);
		if (a === "single") {
			if (!this.hoverBar) {
				r.classList.remove("is-visible");
				return;
			}
			o = {
				...o,
				items: [this.hoverBar.datum],
				total: this.hoverBar.datum.value
			};
		}
		if (!o.items.length && !o.overlays.length) {
			r.classList.remove("is-visible");
			return;
		}
		let s = (e, t) => this.opts.valueFormatter ? this.opts.valueFormatter(e, t) : n(e), c = (i.total ?? !!this.opts.stacked) && a === "shared" && o.items.length > 1;
		r.innerHTML = i.formatter ? i.formatter(o) : `<div class="bc-tooltip__head">${x(this.fmtCategory(o.categoryIndex))}</div>${o.items.map((e) => `<div class="bc-tooltip__row"><span class="bc-tooltip__dot" style="background:${e.color}"></span><span class="bc-tooltip__name">${x(e.series.name)}</span><b>${x(s(e.value, e.series))}${this.opts.stacked === "percent" ? ` <small>${e.percent.toFixed(1)}%</small>` : ""}</b></div>`).join("")}${c ? `<div class="bc-tooltip__total"><span>Total</span><b>${x(s(o.total, o.items[0].series))}</b></div>` : ""}${this.overlayRows(o, a)}`, r.classList.add("is-visible");
		let l = r.offsetWidth, u = r.offsetHeight, d = e + 14, f = t + 14;
		d + l > this.width - 4 && (d = e - l - 14), f + u > this.height - 4 && (f = t - u - 14), r.style.transform = `translate(${Math.max(4, d)}px, ${Math.max(4, f)}px)`;
	}
	overlayRows(e, t) {
		if (t !== "shared") return "";
		let n = e.overlays.filter((e) => e.value !== null).map((e) => {
			let t = this.lines.find((t) => t.id === e.id);
			return `<div class="bc-tooltip__row"><span class="bc-tooltip__line" style="background:${e.color}"></span><span class="bc-tooltip__name">${x(e.name)}</span><b>${x(this.fmtLine(t, e.value))}</b></div>`;
		});
		return n.length ? `<div class="bc-tooltip__overlays">${n.join("")}</div>` : "";
	}
	pointerHover(e, t) {
		let n, r;
		this.polarCfg ? {cat: n, bar: r} = this.polarHit(e, t) : (n = this.categoryAt(e, t), r = this.drawn.find((n) => e >= n.rect.x && e <= n.rect.x + n.rect.w && t >= n.rect.y && t <= n.rect.y + n.rect.h) ?? null);
		let i = n !== this.hoverCat || r?.datum !== this.hoverBar?.datum;
		this.hoverCat = n, this.hoverBar = r, this.canvas.style.cursor = r ? "pointer" : this.opts.brush ? "crosshair" : this.opts.zoom ? "grab" : "default", i && (this.draw(), this.emit("hover", n >= 0 ? this.context(n) : null)), this.showTooltip(e, t);
	}
	bind() {
		let e = this.canvas, t = (t) => {
			let n = e.getBoundingClientRect();
			return {
				x: t.clientX - n.left,
				y: t.clientY - n.top
			};
		}, n = !1;
		e.addEventListener("pointerdown", (r) => {
			if (r.button !== 0 || this.polarCfg) return;
			let i = t(r);
			if (n = !1, this.inSlider(i.x, i.y)) {
				let [t, n] = this.sliderWindow(), a = Math.abs(i.x - t) <= 7 ? "l" : Math.abs(i.x - n) <= 7 ? "r" : "move";
				if (a === "move" && (i.x < t || i.x > n)) {
					let e = this.sliderRect, t = Math.max(1, this.shown.length), [n, r] = this.viewRange, o = r - n, s = C((i.x - e.x) / e.w * t - o / 2, 0, t - o);
					this.view = o >= t ? null : [s, s + o], this.draw(), a = "move";
				}
				e.setPointerCapture(r.pointerId), this.sliderDrag = {
					mode: a,
					x: i.x,
					view: [...this.viewRange]
				};
				return;
			}
			let a = this.plot, o = i.x >= a.x && i.x <= a.x + a.w && i.y >= a.y && i.y <= a.y + a.h;
			this.opts.brush && o ? (e.setPointerCapture(r.pointerId), this.brushRect = {
				x0: i.x,
				y0: i.y,
				x1: i.x,
				y1: i.y
			}) : this.opts.zoom && o && (e.setPointerCapture(r.pointerId), this.drag = {
				x: this.vertical ? i.x : i.y,
				view: [...this.viewRange]
			}, e.style.cursor = "grabbing");
		}), e.addEventListener("pointermove", (r) => {
			let { x: i, y: a } = t(r);
			if (this.sliderDrag) n = !0, this.sliderMove(i);
			else if (this.brushRect) n = !0, this.brushRect.x1 = C(i, this.plot.x, this.plot.x + this.plot.w), this.brushRect.y1 = C(a, this.plot.y, this.plot.y + this.plot.h), this.clearHover(), this.draw();
			else if (this.drag) {
				let e = Math.max(1, this.shown.length), [t, r] = this.drag.view, o = this.vertical ? this.plot.w : this.plot.h, s = ((this.vertical ? i : a) - this.drag.x) / o * (r - t);
				Math.abs(s) > .01 && (n = !0);
				let c = r - t, l = C(t - s, 0, e - c);
				this.view = c >= e ? null : [l, l + c], this.clearHover(), this.draw();
			} else if (this.inSlider(i, a)) {
				let [t, n] = this.sliderWindow();
				e.style.cursor = Math.abs(i - t) <= 7 || Math.abs(i - n) <= 7 ? "ew-resize" : "grab";
			} else this.pointerHover(i, a);
		});
		let r = (t) => {
			if (e.hasPointerCapture(t.pointerId) && e.releasePointerCapture(t.pointerId), this.sliderDrag) this.sliderDrag = null, this.emit("zoom", this.view ? {
				from: this.view[0],
				to: this.view[1]
			} : null);
			else if (this.brushRect) {
				let e = this.brushRect;
				if (this.brushRect = null, Math.abs(e.x1 - e.x0) < 4 && Math.abs(e.y1 - e.y0) < 4) {
					this.selected = null, this.draw(), this.emit("brush", []);
					return;
				}
				let t = Math.min(e.x0, e.x1), n = Math.max(e.x0, e.x1), r = Math.min(e.y0, e.y1), i = Math.max(e.y0, e.y1), a = this.drawn.filter((e) => e.rect.x <= n && e.rect.x + e.rect.w >= t && e.rect.y <= i && e.rect.y + e.rect.h >= r);
				this.selected = new Set(a.map((e) => `${e.datum.seriesIndex}|${e.datum.categoryIndex}`)), this.draw(), this.emit("brush", a.map((e) => ({ ...e.datum })));
			} else this.drag && (this.drag = null, e.style.cursor = "grab", n && this.emit("zoom", this.view ? {
				from: this.view[0],
				to: this.view[1]
			} : null));
		};
		e.addEventListener("pointerup", r), e.addEventListener("pointercancel", r), e.addEventListener("pointerleave", () => {
			this.drag || this.brushRect || this.sliderDrag || (this.hoverCat = -1, this.hoverBar = null, this.tooltipEl.classList.remove("is-visible"), this.draw(), this.emit("hover", null));
		}), e.addEventListener("click", () => {
			n || this.hoverBar && this.emit("click", { ...this.hoverBar.datum });
		}), e.addEventListener("wheel", (e) => {
			if (!this.opts.zoom || this.polarCfg) return;
			e.preventDefault();
			let { x: n, y: r } = t(e), i = Math.max(1, this.shown.length), [a, o] = this.viewRange, s = this.vertical ? this.plot.w : this.plot.h, c = C((this.vertical ? n - this.plot.x : r - this.plot.y) / s, 0, 1), l = a + c * (o - a), u = C((o - a) * Math.exp(e.deltaY * .0015), Math.min(i, 2), i), d = C(l - u * c, 0, i - u);
			this.view = u >= i - 1e-9 ? null : [d, d + u], this.clearHover(), this.draw(), this.emit("zoom", this.view ? {
				from: this.view[0],
				to: this.view[1]
			} : null);
		}, { passive: !1 }), e.addEventListener("dblclick", () => {
			this.opts.zoom && this.view && this.resetZoom();
		});
	}
	renderLegend() {
		let e = this.legendEl, t = this.opts.legend?.interactive ?? !0;
		e.innerHTML = "", this.seriesList.forEach((n, r) => {
			if (n.silent) return;
			let i = this.keyOf(n), a = document.createElement("li");
			a.className = `bc-legend__item${this.hidden.has(i) ? " is-hidden" : ""}${t ? " is-interactive" : ""}`, a.dataset.id = i, a.innerHTML = `<span class="bc-legend__marker" style="background:${n.gradient?.length ? `linear-gradient(${n.gradient.join(",")})` : this.colorOf(n, r)}"></span><span>${x(n.name)}</span>`, a.addEventListener("mouseenter", () => !this.hidden.has(i) && this.highlight(i)), a.addEventListener("mouseleave", () => this.highlight(null)), t && a.addEventListener("click", () => this.toggle(i)), e.append(a);
		});
		for (let n of this.lines) {
			let r = document.createElement("li");
			r.className = `bc-legend__item${this.hidden.has(n.id) ? " is-hidden" : ""}${t ? " is-interactive" : ""}`, r.dataset.id = n.id, r.innerHTML = `<span class="bc-legend__marker bc-legend__marker--line${(n.overlay.dash ? n.overlay.dash.length > 0 : [
				"linear",
				"exponential",
				"average"
			].includes(n.overlay.type)) ? " is-dashed" : ""}" style="--c:${n.color}"></span><span>${x(n.name)}</span>`, r.addEventListener("mouseenter", () => !this.hidden.has(n.id) && this.highlight(n.id)), r.addEventListener("mouseleave", () => this.highlight(null)), t && r.addEventListener("click", () => this.toggle(n.id)), e.append(r);
		}
	}
};
function A(e, t = {}) {
	return new k(e, t);
}
//#endregion
//#region src/bar/helpers.ts
function j(e, t) {
	let n = [], r = [], i = [], a = [], o = 0;
	return (t === void 0 ? e : [t, ...e]).forEach((e, s) => {
		t !== void 0 && s === 0 ? (n.push(0), r.push(e), i.push(null), o = e) : e >= 0 ? (n.push(o), r.push(e), i.push(null), o += e) : (o += e, n.push(o), r.push(null), i.push(-e)), a.push(o);
	}), {
		base: n,
		up: r,
		down: i,
		totals: a
	};
}
function M(e) {
	let t = e.trim();
	if (t.startsWith("#")) {
		let e = t.length === 4 ? t.slice(1).split("").map((e) => e + e).join("") : t.slice(1, 7);
		return [
			parseInt(e.slice(0, 2), 16),
			parseInt(e.slice(2, 4), 16),
			parseInt(e.slice(4, 6), 16)
		];
	}
	let n = t.match(/(\d+(?:\.\d+)?)/g);
	return n ? [
		+n[0],
		+n[1],
		+n[2]
	] : [
		0,
		0,
		0
	];
}
function N(e, t, n) {
	let r = n.map(M);
	return (i) => {
		if (r.length === 1) return n[0];
		let a = Math.min(1, Math.max(0, (i - e) / (t - e || 1))) * (r.length - 1), o = Math.min(r.length - 2, Math.floor(a)), s = a - o, [c, l] = [r[o], r[o + 1]];
		return `rgb(${Math.round(c[0] + (l[0] - c[0]) * s)}, ${Math.round(c[1] + (l[1] - c[1]) * s)}, ${Math.round(c[2] + (l[2] - c[2]) * s)})`;
	};
}
function P(e, t = {}) {
	if (!e.length) return {
		categories: [],
		series: []
	};
	let n;
	if (Array.isArray(e[0])) n = e;
	else {
		let r = e, i = Object.keys(r[0]), a = t.category ?? i[0], o = i.filter((e) => e !== a);
		n = [[a, ...o], ...r.map((e) => [e[a], ...o.map((t) => e[t])])];
	}
	if (t.seriesLayoutBy === "row" && (n = n[0].map((e, t) => n.map((e) => e[t]))), t.category && Array.isArray(e[0]) && t.seriesLayoutBy !== "row") {
		let e = n[0].indexOf(t.category);
		e > 0 && (n = n.map((t) => [t[e], ...t.filter((t, n) => n !== e)]));
	}
	let [r, ...i] = n, a = i.map((e) => String(e[0])), o = r.slice(1).map((e, t) => ({
		name: String(e),
		col: t + 1
	}));
	return t.series && (o = t.series.map((e) => o.find((t) => t.name === e)).filter((e) => !!e)), {
		categories: a,
		series: o.map(({ name: e, col: t }) => ({
			name: e,
			data: i.map((e) => {
				let n = e[t];
				return n == null || n === "" ? null : Number(n);
			})
		}))
	};
}
//#endregion
export { r as _, k as a, v as c, f as d, l as f, c as g, s as h, h as i, A as l, u as m, P as n, g as o, d as p, j as r, _ as s, N as t, p as u, i as v, a as y };

//# sourceMappingURL=bar.js.map