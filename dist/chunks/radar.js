import { r as e, t } from "./format.js";
import { a as n, n as r } from "./color.js";
//#region src/radar/geometry.ts
function i(t) {
	if (!(t > 0)) return 1;
	let n = e(t / 5);
	return Math.ceil(t / n - 1e-9) * n;
}
function a(e, t, n = 90, r = !0) {
	let i = 360 / Math.max(1, t);
	return (n + (r ? -1 : 1) * e * i) * Math.PI / 180;
}
function o(e, t, n, r) {
	return {
		x: e + n * Math.cos(r),
		y: t - n * Math.sin(r)
	};
}
function s(e, t, n, r) {
	if (e === null || !isFinite(e)) return 0;
	let i = (e - t) / (n - t || 1);
	return Math.min(1, Math.max(0, i)) * r;
}
function c(e, t, n) {
	let r = !1;
	for (let i = 0, a = n.length - 1; i < n.length; a = i++) {
		let o = n[i], s = n[a];
		o.y > t != s.y > t && e < (s.x - o.x) * (t - o.y) / (s.y - o.y) + o.x && (r = !r);
	}
	return r;
}
//#endregion
//#region src/radar/radar.ts
var l = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", u = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	grid: "rgba(120, 123, 134, 0.35)",
	bands: ["rgba(42, 46, 57, 0.25)", "rgba(42, 46, 57, 0.6)"],
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: l
}, d = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	grid: "rgba(42, 46, 57, 0.18)",
	bands: ["rgba(240, 243, 250, 0.4)", "rgba(224, 227, 235, 0.6)"],
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
], p = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), m = (e, t, n) => Math.min(n, Math.max(t, e)), h = (e) => 1 - (1 - e) ** 3, g = (e, t) => {
	let [r, i, a, o] = n(e);
	return `rgba(${r}, ${i}, ${a}, ${+(t * o).toFixed(3)})`;
}, _ = class {
	constructor(e, t = {}) {
		this.list = [], this.hiddenKeys = /* @__PURE__ */ new Set(), this.models = [], this.coords = [], this.hover = null, this.width = 0, this.height = 0, this.dpr = 1, this.animStart = 0, this.raf = 0, this.handlers = /* @__PURE__ */ new Map(), this.destroyed = !1, this.opts = { ...t }, this.root = e, e.classList.add("rc-root"), this.titleEl = document.createElement("div"), this.titleEl.className = "rc-title", this.bodyEl = document.createElement("div"), this.plotEl = document.createElement("div"), this.plotEl.className = "rc-plot", this.canvas = document.createElement("canvas"), this.canvas.className = "rc-canvas", this.canvas.setAttribute("role", "img"), this.ctx = this.canvas.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "rc-tooltip", this.vmEl = document.createElement("div"), this.vmEl.className = "rc-vm", this.legendEl = document.createElement("ul"), this.plotEl.append(this.canvas, this.tooltipEl, this.vmEl), this.bodyEl.append(this.plotEl, this.legendEl), e.append(this.titleEl, this.bodyEl), this.list = (t.series ?? []).map((e) => ({ ...e }));
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
		n ? this.hiddenKeys.add(e) : this.hiddenKeys.delete(e), this.emit("toggle", {
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
		this.destroyed = !0, cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("rc-root"), this.titleEl.remove(), this.bodyEl.remove();
	}
	keyOf(e) {
		return e.id ?? e.name;
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t));
	}
	applyLook() {
		let e = this.opts, t = {
			...e.theme === "light" ? d : u,
			...typeof e.theme == "object" ? e.theme : {}
		};
		e.background && (t.background = e.background), this.theme = t;
		let n = {
			"--rc-bg": t.background,
			"--rc-text": t.text,
			"--rc-muted": t.muted,
			"--rc-tt-bg": t.tooltipBg,
			"--rc-tt-text": t.tooltipText,
			"--rc-tt-border": t.tooltipBorder,
			"--rc-font": t.font
		};
		for (let [e, t] of Object.entries(n)) this.root.style.setProperty(e, t);
		let r = typeof e.title == "string" ? { text: e.title } : e.title;
		this.titleEl.style.display = r ? "" : "none", r && (this.titleEl.style.textAlign = r.align ?? "center", this.titleEl.innerHTML = `<b>${p(r.text)}</b>${r.subtext ? `<small>${p(r.subtext)}</small>` : ""}`);
	}
	radarList() {
		let e = this.opts;
		if (e.radars?.length) return e.radars;
		let { title: t, ...n } = e;
		return [{
			...n,
			indicators: e.indicators ?? []
		}];
	}
	items(e) {
		let t = e.data;
		return t.length ? typeof t[0] == "number" || t[0] === null ? [{ value: t }] : t : [];
	}
	rebuild(e) {
		let t = this.opts.colors ?? f, n = this.opts.visualMap, o = new Map(this.models.map((e) => [e.key, e])), c = this.radarList();
		this.models = this.list.map((e, i) => {
			let a = this.keyOf(e), s = e.color ?? t[i % t.length], l = o.get(a), u = this.items(e);
			return {
				key: a,
				src: e,
				index: i,
				color: s,
				radar: m(e.radar ?? 0, 0, c.length - 1),
				items: u.map((t, i) => ({
					name: t.name ?? e.name,
					value: t.value,
					color: t.color ?? (n ? r(n.colors, u.length > 1 ? i / (u.length - 1) : 0) : s),
					t: [],
					from: l?.items[i]?.t.length ? [...l.items[i].t] : null,
					pts: []
				}))
			};
		}), this.coords = c.map((e, t) => {
			let n = e.indicators.length, r = [], o = [];
			for (let a = 0; a < n; a++) {
				let n = e.indicators[a], s = -Infinity;
				for (let e of this.models) if (e.radar === t) for (let t of e.items) s = Math.max(s, t.value[a] ?? -Infinity);
				o[a] = n.min ?? 0, r[a] = n.max ?? i(s);
			}
			return {
				o: e,
				cx: 0,
				cy: 0,
				R: 0,
				angles: e.indicators.map((t, r) => a(r, n, e.startAngle ?? 90, e.clockwise ?? !0)),
				min: o,
				max: r
			};
		});
		for (let e of this.models) {
			let t = this.coords[e.radar];
			for (let n of e.items) n.t = t.o.indicators.map((e, r) => s(n.value[r] ?? null, t.min[r], t.max[r], 1));
		}
		let l = this.opts.animation ?? !0, u = e && l !== !1;
		for (let e of this.models) for (let t of e.items) t.from ||= u ? t.t.map(() => 0) : null;
		if (!u) for (let e of this.models) for (let t of e.items) t.from = null;
		this.animStart = u ? performance.now() : 0, this.renderLegend(), this.renderVisual(), this.layout(), this.loop();
	}
	duration() {
		let e = this.opts.animation ?? !0;
		return e === !1 ? 0 : typeof e == "object" ? e.duration ?? 700 : 700;
	}
	progress(e) {
		return this.animStart ? h(m((e - this.animStart) / (this.duration() || 1), 0, 1)) : 1;
	}
	loop() {
		if (cancelAnimationFrame(this.raf), this.destroyed) return;
		let e = performance.now();
		if (this.draw(e), this.animStart && e - this.animStart < this.duration()) this.raf = requestAnimationFrame(() => this.loop());
		else {
			this.animStart = 0;
			for (let e of this.models) for (let t of e.items) t.from = null;
			this.draw();
		}
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
		this.bodyEl.className = `rc-body rc-legend-${e.position}`, this.legendEl.className = "rc-legend", this.legendEl.style.display = e.show ? "" : "none", e.show && (this.legendEl.innerHTML = this.models.map((t) => {
			let n = this.hiddenKeys.has(t.key);
			return `<li class="rc-legend__item${e.interactive ? " is-interactive" : ""}${n ? " is-hidden" : ""}" data-key="${p(t.key)}"><i class="rc-legend__marker" style="--c:${t.color}"></i><span>${p(t.src.name)}</span></li>`;
		}).join(""));
	}
	renderVisual() {
		let e = this.opts.visualMap, t = this.models[0]?.items ?? [];
		!e || e.show === !1 || t.length < 2 ? this.vmEl.style.display = "none" : (this.vmEl.style.display = "", this.vmEl.innerHTML = (e.title ? `<span class="rc-vm__title">${p(e.title)}</span>` : "") + `<span>${p(t[0].name)}</span><span class="rc-vm__bar" style="background:linear-gradient(to right,${e.colors.join(",")})"></span><span>${p(t[t.length - 1].name)}</span>`);
	}
	measure() {
		let e = this.plotEl.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height)), this.canvas.width = Math.round(this.width * this.dpr), this.canvas.height = Math.round(this.height * this.dpr), this.canvas.style.width = `${this.width}px`, this.canvas.style.height = `${this.height}px`;
	}
	layout() {
		let e = this.opts.padding ?? 10, t = this.vmEl.style.display === "none" ? 0 : 26, n = this.width - e * 2, r = this.height - e * 2 - t, i = Math.min(n, r) / 2;
		for (let t of this.coords) {
			let [i, a] = t.o.center ?? [50, 50];
			t.cx = e + n * i / 100, t.cy = e + r * a / 100;
		}
		for (let t of this.coords) {
			let a = e, o = e + n, s = e + (t.o.title ? 20 : 0), c = e + r;
			for (let e of this.coords) e !== t && (Math.abs(e.cy - t.cy) < r / 4 && (e.cx > t.cx ? o = Math.min(o, (e.cx + t.cx) / 2) : e.cx < t.cx && (a = Math.max(a, (e.cx + t.cx) / 2))), Math.abs(e.cx - t.cx) < n / 4 && (e.cy > t.cy ? c = Math.min(c, (e.cy + t.cy) / 2) : e.cy < t.cy && (s = Math.max(s, (e.cy + t.cy) / 2))));
			let l = i * (t.o.radius ?? 70) / 100, u = l, d = t.o.axisName ?? !0, f = typeof d == "object" ? d : {}, p = f.fontSize ?? 12, m = 10 + (f.padding ?? (f.background ? 4 : 0)) * 2;
			this.ctx.font = this.font(p, 500), t.o.indicators.forEach((e, n) => {
				let r = t.angles[n], i = Math.cos(r), l = Math.sin(r), h = d ? f.format ? f.format(e.name, e) : e.name : "", g = h ? h.split("\n") : [], _ = g.length ? Math.max(...g.map((e) => this.ctx.measureText(e).width)) : 0, v = g.length * p * 1.2, y = Math.abs(i) > .15 ? _ : _ / 2, b = Math.abs(l) > .15 ? v : v / 2;
				i > .01 && (u = Math.min(u, (o - t.cx - m - y) / i)), i < -.01 && (u = Math.min(u, (t.cx - a - m - y) / -i)), l > .01 && (u = Math.min(u, (t.cy - s - m - b) / l)), l < -.01 && (u = Math.min(u, (c - t.cy - m - b) / -l)), Math.abs(i) <= .01 && (u = Math.min(u, o - t.cx - _ / 2, t.cx - a - _ / 2));
			}), t.R = Math.max(8, u, l * .5);
		}
	}
	font(e, t = 400) {
		return `${t} ${e}px ${this.theme.font}`;
	}
	ring(e, t, n) {
		let r = this.ctx;
		n ? (r.moveTo(e.cx + t, e.cy), r.arc(e.cx, e.cy, t, 0, Math.PI * 2)) : (e.angles.forEach((n, i) => {
			let a = o(e.cx, e.cy, t, n);
			i ? r.lineTo(a.x, a.y) : r.moveTo(a.x, a.y);
		}), r.closePath());
	}
	drawGrid(e) {
		let t = this.ctx, n = this.theme, r = e.o, i = r.splitNumber ?? 5, a = r.shape === "circle";
		if (r.splitArea) {
			let o = typeof r.splitArea == "object" && r.splitArea.colors || n.bands;
			for (let n = i; n >= 1; n--) t.beginPath(), this.ring(e, e.R * n / i, a), n > 1 && this.ring(e, e.R * (n - 1) / i, a), t.fillStyle = o[(n - 1) % o.length], t.fill("evenodd");
		}
		let s = r.splitLine ?? !0;
		if (s) {
			let r = typeof s == "object" ? s : {};
			t.strokeStyle = r.color ?? n.grid, t.lineWidth = r.width ?? 1, t.setLineDash(r.dash ?? []);
			for (let n = 1; n <= i; n++) t.beginPath(), this.ring(e, e.R * n / i, a), t.stroke();
			t.setLineDash([]);
		}
		let c = r.axisLine ?? !0;
		if (c) {
			t.strokeStyle = typeof c == "object" && c.color || n.grid, t.lineWidth = 1, t.beginPath();
			for (let n of e.angles) {
				let r = o(e.cx, e.cy, e.R, n);
				t.moveTo(e.cx, e.cy), t.lineTo(r.x, r.y);
			}
			t.stroke();
		}
	}
	drawNames(e) {
		let n = this.ctx, r = e.o, i = r.axisName ?? !0;
		if (i) {
			let t = typeof i == "object" ? i : {}, r = t.fontSize ?? 12;
			n.font = this.font(r, 500), e.o.indicators.forEach((i, a) => {
				let s = e.angles[a], c = Math.cos(s), l = Math.sin(s), u = t.padding ?? (t.background ? 4 : 0), d = o(e.cx, e.cy, e.R + 10 + u, s), f = (t.format ? t.format(i.name, i) : i.name).split("\n"), p = Math.max(...f.map((e) => n.measureText(e).width)), m = f.length * r * 1.2, h = c > .15 ? d.x : c < -.15 ? d.x - p : d.x - p / 2, g = l > .15 ? d.y - m : l < -.15 ? d.y : d.y - m / 2;
				t.background && (n.fillStyle = t.background, n.beginPath(), n.roundRect(h - u, g - u, p + u * 2, m + u * 2, t.borderRadius ?? 3), n.fill()), n.fillStyle = i.color ?? t.color ?? this.theme.text, n.textAlign = "left", n.textBaseline = "top", f.forEach((e, t) => n.fillText(e, h + (p - n.measureText(e).width) / 2, g + t * r * 1.2 + r * .1));
			});
		}
		let a = r.axisLabel;
		if (a) {
			let i = typeof a == "object" ? a : {}, s = r.splitNumber ?? 5;
			n.font = this.font(10), n.fillStyle = i.color ?? this.theme.muted, n.textAlign = "left", n.textBaseline = "middle";
			let c = e.angles[0];
			for (let r = 1; r <= s; r++) {
				let a = e.min[0] + (e.max[0] - e.min[0]) * r / s, l = o(e.cx, e.cy, e.R * r / s, c);
				n.fillText(i.format ? i.format(a) : t(a), l.x + 4, l.y);
			}
		}
		r.title && (n.font = this.font(13, 600), n.fillStyle = this.theme.text, n.textAlign = "center", n.textBaseline = "bottom", n.fillText(r.title, e.cx, (this.opts.padding ?? 10) + 16));
	}
	draw(e = performance.now()) {
		let t = this.ctx, n = this.theme;
		t.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), t.clearRect(0, 0, this.width, this.height), n.background !== "transparent" && (t.fillStyle = n.background, t.fillRect(0, 0, this.width, this.height));
		for (let e of this.coords) this.drawGrid(e);
		let r = this.progress(e), i = this.opts.hoverDim ?? .25, a = this.models.filter((e) => !this.hiddenKeys.has(e.key));
		for (let e of a) {
			let t = this.coords[e.radar];
			for (let n of e.items) n.pts = t.angles.map((e, i) => {
				let a = n.from ? n.from[i] ?? 0 : n.t[i];
				return o(t.cx, t.cy, t.R * (a + (n.t[i] - a) * r), e);
			});
		}
		for (let e of a) e.items.forEach((t, n) => {
			(this.hover?.m !== e || this.hover.i !== n) && this.drawItem(e, t, this.hover ? i : 1, !1);
		});
		this.hover && a.includes(this.hover.m) && this.drawItem(this.hover.m, this.hover.m.items[this.hover.i], 1, !0);
		for (let e of this.coords) this.drawNames(e);
	}
	drawItem(e, t, n, r) {
		let i = this.ctx, a = e.src, s = this.coords[e.radar];
		if (!t.pts.length) return;
		let c = () => {
			i.beginPath(), t.pts.forEach((e, t) => t ? i.lineTo(e.x, e.y) : i.moveTo(e.x, e.y)), i.closePath();
		};
		if (i.globalAlpha = n, a.area) {
			let e = typeof a.area == "object" ? a.area : {}, n = (e.opacity ?? .25) + (r ? .1 : 0);
			if (e.gradient) {
				let r = i.createRadialGradient(s.cx, s.cy, 0, s.cx, s.cy, s.R), a = Array.isArray(e.gradient) ? e.gradient : [g(t.color, .05), g(t.color, 1)];
				a.forEach((e, t) => r.addColorStop(a.length > 1 ? t / (a.length - 1) : 0, g(e, n))), i.fillStyle = r;
			} else i.fillStyle = g(t.color, n);
			c(), i.fill();
		}
		let l = a.width ?? 2;
		l > 0 && (i.strokeStyle = t.color, i.lineWidth = l + +!!r, i.lineJoin = "round", i.setLineDash(a.dash ?? []), c(), i.stroke(), i.setLineDash([]));
		let u = a.points ?? !0;
		if (u) {
			let e = typeof u == "object" ? u : {}, n = e.symbol ?? "circle";
			if (n !== "none") {
				let i = (e.size ?? 4) + (r ? 1.5 : 0);
				for (let r of t.pts) this.symbol(n, r.x, r.y, i, t.color, e.hollow ?? !1);
			}
		}
		if (a.labels) {
			let e = typeof a.labels == "object" ? a.labels : {};
			i.font = this.font(11, 600), i.fillStyle = e.color ?? t.color, i.textBaseline = "middle", t.pts.forEach((n, r) => {
				let a = t.value[r];
				if (a == null) return;
				let c = s.o.indicators[r], l = s.angles[r], u = o(n.x, n.y, 12, l);
				i.textAlign = Math.cos(l) > .15 ? "left" : Math.cos(l) < -.15 ? "right" : "center", i.fillText(e.format ? e.format(a, c) : this.fmt(a, c), u.x, u.y);
			});
		}
		i.globalAlpha = 1;
	}
	symbol(e, t, n, r, i, a) {
		let o = this.ctx;
		o.beginPath(), e === "square" ? o.rect(t - r, n - r, r * 2, r * 2) : e === "diamond" ? (o.moveTo(t, n - r * 1.3), o.lineTo(t + r, n), o.lineTo(t, n + r * 1.3), o.lineTo(t - r, n), o.closePath()) : e === "triangle" ? (o.moveTo(t, n - r * 1.2), o.lineTo(t + r * 1.1, n + r * .8), o.lineTo(t - r * 1.1, n + r * .8), o.closePath()) : o.arc(t, n, r, 0, Math.PI * 2), a ? (o.fillStyle = this.theme.background === "transparent" ? "#ffffff" : this.theme.background, o.fill(), o.strokeStyle = i, o.lineWidth = 1.5, o.stroke()) : (o.fillStyle = i, o.fill());
	}
	fmt(e, t) {
		return this.opts.valueFormatter ? this.opts.valueFormatter(e, t) : e.toLocaleString("pt-PT");
	}
	info(e) {
		let t = e.m.items[e.i];
		return {
			series: e.m.src,
			seriesIndex: e.m.index,
			index: e.i,
			name: t.name,
			value: t.value,
			color: t.color,
			indicators: this.coords[e.m.radar].o.indicators
		};
	}
	hitTest(e, t) {
		let n = this.models.filter((e) => !this.hiddenKeys.has(e.key)), r = null, i = 64;
		for (let a of n) a.items.forEach((n, o) => {
			for (let s of n.pts) {
				let n = (s.x - e) ** 2 + (s.y - t) ** 2;
				n < i && (i = n, r = {
					m: a,
					i: o
				});
			}
		});
		if (r) return r;
		let a = Infinity;
		for (let i of n) i.items.forEach((n, o) => {
			if (!c(e, t, n.pts)) return;
			let s = 0;
			for (let e = 0, t = n.pts.length - 1; e < n.pts.length; t = e++) s += n.pts[t].x * n.pts[e].y - n.pts[e].x * n.pts[t].y;
			Math.abs(s) < a && (a = Math.abs(s), r = {
				m: i,
				i: o
			});
		});
		return r;
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
			!(i && this.hover && i.m === this.hover.m && i.i === this.hover.i) && (i || this.hover) && (this.hover = i, this.emit("hover", i ? this.info(i) : null), this.draw()), this.canvas.style.cursor = i ? "pointer" : "", this.showTooltip(t);
		}), this.canvas.addEventListener("pointerleave", () => {
			this.hover && (this.hover = null, this.emit("hover", null), this.draw()), this.tooltipEl.classList.remove("is-visible");
		}), this.canvas.addEventListener("click", (t) => {
			let { x: n, y: r } = e(t), i = this.hitTest(n, r);
			i && this.emit("click", this.info(i));
		}), this.legendEl.addEventListener("click", (e) => {
			let t = e.target.closest(".rc-legend__item");
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
			let e = i.name === r.m.src.name ? "" : `<div class="rc-tooltip__sub">${p(r.m.src.name)}</div>`;
			n.innerHTML = `<div class="rc-tooltip__head"><i class="rc-tooltip__dot" style="background:${i.color}"></i>${p(i.name)}</div>${e}` + i.indicators.map((e, t) => `<div class="rc-tooltip__row"><span>${p(e.name)}</span><b>${i.value[t] === null || i.value[t] === void 0 ? "–" : p(this.fmt(i.value[t], e))}</b></div>`).join("");
		}
		n.classList.add("is-visible");
		let a = this.plotEl.getBoundingClientRect(), o = e.clientX - a.left, s = e.clientY - a.top, c = n.offsetWidth, l = n.offsetHeight, u = o + 14 + c > this.width ? o - 14 - c : o + 14, d = m(s + 14 + l > this.height ? s - 14 - l : s + 14, 0, Math.max(0, this.height - l));
		n.style.transform = `translate(${Math.max(0, u)}px, ${d}px)`;
	}
};
function v(e, t = {}) {
	return new _(e, t);
}
//#endregion
export { d as a, u as i, _ as n, i as o, v as r, f as t };

//# sourceMappingURL=radar.js.map