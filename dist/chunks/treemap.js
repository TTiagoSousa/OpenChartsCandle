import { t as e } from "./format.js";
import { a as t, n, o as r, r as i, t as a } from "./color.js";
//#region src/treemap/layout.ts
var o = (e, t, n, r) => {
	let i = e * e, a = r * r;
	return Math.max(a * n / i, i / (a * t));
};
function s(e, t) {
	let n = e.map(() => ({
		x: t.x,
		y: t.y,
		w: 0,
		h: 0
	})), r = e.map((e, t) => t).filter((t) => e[t] > 0), i = r.reduce((t, n) => t + e[n], 0);
	if (!(i > 0) || t.w <= 0 || t.h <= 0) return n;
	let a = t.w * t.h / i, s = e.map((e) => Math.max(0, e) * a), { x: c, y: l, w: u, h: d } = t, f = 0;
	for (; f < r.length;) {
		let e = Math.min(u, d), t = s[r[f]], i = t, a = t, p = o(t, i, a, e), m = f + 1;
		for (; m < r.length; m++) {
			let n = s[r[m]], c = o(t + n, Math.min(i, n), Math.max(a, n), e);
			if (c > p) break;
			t += n, i = Math.min(i, n), a = Math.max(a, n), p = c;
		}
		let h = m >= r.length;
		if (u >= d) {
			let e = h ? u : t / d, i = l;
			for (let t = f; t < m; t++) {
				let a = t === m - 1 ? l + d - i : s[r[t]] / e;
				n[r[t]] = {
					x: c,
					y: i,
					w: e,
					h: a
				}, i += a;
			}
			c += e, u -= e;
		} else {
			let e = h ? d : t / u, i = c;
			for (let t = f; t < m; t++) {
				let a = t === m - 1 ? c + u - i : s[r[t]] / e;
				n[r[t]] = {
					x: i,
					y: l,
					w: a,
					h: e
				}, i += a;
			}
			l += e, d -= e;
		}
		f = m;
	}
	return n;
}
function c(e, t) {
	let n = Math.min(t, e.w / 2), r = Math.min(t, e.h / 2);
	return {
		x: e.x + n,
		y: e.y + r,
		w: e.w - 2 * n,
		h: e.h - 2 * r
	};
}
//#endregion
//#region src/treemap/shape.ts
var l = (e, t, n) => e + (t - e) * n, u = 22, d = 8;
function f(e) {
	if (e.k === "p") return e.pts;
	let t = [], n = (e, n) => {
		for (let r = 0; r < e; r++) t.push(...n(r / e));
	};
	if (e.k === "r") n(u, (t) => [e.x + e.w * t, e.y]), n(d, (t) => [e.x + e.w, e.y + e.h * t]), n(u, (t) => [e.x + e.w * (1 - t), e.y + e.h]), n(d, (t) => [e.x, e.y + e.h * (1 - t)]);
	else {
		let t = (t, n) => [e.cx + t * Math.cos(n), e.cy + t * Math.sin(n)];
		n(u, (n) => t(e.r1, l(e.a0, e.a1, n))), n(d, (n) => t(l(e.r1, e.r0, n), e.a1)), n(u, (n) => t(e.r0, l(e.a1, e.a0, n))), n(d, (n) => t(l(e.r0, e.r1, n), e.a0));
	}
	return t;
}
function p(e, t, n) {
	if (n <= 0) return e;
	if (n >= 1) return t;
	if (e.k === "r" && t.k === "r") return {
		k: "r",
		x: l(e.x, t.x, n),
		y: l(e.y, t.y, n),
		w: l(e.w, t.w, n),
		h: l(e.h, t.h, n)
	};
	if (e.k === "s" && t.k === "s") return {
		k: "s",
		cx: l(e.cx, t.cx, n),
		cy: l(e.cy, t.cy, n),
		r0: l(e.r0, t.r0, n),
		r1: l(e.r1, t.r1, n),
		a0: l(e.a0, t.a0, n),
		a1: l(e.a1, t.a1, n)
	};
	let r = f(e), i = f(t);
	return {
		k: "p",
		pts: r.map((e, t) => l(e, i[t] ?? e, n))
	};
}
function m(e) {
	if (e.k === "r") return {
		k: "r",
		x: e.x + e.w / 2,
		y: e.y + e.h / 2,
		w: 0,
		h: 0
	};
	if (e.k === "s") {
		let t = (e.a0 + e.a1) / 2;
		return {
			...e,
			a0: t,
			a1: t,
			r1: e.r0 + (e.r1 - e.r0) * .5,
			r0: e.r0 + (e.r1 - e.r0) * .5
		};
	}
	let [t, n] = h(e);
	return {
		k: "p",
		pts: e.pts.map((e, r) => r % 2 ? n : t)
	};
}
function h(e) {
	if (e.k === "r") return [e.x + e.w / 2, e.y + e.h / 2];
	if (e.k === "s") {
		let t = (e.a0 + e.a1) / 2, n = e.a1 - e.a0 >= Math.PI * 1.99 && e.r0 === 0 ? 0 : (e.r0 + e.r1) / 2;
		return [e.cx + n * Math.cos(t), e.cy + n * Math.sin(t)];
	}
	let t = 0, n = 0, r = e.pts.length / 2;
	for (let r = 0; r < e.pts.length; r += 2) t += e.pts[r], n += e.pts[r + 1];
	return [t / r, n / r];
}
function g(e, t, n) {
	let r = t.w ? n.w / t.w : 1, i = t.h ? n.h / t.h : 1, a = (e) => n.x + (e - t.x) * r, o = (e) => n.y + (e - t.y) * i;
	if (e.k === "r") return {
		k: "r",
		x: a(e.x),
		y: o(e.y),
		w: e.w * r,
		h: e.h * i
	};
	if (e.k === "p") return {
		k: "p",
		pts: e.pts.map((e, t) => t % 2 ? o(e) : a(e))
	};
	let s = Math.sqrt(r * i);
	return {
		...e,
		cx: a(e.cx),
		cy: o(e.cy),
		r0: e.r0 * s,
		r1: e.r1 * s
	};
}
function _(e, t) {
	if (e.beginPath(), t.k === "r") e.rect(t.x, t.y, Math.max(0, t.w), Math.max(0, t.h));
	else if (t.k === "s") t.a1 - t.a0 >= Math.PI * 2 - 1e-6 ? (e.arc(t.cx, t.cy, t.r1, 0, Math.PI * 2), t.r0 > 0 && (e.moveTo(t.cx + t.r0, t.cy), e.arc(t.cx, t.cy, t.r0, 0, Math.PI * 2, !0))) : (e.arc(t.cx, t.cy, t.r1, t.a0, t.a1), t.r0 > 0 ? e.arc(t.cx, t.cy, t.r0, t.a1, t.a0, !0) : e.lineTo(t.cx, t.cy), e.closePath());
	else {
		e.moveTo(t.pts[0], t.pts[1]);
		for (let n = 2; n < t.pts.length; n += 2) e.lineTo(t.pts[n], t.pts[n + 1]);
		e.closePath();
	}
}
var v = Math.PI * 2;
function y(e, t, n) {
	if (e.k === "r") return t >= e.x && t <= e.x + e.w && n >= e.y && n <= e.y + e.h;
	if (e.k === "s") {
		let r = Math.hypot(t - e.cx, n - e.cy);
		return r < e.r0 || r > e.r1 ? !1 : e.a1 - e.a0 >= v - 1e-6 || ((Math.atan2(n - e.cy, t - e.cx) - e.a0) % v + v) % v <= e.a1 - e.a0;
	}
	return !1;
}
//#endregion
//#region src/treemap/sunburst.ts
var b = Math.PI * 2;
function x(e, t) {
	if (e == null) return;
	if (typeof e == "number") return Number.isFinite(e) ? e : void 0;
	let n = e.trim(), r = parseFloat(n);
	if (Number.isFinite(r)) return n.endsWith("%") ? t * r / 100 : r;
}
function S(e, t, n, r = []) {
	let i = [], a = t;
	for (let t = 0; t < e; t++) {
		let o = r[t] ?? {}, s = o.r0 ?? a, c = o.r;
		if (c === void 0) {
			let i = 1, a = n;
			for (let n = t + 1; n < e; n++) {
				let e = r[n] ?? {};
				if (e.r0 !== void 0) {
					a = e.r0;
					break;
				}
				if (i++, e.r !== void 0) {
					a = e.r;
					break;
				}
			}
			c = s + Math.max(0, a - s) / i;
		}
		i.push([s, Math.max(s, c)]), a = Math.max(s, c);
	}
	return i;
}
function C(e, t) {
	let n = e.a1 - e.a0;
	if (n >= b - 1e-6 || n <= 0) return [0, 0];
	let r = Math.max(0, (e.r1 - e.r0) / 2), i = Math.sin(Math.min(n, Math.PI) / 2), a = Math.min(t[1], r, e.r1 * i / (1 + i)), o = e.r0 > 0 ? Math.min(t[0], r, i < 1 ? e.r0 * i / (1 - i) : Infinity) : 0;
	return [Math.max(0, o), Math.max(0, a)];
}
function w(e, t, n) {
	let [r, i] = C(t, n), { cx: a, cy: o, r0: s, r1: c, a0: l, a1: u } = t, d = (e, t) => [a + e * Math.cos(t), o + e * Math.sin(t)];
	if (e.beginPath(), i > .3) {
		let t = Math.asin(i / (c - i)), [n, r] = d(c - i, l + t), [s, f] = d(c - i, u - t);
		e.arc(n, r, i, l - Math.PI / 2, l + t), e.arc(a, o, c, l + t, u - t), e.arc(s, f, i, u - t, u + Math.PI / 2);
	} else e.arc(a, o, c, l, u);
	if (s <= 0) e.lineTo(a, o);
	else if (r > .3) {
		let t = Math.asin(r / (s + r)), [n, i] = d(s + r, u - t), [c, f] = d(s + r, l + t);
		e.arc(n, i, r, u + Math.PI / 2, u - t + Math.PI), e.arc(a, o, s, u - t, l + t, !0), e.arc(c, f, r, l + t + Math.PI, l + Math.PI * 1.5);
	} else e.arc(a, o, s, u, l, !0);
	e.closePath();
}
function T(e, t) {
	let n = Math.max(0, e.r1 - e.r0), r = (e.r0 + e.r1) / 2, i = Math.max(0, Math.min(e.a1 - e.a0, Math.PI) * r), a = t - (e.a0 + e.a1) / 2, o = (e) => {
		let t = Math.abs(Math.cos(e)), r = Math.abs(Math.sin(e));
		return 1 / (t / Math.max(1e-6, n) + r / Math.max(1e-6, i));
	};
	return {
		along: o(a),
		across: o(a + Math.PI / 2)
	};
}
function E(e) {
	let t = (e % b + b) % b, n = t > Math.PI / 2 + 1e-9 && t < Math.PI * 3 / 2 - 1e-9;
	return {
		angle: n ? e + Math.PI : e,
		flipped: n
	};
}
//#endregion
//#region src/treemap/tree.ts
var D = (e) => e === void 0 ? [] : Array.isArray(e) ? e.map((e) => +e || 0) : [+e || 0];
function O(e, t = {}) {
	let n = t.sizeDimension ?? 0, r = t.sort ?? "desc", i = /* @__PURE__ */ new Map(), a = (e, t, o, s, c, l) => {
		let u = e?.id ?? o.join("/"), d = i.get(u) ?? 0;
		i.set(u, d + 1), d && (u += `#${d}`);
		let f = {
			id: u,
			name: t,
			path: o,
			depth: s,
			size: 0,
			values: [],
			children: [],
			parent: c,
			src: e,
			index: 0,
			height: 0,
			color: ""
		};
		for (let e of l) {
			let t = a(e, e.name, [...o, e.name], s + 1, f, e.children ?? []);
			t.size > 0 && f.children.push(t);
		}
		let p = D(e?.value);
		if (f.children.length) {
			f.size = f.children.reduce((e, t) => e + t.size, 0);
			let e = Math.max(p.length, ...f.children.map((e) => e.values.length));
			f.values = Array.from({ length: e }, (e, t) => p[t] ?? f.children.reduce((e, n) => e + (n.values[t] ?? 0), 0)), f.values[n] = f.size, r && f.children.sort((e, t) => r === "asc" ? e.size - t.size : t.size - e.size), f.children.forEach((e, t) => e.index = t), f.height = 1 + Math.max(...f.children.map((e) => e.height));
		} else f.values = p, f.size = Math.max(0, p[n] ?? 0);
		return f;
	};
	return a(null, t.rootName ?? "Total", [], -1, null, e);
}
function k(e, t) {
	for (let n of e.children) t(n), k(n, t);
}
function A(e, t) {
	if (e.id === t) return e;
	for (let n of e.children) {
		let e = A(n, t);
		if (e) return e;
	}
	return null;
}
function j(e, t) {
	for (let n = t; n; n = n.parent) if (n === e) return !0;
	return !1;
}
function M(e, t = "/") {
	let n = [];
	for (let r of e) {
		let e = (Array.isArray(r.path) ? r.path : r.path.split(t)).filter(Boolean), i = n;
		e.forEach((t, n) => {
			let a = i.find((e) => e.name === t);
			a || i.push(a = { name: t }), n === e.length - 1 ? a.value = r.value : i = a.children ??= [];
		});
	}
	return n;
}
function N(e, t = 0) {
	return O(e, {
		sizeDimension: t,
		sort: !1
	}).size;
}
//#endregion
//#region src/treemap/treemap.ts
var P = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", F = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	labelDark: "#131722",
	labelLight: "#ffffff",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: P
}, I = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	labelDark: "#131722",
	labelLight: "#ffffff",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: P
}, L = [
	"#2962ff",
	"#089981",
	"#ff9800",
	"#f23645",
	"#9c27b0",
	"#00bcd4",
	"#e91e63",
	"#8bc34a",
	"#ffc107",
	"#607d8b"
], R = [
	"#f23645",
	"#5d606b",
	"#089981"
], z = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), B = (e) => e < .5 ? 4 * e * e * e : 1 - (-2 * e + 2) ** 3 / 2, V = 28, H = 64, U = 34, W = class {
	constructor(e, t) {
		this.vmRange = [0, 1], this.hole = {
			cx: 0,
			cy: 0,
			r: 0
		}, this.items = [], this.tracks = null, this.animStart = 0, this.animDur = 0, this.raf = 0, this.hovered = null, this.width = 0, this.height = 0, this.dpr = 1, this.area = {
			x: 0,
			y: 0,
			w: 0,
			h: 0
		}, this.handlers = /* @__PURE__ */ new Map(), this.opts = { ...t }, this.root = e, e.classList.add("tm-root"), this.canvas = document.createElement("canvas"), this.canvas.className = "tm-canvas", this.canvas.setAttribute("role", "img"), this.ctx = this.canvas.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "tm-tooltip", this.crumbsEl = document.createElement("div"), this.crumbsEl.className = "tm-crumbs", this.vmEl = document.createElement("div"), this.vmEl.className = "tm-vmap", e.append(this.canvas, this.crumbsEl, this.vmEl, this.tooltipEl), this.applyLook(), this.rebuild(), this.bind(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(e), this.resize(!0);
	}
	get type() {
		return this.opts.type ?? "treemap";
	}
	get zoomed() {
		return this.zoom === this.tree ? null : this.info(this.zoom);
	}
	setData(e, t = !0) {
		this.opts.data = e, this.rebuild(), this.relayout(t);
	}
	setOptions(e, t = !0) {
		this.opts = {
			...this.opts,
			...e
		}, this.applyLook(), this.rebuild(), this.relayout(t);
	}
	setType(e, t = !0) {
		e !== this.type && (this.opts.type = e, this.relayout(t));
	}
	zoomTo(e, t = !0) {
		let n = e === null ? this.tree : A(this.tree, e);
		n && this.zoomNode(n.children.length ? n : n.parent ?? this.tree, t);
	}
	zoomOut(e = !0) {
		this.zoom.parent && this.zoomNode(this.zoom.parent, e);
	}
	node(e) {
		let t = A(this.tree, e);
		return t ? this.info(t) : null;
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
		cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("tm-root"), this.canvas.remove(), this.tooltipEl.remove(), this.crumbsEl.remove(), this.vmEl.remove();
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t));
	}
	applyLook() {
		let e = this.opts, t = e.theme === "light" ? I : F;
		this.theme = {
			...t,
			...typeof e.theme == "object" ? e.theme : {}
		}, e.background !== void 0 && (this.theme.background = e.background);
		let n = this.theme, r = {
			"--tm-bg": n.background,
			"--tm-text": n.text,
			"--tm-muted": n.muted,
			"--tm-tt-bg": n.tooltipBg,
			"--tm-tt-text": n.tooltipText,
			"--tm-tt-border": n.tooltipBorder,
			"--tm-font": n.font
		};
		for (let [e, t] of Object.entries(r)) this.root.style.setProperty(e, t);
	}
	level(e) {
		return this.opts.levels?.[e] ?? {};
	}
	rebuild() {
		let e = this.opts, t = this.zoom?.id;
		this.tree = O(e.data ?? [], {
			sizeDimension: e.sizeDimension,
			sort: e.sort,
			rootName: e.rootName
		}), this.colorize(), this.renderVisual(), this.zoom = t !== void 0 && A(this.tree, t) || this.tree, this.zoom.children.length || (this.zoom = this.tree), this.hovered = null;
	}
	colorize() {
		let e = this.opts.colors?.length ? this.opts.colors : L, t = this.opts.sizeDimension ?? 0, r = this.opts.visualMap?.colors.length ? this.opts.visualMap : null, i = r?.dimension ?? t;
		if (r) {
			let e = Infinity, t = -Infinity;
			k(this.tree, (n) => {
				let r = n.values[i];
				r !== void 0 && Number.isFinite(r) && (e = Math.min(e, r), t = Math.max(t, r));
			}), Number.isFinite(e) || ([e, t] = [0, 1]), this.vmRange = [r.min ?? e, r.max ?? t];
		}
		let o = (s) => {
			let c = s.children;
			if (!c.length) return;
			let l = this.level(c[0].depth), u = l.visualDimension ?? t, d = c.map((e) => e.values[u] ?? 0), f = l.visualMin ?? Math.min(...d), p = l.visualMax ?? Math.max(...d), m = l.colorMappingBy ?? (l.color ? "value" : "index");
			c.forEach((t, u) => {
				let h = m === "index" ? c.length > 1 ? u / (c.length - 1) : .5 : m === "id" ? [...t.id].reduce((e, t) => e * 31 + t.charCodeAt(0) >>> 0, 7) % 1e3 / 999 : p > f ? Math.min(1, Math.max(0, (d[u] - f) / (p - f))) : .5, g, _ = t.src?.itemStyle?.color ?? t.src?.color, [v, y] = this.vmRange;
				if (g = _ || (l.itemStyle?.color ? l.itemStyle.color : r ? n(r.colors, y > v ? ((t.values[i] ?? v) - v) / (y - v) : .5) : l.color?.length ? m === "index" ? l.color[u % l.color.length] : n(l.color, h) : t.depth === 0 ? e[u % e.length] : s.color), !_ && !r && (l.colorSaturation || l.colorLightness || l.colorAlpha)) {
					let e = (e) => e ? e[0] + (e[1] - e[0]) * h : void 0;
					g = a(g, e(l.colorSaturation), e(l.colorLightness), e(l.colorAlpha));
				}
				t.color = g, o(t);
			});
		};
		this.tree.color = this.theme.muted, o(this.tree);
	}
	info(e) {
		return {
			id: e.id,
			name: e.name,
			path: e.path,
			depth: e.depth,
			value: e.size,
			values: e.values,
			percent: e.parent && e.parent.size ? e.size / e.parent.size : 1,
			totalPercent: this.tree.size ? e.size / this.tree.size : 1,
			color: e.color,
			isLeaf: !e.children.length,
			node: e.src
		};
	}
	fmt(t, n = this.opts.sizeDimension ?? 0) {
		return this.opts.valueFormatter ? this.opts.valueFormatter(t, n) : Math.abs(t) >= 1e4 ? e(t, 1) : String(+t.toFixed(Math.abs(t) >= 100 ? 0 : 2));
	}
	labelFor(e) {
		let t = (e) => e === void 0 ? {} : e === !1 ? { show: !1 } : e === !0 ? { show: !0 } : e, n = {
			...t(this.opts.label),
			...t(this.level(e.depth).label),
			...t(e.src?.label)
		};
		return {
			...n,
			show: n.show !== !1
		};
	}
	styleFor(e) {
		return {
			...this.level(e.depth).itemStyle,
			...e.src?.itemStyle
		};
	}
	decorate(e, t) {
		let n = this.styleFor(e), r = n.borderRadius ?? t, i = this.theme.background;
		return {
			radius: r === void 0 ? void 0 : typeof r == "number" ? [r, r] : r,
			stroke: n.borderWidth ? [n.borderWidth, n.borderColor ?? (i === "transparent" ? this.theme.muted : i)] : void 0,
			opacity: n.opacity
		};
	}
	upperOpts(e) {
		let t = this.level(e).upperLabel ?? this.opts.upperLabel;
		return !t || typeof t == "object" && t.show === !1 ? null : {
			height: 20,
			...typeof t == "object" ? t : {}
		};
	}
	get showCrumbs() {
		return this.opts.breadcrumb !== !1 && this.opts.drilldown !== !1 && this.tree.height > 1;
	}
	resize(e = !1) {
		let t = this.root.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(t.width)), this.height = Math.max(1, Math.floor(t.height)), this.canvas.width = Math.round(this.width * this.dpr), this.canvas.height = Math.round(this.height * this.dpr), this.canvas.style.width = `${this.width}px`, this.canvas.style.height = `${this.height}px`, this.relayout(e);
	}
	computeArea() {
		let e = typeof this.opts.breadcrumb == "object" && this.opts.breadcrumb.position === "top", t = this.showCrumbs;
		this.crumbsEl.style.display = t ? "" : "none", this.crumbsEl.classList.toggle("tm-crumbs--top", e);
		let n = t ? V : 0;
		this.area = {
			x: 0,
			y: e ? n : 0,
			w: this.width,
			h: Math.max(0, this.height - n)
		};
		let r = this.vmShown();
		if (!r) return;
		let i = this.area;
		r === "bottom" ? (i.h = Math.max(0, i.h - U), this.vmEl.style.bottom = `${(e ? 0 : n) + 8}px`, this.vmEl.style.setProperty("--tm-vm-len", `${Math.round(Math.min(180, Math.max(50, i.w * .4)))}px`)) : (i.w = Math.max(0, i.w - H), r === "left" && (i.x += H), this.vmEl.style.top = `${i.y + i.h / 2}px`, this.vmEl.style.setProperty("--tm-vm-len", `${Math.round(Math.min(180, Math.max(40, i.h - 70)))}px`));
	}
	vmShown() {
		let e = this.opts.visualMap;
		return !e?.colors.length || e.show === !1 ? null : e.position ?? "left";
	}
	renderVisual() {
		let e = this.vmShown(), t = this.vmEl;
		if (t.style.display = e ? "" : "none", !e) return;
		let n = this.opts.visualMap, r = n.dimension ?? this.opts.sizeDimension ?? 0, [i, a] = this.vmRange, [o, s] = n.text ?? [this.fmt(a, r), this.fmt(i, r)], c = e !== "bottom";
		t.className = `tm-vmap tm-vmap--${e}`, t.style.top = t.style.bottom = "";
		let l = `<span class="tm-vmap__bar" style="background:linear-gradient(to ${c ? "top" : "right"},${n.colors.join(",")})"><i class="tm-vmap__mark"></i></span>`;
		t.innerHTML = c ? `<span>${z(o)}</span>${l}<span>${z(s)}</span>` : `<span>${z(s)}</span>${l}<span>${z(o)}</span>`;
	}
	markVisual(e) {
		let t = this.vmEl.querySelector(".tm-vmap__mark");
		if (!t) return;
		let n = this.opts.visualMap, r = e?.values[n.dimension ?? this.opts.sizeDimension ?? 0], [i, a] = this.vmRange;
		if (t.style.display = r === void 0 ? "none" : "block", r === void 0) return;
		let o = Math.min(1, Math.max(0, a > i ? (r - i) / (a - i) : .5));
		t.style.setProperty("--t", `${o * 100}%`);
	}
	layoutTreemap() {
		let e = this.opts, t = [], n = e.visibleMin ?? 4, i = (a, o, l) => {
			let u = a.children, d = s(u.map((e) => e.size), o);
			u.forEach((a, o) => {
				let s = this.level(a.depth), u = s.gap ?? e.gap ?? (a.depth === 0 ? 2 : 1), f = c(d[o], u / 2);
				if (f.w * f.h < n || f.w < .5 || f.h < .5) return;
				let p = a.children.length > 0 && (e.leafDepth === void 0 || l < e.leafDepth), m = s.borderWidth ?? 0, h = p ? this.upperOpts(a.depth) : null, g = h && f.h > h.height * 2 && f.w > 30 ? h.height : 0, _ = {
					x: f.x + m,
					y: f.y + m + g,
					w: f.w - 2 * m,
					h: f.h - 2 * m - g
				}, v = {
					k: "r",
					...f
				};
				if (p && _.w > 2 && _.h > 2) {
					let e = s.borderColor ?? r(a.color, -.14);
					t.push({
						n: a,
						shape: v,
						leaf: !1,
						header: g,
						fill: e,
						...this.decorate(a)
					}), i(a, _, l + 1);
				} else t.push({
					n: a,
					shape: v,
					leaf: !0,
					header: 0,
					fill: a.color,
					...this.decorate(a)
				});
			});
		};
		return i(this.zoom, this.area, 1), t;
	}
	layoutSunburst() {
		let e = this.opts.sunburst ?? {}, t = this.area, n = Math.min(t.w, t.h) / 2, r = t.x + (x(e.center?.[0], t.w) ?? t.w / 2), i = t.y + (x(e.center?.[1], t.h) ?? t.h / 2), a = typeof e.radius == "string" ? x(e.radius, n) ?? n * .95 : n * (e.radius ?? .95), o = typeof e.innerRadius == "string" ? x(e.innerRadius, n) ?? 0 : a * (e.innerRadius ?? .15), s = e.gap ?? 1, c = (e.padAngle ?? 0) * Math.PI / 180 / 2, l = Math.max(1, Math.min(this.opts.leafDepth ?? Infinity, this.zoom.height)), u = S(l, o, a, Array.from({ length: l }, (e, t) => {
			let r = this.level(t);
			return {
				r0: x(r.r0, n),
				r: x(r.r, n)
			};
		})), d = u[0][0];
		this.hole = {
			cx: r,
			cy: i,
			r: d
		};
		let f = (e.startAngle ?? 0) * Math.PI / 180 - Math.PI / 2, p = [];
		this.zoom !== this.tree && d > 4 && p.push({
			n: this.zoom,
			shape: {
				k: "s",
				cx: r,
				cy: i,
				r0: 0,
				r1: d - s,
				a0: 0,
				a1: Math.PI * 2
			},
			leaf: !1,
			header: 0,
			fill: this.zoom.color,
			hub: !0
		});
		let m = (t, n, a, o) => {
			let d = n, [f, h] = u[o - 1];
			for (let u of t.children) {
				let g = (a - n) * u.size / t.size;
				if (g * h >= .5 && h > f) {
					let t = (f + h) / 2, n = Math.min(g / 4, s / 2 / Math.max(1, t) + c), a = u.children.length > 0 && o < l;
					p.push({
						n: u,
						shape: {
							k: "s",
							cx: r,
							cy: i,
							r0: f + (f > 0 ? s / 2 : 0),
							r1: h - s / 2,
							a0: d + n,
							a1: d + g - n
						},
						leaf: !a,
						header: 0,
						fill: u.color,
						...this.decorate(u, e.borderRadius)
					});
				}
				if (u.children.length > 0 && o < l && g * h >= .5) {
					let e = h > f ? Math.min(g / 4, s / 2 / Math.max(1, (f + h) / 2) + c) : 0;
					m(u, d + e, d + g - e, o + 1);
				}
				d += g;
			}
		};
		return m(this.zoom, f, f + Math.PI * 2, 1), p;
	}
	relayout(e, t) {
		this.computeArea(), this.renderCrumbs();
		let n = this.currentShapes(), r = this.type === "sunburst" ? this.layoutSunburst() : this.layoutTreemap();
		this.items = r, cancelAnimationFrame(this.raf), this.tracks = null;
		let i = this.opts.animation ?? !0, a = i === !1 ? 0 : typeof i == "object" ? i.duration ?? 750 : 750;
		if (!e || !a || !n.size) {
			this.draw();
			return;
		}
		let o = new Map(r.map((e) => [e.n.id, e])), s = null, c = {
			k: "r",
			...this.area
		};
		if (t && this.type === "treemap") {
			if (j(t.from, t.to)) {
				let e = n.get(t.to.id)?.shape;
				e?.k === "r" && (s = {
					from: e,
					to: c
				});
			} else {
				let e = t.from;
				for (; e && !o.has(e.id);) e = e.parent;
				let n = e ? o.get(e.id).shape : null;
				n?.k === "r" && (s = {
					from: c,
					to: n
				});
			}
		}
		let l = [];
		for (let [e, t] of n) o.has(e) || l.push({
			it: t.it,
			from: t.shape,
			to: s ? g(t.shape, s.from, s.to) : m(t.shape),
			a0: t.alpha,
			a1: 0
		});
		for (let e of r) {
			let t = n.get(e.n.id);
			if (t) {
				l.push({
					it: e,
					from: t.shape,
					to: e.shape,
					a0: t.alpha,
					a1: 1
				});
				continue;
			}
			let r;
			if (s) r = g(e.shape, s.to, s.from);
			else {
				let t = e.n.parent;
				for (; t && !n.has(t.id);) t = t.parent;
				let i = t ? n.get(t.id).shape : null;
				r = i && i.k === e.shape.k && e.shape.k === "r" ? m(i) : m(e.shape);
			}
			l.push({
				it: e,
				from: r,
				to: e.shape,
				a0: 0,
				a1: 1
			});
		}
		this.tracks = l, this.animStart = performance.now(), this.animDur = a, this.hideTooltip();
		let u = (e) => {
			let t = e - this.animStart >= this.animDur;
			t && (this.tracks = null), this.draw(), t || (this.raf = requestAnimationFrame(u));
		};
		this.raf = requestAnimationFrame(u);
	}
	progress() {
		return B(Math.min(1, (performance.now() - this.animStart) / Math.max(1, this.animDur)));
	}
	currentShapes() {
		let e = /* @__PURE__ */ new Map();
		if (this.tracks) {
			let t = this.progress();
			for (let n of this.tracks) {
				let r = n.a0 + (n.a1 - n.a0) * t;
				n.a1 > 0 && e.set(n.it.n.id, {
					it: n.it,
					shape: p(n.from, n.to, t),
					alpha: r
				});
			}
		} else for (let t of this.items) e.set(t.n.id, {
			it: t,
			shape: t.shape,
			alpha: 1
		});
		return e;
	}
	zoomNode(e, t = !0) {
		if (e === this.zoom || e !== this.tree && !e.children.length) return;
		let n = this.zoom;
		this.zoom = e, this.hovered = null, this.relayout(t, {
			from: n,
			to: e
		}), this.emit("zoom", e === this.tree ? null : this.info(e));
	}
	renderCrumbs() {
		if (!this.showCrumbs) return;
		let e = [];
		for (let t = this.zoom; t; t = t.parent) e.unshift(t);
		this.crumbsEl.innerHTML = "", e.forEach((t, n) => {
			let r = n === e.length - 1, i = document.createElement(r ? "span" : "button");
			i.className = `tm-crumb${r ? " is-current" : ""}`, i.textContent = t.name, r || (i.type = "button", i.addEventListener("click", () => this.zoomNode(t))), i.style.setProperty("--tm-crumb", t === this.tree ? this.theme.muted : t.color), this.crumbsEl.append(i);
		});
	}
	draw() {
		let e = this.ctx, t = this.theme;
		if (e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.clearRect(0, 0, this.width, this.height), t.background !== "transparent" && (e.fillStyle = t.background, e.fillRect(0, 0, this.width, this.height)), e.save(), e.beginPath(), e.rect(this.area.x, this.area.y, this.area.w, this.area.h), e.clip(), this.tracks) {
			let e = this.progress();
			for (let t of this.tracks) {
				let n = p(t.from, t.to, e), r = t.a0 + (t.a1 - t.a0) * e;
				this.drawItem(t.it, n, r, n.k !== "p");
			}
		} else {
			for (let e of this.items) this.drawItem(e, e.shape, this.dimFor(e), !0);
			this.drawHover(), this.drawCenter();
		}
		e.restore();
	}
	dimFor(e) {
		let t = this.hovered;
		if (!t || e.hub) return 1;
		let n = this.opts.emphasis ?? {}, r = n.focus ?? (this.type === "sunburst" ? "relative" : "none");
		if (r === "none") return 1;
		let i = e.n;
		return i === t || r !== "self" && (r !== "descendant" && j(i, t) || r !== "ancestor" && j(t, i)) ? 1 : n.blurOpacity ?? .35;
	}
	trace(e, t) {
		let n = e.radius;
		n && t.k === "s" && (n[0] > 0 || n[1] > 0) ? w(this.ctx, t, n) : n && t.k === "r" && n[1] > 0 && t.w > 0 && t.h > 0 ? (this.ctx.beginPath(), this.ctx.roundRect(t.x, t.y, t.w, t.h, Math.min(n[1], t.w / 2, t.h / 2))) : _(this.ctx, t);
	}
	drawItem(e, t, n, r) {
		if (n <= .01) return;
		let i = this.ctx;
		i.globalAlpha = Math.min(1, n) * (e.opacity ?? 1), this.trace(e, t), i.fillStyle = e.fill, i.fill(), i.globalAlpha = Math.min(1, n), e.stroke && (i.lineWidth = e.stroke[0], i.strokeStyle = e.stroke[1], i.lineJoin = "round", i.stroke()), r && (t.k === "r" ? e.header ? this.drawHeader(e, t) : e.leaf && this.drawLeafLabel(e, t) : t.k === "s" && this.drawSectorLabel(e, t)), i.globalAlpha = 1;
	}
	textColor(e, n) {
		return n || (t(e)[3] < .5 ? this.theme.text : i(e) > .42 ? this.theme.labelDark : this.theme.labelLight);
	}
	fit(e, t) {
		let n = this.ctx;
		if (n.measureText(e).width <= t) return e;
		let r = 0, i = e.length;
		for (; r < i;) {
			let a = r + i + 1 >> 1;
			n.measureText(e.slice(0, a) + "…").width <= t ? r = a : i = a - 1;
		}
		return r ? e.slice(0, r) + "…" : "";
	}
	labelText(e, t) {
		let n = this.info(e.n);
		return t.formatter ? t.formatter(n).split("\n") : t.showValue ? [e.n.name, this.fmt(e.n.size)] : [e.n.name];
	}
	drawHeader(e, t) {
		let n = this.upperOpts(e.n.depth);
		if (!n || t.w < 24) return;
		let r = this.ctx;
		r.font = `600 12px ${this.theme.font}`, r.fillStyle = this.textColor(e.fill, n.color), r.textBaseline = "middle", r.textAlign = "left";
		let i = n.formatter ? n.formatter(this.info(e.n)) : e.n.name;
		r.fillText(this.fit(i, t.w - 10), t.x + 5, t.y + e.header / 2 + .5);
	}
	drawLeafLabel(e, t) {
		let n = this.labelFor(e.n);
		if (!n.show) return;
		let r = n.fontSize ?? 12;
		if (t.w < 22 || t.h < r + 6) return;
		let i = this.ctx, a = this.labelText(e, n), o = r * 1.25, s = Math.max(1, Math.floor((t.h - 6) / o)), c = a.slice(0, s);
		i.fillStyle = this.textColor(e.fill, n.color), i.textBaseline = "top", i.save(), i.beginPath(), i.rect(t.x, t.y, t.w, t.h), i.clip();
		let l = n.position === "center";
		i.textAlign = l ? "center" : "left";
		let u = l ? Math.min(r * 2.4, Math.max(r, Math.min(t.w / 7, (t.h - (c.length - 1) * o) / 1.6))) : r, d = l ? t.y + (t.h - (u * 1.2 + (c.length - 1) * o)) / 2 : t.y + 5;
		c.forEach((e, n) => {
			let a = n === 0 ? u : r;
			i.font = `${n === 0 ? 600 : 400} ${a}px ${this.theme.font}`;
			let s = this.fit(e, t.w - 10);
			s && i.fillText(s, l ? t.x + t.w / 2 : t.x + 5, d), d += n === 0 ? a * 1.2 : o;
		}), i.restore();
	}
	drawSectorLabel(e, t) {
		let n = this.labelFor(e.n);
		if (!n.show) return;
		let r = this.ctx, i = n.fontSize ?? 11;
		if (r.font = `${n.fontWeight ?? (e.hub ? 600 : 400)} ${i}px ${this.theme.font}`, r.textBaseline = "middle", e.hub) {
			r.fillStyle = this.textColor(e.fill, n.color), r.textAlign = "center", r.fillText(this.fit(e.n.name, t.r1 * 1.7), t.cx, t.cy);
			return;
		}
		let a = t.a1 - t.a0;
		if (n.minAngle !== void 0 && a * 180 / Math.PI < n.minAngle) return;
		let o = this.labelText(e, n).filter((e) => e !== "");
		if (!o.length) return;
		let s = i * 1.2, c = (t.a0 + t.a1) / 2, l = n.distance ?? 4;
		if (n.position === "outside") {
			if (a * t.r1 < i * .7) return;
			let e = t.r1 + l, [u, d] = [t.cx + e * Math.cos(c), t.cy + e * Math.sin(c)], [f, p] = [Math.cos(c), Math.sin(c)], m = this.area, h = Math.min(f > 1e-6 ? (m.x + m.w - u) / f : f < -1e-6 ? (m.x - u) / f : Infinity, p > 1e-6 ? (m.y + m.h - d) / p : p < -1e-6 ? (m.y - d) / p : Infinity) - 2;
			if (h < 14) return;
			let g = E(c);
			r.fillStyle = n.color ?? this.theme.text, r.textAlign = g.flipped ? "right" : "left", r.save(), r.translate(u, d), r.rotate(g.angle), o.forEach((e, t) => {
				let n = this.fit(e, h);
				n && r.fillText(n, 0, (t - (o.length - 1) / 2) * s);
			}), r.restore();
			return;
		}
		let u = n.rotate ?? this.opts.sunburst?.labelRotate ?? "radial", d = u === "radial" ? c : u === "tangential" ? c + Math.PI / 2 : u === "none" ? 0 : -u * Math.PI / 180, f = typeof u == "number" || u === "none" ? {
			angle: d,
			flipped: !1
		} : E(d), { along: p, across: m } = T(t, d), h = Math.min(o.length, Math.floor((m - 2) / s));
		if (h < 1 || p - 2 * l < 12) return;
		let g = (t.r0 + t.r1) / 2;
		r.fillStyle = this.textColor(e.fill, n.color);
		let _ = 0, v = "center";
		u === "radial" && n.align && n.align !== "center" && (_ = ((t.r1 - t.r0) / 2 - l) * (n.align === "left" ? -1 : 1) * (f.flipped ? -1 : 1), v = n.align === "left" === f.flipped ? "right" : "left"), r.textAlign = v, r.save(), r.translate(t.cx + g * Math.cos(c), t.cy + g * Math.sin(c)), r.rotate(f.angle);
		for (let e = 0; e < h; e++) {
			let t = this.fit(o[e], p - 2 * l);
			t && r.fillText(t, _, (e - (h - 1) / 2) * s);
		}
		r.restore();
	}
	drawHover() {
		let e = this.hovered;
		if (!e) return;
		let t = this.items.find((t) => t.n === e);
		if (!t) return;
		let n = this.ctx, r = t.shape;
		r.k === "r" && t.header && !t.leaf ? (n.fillStyle = "rgba(255,255,255,0.12)", n.fillRect(r.x, r.y, r.w, t.header), n.strokeStyle = "rgba(255,255,255,0.55)", n.lineWidth = 1, n.strokeRect(r.x + .5, r.y + .5, r.w - 1, r.h - 1)) : (this.trace(t, r), n.fillStyle = "rgba(255,255,255,0.12)", n.fill(), r.k === "r" && (n.strokeStyle = "rgba(255,255,255,0.75)", n.lineWidth = 1.5, n.strokeRect(r.x + .75, r.y + .75, r.w - 1.5, r.h - 1.5)));
	}
	drawCenter() {
		if (this.type !== "sunburst" || this.zoom !== this.tree || this.opts.sunburst?.centerLabel === !1) return;
		let { cx: e, cy: t, r: n } = this.hole;
		if (n < 34) return;
		let r = this.ctx;
		r.textAlign = "center", r.textBaseline = "middle", r.fillStyle = this.theme.muted, r.font = `11px ${this.theme.font}`, r.fillText(this.fit(this.tree.name, n * 1.7), e, t - 9), r.fillStyle = this.theme.text, r.font = `700 ${Math.min(20, n / 3)}px ${this.theme.font}`, r.fillText(this.fit(this.fmt(this.tree.size), n * 1.7), e, t + 8);
	}
	hit(e, t) {
		if (this.tracks) return null;
		for (let n = this.items.length - 1; n >= 0; n--) {
			let r = this.items[n];
			if (!y(r.shape, e, t)) continue;
			let i = r.shape;
			return {
				it: r,
				header: i.k === "r" && r.header > 0 && t <= i.y + r.header
			};
		}
		return null;
	}
	bind() {
		let e = this.canvas, t = (t) => {
			let n = e.getBoundingClientRect();
			return [t.clientX - n.left, t.clientY - n.top];
		};
		e.addEventListener("pointermove", (n) => {
			let [r, i] = t(n), a = this.hit(r, i), o = a?.it.n ?? null;
			o !== this.hovered && (this.hovered = o, this.tracks || this.draw(), this.vmShown() && this.markVisual(o), this.emit("hover", o ? this.info(o) : null)), e.style.cursor = a && this.target(a) ? "pointer" : "", a ? this.showTooltip(o, r, i) : this.hideTooltip();
		}), e.addEventListener("pointerleave", () => {
			this.hovered = null, this.vmShown() && this.markVisual(null), this.hideTooltip(), this.tracks || this.draw(), this.emit("hover", null);
		}), e.addEventListener("click", (e) => {
			let [n, r] = t(e), i = this.hit(n, r);
			if (!i) return;
			this.emit("click", this.info(i.it.n));
			let a = this.target(i);
			a && this.zoomNode(a);
		});
	}
	target(e) {
		if (this.opts.drilldown === !1) return null;
		let t = e.it.n;
		if (e.it.hub) return this.zoom.parent;
		if (e.header || this.type === "sunburst") return t.children.length && t !== this.zoom ? t : null;
		let n = t;
		for (; n.parent && n.parent !== this.zoom;) n = n.parent;
		return n.children.length && n !== this.zoom ? n : null;
	}
	hideTooltip() {
		this.tooltipEl.classList.remove("is-visible");
	}
	showTooltip(e, t, n) {
		let r = this.opts.tooltip;
		if (r === !1 || typeof r == "object" && r.show === !1) return;
		let i = this.tooltipEl, a = this.info(e);
		if (typeof r == "object" && r.formatter) i.innerHTML = r.formatter(a);
		else {
			let t = this.opts.dimensions, n = t?.length ? t.map((t, n) => [t, e.values[n] === void 0 ? "–" : this.fmt(e.values[n], n)]) : [["Valor", this.fmt(e.size)]], r = (e) => `${+(e * 100).toFixed(e < .001 ? 3 : e < .1 ? 2 : 1)}%`;
			e.depth > 0 && n.push([`% de ${e.parent.name}`, r(a.percent)]), e.depth >= 0 && n.push(["% do total", r(a.totalPercent)]), i.innerHTML = `<div class="tm-tooltip__head"><span class="tm-tooltip__dot" style="background:${e.color}"></span>${z(e.path.join(" / ") || e.name)}</div>` + n.map(([e, t]) => `<div class="tm-tooltip__row"><span>${z(e)}</span><b>${z(t)}</b></div>`).join("");
		}
		i.classList.add("is-visible");
		let o = i.offsetWidth, s = i.offsetHeight, c = t + 14, l = n + 14;
		c + o > this.width - 4 && (c = t - o - 14), l + s > this.height - 4 && (l = n - s - 14), i.style.transform = `translate(${Math.max(4, c)}px, ${Math.max(4, l)}px)`;
	}
};
function G(e, t) {
	return new W(e, t);
}
//#endregion
export { F as a, N as c, G as i, s as l, L as n, I as o, W as r, M as s, R as t };

//# sourceMappingURL=treemap.js.map