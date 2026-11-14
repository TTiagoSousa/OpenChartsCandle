import { r as e, t } from "./format.js";
import { n, r } from "./color.js";
//#region src/heatmap/grid.ts
function i(e, t) {
	if (e?.data) return e.data;
	let n = e?.bins;
	return n ? Array.from({ length: n.count ?? t }, (e, t) => +(n.min + t * n.step).toPrecision(12)) : Array.from({ length: t }, (e, t) => t);
}
function a(e, t, n) {
	if (typeof t == "string") return n?.get(t) ?? (/^\d+$/.test(t) && !e?.data ? Number(t) : -1);
	if (!Number.isFinite(t)) return -1;
	let r = e?.bins;
	return r && !e?.data ? Math.floor((t - r.min) / r.step + 1e-9) : Math.round(t);
}
function o(e, t, n, r) {
	let o = n?.data ? new Map(n.data.map((e, t) => [String(e), t])) : null, s = r?.data ? new Map(r.data.map((e, t) => [String(e), t])) : null, c = n?.data?.length ?? n?.bins?.count ?? 0, l = r?.data?.length ?? r?.bins?.count ?? 0, u = [];
	if (t) {
		l = Math.max(l, t.length);
		for (let e of t) c = Math.max(c, e.length);
	}
	for (let t of e ?? []) {
		let e = Array.isArray(t) ? null : t, i = a(n, Array.isArray(t) ? t[0] : t.x, o), d = a(r, Array.isArray(t) ? t[1] : t.y, s);
		if (i < 0 || d < 0) continue;
		let f = Array.isArray(t) ? t[2] : t.value;
		u.push([
			i,
			d,
			typeof f == "number" && Number.isFinite(f) ? f : NaN,
			e
		]), !n?.data && !n?.bins?.count && (c = Math.max(c, i + 1)), !r?.data && !r?.bins?.count && (l = Math.max(l, d + 1));
	}
	let d = new Float64Array(c * l).fill(NaN), f = /* @__PURE__ */ new Map();
	t && t.forEach((e, t) => e.forEach((e, n) => {
		n < c && t < l && typeof e == "number" && Number.isFinite(e) && (d[t * c + n] = e);
	}));
	for (let [e, t, n, r] of u) e >= c || t >= l || (d[t * c + e] = n, r && f.set(t * c + e, r));
	let p = Infinity, m = -Infinity;
	for (let e = 0; e < d.length; e++) {
		let t = d[e];
		t < p && (p = t), t > m && (m = t);
	}
	return p === Infinity && ([p, m] = [0, 1]), {
		nx: c,
		ny: l,
		values: d,
		datums: f,
		xNames: i(n, c),
		yNames: i(r, l),
		min: p,
		max: m
	};
}
function s(t, n) {
	let r = Math.max(1, Math.ceil(t / Math.max(n, 1e-6)));
	return r <= 2 ? r : Math.ceil(e(r));
}
function c(e, t, n, r = "auto", i = 6) {
	let a = (e) => e === 0 ? t + i : Math.min(t + i, (n + i) / Math.sin(Math.abs(e) * Math.PI / 180)), o = (t) => s(a(t), e);
	if (r !== "auto") return {
		rotate: r,
		step: o(r)
	};
	let c = o(0);
	if (c === 1) return {
		rotate: 0,
		step: 1
	};
	let l = o(45);
	return l < c ? {
		rotate: 45,
		step: l
	} : {
		rotate: 0,
		step: c
	};
}
function l(e, t, n = Infinity) {
	for (let r = 0; r < e.length; r++) {
		let i = e[r];
		if (i.value !== void 0) {
			if (t === i.value) return r;
		} else if ((i.min === void 0 || t >= i.min) && (i.max === void 0 || t < i.max || t === i.max && i.max >= n)) return r;
	}
	return -1;
}
function u(e, r, i, a, o = (e) => t(e)) {
	let s = Math.max(1, Math.round(i)), c = (r - e) / s;
	return Array.from({ length: s }, (t, i) => {
		let l = e + i * c, u = i === s - 1 ? r : e + (i + 1) * c;
		return {
			min: l,
			max: u,
			color: n(a, s > 1 ? i / (s - 1) : 1),
			label: `${o(l)} – ${o(u)}`
		};
	});
}
function d(e, t) {
	let n = new Uint32Array(t + 1);
	for (let t = 0; t < e.length; t++) e[t] >= 0 && n[e[t] + 1]++;
	for (let e = 0; e < t; e++) n[e + 1] += n[e];
	let r = new Uint32Array(n[t]), i = n.slice(0, t);
	for (let t = 0; t < e.length; t++) {
		let n = e[t];
		n >= 0 && (r[i[n]++] = t);
	}
	return {
		order: r,
		start: n
	};
}
function f(e) {
	let t = [];
	for (let n = 1; n < e.length; n++) t.push(e[n - 1] ? e[n] / e[n - 1] - 1 : NaN);
	return t;
}
function p(e) {
	let t = e.length, n = Array.from({ length: t }, () => Array(t).fill(0));
	for (let r = 0; r < t; r++) {
		n[r][r] = 1;
		for (let i = r + 1; i < t; i++) {
			let t = e[r], a = e[i], o = Math.min(t.length, a.length), s = 0, c = 0, l = 0;
			for (let e = 0; e < o; e++) Number.isFinite(t[e]) && Number.isFinite(a[e]) && (c += t[e], l += a[e], s++);
			let u = 0;
			if (s > 1) {
				let e = c / s, n = l / s, r = 0, i = 0, d = 0;
				for (let s = 0; s < o; s++) if (Number.isFinite(t[s]) && Number.isFinite(a[s])) {
					let o = t[s] - e, c = a[s] - n;
					r += o * c, i += o * o, d += c * c;
				}
				u = i > 0 && d > 0 ? Math.max(-1, Math.min(1, r / Math.sqrt(i * d))) : 0;
			}
			n[r][i] = n[i][r] = u;
		}
	}
	return n;
}
//#endregion
//#region src/heatmap/heatmap.ts
var m = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", h = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	axis: "#363a45",
	cell: "rgba(42, 46, 57, 0.55)",
	emphasis: "rgba(19, 23, 34, 0.6)",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: m
}, g = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	axis: "#d1d4dc",
	cell: "#f0f3fa",
	emphasis: "rgba(255, 255, 255, 0.65)",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: m
}, _ = [
	"#313695",
	"#4575b4",
	"#74add1",
	"#abd9e9",
	"#e0f3f8",
	"#ffffbf",
	"#fee090",
	"#fdae61",
	"#f46d43",
	"#d73027",
	"#a50026"
], v = 256, y = -2, b = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), x = (e, t, n) => Math.min(n, Math.max(t, e)), S = (e) => 1 - (1 - e) ** 3, C = (e) => r(e) > .42 ? "#131722" : "#ffffff", w = class {
	constructor(e, t = {}) {
		this.dirty = !0, this.vmin = 0, this.vmax = 1, this.range = [0, 1], this.pieces = null, this.off = /* @__PURE__ */ new Set(), this.lut = [], this.ink = [], this.bucket = /* @__PURE__ */ new Int16Array(), this.order = /* @__PURE__ */ new Uint32Array(), this.start = /* @__PURE__ */ new Uint32Array(1), this.plot = {
			x: 0,
			y: 0,
			w: 1,
			h: 1
		}, this.view = {
			x0: 0,
			x1: 1,
			y0: 0,
			y1: 1
		}, this.xPlan = {
			rotate: 0,
			step: 1
		}, this.yStep = 1, this.xMaxW = 0, this.yMaxW = 0, this.xLabelMax = 0, this.hover = -1, this.drag = null, this.justDragged = !1, this.width = 0, this.height = 0, this.dpr = 1, this.animStart = 0, this.raf = 0, this.handlers = /* @__PURE__ */ new Map(), this.destroyed = !1, this.opts = { ...t }, this.root = e, e.classList.add("hm-root"), this.titleEl = document.createElement("div"), this.titleEl.className = "hm-title", this.bodyEl = document.createElement("div"), this.bodyEl.className = "hm-body", this.plotEl = document.createElement("div"), this.plotEl.className = "hm-plot", this.canvas = document.createElement("canvas"), this.canvas.className = "hm-canvas", this.canvas.setAttribute("role", "img"), this.ctx = this.canvas.getContext("2d"), this.layer = document.createElement("canvas"), this.lctx = this.layer.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "hm-tooltip", this.vmEl = document.createElement("div"), this.vmEl.className = "hm-vm", this.plotEl.append(this.canvas, this.tooltipEl), this.bodyEl.append(this.plotEl, this.vmEl), e.append(this.titleEl, this.bodyEl), this.applyLook(), this.bind(), this.bindVisual(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(this.plotEl), this.measure(), this.rebuild(!0, !0);
	}
	setData(e, t = !1) {
		this.opts.data = e, this.opts.matrix = void 0, this.rebuild(t, !0);
	}
	setMatrix(e, t = !1) {
		this.opts.matrix = e, this.opts.data = void 0, this.rebuild(t, !0);
	}
	setOptions(e, t = !1) {
		let n = e.visualMap !== void 0 || e.data !== void 0 || e.matrix !== void 0;
		n && this.off.clear(), this.opts = {
			...this.opts,
			...e
		}, this.applyLook(), this.rebuild(t, n);
	}
	cellAt(e, t) {
		let n = this.grid;
		return e >= 0 && e < n.nx && t >= 0 && t < n.ny ? this.info(Math.floor(t) * n.nx + Math.floor(e)) : null;
	}
	colorOf(e) {
		if (this.pieces) {
			let t = l(this.pieces, e, this.vmax);
			return t < 0 ? this.emptyColor() : this.pieces[t].color;
		}
		return n(this.colors(), (e - this.vmin) / (this.vmax - this.vmin || 1));
	}
	resetZoom() {
		this.view = {
			x0: 0,
			x1: this.grid.nx,
			y0: 0,
			y1: this.grid.ny
		}, this.afterZoom();
	}
	on(e, t) {
		this.handlers.has(e) || this.handlers.set(e, /* @__PURE__ */ new Set());
		let n = t;
		return this.handlers.get(e).add(n), () => this.handlers.get(e)?.delete(n);
	}
	resize() {
		this.destroyed || (this.measure(), this.layout(), this.dirty = !0, this.draw());
	}
	screenshot() {
		let e = this.hover;
		this.hover = -1, this.draw();
		let t = this.canvas.toDataURL("image/png");
		return this.hover = e, this.draw(), t;
	}
	destroy() {
		this.destroyed = !0, cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("hm-root"), this.titleEl.remove(), this.bodyEl.remove();
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t));
	}
	applyLook() {
		let e = this.opts, t = {
			...e.theme === "light" ? g : h,
			...typeof e.theme == "object" ? e.theme : {}
		};
		e.background && (t.background = e.background), this.theme = t;
		let n = {
			"--hm-bg": t.background,
			"--hm-text": t.text,
			"--hm-muted": t.muted,
			"--hm-tt-bg": t.tooltipBg,
			"--hm-tt-text": t.tooltipText,
			"--hm-tt-border": t.tooltipBorder,
			"--hm-font": t.font
		};
		for (let [e, t] of Object.entries(n)) this.root.style.setProperty(e, t);
		let r = typeof e.title == "string" ? { text: e.title } : e.title;
		this.titleEl.style.display = r ? "" : "none", r && (this.titleEl.style.textAlign = r.align ?? "center", this.titleEl.innerHTML = `<b>${b(r.text)}</b>${r.subtext ? `<small>${b(r.subtext)}</small>` : ""}`);
	}
	vm() {
		return this.opts.visualMap || {};
	}
	colors() {
		let e = this.vm().colors;
		return e && e.length ? e : _;
	}
	emptyColor() {
		return this.opts.cell?.emptyColor ?? this.theme.cell;
	}
	fmt(e) {
		return (this.opts.valueFormatter ?? ((e) => t(e)))(e);
	}
	rebuild(e, t) {
		let n = this.opts, r = this.grid;
		this.grid = o(n.data, n.matrix, n.xAxis, n.yAxis);
		let i = this.grid;
		(!r || r.nx !== i.nx || r.ny !== i.ny) && (this.view = {
			x0: 0,
			x1: i.nx,
			y0: 0,
			y1: i.ny
		});
		let a = this.vm();
		this.vmin = a.min ?? i.min, this.vmax = a.max ?? i.max, (t || !r) && (this.range = a.range ? [...a.range] : [this.vmin, this.vmax]), this.hover = -1, this.recolor(), this.renderVisual(), this.measureLabels(), this.layout();
		let s = n.animation ?? !0;
		this.animStart = e && s !== !1 ? performance.now() : 0, this.dirty = !0, this.loop();
	}
	recolor() {
		let e = this.vm(), r = this.grid, i = e.format ?? ((e) => t(e));
		this.pieces = e.pieces ?? (e.splitNumber ? u(this.vmin, this.vmax, e.splitNumber, this.colors(), i) : null);
		let a = r.values.length;
		this.bucket.length !== a && (this.bucket = new Int16Array(a));
		let o = this.bucket, s;
		if (this.pieces) {
			let e = this.pieces;
			this.lut = e.map((e) => e.color);
			for (let t = 0; t < a; t++) {
				let n = r.values[t];
				o[t] = n === n ? l(e, n, this.vmax) : -1;
			}
			s = e.length;
		} else {
			let e = this.colors();
			this.lut = Array.from({ length: v }, (t, r) => n(e, r / 255));
			let t = this.vmin, i = 255 / (this.vmax - this.vmin || 1);
			for (let e = 0; e < a; e++) {
				let n = r.values[e];
				o[e] = n === n ? x(Math.round((n - t) * i), 0, 255) : -1;
			}
			s = v;
		}
		for (let [e, t] of r.datums) t.color && (o[e] = y);
		this.ink = this.lut.map(C), {order: this.order, start: this.start} = d(o, s);
	}
	hidden(e) {
		let t = this.bucket[e];
		if (t === y) return !1;
		if (this.pieces) return t < 0 || this.off.has(t);
		let n = this.grid.values[e];
		return n < this.range[0] || n > this.range[1];
	}
	fillOf(e) {
		let t = this.bucket[e];
		return t === y ? this.grid.datums.get(e).color : t < 0 || this.hidden(e) ? this.emptyColor() : this.lut[t];
	}
	renderVisual() {
		let e = this.vm(), n = this.vmEl, r = this.opts.visualMap !== !1 && e.show !== !1 && (!!this.pieces || this.vmax > this.vmin);
		n.style.display = r ? "" : "none";
		let i = e.position ?? "bottom", a = i === "right";
		if (this.bodyEl.className = `hm-body hm-vm-${i}`, !r) {
			n.innerHTML = "";
			return;
		}
		let o = e.format ?? ((e) => t(e)), s = e.interactive !== !1, c = e.title ? `<span class="hm-vm__title">${b(e.title)}</span>` : "";
		if (this.pieces) {
			n.className = `hm-vm hm-vm--pieces${s ? " is-interactive" : ""}`, n.innerHTML = c + this.pieces.map((e, t) => {
				let n = e.label ?? (e.value === void 0 ? e.min === void 0 ? `< ${o(e.max)}` : e.max === void 0 ? `≥ ${o(e.min)}` : `${o(e.min)} – ${o(e.max)}` : o(e.value));
				return `<button type="button" class="hm-vm__piece${this.off.has(t) ? " is-off" : ""}" data-i="${t}"><i style="background:${e.color}"></i>${b(n)}</button>`;
			}).join("");
			return;
		}
		let l = this.vmax - this.vmin || 1, u = x((this.range[0] - this.vmin) / l, 0, 1), d = x((this.range[1] - this.vmin) / l, 0, 1), f = (e) => a ? `bottom:${e * 100}%` : `left:${e * 100}%`, p = s ? `<div class="hm-vm__handle" data-h="0" style="${f(u)}">${u > .001 ? `<span>${b(o(this.range[0]))}</span>` : ""}</div><div class="hm-vm__handle" data-h="1" style="${f(d)}">${d < .999 ? `<span>${b(o(this.range[1]))}</span>` : ""}</div>` : "";
		n.className = `hm-vm${s ? " is-interactive" : ""}`, n.innerHTML = `${c}<span class="hm-vm__end">${b(o(a ? this.vmax : this.vmin))}</span>
      <div class="hm-vm__track">
        <div class="hm-vm__bar" style="background:linear-gradient(${a ? "to top" : "to right"},${this.colors().join(",")})"></div>
        <div class="hm-vm__mask" style="${a ? `bottom:0;height:${u * 100}%` : `left:0;width:${u * 100}%`}"></div>
        <div class="hm-vm__mask" style="${a ? `top:0;height:${(1 - d) * 100}%` : `right:0;width:${(1 - d) * 100}%`}"></div>
        ${p}
      </div><span class="hm-vm__end">${b(o(a ? this.vmin : this.vmax))}</span>`;
	}
	bindVisual() {
		let e = this.vmEl;
		e.addEventListener("click", (e) => {
			let t = e.target.closest(".hm-vm__piece");
			if (!t || this.vm().interactive === !1) return;
			let n = Number(t.dataset.i);
			this.off.has(n) ? this.off.delete(n) : this.off.add(n), this.renderVisual(), this.dirty = !0, this.draw();
		}), e.addEventListener("pointerdown", (t) => {
			let n = this.vm();
			if (this.pieces || n.interactive === !1) return;
			let r = e.querySelector(".hm-vm__track");
			if (!r || !t.target.closest(".hm-vm__track")) return;
			let i = n.position === "right", a = (t) => {
				let n = (e.querySelector(".hm-vm__track") ?? r).getBoundingClientRect(), a = i ? 1 - (t.clientY - n.top) / n.height : (t.clientX - n.left) / n.width;
				return this.vmin + x(a, 0, 1) * (this.vmax - this.vmin);
			}, o = t.target.closest(".hm-vm__handle"), s = a(t), c = o ? Number(o.dataset.h) : Math.abs(s - this.range[0]) < Math.abs(s - this.range[1]) ? 0 : 1;
			t.preventDefault(), e.setPointerCapture(t.pointerId);
			let l = (e) => {
				let t = [...this.range];
				t[c] = a(e), t[0] > t[1] && (t.reverse(), c = 1 - c), this.range = t, this.renderVisual(), this.dirty = !0, this.draw();
			};
			l(t);
			let u = () => {
				e.removeEventListener("pointermove", l), e.removeEventListener("pointerup", u), e.removeEventListener("pointercancel", u);
			};
			e.addEventListener("pointermove", l), e.addEventListener("pointerup", u), e.addEventListener("pointercancel", u);
		});
	}
	measure() {
		let e = this.plotEl.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height));
		for (let e of [this.canvas, this.layer]) e.width = Math.round(this.width * this.dpr), e.height = Math.round(this.height * this.dpr);
		this.canvas.style.width = `${this.width}px`, this.canvas.style.height = `${this.height}px`;
	}
	font(e, t = 400) {
		return `${t} ${e}px ${this.theme.font}`;
	}
	axisText(e, t) {
		let n = (e === "x" ? this.opts.xAxis : this.opts.yAxis) ?? {}, r = (e === "x" ? this.grid.xNames : this.grid.yNames)[t] ?? t;
		return n.format ? n.format(r, t) : String(r);
	}
	measureLabels() {
		let e = this.lctx, t = this.opts.xAxis ?? {}, n = this.opts.yAxis ?? {}, r = 0;
		e.font = this.font(t.fontSize ?? 11);
		for (let t = 0; t < this.grid.nx; t++) r = Math.max(r, e.measureText(this.axisText("x", t)).width);
		this.xMaxW = r, r = 0, e.font = this.font(n.fontSize ?? 11);
		for (let t = 0; t < this.grid.ny; t++) r = Math.max(r, e.measureText(this.axisText("y", t)).width);
		this.yMaxW = r;
	}
	layout() {
		let e = this.opts, t = this.grid, n = e.padding ?? 10, r = e.xAxis ?? {}, i = e.yAxis ?? {}, a = r.show !== !1 && t.nx > 0, o = i.show !== !1 && t.ny > 0, s = r.fontSize ?? 11, l = i.fontSize ?? 11, u = Math.max(1, t.nx), d = Math.max(1, t.ny), f = o ? Math.min(this.yMaxW, this.width * .3) + 8 : 0, p = n + (i.name ? 18 : 0) + f, m = n + (o ? Math.ceil(l / 2) : 0), h = n + (a ? 4 : 0), g = r.name ? 18 : 0, _ = p, v = {
			rotate: 0,
			step: 1
		}, y = 0, b = 1, x = 1, S = 1, C = 1;
		for (let t = 0; t < 3 && (b = Math.max(10, this.width - _ - h), x = Math.max(10, this.height - m - n - y - g), S = b / u, C = x / d, e.square && (S = C = Math.min(S, C)), a); t++) {
			v = c(S, this.xMaxW, s, r.rotate ?? "auto");
			let e = v.rotate * Math.PI / 180;
			this.xLabelMax = e ? Math.min(this.xMaxW, this.height * .3 / Math.sin(Math.abs(e))) : Math.max(S * v.step - 4, this.xMaxW), y = (e ? this.xLabelMax * Math.sin(Math.abs(e)) + s * Math.cos(e) : s) + 8, _ = e ? Math.max(p, n + this.xLabelMax * Math.cos(e) - S / 2) : p;
		}
		b = S * u, x = C * d;
		let w = Math.max(10, this.width - _ - h), T = Math.max(10, this.height - m - n - y - g);
		this.plot = {
			x: _ + (e.square ? (w - b) / 2 : 0),
			y: m + (e.square ? (T - x) / 2 : 0),
			w: b,
			h: x
		}, this.xPlan = v, this.steps();
	}
	steps() {
		let e = this.opts.xAxis ?? {}, t = this.opts.yAxis ?? {}, { cw: n, ch: r } = this.cellSize();
		this.xPlan = {
			rotate: this.xPlan.rotate,
			step: c(n, this.xMaxW, e.fontSize ?? 11, this.xPlan.rotate).step
		}, this.yStep = s((t.fontSize ?? 11) + 3, r);
	}
	cellSize() {
		return {
			cw: this.plot.w / (this.view.x1 - this.view.x0 || 1),
			ch: this.plot.h / (this.view.y1 - this.view.y0 || 1)
		};
	}
	colX(e, t) {
		return this.opts.xAxis?.inverse ? this.plot.x + (this.view.x1 - e - 1) * t : this.plot.x + (e - this.view.x0) * t;
	}
	rowY(e, t) {
		return this.opts.yAxis?.inverse ? this.plot.y + (e - this.view.y0) * t : this.plot.y + (this.view.y1 - e - 1) * t;
	}
	indexAt(e, t) {
		let n = this.plot, r = this.grid;
		if (e < n.x || e >= n.x + n.w || t < n.y || t >= n.y + n.h) return -1;
		let { cw: i, ch: a } = this.cellSize(), o = (e - n.x) / i, s = (t - n.y) / a, c = this.opts.xAxis?.inverse ? Math.ceil(this.view.x1 - o) - 1 : Math.floor(this.view.x0 + o), l = this.opts.yAxis?.inverse ? Math.floor(this.view.y0 + s) : Math.ceil(this.view.y1 - s) - 1;
		return c < 0 || c >= r.nx || l < 0 || l >= r.ny ? -1 : l * r.nx + c;
	}
	info(e) {
		let t = this.grid, n = e % t.nx, r = Math.floor(e / t.nx), i = t.values[e], { cw: a, ch: o } = this.cellSize();
		return {
			x: n,
			y: r,
			xName: this.axisText("x", n),
			yName: this.axisText("y", r),
			value: i === i ? i : null,
			color: this.fillOf(e),
			datum: t.datums.get(e) ?? null,
			box: {
				x: this.colX(n, a),
				y: this.rowY(r, o),
				w: a,
				h: o
			}
		};
	}
	duration() {
		let e = this.opts.animation ?? !0;
		return e === !1 ? 0 : typeof e == "object" ? e.duration ?? 700 : 700;
	}
	progress(e) {
		return this.animStart ? x((e - this.animStart) / (this.duration() || 1), 0, 1) : 1;
	}
	loop() {
		if (cancelAnimationFrame(this.raf), this.destroyed) return;
		let e = performance.now(), t = this.progress(e);
		this.animStart && (this.dirty = !0), this.draw(e), t < 1 ? this.raf = requestAnimationFrame(() => this.loop()) : this.animStart = 0;
	}
	draw(e = performance.now()) {
		this.dirty &&= (this.render(this.lctx, e), !1);
		let t = this.ctx;
		t.setTransform(1, 0, 0, 1, 0, 0), t.clearRect(0, 0, this.canvas.width, this.canvas.height), t.drawImage(this.layer, 0, 0), t.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), this.drawHover(t);
	}
	render(e, t) {
		let n = this.theme;
		e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.clearRect(0, 0, this.width, this.height), n.background !== "transparent" && (e.fillStyle = n.background, e.fillRect(0, 0, this.width, this.height)), this.grid.nx && this.grid.ny && (e.save(), e.beginPath(), e.rect(this.plot.x, this.plot.y, this.plot.w, this.plot.h), e.clip(), this.drawCells(e, this.progress(t)), e.restore()), this.drawAxes(e);
	}
	drawCells(e, t) {
		let n = this.opts, r = this.grid, i = r.nx, { cw: a, ch: o } = this.cellSize(), s = n.cell ?? {}, c = Math.min(s.gap ?? 0, a / 2, o / 2), l = Math.min(s.radius ?? 0, (a - c) / 2, (o - c) / 2), u = s.borderWidth ?? 0, d = Math.max(0, Math.floor(this.view.x0)), f = Math.min(i - 1, Math.ceil(this.view.x1) - 1), p = Math.max(0, Math.floor(this.view.y0)), m = Math.min(r.ny - 1, Math.ceil(this.view.y1) - 1);
		if (f < d || m < p) return;
		let h = this.dpr, g = (e) => Math.round(e * h) / h, _ = new Float64Array(f - d + 1), v = new Float64Array(f - d + 1), b = new Float64Array(m - p + 1), C = new Float64Array(m - p + 1);
		for (let e = d; e <= f; e++) {
			let t = this.colX(e, a);
			_[e - d] = g(t) + c / 2, v[e - d] = Math.max(0, g(t + a) - g(t) - c);
		}
		for (let e = p; e <= m; e++) {
			let t = this.rowY(e, o);
			b[e - p] = g(t) + c / 2, C[e - p] = Math.max(0, g(t + o) - g(t) - c);
		}
		let w = i + r.ny - 2 || 1, T = t >= 1 ? null : (e, n) => S(x(t * 1.6 - (e + n) / w * .6, 0, 1)), E = (t, n) => {
			let r = t % i, a = (t - r) / i;
			if (r < d || r > f || a < p || a > m) return;
			let o = _[r - d], s = b[a - p], c = v[r - d], u = C[a - p];
			if (T) {
				let e = T(r, a);
				o += c * (1 - e) / 2, s += u * (1 - e) / 2, c *= e, u *= e;
			}
			l > .5 ? e.roundRect(o, s, c, u, Math.min(l, c / 2, u / 2)) : n ? e.rect(o, s, c, u) : e.fillRect(o, s, c, u);
		}, D = l > .5, O = this.emptyColor();
		if (O !== "transparent") {
			e.fillStyle = O, e.beginPath();
			for (let e = p; e <= m; e++) for (let t = d; t <= f; t++) {
				let n = e * i + t;
				this.bucket[n] !== y && (this.bucket[n] < 0 || this.hidden(n)) && E(n, !0);
			}
			e.fill();
		}
		let k = this.start.length - 1;
		for (let t = 0; t < k; t++) {
			let n = this.start[t], r = this.start[t + 1];
			if (!(n === r || this.pieces && this.off.has(t))) {
				e.fillStyle = this.lut[t], D && e.beginPath();
				for (let e = n; e < r; e++) {
					let t = this.order[e];
					(this.pieces || !this.hidden(t)) && E(t, D);
				}
				D && e.fill();
			}
		}
		for (let [t, n] of r.datums) n.color && (e.fillStyle = n.color, e.beginPath(), E(t, !0), e.fill());
		if (u > 0) {
			e.strokeStyle = s.borderColor ?? this.theme.background, e.lineWidth = u, e.beginPath();
			for (let e = p; e <= m; e++) for (let t = d; t <= f; t++) E(e * i + t, !0);
			e.stroke();
		}
		t >= 1 && this.drawLabels(e, d, f, p, m, _, v, b, C);
	}
	drawLabels(e, t, n, r, i, a, o, s, c) {
		let l = this.opts.label;
		if (!l) return;
		let u = l === !0 ? {} : l;
		if (u.show === !1) return;
		let { cw: d, ch: f } = this.cellSize(), p = u.fontSize ?? x(Math.min(d * .42, f * .45), 8, 13);
		if (f < p + 2 || d < p * 1.6) return;
		let m = this.grid;
		e.font = this.font(p, 600), e.textAlign = "center", e.textBaseline = "middle";
		for (let l = r; l <= i; l++) for (let i = t; i <= n; i++) {
			let n = l * m.nx + i, d = m.values[n];
			if (d !== d || this.hidden(n)) continue;
			let f = u.format ? u.format(d, this.info(n)) : this.fmt(d);
			if (!f) continue;
			let p = o[i - t];
			if (e.measureText(f).width > p - 3) continue;
			let h = this.bucket[n];
			e.fillStyle = u.color ?? (h === y ? C(m.datums.get(n).color) : this.ink[h]), e.fillText(f, a[i - t] + p / 2, s[l - r] + c[l - r] / 2 + .5);
		}
	}
	drawAxes(e) {
		let t = this.opts, n = this.theme, r = this.grid, i = this.plot, a = t.xAxis ?? {}, o = t.yAxis ?? {}, { cw: s, ch: c } = this.cellSize(), l = a.fontSize ?? 11, u = o.fontSize ?? 11, d = t.padding ?? 10, f = 0;
		if (a.show !== !1 && r.nx) {
			e.fillStyle = a.color ?? n.muted, e.font = this.font(l);
			let t = this.xPlan.rotate * Math.PI / 180, o = this.xPlan.step, c = i.y + i.h + 6;
			for (let n = Math.max(0, Math.floor(this.view.x0)); n < Math.min(r.nx, Math.ceil(this.view.x1)); n++) {
				if (n % o) continue;
				let r = this.colX(n, s) + s / 2;
				if (r < i.x - .5 || r > i.x + i.w + .5) continue;
				let a = this.axisText("x", n);
				t ? (e.save(), e.translate(r, c), e.rotate(-t), e.textAlign = "right", e.textBaseline = "middle", e.fillText(a, 0, 0, this.xLabelMax), e.restore()) : (e.textAlign = "center", e.textBaseline = "top", e.fillText(a, r, c, this.xLabelMax));
			}
			f = (t ? this.xLabelMax * Math.sin(Math.abs(t)) + l * Math.cos(t) : l) + 8;
		}
		if (o.show !== !1 && r.ny) {
			e.fillStyle = o.color ?? n.muted, e.font = this.font(u), e.textAlign = "right", e.textBaseline = "middle";
			let t = Math.min(this.yMaxW, this.width * .3);
			for (let n = Math.max(0, Math.floor(this.view.y0)); n < Math.min(r.ny, Math.ceil(this.view.y1)); n++) {
				if (n % this.yStep) continue;
				let r = this.rowY(n, c) + c / 2;
				r < i.y - .5 || r > i.y + i.h + .5 || e.fillText(this.axisText("y", n), i.x - 6, r, t);
			}
		}
		e.strokeStyle = n.axis, e.lineWidth = 1, e.beginPath(), e.moveTo(i.x, Math.round(i.y + i.h) + .5), e.lineTo(i.x + i.w, Math.round(i.y + i.h) + .5), e.moveTo(Math.round(i.x) - .5, i.y), e.lineTo(Math.round(i.x) - .5, i.y + i.h), e.stroke(), e.fillStyle = n.text, e.font = this.font(12, 600), a.name && (e.textAlign = "center", e.textBaseline = "top", e.fillText(a.name, i.x + i.w / 2, i.y + i.h + f + 2)), o.name && (e.save(), e.translate(d + 7, i.y + i.h / 2), e.rotate(-Math.PI / 2), e.textAlign = "center", e.textBaseline = "middle", e.fillText(o.name, 0, 0), e.restore());
	}
	drawHover(e) {
		let t = this.hover;
		if (t < 0 || this.drag) return;
		let n = this.grid, r = t % n.nx, i = Math.floor(t / n.nx), { cw: a, ch: o } = this.cellSize(), s = this.plot, c = this.colX(r, a), l = this.rowY(i, o), u = this.opts.emphasis ?? "cell";
		if (u === !1) return;
		if (e.save(), e.beginPath(), e.rect(s.x, s.y, s.w, s.h), e.clip(), u !== "cell") {
			let t = u === "row" || u === "cross", n = u === "column" || u === "cross", r = [
				s.x,
				c,
				c + a,
				s.x + s.w
			], i = [
				s.y,
				l,
				l + o,
				s.y + s.h
			];
			e.fillStyle = this.theme.emphasis;
			for (let a = 0; a < 3; a++) for (let o = 0; o < 3; o++) a === 1 && o === 1 || t && o === 1 || n && a === 1 || e.fillRect(r[a], i[o], r[a + 1] - r[a], i[o + 1] - i[o]);
		}
		let d = Math.min(this.opts.cell?.gap ?? 0, a / 2, o / 2), f = a - d > 6 && o - d > 6 ? 2 : 1, p = this.fillOf(t);
		e.strokeStyle = p === this.emptyColor() ? this.theme.text : C(p), e.lineWidth = f;
		let m = Math.min(this.opts.cell?.radius ?? 0, (a - d) / 2, (o - d) / 2);
		e.beginPath();
		let h = c + d / 2 + f / 2, g = l + d / 2 + f / 2, _ = Math.max(1, a - d - f), v = Math.max(1, o - d - f);
		m > .5 ? e.roundRect(h, g, _, v, m) : e.rect(h, g, _, v), e.stroke(), e.restore();
	}
	zoomable(e) {
		let t = this.opts.zoom;
		return t === !0 || t === e;
	}
	clampView() {
		let e = this.view, t = (e, t, n) => {
			let r = x(t - e, Math.min(1, n), n), i = x(e, 0, n - r);
			return [i, i + r];
		};
		[e.x0, e.x1] = t(e.x0, e.x1, this.grid.nx), [e.y0, e.y1] = t(e.y0, e.y1, this.grid.ny);
	}
	afterZoom() {
		this.clampView(), this.steps(), this.dirty = !0, this.draw();
		let e = this.view;
		this.emit("zoom", {
			x: [e.x0, e.x1],
			y: [e.y0, e.y1]
		});
	}
	bind() {
		let e = this.canvas, t = (t) => {
			let n = e.getBoundingClientRect();
			return {
				x: t.clientX - n.left,
				y: t.clientY - n.top
			};
		}, n = (e, t) => {
			e !== this.hover && (this.hover = e, this.emit("hover", e < 0 ? null : this.info(e)), this.draw()), t && e >= 0 ? this.showTooltip(e, t) : this.tooltipEl.classList.remove("is-visible");
		};
		e.addEventListener("pointermove", (r) => {
			let { x: i, y: a } = t(r), o = this.drag;
			if (o) {
				let t = i - o.x, n = a - o.y;
				if (Math.abs(t) + Math.abs(n) > 3 && (o.moved = !0), !o.moved) return;
				let { cw: r, ch: s } = this.cellSize(), c = { ...o.view };
				if (this.zoomable("x")) {
					let e = t / r * (this.opts.xAxis?.inverse ? -1 : 1);
					c.x0 = o.view.x0 - e, c.x1 = o.view.x1 - e;
				}
				if (this.zoomable("y")) {
					let e = n / s * (this.opts.yAxis?.inverse ? -1 : 1);
					c.y0 = o.view.y0 + e, c.y1 = o.view.y1 + e;
				}
				this.view = c, e.style.cursor = "grabbing", this.tooltipEl.classList.remove("is-visible"), this.afterZoom();
				return;
			}
			if (this.progress(performance.now()) < 1) return;
			let s = this.indexAt(i, a), c = s >= 0 && this.grid.values[s] === this.grid.values[s] && !this.hidden(s) ? s : -1;
			e.style.cursor = c >= 0 ? "pointer" : this.opts.zoom && s >= 0 ? "grab" : "", n(c, r);
		}), e.addEventListener("pointerleave", () => {
			this.drag || n(-1, null);
		}), e.addEventListener("pointerdown", (n) => {
			if (!this.opts.zoom) return;
			let { x: r, y: i } = t(n);
			this.indexAt(r, i) < 0 || (this.drag = {
				x: r,
				y: i,
				view: { ...this.view },
				moved: !1
			}, e.setPointerCapture(n.pointerId));
		});
		let r = () => {
			this.drag && (this.justDragged = this.drag.moved, this.drag = null, e.style.cursor = "", this.draw());
		};
		e.addEventListener("pointerup", r), e.addEventListener("pointercancel", r), e.addEventListener("click", (e) => {
			if (this.justDragged) {
				this.justDragged = !1;
				return;
			}
			let { x: n, y: r } = t(e), i = this.indexAt(n, r);
			i >= 0 && this.grid.values[i] === this.grid.values[i] && !this.hidden(i) && this.emit("click", this.info(i));
		}), e.addEventListener("wheel", (e) => {
			if (!this.opts.zoom) return;
			let { x: n, y: r } = t(e), i = this.plot;
			if (n < i.x || n > i.x + i.w || r < i.y || r > i.y + i.h) return;
			e.preventDefault();
			let a = Math.exp(e.deltaY * .0015), o = this.view;
			if (this.zoomable("x")) {
				let e = (n - i.x) / i.w;
				this.opts.xAxis?.inverse && (e = 1 - e);
				let t = o.x0 + e * (o.x1 - o.x0), r = x((o.x1 - o.x0) * a, Math.min(1, this.grid.nx), this.grid.nx);
				o.x0 = t - e * r, o.x1 = o.x0 + r;
			}
			if (this.zoomable("y")) {
				let e = (i.y + i.h - r) / i.h;
				this.opts.yAxis?.inverse && (e = 1 - e);
				let t = o.y0 + e * (o.y1 - o.y0), n = x((o.y1 - o.y0) * a, Math.min(1, this.grid.ny), this.grid.ny);
				o.y0 = t - e * n, o.y1 = o.y0 + n;
			}
			this.hover = -1, this.tooltipEl.classList.remove("is-visible"), this.afterZoom();
		}, { passive: !1 }), e.addEventListener("dblclick", () => {
			let e = this.view;
			this.opts.zoom && (e.x0 > 0 || e.x1 < this.grid.nx || e.y0 > 0 || e.y1 < this.grid.ny) && this.resetZoom();
		});
	}
	showTooltip(e, t) {
		let n = this.opts.tooltip ?? !0, r = this.tooltipEl;
		if (n === !1 || typeof n == "object" && n.show === !1) {
			r.classList.remove("is-visible");
			return;
		}
		let i = this.info(e);
		if (typeof n == "object" && n.formatter) r.innerHTML = n.formatter(i);
		else {
			let e = this.opts.xAxis ?? {}, t = this.opts.yAxis ?? {}, n = this.opts.valueFormatter ?? ((e) => e.toLocaleString("pt-PT", { maximumFractionDigits: 4 }));
			r.innerHTML = `<div class="hm-tooltip__row"><span>${b(e.name ?? "X")}</span><b>${b(i.xName)}</b></div><div class="hm-tooltip__row"><span>${b(t.name ?? "Y")}</span><b>${b(i.yName)}</b></div><div class="hm-tooltip__row"><span><i class="hm-tooltip__dot" style="background:${i.color}"></i>Valor</span><b>${b(i.value === null ? "–" : n(i.value))}</b></div>` + (i.datum?.label ? `<div class="hm-tooltip__row"><span>${b(i.datum.label)}</span></div>` : "");
		}
		r.classList.add("is-visible");
		let a = this.plotEl.getBoundingClientRect(), o = t.clientX - a.left, s = t.clientY - a.top, c = r.offsetWidth, l = r.offsetHeight, u = o + 14 + c > this.width ? o - 14 - c : o + 14, d = x(s + 14 + l > this.height ? s - 14 - l : s + 14, 0, Math.max(0, this.height - l));
		r.style.transform = `translate(${Math.max(0, u)}px, ${d}px)`;
	}
};
function T(e, t = {}) {
	return new w(e, t);
}
//#endregion
export { g as a, h as i, w as n, p as o, T as r, f as s, _ as t };

//# sourceMappingURL=heatmap.js.map