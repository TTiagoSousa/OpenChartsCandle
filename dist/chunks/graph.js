import { n as e, t } from "./format.js";
//#region src/graph/layout.ts
var n = {
	repulsion: 60,
	gravity: .08,
	friction: .4,
	theta: .9,
	edgeStrength: 1,
	alphaMin: .001,
	alphaDecay: 1 - .001 ** (1 / 300),
	radius: null
};
function r(e) {
	return Object.fromEntries(Object.entries(e).filter(([, e]) => e !== void 0));
}
function i(e, t = 10) {
	let n = t * Math.sqrt(.5 + e), r = e * Math.PI * (3 - Math.sqrt(5));
	return {
		x: n * Math.cos(r),
		y: n * Math.sin(r)
	};
}
var a = class {
	constructor(e, t, r = {}) {
		this.nodes = e, this.alpha = 1, this.alphaTarget = 0, this.links = [], this.strength = [], this.bias = [], this.seed = 1, this.perm = /* @__PURE__ */ new Int32Array(), this.qStart = [], this.qEnd = [], this.qCx = [], this.qCy = [], this.qSize = [], this.qKids = [], this.qKidStart = [], this.qKidCount = [], this.p = {
			...n,
			...r
		}, this.setLinks(t);
	}
	setLinks(e) {
		let t = this.nodes.length;
		this.links = e.filter((e) => e.source !== e.target && e.source >= 0 && e.target >= 0 && e.source < t && e.target < t);
		let n = Array(t).fill(0);
		for (let e of this.links) n[e.source]++, n[e.target]++;
		this.strength = this.links.map((e) => this.p.edgeStrength / Math.min(n[e.source], n[e.target])), this.bias = this.links.map((e) => n[e.source] / (n[e.source] + n[e.target]));
	}
	get running() {
		return this.alpha >= this.p.alphaMin || this.alphaTarget > 0;
	}
	jiggle() {
		return this.seed = this.seed * 16807 % 2147483647, (this.seed / 2147483647 - .5) * .001;
	}
	tick() {
		let e = this.p;
		this.alpha += (this.alphaTarget - this.alpha) * e.alphaDecay;
		let t = this.alpha, n = this.nodes, r = n.length;
		if (!r) return;
		if (this.links.forEach((e, r) => {
			let i = n[e.source], a = n[e.target], o = a.x + a.vx - i.x - i.vx || this.jiggle(), s = a.y + a.vy - i.y - i.vy || this.jiggle(), c = Math.sqrt(o * o + s * s);
			c = (c - e.distance) / c * t * this.strength[r], o *= c, s *= c;
			let l = this.bias[r];
			a.vx -= o * l, a.vy -= s * l, i.vx += o * (1 - l), i.vy += s * (1 - l);
		}), e.repulsion > 0 && r > 1) {
			this.buildTree();
			let i = e.theta * e.theta, a = -e.repulsion * t, o = [];
			for (let e = 0; e < r; e++) {
				let t = n[e], r = 0, s = 0;
				for (o.length = 0, o.push(0); o.length;) {
					let c = o.pop(), l = this.qKidCount[c], u = this.qCx[c] - t.x, d = this.qCy[c] - t.y, f = u * u + d * d, p = this.qEnd[c] - this.qStart[c];
					if (l && this.qSize[c] * this.qSize[c] / i < f) f < 1 && (f = Math.sqrt(f) || 1), r += u * a * p / f, s += d * a * p / f;
					else if (l) for (let e = 0; e < l; e++) o.push(this.qKids[this.qKidStart[c] + e]);
					else for (let i = this.qStart[c]; i < this.qEnd[c]; i++) {
						let o = this.perm[i];
						if (o === e) continue;
						let c = n[o];
						u = c.x - t.x, d = c.y - t.y, u ||= this.jiggle(), d ||= this.jiggle(), f = u * u + d * d, f < 1 && (f = Math.sqrt(f)), r += u * a / f, s += d * a / f;
					}
				}
				t.vx += r, t.vy += s;
			}
		}
		if (e.gravity > 0) for (let r of n) r.vx -= r.x * e.gravity * t, r.vy -= r.y * e.gravity * t;
		e.radius && this.collide(e.radius);
		let i = 1 - e.friction;
		for (let e of n) e.fx !== null && e.fy !== null ? (e.x = e.fx, e.y = e.fy, e.vx = e.vy = 0) : (e.vx *= i, e.vy *= i, e.x += e.vx, e.y += e.vy);
	}
	run(e = 300) {
		for (let t = 0; t < e && this.alpha >= this.p.alphaMin; t++) this.tick();
	}
	collide(e) {
		let t = this.nodes, n = 0;
		for (let t of e) n = Math.max(n, t);
		if (!(n > 0)) return;
		let r = n * 2, i = /* @__PURE__ */ new Map();
		t.forEach((e, t) => {
			let n = `${Math.floor((e.x + e.vx) / r)},${Math.floor((e.y + e.vy) / r)}`, a = i.get(n);
			a ? a.push(t) : i.set(n, [t]);
		}), t.forEach((n, a) => {
			let o = n.x + n.vx, s = n.y + n.vy, c = Math.floor(o / r), l = Math.floor(s / r);
			for (let r = c - 1; r <= c + 1; r++) for (let c = l - 1; c <= l + 1; c++) {
				let l = i.get(`${r},${c}`);
				if (l) for (let r of l) {
					if (r <= a) continue;
					let i = t[r], c = o - (i.x + i.vx), l = s - (i.y + i.vy), u = (e[a] ?? 0) + (e[r] ?? 0), d = c * c + l * l;
					if (d >= u * u) continue;
					c ||= this.jiggle(), l ||= this.jiggle(), d = c * c + l * l;
					let f = Math.sqrt(d), p = (u - f) / f * .5;
					c *= p, l *= p, n.vx += c, n.vy += l, i.vx -= c, i.vy -= l;
				}
			}
		});
	}
	buildTree() {
		let e = this.nodes, t = e.length;
		this.perm.length !== t && (this.perm = new Int32Array(t));
		for (let e = 0; e < t; e++) this.perm[e] = e;
		let n = Infinity, r = Infinity, i = -Infinity, a = -Infinity;
		for (let t of e) t.x < n && (n = t.x), t.y < r && (r = t.y), t.x > i && (i = t.x), t.y > a && (a = t.y);
		let o = Math.max(i - n, a - r, 1e-6);
		this.qStart.length = this.qEnd.length = this.qCx.length = this.qCy.length = this.qSize.length = 0, this.qKids.length = this.qKidStart.length = this.qKidCount.length = 0, this.cell(0, t, n, r, o, 0);
	}
	cell(e, t, n, r, i, a) {
		let o = this.nodes, s = this.perm, c = this.qStart.length, l = 0, u = 0;
		for (let n = e; n < t; n++) l += o[s[n]].x, u += o[s[n]].y;
		if (this.qStart.push(e), this.qEnd.push(t), this.qCx.push(l / (t - e)), this.qCy.push(u / (t - e)), this.qSize.push(i), this.qKidStart.push(0), this.qKidCount.push(0), t - e <= 1 || a > 24) return c;
		let d = i / 2, f = n + d, p = r + d, m = this.partition(e, t, (e) => o[e].x < f), h = this.partition(e, m, (e) => o[e].y < p), g = this.partition(m, t, (e) => o[e].y < p), _ = [];
		return h > e && _.push(this.cell(e, h, n, r, d, a + 1)), m > h && _.push(this.cell(h, m, n, p, d, a + 1)), g > m && _.push(this.cell(m, g, f, r, d, a + 1)), t > g && _.push(this.cell(g, t, f, p, d, a + 1)), this.qKidStart[c] = this.qKids.length, this.qKidCount[c] = _.length, this.qKids.push(..._), c;
	}
	partition(e, t, n) {
		let r = this.perm, i = e;
		for (let a = e; a < t; a++) if (n(r[a])) {
			let e = r[i];
			r[i] = r[a], r[a] = e, i++;
		}
		return i;
	}
};
function o(e, t) {
	if (typeof t == "number") return e.map(() => t);
	let [n, r] = t, i = e.filter((e) => e !== void 0 && isFinite(e)), a = Math.min(...i), o = Math.max(...i);
	return e.map((e) => e === void 0 || !isFinite(e) || !(o > a) ? (n + r) / 2 : r - (e - a) / (o - a) * (r - n));
}
function s(e, t, n = {}) {
	let s = /* @__PURE__ */ new Map();
	e.forEach((e, t) => e.id !== void 0 && s.set(e.id, t));
	let c = (e) => typeof e == "number" ? e : s.get(e) ?? -1, l = e.map((e, t) => {
		let n = i(t), r = e.x ?? n.x, a = e.y ?? n.y;
		return {
			x: r,
			y: a,
			vx: 0,
			vy: 0,
			fx: e.fixed ? r : null,
			fy: e.fixed ? a : null
		};
	}), u = o(t.map((e) => e.value), n.edgeLength ?? 40);
	return new a(l, t.map((e, t) => ({
		source: c(e.source),
		target: c(e.target),
		distance: u[t]
	})), r({
		repulsion: n.repulsion,
		gravity: n.gravity,
		friction: n.friction,
		theta: n.theta
	})).run(n.iterations ?? 300), l.map((e) => ({
		x: e.x,
		y: e.y
	}));
}
function c(e, t = {}) {
	let n = t.sort ?? "category", r = e.map((e, t) => t);
	if (n === "category") {
		let t = /* @__PURE__ */ new Map();
		e.forEach((e, n) => {
			let r = String(e.category ?? "");
			t.has(r) || t.set(r, n);
		}), r.sort((n, r) => t.get(String(e[n].category ?? "")) - t.get(String(e[r].category ?? "")) || n - r);
	} else n === "value" && r.sort((t, n) => (e[n].value ?? 0) - (e[t].value ?? 0) || t - n);
	let i = e.length, a = (t.startAngle ?? 90) * Math.PI / 180, o = t.clockwise === !1 ? 1 : -1, s = Array(i);
	return r.forEach((e, t) => {
		let n = a + o * t * Math.PI * 2 / Math.max(1, i);
		s[e] = {
			x: Math.cos(n),
			y: -Math.sin(n),
			angle: n
		};
	}), s;
}
function l(e, t, n = {}) {
	let [r, i, a, o] = e, s = Math.max(a - r, 1e-9), c = Math.max(o - i, 1e-9), l = t.w / s, u = t.h / c;
	if (n.aspect !== void 0 && (l = Math.min(l, t.h / (c * n.aspect)), u = l * n.aspect), n.maxScale !== void 0) {
		let e = Math.min(1, n.maxScale / l, n.maxScale / u);
		l *= e, u *= e;
	}
	let d = n.flipY ? -u : u;
	return {
		ax: l,
		bx: t.x + t.w / 2 - l * ((r + a) / 2),
		ay: d,
		by: t.y + t.h / 2 - d * ((i + o) / 2)
	};
}
function u(e, t = 64) {
	let n = /* @__PURE__ */ new Map(), r = [], i = (e, t) => e * 100003 + t;
	return e.forEach((a, o) => {
		let s = Math.floor(a.x / t), c = Math.floor((a.x + a.w) / t), l = Math.floor(a.y / t), u = Math.floor((a.y + a.h) / t);
		for (let t = s; t <= c; t++) for (let s = l; s <= u; s++) for (let c of n.get(i(t, s)) ?? []) {
			let t = e[c];
			if (a.x < t.x + t.w && t.x < a.x + a.w && a.y < t.y + t.h && t.y < a.y + a.h) {
				r[o] = !1;
				return;
			}
		}
		r[o] = !0;
		for (let e = s; e <= c; e++) for (let t = l; t <= u; t++) {
			let r = n.get(i(e, t));
			r ? r.push(o) : n.set(i(e, t), [o]);
		}
	}), r;
}
function d(e, t, n, r, i) {
	return {
		x: (e + n) / 2 - (r - t) * i,
		y: (t + r) / 2 + (n - e) * i
	};
}
function f(e, t, n, r, i, a, o) {
	let s = 1 - o;
	return {
		x: s * s * e + 2 * s * o * n + o * o * i,
		y: s * s * t + 2 * s * o * r + o * o * a
	};
}
function p(e, t, n, r, i, a) {
	let o = i - n, s = a - r, c = o * o + s * s, l = c ? Math.max(0, Math.min(1, ((e - n) * o + (t - r) * s) / c)) : 0;
	return Math.hypot(e - (n + l * o), t - (r + l * s));
}
function m(e, t, n, r, i, a, o, s) {
	let c = Infinity, l = {
		x: n,
		y: r
	};
	for (let u = 1; u <= 12; u++) {
		let d = f(n, r, i, a, o, s, u / 12);
		c = Math.min(c, p(e, t, l.x, l.y, d.x, d.y)), l = d;
	}
	return c;
}
function h(e, t) {
	if (!(e > 0) || !(t > e)) return [];
	let n = Math.floor(Math.log10(e)), r = Math.ceil(Math.log10(t)), i = r - n > 4 ? [1] : [
		1,
		2,
		5
	], a = [];
	for (let o = n; o <= r; o++) for (let n of i) {
		let r = +(n * 10 ** o).toPrecision(12);
		r >= e * (1 - 1e-9) && r <= t * (1 + 1e-9) && a.push(r);
	}
	return a;
}
function g(e, t, n, r) {
	if (e === void 0 || !isFinite(e) || !(n > t)) return (r[0] + r[1]) / 2;
	let i = Math.sqrt(Math.max(0, (e - t) / (n - t)));
	return r[0] + i * (r[1] - r[0]);
}
//#endregion
//#region src/graph/graph.ts
var _ = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", v = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	grid: "rgba(120, 123, 134, 0.18)",
	edge: "rgba(120, 123, 134, 0.45)",
	nodeBorder: "rgba(19, 23, 34, 0.85)",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: _
}, y = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	grid: "rgba(42, 46, 57, 0.1)",
	edge: "rgba(42, 46, 57, 0.28)",
	nodeBorder: "#ffffff",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: _
}, b = [
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
], x = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), S = (e, t, n) => Math.min(n, Math.max(t, e)), C = (e) => 1 - (1 - e) ** 3, w = class {
	constructor(e, t = {}) {
		this.data = { nodes: [] }, this.cats = [], this.hiddenCats = /* @__PURE__ */ new Set(), this.nodeList = [], this.linkList = [], this.byId = /* @__PURE__ */ new Map(), this.adj = [], this.sim = null, this.mode = "force", this.ax = null, this.ay = null, this.fit = null, this.zoom = 1, this.panX = 0, this.panY = 0, this.userMoved = !1, this.plot = {
			x: 0,
			y: 0,
			w: 1,
			h: 1
		}, this.hover = null, this.drag = null, this.suppressClick = !1, this.width = 0, this.height = 0, this.dpr = 1, this.animStart = 0, this.growUntil = 0, this.raf = 0, this.handlers = /* @__PURE__ */ new Map(), this.destroyed = !1, this.opts = { ...t }, this.root = e, e.classList.add("gr-root"), this.titleEl = document.createElement("div"), this.titleEl.className = "gr-title", this.bodyEl = document.createElement("div"), this.plotEl = document.createElement("div"), this.plotEl.className = "gr-plot", this.canvas = document.createElement("canvas"), this.canvas.className = "gr-canvas", this.canvas.setAttribute("role", "img"), this.ctx = this.canvas.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "gr-tooltip", this.legendEl = document.createElement("ul"), this.plotEl.append(this.canvas, this.tooltipEl), this.bodyEl.append(this.plotEl, this.legendEl), e.append(this.titleEl, this.bodyEl), this.data = {
			nodes: t.nodes ?? [],
			links: t.links ?? [],
			categories: t.categories ?? []
		}, this.applyLook(), this.bind(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(this.plotEl), this.measure(), this.rebuild(!0);
	}
	get nodes() {
		return this.nodeList.map((e) => ({
			...e.src,
			x: e.x,
			y: e.y
		}));
	}
	get links() {
		return this.linkList.map((e) => ({ ...e.src }));
	}
	setData(e, t = !0) {
		this.data = {
			nodes: e.nodes,
			links: e.links ?? [],
			categories: e.categories ?? this.data.categories
		}, this.rebuild(t);
	}
	setOptions(e, t = !0) {
		this.opts = {
			...this.opts,
			...e
		}, (e.nodes || e.links || e.categories) && (this.data = {
			nodes: e.nodes ?? this.data.nodes,
			links: e.links ?? this.data.links,
			categories: e.categories ?? this.data.categories
		}), this.applyLook(), this.rebuild(t);
	}
	toggle(e, t) {
		let n = t ?? !this.hiddenCats.has(e);
		n ? this.hiddenCats.add(e) : this.hiddenCats.delete(e), this.hover && !this.hoverVisible() && (this.hover = null), this.emit("toggle", {
			category: e,
			hidden: n
		}), this.renderLegend(), this.schedule();
	}
	resetView() {
		this.zoom = 1, this.panX = this.panY = 0, this.userMoved = !1, this.fit = this.fitTarget(), this.schedule();
	}
	reheat(e = .6) {
		this.sim && (this.sim.alpha = Math.max(this.sim.alpha, e), this.schedule());
	}
	nodePosition(e) {
		let t = this.byId.get(e);
		return t ? {
			x: this.fromAxis(this.ax, t.x),
			y: this.fromAxis(this.ay, t.y)
		} : null;
	}
	on(e, t) {
		this.handlers.has(e) || this.handlers.set(e, /* @__PURE__ */ new Set());
		let n = t;
		return this.handlers.get(e).add(n), () => this.handlers.get(e)?.delete(n);
	}
	resize() {
		this.measure(), this.layoutPlot(), this.fit = this.fitTarget(), this.draw();
	}
	screenshot() {
		return this.draw(), this.canvas.toDataURL("image/png");
	}
	destroy() {
		this.destroyed = !0, cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("gr-root"), this.titleEl.remove(), this.bodyEl.remove();
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t));
	}
	applyLook() {
		let e = this.opts, t = {
			...e.theme === "light" ? y : v,
			...typeof e.theme == "object" ? e.theme : {}
		};
		e.background && (t.background = e.background), this.theme = t;
		let n = {
			"--gr-bg": t.background,
			"--gr-text": t.text,
			"--gr-muted": t.muted,
			"--gr-tt-bg": t.tooltipBg,
			"--gr-tt-text": t.tooltipText,
			"--gr-tt-border": t.tooltipBorder,
			"--gr-font": t.font
		};
		for (let [e, t] of Object.entries(n)) this.root.style.setProperty(e, t);
		let r = typeof e.title == "string" ? { text: e.title } : e.title;
		this.titleEl.style.display = r ? "" : "none", r && (this.titleEl.style.textAlign = r.align ?? "center", this.titleEl.innerHTML = `<b>${x(r.text)}</b>${r.subtext ? `<small>${x(r.subtext)}</small>` : ""}`);
	}
	duration() {
		let e = this.opts.animation ?? !0;
		return e === !1 ? 0 : typeof e == "object" ? e.duration ?? 600 : 600;
	}
	toAxis(e, t) {
		return e?.log ? Math.log10(Math.max(t, 1e-12)) : t;
	}
	fromAxis(e, t) {
		return e?.log ? 10 ** t : t;
	}
	rebuild(e) {
		let t = this.opts, n = performance.now(), r = e && this.duration() > 0, i = t.colors ?? b, a = (this.data.categories ?? []).map((e, t) => {
			let n = typeof e == "string" ? { name: e } : e;
			return n.hidden && this.hiddenCats.add(n.name), {
				name: n.name,
				color: n.color ?? i[t % i.length],
				symbol: n.symbol
			};
		});
		for (let e of this.data.nodes) typeof e.category == "string" && !a.some((t) => t.name === e.category) && a.push({
			name: e.category,
			color: i[a.length % i.length]
		});
		this.cats = a;
		let o = new Map(this.nodeList.map((e) => [e.id, e])), s = this.nodeList.length > 0, l = new Set(this.linkList.map((e) => `${e.s.id}|${e.t.id}`)), u = t.axes, d = (e) => u ? {
			cfg: e ?? {},
			log: e?.type === "log",
			lo: 0,
			hi: 1
		} : null;
		this.ax = d(u?.x), this.ay = d(u?.y);
		let f = this.mode, p = this.data.nodes.length > 0 && this.data.nodes.every((e) => e.x !== void 0 && e.y !== void 0);
		this.mode = u ? "none" : t.layout ?? (p ? "none" : "force");
		let m = this.data.nodes.map((e) => e.value).filter((e) => e !== void 0 && isFinite(e)), h = Math.min(...m), _ = Math.max(...m), v = t.symbolSize ?? 10, y = (e) => e.size ?? (typeof v == "function" ? v(e) : Array.isArray(v) ? g(e.value, h, _, v) : v), x = /* @__PURE__ */ new Set();
		this.nodeList = [];
		for (let e of this.data.nodes) {
			if (x.has(e.id)) continue;
			x.add(e.id);
			let s = typeof e.category == "number" ? e.category < a.length ? e.category : -1 : typeof e.category == "string" ? a.findIndex((t) => t.name === e.category) : -1, c = o.get(e.id), l = {
				src: e,
				id: e.id,
				index: this.nodeList.length,
				name: e.name ?? e.id,
				cat: s,
				color: e.color ?? a[s]?.color ?? i[0],
				size: Math.max(0, y(e)),
				symbol: e.symbol ?? a[s]?.symbol ?? t.symbol ?? "circle",
				x: c?.x ?? NaN,
				y: c?.y ?? NaN,
				vx: c?.vx ?? 0,
				vy: c?.vy ?? 0,
				fx: null,
				fy: null,
				from: null,
				to: {
					x: 0,
					y: 0
				},
				angle: 0,
				born: c ? c.born : r ? n : 0,
				degree: 0,
				sx: c?.sx ?? 0,
				sy: c?.sy ?? 0,
				r: 0,
				grow: 1,
				visible: !0,
				lText: "",
				lFont: "",
				lW: 0
			};
			this.nodeList.push(l);
		}
		this.byId = new Map(this.nodeList.map((e) => [e.id, e]));
		let S = t.edge ?? {};
		this.linkList = [], this.adj = this.nodeList.map(() => []);
		for (let e of this.data.links ?? []) {
			let t = this.byId.get(e.source), n = this.byId.get(e.target);
			if (!t || !n) continue;
			let r = e.color ?? (S.color === "source" ? t.color : S.color === "target" ? n.color : S.color ?? this.theme.edge), i = {
				src: e,
				index: this.linkList.length,
				s: t,
				t: n,
				color: r,
				width: e.width ?? S.width ?? 1,
				curveness: e.curveness ?? S.curveness ?? 0
			};
			this.linkList.push(i), t !== n && (this.adj[t.index].push(i), this.adj[n.index].push(i));
		}
		for (let e of this.nodeList) e.degree = this.adj[e.index].length;
		if (this.mode === "force") this.placeForce(o, s, l);
		else {
			if (this.sim = null, this.mode === "circular") {
				let e = t.circular ?? {}, n = c(this.nodeList.map((e) => ({
					category: e.cat,
					value: e.src.value
				})), {
					sort: e.sort,
					startAngle: e.startAngle,
					clockwise: e.clockwise
				});
				this.nodeList.forEach((e, t) => {
					e.to = {
						x: n[t].x,
						y: n[t].y
					}, e.angle = n[t].angle;
				});
			} else for (let e of this.nodeList) e.to = {
				x: this.toAxis(this.ax, e.src.x ?? 0),
				y: this.toAxis(this.ay, e.src.y ?? 0)
			};
			for (let e of this.nodeList) {
				let t = o.get(e.id);
				e.from = t && r && isFinite(t.x) ? {
					x: t.x,
					y: t.y
				} : null, e.x = e.from?.x ?? e.to.x, e.y = e.from?.y ?? e.to.y;
			}
			if (!s || f !== this.mode) for (let e of this.nodeList) e.from = null;
		}
		this.growUntil = r ? n + this.duration() : 0, this.animStart = r ? n : 0, this.hover = null, this.renderLegend(), this.measure(), this.layoutAxes(), this.layoutPlot();
		let C = this.fitTarget();
		(!this.fit || this.mode !== "force" || !s) && (this.fit = C), this.schedule();
	}
	placeForce(e, t, n) {
		let s = this.opts.force ?? {}, c = this.nodeList.filter((t) => isFinite(e.get(t.id)?.x ?? NaN)).length, l = this.linkList.filter((e) => n.has(`${e.s.id}|${e.t.id}`)).length, u = t && c > this.nodeList.length / 2 && l >= this.linkList.length / 2;
		if (!u) for (let e of this.nodeList) e.x = e.y = NaN;
		this.nodeList.forEach((e, t) => {
			if (isFinite(e.x)) return;
			if (e.src.x !== void 0 && e.src.y !== void 0) {
				e.x = e.src.x, e.y = e.src.y;
				return;
			}
			let n = this.adj[t].map((t) => t.s === e ? t.t : t.s).find((e) => isFinite(e.x));
			if (n) {
				let r = t * 2.399963 % (Math.PI * 2);
				e.x = n.x + Math.cos(r) * 12, e.y = n.y + Math.sin(r) * 12;
			} else {
				let n = i(t, 12);
				e.x = n.x, e.y = n.y;
			}
		});
		for (let e of this.nodeList) e.fx = e.src.fixed ? e.x : null, e.fy = e.src.fixed ? e.y : null;
		let d = o(this.linkList.map((e) => e.src.value), s.edgeLength ?? 40), f = s.collide, p = this.sim?.alpha ?? 0;
		this.sim = new a(this.nodeList, this.linkList.map((e, t) => ({
			source: e.s.index,
			target: e.t.index,
			distance: d[t]
		})), r({
			repulsion: s.repulsion,
			gravity: s.gravity,
			friction: s.friction,
			theta: s.theta,
			edgeStrength: s.edgeStrength,
			alphaDecay: s.alphaDecay,
			radius: f ? this.nodeList.map((e) => e.size / 2 + (typeof f == "number" ? f : 2)) : void 0
		})), this.sim.alpha = u ? Math.max(p, .3) : 1;
		for (let e = 0; e < (s.warmup ?? 0); e++) this.sim.tick();
		s.layoutAnimation === !1 && this.sim.run(400);
	}
	hoverVisible() {
		let e = this.hover;
		return e ? e.type === "node" ? this.isVisible(e.n) : this.isVisible(e.l.s) && this.isVisible(e.l.t) : !1;
	}
	isVisible(e) {
		return e.cat < 0 || !this.hiddenCats.has(this.cats[e.cat].name);
	}
	legendCfg() {
		let e = this.opts.legend, t = typeof e == "object" ? e : {};
		return {
			show: ((typeof e == "boolean" ? e : t.show) ?? !0) && this.cats.length > 0,
			position: t.position ?? "bottom",
			interactive: t.interactive ?? !0
		};
	}
	renderLegend() {
		let e = this.legendCfg();
		this.bodyEl.className = `gr-body gr-legend-${e.position}`, this.legendEl.className = "gr-legend", this.legendEl.style.display = e.show ? "" : "none", e.show && (this.legendEl.innerHTML = this.cats.map((t) => {
			let n = this.hiddenCats.has(t.name);
			return `<li class="gr-legend__item${e.interactive ? " is-interactive" : ""}${n ? " is-hidden" : ""}" data-key="${x(t.name)}"><i class="gr-legend__marker" style="--c:${t.color}"></i><span>${x(t.name)}</span></li>`;
		}).join(""));
	}
	measure() {
		let e = this.plotEl.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1;
		let t = Math.max(1, Math.floor(e.width)), n = Math.max(1, Math.floor(e.height));
		(t !== this.width || n !== this.height || this.canvas.width !== Math.round(t * this.dpr)) && (this.width = t, this.height = n, this.canvas.width = Math.round(t * this.dpr), this.canvas.height = Math.round(n * this.dpr), this.canvas.style.width = `${t}px`, this.canvas.style.height = `${n}px`);
	}
	layoutAxes() {
		for (let [t, n] of [[this.ax, "x"], [this.ay, "y"]]) {
			if (!t) continue;
			let r = this.nodeList.map((e) => n === "x" ? e.to.x : e.to.y).filter((e) => isFinite(e)), i = r.length ? Math.min(...r) : 0, a = r.length ? Math.max(...r) : 1;
			if (t.log) i = t.cfg.min === void 0 ? Math.floor(i) : Math.log10(t.cfg.min), a = t.cfg.max === void 0 ? Math.ceil(a === i ? a + 1 : a) : Math.log10(t.cfg.max);
			else {
				let n = e(i, a, 5);
				i = t.cfg.min ?? n.min, a = t.cfg.max ?? n.max;
			}
			t.lo = i, t.hi = a === i ? i + 1 : a;
		}
	}
	axisShown(e) {
		return !!e && e.cfg.show !== !1;
	}
	axisLabel(e, n) {
		let r = +this.fromAxis(e, n).toPrecision(12);
		return e.cfg.format ? e.cfg.format(r) : t(r);
	}
	layoutPlot() {
		let e = this.opts.padding ?? 10, t = e, n = e, r = e, i = e;
		if (this.axisShown(this.ay)) {
			let e = this.ay;
			this.ctx.font = this.font(11);
			let i = this.ticks(e, e.lo, e.hi, 6), a = Math.max(0, ...i.map((t) => this.ctx.measureText(this.axisLabel(e, t)).width));
			t += a + 10, e.cfg.name && (r += 18), n += 8;
		}
		this.axisShown(this.ax) && (i += 22, this.ax.cfg.name && (i += 16), n += 8), this.plot = {
			x: t,
			y: r,
			w: Math.max(1, this.width - t - n),
			h: Math.max(1, this.height - r - i)
		};
	}
	ticks(t, n, r, i) {
		if (t.log) return h(10 ** n, 10 ** r).map((e) => Math.log10(e));
		let a = Math.min(n, r), o = Math.max(n, r);
		return e(a, o, i).ticks.filter((e) => e >= a - 1e-9 && e <= o + 1e-9);
	}
	maxRadius() {
		let e = 0;
		for (let t of this.nodeList) this.isVisible(t) && (e = Math.max(e, t.size / 2));
		return e;
	}
	fitTarget() {
		let e = this.opts, t = this.plot;
		if (this.ax && this.ay) return l([
			this.ax.lo,
			this.ay.lo,
			this.ax.hi,
			this.ay.hi
		], t, {
			flipY: !0,
			aspect: e.aspect
		});
		let n = (e) => {
			let n = Math.min(e, t.w / 3, t.h / 3);
			return {
				x: t.x + n,
				y: t.y + n,
				w: t.w - 2 * n,
				h: t.h - 2 * n
			};
		};
		if (this.mode === "circular") {
			let n = e.circular ?? {}, r = (n.radius ?? (n.rotateLabel ? 65 : 75)) / 100;
			return l([
				-1 / r,
				-1 / r,
				1 / r,
				1 / r
			], t, { aspect: 1 });
		}
		let r = this.nodeList.filter((e) => this.isVisible(e)), i = r.length ? r : this.nodeList, a = Infinity, o = Infinity, s = -Infinity, c = -Infinity;
		for (let e of i) {
			let t = this.mode === "force" ? e.x : e.to.x, n = this.mode === "force" ? e.y : e.to.y;
			isFinite(t) && isFinite(n) && (a = Math.min(a, t), o = Math.min(o, n), s = Math.max(s, t), c = Math.max(c, n));
		}
		isFinite(a) || ([a, o, s, c] = [
			-1,
			-1,
			1,
			1
		]), this.mode === "none" && e.extent && ([a, o, s, c] = e.extent), s - a < 1e-9 && ([a, s] = [a - 1, s + 1]), c - o < 1e-9 && ([o, c] = [o - 1, c + 1]);
		let u = e.extent && this.mode === "none" ? 0 : this.maxRadius() + 6;
		return l([
			a,
			o,
			s,
			c
		], n(u), {
			aspect: e.aspect ?? 1,
			maxScale: this.mode === "force" ? 1.6 : void 0
		});
	}
	easeFit() {
		let e = this.fitTarget(), t = this.fit;
		if (!t) return this.fit = e, !1;
		let n = Math.abs(e.ax) < Math.abs(t.ax) ? .3 : .12;
		return t.ax += (e.ax - t.ax) * n, t.ay += (e.ay - t.ay) * n, t.bx += (e.bx - t.bx) * n, t.by += (e.by - t.by) * n, Math.abs(e.ax - t.ax) / Math.abs(e.ax) > .002 || Math.abs(e.bx - t.bx) > .5 || Math.abs(e.by - t.by) > .5;
	}
	X(e) {
		let t = this.fit;
		return this.zoom * (t.ax * e + t.bx) + this.panX;
	}
	Y(e) {
		let t = this.fit;
		return this.zoom * (t.ay * e + t.by) + this.panY;
	}
	invX(e) {
		let t = this.fit;
		return ((e - this.panX) / this.zoom - t.bx) / t.ax;
	}
	invY(e) {
		let t = this.fit;
		return ((e - this.panY) / this.zoom - t.by) / t.ay;
	}
	nodeScale() {
		return this.zoom ** +(this.opts.nodeScaleRatio ?? .5);
	}
	schedule() {
		!this.raf && !this.destroyed && (this.raf = requestAnimationFrame(() => this.frame()));
	}
	frame() {
		if (this.raf = 0, this.destroyed) return;
		let e = performance.now(), t = !1;
		if (this.sim && this.sim.running && (this.sim.tick(), t = !0), this.mode === "force" && !this.userMoved && !this.drag && (t = this.easeFit() || t), this.animStart) {
			let n = C(S((e - this.animStart) / (this.duration() || 1), 0, 1));
			for (let e of this.nodeList) e.from && (e.x = e.from.x + (e.to.x - e.from.x) * n, e.y = e.from.y + (e.to.y - e.from.y) * n);
			if (n >= 1) {
				this.animStart = 0;
				for (let e of this.nodeList) e.from = null;
			} else t = !0;
		}
		if (this.growUntil && e < this.growUntil && (t = !0), this.draw(e), t) this.schedule();
		else if (this.growUntil) {
			this.growUntil = 0;
			for (let e of this.nodeList) e.born = 0;
			this.draw(e);
		}
	}
	font(e, t = 400) {
		return `${t} ${e}px ${this.theme.font}`;
	}
	api(e) {
		return {
			width: this.width,
			height: this.height,
			plot: { ...this.plot },
			theme: this.theme,
			toPixel: (e, t) => ({
				x: this.X(this.toAxis(this.ax, e)),
				y: this.Y(this.toAxis(this.ay, t))
			}),
			fromPixel: (e, t) => ({
				x: this.fromAxis(this.ax, this.invX(e)),
				y: this.fromAxis(this.ay, this.invY(t))
			}),
			nodePosition: (e) => {
				let t = this.byId.get(e);
				return t && this.isVisible(t) ? {
					x: this.X(t.x),
					y: this.Y(t.y),
					r: t.r
				} : null;
			},
			zoom: this.zoom,
			progress: this.growUntil ? C(S(1 - (this.growUntil - e) / (this.duration() || 1), 0, 1)) : 1,
			time: e
		};
	}
	draw(e = performance.now()) {
		let t = this.ctx, n = this.theme;
		this.fit ||= this.fitTarget(), t.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), t.clearRect(0, 0, this.width, this.height), n.background !== "transparent" && (t.fillStyle = n.background, t.fillRect(0, 0, this.width, this.height));
		let r = this.api(e), i = !!(this.ax && this.ay);
		i && this.drawGrid(), t.save(), i && (t.beginPath(), t.rect(this.plot.x, this.plot.y, this.plot.w, this.plot.h), t.clip()), this.opts.underlay && (t.save(), this.opts.underlay(t, r), t.restore());
		let a = this.nodeScale(), o = this.duration() || 1;
		for (let t of this.nodeList) t.visible = this.isVisible(t) && isFinite(t.x) && isFinite(t.y), t.sx = this.X(t.x), t.sy = this.Y(t.y), t.grow = t.born ? C(S((e - t.born) / o, 0, 1)) : 1, t.r = t.size / 2 * a * t.grow;
		let s = null, c = null, l = this.opts.focus ?? "adjacency", u = this.hover;
		if (u && l !== "none") {
			if (s = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Set(), u.type === "node") {
				if (s.add(u.n), l === "adjacency") for (let e of this.adj[u.n.index]) c.add(e), s.add(e.s), s.add(e.t);
			} else c.add(u.l), s.add(u.l.s), s.add(u.l.t);
		}
		this.drawEdges(c), this.drawNodes(s), this.drawLabels(s), this.drawEdgeLabels(c), t.restore(), i && this.drawAxisLabels(), this.opts.graphic && (t.save(), this.opts.graphic(t, r), t.restore());
	}
	drawGrid() {
		let e = this.ctx, t = this.plot;
		if (e.lineWidth = 1, e.strokeStyle = this.theme.grid, e.beginPath(), this.axisShown(this.ax) && this.ax.cfg.splitLine !== !1) for (let n of this.ticks(this.ax, this.invX(t.x), this.invX(t.x + t.w), Math.max(2, Math.floor(t.w / 90)))) {
			let r = Math.round(this.X(n)) + .5;
			e.moveTo(r, t.y), e.lineTo(r, t.y + t.h);
		}
		if (this.axisShown(this.ay) && this.ay.cfg.splitLine !== !1) for (let n of this.ticks(this.ay, this.invY(t.y + t.h), this.invY(t.y), Math.max(2, Math.floor(t.h / 60)))) {
			let r = Math.round(this.Y(n)) + .5;
			e.moveTo(t.x, r), e.lineTo(t.x + t.w, r);
		}
		e.stroke();
	}
	drawAxisLabels() {
		let e = this.ctx, t = this.plot, n = this.theme;
		if (e.font = this.font(11), e.fillStyle = n.muted, e.strokeStyle = n.muted, e.globalAlpha = 1, this.axisShown(this.ax)) {
			let r = this.ax;
			e.beginPath(), e.moveTo(t.x, Math.round(t.y + t.h) + .5), e.lineTo(t.x + t.w, Math.round(t.y + t.h) + .5), e.globalAlpha = .5, e.stroke(), e.globalAlpha = 1, e.textAlign = "center", e.textBaseline = "top";
			for (let n of this.ticks(r, this.invX(t.x), this.invX(t.x + t.w), Math.max(2, Math.floor(t.w / 90)))) e.fillText(this.axisLabel(r, n), this.X(n), t.y + t.h + 6);
			r.cfg.name && (e.textAlign = "right", e.fillStyle = n.text, e.fillText(r.cfg.name, t.x + t.w, t.y + t.h + 22), e.fillStyle = n.muted);
		}
		if (this.axisShown(this.ay)) {
			let r = this.ay;
			e.beginPath(), e.moveTo(Math.round(t.x) - .5, t.y), e.lineTo(Math.round(t.x) - .5, t.y + t.h), e.globalAlpha = .5, e.stroke(), e.globalAlpha = 1, e.textAlign = "right", e.textBaseline = "middle";
			for (let n of this.ticks(r, this.invY(t.y + t.h), this.invY(t.y), Math.max(2, Math.floor(t.h / 60)))) e.fillText(this.axisLabel(r, n), t.x - 6, this.Y(n));
			r.cfg.name && (e.textAlign = "left", e.textBaseline = "bottom", e.fillStyle = n.text, e.fillText(r.cfg.name, Math.max(2, t.x - 30), t.y - 6));
		}
	}
	edgeOpacity(e) {
		let t = this.opts.edge ?? {};
		return t.opacity ?? (!e.src.color && (t.color === "source" || t.color === "target") ? .5 : 1);
	}
	arrowMode() {
		let e = this.opts.edge?.arrow;
		return e === !0 || e === "end" ? "end" : e === "both" ? "both" : "none";
	}
	edgeGeom(e, t) {
		let n = e.s.sx, r = e.s.sy, i = e.t.sx, a = e.t.sy, o = e.curveness ? d(n, r, i, a, e.curveness) : null;
		if (t !== "none") {
			let s = (e, t, n, r, i) => {
				let a = Math.hypot(e - n, t - r) || 1;
				return [e - (e - n) / a * i, t - (t - r) / a * i];
			}, c = o ? o.x : n, l = o ? o.y : r;
			[i, a] = s(i, a, c, l, e.t.r + 2), t === "both" && ([n, r] = s(n, r, o ? o.x : e.t.sx, o ? o.y : e.t.sy, e.s.r + 2));
		}
		return {
			x1: n,
			y1: r,
			x2: i,
			y2: a,
			c: o
		};
	}
	drawEdges(e) {
		let t = this.ctx, n = this.opts.hoverDim ?? .12, r = this.arrowMode(), i = this.opts.edge?.arrowSize ?? 7, a = /* @__PURE__ */ new Map(), o = [];
		for (let t of this.linkList) t.s.visible && t.t.visible && (e && e.has(t) ? o.push(t) : this.addEdge(a, t, (e ? n : 1) * this.edgeOpacity(t), r, i));
		let s = () => {
			for (let e of a.values()) t.globalAlpha = e.alpha, t.strokeStyle = e.color, t.lineWidth = e.width, t.setLineDash(e.dash ?? []), t.stroke(e.path), e.heads && (t.fillStyle = e.color, t.fill(e.heads));
			t.setLineDash([]), a.clear();
		};
		s();
		for (let e of o) this.addEdge(a, e, Math.min(1, this.edgeOpacity(e) + .3), r, i, .5);
		s(), t.globalAlpha = 1;
	}
	addEdge(e, t, n, r, i, a = 0) {
		let o = n * Math.min(t.s.grow, t.t.grow);
		if (o < .01) return;
		let s = t.width + a, c = `${t.color}|${s}|${o.toFixed(2)}|${t.src.dash?.join(",") ?? ""}`, l = e.get(c);
		if (l || (l = {
			color: t.color,
			width: s,
			alpha: o,
			dash: t.src.dash,
			path: new Path2D(),
			heads: r === "none" ? null : new Path2D()
		}, e.set(c, l)), t.s === t.t) {
			let e = Math.max(6, t.s.r);
			l.path.moveTo(t.s.sx + e * .7, t.s.sy - e * .7), l.path.arc(t.s.sx, t.s.sy - e * 1.4, e * .75, .25 * Math.PI, 2.25 * Math.PI);
			return;
		}
		let u = this.edgeGeom(t, r);
		if (l.path.moveTo(u.x1, u.y1), u.c ? l.path.quadraticCurveTo(u.c.x, u.c.y, u.x2, u.y2) : l.path.lineTo(u.x2, u.y2), l.heads) {
			let e = i + s * .5, t = (t, n, r, i) => {
				let a = Math.hypot(t - r, n - i) || 1, o = (t - r) / a, s = (n - i) / a;
				l.heads.moveTo(t, n), l.heads.lineTo(t - o * e - s * e * .45, n - s * e + o * e * .45), l.heads.lineTo(t - o * e + s * e * .45, n - s * e - o * e * .45), l.heads.closePath();
			};
			t(u.x2, u.y2, u.c ? u.c.x : u.x1, u.c ? u.c.y : u.y1), r === "both" && t(u.x1, u.y1, u.c ? u.c.x : u.x2, u.c ? u.c.y : u.y2);
		}
	}
	addSymbol(e, t, n, r, i) {
		t === "rect" ? e.rect(n - i, r - i, i * 2, i * 2) : t === "roundRect" ? (e.moveTo(n + i, r), e.roundRect(n - i, r - i, i * 2, i * 2, i * .35)) : t === "diamond" ? (e.moveTo(n, r - i * 1.25), e.lineTo(n + i, r), e.lineTo(n, r + i * 1.25), e.lineTo(n - i, r), e.closePath()) : t === "triangle" ? (e.moveTo(n, r - i * 1.2), e.lineTo(n + i * 1.1, r + i * .8), e.lineTo(n - i * 1.1, r + i * .8), e.closePath()) : (e.moveTo(n + i, r), e.arc(n, r, i, 0, Math.PI * 2));
	}
	drawNodes(e) {
		let t = this.ctx, n = this.opts.nodeStyle ?? {}, r = n.borderWidth ?? 1, i = n.borderColor ?? this.theme.nodeBorder, a = n.opacity ?? 1, o = this.opts.hoverDim ?? .12, s = this.width, c = this.height;
		for (let n of [0, 1]) {
			let l = /* @__PURE__ */ new Map();
			for (let t of this.nodeList) {
				if (!t.visible || t.symbol === "none" || t.r <= .05) continue;
				let r = !e || e.has(t);
				if (n === 1 !== (!!e && r) || t.sx < -t.r || t.sy < -t.r || t.sx > s + t.r || t.sy > c + t.r) continue;
				let i = a * (r ? 1 : o), u = `${t.color}|${i}`, d = l.get(u);
				d || l.set(u, d = {
					color: t.color,
					alpha: i,
					path: new Path2D()
				});
				let f = this.hover?.type === "node" && this.hover.n === t ? t.r + 1.5 : t.r;
				this.addSymbol(d.path, t.symbol, t.sx, t.sy, f);
			}
			for (let e of l.values()) t.globalAlpha = e.alpha, t.fillStyle = e.color, t.fill(e.path), r > 0 && (t.lineWidth = r, t.strokeStyle = i, t.stroke(e.path));
		}
		t.globalAlpha = 1;
	}
	labelCfg(e) {
		let t = this.opts.label, n = typeof t == "object" ? t : { show: t === !0 }, r = e.src.label;
		return r === !1 ? null : r === !0 ? {
			...n,
			show: !0
		} : typeof r == "object" ? {
			...n,
			...r,
			show: r.show ?? !0
		} : n.show ? n : null;
	}
	drawLabels(e) {
		let t = this.ctx, n = this.theme, r = this.opts.label, i = typeof r == "object" && !!r.hideOverlap, a = this.mode === "circular" && !!this.opts.circular?.rotateLabel, o = this.hover?.type === "node" ? this.hover.n : null, s = this.opts.hoverDim ?? .12, c = [];
		for (let e of this.nodeList) {
			if (!e.visible || e.grow < .6) continue;
			let n = this.labelCfg(e);
			if (!n && e === o && (n = typeof r == "object" ? {
				...r,
				show: !0
			} : { show: !0 }), !n || e.sx < -200 || e.sy < -50 || e.sx > this.width + 200 || e.sy > this.height + 50) continue;
			let i = n.fontSize ?? 11, s = this.font(i, n.fontWeight ?? 400), l = n.format ? n.format(e.src) : e.name;
			if (!l) continue;
			(l !== e.lText || s !== e.lFont) && (t.font = s, e.lText = l, e.lFont = s, e.lW = t.measureText(l).width);
			let u = e.lW, d = i * 1.2, f = e.sx, p = e.sy, m = "left", h = 0, g;
			if (a) {
				let t = Math.cos(e.angle), n = -Math.sin(e.angle);
				f = e.sx + t * (e.r + 4), p = e.sy + n * (e.r + 4), h = Math.atan2(n, t), m = "left", t < 0 && (h += Math.PI, m = "right");
				let r = f + t * u, i = p + n * u;
				g = {
					x: Math.min(f, r) - d / 2,
					y: Math.min(p, i) - d / 2,
					w: Math.abs(r - f) + d,
					h: Math.abs(i - p) + d
				};
			} else {
				let t = n.position ?? "right";
				t === "right" ? f = e.sx + e.r + 4 : t === "left" ? (f = e.sx - e.r - 4, m = "right") : (m = "center", t === "top" ? p = e.sy - e.r - 4 - d / 2 : t === "bottom" && (p = e.sy + e.r + 4 + d / 2)), g = {
					x: m === "left" ? f : m === "right" ? f - u : f - u / 2,
					y: p - d / 2,
					w: u,
					h: d
				};
			}
			c.push({
				n: e,
				cfg: n,
				rect: g,
				x: f,
				y: p,
				align: m,
				rot: h,
				fs: i
			});
		}
		c.sort((t, n) => +(n.n === o) - (t.n === o) || +!!e?.has(n.n) - !!e?.has(t.n) || n.n.size - t.n.size);
		let l = i ? u(c.map((e) => e.rect)) : null;
		t.textBaseline = "middle", t.lineJoin = "round", c.forEach((r, i) => {
			if (l && !l[i] && r.n !== o) return;
			let a = r.cfg;
			t.globalAlpha = (e && !e.has(r.n) ? s : 1) * r.n.grow, t.font = r.n.lFont, t.textAlign = r.align;
			let c = (a.position ?? "right") === "inside" && !r.rot && this.mode !== "circular";
			t.save(), t.translate(r.x, r.y), r.rot && t.rotate(r.rot), (a.halo ?? !0) && !c && n.background !== "transparent" && (t.strokeStyle = n.background, t.lineWidth = 3, t.strokeText(r.n.lText, 0, 0)), t.fillStyle = a.color ?? (c ? "#ffffff" : n.text), t.fillText(r.n.lText, 0, 0), t.restore();
		}), t.globalAlpha = 1;
	}
	edgeLabelText(e) {
		let t = this.opts.edge?.label, n = typeof t == "object" ? t : { show: t === !0 }, r = e.src.label;
		return r === !1 ? null : typeof r == "string" ? r : r !== !0 && !n.show ? null : n.format ? n.format(e.src) : e.src.value === void 0 ? null : this.fmt(e.src.value);
	}
	drawEdgeLabels(e) {
		let t = this.ctx, n = this.theme, r = this.opts.edge?.label, i = typeof r == "object" ? r : {}, a = this.opts.hoverDim ?? .12, o = this.arrowMode();
		t.font = this.font(i.fontSize ?? 10), t.textAlign = "center", t.textBaseline = "middle", t.lineJoin = "round";
		for (let r of this.linkList) {
			if (!r.s.visible || !r.t.visible || r.s === r.t) continue;
			let s = this.edgeLabelText(r);
			if (!s) continue;
			let c = this.edgeGeom(r, o), l = c.c ? f(c.x1, c.y1, c.c.x, c.c.y, c.x2, c.y2, .5) : {
				x: (c.x1 + c.x2) / 2,
				y: (c.y1 + c.y2) / 2
			};
			t.globalAlpha = (e && !e.has(r) ? a : 1) * Math.min(r.s.grow, r.t.grow), n.background !== "transparent" && (t.strokeStyle = n.background, t.lineWidth = 3, t.strokeText(s, l.x, l.y)), t.fillStyle = i.color ?? n.muted, t.fillText(s, l.x, l.y);
		}
		t.globalAlpha = 1;
	}
	fmt(e) {
		return this.opts.valueFormatter ? this.opts.valueFormatter(e) : e.toLocaleString("pt-PT");
	}
	info(e) {
		if (e.type === "node") {
			let t = e.n;
			return {
				type: "node",
				index: t.index,
				name: t.name,
				value: t.src.value,
				color: t.color,
				node: t.src,
				category: this.cats[t.cat]?.name,
				degree: t.degree
			};
		}
		let t = e.l, n = this.arrowMode() === "none" ? " — " : " → ";
		return {
			type: "link",
			index: t.index,
			name: `${t.s.name}${n}${t.t.name}`,
			value: t.src.value,
			color: t.color,
			link: t.src,
			source: t.s.src,
			target: t.t.src
		};
	}
	hitTest(e, t) {
		let n = null, r = Infinity;
		for (let i of this.nodeList) {
			if (!i.visible) continue;
			let a = Math.max(i.r, 3) + 2, o = (i.sx - e) ** 2 + (i.sy - t) ** 2;
			o <= a * a && o < r && (r = o, n = i);
		}
		if (n) return {
			type: "node",
			n
		};
		let i = this.arrowMode(), a = null, o = Infinity;
		for (let n of this.linkList) {
			if (!n.s.visible || !n.t.visible || n.s === n.t) continue;
			let r = Math.max(4, n.width / 2 + 2);
			if (e < Math.min(n.s.sx, n.t.sx) - 60 || e > Math.max(n.s.sx, n.t.sx) + 60 || t < Math.min(n.s.sy, n.t.sy) - 60 || t > Math.max(n.s.sy, n.t.sy) + 60) continue;
			let s = this.edgeGeom(n, i), c = s.c ? m(e, t, s.x1, s.y1, s.c.x, s.c.y, s.x2, s.y2) : p(e, t, s.x1, s.y1, s.x2, s.y2);
			c <= r && c < o && (o = c, a = n);
		}
		return a ? {
			type: "link",
			l: a
		} : null;
	}
	sameHover(e, t) {
		return !e || !t ? e === t : e.type === "node" ? t.type === "node" && e.n === t.n : t.type === "link" && e.l === t.l;
	}
	roam(e) {
		let t = this.opts.roam ?? !0;
		return t === !0 || t === e;
	}
	draggable() {
		return this.opts.draggable ?? !this.opts.axes;
	}
	bind() {
		let e = this.canvas, t = (t) => {
			let n = e.getBoundingClientRect();
			return {
				x: t.clientX - n.left,
				y: t.clientY - n.top
			};
		};
		e.addEventListener("pointerdown", (n) => {
			if (n.button !== 0) return;
			let { x: r, y: i } = t(n), a = this.hitTest(r, i);
			if (a?.type === "node" && this.draggable()) this.drag = {
				mode: "node",
				x: r,
				y: i,
				moved: !1,
				node: a.n,
				px: 0,
				py: 0
			};
			else if (this.roam("move")) this.drag = {
				mode: "pan",
				x: r,
				y: i,
				moved: !1,
				px: this.panX,
				py: this.panY
			};
			else return;
			e.setPointerCapture(n.pointerId);
		}), e.addEventListener("pointermove", (n) => {
			let { x: r, y: i } = t(n), a = this.drag;
			if (a) {
				if (!a.moved && Math.hypot(r - a.x, i - a.y) < 3) return;
				if (a.moved || (a.moved = !0, this.tooltipEl.classList.remove("is-visible"), e.style.cursor = "grabbing", a.mode === "node" && this.sim && (this.sim.alphaTarget = .3)), a.mode === "pan") this.userMoved = !0, this.panX = a.px + (r - a.x), this.panY = a.py + (i - a.y);
				else {
					let e = a.node, t = this.invX(r), n = this.invY(i);
					this.sim ? (e.fx = t, e.fy = n) : (e.from = null, e.x = e.to.x = t, e.y = e.to.y = n);
				}
				this.schedule();
				return;
			}
			let o = this.hitTest(r, i);
			this.sameHover(o, this.hover) || (this.hover = o, this.emit("hover", o ? this.info(o) : null), this.schedule()), e.style.cursor = o ? o.type === "node" && this.draggable() ? "grab" : "pointer" : this.roam("move") ? "default" : "", this.showTooltip(n);
		});
		let n = () => {
			let t = this.drag;
			if (t) {
				if (this.drag = null, e.style.cursor = "", t.moved && (this.suppressClick = !0), t.mode === "node" && this.sim) {
					this.sim.alphaTarget = 0;
					let e = t.node;
					e.src.fixed ? (e.fx = e.x, e.fy = e.y) : e.fx = e.fy = null;
				}
				this.schedule();
			}
		};
		e.addEventListener("pointerup", n), e.addEventListener("pointercancel", n), e.addEventListener("pointerleave", () => {
			this.drag || (this.hover && (this.hover = null, this.emit("hover", null), this.schedule()), this.tooltipEl.classList.remove("is-visible"));
		}), e.addEventListener("click", (e) => {
			if (this.suppressClick) {
				this.suppressClick = !1;
				return;
			}
			let { x: n, y: r } = t(e), i = this.hitTest(n, r);
			i && this.emit("click", this.info(i));
		}), e.addEventListener("wheel", (e) => {
			if (!this.roam("zoom")) return;
			e.preventDefault();
			let { x: n, y: r } = t(e), [i, a] = this.opts.scaleLimit ?? [.2, 12], o = S(this.zoom * Math.exp(-e.deltaY * .0015), i, a), s = o / this.zoom;
			this.panX = n - (n - this.panX) * s, this.panY = r - (r - this.panY) * s, this.zoom = o, this.userMoved = !0, this.hover = null, this.tooltipEl.classList.remove("is-visible"), this.schedule();
		}, { passive: !1 }), e.addEventListener("dblclick", (e) => {
			let { x: n, y: r } = t(e);
			!this.hitTest(n, r) && (this.zoom !== 1 || this.panX || this.panY) && this.resetView();
		}), this.legendEl.addEventListener("click", (e) => {
			let t = e.target.closest(".gr-legend__item");
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
			let e = (e, t) => `<div class="gr-tooltip__row"><span>${x(e)}</span><b>${x(t)}</b></div>`, t = `<div class="gr-tooltip__head"><i class="gr-tooltip__dot" style="background:${i.color}"></i>${x(i.name)}</div>`;
			i.type === "node" ? (i.category && (t += `<div class="gr-tooltip__sub">${x(i.category)}</div>`), i.value !== void 0 && (t += e("Valor", this.fmt(i.value))), t += e("Ligações", String(i.degree ?? 0))) : i.value !== void 0 && (t += e("Valor", this.fmt(i.value))), n.innerHTML = t;
		}
		n.classList.add("is-visible");
		let a = this.plotEl.getBoundingClientRect(), o = e.clientX - a.left, s = e.clientY - a.top, c = n.offsetWidth, l = n.offsetHeight, u = o + 14 + c > this.width ? o - 14 - c : o + 14, d = S(s + 14 + l > this.height ? s - 14 - l : s + 14, 0, Math.max(0, this.height - l));
		n.style.transform = `translate(${Math.max(0, u)}px, ${d}px)`;
	}
};
function T(e, t = {}) {
	return new w(e, t);
}
//#endregion
export { y as a, u as c, v as i, w as n, c as o, T as r, s, b as t };

//# sourceMappingURL=graph.js.map