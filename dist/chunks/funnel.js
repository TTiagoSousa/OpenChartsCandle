import { a as e, r as t } from "./color.js";
//#region src/funnel/geometry.ts
function n(e, t, n) {
	if (e === void 0) return n;
	if (typeof e == "number") return e;
	let r = e.trim();
	return r.endsWith("%") ? t * parseFloat(r) / 100 : parseFloat(r) || 0;
}
function r(e, t, n, r, i) {
	if (n <= t) return i;
	let a = Math.min(1, Math.max(0, (e - t) / (n - t)));
	return r + (i - r) * a;
}
function i(e, t) {
	let n = e.length;
	if (!n) return [];
	let i = Math.min(t.gap, n > 1 ? t.length * .5 / (n - 1) : 0), a = (t.length - i * (n - 1)) / n, o = e.map((e) => r(e, t.min, t.max, t.minPx, t.maxPx));
	return e.map((e, r) => ({
		a0: r * (a + i),
		a1: r * (a + i) + a,
		w0: t.ascending ? r ? o[r - 1] : t.minPx : o[r],
		w1: t.ascending ? o[r] : r < n - 1 ? o[r + 1] : t.minPx
	}));
}
function a(e, t = "descending") {
	let n = e.map((e, t) => t);
	return t === "descending" ? n.sort((t, n) => e[n] - e[t] || t - n) : t === "ascending" && n.sort((t, n) => e[t] - e[n] || t - n), n;
}
function o(e, t, n) {
	let r = !1;
	for (let i = 0, a = n.length - 1; i < n.length; a = i++) {
		let o = n[i], s = n[a];
		o.y > t != s.y > t && e < (s.x - o.x) * (t - o.y) / (s.y - o.y) + o.x && (r = !r);
	}
	return r;
}
//#endregion
//#region src/funnel/funnel.ts
var s = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", c = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	border: "#131722",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: s
}, l = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	border: "#ffffff",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: s
}, u = [
	"#2962ff",
	"#00bcd4",
	"#089981",
	"#8bc34a",
	"#ffc107",
	"#ff9800",
	"#f23645",
	"#e91e63",
	"#9c27b0",
	"#607d8b"
], d = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), f = (e, t, n) => Math.min(n, Math.max(t, e)), p = (e) => 1 - (1 - e) ** 3, m = (t, n) => {
	let [r, i, a, o] = e(t);
	return `rgba(${r}, ${i}, ${a}, ${+(n * o).toFixed(3)})`;
}, h = (e) => e === "transparent" || e === "none", g = class {
	constructor(e, t = {}) {
		this.funnels = [], this.names = [], this.hidden = /* @__PURE__ */ new Set(), this.hover = null, this.width = 0, this.height = 0, this.dpr = 1, this.animStart = 0, this.raf = 0, this.handlers = /* @__PURE__ */ new Map(), this.destroyed = !1, this.opts = { ...t }, this.root = e, e.classList.add("fn-root"), this.titleEl = document.createElement("div"), this.titleEl.className = "fn-title", this.bodyEl = document.createElement("div"), this.plotEl = document.createElement("div"), this.plotEl.className = "fn-plot", this.canvas = document.createElement("canvas"), this.canvas.className = "fn-canvas", this.canvas.setAttribute("role", "img"), this.ctx = this.canvas.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "fn-tooltip", this.legendEl = document.createElement("ul"), this.plotEl.append(this.canvas, this.tooltipEl), this.bodyEl.append(this.plotEl, this.legendEl), e.append(this.titleEl, this.bodyEl), this.applyLook(), this.bind(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(this.plotEl), this.measure(), this.rebuild(!0);
	}
	setData(e, t = !0) {
		this.opts = e.length > 0 && "data" in e[0] ? {
			...this.opts,
			funnels: e
		} : {
			...this.opts,
			data: e,
			funnels: void 0
		}, this.rebuild(t);
	}
	setOptions(e, t = !0) {
		this.opts = {
			...this.opts,
			...e
		}, this.applyLook(), this.rebuild(t);
	}
	toggle(e, t) {
		let n = t ?? !this.hidden.has(e);
		n ? this.hidden.add(e) : this.hidden.delete(e), this.emit("toggle", {
			name: e,
			hidden: n
		}), this.rebuild(!0);
	}
	on(e, t) {
		this.handlers.has(e) || this.handlers.set(e, /* @__PURE__ */ new Set());
		let n = t;
		return this.handlers.get(e).add(n), () => this.handlers.get(e)?.delete(n);
	}
	resize() {
		this.measure(), this.rebuild(!1);
	}
	screenshot() {
		return this.draw(), this.canvas.toDataURL("image/png");
	}
	destroy() {
		this.destroyed = !0, cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("fn-root"), this.titleEl.remove(), this.bodyEl.remove();
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t));
	}
	specList() {
		let { funnels: e, data: t, colors: n, legend: r, tooltip: i, valueFormatter: a, hoverDim: o, title: s, background: c, theme: l, animation: u, ...d } = this.opts;
		return e?.length ? e.map((e) => ({
			...d,
			...e
		})) : t ? [{
			...d,
			data: t
		}] : [];
	}
	applyLook() {
		let e = this.opts, t = {
			...e.theme === "light" ? l : c,
			...typeof e.theme == "object" ? e.theme : {}
		};
		e.background && (t.background = e.background), t.background === "transparent" && !(typeof e.theme == "object" && e.theme.border) ? t.border = "rgba(255, 255, 255, 0.35)" : typeof e.theme == "object" && e.theme.border || (t.border = t.background), this.theme = t;
		let n = {
			"--fn-bg": t.background,
			"--fn-text": t.text,
			"--fn-muted": t.muted,
			"--fn-tt-bg": t.tooltipBg,
			"--fn-tt-text": t.tooltipText,
			"--fn-tt-border": t.tooltipBorder,
			"--fn-font": t.font
		};
		for (let [e, t] of Object.entries(n)) this.root.style.setProperty(e, t);
		let r = typeof e.title == "string" ? { text: e.title } : e.title;
		this.titleEl.style.display = r ? "" : "none", r && (this.titleEl.style.textAlign = r.align ?? "center", this.titleEl.innerHTML = `<b>${d(r.text)}</b>${r.subtext ? `<small>${d(r.subtext)}</small>` : ""}`);
	}
	colorOf(e, t) {
		let n = this.opts.colors ?? u;
		return t.color ?? n[Math.max(0, this.names.indexOf(e)) % n.length];
	}
	rebuild(e) {
		let t = this.specList();
		this.names = [];
		for (let e of t) for (let t of e.data) this.names.includes(t.name) || this.names.push(t.name);
		let n = /* @__PURE__ */ new Map();
		for (let e of this.funnels) for (let t of e.stages) n.set(`${e.index}\u0001${t.name}`, t);
		this.renderLegend();
		let r = e && this.duration() > 0;
		this.funnels = t.map((e, t) => {
			let r = (e.orient ?? "vertical") === "vertical", i = {
				spec: e,
				index: t,
				stages: [],
				x: 0,
				y: 0,
				w: 0,
				h: 0,
				vertical: r,
				labelPos: this.labelPosition(e.label?.position, r)
			}, o = e.data.filter((e) => !this.hidden.has(e.name)), s = a(o.map((e) => e.value), e.sort ?? "descending").map((e) => o[e]), c = e.max ?? Math.max(0, ...e.data.map((e) => e.value)), l = s[0]?.value ?? 0;
			return i.stages = [...s, ...e.data.filter((e) => this.hidden.has(e.name))].map((r, i) => {
				let a = i < s.length, o = a && i > 0 ? s[i - 1].value : r.value, u = this.colorOf(r.name, r), d = {
					item: r,
					name: r.name,
					value: r.value,
					color: u,
					funnelIndex: t,
					funnelName: e.name,
					index: a ? i : -1,
					percentOfFirst: l ? r.value / l * 100 : 0,
					percentOfPrevious: o ? r.value / o * 100 : 0,
					percent: c ? r.value / c * 100 : 0
				}, f = n.get(`${t}\u0001${r.name}`), p = {
					a0: 0,
					a1: 0,
					w0: 0,
					w1: 0,
					op: 0
				}, m = f ? { ...f.now } : { ...p };
				return {
					item: r,
					name: r.name,
					color: u,
					index: i,
					info: d,
					visible: a,
					from: m,
					to: { ...p },
					now: { ...m },
					pts: []
				};
			}), i;
		}), this.layout();
		for (let e of this.funnels) for (let t of e.stages) {
			if (t.from.op === 0 && t.from.a1 === 0 && t.from.w0 === 0 && t.visible && (t.from = {
				a0: 0,
				a1: 0,
				w0: t.to.w0 * .6,
				w1: t.to.w1 * .6,
				op: 0
			}, t.index > 0)) {
				let n = e.stages[t.index - 1];
				t.from.a0 = t.from.a1 = n.from.a1;
			}
			r || (t.from = { ...t.to }), t.now = { ...t.from };
		}
		this.hover && !this.funnels.some((e) => e.stages.includes(this.hover)) && (this.hover = null), this.animStart = r ? performance.now() : 0, this.loop();
	}
	labelPosition(e, t) {
		let n = e ?? "outside";
		return n === "outside" ? t ? "right" : "bottom" : n;
	}
	labelOf(e, t) {
		return {
			...e.spec.label,
			...t.item.label
		};
	}
	labelText(e, t, n) {
		return n.show === !1 || (n.position ?? e.labelPos) === "none" ? "" : n.format ? n.format(t.info) : t.name;
	}
	duration() {
		let e = this.opts.animation ?? !0;
		return e === !1 ? 0 : typeof e == "object" ? e.duration ?? 650 : 650;
	}
	loop() {
		if (cancelAnimationFrame(this.raf), this.destroyed) return;
		let e = performance.now(), t = this.animStart ? p(f((e - this.animStart) / (this.duration() || 1), 0, 1)) : 1;
		for (let e of this.funnels) for (let n of e.stages) {
			let e = n.from, r = n.to;
			n.now = {
				a0: e.a0 + (r.a0 - e.a0) * t,
				a1: e.a1 + (r.a1 - e.a1) * t,
				w0: e.w0 + (r.w0 - e.w0) * t,
				w1: e.w1 + (r.w1 - e.w1) * t,
				op: e.op + (r.op - e.op) * t
			};
		}
		this.draw(), t < 1 ? this.raf = requestAnimationFrame(() => this.loop()) : this.animStart = 0;
	}
	legendCfg() {
		let e = this.opts.legend, t = typeof e == "object" ? e : {};
		return {
			show: (typeof e == "boolean" ? e : t.show) ?? !0,
			position: t.position ?? "top",
			interactive: t.interactive ?? !0
		};
	}
	renderLegend() {
		let e = this.legendCfg();
		if (this.bodyEl.className = `fn-body fn-legend-${e.position}`, this.legendEl.className = "fn-legend", this.legendEl.style.display = e.show ? "" : "none", !e.show) return;
		let t = /* @__PURE__ */ new Map();
		for (let e of this.specList()) for (let n of e.data) t.has(n.name) || t.set(n.name, n);
		this.legendEl.innerHTML = this.names.map((n) => {
			let r = this.hidden.has(n);
			return `<li class="fn-legend__item${e.interactive ? " is-interactive" : ""}${r ? " is-hidden" : ""}" data-name="${d(n)}"><i class="fn-legend__marker" style="--c:${this.colorOf(n, t.get(n))}"></i><span>${d(n)}</span></li>`;
		}).join("");
	}
	measure() {
		let e = this.plotEl.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height)), this.canvas.width = Math.round(this.width * this.dpr), this.canvas.height = Math.round(this.height * this.dpr), this.canvas.style.width = `${this.width}px`, this.canvas.style.height = `${this.height}px`;
	}
	font(e, t = 400) {
		return `${t} ${e}px ${this.theme.font}`;
	}
	lineLength(e) {
		let t = e.spec.labelLine ?? !0;
		return t === !1 ? 6 : typeof t == "object" ? t.length ?? 18 : 18;
	}
	layout() {
		let e = this.width, t = this.height, r = (e) => [
			e.left,
			e.right,
			e.top,
			e.bottom
		].join("|"), a = /* @__PURE__ */ new Map();
		for (let i of this.funnels) {
			let o = i.spec, s = n(o.left, e, 10), c = n(o.top, t, 10) + (o.showName && o.name ? 20 : 0), l = e - n(o.right, e, 10), u = t - n(o.bottom, t, 10), d = 0, f = 0;
			for (let e of i.stages) {
				let t = this.labelOf(i, e), n = this.labelPosition(t.position, i.vertical) ?? i.labelPos;
				if (![
					"left",
					"right",
					"top",
					"bottom"
				].includes(n)) continue;
				let r = this.labelText(i, e, t);
				if (!r) continue;
				let a = t.fontSize ?? 12;
				this.ctx.font = this.font(a, t.fontWeight ?? 400), d = Math.max(d, ...r.split("\n").map((e) => this.ctx.measureText(e).width)), f = Math.max(f, r.split("\n").length * a * 1.25);
			}
			let p = this.lineLength(i), m = a.get(r(o)) ?? {
				l: 0,
				r: 0,
				t: 0,
				b: 0
			};
			d && (i.labelPos === "right" && (m.r = Math.max(m.r, Math.min(d + p + 6, (l - s) * .45))), i.labelPos === "left" && (m.l = Math.max(m.l, Math.min(d + p + 6, (l - s) * .45))), i.labelPos === "bottom" && (m.b = Math.max(m.b, Math.min(f + p + 4, (u - c) * .45))), i.labelPos === "top" && (m.t = Math.max(m.t, Math.min(f + p + 4, (u - c) * .45)))), a.set(r(o), m);
		}
		for (let o of this.funnels) {
			let s = o.spec, c = a.get(r(s)), l = n(s.left, e, 10) + c.l, u = n(s.top, t, 10) + (s.showName && s.name ? 20 : 0) + c.t, d = e - n(s.right, e, 10) - c.r, f = t - n(s.bottom, t, 10) - c.b;
			o.x = l, o.y = u, o.w = Math.max(1, d - l), o.h = Math.max(1, f - u);
			let p = o.vertical ? o.h : o.w, m = o.vertical ? o.w : o.h, h = o.stages.filter((e) => e.visible), g = s.max ?? Math.max(0, ...s.data.map((e) => e.value)), _ = i(h.map((e) => e.item.value), {
				length: p,
				gap: s.gap ?? 2,
				min: s.min ?? 0,
				max: g,
				minPx: n(s.minSize, m, 0),
				maxPx: n(s.maxSize, m, m),
				ascending: s.sort === "ascending"
			});
			h.forEach((e, t) => e.to = {
				..._[t],
				op: 1
			});
			for (let e of o.stages) if (!e.visible) {
				let t = (e.now.a0 + e.now.a1) / 2;
				e.to = {
					a0: t,
					a1: t,
					w0: e.now.w0,
					w1: e.now.w1,
					op: 0
				};
			}
		}
	}
	offset(e, t) {
		let n = e.vertical ? e.w : e.h, r = e.spec.funnelAlign ?? "center";
		return r === "left" || r === "top" ? 0 : r === "right" || r === "bottom" ? n - t : (n - t) / 2;
	}
	toXY(e, t, n) {
		return e.vertical ? {
			x: e.x + n,
			y: e.y + t
		} : {
			x: e.x + t,
			y: e.y + n
		};
	}
	draw() {
		let e = this.ctx, t = this.theme;
		e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.clearRect(0, 0, this.width, this.height), t.background !== "transparent" && (e.fillStyle = t.background, e.fillRect(0, 0, this.width, this.height));
		let n = this.opts.hoverDim ?? .35;
		for (let r of this.funnels) {
			for (let e of r.stages) {
				let t = e.now;
				e.pts = [
					this.toXY(r, t.a0, this.offset(r, t.w0)),
					this.toXY(r, t.a0, this.offset(r, t.w0) + t.w0),
					this.toXY(r, t.a1, this.offset(r, t.w1) + t.w1),
					this.toXY(r, t.a1, this.offset(r, t.w1))
				];
			}
			for (let e of r.stages) {
				if (e.now.op < .01 || e.now.a1 - e.now.a0 < .3) continue;
				let t = e.now.op * (this.hover && this.hover !== e && !r.spec.silent ? n : 1);
				this.drawStage(r, e, t);
			}
			r.spec.showName && r.spec.name && (e.font = this.font(13, 600), e.fillStyle = t.text, e.textAlign = "center", e.textBaseline = "bottom", e.fillText(r.spec.name, r.x + r.w / 2, r.y - 6));
		}
		for (let e of this.funnels) for (let t of e.stages) t.now.op < .05 || !t.visible || this.drawLabel(e, t, t.now.op * (this.hover && this.hover !== t && this.hover.info.funnelIndex === e.index ? .6 : 1));
	}
	styleOf(e, t) {
		return {
			...e.spec.itemStyle,
			...t.item.itemStyle
		};
	}
	drawStage(e, t, n) {
		let r = this.ctx, i = this.styleOf(e, t), a = this.hover === t;
		r.beginPath(), t.pts.forEach((e, t) => t ? r.lineTo(e.x, e.y) : r.moveTo(e.x, e.y)), r.closePath();
		let o = i.color ?? t.color;
		h(o) || (r.globalAlpha = n * (i.opacity ?? 1) * (a ? 1 : .92), r.fillStyle = o, r.fill());
		let s = i.borderWidth ?? (h(o) ? 1.5 : 1);
		s > 0 && (r.globalAlpha = n, r.strokeStyle = i.borderColor ?? (h(o) ? t.color : this.theme.border), r.lineWidth = s, r.lineJoin = "round", r.setLineDash(i.borderDash ?? []), r.stroke(), r.setLineDash([])), a && !h(o) && (r.globalAlpha = .18, r.fillStyle = "#ffffff", r.fill()), r.globalAlpha = 1;
	}
	drawLabel(e, n, r) {
		let i = this.ctx, a = this.labelOf(e, n), o = this.labelText(e, n, a);
		if (!o) return;
		let s = a.position ? this.labelPosition(a.position, e.vertical) : e.labelPos, c = a.fontSize ?? 12, l = n.now, u = (l.a0 + l.a1) / 2, d = (l.w0 + l.w1) / 2, f = (this.offset(e, l.w0) + this.offset(e, l.w1)) / 2, p = o.split("\n");
		i.font = this.font(c, a.fontWeight ?? (s.startsWith("inside") ? 600 : 400)), i.globalAlpha = r;
		let g, _, v = "center", y = this.lineLength(e), b = e.spec.labelLine ?? !0, x = (e, t, r, a) => {
			b !== !1 && (i.strokeStyle = typeof b == "object" && b.color || m(n.color, .8), i.lineWidth = 1, i.beginPath(), i.moveTo(e, t), i.lineTo(r, a), i.stroke());
		}, S = e.vertical ? e.w : e.h;
		if (s === "inside" || s === "insideLeft" || s === "insideRight") {
			let r = Math.max(...p.map((e) => i.measureText(e).width)), o = p.length * c * 1.25, m = e.vertical ? [Math.min(l.w0, l.w1) + (Math.max(l.w0, l.w1) - Math.min(l.w0, l.w1)) * .5 - 8, l.a1 - l.a0] : [l.a1 - l.a0 - 6, Math.min(l.w0, l.w1)];
			if (r > m[0] || o > m[1] + 2) {
				i.globalAlpha = 1;
				return;
			}
			let y = s === "inside" ? f + d / 2 : s === "insideLeft" ? f + 8 : f + d - 8;
			({x: g, y: _} = this.toXY(e, u, y)), v = e.vertical ? s === "insideLeft" ? "left" : s === "insideRight" ? "right" : "center" : "center";
			let b = this.styleOf(e, n).color ?? n.color;
			i.fillStyle = a.color ?? (h(b) ? this.theme.text : t(b) > .4 ? "#131722" : "#ffffff");
		} else if (e.vertical) {
			let t = s !== "left", n = this.toXY(e, u, t ? f + d : f);
			g = t ? e.x + S + y : e.x - y, _ = n.y, x(n.x, n.y, t ? g - 4 : g + 4, _), v = t ? "left" : "right", i.fillStyle = a.color ?? this.theme.text;
		} else {
			let t = s !== "top", n = this.toXY(e, u, t ? f + d : f);
			g = n.x, _ = t ? e.y + S + y : e.y - y, x(n.x, n.y, g, t ? _ - 2 : _ + 2), i.fillStyle = a.color ?? this.theme.text;
		}
		i.textAlign = v, i.textBaseline = "middle";
		let C = c * 1.25, w = !e.vertical && !s.startsWith("inside") ? s === "top" ? _ - (p.length - .5) * C : _ + C / 2 : _ - (p.length - 1) * C / 2;
		p.forEach((e, t) => i.fillText(e, g, w + t * C)), i.globalAlpha = 1;
	}
	hitTest(e, t) {
		for (let n = this.funnels.length - 1; n >= 0; n--) {
			let r = this.funnels[n];
			if (!r.spec.silent) {
				for (let n of r.stages) if (n.visible && o(e, t, n.pts)) return n;
			}
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
			i !== this.hover && (this.hover = i, this.emit("hover", i ? i.info : null), this.draw()), this.canvas.style.cursor = i ? "pointer" : "", this.showTooltip(t);
		}), this.canvas.addEventListener("pointerleave", () => {
			this.hover && (this.hover = null, this.emit("hover", null), this.draw()), this.tooltipEl.classList.remove("is-visible");
		}), this.canvas.addEventListener("click", (t) => {
			let { x: n, y: r } = e(t), i = this.hitTest(n, r);
			i && this.emit("click", i.info);
		}), this.legendEl.addEventListener("click", (e) => {
			let t = e.target.closest(".fn-legend__item");
			t && this.legendCfg().interactive && this.toggle(t.dataset.name);
		});
	}
	fmt(e) {
		return this.opts.valueFormatter ? this.opts.valueFormatter(e) : e.toLocaleString("pt-PT");
	}
	showTooltip(e) {
		let t = this.opts.tooltip ?? !0, n = this.tooltipEl, r = this.hover;
		if (!r || t === !1 || typeof t == "object" && t.show === !1) {
			n.classList.remove("is-visible");
			return;
		}
		let i = r.info;
		if (typeof t == "object" && t.formatter) n.innerHTML = t.formatter(i);
		else {
			let e = (e) => `${e.toLocaleString("pt-PT", { maximumFractionDigits: 1 })}%`;
			n.innerHTML = (i.funnelName ? `<div class="fn-tooltip__sub">${d(i.funnelName)}</div>` : "") + `<div class="fn-tooltip__head"><i class="fn-tooltip__dot" style="background:${i.color}"></i>${d(i.name)}</div><div class="fn-tooltip__row"><span>Valor</span><b>${d(this.fmt(i.value))}</b></div>` + (i.index > 0 ? `<div class="fn-tooltip__row"><span>Do primeiro</span><b>${e(i.percentOfFirst)}</b></div><div class="fn-tooltip__row"><span>Do anterior</span><b>${e(i.percentOfPrevious)}</b></div>` : "");
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
export { l as a, r as c, c as i, g as n, a as o, _ as r, i as s, u as t };

//# sourceMappingURL=funnel.js.map