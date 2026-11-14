import { a as e } from "./color.js";
//#region src/sankey/layout.ts
var t = (e) => e.reduce((e, t) => e + t, 0);
function n(e, n, r) {
	let o = Math.max(0, r.width), s = Math.max(0, r.height), c = Math.min(r.nodeWidth ?? 20, o), d = r.nodeAlign ?? "justify", f = Math.max(0, Math.floor(r.iterations ?? 32)), p = /* @__PURE__ */ new Map(), m = e.map((e, t) => {
		if (p.has(e.name)) throw Error(`sankey: duplicated node name "${e.name}"`);
		let n = {
			index: t,
			name: e.name,
			value: 0,
			inValue: 0,
			outValue: 0,
			depth: 0,
			height: 0,
			layer: 0,
			x0: 0,
			x1: 0,
			y0: 0,
			y1: 0,
			sourceLinks: [],
			targetLinks: []
		};
		return p.set(e.name, n), n;
	}), h = (e, t) => {
		let n = typeof e == "number" ? m[e] : p.get(e);
		if (!n) throw Error(`sankey: link ${t} points to an unknown node "${e}"`);
		return n;
	}, g = [], _ = [];
	n.forEach((e, t) => {
		let n = h(e.source, t), r = h(e.target, t), i = Number.isFinite(e.value) ? Math.max(0, e.value) : 0;
		n === r ? g.push({
			index: t,
			source: n.name,
			target: r.name,
			reason: "self"
		}) : _.push({
			index: t,
			source: n,
			target: r,
			value: i,
			width: 0,
			y0: 0,
			y1: 0
		});
	});
	let v = new Map(m.map((e) => [e, []]));
	for (let e of _) v.get(e.source).push(e);
	let y = /* @__PURE__ */ new Map(), b = /* @__PURE__ */ new Set();
	for (let e of m) {
		if (y.has(e)) continue;
		y.set(e, 1);
		let t = [[e, 0]];
		for (; t.length;) {
			let e = t[t.length - 1], n = v.get(e[0]);
			if (e[1] >= n.length) {
				y.set(e[0], 2), t.pop();
				continue;
			}
			let r = n[e[1]++], i = y.get(r.target);
			i === 1 ? b.add(r) : i || (y.set(r.target, 1), t.push([r.target, 0]));
		}
	}
	let x = _.filter((e) => !b.has(e) || (g.push({
		index: e.index,
		source: e.source.name,
		target: e.target.name,
		reason: "cycle"
	}), !1));
	g.sort((e, t) => e.index - t.index);
	for (let e of x) e.source.sourceLinks.push(e), e.target.targetLinks.push(e);
	for (let n of m) {
		n.inValue = t(n.targetLinks.map((e) => e.value)), n.outValue = t(n.sourceLinks.map((e) => e.value));
		let r = e[n.index].value;
		n.value = Math.max(n.inValue, n.outValue, Number.isFinite(r) ? r : 0);
	}
	let S = new Map(m.map((e) => [e, e.targetLinks.length])), C = m.filter((e) => !e.targetLinks.length);
	for (let e = 0; e < C.length; e++) for (let t of C[e].sourceLinks) {
		t.target.depth = Math.max(t.target.depth, C[e].depth + 1);
		let n = S.get(t.target) - 1;
		S.set(t.target, n), n || C.push(t.target);
	}
	for (let e = C.length - 1; e >= 0; e--) for (let t of C[e].targetLinks) t.source.height = Math.max(t.source.height, C[e].height + 1);
	let w = Math.max(0, ...m.map((e) => e.depth));
	for (let t of m) {
		t.layer = d === "left" ? t.depth : d === "right" ? w - t.height : t.sourceLinks.length ? t.depth : w;
		let n = e[t.index].depth;
		typeof n == "number" && Number.isFinite(n) && (t.layer = Math.max(0, Math.floor(n)));
	}
	let T = m.length ? Math.max(...m.map((e) => e.layer)) + 1 : 0, E = Array.from({ length: T }, () => []);
	for (let e of m) E[e.layer].push(e);
	let D = T > 1 ? (o - c) / (T - 1) : 0;
	for (let e of m) e.x0 = T > 1 ? e.layer * D : (o - c) / 2, e.x1 = e.x0 + c;
	let O = Math.max(1, ...E.map((e) => e.length)), k = Math.min(Math.max(0, r.nodeGap ?? 8), O > 1 ? s * .5 / (O - 1) : Infinity), A = Infinity;
	for (let e of E) {
		let n = t(e.map((e) => e.value));
		n > 0 && (A = Math.min(A, Math.max(0, s - (e.length - 1) * k) / n));
	}
	Number.isFinite(A) || (A = 0);
	for (let e of x) e.width = e.value * A;
	for (let e of E) {
		let t = 0;
		for (let n of e) n.y0 = t, n.y1 = t + n.value * A, t = n.y1 + k;
		let n = (s - t + k) / (e.length + 1);
		e.forEach((e, t) => {
			e.y0 += n * (t + 1), e.y1 += n * (t + 1);
		});
	}
	if (i(m), f > 0) for (let e = 0; e < f; e++) {
		let t = .99 ** e, n = Math.max(1 - t, (e + 1) / f);
		u(E, t, n, k, s), l(E, t, n, k, s);
	}
	return a(m), {
		nodes: m,
		links: x,
		ignored: g,
		columns: T,
		ky: A,
		gap: k
	};
}
function r(e) {
	i(e), a(e);
}
function i(e) {
	for (let t of e) t.sourceLinks.sort((e, t) => e.target.y0 - t.target.y0 || e.index - t.index), t.targetLinks.sort((e, t) => e.source.y0 - t.source.y0 || e.index - t.index);
}
function a(e) {
	for (let n of e) {
		let e = n.y0, r = n.y0, i = n.y1 - n.y0;
		e += Math.max(0, i - t(n.sourceLinks.map((e) => e.width))) / 2, r += Math.max(0, i - t(n.targetLinks.map((e) => e.width))) / 2;
		for (let t of n.sourceLinks) t.y0 = e + t.width / 2, e += t.width;
		for (let e of n.targetLinks) e.y1 = r + e.width / 2, r += e.width;
	}
}
function o(e, t, n) {
	let r = e.y0 - (e.sourceLinks.length - 1) * n / 2;
	for (let i of e.sourceLinks) {
		if (i.target === t) break;
		r += i.width + n;
	}
	for (let n of t.targetLinks) {
		if (n.source === e) break;
		r -= n.width;
	}
	return r;
}
function s(e, t, n) {
	let r = t.y0 - (t.targetLinks.length - 1) * n / 2;
	for (let i of t.targetLinks) {
		if (i.source === e) break;
		r += i.width + n;
	}
	for (let n of e.sourceLinks) {
		if (n.target === t) break;
		r -= n.width;
	}
	return r;
}
function c(e) {
	for (let t of e.targetLinks) t.source.sourceLinks.sort((e, t) => e.target.y0 - t.target.y0 || e.index - t.index);
	for (let t of e.sourceLinks) t.target.targetLinks.sort((e, t) => e.source.y0 - t.source.y0 || e.index - t.index);
}
function l(e, t, n, r, i) {
	for (let a = 1; a < e.length; a++) {
		let s = e[a];
		for (let e of s) {
			let n = 0, i = 0;
			for (let t of e.targetLinks) {
				let a = t.value * Math.max(1, e.layer - t.source.layer);
				n += o(t.source, e, r) * a, i += a;
			}
			if (!(i > 0)) continue;
			let a = (n / i - e.y0) * t;
			e.y0 += a, e.y1 += a, c(e);
		}
		s.sort((e, t) => e.y0 - t.y0 || e.index - t.index), d(s, n, r, i);
	}
}
function u(e, t, n, r, i) {
	for (let a = e.length - 2; a >= 0; a--) {
		let o = e[a];
		for (let e of o) {
			let n = 0, i = 0;
			for (let t of e.sourceLinks) {
				let a = t.value * Math.max(1, t.target.layer - e.layer);
				n += s(e, t.target, r) * a, i += a;
			}
			if (!(i > 0)) continue;
			let a = (n / i - e.y0) * t;
			e.y0 += a, e.y1 += a, c(e);
		}
		o.sort((e, t) => e.y0 - t.y0 || e.index - t.index), d(o, n, r, i);
	}
}
function d(e, t, n, r) {
	if (!e.length) return;
	let i = e.length >> 1, a = e[i];
	p(e, a.y0 - n, i - 1, t, n), f(e, a.y1 + n, i + 1, t, n), p(e, r, e.length - 1, t, n), f(e, 0, 0, t, n);
}
function f(e, t, n, r, i) {
	for (; n < e.length; n++) {
		let a = e[n], o = (t - a.y0) * r;
		o > 1e-6 && (a.y0 += o, a.y1 += o), t = a.y1 + i;
	}
}
function p(e, t, n, r, i) {
	for (; n >= 0; n--) {
		let a = e[n], o = (a.y1 - t) * r;
		o > 1e-6 && (a.y0 -= o, a.y1 -= o), t = a.y0 - i;
	}
}
//#endregion
//#region src/sankey/sankey.ts
var m = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", h = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	nodeBorder: "transparent",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: m
}, g = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	nodeBorder: "transparent",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: m
}, _ = [
	"#2962ff",
	"#ff9800",
	"#089981",
	"#f23645",
	"#9c27b0",
	"#00bcd4",
	"#e91e63",
	"#8bc34a",
	"#ffc107",
	"#607d8b",
	"#3f51b5",
	"#ff5722"
], v = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), y = (e, t, n) => Math.min(n, Math.max(t, e)), b = (e) => e < .5 ? 4 * e * e * e : 1 - (-2 * e + 2) ** 3 / 2, x = (e, t, n) => e + (t - e) * n, S = (t, n) => {
	let [r, i, a, o] = e(t);
	return `rgba(${r}, ${i}, ${a}, ${+(n * o).toFixed(3)})`;
}, C = (t) => {
	let [n, r, i] = e(t);
	return (.299 * n + .587 * r + .114 * i) / 255;
}, w = class {
	constructor(e, t = {}) {
		this.res = null, this.vnodes = [], this.vlinks = [], this.byLayoutNode = /* @__PURE__ */ new Map(), this.byLayoutLink = /* @__PURE__ */ new Map(), this.hover = null, this.manual = /* @__PURE__ */ new Map(), this.width = 0, this.height = 0, this.dpr = 1, this.area = {
			x: 0,
			y: 0,
			w: 0,
			h: 0
		}, this.horiz = !0, this.mode = "none", this.progress = 1, this.animStart = 0, this.raf = 0, this.handlers = /* @__PURE__ */ new Map(), this.destroyed = !1, this.opts = { ...t }, this.root = e, e.classList.add("sk-root"), this.titleEl = document.createElement("div"), this.titleEl.className = "sk-title", this.bodyEl = document.createElement("div"), this.bodyEl.className = "sk-body", this.plotEl = document.createElement("div"), this.plotEl.className = "sk-plot", this.canvas = document.createElement("canvas"), this.canvas.className = "sk-canvas", this.canvas.setAttribute("role", "img"), this.ctx = this.canvas.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "sk-tooltip", this.plotEl.append(this.canvas, this.tooltipEl), this.bodyEl.append(this.plotEl), e.append(this.titleEl, this.bodyEl), this.applyLook(), this.bind(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(this.plotEl), this.measure(), this.relayout(this.duration() > 0 ? "reveal" : "none");
	}
	setData(e, t = !0) {
		this.opts = {
			...this.opts,
			nodes: e.nodes,
			links: e.links
		}, this.manual.clear(), this.relayout(t && this.duration() > 0 ? "morph" : "none");
	}
	setOptions(e, t = !0) {
		let n = this.opts.orient;
		this.opts = {
			...this.opts,
			...e
		}, (e.nodes || e.links || e.nodeAlign || e.orient || e.levels) && this.manual.clear(), this.applyLook();
		let r = t && this.duration() > 0;
		this.relayout(r ? (e.orient ?? n ?? "horizontal") === (n ?? "horizontal") ? "morph" : "reveal" : "none");
	}
	getIgnoredLinks() {
		return this.res ? this.res.ignored.map((e) => ({ ...e })) : [];
	}
	resetLayout() {
		this.manual.clear(), this.relayout(this.duration() > 0 ? "morph" : "none");
	}
	on(e, t) {
		this.handlers.has(e) || this.handlers.set(e, /* @__PURE__ */ new Set());
		let n = t;
		return this.handlers.get(e).add(n), () => this.handlers.get(e)?.delete(n);
	}
	resize() {
		this.measure(), this.relayout("none");
	}
	screenshot() {
		return this.draw(), this.canvas.toDataURL("image/png");
	}
	destroy() {
		this.destroyed = !0, cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("sk-root"), this.titleEl.remove(), this.bodyEl.remove();
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
			"--sk-bg": t.background,
			"--sk-text": t.text,
			"--sk-muted": t.muted,
			"--sk-tt-bg": t.tooltipBg,
			"--sk-tt-text": t.tooltipText,
			"--sk-tt-border": t.tooltipBorder,
			"--sk-font": t.font
		};
		for (let [e, t] of Object.entries(n)) this.root.style.setProperty(e, t);
		let r = typeof e.title == "string" ? { text: e.title } : e.title;
		this.titleEl.style.display = r ? "" : "none", r && (this.titleEl.style.textAlign = r.align ?? "center", this.titleEl.innerHTML = `<b>${v(r.text)}</b>${r.subtext ? `<small>${v(r.subtext)}</small>` : ""}`);
	}
	duration() {
		let e = this.opts.animation ?? !0;
		return e === !1 ? 0 : typeof e == "object" ? e.duration ?? 700 : 700;
	}
	focus() {
		let e = this.opts.emphasis;
		return (typeof e == "object" ? e.focus : e) ?? "adjacency";
	}
	fmt(e) {
		return this.opts.valueFormat ? this.opts.valueFormat(e) : e.toLocaleString("pt-PT", { maximumFractionDigits: 2 });
	}
	font(e, t = 400) {
		return `${t} ${e}px ${this.theme.font}`;
	}
	measure() {
		let e = this.plotEl.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height)), this.canvas.width = Math.round(this.width * this.dpr), this.canvas.height = Math.round(this.height * this.dpr), this.canvas.style.width = `${this.width}px`, this.canvas.style.height = `${this.height}px`;
	}
	layoutOpts(e, t, n) {
		let r = this.opts;
		return {
			width: e,
			height: t,
			nodeWidth: r.nodeWidth ?? 20,
			nodeGap: r.nodeGap ?? 8,
			nodeAlign: r.nodeAlign ?? "justify",
			iterations: n ?? r.layoutIterations ?? 32
		};
	}
	decorate(e, t) {
		let n = this.opts, r = n.colors?.length ? n.colors : _;
		return e.nodes.map((e) => {
			let i = t[e.index], a = n.levels?.find((t) => t.depth === e.layer), o = {
				...n.itemStyle,
				...a?.itemStyle,
				...i.itemStyle
			}, s = o.color ?? r[e.index % r.length], c = {
				...n.label,
				...a?.label,
				...i.label
			}, l = c.position ?? "auto";
			l === "auto" && (l = this.horiz ? "right" : "bottom");
			let u = this.nodeInfo(e, i, s), d = c.show === !1 ? [] : (c.formatter ? c.formatter(u) : e.name).split("\n").filter(Boolean);
			return {
				color: s,
				style: o,
				label: c,
				pos: l,
				text: d
			};
		});
	}
	nodeInfo(e, t, n) {
		return {
			dataType: "node",
			node: t,
			name: e.name,
			index: e.index,
			value: e.value,
			inValue: e.inValue,
			outValue: e.outValue,
			depth: e.layer,
			color: n
		};
	}
	textWidth(e, t) {
		return e.length ? (this.ctx.font = this.font(t.fontSize ?? 12, t.fontWeight ?? 400), Math.max(...e.map((e) => this.ctx.measureText(e).width))) : 0;
	}
	relayout(e) {
		let t = this.opts, i = t.nodes ?? [], a = t.links ?? [];
		this.horiz = (t.orient ?? "horizontal") !== "vertical";
		let o = this.width, s = this.height, c = n(i, a, this.layoutOpts(1e3, 1e3, 0));
		c.ignored.length && c.ignored.some((e) => !this.res?.ignored.some((t) => t.index === e.index)) && console.warn(`sankey: ${c.ignored.length} link(s) left out (self-links or cycles)`, c.ignored);
		let l = this.decorate(c, i), u = (e, t, n) => e === void 0 ? n : typeof e == "number" ? e : e.trim().endsWith("%") ? t * parseFloat(e) / 100 : parseFloat(e) || 0, d = 0, f = 0, p = 0, m = 0, h = c.columns - 1;
		c.nodes.forEach((e, t) => {
			let n = l[t];
			if (!n.text.length) return;
			let r = n.label.fontSize ?? 12, i = n.label.distance ?? 5, a = this.textWidth(n.text, n.label) + i + 2, o = n.text.length * r * 1.25 + i, s = e.layer === 0, c = e.layer === h;
			this.horiz ? (n.pos === "left" && s && (d = Math.max(d, a)), n.pos === "right" && c && (f = Math.max(f, a)), n.pos === "top" && (p = Math.max(p, o)), n.pos === "bottom" && (m = Math.max(m, o)), p = Math.max(p, r * .6), m = Math.max(m, r * .6)) : (n.pos === "top" && s && (p = Math.max(p, o)), n.pos === "bottom" && c && (m = Math.max(m, o)), n.pos === "left" && (d = Math.max(d, a)), n.pos === "right" && (f = Math.max(f, a)));
		});
		let g = (e, t) => Math.min(e, t * .3), _ = u(t.left, o, 12) + g(d, o), v = o - u(t.right, o, 12) - g(f, o), b = u(t.top, s, 10) + g(p, s), x = s - u(t.bottom, s, 10) - g(m, s);
		this.area = {
			x: _,
			y: b,
			w: Math.max(1, v - _),
			h: Math.max(1, x - b)
		};
		let S = this.horiz ? this.area.w : this.area.h, C = this.horiz ? this.area.h : this.area.w, w = n(i, a, this.layoutOpts(S, C));
		if (this.manual.size) {
			for (let e of w.nodes) {
				let t = this.manual.get(e.name);
				if (t === void 0) continue;
				let n = e.y1 - e.y0;
				e.y0 = y(t * C, 0, Math.max(0, C - n)), e.y1 = e.y0 + n;
			}
			r(w.nodes);
		}
		let T = /* @__PURE__ */ new Map(), E = /* @__PURE__ */ new Map();
		if (e === "morph") {
			for (let e of this.vnodes) T.set(e.L.name, { ...e.cur });
			for (let e of this.vlinks) E.set(e.key, {
				y0: e.y0,
				y1: e.y1,
				w: e.w
			});
		}
		this.res = w, this.byLayoutNode.clear(), this.byLayoutLink.clear(), this.vnodes = w.nodes.map((e, t) => {
			let n = l[t], r = {
				x0: e.x0,
				x1: e.x1,
				y0: e.y0,
				y1: e.y1
			}, a = T.get(e.name) ?? null, o = {
				L: e,
				src: i[e.index],
				color: n.color,
				style: n.style,
				label: n.label,
				pos: n.pos,
				info: this.nodeInfo(e, i[e.index], n.color),
				from: a,
				cur: a ? { ...a } : r,
				a: 1
			};
			return this.byLayoutNode.set(e, o), o;
		});
		let D = /* @__PURE__ */ new Map();
		if (this.vlinks = w.links.map((e) => {
			let n = a[e.index], r = t.levels?.find((t) => t.depth === e.source.layer), i = {
				...t.lineStyle,
				...r?.lineStyle,
				...n.lineStyle
			}, o = `${e.source.name}\u0001${e.target.name}`, s = D.get(o) ?? 0;
			D.set(o, s + 1);
			let c = `${o}\u0001${s}`, l = E.get(c) ?? null, u = {
				L: e,
				src: n,
				key: c,
				color: i.color ?? "source",
				opacity: y(i.opacity ?? .35, 0, 1),
				curveness: y(i.curveness ?? .5, 0, 1),
				info: {
					dataType: "link",
					link: n,
					index: e.index,
					source: e.source.name,
					target: e.target.name,
					value: e.value
				},
				from: l,
				y0: l ? l.y0 : e.y0,
				y1: l ? l.y1 : e.y1,
				w: l ? l.w : e.width,
				a: 1,
				path: null
			};
			return this.byLayoutLink.set(e, u), u;
		}), this.hover) {
			let e = this.hover;
			this.hover = "cur" in e ? this.vnodes.find((t) => t.L.name === e.L.name) ?? null : this.vlinks.find((t) => t.key === e.key) ?? null;
		}
		this.mode = e, this.animStart = e === "none" ? 0 : performance.now(), this.loop();
	}
	loop() {
		if (cancelAnimationFrame(this.raf), this.destroyed) return;
		let e = this.animStart ? y((performance.now() - this.animStart) / (this.duration() || 1), 0, 1) : 1;
		this.progress = e;
		let t = b(e), n = this.mode === "morph" && e < 1;
		for (let e of this.vnodes) {
			let r = e.L;
			e.cur = n && e.from ? {
				x0: x(e.from.x0, r.x0, t),
				x1: x(e.from.x1, r.x1, t),
				y0: x(e.from.y0, r.y0, t),
				y1: x(e.from.y1, r.y1, t)
			} : {
				x0: r.x0,
				x1: r.x1,
				y0: r.y0,
				y1: r.y1
			}, e.a = n && !e.from ? t : 1;
		}
		for (let e of this.vlinks) {
			let r = e.L;
			n && e.from ? (e.y0 = x(e.from.y0, r.y0, t), e.y1 = x(e.from.y1, r.y1, t), e.w = x(e.from.w, r.width, t)) : (e.y0 = r.y0, e.y1 = r.y1, e.w = r.width), e.a = n && !e.from ? t : 1;
		}
		this.draw(), e < 1 ? this.raf = requestAnimationFrame(() => this.loop()) : (this.animStart = 0, this.mode = "none");
	}
	rect(e) {
		let t = this.area;
		return this.horiz ? {
			x: t.x + e.x0,
			y: t.y + e.y0,
			w: e.x1 - e.x0,
			h: e.y1 - e.y0
		} : {
			x: t.x + e.y0,
			y: t.y + e.x0,
			w: e.y1 - e.y0,
			h: e.x1 - e.x0
		};
	}
	pt(e, t) {
		let n = this.area;
		return this.horiz ? [n.x + e, n.y + t] : [n.x + t, n.y + e];
	}
	linkPath(e) {
		let t = this.byLayoutNode.get(e.L.source), n = this.byLayoutNode.get(e.L.target), r = t.cur.x1, i = n.cur.x0, a = e.curveness, o = r + (i - r) * a, s = i - (i - r) * a, c = new Path2D();
		return c.moveTo(...this.pt(r, e.y0)), c.bezierCurveTo(...this.pt(o, e.y0), ...this.pt(s, e.y1), ...this.pt(i, e.y1)), c;
	}
	lit() {
		let e = this.hover, t = this.focus();
		if (!e || t === "none") return null;
		let n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set(), i = (e) => this.byLayoutNode.get(e), a = (e) => this.byLayoutLink.get(e), o = (e) => {
			for (let t of e.targetLinks) r.has(a(t)) || (r.add(a(t)), n.add(i(t.source)), o(t.source));
		}, s = (e) => {
			for (let t of e.sourceLinks) r.has(a(t)) || (r.add(a(t)), n.add(i(t.target)), s(t.target));
		};
		if ("cur" in e) {
			if (n.add(e), t === "adjacency") for (let t of [...e.L.sourceLinks, ...e.L.targetLinks]) r.add(a(t)), n.add(i(t.source)), n.add(i(t.target));
			else t === "trajectory" && (o(e.L), s(e.L));
		} else r.add(e), t !== "self" && (n.add(i(e.L.source)), n.add(i(e.L.target))), t === "trajectory" && (o(e.L.source), s(e.L.target));
		return {
			nodes: n,
			links: r
		};
	}
	draw() {
		let e = this.ctx, t = this.theme;
		if (e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.clearRect(0, 0, this.width, this.height), t.background !== "transparent" && (e.fillStyle = t.background, e.fillRect(0, 0, this.width, this.height)), e.save(), this.mode === "reveal" && this.progress < 1) {
			let t = b(this.progress);
			e.beginPath(), this.horiz ? e.rect(0, 0, this.width * t, this.height) : e.rect(0, 0, this.width, this.height * t), e.clip();
		}
		let n = this.lit(), r = [...this.vlinks].sort((e, t) => t.L.width - e.L.width);
		for (let e of r) this.drawLink(e, n);
		for (let e of this.vnodes) this.drawNode(e, n);
		this.drawLabels(n), e.restore();
	}
	drawLink(e, t) {
		if (e.path = this.linkPath(e), e.w <= .01 || e.a <= .002) return;
		let n = this.ctx, r = this.byLayoutNode.get(e.L.source), i = this.byLayoutNode.get(e.L.target), a = t?.links.has(e), o = t ? a ? Math.min(1, e.opacity + .3) : e.opacity * .3 : e.opacity;
		if (n.globalAlpha = e.a * o, e.color === "gradient") {
			let [t, a] = this.pt(r.cur.x1, e.y0), [o, s] = this.pt(i.cur.x0, e.y1), c = n.createLinearGradient(t, a, o, s);
			c.addColorStop(0, r.color), c.addColorStop(1, i.color), n.strokeStyle = c;
		} else n.strokeStyle = e.color === "source" ? r.color : e.color === "target" ? i.color : e.color;
		n.lineWidth = Math.max(1, e.w), n.lineCap = "butt", n.stroke(e.path), n.globalAlpha = 1;
	}
	drawNode(e, t) {
		let n = this.ctx, r = this.rect(e.cur);
		this.horiz && r.h < 1 && (r.y -= (1 - r.h) / 2, r.h = 1), !this.horiz && r.w < 1 && (r.x -= (1 - r.w) / 2, r.w = 1);
		let i = e.style;
		n.globalAlpha = e.a * (i.opacity ?? 1) * (t && !t.nodes.has(e) ? .3 : 1), n.beginPath();
		let a = Math.min(i.borderRadius ?? 0, r.w / 2, r.h / 2);
		a > 0 ? n.roundRect(r.x, r.y, r.w, r.h, a) : n.rect(r.x, r.y, r.w, r.h), n.fillStyle = e.color, n.fill();
		let o = i.borderWidth ?? 0, s = i.borderColor ?? this.theme.nodeBorder;
		o > 0 && s !== "transparent" && (n.strokeStyle = s, n.lineWidth = o, n.stroke()), this.hover === e && (n.strokeStyle = S(this.theme.text, .7), n.lineWidth = 1.5, n.stroke()), n.globalAlpha = 1;
	}
	drawLabels(t) {
		let n = this.ctx, r = [];
		for (let e of this.vnodes) {
			let t = e.label;
			if (t.show === !1) continue;
			let i = t.formatter ? t.formatter(e.info) : e.L.name, a = i.split("\n");
			if (!i) continue;
			let o = t.fontSize ?? 12, s = o * 1.25;
			n.font = this.font(o, t.fontWeight ?? 400);
			let c = Math.max(...a.map((e) => n.measureText(e).width)), l = a.length * s, u = t.distance ?? 5, d = this.rect(e.cur), f, p, m;
			e.pos === "right" || e.pos === "left" ? (m = e.pos === "right" ? "left" : "right", f = e.pos === "right" ? d.x + d.w + u : d.x - u - c, p = d.y + d.h / 2 - l / 2) : (m = "center", f = d.x + d.w / 2 - c / 2, p = e.pos === "top" ? d.y - u - l : e.pos === "bottom" ? d.y + d.h + u : d.y + d.h / 2 - l / 2), f = y(f, 2, Math.max(2, this.width - c - 2)), p = y(p, 1, Math.max(1, this.height - l - 1)), r.push({
				v: e,
				lines: a,
				fs: o,
				lh: s,
				align: m,
				x0: f,
				y0: p,
				w: c,
				h: l
			});
		}
		r.sort((e, n) => +!!t?.nodes.has(n.v) - !!t?.nodes.has(e.v) || n.v.L.value - e.v.L.value);
		let i = [];
		for (let e of r) i.some((t) => e.x0 < t.x0 + t.w + 4 && e.x0 + e.w > t.x0 - 4 && e.y0 < t.y0 + t.h - 1 && e.y0 + e.h > t.y0 + 1) || i.push(e);
		let a = this.theme.background, o = a !== "transparent" && e(a)[3] > 0;
		for (let e of i) {
			let r = e.v.label;
			n.globalAlpha = e.v.a * (t && !t.nodes.has(e.v) ? .35 : 1), n.font = this.font(e.fs, this.hover === e.v ? 600 : r.fontWeight ?? 400), n.textAlign = e.align, n.textBaseline = "middle";
			let i = r.color ?? (e.v.pos === "inside" ? C(e.v.color) > .6 ? "#131722" : "#ffffff" : this.theme.text), s = e.align === "left" ? e.x0 : e.align === "right" ? e.x0 + e.w : e.x0 + e.w / 2;
			e.lines.forEach((t, r) => {
				let c = e.y0 + e.lh * (r + .5);
				o && e.v.pos !== "inside" && (n.strokeStyle = S(a, .7), n.lineWidth = 3, n.lineJoin = "round", n.strokeText(t, s, c)), n.fillStyle = i, n.fillText(t, s, c);
			});
		}
		n.globalAlpha = 1;
	}
	infoOf(e) {
		return e.info;
	}
	hitTest(e, t) {
		for (let n = this.vnodes.length - 1; n >= 0; n--) {
			let r = this.vnodes[n], i = this.rect(r.cur), a = Math.max(0, (6 - i.w) / 2), o = Math.max(0, (6 - i.h) / 2);
			if (e >= i.x - a && e <= i.x + i.w + a && t >= i.y - o && t <= i.y + i.h + o) return r;
		}
		let n = this.ctx;
		n.save(), n.setTransform(1, 0, 0, 1, 0, 0);
		let r = [...this.vlinks].sort((e, t) => e.L.width - t.L.width), i = null;
		for (let a of r) if (!(!a.path || a.w <= .01) && (n.lineWidth = Math.max(4, a.w), n.isPointInStroke(a.path, e, t))) {
			i = a;
			break;
		}
		return n.restore(), i;
	}
	setHover(e) {
		e !== this.hover && (this.hover = e, this.emit("hover", e ? this.infoOf(e) : null), this.draw());
	}
	bind() {
		let e = (e) => {
			let t = this.canvas.getBoundingClientRect();
			return {
				x: e.clientX - t.left,
				y: e.clientY - t.top
			};
		}, t = null, n = !1;
		this.canvas.addEventListener("pointerdown", (n) => {
			if (this.opts.draggable === !1 || n.button !== 0) return;
			let r = e(n), i = this.hitTest(r.x, r.y);
			i && "cur" in i && (t = {
				v: i,
				start: this.horiz ? r.y : r.x,
				y0: i.L.y0,
				moved: !1
			}, this.canvas.setPointerCapture(n.pointerId));
		});
		let i = () => {
			t?.moved && (n = !0, setTimeout(() => n = !1, 0), this.emit("drag", t.v.info), this.canvas.style.cursor = "grab"), t = null;
		};
		this.canvas.addEventListener("pointerup", i), this.canvas.addEventListener("pointercancel", i), this.canvas.addEventListener("pointermove", (n) => {
			let { x: i, y: a } = e(n);
			if (t && n.buttons) {
				let e = (this.horiz ? a : i) - t.start;
				if (Math.abs(e) > 2 && (t.moved = !0), t.moved) {
					let i = t.v.L, a = this.horiz ? this.area.h : this.area.w, o = i.y1 - i.y0;
					i.y0 = y(t.y0 + e, 0, Math.max(0, a - o)), i.y1 = i.y0 + o, this.manual.set(i.name, a > 0 ? i.y0 / a : 0), r(this.res.nodes), this.animStart = 0, this.mode = "none", cancelAnimationFrame(this.raf), this.loop(), this.canvas.style.cursor = "grabbing", this.showTooltip(n);
					return;
				}
			}
			let o = this.hitTest(i, a);
			this.setHover(o), this.canvas.style.cursor = o ? "cur" in o && this.opts.draggable !== !1 ? "grab" : "pointer" : "", this.showTooltip(n);
		}), this.canvas.addEventListener("pointerleave", () => {
			t || (this.setHover(null), this.tooltipEl.classList.remove("is-visible"));
		}), this.canvas.addEventListener("click", (t) => {
			if (n) return;
			let { x: r, y: i } = e(t), a = this.hitTest(r, i);
			a && this.emit("click", this.infoOf(a));
		});
	}
	showTooltip(e) {
		let t = this.opts.tooltip ?? !0, n = this.tooltipEl, r = this.hover;
		if (!r || t === !1 || typeof t == "object" && t.show === !1) {
			n.classList.remove("is-visible");
			return;
		}
		let i = this.infoOf(r);
		if (typeof t == "object" && t.formatter) n.innerHTML = t.formatter(i);
		else if (i.dataType === "link") {
			let e = this.byLayoutNode.get(r.L.source), t = this.byLayoutNode.get(r.L.target), a = e.L.outValue > 0 ? `<div class="sk-tooltip__sub">${(i.value / e.L.outValue * 100).toLocaleString("pt-PT", { maximumFractionDigits: 1 })}% do que sai de ${v(i.source)}</div>` : "";
			n.innerHTML = `<div class="sk-tooltip__head"><i class="sk-tooltip__dot" style="background:linear-gradient(90deg, ${e.color}, ${t.color})"></i>${v(i.source)} → ${v(i.target)}</div><div class="sk-tooltip__row"><span>Valor</span><b>${v(this.fmt(i.value))}</b></div>${a}`;
		} else {
			let e = r.L, t = [], a = (e, n) => t.push(`<div class="sk-tooltip__row"><span>${e}</span><b>${v(this.fmt(n))}</b></div>`);
			e.targetLinks.length && a("Entrada", e.inValue), e.sourceLinks.length && a("Saída", e.outValue), (!t.length || e.value > e.inValue && e.value > e.outValue) && a("Valor", e.value), n.innerHTML = `<div class="sk-tooltip__head"><i class="sk-tooltip__dot" style="background:${i.color}"></i>${v(i.name)}</div>${t.join("")}`;
		}
		n.classList.add("is-visible");
		let a = this.plotEl.getBoundingClientRect(), o = e.clientX - a.left, s = e.clientY - a.top, c = n.offsetWidth, l = n.offsetHeight, u = o + 14 + c > this.width ? o - 14 - c : o + 14, d = y(s + 14 + l > this.height ? s - 14 - l : s + 14, 0, Math.max(0, this.height - l));
		n.style.transform = `translate(${Math.max(0, u)}px, ${d}px)`;
	}
};
function T(e, t = {}) {
	return new w(e, t);
}
//#endregion
export { g as a, h as i, w as n, n as o, T as r, r as s, _ as t };

//# sourceMappingURL=sankey.js.map