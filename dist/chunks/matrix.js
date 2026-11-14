import { a as e, n as t, r as n } from "./color.js";
//#region src/matrix/layout.ts
var r = (e) => typeof e == "object" ? e : { value: e };
function i(e) {
	let t = typeof e == "number" ? Array.from({ length: Math.max(0, Math.floor(e)) }, (e, t) => String(t)) : e ?? [], n = (e) => {
		let t = r(e);
		return t.children?.length ? 1 + Math.max(...t.children.map(n)) : 1;
	}, i = t.length ? Math.max(...t.map(n)) : 0, a = [], o = [], s = (e, t, n) => {
		for (let c of e) {
			let e = r(c), l = String(e.value), u = [...n, l], d = !e.children?.length, f = {
				name: l,
				item: e,
				level: t,
				depth: d ? i - t : 1,
				start: o.length,
				span: 0,
				leaf: d,
				path: u
			};
			a.push(f), d ? (o.push(f), f.span = 1) : (s(e.children, t + 1, u), f.span = o.length - f.start);
		}
	};
	return s(t, 0, []), {
		nodes: a,
		leaves: o,
		levels: i
	};
}
function a(e, t) {
	if (e === void 0 || e === "auto") return {
		px: 0,
		fr: 1
	};
	if (typeof e == "number") return {
		px: Math.max(0, e),
		fr: 0
	};
	let n = e.trim(), r = parseFloat(n);
	return n.endsWith("%") ? {
		px: Math.max(0, (Number.isFinite(r) ? r : 0) / 100 * t),
		fr: 0
	} : n.endsWith("px") ? {
		px: Math.max(0, Number.isFinite(r) ? r : 0),
		fr: 0
	} : {
		px: 0,
		fr: Math.max(0, Number.isFinite(r) ? r : 1)
	};
}
function o(e, t, n = 0) {
	let r = e.map((e) => a(e, t)), i = r.reduce((e, t) => e + t.px, 0), o = r.reduce((e, t) => e + t.fr, 0), s = r.filter((e) => e.fr > 0).length * n, c = i > 0 && i + s > t ? Math.max(0, t - s) / i : 1, l = Math.max(0, t - i * c);
	return r.map((e) => e.fr > 0 ? Math.max(n, o ? l * e.fr / o : 0) : e.px * c);
}
function s(e, t = 0) {
	let n = [Math.round(t)], r = t;
	for (let t of e) r += t, n.push(Math.round(r));
	return {
		offsets: n,
		sizes: e.map((e, t) => n[t + 1] - n[t])
	};
}
function c(e, t) {
	let n = e.length - 1;
	if (n < 1 || t < e[0] || t >= e[n]) return -1;
	let r = 0, i = n - 1;
	for (; r < i;) {
		let n = r + i + 1 >> 1;
		e[n] <= t ? r = n : i = n - 1;
	}
	return r;
}
var l = (e, t) => {
	let n = t.leaves.length;
	if (typeof e == "number") return Number.isInteger(e) && e >= 0 && e < n ? [e, e] : null;
	let r = t.leaves.findIndex((t) => t.name === e);
	if (r >= 0) return [r, r];
	let i = t.nodes.find((t) => t.name === e) ?? t.nodes.find((t) => t.path.join("/") === e);
	return i ? [i.start, i.start + i.span - 1] : null;
};
function u(e, t) {
	if (Array.isArray(e)) {
		let n = l(e[0], t), r = l(e[1], t);
		return !n || !r ? null : [Math.min(n[0], r[0]), Math.max(n[1], r[1])];
	}
	return l(e, t);
}
function d(e) {
	let t = [];
	return e.forEach((e, n) => e?.forEach((e, r) => e != null && t.push({
		coord: [r, n],
		value: e
	}))), t;
}
function f(e) {
	return !!e?.length && e.some((e) => Array.isArray(e));
}
function p(e, t, n) {
	let r = t.leaves.length, i = n.leaves.length, a = [], o = [];
	e.forEach((e, a) => {
		if (!e || !e.coord) return;
		let s = u(e.coord[0], t), c = u(e.coord[1], n);
		if (!s || !c) return;
		let l = Math.min(r - 1, Math.max(s[1], s[0] + Math.max(1, Math.floor(e.colSpan ?? 1)) - 1)), d = Math.min(i - 1, Math.max(c[1], c[0] + Math.max(1, Math.floor(e.rowSpan ?? 1)) - 1));
		o.push({
			cell: e,
			index: a,
			x0: s[0],
			x1: l,
			y0: c[0],
			y1: d
		});
	});
	let s = (e) => +(e.x1 > e.x0 || e.y1 > e.y0);
	o.sort((e, t) => s(e) - s(t) || e.index - t.index);
	let c = new Int32Array(r * i).fill(-1);
	for (let e of o) {
		let t = a.length;
		for (let n = e.y0; n <= e.y1; n++) for (let i = e.x0; i <= e.x1; i++) {
			let e = c[n * r + i];
			if (e >= 0 && a[e]) {
				let t = a[e];
				for (let n = t.y0; n <= t.y1; n++) for (let i = t.x0; i <= t.x1; i++) c[n * r + i] === e && (c[n * r + i] = -1);
				a[e] = null;
			}
			c[n * r + i] = t;
		}
		a.push(e);
	}
	let l = a.filter((e) => !!e).sort((e, t) => e.y0 - t.y0 || e.x0 - t.x0), d = new Map(l.map((e, t) => [e, t])), f = a.map((e) => e ? d.get(e) : -1);
	for (let e = 0; e < c.length; e++) c[e] >= 0 && (c[e] = f[c[e]]);
	return {
		cells: l,
		grid: c,
		nx: r,
		ny: i
	};
}
function m(e, t, n) {
	let r = [];
	return (e ?? []).forEach((e, i) => {
		let a = e.query ?? {}, o = n > 0 ? t / n : 0;
		(a.minWidth === void 0 || t >= a.minWidth) && (a.maxWidth === void 0 || t <= a.maxWidth) && (a.minHeight === void 0 || n >= a.minHeight) && (a.maxHeight === void 0 || n <= a.maxHeight) && (a.minAspectRatio === void 0 || o >= a.minAspectRatio) && (a.maxAspectRatio === void 0 || o <= a.maxAspectRatio) && r.push(i);
	}), r;
}
//#endregion
//#region src/matrix/matrix.ts
var h = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", g = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	border: "#2a2e39",
	cellBg: "transparent",
	headerBg: "#1a1e2b",
	headerText: "#b2b5be",
	cornerBg: "#1a1e2b",
	hover: "rgba(255, 255, 255, 0.07)",
	select: "#2962ff",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: h
}, _ = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	border: "#e0e3eb",
	cellBg: "transparent",
	headerBg: "#f4f5f8",
	headerText: "#434651",
	cornerBg: "#f4f5f8",
	hover: "rgba(19, 23, 34, 0.06)",
	select: "#2962ff",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: h
}, v = [
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
], y = [
	"#1848cc",
	"#5b8def",
	"#c9d6f0",
	"#f3c3bd",
	"#ef5350",
	"#b71c1c"
], b = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), x = (e, t, n) => Math.min(n, Math.max(t, e)), S = (e) => 1 - (1 - e) ** 3, C = (e) => !e || e === "transparent" || e === "none", w = class {
	constructor(e, t = {}) {
		this.opts = {}, this.mediaKey = "", this.cols = {
			offsets: [0],
			sizes: []
		}, this.rows = {
			offsets: [0],
			sizes: []
		}, this.xLevels = {
			offsets: [0],
			sizes: []
		}, this.yLevels = {
			offsets: [0],
			sizes: []
		}, this.bodyRect = {
			x: 0,
			y: 0,
			w: 0,
			h: 0
		}, this.bodyItems = [], this.headerItems = [], this.cornerItem = null, this.grid = /* @__PURE__ */ new Int32Array(), this.nx = 0, this.ny = 0, this.vm = null, this.hiddenPieces = /* @__PURE__ */ new Set(), this.hover = null, this.selected = /* @__PURE__ */ new Set(), this.hosts = /* @__PURE__ */ new Map(), this.textColors = /* @__PURE__ */ new Map(), this.width = 0, this.height = 0, this.dpr = 1, this.animStart = 0, this.progress = 1, this.raf = 0, this.reflowTimer = 0, this.handlers = /* @__PURE__ */ new Map(), this.destroyed = !1, this.base = { ...t }, this.root = e, e.classList.add("mx-root"), this.titleEl = document.createElement("div"), this.titleEl.className = "mx-title", this.bodyEl = document.createElement("div"), this.plotEl = document.createElement("div"), this.plotEl.className = "mx-plot", this.canvas = document.createElement("canvas"), this.canvas.className = "mx-canvas", this.canvas.setAttribute("role", "img"), this.overlay = document.createElement("canvas"), this.overlay.className = "mx-canvas mx-overlay", this.ctx = this.canvas.getContext("2d"), this.octx = this.overlay.getContext("2d"), this.hostsEl = document.createElement("div"), this.hostsEl.className = "mx-hosts", this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "mx-tooltip", this.visualEl = document.createElement("div"), this.visualEl.className = "mx-visual", this.plotEl.append(this.canvas, this.overlay, this.hostsEl, this.tooltipEl), this.bodyEl.append(this.plotEl, this.visualEl), e.append(this.titleEl, this.bodyEl), this.bind(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(this.plotEl), this.measure(), this.mediaKey = this.activeMedia(), this.rebuild(!0);
	}
	setData(e, t = !0) {
		this.base = {
			...this.base,
			data: e
		}, this.rebuild(t);
	}
	setOptions(e, t = !0) {
		this.base = {
			...this.base,
			...e
		}, this.rebuild(t);
	}
	getOptions() {
		return this.opts;
	}
	getCell(e, t) {
		let n = u(e, this.xh), r = u(t, this.yh);
		if (!n || !r) return null;
		let i = this.grid[r[0] * this.nx + n[0]];
		return i >= 0 ? this.bodyItems[i].info : null;
	}
	cellRect(e, t) {
		let n = u(e, this.xh), r = u(t, this.yh);
		return !n || !r ? null : this.rangeRect(n[0], n[1], r[0], r[1]);
	}
	getCells() {
		return this.bodyItems.map((e) => e.info);
	}
	getSelection() {
		return this.bodyItems.filter((e) => this.selected.has(e.info.id)).map((e) => e.info);
	}
	setSelection(e) {
		this.selected.clear();
		for (let [t, n] of e) {
			let e = this.getCell(t, n);
			e && this.selected.add(e.id);
		}
		this.drawOverlay(), this.emit("select", this.getSelection());
	}
	clearSelection() {
		this.setSelection([]);
	}
	togglePiece(e, t) {
		t ?? !this.hiddenPieces.has(e) ? this.hiddenPieces.add(e) : this.hiddenPieces.delete(e), this.renderVisual(), this.draw();
	}
	refresh() {
		this.draw(), this.drawOverlay();
	}
	on(e, t) {
		this.handlers.has(e) || this.handlers.set(e, /* @__PURE__ */ new Set());
		let n = t;
		return this.handlers.get(e).add(n), () => this.handlers.get(e)?.delete(n);
	}
	resize() {
		if (this.destroyed) return;
		this.measure();
		let e = this.activeMedia();
		e === this.mediaKey ? (this.layout(), this.placeHosts(), this.draw(), this.drawOverlay()) : (this.mediaKey = e, this.hostsEl.classList.add("mx-hosts--reflow"), clearTimeout(this.reflowTimer), this.reflowTimer = window.setTimeout(() => this.hostsEl.classList.remove("mx-hosts--reflow"), 450), this.rebuild(!1), this.emit("media", { rules: e ? e.split(",").map(Number) : [] }));
	}
	screenshot() {
		this.draw();
		let e = document.createElement("canvas");
		e.width = this.canvas.width, e.height = this.canvas.height;
		let t = e.getContext("2d");
		t.drawImage(this.canvas, 0, 0);
		let n = this.plotEl.getBoundingClientRect();
		return this.hostsEl.querySelectorAll("canvas").forEach((e) => {
			let r = e.getBoundingClientRect();
			r.width && r.height && t.drawImage(e, (r.left - n.left) * this.dpr, (r.top - n.top) * this.dpr, r.width * this.dpr, r.height * this.dpr);
		}), e.toDataURL("image/png");
	}
	destroy() {
		if (!this.destroyed) {
			this.destroyed = !0, cancelAnimationFrame(this.raf), clearTimeout(this.reflowTimer), this.ro.disconnect();
			for (let e of this.hosts.values()) this.unmount(e);
			this.hosts.clear(), this.root.classList.remove("mx-root");
			for (let e of [
				"--mx-bg",
				"--mx-text",
				"--mx-muted",
				"--mx-border",
				"--mx-tt-bg",
				"--mx-tt-text",
				"--mx-tt-border",
				"--mx-font"
			]) this.root.style.removeProperty(e);
			this.titleEl.remove(), this.bodyEl.remove();
		}
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t));
	}
	activeMedia() {
		if (!this.base.media?.length) return "";
		let e = this.root.getBoundingClientRect();
		return m(this.base.media, Math.floor(e.width), Math.floor(e.height)).join(",");
	}
	effective() {
		let e = { ...this.base }, t = this.base.media ?? [];
		for (let n of this.mediaKey ? this.mediaKey.split(",").map(Number) : []) t[n] && (e = {
			...e,
			...t[n].option
		});
		return e;
	}
	applyLook() {
		let e = this.opts, t = e.theme === "light" ? _ : g, n = typeof e.theme == "object" ? e.theme : {}, r = {
			...t,
			...n
		};
		if (e.background && (r.background = e.background), r.background === "transparent") {
			let t = e.theme !== "light", i = t ? "rgba(255, 255, 255, 0.06)" : "rgba(19, 23, 34, 0.04)";
			n.headerBg || (r.headerBg = i), n.cornerBg || (r.cornerBg = i), n.border || (r.border = t ? "rgba(255, 255, 255, 0.16)" : "rgba(19, 23, 34, 0.12)");
		}
		this.theme = r, this.textColors.clear();
		let i = {
			"--mx-bg": r.background,
			"--mx-text": r.text,
			"--mx-muted": r.muted,
			"--mx-border": r.border,
			"--mx-tt-bg": r.tooltipBg,
			"--mx-tt-text": r.tooltipText,
			"--mx-tt-border": r.tooltipBorder,
			"--mx-font": r.font
		};
		for (let [e, t] of Object.entries(i)) this.root.style.setProperty(e, t);
		let a = typeof e.title == "string" ? { text: e.title } : e.title;
		this.titleEl.style.display = a ? "" : "none", a && (this.titleEl.style.textAlign = a.align ?? "center", this.titleEl.innerHTML = `<b>${b(a.text)}</b>${a.subtext ? `<small>${b(a.subtext)}</small>` : ""}`);
	}
	duration() {
		let e = this.opts.animation ?? !0;
		return e === !1 ? 0 : typeof e == "object" ? e.duration ?? 600 : 600;
	}
	stagger() {
		let e = this.opts.animation, t = this.duration();
		return typeof e == "object" && e.stagger !== void 0 ? e.stagger : Math.min(450, t * .7);
	}
	headerOf(e, t, n) {
		if (e) return i(e.data);
		let r = 0;
		for (let e of n) {
			let n = e.coord?.[t], i = Array.isArray(n) ? n : [n];
			for (let n of i) typeof n == "number" && (r = Math.max(r, n + 1 + (t === 0 ? (e.colSpan ?? 1) - 1 : (e.rowSpan ?? 1) - 1)));
		}
		return i(r);
	}
	headerShown(e) {
		return e ? e.show ?? typeof e.data != "number" : !1;
	}
	rebuild(e) {
		if (this.destroyed) return;
		this.opts = this.effective(), this.applyLook();
		let t = this.opts, n = t.data ?? [], r = f(n) ? d(n) : n;
		this.xh = this.headerOf(t.x, 0, r), this.yh = this.headerOf(t.y, 1, r);
		let i = p(r, this.xh, this.yh);
		this.nx = i.nx, this.ny = i.ny, this.grid = i.grid;
		let a = this.theme, o = t.gap ?? 0, s = this.duration(), c = this.stagger(), l = e && s > 0, u = Math.max(1, this.nx + this.ny - 2), m = t.visualMap || null;
		this.vm = null, m && (this.vm = {
			map: m,
			min: 0,
			max: 1,
			pieces: m.pieces?.length ? m.pieces : null
		});
		let h = (e, ...t) => Object.assign({}, e, ...t), g = (e, t) => ({
			color: e.color ?? t,
			borderColor: e.borderColor ?? a.border,
			borderWidth: e.borderWidth ?? (o > 0 ? 0 : 1),
			radius: e.radius ?? (o > 0 ? 3 : 0),
			opacity: e.opacity ?? 1
		}), _ = (...e) => {
			let t = Object.assign({}, ...e);
			return {
				...t,
				show: t.show ?? !0
			};
		}, v = (e, t, n) => {
			if (!n.leaves.length) return {
				name: "",
				path: []
			};
			if (e === t) return {
				name: n.leaves[e].name,
				path: n.leaves[e].path
			};
			let r = n.nodes.find((n) => n.start === e && n.span === t - e + 1);
			return r ? {
				name: r.name,
				path: r.path
			} : {
				name: `${n.leaves[e].name}–${n.leaves[t].name}`,
				path: [`${n.leaves[e].name}–${n.leaves[t].name}`]
			};
		};
		if (this.bodyItems = i.cells.map((e) => {
			let n = e.cell, r = v(e.x0, e.x1, this.xh), i = v(e.y0, e.y1, this.yh), o = {
				kind: "body",
				id: n.id ?? `${e.x0},${e.y0}`,
				x: e.x0,
				y: e.y0,
				xSpan: e.x1 - e.x0 + 1,
				ySpan: e.y1 - e.y0 + 1,
				xName: r.name,
				yName: i.name,
				xPath: r.path,
				yPath: i.path,
				value: n.value,
				text: "",
				color: "",
				level: -1,
				rect: {
					x: 0,
					y: 0,
					w: 0,
					h: 0
				},
				data: n
			}, s = h(t.itemStyle, n.itemStyle, n.color ? { color: n.color } : void 0);
			return {
				info: o,
				style: g(s, a.cellBg),
				label: _(t.label, n.label),
				defaultTextColor: a.text,
				render: n.render ?? t.renderCell,
				mount: n.mount === null ? null : n.mount ?? t.mount,
				silent: !!n.silent,
				delay: l ? (e.x0 + e.y0) / u * c : 0,
				piece: -1,
				x0: e.x0,
				x1: e.x1,
				y0: e.y0,
				y1: e.y1,
				hidden: !!n.hidden,
				explicitColor: !!(n.color || n.itemStyle?.color)
			};
		}), this.vm) {
			let e = this.vm.map.dimension ?? ((e) => e.value), t = [], n = this.bodyItems.map((n) => {
				let r = e(n.info);
				return typeof r == "number" && Number.isFinite(r) && t.push(r), r;
			});
			this.vm.min = this.vm.map.min ?? (t.length ? Math.min(...t) : 0), this.vm.max = this.vm.map.max ?? (t.length ? Math.max(...t) : 1), this.bodyItems.forEach((e, t) => {
				let r = n[t];
				if (r == null || typeof r == "number" && !Number.isFinite(r)) return;
				let { color: i, piece: a } = this.visualColor(r);
				e.piece = a, i && !e.explicitColor && (e.style.color = i);
			});
		}
		for (let e of this.bodyItems) e.info.color = C(e.style.color) ? "" : e.style.color, e.info.text = this.textOf(e);
		let y = (t.emptyCells ?? "show") === "show", b = new Set(this.bodyItems.filter((e) => e.hidden));
		if (y) {
			let e = [];
			for (let n = 0; n < this.ny; n++) for (let r = 0; r < this.nx; r++) {
				if (this.grid[n * this.nx + r] >= 0) continue;
				let i = v(r, r, this.xh), o = v(n, n, this.yh);
				e.push({
					info: {
						kind: "body",
						id: `${r},${n}`,
						x: r,
						y: n,
						xSpan: 1,
						ySpan: 1,
						xName: i.name,
						yName: o.name,
						xPath: i.path,
						yPath: o.path,
						value: void 0,
						text: "",
						color: "",
						level: -1,
						rect: {
							x: 0,
							y: 0,
							w: 0,
							h: 0
						},
						data: void 0
					},
					style: g(h(t.itemStyle), a.cellBg),
					label: { show: !1 },
					defaultTextColor: a.text,
					silent: !0,
					delay: l ? (r + n) / u * c : 0,
					piece: -1,
					x0: r,
					x1: r,
					y0: n,
					y1: n,
					blank: !0
				});
			}
			this.bodyItems = [...this.bodyItems, ...e];
		}
		if (b.size) for (let e = 0; e < this.grid.length; e++) this.grid[e] >= 0 && b.has(this.bodyItems[this.grid[e]]) && (this.grid[e] = -1);
		this.headerItems = [];
		let x = (e, t, n) => {
			if (this.headerShown(e)) for (let r of t.nodes) {
				let t = e?.levels?.[r.level], i = r.item, o = h(e?.itemStyle, t?.itemStyle, i.itemStyle, i.color ? { color: i.color } : void 0), s = {
					kind: n,
					id: `${n}:${r.path.join("/")}:${r.start}`,
					x: n === "x" ? r.start : -1,
					y: n === "y" ? r.start : -1,
					xSpan: n === "x" ? r.span : 0,
					ySpan: n === "y" ? r.span : 0,
					xName: n === "x" ? r.name : "",
					yName: n === "y" ? r.name : "",
					xPath: n === "x" ? r.path : [],
					yPath: n === "y" ? r.path : [],
					value: i.value,
					text: "",
					color: "",
					level: r.level,
					rect: {
						x: 0,
						y: 0,
						w: 0,
						h: 0
					},
					data: i
				}, c = {
					info: s,
					style: g(o, a.headerBg),
					label: _({
						align: n === "y" ? "left" : "center",
						fontWeight: r.leaf ? 500 : 600
					}, e?.label, t?.label, i.label),
					defaultTextColor: a.headerText,
					silent: !1,
					delay: 0,
					piece: -1,
					node: r,
					x0: n === "x" ? r.start : -1,
					x1: n === "x" ? r.start + r.span - 1 : -1,
					y0: n === "y" ? r.start : -1,
					y1: n === "y" ? r.start + r.span - 1 : -1
				};
				s.color = C(c.style.color) ? "" : c.style.color, s.text = c.label.formatter ? c.label.formatter(s) : r.name, this.headerItems.push(c);
			}
		};
		if (x(t.x, this.xh, "x"), x(t.y, this.yh, "y"), this.cornerItem = null, this.headerShown(t.x) && this.headerShown(t.y)) {
			let e = t.corner ?? {}, n = h(e.itemStyle, e.color ? { color: e.color } : void 0), r = {
				kind: "corner",
				id: "corner",
				x: -1,
				y: -1,
				xSpan: 0,
				ySpan: 0,
				xName: "",
				yName: "",
				xPath: [],
				yPath: [],
				value: e.text,
				text: e.text ?? "",
				color: "",
				level: 0,
				rect: {
					x: 0,
					y: 0,
					w: 0,
					h: 0
				},
				data: void 0
			};
			this.cornerItem = {
				info: r,
				style: g(n, a.cornerBg),
				label: _({ fontWeight: 600 }, e.label),
				defaultTextColor: a.muted,
				silent: !0,
				delay: 0,
				piece: -1,
				x0: -1,
				x1: -1,
				y0: -1,
				y1: -1
			}, r.color = C(this.cornerItem.style.color) ? "" : this.cornerItem.style.color;
		}
		let S = new Set(this.bodyItems.map((e) => e.info.id));
		for (let e of [...this.selected]) S.has(e) || this.selected.delete(e);
		this.hover &&= [...this.bodyItems, ...this.headerItems].find((e) => e.info.id === this.hover.info.id) ?? null, this.hiddenPieces.size && !this.vm?.pieces && this.hiddenPieces.clear(), this.renderVisual(), this.layout(), this.syncHosts(l), this.animStart = l ? performance.now() : 0, this.progress = +!l, this.loop();
	}
	visualColor(e) {
		let n = this.vm;
		if (n.pieces) {
			let t = n.pieces.findIndex((t) => t.value === void 0 ? typeof e == "number" && (t.min === void 0 || e >= t.min) && (t.max === void 0 || e < t.max || e === t.max && t === n.pieces[n.pieces.length - 1]) : t.value === e);
			return t >= 0 ? {
				color: n.pieces[t].color,
				piece: t
			} : {
				color: n.map.outOfRange ?? "",
				piece: -1
			};
		}
		if (typeof e != "number") return {
			color: "",
			piece: -1
		};
		let r = n.max - n.min;
		return (e < n.min || e > n.max) && n.map.outOfRange ? {
			color: n.map.outOfRange,
			piece: -1
		} : {
			color: t(n.map.colors ?? y, r ? (e - n.min) / r : .5),
			piece: -1
		};
	}
	fmt(e) {
		return this.opts.valueFormatter ? this.opts.valueFormatter(e) : e.toLocaleString("pt-PT", { maximumFractionDigits: 2 });
	}
	textOf(e) {
		let t = e.info.data;
		if (t?.text !== void 0) return t.text;
		if (e.label.formatter) return e.label.formatter(e.info);
		let n = e.info.value;
		return typeof n == "number" ? Number.isFinite(n) ? this.fmt(n) : "" : typeof n == "string" ? n : "";
	}
	renderVisual() {
		let e = this.vm, t = !!e && e.map.show !== !1, n = e?.map.position ?? "right";
		if (this.bodyEl.className = `mx-body mx-visual-${n}`, this.visualEl.style.display = t ? "" : "none", !t || !e) {
			this.visualEl.innerHTML = "";
			return;
		}
		let r = (t) => e.map.formatter ? e.map.formatter(t) : this.fmt(t);
		if (e.pieces) {
			this.visualEl.innerHTML = `<ul class="mx-visual__pieces">${e.pieces.map((e, t) => {
				let n = e.label ?? (e.value === void 0 ? `${e.min === void 0 ? "…" : r(e.min)} – ${e.max === void 0 ? "…" : r(e.max)}` : String(e.value));
				return `<li class="mx-visual__piece${this.hiddenPieces.has(t) ? " is-hidden" : ""}" data-i="${t}"><i style="background:${e.color}"></i><span>${b(n)}</span></li>`;
			}).join("")}</ul>`;
			return;
		}
		let i = e.map.colors ?? y, a = n === "right" ? "to top" : "to right", [o, s] = e.map.text ?? [r(e.max), r(e.min)];
		this.visualEl.innerHTML = n === "right" ? `<span class="mx-visual__end">${b(o)}</span><i class="mx-visual__bar" style="background:linear-gradient(${a}, ${i.join(", ")})"></i><span class="mx-visual__end">${b(s)}</span>` : `<span class="mx-visual__end">${b(s)}</span><i class="mx-visual__bar" style="background:linear-gradient(${a}, ${i.join(", ")})"></i><span class="mx-visual__end">${b(o)}</span>`;
	}
	measure() {
		let e = this.plotEl.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height));
		for (let e of [this.canvas, this.overlay]) e.width = Math.round(this.width * this.dpr), e.height = Math.round(this.height * this.dpr), e.style.width = `${this.width}px`, e.style.height = `${this.height}px`;
	}
	font(e, t = 400) {
		return `${t} ${e}px ${this.theme.font}`;
	}
	padding() {
		let e = this.opts.padding ?? 8;
		return typeof e == "number" ? [
			e,
			e,
			e,
			e
		] : e;
	}
	layout() {
		let e = this.opts, [t, n, r, i] = this.padding(), a = Math.max(1, this.width - i - n), c = Math.max(1, this.height - t - r), l = this.headerShown(e.x) ? this.xh.levels : 0, u = this.headerShown(e.y) ? this.yh.levels : 0, d = e.x?.label?.fontSize ?? 12, f = (e, t) => {
			let n = e?.levelSize;
			return e?.levels?.[t]?.size ?? (Array.isArray(n) ? n[t] : n);
		}, p = Array.from({ length: l }, (t, n) => f(e.x, n) ?? Math.round(d * 2 + 2)), m = p.reduce((e, t) => e + t, 0);
		m > c * .4 && (p = p.map((e) => e * c * .4 / m));
		let h = e.y?.label?.fontSize ?? 12, g = Array.from({ length: u }, (t, n) => {
			let r = f(e.y, n);
			if (r !== void 0) return r;
			let i = 0;
			for (let e of this.headerItems) if (e.info.kind === "y" && e.node.level === n) {
				this.ctx.font = this.font(e.label.fontSize ?? h, e.label.fontWeight ?? 500);
				for (let t of e.info.text.split("\n")) i = Math.max(i, this.ctx.measureText(t).width);
			}
			return Math.ceil(i + 2 * (e.y?.label?.padding ?? 6) + 4);
		}), _ = g.reduce((e, t) => e + t, 0);
		_ > a * .4 && (g = g.map((e) => e * a * .4 / _));
		let v = g.reduce((e, t) => e + t, 0), y = p.reduce((e, t) => e + t, 0), b = Math.max(1, a - v), x = Math.max(1, c - y);
		if (e.cellAspect && this.nx && this.ny) {
			let t = e.cellAspect;
			b / this.nx > t * x / this.ny ? b = t * x * this.nx / this.ny : x = b * this.ny / (this.nx * t);
		}
		let S = i + (a - v - b) / 2, C = t + (c - y - x) / 2, w = (e, t) => t.leaves.map((t, n) => t.item.size ?? (Array.isArray(e?.cellSize) ? e.cellSize[n] : e?.cellSize));
		this.yLevels = s(g, S), this.xLevels = s(p, C), this.cols = s(o(w(e.x, this.xh), b, e.x?.minCellSize ?? 0), S + v), this.rows = s(o(w(e.y, this.yh), x, e.y?.minCellSize ?? 0), C + y);
		let T = this.cols.offsets[0], E = this.rows.offsets[0];
		this.bodyRect = {
			x: T,
			y: E,
			w: this.cols.offsets[this.nx] - T,
			h: this.rows.offsets[this.ny] - E
		};
		for (let e of this.bodyItems) e.info.rect = this.rangeRect(e.x0, e.x1, e.y0, e.y1);
		for (let e of this.headerItems) {
			let t = e.node;
			if (e.info.kind === "x") {
				let n = this.rangeRect(t.start, t.start + t.span - 1, 0, 0);
				e.info.rect = {
					x: n.x,
					y: this.xLevels.offsets[t.level],
					w: n.w,
					h: this.xLevels.offsets[t.level + t.depth] - this.xLevels.offsets[t.level]
				};
			} else {
				let n = this.rangeRect(0, 0, t.start, t.start + t.span - 1);
				e.info.rect = {
					x: this.yLevels.offsets[t.level],
					y: n.y,
					w: this.yLevels.offsets[t.level + t.depth] - this.yLevels.offsets[t.level],
					h: n.h
				};
			}
		}
		this.cornerItem && (this.cornerItem.info.rect = {
			x: this.yLevels.offsets[0],
			y: this.xLevels.offsets[0],
			w: v,
			h: y
		});
	}
	rangeRect(e, t, n, r) {
		let i = this.cols.offsets, a = this.rows.offsets, o = i[x(e, 0, this.nx)] ?? 0, s = i[x(t + 1, 0, this.nx)] ?? o, c = a[x(n, 0, this.ny)] ?? 0, l = a[x(r + 1, 0, this.ny)] ?? c;
		return {
			x: o,
			y: c,
			w: s - o,
			h: l - c
		};
	}
	paintRect(e) {
		let t = (this.opts.gap ?? 0) / 2;
		return {
			x: e.x + t,
			y: e.y + t,
			w: Math.max(0, e.w - 2 * t),
			h: Math.max(0, e.h - 2 * t)
		};
	}
	syncHosts(e) {
		let t = /* @__PURE__ */ new Map(), n = this.opts.mountPadding ?? 2;
		for (let r of this.bodyItems) {
			if (r.blank || r.hidden || !r.mount) continue;
			let i = r.info.id, a = r.info.data?.data, o = this.hosts.get(i);
			if (o && o.mount === r.mount && Object.is(o.value, r.info.value) && o.data === a) {
				o.item = r, t.set(i, o), this.hosts.delete(i);
				continue;
			}
			let s = document.createElement("div");
			s.className = "mx-cell-host", s.style.setProperty("--mx-pad", `${n}px`);
			let c = {
				el: s,
				cleanup: void 0,
				mount: r.mount,
				value: r.info.value,
				data: a,
				item: r
			};
			s.addEventListener("pointerenter", () => this.setHover(c.item, null)), s.addEventListener("pointerleave", (e) => {
				e.relatedTarget !== this.overlay && this.hover === c.item && this.setHover(null, null);
			}), s.addEventListener("click", () => this.clickItem(c.item)), this.hostsEl.append(s), t.set(i, c), e && (s.style.opacity = "0", s.style.transitionDelay = `${Math.round(r.delay)}ms`);
		}
		for (let e of this.hosts.values()) this.unmount(e);
		this.hosts = t, this.placeHosts();
		for (let e of this.hosts.values()) if (!(e.cleanup !== void 0 || e.el.dataset.mounted)) {
			e.el.dataset.mounted = "1";
			try {
				e.cleanup = e.mount(e.el, e.item.info);
			} catch (e) {
				console.error("[matrix] mount failed", e);
			}
		}
		e && requestAnimationFrame(() => requestAnimationFrame(() => {
			for (let e of this.hosts.values()) e.el.style.opacity = "";
		}));
	}
	placeHosts() {
		let e = this.opts.mountPadding ?? 2;
		for (let t of this.hosts.values()) {
			let n = this.paintRect(t.item.info.rect), r = t.el.style;
			r.left = `${n.x + e}px`, r.top = `${n.y + e}px`, r.width = `${Math.max(0, n.w - 2 * e)}px`, r.height = `${Math.max(0, n.h - 2 * e)}px`, r.display = n.w - 2 * e < 2 || n.h - 2 * e < 2 ? "none" : "";
		}
	}
	unmount(e) {
		try {
			typeof e.cleanup == "function" && e.cleanup();
		} catch (e) {
			console.error("[matrix] cleanup failed", e);
		}
		e.el.remove();
	}
	loop() {
		if (cancelAnimationFrame(this.raf), this.destroyed) return;
		let e = this.duration() + this.stagger();
		this.progress = this.animStart ? x((performance.now() - this.animStart) / (e || 1), 0, 1) : 1, this.draw(), this.drawOverlay(), this.progress < 1 ? this.raf = requestAnimationFrame(() => this.loop()) : this.animStart = 0;
	}
	anim(e) {
		if (!this.animStart) return [1, 1];
		let t = S(x((performance.now() - this.animStart - e.delay) / (this.duration() || 1), 0, 1));
		return [t, .6 + .4 * t];
	}
	api() {
		return {
			cellRect: (e, t) => this.cellRect(e, t),
			column: (e) => ({
				x: this.cols.offsets[e] ?? 0,
				w: this.cols.sizes[e] ?? 0
			}),
			row: (e) => ({
				y: this.rows.offsets[e] ?? 0,
				h: this.rows.sizes[e] ?? 0
			}),
			body: { ...this.bodyRect },
			width: this.width,
			height: this.height,
			theme: this.theme,
			hover: this.hover?.info ?? null,
			progress: this.animStart ? S(this.progress) : 1,
			cells: this.bodyItems.filter((e) => !e.blank).map((e) => e.info),
			colorOf: (e) => this.vm ? this.visualColor(e).color : ""
		};
	}
	draw() {
		if (this.destroyed) return;
		let e = this.ctx, t = this.theme;
		e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.clearRect(0, 0, this.width, this.height), C(t.background) || (e.fillStyle = t.background, e.fillRect(0, 0, this.width, this.height));
		let n = this.api(), r = (this.opts.emptyCells ?? "show") === "hide";
		for (let e of this.bodyItems) e.hidden || r && e.blank || this.drawItem(e, n);
		for (let e of this.headerItems) this.drawItem(e, n);
		if (this.cornerItem && this.drawItem(this.cornerItem, n), this.opts.graphic) {
			e.save();
			try {
				this.opts.graphic(e, n);
			} catch (e) {
				console.error("[matrix] graphic failed", e);
			}
			e.restore();
		}
	}
	drawItem(e, t) {
		let n = this.ctx, r = this.paintRect(e.info.rect);
		if (r.w <= 0 || r.h <= 0) return;
		let [i, a] = this.anim(e);
		if (i <= .001) return;
		let o = e.piece >= 0 && this.hiddenPieces.has(e.piece), s = i * e.style.opacity * (o ? .12 : 1), c = a === 1 ? r : {
			x: r.x + r.w * (1 - a) / 2,
			y: r.y + r.h * (1 - a) / 2,
			w: r.w * a,
			h: r.h * a
		};
		n.globalAlpha = s;
		let l = e.style, u = Math.min(l.radius, c.w / 2, c.h / 2), d = () => {
			n.beginPath(), u > 0 ? n.roundRect(c.x, c.y, c.w, c.h, u) : n.rect(c.x, c.y, c.w, c.h);
		};
		if (C(l.color) || (n.fillStyle = l.color, d(), n.fill()), e.render) {
			n.save(), d(), n.clip();
			try {
				e.render(n, c, e.info, t);
			} catch (e) {
				console.error("[matrix] renderCell failed", e);
			}
			n.restore(), n.globalAlpha = s;
		}
		if (l.borderWidth > 0 && !C(l.borderColor)) {
			n.strokeStyle = l.borderColor, n.lineWidth = l.borderWidth;
			let e = l.borderWidth % 2 ? .5 : 0;
			n.beginPath(), u > 0 ? n.roundRect(c.x + e, c.y + e, c.w, c.h, u) : n.rect(c.x + e, c.y + e, c.w, c.h), n.stroke();
		}
		e.label.show && e.info.text && !o && this.drawLabel(e, c), n.globalAlpha = 1;
	}
	contrast(t) {
		let r = this.textColors.get(t);
		if (!r) {
			let [, , , i] = e(t);
			r = i < .45 ? "" : n(t) > .42 ? "#131722" : "#ffffff", this.textColors.set(t, r);
		}
		return r;
	}
	drawLabel(e, t) {
		let n = this.ctx, r = e.label, i = r.padding ?? (e.info.kind === "y" ? 6 : 4), a = e.info.text.split("\n"), o = e.info.kind, s = r.fontSize ?? (o === "body" ? 12 : o === "corner" ? 11 : 12), c = Math.min(s, (t.h - 2) / (a.length * 1.2));
		if (c < 6) return;
		let l = t.w - 2 * i, u = r.fontWeight ?? (o === "body" ? 400 : 500);
		n.font = this.font(c, u);
		let d = Math.max(...a.map((e) => n.measureText(e).width));
		if (d > l && c > 7 && (c = Math.max(7, c * l / d), n.font = this.font(c, u)), l < c) return;
		let f = e.style.color;
		n.fillStyle = r.color ?? (!C(f) && o === "body" && this.contrast(f) || e.defaultTextColor);
		let p = r.align ?? "center";
		n.textAlign = p, n.textBaseline = "middle";
		let m = p === "left" ? t.x + i : p === "right" ? t.x + t.w - i : t.x + t.w / 2, h = c * 1.2, g = r.verticalAlign ?? "middle", _ = g === "top" ? t.y + i + h / 2 : g === "bottom" ? t.y + t.h - i - (a.length - .5) * h : t.y + t.h / 2 - (a.length - 1) * h / 2, v = o === "body" && typeof e.info.value == "number";
		a.forEach((e, t) => {
			let r = v ? n.measureText(e).width <= l + .5 ? e : "" : this.fit(e, l);
			r && n.fillText(r, m, _ + t * h);
		});
	}
	fit(e, t) {
		let n = this.ctx;
		if (n.measureText(e).width <= t) return e;
		let r = 0, i = e.length;
		for (; r < i;) {
			let a = r + i + 1 >> 1;
			n.measureText(`${e.slice(0, a)}…`).width <= t ? r = a : i = a - 1;
		}
		return r ? `${e.slice(0, r)}…` : "";
	}
	drawOverlay() {
		if (this.destroyed) return;
		let e = this.octx;
		e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.clearRect(0, 0, this.width, this.height);
		let t = this.theme, n = this.hover, r = this.opts.emphasis ?? "cross";
		if (n && r && (!this.animStart || this.progress >= 1)) {
			let i = this.bodyRect, a = this.yLevels.offsets[0], o = this.xLevels.offsets[0];
			e.fillStyle = t.hover;
			let s = n.info.kind, c = (t, n) => {
				let r = this.rangeRect(0, 0, t, n);
				e.fillRect(a, r.y, i.x + i.w - a, r.h);
			}, l = (t, n) => {
				let r = this.rangeRect(t, n, 0, 0);
				e.fillRect(r.x, o, r.w, i.y + i.h - o);
			};
			if (s === "body") {
				if ((r === "cross" || r === "row") && c(n.y0, n.y1), (r === "cross" || r === "column") && l(n.x0, n.x1), r === "cross") {
					let t = n.info.rect;
					e.clearRect(t.x, t.y, t.w, t.h);
				}
				let i = this.paintRect(n.info.rect);
				n.mount || (e.strokeStyle = t.text, e.globalAlpha = .85, e.lineWidth = 1.5, e.strokeRect(i.x + .75, i.y + .75, Math.max(0, i.w - 1.5), Math.max(0, i.h - 1.5)), e.globalAlpha = 1);
			} else s === "x" ? l(n.x0, n.x1) : s === "y" && c(n.y0, n.y1);
		}
		if (this.selected.size) {
			e.strokeStyle = t.select, e.lineWidth = 2, e.fillStyle = t.select;
			for (let t of this.bodyItems) {
				if (!this.selected.has(t.info.id)) continue;
				let n = this.paintRect(t.info.rect);
				e.globalAlpha = .14, e.fillRect(n.x, n.y, n.w, n.h), e.globalAlpha = 1, e.strokeRect(n.x + 1, n.y + 1, Math.max(0, n.w - 2), Math.max(0, n.h - 2));
			}
		}
	}
	hitTest(e, t) {
		let n = c(this.cols.offsets, e), r = c(this.rows.offsets, t);
		if (n >= 0 && r >= 0) {
			let e = this.grid[r * this.nx + n], t = e >= 0 ? this.bodyItems[e] : null;
			return t && !t.silent ? t : null;
		}
		let i = c(this.xLevels.offsets, t);
		if (n >= 0 && i >= 0) return this.headerItems.find((e) => e.info.kind === "x" && e.node.level <= i && i < e.node.level + e.node.depth && e.x0 <= n && n <= e.x1) ?? null;
		let a = c(this.yLevels.offsets, e);
		return r >= 0 && a >= 0 ? this.headerItems.find((e) => e.info.kind === "y" && e.node.level <= a && a < e.node.level + e.node.depth && e.y0 <= r && r <= e.y1) ?? null : null;
	}
	setHover(e, t) {
		e !== this.hover && (this.hover = e, this.emit("hover", e ? e.info : null), this.opts.graphic && this.draw(), this.drawOverlay()), this.canvas.style.cursor = "", this.overlay.style.cursor = e && (this.handlers.get("click")?.size || this.opts.select) ? "pointer" : "", this.showTooltip(t);
	}
	clickItem(e) {
		let t = this.opts.select ?? !1;
		if (e && this.emit("click", e.info), !t) return;
		let n = t === "multiple", r = e?.info.kind, i = [];
		r === "body" ? i = [e] : r === "x" ? i = this.bodyItems.filter((t) => !t.blank && t.x0 >= e.x0 && t.x1 <= e.x1) : r === "y" && (i = this.bodyItems.filter((t) => !t.blank && t.y0 >= e.y0 && t.y1 <= e.y1));
		let a = i.map((e) => e.info.id), o = a.length > 0 && a.every((e) => this.selected.has(e));
		if (n) o ? a.forEach((e) => this.selected.delete(e)) : a.forEach((e) => this.selected.add(e));
		else {
			let e = o && this.selected.size === a.length;
			this.selected.clear(), e || a.forEach((e) => this.selected.add(e));
		}
		this.drawOverlay(), this.emit("select", this.getSelection());
	}
	bind() {
		let e = (e) => {
			let t = this.overlay.getBoundingClientRect();
			return {
				x: e.clientX - t.left,
				y: e.clientY - t.top
			};
		};
		this.overlay.addEventListener("pointermove", (t) => {
			let { x: n, y: r } = e(t);
			this.setHover(this.hitTest(n, r), t);
		}), this.overlay.addEventListener("pointerleave", (e) => {
			e.relatedTarget?.closest?.(".mx-cell-host") || this.setHover(null, null);
		}), this.overlay.addEventListener("click", (t) => {
			let { x: n, y: r } = e(t);
			this.clickItem(this.hitTest(n, r));
		}), this.visualEl.addEventListener("click", (e) => {
			let t = e.target.closest(".mx-visual__piece");
			t && this.togglePiece(Number(t.dataset.i));
		});
	}
	showTooltip(e) {
		let t = this.opts.tooltip ?? !0, n = this.tooltipEl, r = this.hover, i = typeof t == "object" ? t : {};
		if (!r || !e || t === !1 || i.show === !1 || r.mount || r.info.kind !== "body" && !i.headers || r.info.kind === "corner") {
			n.classList.remove("is-visible");
			return;
		}
		let a = r.info;
		if (i.formatter) n.innerHTML = i.formatter(a);
		else if (a.kind === "body") {
			let e = a.value, t = a.text || (typeof e == "number" ? this.fmt(e) : typeof e == "string" ? e : "");
			n.innerHTML = (a.xPath.length ? `<div class="mx-tooltip__sub">${b(a.xPath.join(" › "))}</div>` : "") + `<div class="mx-tooltip__head">${a.color ? `<i class="mx-tooltip__dot" style="background:${a.color}"></i>` : ""}${b(a.yPath.join(" › ") || a.xName)}</div>` + (t ? `<div class="mx-tooltip__row"><span>Valor</span><b>${b(t.replace(/\n/g, " "))}</b></div>` : "");
		} else n.innerHTML = `<div class="mx-tooltip__head">${b((a.kind === "x" ? a.xPath : a.yPath).join(" › "))}</div>`;
		if (!n.innerHTML) {
			n.classList.remove("is-visible");
			return;
		}
		n.classList.add("is-visible");
		let o = this.plotEl.getBoundingClientRect(), s = e.clientX - o.left, c = e.clientY - o.top, l = n.offsetWidth, u = n.offsetHeight, d = s + 14 + l > this.width ? s - 14 - l : s + 14, f = x(c + 14 + u > this.height ? c - 14 - u : c + 14, 0, Math.max(0, this.height - u));
		n.style.transform = `translate(${Math.max(0, d)}px, ${f}px)`;
	}
};
function T(e, t = {}) {
	return new w(e, t);
}
//#endregion
export { g as a, i as c, s as d, p as f, T as i, c as l, o as m, y as n, _ as o, u as p, w as r, d as s, v as t, m as u };

//# sourceMappingURL=matrix.js.map