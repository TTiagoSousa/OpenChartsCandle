import { n as e, t } from "./format.js";
import { n } from "./color.js";
//#region src/parallel/scale.ts
var r = (e) => typeof e == "number" && Number.isFinite(e);
function i(t, n) {
	let i = t.type ?? (t.data || n.some((e) => typeof e == "string") ? "category" : "value"), a = !!t.inverse, o = (e) => a ? 1 - e : e;
	if (i === "category") {
		let e = t.data ? [...t.data] : [];
		if (!t.data) {
			let t = /* @__PURE__ */ new Set();
			for (let r of n) r == null || t.has(String(r)) || (t.add(String(r)), e.push(String(r)));
		}
		let r = new Map(e.map((e, t) => [e, t])), s = e.length, c = (e) => o(s > 1 ? e / (s - 1) : .5);
		return {
			type: i,
			min: 0,
			max: Math.max(0, s - 1),
			categories: e,
			inverse: a,
			ticks: e.map((e, t) => ({
				t: c(t),
				value: e
			})),
			toT: (e) => {
				if (e == null) return NaN;
				let t = r.get(String(e));
				return t === void 0 ? NaN : c(t);
			},
			fromT: (e) => s > 1 ? Math.round(o(e) * (s - 1)) : 0
		};
	}
	let s = Infinity, c = -Infinity;
	for (let e of n) !r(e) || i === "log" && e <= 0 || (s = Math.min(s, e), c = Math.max(c, e));
	if (i === "log") {
		r(t.min) && t.min > 0 && (s = t.min), r(t.max) && t.max > 0 && (c = t.max), Number.isFinite(s) || (s = 1, c = 10);
		let e = t.nice !== !1, n = Math.log10(s), l = Math.log10(c);
		e && t.min === void 0 && (n = Math.floor(n + 1e-9)), e && t.max === void 0 && (l = Math.ceil(l - 1e-9)), n === l && (--n, l += 1);
		let u = 10 ** n, d = 10 ** l, f = (e) => r(e) && e > 0 ? o((Math.log10(e) - n) / (l - n)) : NaN, p = [], m = l - n, h = m <= 1.5 ? [
			1,
			2,
			5
		] : [1], g = Math.max(1, Math.ceil(m / 8));
		for (let e = Math.floor(n); e <= Math.ceil(l); e += g) for (let t of h) {
			let n = +(t * 10 ** e).toPrecision(12);
			n >= u * (1 - 1e-9) && n <= d * (1 + 1e-9) && p.push({
				t: f(n),
				value: n
			});
		}
		return {
			type: i,
			min: u,
			max: d,
			categories: [],
			inverse: a,
			ticks: p,
			toT: f,
			fromT: (e) => 10 ** (n + o(e) * (l - n))
		};
	}
	if (r(t.min) && (s = t.min), r(t.max) && (c = t.max), !Number.isFinite(s) && !Number.isFinite(c) ? (s = 0, c = 1) : Number.isFinite(s) ? Number.isFinite(c) || (c = s + 1) : s = c - 1, s > c && ([s, c] = [c, s]), s === c) {
		let e = Math.abs(s) * .1 || 1;
		r(t.min) || (s -= e), r(t.max) || (c += e), s === c && (c = s + 1);
	}
	let l = t.splitNumber ?? 5, u = e(s, c, l), d = t.nice !== !1;
	d && t.min === void 0 && (s = u.min), d && t.max === void 0 && (c = u.max);
	let f = e(s, c, l).ticks.filter((e) => e >= s - (c - s) * 1e-9 && e <= c + (c - s) * 1e-9), p = (e) => r(e) ? o((e - s) / (c - s)) : NaN;
	return {
		type: "value",
		min: s,
		max: c,
		categories: [],
		inverse: a,
		ticks: f.map((e) => ({
			t: p(e),
			value: e
		})),
		toT: p,
		fromT: (e) => s + o(e) * (c - s)
	};
}
function a(e, t, n, r) {
	for (let i of r) {
		let r = e[t * n + i.dim];
		if (!(r >= i.lo - 1e-9 && r <= i.hi + 1e-9)) return !1;
	}
	return !0;
}
function o(e, t) {
	if (t == null) return -1;
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		if (r.value !== void 0) {
			if (String(r.value) === String(t)) return n;
		} else if (typeof t == "number" && (r.min === void 0 || t >= r.min) && (r.max === void 0 || t < r.max)) return n;
	}
	return -1;
}
function s(e, t, n) {
	if (e.type === "category") return { categories: e.categories.filter((r) => {
		let i = e.toT(r);
		return i >= t - 1e-9 && i <= n + 1e-9;
	}) };
	let r = e.fromT(t), i = e.fromT(n);
	return {
		from: Math.min(r, i),
		to: Math.max(r, i)
	};
}
function c(e, t, n, r) {
	if (!r) return e + (t - e) * n;
	let i = n * n * (3 - 2 * n), a = Math.min(1, Math.max(0, r));
	return e + (t - e) * (n + (i - n) * Math.min(1, a * 2));
}
//#endregion
//#region src/parallel/parallel.ts
var l = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", u = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	axis: "rgba(160, 164, 176, 0.75)",
	inactive: "#787b86",
	brushFill: "rgba(41, 98, 255, 0.2)",
	brushBorder: "rgba(91, 135, 255, 0.95)",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: l
}, d = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	axis: "rgba(42, 46, 57, 0.55)",
	inactive: "#9598a1",
	brushFill: "rgba(41, 98, 255, 0.14)",
	brushBorder: "rgba(41, 98, 255, 0.85)",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: l
}, f = [
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
], p = [
	"#2962ff",
	"#00bcd4",
	"#8bc34a",
	"#ffc107",
	"#f23645"
], m = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"), h = (e, t, n) => Math.min(n, Math.max(t, e)), g = (e) => 1 - (1 - e) ** 3, _ = class {
	constructor(e, t = {}) {
		this.list = [], this.hiddenKeys = /* @__PURE__ */ new Set(), this.hiddenPieces = /* @__PURE__ */ new Set(), this.models = [], this.axes = [], this.scales = [], this.order = [], this.ranges = [], this.D = 0, this.N = 0, this.T = /* @__PURE__ */ new Float64Array(), this.lineModel = [], this.lineRow = [], this.lineName = [], this.lineValue = [], this.lineColor = [], this.linePiece = /* @__PURE__ */ new Int16Array(), this.visible = /* @__PURE__ */ new Uint8Array(), this.active = /* @__PURE__ */ new Uint8Array(), this.batches = [], this.inactiveLines = [], this.pos = [], this.c0 = 0, this.c1 = 0, this.nameBoxes = [], this.tickStride = [], this.labelMax = [], this.hover = -1, this.drag = null, this.dragged = !1, this.dirty = !0, this.width = 0, this.height = 0, this.dpr = 1, this.animStart = 0, this.raf = 0, this.handlers = /* @__PURE__ */ new Map(), this.destroyed = !1, this.opts = { ...t }, this.root = e, e.classList.add("pl-root"), this.titleEl = document.createElement("div"), this.titleEl.className = "pl-title", this.bodyEl = document.createElement("div"), this.plotEl = document.createElement("div"), this.plotEl.className = "pl-plot", this.canvas = document.createElement("canvas"), this.canvas.className = "pl-canvas", this.canvas.setAttribute("role", "img"), this.ctx = this.canvas.getContext("2d"), this.layer = document.createElement("canvas"), this.lctx = this.layer.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "pl-tooltip", this.vmEl = document.createElement("div"), this.vmEl.className = "pl-vm", this.legendEl = document.createElement("ul"), this.plotEl.append(this.canvas, this.tooltipEl, this.vmEl), this.bodyEl.append(this.plotEl, this.legendEl), e.append(this.titleEl, this.bodyEl), this.list = (t.series ?? []).map((e) => ({ ...e }));
		for (let e of this.list) e.hidden && this.hiddenKeys.add(this.keyOf(e));
		this.applyLook(), this.bind(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(this.plotEl), this.measure(), this.rebuild(!0);
	}
	get series() {
		return this.list.map((e) => ({ ...e }));
	}
	get axisOrder() {
		return [...this.order];
	}
	setSeries(e, t = !0) {
		this.list = e.map((e) => ({ ...e }));
		for (let e of this.list) e.hidden && this.hiddenKeys.add(this.keyOf(e));
		this.rebuild(t), this.ranges.length && this.emitBrush();
	}
	setOptions(e, t = !0) {
		if (e.series) {
			this.list = e.series.map((e) => ({ ...e }));
			for (let e of this.list) e.hidden && this.hiddenKeys.add(this.keyOf(e));
		}
		"visualMap" in e && this.hiddenPieces.clear(), this.opts = {
			...this.opts,
			...e
		}, this.applyLook(), this.rebuild(t), this.ranges.length && this.emitBrush();
	}
	toggle(e, t) {
		let n = t ?? !this.hiddenKeys.has(e);
		n ? this.hiddenKeys.add(e) : this.hiddenKeys.delete(e), this.emit("toggle", {
			id: e,
			hidden: n
		}), this.renderLegend(), this.regroup(), this.emitBrush(), this.draw();
	}
	setBrush(e) {
		this.ranges = [];
		for (let t of e) {
			let e = this.scales[t.axis];
			if (!e) continue;
			let n = (t.categories ? t.categories.map((t) => e.toT(t)) : [e.toT(t.from ?? e.min), e.toT(t.to ?? e.max)]).filter((e) => Number.isFinite(e));
			n.length && this.ranges.push({
				dim: t.axis,
				lo: h(Math.min(...n), 0, 1),
				hi: h(Math.max(...n), 0, 1)
			});
		}
		this.regroup(), this.emitBrush(), this.draw();
	}
	clearBrush() {
		this.setBrush([]);
	}
	getSelection() {
		let e = /* @__PURE__ */ new Map(), t = 0, n = 0;
		for (let r = 0; r < this.N; r++) {
			if (!this.visible[r] || (n++, !this.active[r])) continue;
			t++;
			let i = this.lineModel[r];
			e.has(i) || e.set(i, []), e.get(i).push(this.lineRow[r]);
		}
		return {
			ranges: this.ranges.map((e) => ({
				axis: e.dim,
				name: this.axes[e.dim].name,
				...s(this.scales[e.dim], e.lo, e.hi)
			})),
			selected: this.models.filter((e) => !this.hiddenKeys.has(e.key)).map((t) => ({
				seriesIndex: t.index,
				name: t.src.name,
				indices: e.get(t.index) ?? []
			})),
			count: t,
			total: n
		};
	}
	setAxisOrder(e) {
		e.length !== this.D || new Set(e).size !== this.D || e.some((e) => !(e >= 0 && e < this.D)) || (this.order = [...e], this.layout(), this.dirty = !0, this.draw());
	}
	on(e, t) {
		this.handlers.has(e) || this.handlers.set(e, /* @__PURE__ */ new Set());
		let n = t;
		return this.handlers.get(e).add(n), () => this.handlers.get(e)?.delete(n);
	}
	resize() {
		this.measure(), this.layout(), this.dirty = !0, this.draw();
	}
	screenshot() {
		return this.draw(), this.canvas.toDataURL("image/png");
	}
	destroy() {
		this.destroyed = !0, cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("pl-root"), this.titleEl.remove(), this.bodyEl.remove();
	}
	keyOf(e) {
		return e.id ?? e.name;
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t));
	}
	emitBrush() {
		this.handlers.get("brush")?.size && this.emit("brush", this.getSelection());
	}
	applyLook() {
		let e = this.opts, t = {
			...e.theme === "light" ? d : u,
			...typeof e.theme == "object" ? e.theme : {}
		};
		e.background && (t.background = e.background), this.theme = t;
		let n = {
			"--pl-bg": t.background,
			"--pl-text": t.text,
			"--pl-muted": t.muted,
			"--pl-tt-bg": t.tooltipBg,
			"--pl-tt-text": t.tooltipText,
			"--pl-tt-border": t.tooltipBorder,
			"--pl-font": t.font
		};
		for (let [e, t] of Object.entries(n)) this.root.style.setProperty(e, t);
		let r = typeof e.title == "string" ? { text: e.title } : e.title;
		this.titleEl.style.display = r ? "" : "none", r && (this.titleEl.style.textAlign = r.align ?? "center", this.titleEl.innerHTML = `<b>${m(r.text)}</b>${r.subtext ? `<small>${m(r.subtext)}</small>` : ""}`), this.dirty = !0;
	}
	rebuild(e) {
		let t = this.opts, r = t.colors ?? f;
		this.axes = t.axes ?? [];
		let a = this.D = this.axes.length;
		this.order.length !== a && (this.order = this.axes.map((e, t) => t)), this.ranges = this.ranges.filter((e) => e.dim < a);
		let s = (e) => e === !0 ? .5 : typeof e == "number" ? h(e, 0, 1) : 0;
		this.models = this.list.map((e, n) => ({
			key: this.keyOf(e),
			src: e,
			index: n,
			color: e.color ?? r[n % r.length],
			width: e.width ?? t.lineWidth ?? 1.2,
			opacity: e.opacity ?? t.opacity ?? .75,
			smooth: s(e.smooth ?? t.smooth)
		})), this.lineModel = [], this.lineRow = [], this.lineName = [], this.lineValue = [];
		let c = [];
		this.models.forEach((e) => {
			e.src.data.forEach((t, n) => {
				let r = Array.isArray(t) ? { value: t } : t;
				this.lineModel.push(e.index), this.lineRow.push(n), this.lineName.push(r.name ?? e.src.name), this.lineValue.push(r.value), c.push(r.color);
			});
		});
		let l = this.N = this.lineModel.length;
		this.scales = this.axes.map((e, t) => i(e, this.lineValue.map((e) => e[t] ?? null))), this.T = new Float64Array(l * a);
		for (let e = 0; e < l; e++) for (let t = 0; t < a; t++) this.T[e * a + t] = this.scales[t].toT(this.lineValue[e][t]);
		let u = t.visualMap, d = u && u.dimension >= 0 && u.dimension < a ? u.dimension : -1;
		this.linePiece = new Int16Array(l).fill(-1), this.lineColor = Array(l);
		let m = /* @__PURE__ */ new Map(), g = this.vmRange();
		for (let e = 0; e < l; e++) {
			let t = this.models[this.lineModel[e]], r = c[e] ?? t.color;
			if (u && d >= 0 && !c[e]) {
				let t = this.lineValue[e][d];
				if (u.pieces?.length) {
					let n = o(u.pieces, t);
					this.linePiece[e] = n, n >= 0 && (r = u.pieces[n].color);
				} else {
					let e = this.vmNumber(t);
					if (Number.isFinite(e)) {
						let t = Math.round(h((e - g[0]) / (g[1] - g[0] || 1), 0, 1) * 48);
						m.has(t) || m.set(t, n(u.colors ?? p, t / 48)), r = m.get(t);
					}
				}
			}
			this.lineColor[e] = r;
		}
		this.hover = -1, this.regroup(), this.renderLegend(), this.renderVisual(), this.layout();
		let _ = t.animation ?? !0;
		this.animStart = e && _ !== !1 && this.duration() > 0 ? performance.now() : 0, this.loop();
	}
	vmNumber(e) {
		let t = this.opts.visualMap, n = this.scales[t.dimension];
		if (n?.type === "category") {
			let t = n.categories.indexOf(String(e));
			return t < 0 ? NaN : t;
		}
		return typeof e == "number" ? e : NaN;
	}
	vmRange() {
		let e = this.opts.visualMap, t = e ? this.scales[e.dimension] : void 0;
		return !e || !t ? [0, 1] : [e.min ?? t.min, e.max ?? t.max];
	}
	regroup() {
		let e = this.N;
		this.visible = new Uint8Array(e), this.active = new Uint8Array(e);
		let t = /* @__PURE__ */ new Map();
		this.inactiveLines = [];
		for (let n = 0; n < e; n++) {
			let e = this.models[this.lineModel[n]];
			if (this.hiddenKeys.has(e.key) || this.linePiece[n] >= 0 && this.hiddenPieces.has(this.linePiece[n])) continue;
			if (this.visible[n] = 1, !a(this.T, n, this.D, this.ranges)) {
				this.inactiveLines.push(n);
				continue;
			}
			this.active[n] = 1;
			let r = `${this.lineColor[n]}|${e.opacity}|${e.width}|${e.smooth}`, i = t.get(r);
			i || t.set(r, i = {
				color: this.lineColor[n],
				alpha: e.opacity,
				width: e.width,
				smooth: e.smooth,
				lines: []
			}), i.lines.push(n);
		}
		this.batches = [...t.values()], this.hover >= 0 && !this.active[this.hover] && (this.hover = -1), this.dirty = !0;
	}
	duration() {
		let e = this.opts.animation ?? !0;
		return e === !1 ? 0 : typeof e == "object" ? e.duration ?? 900 : 900;
	}
	progress(e) {
		return this.animStart ? g(h((e - this.animStart) / (this.duration() || 1), 0, 1)) : 1;
	}
	loop() {
		if (cancelAnimationFrame(this.raf), this.destroyed) return;
		let e = performance.now();
		this.draw(e), this.animStart && e - this.animStart < this.duration() ? this.raf = requestAnimationFrame(() => this.loop()) : (this.animStart = 0, this.draw());
	}
	legendCfg() {
		let e = this.opts.legend, t = typeof e == "object" ? e : {};
		return {
			show: (typeof e == "boolean" ? e : t.show) ?? this.list.length > 1,
			position: t.position ?? "bottom",
			interactive: t.interactive ?? !0
		};
	}
	renderLegend() {
		let e = this.legendCfg();
		this.bodyEl.className = `pl-body pl-legend-${e.position}`, this.legendEl.className = "pl-legend", this.legendEl.style.display = e.show ? "" : "none", e.show && (this.legendEl.innerHTML = this.models.map((t) => {
			let n = this.hiddenKeys.has(t.key);
			return `<li class="pl-legend__item${e.interactive ? " is-interactive" : ""}${n ? " is-hidden" : ""}" data-key="${m(t.key)}"><i class="pl-legend__marker" style="--c:${t.color}"></i><span>${m(t.src.name)}</span></li>`;
		}).join(""), this.compactLegend());
	}
	compactLegend() {
		let e = this.legendCfg();
		!e.show || e.position !== "top" && e.position !== "bottom" || (this.legendEl.classList.remove("is-compact"), this.legendEl.offsetHeight > this.root.clientHeight * .25 && this.legendEl.classList.add("is-compact"));
	}
	vmFmt(e) {
		let n = this.opts.visualMap;
		return n.format ? n.format(e) : t(e);
	}
	renderVisual() {
		let e = this.opts.visualMap, t = e ? this.scales[e.dimension] : void 0;
		if (!e || !t || e.show === !1) {
			this.vmEl.style.display = "none", this.vmEl.innerHTML = "";
			return;
		}
		this.vmEl.style.display = "";
		let n = `<span class="pl-vm__title">${m(e.title ?? this.axes[e.dimension].name)}</span>`;
		if (e.pieces?.length) n += e.pieces.map((e, t) => {
			let n = e.label ?? (e.value === void 0 ? e.min !== void 0 && e.max !== void 0 ? `${this.vmFmt(e.min)} – ${this.vmFmt(e.max)}` : e.min === void 0 ? `< ${this.vmFmt(e.max ?? 0)}` : `≥ ${this.vmFmt(e.min)}` : String(e.value));
			return `<span class="pl-vm__piece${this.hiddenPieces.has(t) ? " is-hidden" : ""}" data-piece="${t}"><i style="background:${e.color}"></i>${m(n)}</span>`;
		}).join("");
		else {
			let [r, i] = this.vmRange(), a = (e) => t.type === "category" ? t.categories[Math.round(e)] ?? "" : this.vmFmt(e);
			n += `<span>${m(a(r))}</span><span class="pl-vm__bar" style="background:linear-gradient(to right,${(e.colors ?? p).join(",")})"></span><span>${m(a(i))}</span>`;
		}
		this.vmEl.innerHTML = n;
	}
	measure() {
		this.compactLegend();
		let e = this.plotEl.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height));
		for (let e of [this.canvas, this.layer]) e.width = Math.round(this.width * this.dpr), e.height = Math.round(this.height * this.dpr);
		this.canvas.style.width = `${this.width}px`, this.canvas.style.height = `${this.height}px`;
	}
	font(e, t = 400) {
		return `${t} ${e}px ${this.theme.font}`;
	}
	nameFs() {
		return this.opts.axisName?.fontSize ?? 12;
	}
	labelCfg() {
		let e = this.opts.axisLabel ?? !0, t = typeof e == "object" ? e : {};
		return {
			show: e !== !1,
			color: t.color,
			fontSize: t.fontSize ?? 11
		};
	}
	tickText(e, n) {
		let r = this.axes[e];
		return r.formatter ? r.formatter(n) : typeof n == "number" ? t(n) : n;
	}
	fit(e, t) {
		let n = this.ctx;
		if (n.measureText(e).width <= t) return e;
		let r = e;
		for (; r.length > 1 && n.measureText(r + "…").width > t;) r = r.slice(0, -1);
		return r + "…";
	}
	horizontal() {
		return (this.opts.layout ?? "horizontal") === "horizontal";
	}
	layout() {
		let e = this.D;
		if (this.pos = [], this.nameBoxes = [], this.tickStride = [], this.labelMax = [], !e) return;
		let t = this.ctx, n = this.opts.padding ?? 12, r = this.nameFs(), i = this.labelCfg(), a = this.vmEl.style.display === "none" ? 0 : this.vmEl.offsetHeight + 6, o = this.width, s = this.height;
		t.font = this.font(r, 600);
		let c = this.order.map((e) => this.axes[e].name), l = c.map((e) => t.measureText(e).width);
		t.font = this.font(i.fontSize);
		let u = (e) => i.show ? Math.max(0, ...this.scales[e].ticks.map((n) => t.measureText(this.tickText(e, n.value)).width)) : 0;
		if (this.horizontal()) {
			let d = n + r + 10, f = Math.max(d + 10, s - n - a - (i.show ? i.fontSize / 2 + 2 : 0)), p = o - n * 2, m = e > 1 ? Math.max(30, p / (e - 1) - 8) : p, h = p * .22, g = i.show ? Math.min(u(this.order[0]), h) : 0, _ = i.show && e > 1 ? Math.min(u(this.order[e - 1]), h) : 0, v = n + Math.max(g ? g + 8 : 0, Math.min(l[0], m) / 2), y = Math.max(v + 10, o - n - Math.max(_ ? _ + 8 : 0, Math.min(l[e - 1], m) / 2)), b = e > 1 ? (y - v) / (e - 1) : 0;
			this.labelMax = this.order.map((t, n) => n === 0 ? g : n === e - 1 && e > 1 ? _ : Math.max(16, b - 16)), this.pos = this.order.map((t, n) => e > 1 ? v + n * b : (v + y) / 2), this.c0 = f, this.c1 = d, t.font = this.font(r, 600);
			let x = e > 1 ? Math.max(12, b - 6) : p;
			this.nameBoxes = c.map((e, n) => {
				let i = this.fit(e, x), a = t.measureText(i).width;
				return {
					x: this.pos[n] - a / 2,
					y: d - 8 - r,
					w: a,
					h: r + 4,
					text: i
				};
			});
		} else {
			let d = Math.max(30, o * .28), f = n + Math.min(Math.max(...l), d) + 12, p = n + 6, m = Math.max(p + 10, s - n - a - (i.show ? i.fontSize + 8 : 4)), h = i.show ? Math.max(...this.order.map((e) => u(e))) / 2 : 0, g = Math.max(f + 10, o - n - h);
			this.pos = this.order.map((t, n) => e > 1 ? p + n * (m - p) / (e - 1) : (p + m) / 2), this.labelMax = this.order.map(() => Infinity), this.c0 = f, this.c1 = g, t.font = this.font(r, 600), this.nameBoxes = c.map((e, i) => {
				let a = this.fit(e, f - n - 12), o = t.measureText(a).width;
				return {
					x: f - 12 - o,
					y: this.pos[i] - r / 2 - 2,
					w: o,
					h: r + 4,
					text: a
				};
			});
		}
		t.font = this.font(i.fontSize);
		let d = Math.abs(this.c1 - this.c0);
		this.tickStride = this.order.map((e) => {
			let t = this.scales[e].ticks;
			if (t.length < 2) return 1;
			let n = Math.abs(t[1].t - t[0].t) * d, r = this.horizontal() ? i.fontSize + 6 : u(e) + 10;
			return Math.max(1, Math.ceil(r / Math.max(n, 1e-6)));
		});
	}
	cross(e) {
		return this.c0 + (this.c1 - this.c0) * e;
	}
	pt(e, t) {
		return this.horizontal() ? [e, t] : [t, e];
	}
	trace(e, t, n) {
		let r = this.D, i = !1, a = 0, o = 0;
		for (let s = 0; s < r; s++) {
			let c = this.T[t * r + this.order[s]];
			if (!Number.isFinite(c)) {
				i = !1;
				continue;
			}
			let l = this.pos[s], u = this.cross(c), [d, f] = this.pt(l, u);
			if (!i) e.moveTo(d, f);
			else if (n) {
				let t = (l - a) * n, [r, i] = this.pt(a + t, o), [s, c] = this.pt(l - t, u);
				e.bezierCurveTo(r, i, s, c, d, f);
			} else e.lineTo(d, f);
			i = !0, a = l, o = u;
		}
	}
	paintLines(e) {
		e.lineJoin = "round", e.lineCap = "round";
		let t = this.opts.inactive ?? {};
		if (this.inactiveLines.length) {
			e.globalAlpha = t.opacity ?? .12, e.strokeStyle = t.color ?? this.theme.inactive, e.lineWidth = 1;
			for (let t = 0; t < this.inactiveLines.length; t += 500) {
				e.beginPath();
				for (let n of this.inactiveLines.slice(t, t + 500)) this.trace(e, n, this.models[this.lineModel[n]].smooth);
				e.stroke();
			}
		}
		for (let t of this.batches) {
			e.globalAlpha = t.alpha, e.strokeStyle = t.color, e.lineWidth = t.width;
			for (let n = 0; n < t.lines.length; n += 500) {
				e.beginPath();
				for (let r of t.lines.slice(n, n + 500)) this.trace(e, r, t.smooth);
				e.stroke();
			}
		}
		e.globalAlpha = 1;
	}
	renderLayer() {
		let e = this.lctx;
		e.setTransform(1, 0, 0, 1, 0, 0), e.clearRect(0, 0, this.layer.width, this.layer.height), e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), this.paintLines(e), this.dirty = !1;
	}
	draw(e = performance.now()) {
		let t = this.ctx, n = this.theme;
		if (t.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), t.clearRect(0, 0, this.width, this.height), n.background !== "transparent" && (t.fillStyle = n.background, t.fillRect(0, 0, this.width, this.height)), !this.D) return;
		let r = this.progress(e);
		if (r < 1) {
			let e = this.pos[0], n = this.pos[this.D - 1], i = e - 2 + (n - e + 4) * r;
			t.save(), t.beginPath(), this.horizontal() ? t.rect(0, 0, i, this.height) : t.rect(0, 0, this.width, i), t.clip(), this.paintLines(t), t.restore(), this.dirty = !0;
		} else this.dirty && this.renderLayer(), t.setTransform(1, 0, 0, 1, 0, 0), t.drawImage(this.layer, 0, 0), t.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
		this.drawBrushes(), this.drawAxes(), this.hover >= 0 && r >= 1 && this.drawHover(this.hover);
	}
	brushOn() {
		return this.opts.brush !== !1;
	}
	drawBrushes() {
		if (!this.ranges.length) return;
		let e = this.ctx, t = typeof this.opts.brush == "object" ? this.opts.brush : {};
		e.fillStyle = t.fill ?? this.theme.brushFill, e.strokeStyle = t.border ?? this.theme.brushBorder, e.lineWidth = 1;
		for (let t of this.ranges) {
			let n = this.order.indexOf(t.dim);
			if (n < 0) continue;
			let r = this.cross(t.lo), i = this.cross(t.hi), a = Math.min(r, i) - 1, o = Math.max(2, Math.abs(i - r) + 2), [s, c, l, u] = this.horizontal() ? [
				this.pos[n] - 9,
				a,
				18,
				o
			] : [
				a,
				this.pos[n] - 9,
				o,
				18
			];
			e.beginPath(), e.roundRect(s + .5, c + .5, l, u, 3), e.fill(), e.stroke();
		}
	}
	drawAxes() {
		let e = this.ctx, t = this.theme, n = this.labelCfg(), r = this.nameFs(), i = this.horizontal(), a = t.background !== "transparent";
		this.order.forEach((o, s) => {
			let c = this.axes[o], l = this.scales[o], u = this.pos[s], d = c.color ?? t.axis;
			e.strokeStyle = d, e.lineWidth = 1, e.beginPath();
			let [f, p] = this.pt(Math.round(u) + .5, this.c0), [m, h] = this.pt(Math.round(u) + .5, this.c1);
			e.moveTo(f, p), e.lineTo(m, h), e.stroke();
			let g = this.tickStride[s] ?? 1;
			e.font = this.font(n.fontSize), e.lineJoin = "round", l.ticks.forEach((r, c) => {
				if (c % g) return;
				let l = Math.round(this.cross(r.t)) + .5;
				if (e.strokeStyle = d, e.lineWidth = 1, e.beginPath(), i) {
					let t = s === this.D - 1 && this.D > 1;
					e.moveTo(t ? u + 4 : u - 4, l), e.lineTo(u, l);
				} else e.moveTo(l, u), e.lineTo(l, u + 4);
				if (e.stroke(), !n.show) return;
				let f = this.fit(this.tickText(o, r.value), this.labelMax[s] ?? Infinity), p = i && s === this.D - 1 && this.D > 1;
				e.textAlign = i ? p ? "left" : "right" : "center", e.textBaseline = i ? "middle" : "top";
				let [m, h] = i ? [p ? u + 7 : u - 7, l] : [l, u + 6];
				a && (e.strokeStyle = t.background, e.lineWidth = 3, e.strokeText(f, m, h)), e.fillStyle = n.color ?? t.muted, e.fillText(f, m, h);
			});
			let _ = this.nameBoxes[s];
			_ && (this.drag?.kind === "axis" && this.drag.dim === o && (e.fillStyle = t.brushFill, e.beginPath(), e.roundRect(_.x - 4, _.y - 1, _.w + 8, _.h + 2, 4), e.fill()), e.font = this.font(r, 600), e.fillStyle = c.color ?? this.opts.axisName?.color ?? t.text, e.textAlign = "left", e.textBaseline = "middle", e.fillText(_.text, _.x, _.y + _.h / 2 + .5));
		});
	}
	drawHover(e) {
		let t = this.ctx, n = this.models[this.lineModel[e]];
		t.globalAlpha = 1, t.lineJoin = "round", t.lineCap = "round", this.theme.background !== "transparent" && (t.strokeStyle = this.theme.background, t.lineWidth = n.width + 4, t.beginPath(), this.trace(t, e, n.smooth), t.stroke()), t.strokeStyle = this.lineColor[e], t.lineWidth = n.width + 1.6, t.beginPath(), this.trace(t, e, n.smooth), t.stroke(), t.fillStyle = this.lineColor[e];
		for (let n = 0; n < this.D; n++) {
			let r = this.T[e * this.D + this.order[n]];
			if (!Number.isFinite(r)) continue;
			let [i, a] = this.pt(this.pos[n], this.cross(r));
			t.beginPath(), t.arc(i, a, 3, 0, Math.PI * 2), t.fill();
		}
	}
	info(e) {
		let t = this.models[this.lineModel[e]];
		return {
			series: t.src,
			seriesIndex: t.index,
			index: this.lineRow[e],
			name: this.lineName[e],
			value: this.lineValue[e],
			color: this.lineColor[e],
			axes: this.axes
		};
	}
	hitTest(e, t) {
		let n = this.D;
		if (n < 2) return -1;
		let r = this.horizontal(), i = r ? e : t, a = r ? t : e, o = -1;
		for (let e = 0; e < n - 1; e++) i >= this.pos[e] && i <= this.pos[e + 1] && (o = e);
		if (o < 0) return -1;
		let s = this.pos[o + 1] - this.pos[o] || 1, l = (i - this.pos[o]) / s, u = this.order[o], d = this.order[o + 1], f = this.c1 - this.c0, p = -1, m = 6;
		for (let e = 0; e < this.N; e++) {
			if (!this.active[e]) continue;
			let t = this.T[e * n + u], r = this.T[e * n + d];
			if (!Number.isFinite(t) || !Number.isFinite(r)) continue;
			let i = this.models[this.lineModel[e]].smooth, o = this.c0 + f * c(t, r, l, i), h = (r - t) * f / s, g = Math.abs(o - a) / Math.sqrt(1 + (i ? 0 : h * h));
			g < m && (m = g, p = e);
		}
		return p;
	}
	axisAt(e, t) {
		let n = this.horizontal(), r = n ? e : t, i = n ? t : e, a = Math.min(this.c0, this.c1) - 8, o = Math.max(this.c0, this.c1) + 8;
		if (i < a || i > o) return -1;
		let s = -1, c = 13;
		return this.pos.forEach((e, t) => {
			let n = Math.abs(e - r);
			n < c && (c = n, s = t);
		}), s;
	}
	nameAt(e, t) {
		return this.nameBoxes.findIndex((n) => e >= n.x - 6 && e <= n.x + n.w + 6 && t >= n.y - 4 && t <= n.y + n.h + 4);
	}
	tAt(e, t) {
		return h(((this.horizontal() ? t : e) - this.c0) / (this.c1 - this.c0 || 1), 0, 1);
	}
	setRange(e, t, n) {
		this.ranges = this.ranges.filter((t) => t.dim !== e), n !== null && this.ranges.push({
			dim: e,
			lo: Math.min(t, n),
			hi: Math.max(t, n)
		}), this.regroup(), this.emitBrush(), this.draw();
	}
	bind() {
		let e = (e) => {
			let t = this.canvas.getBoundingClientRect();
			return {
				x: e.clientX - t.left,
				y: e.clientY - t.top
			};
		};
		this.canvas.addEventListener("pointerdown", (t) => {
			if (t.button !== 0 || !this.D) return;
			let { x: n, y: r } = e(t), i = this.opts.axisReorder !== !1 && this.D > 1 ? this.nameAt(n, r) : -1;
			if (i >= 0) this.drag = {
				kind: "axis",
				dim: this.order[i],
				x0: n,
				y0: r,
				moved: !1
			};
			else if (this.brushOn()) {
				let e = this.axisAt(n, r);
				if (e < 0) return;
				let t = this.order[e], i = this.tAt(n, r), a = this.ranges.find((e) => e.dim === t);
				this.drag = a && i >= a.lo && i <= a.hi ? {
					kind: "move",
					dim: t,
					t0: i,
					lo: a.lo,
					hi: a.hi,
					x0: n,
					y0: r,
					moved: !1
				} : {
					kind: "brush",
					dim: t,
					t0: i,
					x0: n,
					y0: r,
					moved: !1
				};
			} else return;
			this.canvas.setPointerCapture(t.pointerId), this.setHover(-1), this.tooltipEl.classList.remove("is-visible"), t.preventDefault();
		}), this.canvas.addEventListener("pointermove", (t) => {
			let { x: n, y: r } = e(t), i = this.drag;
			if (i) {
				if (!i.moved && Math.hypot(n - i.x0, r - i.y0) < 3) return;
				if (i.moved = !0, i.kind === "brush") this.setRange(i.dim, i.t0, this.tAt(n, r));
				else if (i.kind === "move") {
					let e = i.hi - i.lo, t = h(i.lo + this.tAt(n, r) - i.t0, 0, 1 - e);
					this.setRange(i.dim, t, t + e);
				} else {
					let e = this.horizontal() ? n : r, t = 0, a = Infinity;
					this.pos.forEach((n, r) => {
						Math.abs(n - e) < a && (a = Math.abs(n - e), t = r);
					});
					let o = this.order.indexOf(i.dim);
					t !== o && (this.order.splice(o, 1), this.order.splice(t, 0, i.dim), this.layout(), this.dirty = !0), this.draw();
				}
				return;
			}
			let a = this.hitTest(n, r);
			this.setHover(a);
			let o = this.opts.axisReorder !== !1 && this.D > 1 && this.nameAt(n, r) >= 0;
			this.canvas.style.cursor = o ? "grab" : a >= 0 ? "pointer" : this.brushOn() && this.axisAt(n, r) >= 0 ? "crosshair" : "", this.showTooltip(t);
		});
		let t = (e) => {
			let t = this.drag;
			t && (this.drag = null, this.dragged = t.moved || t.kind !== "axis", this.canvas.hasPointerCapture(e.pointerId) && this.canvas.releasePointerCapture(e.pointerId), !t.moved && t.kind !== "axis" && this.setRange(t.dim, 0, null), t.kind === "axis" && (t.moved && this.emit("axisorder", [...this.order]), this.draw()));
		};
		this.canvas.addEventListener("pointerup", t), this.canvas.addEventListener("pointercancel", t), this.canvas.addEventListener("pointerleave", () => {
			this.drag || (this.setHover(-1), this.tooltipEl.classList.remove("is-visible"));
		}), this.canvas.addEventListener("click", (t) => {
			let { x: n, y: r } = e(t);
			if (this.dragged) {
				this.dragged = !1;
				return;
			}
			let i = this.hitTest(n, r);
			i >= 0 && this.emit("click", this.info(i));
		}), this.legendEl.addEventListener("click", (e) => {
			let t = e.target.closest(".pl-legend__item");
			t && this.legendCfg().interactive && this.toggle(t.dataset.key);
		}), this.vmEl.addEventListener("click", (e) => {
			let t = e.target.closest(".pl-vm__piece");
			if (!t) return;
			let n = Number(t.dataset.piece);
			this.hiddenPieces.has(n) ? this.hiddenPieces.delete(n) : this.hiddenPieces.add(n), t.classList.toggle("is-hidden", this.hiddenPieces.has(n)), this.regroup(), this.emitBrush(), this.draw();
		});
	}
	setHover(e) {
		e !== this.hover && (this.hover = e, this.emit("hover", e >= 0 ? this.info(e) : null), this.draw());
	}
	fmtValue(e, t) {
		return e == null ? "–" : this.opts.valueFormatter ? this.opts.valueFormatter(e, t) : typeof e == "number" ? e.toLocaleString("pt-PT", { maximumFractionDigits: 2 }) : e;
	}
	showTooltip(e) {
		let t = this.opts.tooltip ?? !0, n = this.tooltipEl, r = this.hover;
		if (r < 0 || t === !1 || typeof t == "object" && t.show === !1) {
			n.classList.remove("is-visible");
			return;
		}
		let i = this.info(r);
		if (typeof t == "object" && t.formatter) n.innerHTML = t.formatter(i);
		else {
			let e = i.name === i.series.name ? "" : `<div class="pl-tooltip__sub">${m(i.series.name)}</div>`;
			n.innerHTML = `<div class="pl-tooltip__head"><i class="pl-tooltip__dot" style="background:${i.color}"></i>${m(i.name)}</div>${e}` + this.order.map((e) => `<div class="pl-tooltip__row"><span>${m(this.axes[e].name)}</span><b>${m(this.fmtValue(i.value[e], this.axes[e]))}</b></div>`).join("");
		}
		n.classList.add("is-visible");
		let a = this.plotEl.getBoundingClientRect(), o = e.clientX - a.left, s = e.clientY - a.top, c = n.offsetWidth, l = n.offsetHeight, u = o + 16 + c > this.width ? o - 16 - c : o + 16, d = h(s + 16 + l > this.height ? s - 16 - l : s + 16, 0, Math.max(0, this.height - l));
		n.style.transform = `translate(${Math.max(0, u)}px, ${d}px)`;
	}
};
function v(e, t = {}) {
	return new _(e, t);
}
//#endregion
export { d as a, o as c, u as i, s as l, _ as n, i as o, v as r, a as s, f as t, c as u };

//# sourceMappingURL=parallel.js.map