import { a as e } from "./color.js";
//#region src/tree/layout.ts
var t = (e, t) => e.parent === t.parent ? 1 : 2, n = (e, t) => (e.parent === t.parent ? 1 : 2) / Math.max(1, e.depth);
function r(e, n = t) {
	let r = i(null, null, 0, -1), a = i(e, r, 0, 0);
	r.children = [a];
	let o = [], s = [a];
	for (; s.length;) {
		let e = s.pop();
		o.push(e), e.children = e.node.children.map((t, n) => i(t, e, n, e.depth + 1)), s.push(...e.children);
	}
	let c = (e, t) => n({
		parent: e.parent,
		depth: e.depth
	}, {
		parent: t.parent,
		depth: t.depth
	}), l = (e) => e.children.length ? e.children[0] : e.t, u = (e) => e.children.length ? e.children[e.children.length - 1] : e.t, d = (e, t, n) => {
		let r = n / (t.i - e.i);
		t.c -= r, t.s += n, e.c += r, t.z += n, t.m += n;
	}, f = (e) => {
		let t = 0, n = 0;
		for (let r = e.children.length - 1; r >= 0; r--) {
			let i = e.children[r];
			i.z += t, i.m += t, t += i.s + (n += i.c);
		}
	}, p = (e, t, n) => e.a.parent === t.parent ? e.a : n, m = (e, t, n) => {
		if (!t) return n;
		let r = e, i = e, a = t, o = e.parent.children[0], s = r.m, f = i.m, m = a.m, h = o.m;
		for (; a = u(a), r = l(r), a && r;) {
			o = l(o), i = u(i), i.a = e;
			let t = a.z + m - r.z - s + c(a, r);
			t > 0 && (d(p(a, e, n), e, t), s += t, f += t), m += a.m, s += r.m, h += o.m, f += i.m;
		}
		return a && !u(i) && (i.t = a, i.m += m - f), r && !l(o) && (o.t = r, o.m += s - h, n = e), n;
	};
	for (let e = o.length - 1; e >= 0; e--) {
		let t = o[e], n = t.parent.children, r = t.i ? n[t.i - 1] : null;
		if (t.children.length) {
			f(t);
			let e = (t.children[0].z + t.children[t.children.length - 1].z) / 2;
			r ? (t.z = r.z + c(t, r), t.m = t.z - e) : t.z = e;
		} else r && (t.z = r.z + c(t, r));
		t.parent.A = m(t, r, t.parent.A ?? n[0]);
	}
	r.m = -a.z;
	let h = /* @__PURE__ */ new Map(), g = Infinity;
	for (let e of o) {
		let t = e.z + e.parent.m;
		e.m += e.parent.m, h.set(e.node, {
			x: t,
			depth: e.depth
		}), g = Math.min(g, t);
	}
	for (let e of h.values()) e.x -= g;
	return h;
}
function i(e, t, n, r) {
	let i = {
		node: e,
		parent: t,
		children: [],
		i: n,
		depth: r,
		A: null,
		t: null,
		z: 0,
		m: 0,
		c: 0,
		s: 0
	};
	return i.a = i, i;
}
//#endregion
//#region src/tree/tree.ts
var a = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", o = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	edge: "rgba(120, 123, 134, 0.55)",
	symbolFill: "#131722",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: a
}, s = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	edge: "#c8ccd6",
	symbolFill: "#ffffff",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: a
}, c = [
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
], l = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), u = (e, t, n) => Math.min(n, Math.max(t, e)), d = (e) => e < .5 ? 4 * e * e * e : 1 - (-2 * e + 2) ** 3 / 2, f = (t, n) => {
	let [r, i, a, o] = e(t);
	return `rgba(${r}, ${i}, ${a}, ${+(n * o).toFixed(3)})`;
}, p = class {
	constructor(e, t = {}) {
		this.specs = [], this.trees = [], this.hiddenKeys = /* @__PURE__ */ new Set(), this.hover = null, this.width = 0, this.height = 0, this.dpr = 1, this.view = {
			k: 1,
			x: 0,
			y: 0
		}, this.animStart = 0, this.raf = 0, this.handlers = /* @__PURE__ */ new Map(), this.destroyed = !1, this.opts = { ...t }, this.root = e, e.classList.add("tr-root"), this.titleEl = document.createElement("div"), this.titleEl.className = "tr-title", this.bodyEl = document.createElement("div"), this.plotEl = document.createElement("div"), this.plotEl.className = "tr-plot", this.canvas = document.createElement("canvas"), this.canvas.className = "tr-canvas", this.canvas.setAttribute("role", "img"), this.ctx = this.canvas.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "tr-tooltip", this.legendEl = document.createElement("ul"), this.plotEl.append(this.canvas, this.tooltipEl), this.bodyEl.append(this.plotEl, this.legendEl), e.append(this.titleEl, this.bodyEl), this.specs = this.specList(), this.specs.forEach((e, t) => e.hidden && this.hiddenKeys.add(this.keyOf(e, t))), this.applyLook(), this.bind(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(this.plotEl), this.measure(), this.rebuild(!0);
	}
	setData(e, t = !0) {
		this.opts = Array.isArray(e) ? {
			...this.opts,
			trees: e
		} : {
			...this.opts,
			data: e,
			trees: void 0
		}, this.specs = this.specList(), this.rebuild(t);
	}
	setOptions(e, t = !0) {
		this.opts = {
			...this.opts,
			...e
		}, this.specs = this.specList(), this.applyLook(), this.rebuild(t);
	}
	setCollapsed(e, t, n = 0) {
		let r = this.find(e, n);
		r && r.children.length && r.collapsed !== t && (r.collapsed = t, this.emit("collapse", {
			node: r.src,
			collapsed: t
		}), this.relayout(!0));
	}
	expandAll(e = Infinity) {
		for (let t of this.trees) for (let n of t.nodes) n.children.length && (n.collapsed = n.depth >= e);
		this.relayout(!0);
	}
	collapseAll(e = 1) {
		this.expandAll(e);
	}
	toggle(e, t) {
		let n = typeof e == "number" ? e : this.trees.findIndex((t) => t.key === e), r = this.trees[n];
		if (!r) return;
		let i = t ?? !this.hiddenKeys.has(r.key);
		i ? this.hiddenKeys.add(r.key) : this.hiddenKeys.delete(r.key), this.emit("toggle", {
			id: r.key,
			index: n,
			hidden: i
		}), this.renderLegend(), this.draw();
	}
	resetView() {
		this.view = {
			k: 1,
			x: 0,
			y: 0
		}, this.draw();
	}
	on(e, t) {
		this.handlers.has(e) || this.handlers.set(e, /* @__PURE__ */ new Set());
		let n = t;
		return this.handlers.get(e).add(n), () => this.handlers.get(e)?.delete(n);
	}
	resize() {
		this.measure(), this.relayout(!1);
	}
	screenshot() {
		return this.draw(), this.canvas.toDataURL("image/png");
	}
	destroy() {
		this.destroyed = !0, cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("tr-root"), this.titleEl.remove(), this.bodyEl.remove();
	}
	keyOf(e, t) {
		return e.name ?? `#${t}`;
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t));
	}
	specList() {
		let { trees: e, data: t, colors: n, legend: r, tooltip: i, emphasis: a, roam: o, title: s, background: c, theme: l, animation: u, ...d } = this.opts;
		return e?.length ? e.map((e) => ({
			...d,
			...e
		})) : t ? [{
			...d,
			data: t
		}] : [];
	}
	find(e, t) {
		let n = this.trees[t];
		if (!n) return;
		if (!Array.isArray(e)) return n.nodes.find((t) => t.src === e);
		let r = n.root;
		if (r.src.name === e[0]) {
			for (let t of e.slice(1)) r = r?.children.find((e) => e.src.name === t);
			return r;
		}
	}
	applyLook() {
		let e = this.opts, t = {
			...e.theme === "light" ? s : o,
			...typeof e.theme == "object" ? e.theme : {}
		};
		e.background && (t.background = e.background), t.background === "transparent" && !(typeof e.theme == "object" && e.theme.symbolFill) && (t.symbolFill = "rgba(255, 255, 255, 0.9)"), this.theme = t;
		let n = {
			"--tr-bg": t.background,
			"--tr-text": t.text,
			"--tr-muted": t.muted,
			"--tr-tt-bg": t.tooltipBg,
			"--tr-tt-text": t.tooltipText,
			"--tr-tt-border": t.tooltipBorder,
			"--tr-font": t.font
		};
		for (let [e, t] of Object.entries(n)) this.root.style.setProperty(e, t);
		let r = typeof e.title == "string" ? { text: e.title } : e.title;
		this.titleEl.style.display = r ? "" : "none", r && (this.titleEl.style.textAlign = r.align ?? "center", this.titleEl.innerHTML = `<b>${l(r.text)}</b>${r.subtext ? `<small>${l(r.subtext)}</small>` : ""}`);
	}
	rebuild(e) {
		let t = this.opts.colors ?? c, n = /* @__PURE__ */ new Map();
		for (let e of this.trees) for (let t of e.nodes) n.set(`${e.index}\u0001${t.key}`, t);
		this.trees = this.specs.map((e, r) => {
			let i = [], a = e.initialDepth ?? Infinity, o = {
				spec: e,
				index: r,
				key: this.keyOf(e, r),
				color: e.color ?? t[r % t.length],
				nodes: i,
				cx: 0,
				cy: 0
			}, s = (e, t, c, l) => {
				let u = n.get(`${r}\u0001${c}`), d = e.children ?? [], f = {
					src: e,
					key: c,
					tree: o,
					parent: t,
					children: [],
					depth: l,
					collapsed: d.length ? u ? u.collapsed : e.collapsed ?? l >= a : !1,
					visible: !1,
					fx: u?.x ?? 0,
					fy: u?.y ?? 0,
					fa: u?.a ?? 0,
					tx: 0,
					ty: 0,
					ta: 0,
					x: u?.x ?? 0,
					y: u?.y ?? 0,
					a: u?.a ?? 0,
					placed: u?.placed ?? !1
				};
				i.push(f);
				let p = /* @__PURE__ */ new Map();
				return f.children = d.map((e) => {
					let t = p.get(e.name) ?? 0;
					return p.set(e.name, t + 1), s(e, f, `${c}\u0002${e.name}${t ? `#${t}` : ""}`, l + 1);
				}), f;
			};
			return o.root = s(e.data, null, e.data.name, 0), o;
		}), this.hover && !this.trees.some((e) => e.nodes.includes(this.hover)) && (this.hover = null), this.renderLegend(), this.relayout(e);
	}
	duration() {
		let e = this.opts.animation ?? !0;
		return e === !1 ? 0 : typeof e == "object" ? e.duration ?? 600 : 600;
	}
	loop() {
		if (cancelAnimationFrame(this.raf), this.destroyed) return;
		let e = performance.now(), t = this.animStart ? d(u((e - this.animStart) / (this.duration() || 1), 0, 1)) : 1;
		for (let e of this.trees) for (let n of e.nodes) n.x = n.fx + (n.tx - n.fx) * t, n.y = n.fy + (n.ty - n.fy) * t, n.a = n.fa + (n.ta - n.fa) * t;
		this.draw(), t < 1 ? this.raf = requestAnimationFrame(() => this.loop()) : this.animStart = 0;
	}
	legendCfg() {
		let e = this.opts.legend, t = typeof e == "object" ? e : {};
		return {
			show: (typeof e == "boolean" ? e : t.show) ?? this.trees.length > 1,
			position: t.position ?? "top",
			interactive: t.interactive ?? !0
		};
	}
	renderLegend() {
		let e = this.legendCfg();
		this.bodyEl.className = `tr-body tr-legend-${e.position}`, this.legendEl.className = "tr-legend", this.legendEl.style.display = e.show ? "" : "none", e.show && (this.legendEl.innerHTML = this.trees.map((t) => {
			let n = this.hiddenKeys.has(t.key), r = t.spec.name ?? t.root.src.name;
			return `<li class="tr-legend__item${e.interactive ? " is-interactive" : ""}${n ? " is-hidden" : ""}" data-key="${l(t.key)}"><i class="tr-legend__marker" style="--c:${t.color}"></i><span>${l(r)}</span></li>`;
		}).join(""));
	}
	measure() {
		let e = this.plotEl.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height)), this.canvas.width = Math.round(this.width * this.dpr), this.canvas.height = Math.round(this.height * this.dpr), this.canvas.style.width = `${this.width}px`, this.canvas.style.height = `${this.height}px`;
	}
	font(e, t = 400) {
		return `${t} ${e}px ${this.theme.font}`;
	}
	labelOf(e) {
		let t = e.tree.spec;
		return {
			...t.label,
			...e.children.length ? {} : t.leaves?.label,
			...e.src.label
		};
	}
	labelText(e, t) {
		return t.show === !1 ? "" : t.format ? t.format(e.src) : e.src.name;
	}
	labelWidth(e) {
		let t = this.labelOf(e), n = this.labelText(e, t);
		return n ? (this.ctx.font = this.font(t.fontSize ?? 12, t.fontWeight ?? 400), this.ctx.measureText(n).width + (t.distance ?? 6) + (t.background ? 8 : 0)) : 0;
	}
	symbolSize(e) {
		return e.src.symbolSize ?? e.tree.spec.symbolSize ?? 7;
	}
	relayout(e) {
		let i = this.width, a = this.height, o = (e, t, n) => e === void 0 ? n : typeof e == "number" ? e : e.trim().endsWith("%") ? t * parseFloat(e) / 100 : parseFloat(e) || 0;
		for (let s of this.trees) {
			let c = s.spec;
			for (let e of s.nodes) e.visible = !1;
			let l = [], u = (e) => {
				e.visible = !0, l.push(e), e.collapsed || e.children.forEach(u);
			};
			u(s.root);
			let d = c.layout === "radial", f = /* @__PURE__ */ new Map();
			for (let e of l) f.set(e, {
				n: e,
				children: []
			});
			for (let e of l) e.parent && f.get(e.parent).children.push(f.get(e));
			let p = r(f.get(s.root), d ? n : t), m = 0, h = 0;
			for (let e of p.values()) m = Math.max(m, e.x), h = Math.max(h, e.depth);
			let g = Math.max(0, ...l.filter((e) => e.depth === h && (d || !e.children.length)).map((e) => this.labelWidth(e))), _ = this.labelWidth(s.root) + this.symbolSize(s.root) / 2, v = Math.max(...l.map((e) => this.symbolSize(e))) / 2 + 2, y = c.orient ?? "LR", b = y === "TB" || y === "BT", x = this.labelRotation(c, b) !== 0, S = c.label?.fontSize ?? 12, C, w, T, E;
			if (d) C = w = T = E = Math.min(g + v, Math.min(i, a) * .25);
			else if (b) {
				let e = x ? Math.min(_ + v, a * .35) : S + v + 6, t = x ? Math.min(g + v, a * .35) : S + v + 6;
				T = y === "TB" ? e : t, E = y === "TB" ? t : e, C = w = x ? S / 2 + v : Math.min(_, i * .2);
			} else {
				let e = Math.min(_ + v, i * .35), t = Math.min(g + v, i * .35);
				C = y === "LR" ? e : t, w = y === "LR" ? t : e, T = E = S / 2 + v;
			}
			let D = o(c.left, i, 10) + C, O = o(c.top, a, 10) + T, k = i - o(c.right, i, 10) - w, A = a - o(c.bottom, a, 10) - E, j = Math.max(1, k - D), M = Math.max(1, A - O);
			s.cx = D + j / 2, s.cy = O + M / 2;
			let N = Math.max(10, Math.min(j, M) / 2);
			for (let [e, t] of p) {
				let n = e.n, r = m ? t.x / m : .5, i = h ? t.depth / h : 0;
				if (d) {
					let e = m ? t.x / (m + 1) * Math.PI * 2 - Math.PI / 2 : -Math.PI / 2;
					n.tx = s.cx + Math.cos(e) * i * N, n.ty = s.cy + Math.sin(e) * i * N;
				} else y === "LR" || y === "RL" ? (n.tx = y === "LR" ? D + i * j : k - i * j, n.ty = O + r * M) : (n.tx = D + r * j, n.ty = y === "TB" ? O + i * M : A - i * M);
			}
			for (let t of s.nodes) {
				let n = t;
				for (; !n.visible;) n = n.parent;
				if (t.visible || (t.tx = n.tx, t.ty = n.ty), t.ta = +!!t.visible, !t.placed && t.visible) {
					let n = t.parent;
					for (; n && !n.placed;) n = n.parent;
					t.x = n ? n.x : t.tx, t.y = n ? n.y : t.ty, t.a = n ? 0 : +!e, t.placed = !0;
				}
				!t.placed && !t.visible && (t.x = t.tx, t.y = t.ty, t.a = 0);
			}
		}
		let s = e && this.duration() > 0;
		for (let e of this.trees) for (let t of e.nodes) s || (t.x = t.tx, t.y = t.ty, t.a = t.ta), t.fx = t.x, t.fy = t.y, t.fa = t.a, !t.visible && t.a === 0 && (t.placed = !1);
		this.animStart = s ? performance.now() : 0, this.loop();
	}
	labelRotation(e, t) {
		let n = e.label?.rotate ?? "auto";
		return n === "auto" ? t ? Math.PI / 2 : 0 : n * Math.PI / 180;
	}
	sx(e) {
		return e * this.view.k + this.view.x;
	}
	sy(e) {
		return e * this.view.k + this.view.y;
	}
	lit() {
		let e = this.hover, t = this.opts.emphasis ?? "ancestor";
		if (!e || t === "none") return null;
		let n = /* @__PURE__ */ new Set();
		if (t === "ancestor") for (let t = e; t; t = t.parent) n.add(t);
		else {
			let t = [e];
			for (; t.length;) {
				let e = t.pop();
				n.add(e), e.collapsed || t.push(...e.children);
			}
		}
		return n;
	}
	draw() {
		let e = this.ctx, t = this.theme;
		e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.clearRect(0, 0, this.width, this.height), t.background !== "transparent" && (e.fillStyle = t.background, e.fillRect(0, 0, this.width, this.height));
		let n = this.lit();
		for (let e of this.trees) {
			if (this.hiddenKeys.has(e.key)) continue;
			let t = e.nodes.filter((e) => e.a > .002);
			for (let e of t) e.parent && this.drawEdge(e, n);
			for (let e of t) this.drawSymbol(e, n);
			this.drawLabels(e, t, n);
		}
	}
	drawEdge(e, t) {
		let n = this.ctx, r = e.tree.spec, i = r.edge ?? {}, a = e.parent, o = t?.has(e) && t.has(a);
		n.globalAlpha = e.a * (t && !o ? .25 : 1), n.strokeStyle = e.src.lineColor ?? i.color ?? this.theme.edge, n.lineWidth = (i.width ?? 1.5) + +!!o, n.setLineDash(i.dash ?? []);
		let s = this.sx(a.x), c = this.sy(a.y), l = this.sx(e.x), d = this.sy(e.y);
		if (n.beginPath(), n.moveTo(s, c), r.layout === "radial") {
			let t = this.sx(e.tree.cx), r = this.sy(e.tree.cy), i = Math.hypot(s - t, c - r), a = Math.hypot(l - t, d - r), o = Math.atan2(d - r, l - t), u = i < .5 ? o : Math.atan2(c - r, s - t), f = (i + a) / 2;
			n.bezierCurveTo(t + Math.cos(u) * f, r + Math.sin(u) * f, t + Math.cos(o) * f, r + Math.sin(o) * f, l, d);
		} else {
			let e = r.orient === "TB" || r.orient === "BT";
			if (r.edgeShape === "polyline") {
				if (e) {
					let e = (c + d) / 2;
					n.lineTo(s, e), n.lineTo(l, e);
				} else {
					let e = (s + l) / 2;
					n.lineTo(e, c), n.lineTo(e, d);
				}
				n.lineTo(l, d);
			} else {
				let t = u(i.curveness ?? .5, 0, 1);
				e ? n.bezierCurveTo(s, c + (d - c) * t, l, d - (d - c) * t, l, d) : n.bezierCurveTo(s + (l - s) * t, c, l - (l - s) * t, d, l, d);
			}
		}
		n.stroke(), n.setLineDash([]), n.globalAlpha = 1;
	}
	drawSymbol(e, t) {
		let n = e.src.symbol ?? e.tree.spec.symbol ?? "emptyCircle";
		if (n === "none") return;
		let r = this.ctx, i = e.src.color ?? e.tree.color, a = this.hover === e, o = this.symbolSize(e) / 2 + (a ? 1.5 : 0), s = this.sx(e.x), c = this.sy(e.y);
		r.globalAlpha = e.a * (t && !t.has(e) ? .3 : 1), r.beginPath(), n === "rect" ? r.rect(s - o, c - o, o * 2, o * 2) : n === "roundRect" ? r.roundRect(s - o, c - o, o * 2, o * 2, o * .4) : n === "diamond" ? (r.moveTo(s, c - o * 1.3), r.lineTo(s + o, c), r.lineTo(s, c + o * 1.3), r.lineTo(s - o, c), r.closePath()) : n === "triangle" ? (r.moveTo(s, c - o * 1.2), r.lineTo(s + o * 1.1, c + o * .8), r.lineTo(s - o * 1.1, c + o * .8), r.closePath()) : r.arc(s, c, o, 0, Math.PI * 2);
		let l = e.collapsed && e.children.length > 0;
		n === "emptyCircle" && !l ? (r.fillStyle = this.theme.symbolFill, r.fill(), r.strokeStyle = i, r.lineWidth = 1.5, r.stroke()) : (r.fillStyle = i, r.fill(), n !== "emptyCircle" && l && (r.strokeStyle = f(i, .45), r.lineWidth = 3, r.stroke())), r.globalAlpha = 1;
	}
	drawLabels(e, t, n) {
		let r = this.ctx, i = e.spec, a = i.layout === "radial", o = i.orient ?? "LR", s = o === "TB" || o === "BT", c = [];
		for (let n of t) {
			let t = this.labelOf(n), l = this.labelText(n, t);
			if (!l) continue;
			let u = t.fontSize ?? 12;
			r.font = this.font(u, t.fontWeight ?? 400);
			let d = r.measureText(l).width, f = (t.distance ?? 6) + this.symbolSize(n) / 2, p = this.sx(n.x), m = this.sy(n.y), h = !n.children.length, g, _, v;
			if (a && (t.position ?? "auto") === "auto" && n.depth > 0) {
				let r = Math.atan2(m - this.sy(e.cy), p - this.sx(e.cx)), i = h || n.collapsed ? 1 : -1;
				_ = Math.cos(r) * f * i, v = Math.sin(r) * f * i, g = typeof t.rotate == "number" ? t.rotate * Math.PI / 180 : Math.cos(r) < 0 ? r + Math.PI : r;
			} else {
				let e = t.position ?? "auto";
				e === "auto" && (e = a ? "left" : h ? {
					LR: "right",
					RL: "left",
					TB: "bottom",
					BT: "top"
				}[o] : {
					LR: "left",
					RL: "right",
					TB: "top",
					BT: "bottom"
				}[o]), _ = e === "left" ? -f : e === "right" ? f : 0, v = e === "top" ? -f : e === "bottom" ? f : 0, g = a ? 0 : t.rotate === void 0 || t.rotate === "auto" ? this.labelRotation(i, s) : t.rotate * Math.PI / 180;
			}
			let y = Math.cos(g), b = Math.sin(g), x = (_ * y + v * b) / (f || 1), S = (-_ * b + v * y) / (f || 1), C = x > .3 ? "left" : x < -.3 ? "right" : "center", w = Math.abs(x) > .3 ? "middle" : S > .3 ? "top" : S < -.3 ? "bottom" : "middle", T = C === "left" ? 0 : C === "right" ? -d : -d / 2, E = w === "top" ? 0 : w === "bottom" ? -u : -u / 2, D = [
				[T, E],
				[T + d, E],
				[T, E + u],
				[T + d, E + u]
			].map(([e, t]) => [p + _ + e * y - t * b, m + v + e * b + t * y]);
			c.push({
				n,
				text: l,
				x: p + _,
				y: m + v,
				rot: g,
				align: C,
				baseline: w,
				cfg: t,
				x0: Math.min(...D.map((e) => e[0])),
				y0: Math.min(...D.map((e) => e[1])),
				x1: Math.max(...D.map((e) => e[0])),
				y1: Math.max(...D.map((e) => e[1]))
			});
		}
		c.sort((e, t) => +!!n?.has(t.n) - !!n?.has(e.n) || e.n.depth - t.n.depth);
		let l = [];
		for (let e of c) if (a && e.n.depth > 0 && (!e.n.children.length || e.n.collapsed)) {
			let t = e.cfg.fontSize ?? 12;
			l.some((n) => n.n.depth === e.n.depth ? Math.hypot(n.x - e.x, n.y - e.y) < t * .95 : e.x0 < n.x1 - 1 && e.x1 > n.x0 + 1 && e.y0 < n.y1 - 1 && e.y1 > n.y0 + 1) || l.push(e);
		} else l.some((t) => e.x0 < t.x1 - 1 && e.x1 > t.x0 + 1 && e.y0 < t.y1 - 1 && e.y1 > t.y0 + 1) || l.push(e);
		for (let e of l) {
			let t = e.cfg.fontSize ?? 12;
			if (r.save(), r.globalAlpha = e.n.a * (n && !n.has(e.n) ? .35 : 1), r.translate(e.x, e.y), r.rotate(e.rot), r.font = this.font(t, this.hover === e.n ? 600 : e.cfg.fontWeight ?? 400), r.textAlign = e.align, r.textBaseline = e.baseline, e.cfg.background) {
				let n = r.measureText(e.text).width, i = e.align === "left" ? -4 : e.align === "right" ? -n - 4 : -n / 2 - 4, a = e.baseline === "top" ? -2 : e.baseline === "bottom" ? -t - 2 : -t / 2 - 2;
				r.fillStyle = e.cfg.background, r.beginPath(), r.roundRect(i, a, n + 8, t + 4, 3), r.fill();
			}
			r.fillStyle = e.cfg.color ?? this.theme.text, r.fillText(e.text, 0, 0), r.restore();
		}
	}
	info(e) {
		let t = [];
		for (let n = e; n; n = n.parent) t.unshift(n.src.name);
		return {
			node: e.src,
			name: e.src.name,
			value: e.src.value,
			path: t,
			depth: e.depth,
			treeIndex: e.tree.index,
			hasChildren: e.children.length > 0,
			collapsed: e.collapsed
		};
	}
	hitTest(e, t) {
		let n = null, r = Infinity;
		for (let i of this.trees) if (!this.hiddenKeys.has(i.key)) for (let a of i.nodes) {
			if (!a.visible) continue;
			let i = Math.max(8, this.symbolSize(a) / 2 + 4), o = Math.hypot(this.sx(a.x) - e, this.sy(a.y) - t);
			o <= i && o < r && (r = o, n = a);
		}
		return n;
	}
	bind() {
		let e = (e) => {
			let t = this.canvas.getBoundingClientRect();
			return {
				x: e.clientX - t.left,
				y: e.clientY - t.top
			};
		}, t = null;
		this.canvas.addEventListener("pointerdown", (n) => {
			if (!this.opts.roam) return;
			let r = e(n);
			t = {
				x: r.x,
				y: r.y,
				vx: this.view.x,
				vy: this.view.y,
				moved: !1
			}, this.canvas.setPointerCapture(n.pointerId);
		}), this.canvas.addEventListener("pointerup", () => {
			t?.moved && (this.canvas.style.cursor = ""), setTimeout(() => t = null, 0);
		}), this.canvas.addEventListener("pointermove", (n) => {
			let { x: r, y: i } = e(n);
			if (t && n.buttons && (Math.hypot(r - t.x, i - t.y) > 3 && (t.moved = !0), t.moved)) {
				this.view.x = t.vx + r - t.x, this.view.y = t.vy + i - t.y, this.canvas.style.cursor = "grabbing", this.tooltipEl.classList.remove("is-visible"), this.draw();
				return;
			}
			let a = this.hitTest(r, i);
			a !== this.hover && (this.hover = a, this.emit("hover", a ? this.info(a) : null), this.draw()), this.canvas.style.cursor = a ? "pointer" : this.opts.roam ? "grab" : "", this.showTooltip(n);
		}), this.canvas.addEventListener("pointerleave", () => {
			this.hover && (this.hover = null, this.emit("hover", null), this.draw()), this.tooltipEl.classList.remove("is-visible");
		}), this.canvas.addEventListener("click", (n) => {
			if (t?.moved) return;
			let { x: r, y: i } = e(n), a = this.hitTest(r, i);
			a && (this.emit("click", this.info(a)), a.children.length && (a.tree.spec.expandAndCollapse ?? !0) && (a.collapsed = !a.collapsed, this.emit("collapse", {
				node: a.src,
				collapsed: a.collapsed
			}), this.hover = null, this.tooltipEl.classList.remove("is-visible"), this.relayout(!0)));
		}), this.canvas.addEventListener("wheel", (t) => {
			if (!this.opts.roam) return;
			t.preventDefault();
			let { x: n, y: r } = e(t), i = u(this.view.k * Math.exp(-t.deltaY * .0015), .2, 8), a = i / this.view.k;
			this.view.x = n - (n - this.view.x) * a, this.view.y = r - (r - this.view.y) * a, this.view.k = i, this.draw();
		}, { passive: !1 }), this.legendEl.addEventListener("click", (e) => {
			let t = e.target.closest(".tr-legend__item");
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
			let e = i.path.length > 1 ? `<div class="tr-tooltip__sub">${i.path.slice(0, -1).map(l).join(" › ")}</div>` : "", t = i.value === void 0 ? "" : `<div class="tr-tooltip__row"><span>Valor</span><b>${l(typeof i.value == "number" ? i.value.toLocaleString("pt-PT") : i.value)}</b></div>`, a = r.children.length ? `<div class="tr-tooltip__row"><span>${r.children.length} ${r.children.length === 1 ? "filho" : "filhos"}</span><b>${r.collapsed ? "fechado" : "aberto"}</b></div>` : "";
			n.innerHTML = `${e}<div class="tr-tooltip__head"><i class="tr-tooltip__dot" style="background:${r.src.color ?? r.tree.color}"></i>${l(i.name)}</div>${t}${a}`;
		}
		n.classList.add("is-visible");
		let a = this.plotEl.getBoundingClientRect(), o = e.clientX - a.left, s = e.clientY - a.top, c = n.offsetWidth, d = n.offsetHeight, f = o + 14 + c > this.width ? o - 14 - c : o + 14, p = u(s + 14 + d > this.height ? s - 14 - d : s + 14, 0, Math.max(0, this.height - d));
		n.style.transform = `translate(${Math.max(0, f)}px, ${p}px)`;
	}
};
function m(e, t = {}) {
	return new p(e, t);
}
//#endregion
export { s as a, o as i, p as n, r as o, m as r, c as t };

//# sourceMappingURL=tree.js.map