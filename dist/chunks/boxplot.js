import { n as e, t } from "./format.js";
import { a as n } from "./color.js";
//#region src/boxplot/stats.ts
function r(e, t) {
	let n = e.length;
	if (!n) return NaN;
	let r = (n - 1) * Math.min(1, Math.max(0, t)), i = Math.floor(r), a = r - i;
	return a && i + 1 < n ? e[i] + a * (e[i + 1] - e[i]) : e[i];
}
function i(e, t = {}) {
	let n = e.filter((e) => typeof e == "number" && Number.isFinite(e)).sort((e, t) => e - t), i = n.length;
	if (!i) return null;
	let a = r(n, .25), o = r(n, .5), s = r(n, .75), c = s - a, l = t.whisker ?? 1.5, u = l === "range" ? -Infinity : a - l * c, d = l === "range" ? Infinity : s + l * c, f = n.filter((e) => e >= u && e <= d);
	return {
		low: Math.min(a, f.length ? f[0] : a),
		q1: a,
		median: o,
		q3: s,
		high: Math.max(s, f.length ? f[f.length - 1] : s),
		iqr: c,
		min: n[0],
		max: n[i - 1],
		mean: n.reduce((e, t) => e + t, 0) / i,
		count: i,
		outliers: n.filter((e) => e < u || e > d)
	};
}
var a = (e, t) => typeof t == "function" ? t(e) : e[t];
function o(e, t) {
	let n = [], r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
	for (let o of e) {
		let e = String(a(o, t.category)), s = t.series === void 0 ? t.name ?? "Série" : String(a(o, t.series)), c = a(o, t.value);
		r.has(e) || (r.set(e, n.length), n.push(e)), i.has(s) || i.set(s, /* @__PURE__ */ new Map());
		let l = i.get(s);
		l.has(e) || l.set(e, []), typeof c == "number" && Number.isFinite(c) && l.get(e).push(c);
	}
	return t.sort && n.sort(t.sort), {
		categories: n,
		series: [...i].map(([e, t]) => ({
			name: e,
			samples: n.map((e) => t.get(e) ?? null)
		}))
	};
}
//#endregion
//#region src/boxplot/boxplot.ts
var s = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", c = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	grid: "rgba(42, 46, 57, 0.7)",
	axis: "#363a45",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: s
}, l = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	grid: "rgba(42, 46, 57, 0.08)",
	axis: "#d1d4dc",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: s
}, u = [
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
], d = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), f = (e, t, n) => Math.min(n, Math.max(t, e)), p = (e) => 1 - (1 - e) ** 3, m = (e, t) => {
	let [r, i, a, o] = n(e);
	return `rgba(${r}, ${i}, ${a}, ${+(t * o).toFixed(3)})`;
}, h = (e) => {
	let t = Math.sin(e * 12.9898 + 78.233) * 43758.5453;
	return t - Math.floor(t) - .5;
}, g = class {
	constructor(e, t = {}) {
		this.list = [], this.hiddenKeys = /* @__PURE__ */ new Set(), this.models = [], this.categories = [], this.hover = null, this.plot = {
			x: 0,
			y: 0,
			w: 1,
			h: 1
		}, this.scale = {
			lo: 0,
			hi: 1,
			ticks: [0, 1]
		}, this.catRot = 0, this.catStep = 1, this.width = 0, this.height = 0, this.dpr = 1, this.animStart = 0, this.raf = 0, this.handlers = /* @__PURE__ */ new Map(), this.destroyed = !1, this.opts = { ...t }, this.root = e, e.classList.add("bx-root"), this.titleEl = document.createElement("div"), this.titleEl.className = "bx-title", this.bodyEl = document.createElement("div"), this.plotEl = document.createElement("div"), this.plotEl.className = "bx-plot", this.canvas = document.createElement("canvas"), this.canvas.className = "bx-canvas", this.canvas.setAttribute("role", "img"), this.ctx = this.canvas.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "bx-tooltip", this.legendEl = document.createElement("ul"), this.plotEl.append(this.canvas, this.tooltipEl), this.bodyEl.append(this.plotEl, this.legendEl), e.append(this.titleEl, this.bodyEl), this.list = (t.series ?? []).map((e) => ({ ...e }));
		for (let e of this.list) e.hidden && this.hiddenKeys.add(this.keyOf(e));
		this.applyLook(), this.bind(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(this.plotEl), this.measure(), this.rebuild(!0);
	}
	get series() {
		return this.list.map((e) => ({ ...e }));
	}
	setSeries(e, t = !0) {
		this.list = e.map((e) => ({ ...e }));
		for (let e of this.list) e.hidden && this.hiddenKeys.add(this.keyOf(e));
		this.rebuild(t);
	}
	setOptions(e, t = !0) {
		e.series && (this.list = e.series.map((e) => ({ ...e }))), this.opts = {
			...this.opts,
			...e
		}, this.applyLook(), this.rebuild(t);
	}
	toggle(e, t) {
		let n = t ?? !this.hiddenKeys.has(e);
		n ? this.hiddenKeys.add(e) : this.hiddenKeys.delete(e), this.hover && this.hover.m.key === e && (this.hover = null), this.emit("toggle", {
			id: e,
			hidden: n
		}), this.renderLegend(), this.draw();
	}
	on(e, t) {
		this.handlers.has(e) || this.handlers.set(e, /* @__PURE__ */ new Set());
		let n = t;
		return this.handlers.get(e).add(n), () => this.handlers.get(e)?.delete(n);
	}
	resize() {
		this.measure(), this.layout(), this.draw();
	}
	screenshot() {
		return this.draw(), this.canvas.toDataURL("image/png");
	}
	destroy() {
		this.destroyed = !0, cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("bx-root"), this.titleEl.remove(), this.bodyEl.remove();
	}
	keyOf(e) {
		return e.id ?? e.name;
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t));
	}
	get horizontal() {
		return this.opts.orient === "horizontal";
	}
	applyLook() {
		let e = this.opts, t = {
			...e.theme === "light" ? l : c,
			...typeof e.theme == "object" ? e.theme : {}
		};
		e.background && (t.background = e.background), this.theme = t;
		let n = {
			"--bx-bg": t.background,
			"--bx-text": t.text,
			"--bx-muted": t.muted,
			"--bx-tt-bg": t.tooltipBg,
			"--bx-tt-text": t.tooltipText,
			"--bx-tt-border": t.tooltipBorder,
			"--bx-font": t.font
		};
		for (let [e, t] of Object.entries(n)) this.root.style.setProperty(e, t);
		let r = typeof e.title == "string" ? { text: e.title } : e.title;
		this.titleEl.style.display = r ? "" : "none", r && (this.titleEl.style.textAlign = r.align ?? "center", this.titleEl.innerHTML = `<b>${d(r.text)}</b>${r.subtext ? `<small>${d(r.subtext)}</small>` : ""}`);
	}
	items(e) {
		return e.data ?? (e.samples ?? []).map((e) => e ? { samples: e } : null);
	}
	boxOf(e) {
		if (!e) return null;
		if (Array.isArray(e)) return {
			stats: {
				min: e[0],
				q1: e[1],
				median: e[2],
				q3: e[3],
				max: e[4],
				outliers: []
			},
			samples: []
		};
		if (e.samples) {
			let t = i(e.samples, { whisker: this.opts.whisker });
			if (!t) return null;
			let n = e.samples.filter((e) => typeof e == "number" && Number.isFinite(e));
			return {
				stats: {
					min: t.low,
					q1: t.q1,
					median: t.median,
					q3: t.q3,
					max: t.high,
					mean: e.mean ?? t.mean,
					count: t.count,
					outliers: t.outliers
				},
				samples: n
			};
		}
		if (e.value) {
			let t = e.value;
			return {
				stats: {
					min: t[0],
					q1: t[1],
					median: t[2],
					q3: t[3],
					max: t[4],
					mean: e.mean,
					outliers: e.outliers ?? []
				},
				samples: []
			};
		}
		return null;
	}
	rebuild(e) {
		let t = this.opts.colors ?? u, n = /* @__PURE__ */ new Map();
		for (let e of this.models) for (let t of e.boxes) n.set(`${e.key}\u0000${t.cat}`, t);
		let r = this.opts.animation ?? !0, i = e && r !== !1, a = Math.max(0, ...this.list.map((e) => this.items(e).length)), o = this.list[0] ? this.items(this.list[0]) : [];
		this.categories = this.opts.categories ?? Array.from({ length: a }, (e, t) => {
			let n = o[t];
			return n && !Array.isArray(n) && n.name ? n.name : String(t + 1);
		}), this.models = this.list.map((e, r) => {
			let a = this.keyOf(e), o = e.color ?? t[r % t.length], s = [];
			return this.items(e).forEach((e, t) => {
				if (t >= this.categories.length) return;
				let c = this.boxOf(e);
				if (!c) return;
				let l = c.stats, u = [
					l.min,
					l.q1,
					l.median,
					l.q3,
					l.max,
					l.mean ?? l.median
				], d = n.get(`${a}\u0000${t}`);
				s.push({
					cat: t,
					name: e && !Array.isArray(e) && e.name || this.categories[t],
					color: e && !Array.isArray(e) && e.color || o,
					stats: l,
					t: u,
					from: i ? d ? [...d.v] : u.map(() => l.median) : null,
					v: [...u],
					samples: c.samples,
					jit: c.samples.map((e, n) => h(r * 7919 + t * 104729 + n * 31 + 1)),
					c: 0,
					w: 0,
					pc: 0,
					hits: []
				});
			}), {
				key: a,
				src: e,
				index: r,
				color: o,
				boxes: s
			};
		}), this.hover &&= null, this.animStart = i ? performance.now() : 0, this.renderLegend(), this.layout(), this.loop();
	}
	duration() {
		let e = this.opts.animation ?? !0;
		return e === !1 ? 0 : typeof e == "object" ? e.duration ?? 700 : 700;
	}
	progress(e) {
		return this.animStart ? p(f((e - this.animStart) / (this.duration() || 1), 0, 1)) : 1;
	}
	loop() {
		if (cancelAnimationFrame(this.raf), this.destroyed) return;
		let e = performance.now();
		if (this.draw(e), this.animStart && e - this.animStart < this.duration()) this.raf = requestAnimationFrame(() => this.loop());
		else {
			this.animStart = 0;
			for (let e of this.models) for (let t of e.boxes) t.from = null;
			this.draw();
		}
	}
	pointsCfg(e) {
		let t = e.src.points ?? this.opts.points;
		return t ? typeof t == "object" ? t : {} : null;
	}
	legendCfg() {
		let e = this.opts.legend, t = typeof e == "object" ? e : {};
		return {
			show: (typeof e == "boolean" ? e : t.show) ?? this.list.length > 1,
			position: t.position ?? "top",
			interactive: t.interactive ?? !0
		};
	}
	renderLegend() {
		let e = this.legendCfg();
		this.bodyEl.className = `bx-body bx-legend-${e.position}`, this.legendEl.className = "bx-legend", this.legendEl.style.display = e.show ? "" : "none", e.show && (this.legendEl.innerHTML = this.models.map((t) => {
			let n = this.hiddenKeys.has(t.key);
			return `<li class="bx-legend__item${e.interactive ? " is-interactive" : ""}${n ? " is-hidden" : ""}" data-key="${d(t.key)}"><i class="bx-legend__marker" style="--c:${t.color}"></i><span>${d(t.src.name)}</span></li>`;
		}).join(""));
	}
	measure() {
		let e = this.plotEl.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height)), this.canvas.width = Math.round(this.width * this.dpr), this.canvas.height = Math.round(this.height * this.dpr), this.canvas.style.width = `${this.width}px`, this.canvas.style.height = `${this.height}px`;
	}
	extent() {
		let e = Infinity, t = -Infinity;
		for (let n of this.models) for (let r of n.boxes) {
			for (let n of [
				r.stats.min,
				r.stats.max,
				r.stats.mean ?? r.stats.median,
				...r.stats.outliers
			]) Number.isFinite(n) && (e = Math.min(e, n), t = Math.max(t, n));
			if (this.pointsCfg(n)) for (let n of r.samples) e = Math.min(e, n), t = Math.max(t, n);
		}
		return e <= t ? [e, t] : [0, 1];
	}
	valueScale(t) {
		let n = this.opts.valueAxis ?? {}, [r, i] = this.extent();
		n.beginAtZero && (r = Math.min(r, 0), i = Math.max(i, 0)), n.min !== void 0 && (r = n.min), n.max !== void 0 && (i = n.max);
		let a = n.ticks ?? Math.max(2, Math.round(t / (this.horizontal ? 90 : 48))), o = e(r, i, a), s = n.min ?? o.min, c = n.max ?? o.max;
		return {
			lo: s,
			hi: c,
			ticks: o.ticks.filter((e) => e >= s - 1e-9 && e <= c + 1e-9)
		};
	}
	fmtTick(e) {
		let n = this.opts.valueAxis?.format;
		return n ? n(e) : t(e);
	}
	catLabel(e) {
		let t = this.opts.categoryAxis?.format;
		return t ? t(this.categories[e], e) : this.categories[e];
	}
	layout() {
		let e = this.opts, t = this.ctx, n = e.padding ?? 10, r = e.categoryAxis ?? {}, i = e.valueAxis ?? {}, a = Math.max(1, this.categories.length);
		t.font = this.font(11);
		let o = r.show === !1 ? [] : this.categories.map((e, n) => t.measureText(this.catLabel(n)).width), s = Math.max(0, ...o), c = r.title ? 18 : 0, l = i.title ? 18 : 0, u = (e) => i.show === !1 ? 0 : Math.max(0, ...e.map((e) => t.measureText(this.fmtTick(e)).width));
		if (this.catRot = 0, this.catStep = 1, this.horizontal) {
			let e = n + 4, o = n + l + (i.show === !1 ? 0 : 19), u = n + c + (r.show === !1 ? 0 : s + 10), d = n + 4, f = this.width - u - d, p = this.valueScale(f), m = p.ticks.length ? t.measureText(this.fmtTick(p.ticks[p.ticks.length - 1])).width : 0;
			d = Math.max(d, n + m / 2), f = Math.max(10, this.width - u - d), p = this.valueScale(f);
			let h = Math.max(10, this.height - e - o);
			this.catStep = Math.max(1, Math.ceil(13 / Math.max(1, h / a))), this.plot = {
				x: u,
				y: e,
				w: f,
				h
			}, this.scale = p;
		} else {
			let e = n + 6, t = this.height - e - n - (r.show === !1 ? 0 : 19) - c, d = this.valueScale(t), f = n + l + (i.show === !1 ? 0 : u(d.ticks) + 8), p = n + 4, m = this.width - f - p, h = m / a, g = r.rotate ?? (s + 8 > h ? 40 : 0);
			if (r.show !== !1 && g) {
				let e = Math.cos(g * Math.PI / 180) * (o[0] ?? 0) - h / 2 - (f - n);
				e > 0 && (f += e, m = this.width - f - p, h = m / a);
			}
			let _ = g * Math.PI / 180, v = r.show === !1 ? 0 : g ? Math.min(this.height * .35, Math.sin(Math.abs(_)) * s + Math.cos(_) * 11 + 10) : 19;
			t = Math.max(10, this.height - e - n - v - c), d = this.valueScale(t), this.catRot = g, this.catStep = g ? Math.max(1, Math.ceil(13 / Math.max(1, h))) : 1, this.plot = {
				x: f,
				y: e,
				w: Math.max(10, m),
				h: t
			}, this.scale = d;
		}
		this.placeBoxes();
	}
	placeBoxes() {
		let e = this.opts, t = this.plot, n = Math.max(1, this.categories.length), r = this.horizontal ? t.y : t.x, i = (this.horizontal ? t.h : t.w) / n, a = i * f(e.bandWidth ?? .7, .05, 1), o = a / Math.max(1, this.models.length), [s, c] = e.boxWidth ?? [7, 50];
		for (let e of this.models) {
			let t = this.pointsCfg(e);
			for (let n of e.boxes) {
				let l = r + i * (n.cat + .5) - a / 2 + o * (e.index + .5);
				if (t?.position === "beside" && n.samples.length) {
					let e = t.jitter ?? .8;
					n.w = f(o * .45, Math.min(s, o * .45), c), n.c = l - (n.w * (1 + e) + 6) / 2 + n.w / 2, n.pc = n.c + n.w / 2 + 6 + n.w * e / 2;
				} else n.w = f(o * .8, Math.min(s, o * .9), c), n.c = n.pc = l;
			}
		}
	}
	font(e, t = 400) {
		return `${t} ${e}px ${this.theme.font}`;
	}
	vpos(e) {
		let t = this.plot, { lo: n, hi: r } = this.scale, i = (e - n) / (r - n || 1);
		return this.horizontal ? t.x + i * t.w : t.y + t.h - i * t.h;
	}
	xy(e, t) {
		let n = this.vpos(t);
		return this.horizontal ? [n, e] : [e, n];
	}
	seg(e, t, n, r) {
		let [i, a] = this.xy(e, t), [o, s] = this.xy(n, r);
		this.ctx.moveTo(i, a), this.ctx.lineTo(o, s);
	}
	draw(e = performance.now()) {
		let t = this.ctx, n = this.theme;
		t.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), t.clearRect(0, 0, this.width, this.height), n.background !== "transparent" && (t.fillStyle = n.background, t.fillRect(0, 0, this.width, this.height)), this.drawGrid();
		let r = this.progress(e);
		for (let e of this.models) for (let t of e.boxes) t.v = t.t.map((e, n) => t.from ? t.from[n] + (e - t.from[n]) * r : e), t.hits = [];
		let i = this.models.filter((e) => !this.hiddenKeys.has(e.key)), a = this.opts.hoverDim ?? .4, o = this.animStart ? r : 1;
		t.save(), t.beginPath(), t.rect(this.plot.x - 8, this.plot.y - 8, this.plot.w + 16, this.plot.h + 16), t.clip();
		for (let e of i) for (let t of e.boxes) (this.hover?.m !== e || this.hover.b !== t) && this.drawBox(e, t, this.hover && this.hover.m !== e ? a : 1, !1, o);
		this.hover && i.includes(this.hover.m) && this.drawBox(this.hover.m, this.hover.b, 1, !0, o), t.restore(), this.drawAxes();
	}
	drawGrid() {
		let e = this.ctx, t = this.plot, n = this.theme, r = this.opts.valueAxis ?? {}, i = this.opts.categoryAxis ?? {};
		if (e.lineWidth = 1, e.strokeStyle = n.grid, r.grid ?? r.show !== !1) {
			e.setLineDash(r.gridDash ?? []), e.beginPath();
			for (let n of this.scale.ticks) {
				let r = Math.round(this.vpos(n)) + .5;
				this.horizontal ? (e.moveTo(r, t.y), e.lineTo(r, t.y + t.h)) : (e.moveTo(t.x, r), e.lineTo(t.x + t.w, r));
			}
			e.stroke(), e.setLineDash([]);
		}
		if (i.grid) {
			let n = Math.max(1, this.categories.length);
			e.beginPath();
			for (let r = 1; r < n; r++) if (this.horizontal) {
				let i = Math.round(t.y + t.h * r / n) + .5;
				e.moveTo(t.x, i), e.lineTo(t.x + t.w, i);
			} else {
				let i = Math.round(t.x + t.w * r / n) + .5;
				e.moveTo(i, t.y), e.lineTo(i, t.y + t.h);
			}
			e.stroke();
		}
	}
	drawAxes() {
		let e = this.ctx, t = this.plot, n = this.theme, r = this.opts, i = r.categoryAxis ?? {}, a = r.valueAxis ?? {}, o = r.padding ?? 10, s = Math.max(1, this.categories.length);
		if (i.show !== !1 && (e.strokeStyle = n.axis, e.lineWidth = 1, e.beginPath(), this.horizontal ? (e.moveTo(Math.round(t.x) + .5, t.y), e.lineTo(Math.round(t.x) + .5, t.y + t.h)) : (e.moveTo(t.x, Math.round(t.y + t.h) + .5), e.lineTo(t.x + t.w, Math.round(t.y + t.h) + .5)), e.stroke()), e.font = this.font(11), a.show !== !1) {
			if (e.fillStyle = a.color ?? n.muted, this.horizontal) {
				e.textAlign = "center", e.textBaseline = "top";
				let n = this.scale.ticks.map((t) => e.measureText(this.fmtTick(t)).width), r = this.scale.ticks.length > 1 ? Math.abs(this.vpos(this.scale.ticks[1]) - this.vpos(this.scale.ticks[0])) : t.w, i = Math.max(1, Math.ceil((Math.max(0, ...n) + 8) / Math.max(1, r)));
				this.scale.ticks.forEach((r, a) => {
					a % i || e.fillText(this.fmtTick(r), f(this.vpos(r), n[a] / 2 + 2, this.width - n[a] / 2 - 2), t.y + t.h + 6);
				});
			} else {
				e.textAlign = "right", e.textBaseline = "middle";
				let n = this.scale.ticks.length > 1 ? Math.abs(this.vpos(this.scale.ticks[1]) - this.vpos(this.scale.ticks[0])) : t.h, r = Math.max(1, Math.ceil(13 / Math.max(1, n)));
				this.scale.ticks.forEach((n, i) => {
					i % r || e.fillText(this.fmtTick(n), t.x - 6, this.vpos(n));
				});
			}
		}
		if (i.show !== !1) {
			e.fillStyle = i.color ?? n.muted;
			for (let n = 0; n < this.categories.length; n += this.catStep) {
				let r = this.catLabel(n);
				if (this.horizontal) e.textAlign = "right", e.textBaseline = "middle", e.fillText(r, t.x - 8, t.y + t.h * (n + .5) / s);
				else {
					let i = t.x + t.w * (n + .5) / s, a = t.y + t.h + 6;
					this.catRot ? (e.save(), e.translate(i, a + 2), e.rotate(-this.catRot * Math.PI / 180), e.textAlign = "right", e.textBaseline = "middle", e.fillText(r, 0, 0), e.restore()) : (e.textAlign = "center", e.textBaseline = "top", e.fillText(r, i, a));
				}
			}
		}
		e.font = this.font(11, 600), e.fillStyle = n.muted;
		let c = this.horizontal ? a.title : i.title, l = this.horizontal ? i.title : a.title;
		c && (e.textAlign = "center", e.textBaseline = "bottom", e.fillText(c, t.x + t.w / 2, this.height - o)), l && (e.save(), e.translate(o + 7, t.y + t.h / 2), e.rotate(-Math.PI / 2), e.textAlign = "center", e.textBaseline = "middle", e.fillText(l, 0, 0), e.restore());
	}
	drawBox(e, t, n, r, i) {
		let a = this.ctx, o = e.src, [s, c, l, u, d, p] = t.v, h = t.c, g = t.w, _ = (o.width ?? 1.5) + (r ? .8 : 0);
		a.globalAlpha = n;
		let v = this.pointsCfg(e);
		if (v && t.samples.length) {
			let e = v.size ?? 2.5, r = t.w * (v.jitter ?? .8);
			a.globalAlpha = n * i * (v.opacity ?? .55), a.fillStyle = v.color ?? t.color, t.samples.forEach((n, i) => {
				let [o, s] = this.xy(t.pc + t.jit[i] * r, n);
				a.beginPath(), a.arc(o, s, e, 0, Math.PI * 2), a.fill(), t.hits.push({
					x: o,
					y: s,
					r: e,
					v: n,
					kind: "point"
				});
			}), a.globalAlpha = n;
		}
		a.strokeStyle = t.color, a.lineWidth = _, a.lineJoin = "miter", a.beginPath(), this.seg(h, s, h, c), this.seg(h, u, h, d), this.seg(h - g / 4, s, h + g / 4, s), this.seg(h - g / 4, d, h + g / 4, d), a.stroke();
		let [y, b] = this.xy(h - g / 2, c), [x, S] = this.xy(h + g / 2, u), C = Math.min(y, x), w = Math.min(b, S), T = Math.abs(x - y), E = Math.abs(S - b), D = o.fill ?? .2;
		a.fillStyle = typeof D == "string" ? D : m(t.color, f(D + (r ? .15 : 0), 0, 1)), a.fillRect(C, w, T, E), r && typeof D == "string" && (a.fillStyle = m(t.color, .15), a.fillRect(C, w, T, E)), a.strokeRect(C, w, T, E), a.lineWidth = _ + .8, a.beginPath(), this.seg(h - g / 2, l, h + g / 2, l), a.stroke();
		let O = o.mean ?? this.opts.mean;
		if (O && t.stats.mean !== void 0) {
			let e = typeof O == "object" ? O : {}, [n, r] = this.xy(h, p);
			this.symbol(e.symbol ?? "diamond", n, r, e.size ?? Math.max(3, Math.min(5, g / 6)), e.color ?? t.color, !1, 1.5);
		}
		let k = o.outliers ?? !0;
		if (k && t.stats.outliers.length) {
			let e = typeof k == "object" ? k : {}, o = e.size ?? 3.5;
			a.globalAlpha = n * i;
			for (let n of t.stats.outliers) {
				let [i, a] = this.xy(h, n), s = r && this.hover?.kind === "outlier" && this.hover.point === n;
				this.symbol(e.symbol ?? "circle", i, a, o + (s ? 1.5 : 0), e.color ?? t.color, !0, 1.5), t.hits.push({
					x: i,
					y: a,
					r: o,
					v: n,
					kind: "outlier"
				});
			}
		}
		a.globalAlpha = 1;
	}
	symbol(e, t, n, r, i, a, o) {
		let s = this.ctx;
		s.beginPath(), e === "cross" ? (s.moveTo(t - r, n - r), s.lineTo(t + r, n + r), s.moveTo(t + r, n - r), s.lineTo(t - r, n + r), s.strokeStyle = i, s.lineWidth = o, s.stroke()) : (e === "square" ? s.rect(t - r, n - r, r * 2, r * 2) : e === "diamond" ? (s.moveTo(t, n - r * 1.3), s.lineTo(t + r, n), s.lineTo(t, n + r * 1.3), s.lineTo(t - r, n), s.closePath()) : s.arc(t, n, r, 0, Math.PI * 2), a ? (s.fillStyle = m(i, .25), s.fill(), s.strokeStyle = i, s.lineWidth = o, s.stroke()) : (s.fillStyle = i, s.fill(), s.strokeStyle = this.theme.background === "transparent" ? "rgba(255,255,255,0.8)" : this.theme.background, s.lineWidth = 1, s.stroke()));
	}
	fmt(e) {
		return this.opts.valueFormatter ? this.opts.valueFormatter(e) : e.toLocaleString("pt-PT", { maximumFractionDigits: 2 });
	}
	info(e) {
		let t = e.b.stats;
		return {
			series: e.m.src,
			seriesIndex: e.m.index,
			category: this.categories[e.b.cat],
			categoryIndex: e.b.cat,
			name: e.b.name,
			color: e.b.color,
			kind: e.kind,
			value: [
				t.min,
				t.q1,
				t.median,
				t.q3,
				t.max
			],
			stats: t,
			point: e.point
		};
	}
	hitTest(e, t) {
		let n = this.models.filter((e) => !this.hiddenKeys.has(e.key)), r = null, i = Infinity;
		for (let a of n) for (let n of a.boxes) for (let o of n.hits) {
			let s = (o.x - e) ** 2 + (o.y - t) ** 2;
			s <= (o.r + 3) ** 2 && s < i && (i = s, r = {
				m: a,
				b: n,
				kind: o.kind,
				point: o.v
			});
		}
		if (r) return r;
		let a = this.horizontal ? t : e, o = this.horizontal ? e : t;
		for (let e of n) for (let t of e.boxes) {
			let n = Math.max(t.w / 2, 5), r = this.vpos(t.v[0]), i = this.vpos(t.v[4]);
			if (Math.abs(a - t.c) <= n && o >= Math.min(r, i) - 4 && o <= Math.max(r, i) + 4) return {
				m: e,
				b: t,
				kind: "box"
			};
		}
		return null;
	}
	bind() {
		let e = (e) => {
			let t = this.canvas.getBoundingClientRect();
			return {
				x: e.clientX - t.left,
				y: e.clientY - t.top
			};
		};
		this.canvas.addEventListener("pointermove", (t) => {
			let { x: n, y: r } = e(t), i = this.hitTest(n, r);
			!(i && this.hover && i.m === this.hover.m && i.b === this.hover.b && i.kind === this.hover.kind && i.point === this.hover.point) && (i || this.hover) && (this.hover = i, this.emit("hover", i ? this.info(i) : null), this.draw()), this.canvas.style.cursor = i ? "pointer" : "", this.showTooltip(t);
		}), this.canvas.addEventListener("pointerleave", () => {
			this.hover && (this.hover = null, this.emit("hover", null), this.draw()), this.tooltipEl.classList.remove("is-visible");
		}), this.canvas.addEventListener("click", (t) => {
			let { x: n, y: r } = e(t), i = this.hitTest(n, r);
			i && this.emit("click", this.info(i));
		}), this.legendEl.addEventListener("click", (e) => {
			let t = e.target.closest(".bx-legend__item");
			t && this.legendCfg().interactive && this.toggle(t.dataset.key);
		});
	}
	showTooltip(e) {
		let t = this.opts.tooltip ?? !0, n = this.tooltipEl, r = this.hover;
		if (!r || t === !1 || typeof t == "object" && t.show === !1) {
			n.classList.remove("is-visible");
			return;
		}
		let i = this.info(r);
		if (typeof t == "object" && t.formatter) n.innerHTML = t.formatter(i);
		else {
			let e = (e, t) => `<div class="bx-tooltip__row"><span>${e}</span><b>${d(t)}</b></div>`, t = i.stats, a = i.name === r.m.src.name ? "" : `<div class="bx-tooltip__sub">${d(r.m.src.name)}</div>`, o;
			o = r.kind === "box" ? e("Máximo", this.fmt(t.max)) + e("Q3", this.fmt(t.q3)) + e("Mediana", this.fmt(t.median)) + e("Q1", this.fmt(t.q1)) + e("Mínimo", this.fmt(t.min)) + (t.mean !== void 0 && (r.m.src.mean ?? this.opts.mean) ? e("Média", this.fmt(t.mean)) : "") + (t.count === void 0 ? "" : e("Amostras", t.count.toLocaleString("pt-PT"))) + (t.outliers.length ? e("Outliers", String(t.outliers.length)) : "") : e(r.kind === "outlier" ? "Outlier" : "Valor", this.fmt(i.point)), n.innerHTML = `<div class="bx-tooltip__head"><i class="bx-tooltip__dot" style="background:${i.color}"></i>${d(i.name)}</div>${a}${o}`;
		}
		n.classList.add("is-visible");
		let a = this.plotEl.getBoundingClientRect(), o = e.clientX - a.left, s = e.clientY - a.top, c = n.offsetWidth, l = n.offsetHeight, u = o + 14 + c > this.width ? o - 14 - c : o + 14, p = f(s + 14 + l > this.height ? s - 14 - l : s + 14, 0, Math.max(0, this.height - l));
		n.style.transform = `translate(${Math.max(0, u)}px, ${p}px)`;
	}
};
function _(e, t = {}) {
	return new g(e, t);
}
//#endregion
export { _ as a, i as c, l as i, g as n, o, c as r, r as s, u as t };

//# sourceMappingURL=boxplot.js.map