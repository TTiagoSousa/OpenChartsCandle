//#region src/pie/layout.ts
var e = [
	"#2962ff",
	"#089981",
	"#f23645",
	"#ff9800",
	"#9c27b0",
	"#00bcd4",
	"#e91e63",
	"#4caf50",
	"#ffc107",
	"#3f51b5",
	"#795548",
	"#607d8b"
], t = "#787b86", n = (e) => e.id ?? e.label;
function r(e, r, i, a, o = 0, s) {
	let c = e.filter((e) => Number.isFinite(e.value) && e.value > 0), l = /* @__PURE__ */ new Map();
	c.forEach((e, t) => l.set(n(e), e.color ?? r.colors[t % r.colors.length]));
	let u = [...c];
	r.sort === "desc" ? u.sort((e, t) => t.value - e.value) : r.sort === "asc" && u.sort((e, t) => e.value - t.value);
	let d = [];
	if (r.groupBelow > 0) {
		let e = u.reduce((e, t) => e + t.value, 0), t = u.filter((t) => t.value / e * 100 < r.groupBelow);
		t.length >= 2 && (d = t, u = u.filter((e) => !t.includes(e)));
	}
	let f = u.map((e) => ({
		datum: e,
		grouped: !1
	}));
	d.length && f.push({
		datum: {
			id: "__others__",
			label: r.othersLabel,
			value: d.reduce((e, t) => e + t.value, 0),
			color: t
		},
		grouped: !0,
		children: d
	});
	let p = f.reduce((e, t) => e + (i.has(n(t.datum)) ? 0 : t.datum.value), 0);
	return f.map((e, t) => {
		let r = n(e.datum), c = i.has(r);
		return {
			id: r,
			label: e.datum.label,
			value: e.datum.value,
			percent: c || p === 0 ? 0 : e.datum.value / p * 100,
			color: e.datum.color ?? l.get(r) ?? "#787b86",
			index: t,
			hidden: c,
			ring: o,
			ringName: s,
			selected: a.has(r),
			grouped: e.grouped,
			children: e.children,
			datum: e.datum
		};
	});
}
function i(e, t, n, r, i = 0, a = !0) {
	let o = n - t, s = e.filter((e) => !e.hidden), c = s.reduce((e, t) => e + t.value, 0), l = Math.max(...s.map((e) => e.value), 0), u = r === !0 || r === "area", d = e.map((e) => e.hidden || c <= 0 ? 0 : u ? o / s.length : e.value / c * o);
	if (i > 0 && !u && s.length) {
		let t = Math.min(i, o / s.length), n = d.map((n, r) => !e[r].hidden && n < t), r = n.filter(Boolean).length * t, a = d.reduce((e, t, r) => e + (n[r] ? 0 : t), 0), c = a > 0 ? (o - r) / a : 0;
		d = d.map((r, i) => e[i].hidden ? 0 : n[i] ? t : r * c);
	}
	let f = (e) => !r || l <= 0 ? 1 : r === !0 ? .25 + .75 * Math.sqrt(e / l) : .15 + e / l * .85, p = t;
	return e.map((e, r) => {
		let i = d[r], o = p, s = p + i;
		return a || ([o, s] = [t + n - s, t + n - o]), p += i, {
			a0: o,
			a1: s,
			r: f(e.value)
		};
	});
}
function a(e, t) {
	let n = [
		0,
		Math.cos(e),
		Math.cos(t)
	], r = [
		0,
		Math.sin(e),
		Math.sin(t)
	], i = Math.min(e, t), a = Math.max(e, t);
	for (let e = Math.ceil(i / (Math.PI / 2)); Math.PI / 2 * e <= a; e++) {
		let t = Math.PI / 2 * e;
		n.push(Math.cos(t)), r.push(Math.sin(t));
	}
	return {
		minX: Math.min(...n),
		maxX: Math.max(...n),
		minY: Math.min(...r),
		maxY: Math.max(...r)
	};
}
function o(e, t, n, r, i) {
	let o = a(n, r), s = Math.max(1, e - i.x * 2), c = Math.max(1, t - i.y * 2), l = Math.max(4, Math.min(s / (o.maxX - o.minX), c / (o.maxY - o.minY)));
	return {
		cx: i.x + (s - (o.maxX - o.minX) * l) / 2 - o.minX * l,
		cy: i.y + (c - (o.maxY - o.minY) * l) / 2 - o.minY * l,
		radius: l
	};
}
function s(e, t) {
	let n = Math.PI * 2, r = (e - t) % n;
	return r < 0 && (r += n), t + r;
}
function c(e, t, n, r) {
	let i = (e, n) => e.h === void 0 && n.h === void 0 ? t : ((e.h ?? t) + (n.h ?? t)) / 2 + 2;
	for (let t of [!0, !1]) {
		let a = e.filter((e) => e.right === t).sort((e, t) => e.y - t.y);
		for (let e = 1; e < a.length; e++) {
			let t = i(a[e - 1], a[e]);
			a[e].y - a[e - 1].y < t && (a[e].y = a[e - 1].y + t);
		}
		let o = a[a.length - 1], s = o ? o.y + (o.h ?? 0) / 2 - r : 0;
		if (s > 0) {
			o.y -= s;
			for (let e = a.length - 2; e >= 0; e--) {
				let t = i(a[e], a[e + 1]);
				a[e + 1].y - a[e].y < t && (a[e].y = a[e + 1].y - t);
			}
		}
		for (let e of a) e.y = Math.max(n + (e.h ?? 0) / 2, e.y);
	}
	return e;
}
//#endregion
//#region src/pie/pie.ts
var l = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", u = Math.PI / 180, d = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	line: "#5d606b",
	sliceBorder: "#131722",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: l
}, f = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	line: "#b2b5be",
	sliceBorder: "#ffffff",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: l
}, p = [
	"diagonal",
	"dots",
	"stripes",
	"cross",
	"grid",
	"checker",
	"zigzag"
], m = (e = {}) => ({
	show: !0,
	position: "auto",
	content: "percent",
	minPercent: 3,
	fontSize: 12,
	fontWeight: 600,
	lineLength: 18,
	radialLength: 12,
	alignTo: "line",
	edgeDistance: 10,
	lineSmooth: !1,
	showLine: !0,
	...e
});
function h(t) {
	let n = t.startAngle ?? -90, r = t.theme === "light" ? f : d, i = typeof t.theme == "object" ? {
		...r,
		...t.theme
	} : { ...r };
	t.background !== void 0 && (i.background = t.background);
	let a = typeof t.theme == "object" && !!t.theme.sliceBorder;
	a || (i.sliceBorder = i.background);
	let o = !a && i.background === "transparent", s = Math.min(.95, Math.max(0, t.innerRadius ?? 0)), c = t.animation ?? !0, l = typeof c == "object" ? c : {}, u = t.shadow ? {
		color: "rgba(0,0,0,0.45)",
		blur: 12,
		offsetY: 3,
		...t.shadow
	} : !1;
	return {
		background: i.background,
		padding: Math.max(0, t.padding ?? 0),
		scale: Math.min(1, Math.max(.3, t.scale ?? 1)),
		emptyText: t.emptyText ?? "Sem dados",
		innerRadius: s,
		outerRadius: Math.min(1, Math.max(.05, t.outerRadius ?? 1)),
		startAngle: n,
		endAngle: t.endAngle ?? n + 360,
		padAngle: t.padAngle ?? 0,
		cornerRadius: t.cornerRadius ?? 0,
		rose: t.rose ?? !1,
		clockwise: t.clockwise ?? !0,
		minSliceAngle: Math.max(0, t.minSliceAngle ?? 0),
		gradient: t.gradient ?? !1,
		patterns: t.patterns === !0 ? p : Array.isArray(t.patterns) && t.patterns.length ? t.patterns : null,
		shadow: u,
		hoverDim: Math.min(1, Math.max(0, t.hoverDim ?? .55)),
		borderWidth: t.borderWidth ?? 1,
		sort: t.sort ?? "none",
		groupBelow: t.groupBelow ?? 0,
		othersLabel: t.othersLabel ?? "Outros",
		colors: t.colors?.length ? t.colors : e,
		labels: m(t.labels),
		legend: {
			show: !0,
			position: "right",
			interactive: !0,
			values: !0,
			marker: "square",
			fontSize: 13,
			align: "center",
			...t.legend ?? {}
		},
		tooltip: {
			show: !0,
			followCursor: !0,
			showValue: !0,
			showPercent: !0,
			...t.tooltip ?? {}
		},
		center: {
			show: s > 0,
			title: "Total",
			followHover: !0,
			fontScale: 1,
			...t.center ?? {}
		},
		hoverOffset: t.hoverOffset ?? 8,
		selectable: t.selectable ?? !0,
		selectOffset: t.selectOffset ?? 14,
		valueFormatter: t.valueFormatter ?? ((e) => e.toLocaleString("pt-PT", { maximumFractionDigits: 2 })),
		percentFormatter: t.percentFormatter ?? ((e) => `${e.toFixed(1)}%`),
		theme: i,
		cutGaps: o,
		duration: c === !1 ? 0 : l.duration ?? 700,
		animType: l.type ?? "sweep",
		easing: l.easing ?? "cubic",
		stagger: l.stagger ?? 0
	};
}
function g(e, t) {
	let n = e.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i);
	if (!n) return e;
	let r = t > 0 ? 255 : 0, i = Math.abs(t);
	return "#" + [
		n[1],
		n[2],
		n[3]
	].map((e) => Math.round(parseInt(e, 16) + (r - parseInt(e, 16)) * i).toString(16).padStart(2, "0")).join("");
}
var _ = (e) => 1 - (1 - e) ** 3, v = (e) => e <= 0 ? 0 : e >= 1 ? 1 : 2 ** (-10 * e) * Math.sin((e - .075) * 2 * Math.PI / .3) + 1;
function y(e) {
	let t = e.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i), n = t ? [
		t[1],
		t[2],
		t[3]
	].map((e) => parseInt(e, 16)) : null;
	if (!n) {
		let t = e.match(/^rgba?\(([^)]+)\)/i);
		t && (n = t[1].split(/[\s,/]+/).slice(0, 3).map(Number));
		let r = e.match(/^hsla?\([^,\s]+[\s,]+[^,\s]+[\s,]+([\d.]+)%/i);
		if (r) return Number(r[1]) > 62 ? "#131722" : "#ffffff";
	}
	if (!n) return "#ffffff";
	let [r, i, a] = n;
	return .299 * r + .587 * i + .114 * a > 165 ? "#131722" : "#ffffff";
}
var b = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), x = (e, t) => `${e}|${t}`, S = class {
	constructor(e, t = {}) {
		this.layers = [], this.hidden = /* @__PURE__ */ new Set(), this.selected = /* @__PURE__ */ new Set(), this.hoverKey = null, this.geom = /* @__PURE__ */ new Map(), this.from = /* @__PURE__ */ new Map(), this.target = /* @__PURE__ */ new Map(), this.delays = /* @__PURE__ */ new Map(), this.offsets = /* @__PURE__ */ new Map(), this.patternCache = /* @__PURE__ */ new Map(), this.animStart = 0, this.raf = 0, this.lastFrame = 0, this.width = 0, this.height = 0, this.dpr = 1, this.titleH = 0, this.layoutCache = {
			cx: 0,
			cy: 0,
			radius: 0
		}, this.handlers = /* @__PURE__ */ new Map(), this.firstData = !0, this.legendHover = !1, this.opts = { ...t }, this.o = h(this.opts), this.root = e, e.classList.add("pc-root"), this.plot = document.createElement("div"), this.plot.className = "pc-plot", this.canvas = document.createElement("canvas"), this.canvas.className = "pc-canvas", this.canvas.setAttribute("role", "img"), this.ctx = this.canvas.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "pc-tooltip", this.titleEl = document.createElement("div"), this.titleEl.className = "pc-title", this.legendEl = document.createElement("ul"), this.legendEl.className = "pc-legend", this.plot.append(this.canvas, this.titleEl, this.tooltipEl), e.append(this.plot, this.legendEl), this.applyDomOptions(), this.bind(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(this.plot), this.resize(), this.recompute(!0);
	}
	setData(e) {
		this.opts.data = e, this.o = h(this.opts);
		let t = new Set([...e, ...(this.opts.rings ?? []).flatMap((e) => e.data)].map((e) => e.id ?? e.label));
		for (let e of [...this.hidden]) !t.has(e) && e !== "__others__" && this.hidden.delete(e);
		this.recompute(!0);
	}
	setOptions(e, t = !0) {
		this.opts = {
			...this.opts,
			...e
		}, this.o = h(this.opts), this.patternCache.clear(), this.applyDomOptions(), this.recompute(t);
	}
	get slices() {
		return (this.layers[0]?.slices ?? []).map((e) => ({ ...e }));
	}
	get total() {
		return this.layerTotal(0);
	}
	toggle(e, t) {
		t ?? !this.hidden.has(e) ? this.hidden.add(e) : this.hidden.delete(e), this.recompute(!0), this.emit("toggle", this.findSlice(e));
	}
	select(e) {
		let t = e === null ? 0 : this.layers.find((t) => t.slices.some((t) => t.id === e))?.ring ?? 0;
		this.selectKey(e === null ? null : x(t, e));
	}
	highlight(e) {
		let t = e === null ? null : this.findSlice(e);
		this.setHover(t ? x(t.ring, t.id) : null);
	}
	on(e, t) {
		return this.handlers.has(e) || this.handlers.set(e, /* @__PURE__ */ new Set()), this.handlers.get(e).add(t), () => this.handlers.get(e)?.delete(t);
	}
	screenshot() {
		return this.draw(), this.canvas.toDataURL("image/png");
	}
	destroy() {
		cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("pc-root", "pc-legend-right", "pc-legend-left", "pc-legend-top", "pc-legend-bottom"), this.plot.remove(), this.legendEl.remove();
	}
	findSlice(e) {
		for (let t of this.layers) {
			let n = t.slices.find((t) => t.id === e);
			if (n) return n;
		}
		return null;
	}
	sliceByKey(e) {
		if (!e) return null;
		let t = e.indexOf("|"), n = +e.slice(0, t), r = e.slice(t + 1);
		return this.layers[n]?.slices.find((e) => e.id === r) ?? null;
	}
	layerTotal(e) {
		return (this.layers[e]?.slices ?? []).reduce((e, t) => e + (t.hidden ? 0 : t.value), 0);
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t ? { ...t } : null));
	}
	selectKey(e) {
		let t = e !== null && this.selected.has(e);
		this.selected.clear(), e !== null && !t && this.selected.add(e), this.recompute(!1), this.emit("select", e && !t ? this.sliceByKey(e) : null);
	}
	applyDomOptions() {
		let e = this.o.theme, t = this.o.legend.position, n = this.o.legend;
		this.root.classList.remove("pc-legend-right", "pc-legend-left", "pc-legend-top", "pc-legend-bottom"), this.root.classList.add(`pc-legend-${t}`), this.legendEl.style.display = n.show ? "" : "none", this.legendEl.className = `pc-legend pc-legend--${n.marker} pc-legend--align-${n.align}`, this.legendEl.style.fontSize = `${n.fontSize}px`;
		let r = {
			"--pc-bg": e.background,
			"--pc-text": e.text,
			"--pc-muted": e.muted,
			"--pc-tt-bg": e.tooltipBg,
			"--pc-tt-text": e.tooltipText,
			"--pc-tt-border": e.tooltipBorder,
			"--pc-font": e.font
		};
		for (let [e, t] of Object.entries(r)) this.root.style.setProperty(e, t);
		let i = this.opts.title, a = typeof i == "string" ? { text: i } : i;
		this.titleEl.style.display = a ? "" : "none", a && (this.titleEl.innerHTML = `<div class="pc-title__text">${b(a.text)}</div>${a.subtext ? `<div class="pc-title__sub">${b(a.subtext)}</div>` : ""}`, this.titleEl.style.textAlign = a.align ?? "center", this.titleEl.style.color = a.color ?? ""), this.titleH = a ? this.titleEl.offsetHeight : 0;
	}
	buildLayers() {
		let e = this.o;
		return [{
			ring: 0,
			name: this.opts.seriesName,
			data: this.opts.data ?? [],
			inner: e.innerRadius,
			outer: e.outerRadius,
			labels: e.labels,
			colors: e.colors,
			padAngle: e.padAngle,
			cornerRadius: e.cornerRadius,
			rose: e.rose,
			sort: e.sort,
			slices: []
		}, ...(this.opts.rings ?? []).map((t, n) => ({
			ring: n + 1,
			name: t.name,
			data: t.data,
			inner: Math.max(0, Math.min(1, t.innerRadius)),
			outer: Math.max(0, Math.min(1, t.outerRadius)),
			labels: m({
				...this.opts.labels,
				...t.labels
			}),
			colors: t.colors?.length ? t.colors : e.colors,
			padAngle: t.padAngle ?? e.padAngle,
			cornerRadius: t.cornerRadius ?? e.cornerRadius,
			rose: t.rose ?? !1,
			sort: t.sort ?? e.sort,
			slices: []
		}))];
	}
	recompute(e) {
		let t = this.o;
		this.layers = this.buildLayers();
		let n = t.startAngle * u;
		this.from = /* @__PURE__ */ new Map(), this.target = /* @__PURE__ */ new Map(), this.delays = /* @__PURE__ */ new Map();
		let a = 0;
		for (let e of this.layers) {
			let o = new Set([...this.selected].filter((t) => t.startsWith(`${e.ring}|`)).map((e) => e.slice(e.indexOf("|") + 1)));
			e.slices = r(e.data, {
				sort: e.sort,
				groupBelow: e.ring === 0 ? t.groupBelow : 0,
				othersLabel: t.othersLabel,
				colors: e.colors
			}, this.hidden, o, e.ring, e.name);
			let s = i(e.slices, n, t.endAngle * u, e.rose, e.ring === 0 ? t.minSliceAngle * u : 0, t.clockwise);
			e.slices.forEach((r, i) => {
				let o = x(e.ring, r.id), c = s[i];
				this.target.set(o, c);
				let l = this.geom.get(o);
				l ? this.from.set(o, { ...l }) : this.firstData ? this.from.set(o, t.animType === "scale" ? {
					a0: c.a0,
					a1: c.a1,
					r: 0
				} : {
					a0: n,
					a1: n,
					r: c.r
				}) : this.from.set(o, {
					a0: c.a0,
					a1: c.a0,
					r: c.r
				}), this.firstData && t.stagger && this.delays.set(o, t.stagger === "random" ? Math.random() * 400 : a * t.stagger), a++, this.offsets.has(o) || this.offsets.set(o, 0);
			});
		}
		this.layers.some((e) => e.slices.length) && (this.firstData = !1), !e || t.duration === 0 ? (this.geom = new Map([...this.target].map(([e, t]) => [e, { ...t }])), this.animStart = 0) : this.animStart = performance.now(), this.renderLegend(), this.canvas.setAttribute("aria-label", (this.layers[0]?.slices ?? []).filter((e) => !e.hidden).map((e) => `${e.label}: ${t.valueFormatter(e.value)} (${t.percentFormatter(e.percent)})`).join(", ")), this.kick();
	}
	kick() {
		this.raf ||= (this.lastFrame = performance.now(), requestAnimationFrame((e) => this.frame(e)));
	}
	frame(e) {
		this.raf = 0;
		let t = Math.min(.05, (e - this.lastFrame) / 1e3);
		this.lastFrame = e;
		let n = !1;
		if (this.animStart) {
			let t = this.o.easing === "elastic" ? v : _, r = !0;
			this.geom = /* @__PURE__ */ new Map();
			for (let [n, i] of this.target) {
				let a = this.from.get(n) ?? i, o = Math.max(0, Math.min(1, (e - this.animStart - (this.delays.get(n) ?? 0)) / this.o.duration));
				o < 1 && (r = !1);
				let s = t(o);
				this.geom.set(n, {
					a0: a.a0 + (i.a0 - a.a0) * s,
					a1: a.a1 + (i.a1 - a.a1) * s,
					r: a.r + (i.r - a.r) * s
				});
			}
			r ? this.animStart = 0 : n = !0;
		}
		for (let e of this.layers) for (let r of e.slices) {
			let i = x(e.ring, r.id), a = (this.hoverKey === i ? this.o.hoverOffset : 0) + (r.selected ? this.o.selectOffset : 0), o = this.offsets.get(i) ?? 0, s = Math.abs(a - o) < .1 ? a : o + (a - o) * Math.min(1, t * 16);
			this.offsets.set(i, s), s !== a && (n = !0);
		}
		this.draw(), n && this.kick();
	}
	resize() {
		let e = this.plot.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height)), this.canvas.width = Math.round(this.width * this.dpr), this.canvas.height = Math.round(this.height * this.dpr), this.canvas.style.width = `${this.width}px`, this.canvas.style.height = `${this.height}px`, this.opts.title && (this.titleH = this.titleEl.offsetHeight), this.patternCache.clear(), this.draw();
	}
	labelText(e, t) {
		if (typeof t == "function") return t(e);
		let n = this.o.valueFormatter(e.value), r = this.o.percentFormatter(e.percent);
		switch (t) {
			case "value": return n;
			case "label": return e.label;
			case "label-percent": return `${e.label} ${r}`;
			case "label-value": return `${e.label} ${n}`;
			default: return r;
		}
	}
	labelRuns(e, t, n) {
		if (t.rich) return t.rich(e);
		let r = t.content;
		return (n ? this.labelText(e, typeof r == "function" || r !== "percent" ? r : "label-percent") : this.labelText(e, r === "percent" || t.position === "inside" ? r : "percent")).split("\n").map((e) => [{ text: e }]);
	}
	measureRich(e, t) {
		let n = this.ctx, r = this.o.theme.font, i = {
			w: 0,
			h: 0,
			lines: []
		};
		for (let a of e) {
			let e = 0, o = 0, s = a.map((i) => {
				let a = i.fontSize ?? t.fontSize, s = `${i.fontWeight ?? t.fontWeight} ${a}px ${r}`;
				n.font = s;
				let c = i.padding ?? (i.background ? 3 : 0), l = n.measureText(i.text).width + c * 2;
				return e += l, o = Math.max(o, a * 1.3 + c * 2), {
					run: i,
					w: l,
					font: s,
					size: a,
					pad: c
				};
			});
			i.lines.push({
				w: e,
				h: o || t.fontSize * 1.3,
				runs: s
			}), i.w = Math.max(i.w, e), i.h += o || t.fontSize * 1.3;
		}
		return i;
	}
	drawRich(e, t, n, r, i) {
		let a = this.ctx, o = n - e.h / 2;
		a.textBaseline = "middle", a.textAlign = "left";
		for (let n of e.lines) {
			let e = r === "left" ? t : r === "right" ? t - n.w : t - n.w / 2, s = o + n.h / 2;
			for (let t of n.runs) t.run.background && (a.fillStyle = t.run.background, a.beginPath(), a.roundRect(e, s - t.size * .65 - t.pad, t.w, t.size * 1.3 + t.pad * 2, t.run.radius ?? 3), a.fill()), a.font = t.font, a.fillStyle = t.run.color ?? i, a.fillText(t.run.text, e + t.pad, s + .5), e += t.w;
			o += n.h;
		}
	}
	outsideWidth() {
		let e = 0;
		for (let t of this.layers) {
			let n = t.labels;
			if (n.show && n.position !== "inside") for (let r of t.slices) !r.hidden && r.percent >= n.minPercent && (e = Math.max(e, this.measureRich(this.labelRuns(r, n, !0), n).w));
		}
		return e;
	}
	geometry() {
		let e = this.o, t = this.layers.filter((e) => e.labels.show && e.labels.position !== "inside")[0]?.labels, n = Math.max(e.hoverOffset, 0) + (this.selected.size ? e.selectOffset : 0) + 4, r = t ? Math.min(this.outsideWidth() + 6, this.width * (t.alignTo === "edge" ? .22 : .26)) : 0, i = {
			x: (t ? r + t.lineLength + (t.alignTo === "line" ? 0 : t.radialLength) + (t.alignTo === "edge" ? t.edgeDistance : 0) : 0) + n + e.padding,
			y: (t ? 22 : 0) + n + e.padding
		}, a = Math.min(this.width, this.height - this.titleH) * .3;
		i.x = Math.max(e.padding, Math.min(i.x, this.width / 2 - a)), i.y = Math.max(e.padding, Math.min(i.y, (this.height - this.titleH) / 2 - a));
		let s = o(this.width, Math.max(1, this.height - this.titleH), e.startAngle * u, e.endAngle * u, i);
		return s.cy += this.titleH, s.radius *= e.scale, this.layoutCache = s, s;
	}
	slicePath(e, t, n, r, i, a, o, s) {
		let c = Math.min(o * u, (a - i) * .45);
		if (i += c / 2, a -= c / 2, a - i <= 1e-4 || r - n <= .5) return null;
		let l = new Path2D(), d = a - i, f = d >= Math.PI * 2 - .001, p = (n, r) => [e + Math.cos(r) * n, t + Math.sin(r) * n], m = Math.min(s, (r - n) / 2 - .5), h = (e) => e <= 0 || !(2 * Math.asin(Math.min(1, e / (r - e))) >= d * .98 || n > 0 && 2 * Math.asin(Math.min(1, e / (n + e))) >= d * .98);
		for (; m > .5 && !h(m);) m *= .8;
		if (f || m <= .5) return f ? (l.arc(e, t, r, 0, Math.PI * 2), n > 0 && l.arc(e, t, n, Math.PI * 2, 0, !0)) : (l.arc(e, t, r, i, a), n > 0 ? l.arc(e, t, n, a, i, !0) : l.lineTo(e, t), l.closePath()), l;
		let g = (e, t, n, r) => {
			let i = Math.atan2(n[1] - t, n[0] - e), a = Math.atan2(r[1] - t, r[0] - e), o = a - i;
			for (; o > Math.PI;) o -= Math.PI * 2;
			for (; o < -Math.PI;) o += Math.PI * 2;
			l.arc(e, t, m, i, a, o < 0);
		}, _ = r - m, v = Math.asin(m / _), y = Math.sqrt(_ * _ - m * m), [b, x] = p(_, i + v), [S, C] = p(_, a - v), w = p(y, i);
		if (l.moveTo(w[0], w[1]), g(b, x, w, p(r, i + v)), l.arc(e, t, r, i + v, a - v), g(S, C, p(r, a - v), p(y, a)), n > 0) {
			let r = n + m, o = Math.asin(m / r), s = Math.sqrt(r * r - m * m), [c, u] = p(r, a - o), [d, f] = p(r, i + o), h = p(s, a);
			l.lineTo(h[0], h[1]), g(c, u, h, p(n, a - o)), l.arc(e, t, n, a - o, i + o, !0), g(d, f, p(n, i + o), p(s, i));
		} else {
			let e = d / 2, [t, n] = p(c > 0 ? Math.min(m / Math.sin(Math.min(e, Math.PI / 2)), r * .3) : 0, i + e);
			l.lineTo(t, n);
		}
		return l.closePath(), l;
	}
	pattern(e, t) {
		let n = y(t) === "#ffffff" ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.3)", r = `${e}|${n}`;
		if (this.patternCache.has(r)) return this.patternCache.get(r);
		let i = this.dpr, a = document.createElement("canvas");
		a.width = a.height = Math.round(10 * i);
		let o = a.getContext("2d");
		switch (o.scale(i, i), o.strokeStyle = n, o.fillStyle = n, o.lineWidth = 1.6, o.beginPath(), e) {
			case "stripes":
				o.fillRect(0, 2, 10, 2.2);
				break;
			case "diagonal":
				o.moveTo(-1, 11), o.lineTo(11, -1), o.moveTo(-1, 1), o.lineTo(1, -1), o.moveTo(9, 11), o.lineTo(11, 9), o.stroke();
				break;
			case "dots":
				o.arc(5, 5, 1.8, 0, Math.PI * 2), o.fill();
				break;
			case "grid":
				o.fillRect(0, 0, 10, 1.2), o.fillRect(0, 0, 1.2, 10);
				break;
			case "cross":
				o.moveTo(0, 0), o.lineTo(10, 10), o.moveTo(10, 0), o.lineTo(0, 10), o.stroke();
				break;
			case "checker":
				o.fillRect(0, 0, 5, 5), o.fillRect(5, 5, 5, 5);
				break;
			case "zigzag":
				o.moveTo(0, 7), o.lineTo(5, 3), o.lineTo(10, 7), o.stroke();
				break;
			default: return this.patternCache.set(r, null), null;
		}
		let s = this.ctx.createPattern(a, "repeat");
		return s?.setTransform(new DOMMatrix().scale(1 / i)), this.patternCache.set(r, s), s;
	}
	draw() {
		let e = this.ctx, t = this.o, n = t.theme;
		if (e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.clearRect(0, 0, this.width, this.height), n.background !== "transparent" && (e.fillStyle = n.background, e.fillRect(0, 0, this.width, this.height)), !this.layers.some((e) => e.slices.some((e) => !e.hidden))) {
			e.fillStyle = n.muted, e.font = `13px ${n.font}`, e.textAlign = "center", e.textBaseline = "middle", e.fillText(t.emptyText, this.width / 2, this.height / 2 + this.titleH / 2);
			return;
		}
		let { cx: r, cy: i, radius: a } = this.geometry(), o = [], s = this.sliceByKey(this.hoverKey);
		for (let n of this.layers) {
			let c = a * n.inner, l = a * n.outer;
			for (let a of n.slices) {
				let u = x(n.ring, a.id), d = this.geom.get(u);
				if (!d || d.a1 - d.a0 <= 1e-4) continue;
				let f = this.offsets.get(u) ?? 0, p = (d.a0 + d.a1) / 2, m = r + Math.cos(p) * f, h = i + Math.sin(p) * f, _ = c + (l - c) * d.r, v = this.slicePath(m, h, c, _, d.a0, d.a1, n.padAngle, n.cornerRadius);
				if (!v) continue;
				o.push(v), e.save(), e.globalAlpha = s && this.hoverKey !== u && !(this.legendHover && s.id === a.id) ? t.hoverDim : 1, t.shadow && (e.shadowColor = t.shadow.color, e.shadowBlur = t.shadow.blur, e.shadowOffsetY = t.shadow.offsetY);
				let y = a.color;
				if (t.gradient) {
					let t = e.createRadialGradient(m, h, Math.max(0, c), m, h, _);
					t.addColorStop(0, g(a.color, .28)), t.addColorStop(1, g(a.color, -.12)), y = t;
				}
				e.fillStyle = y, e.fill(v);
				let b = a.datum.pattern ?? (t.patterns ? t.patterns[a.index % t.patterns.length] : void 0);
				if (b && b !== "none") {
					let t = this.pattern(b, a.color);
					t && (e.shadowColor = "transparent", e.fillStyle = t, e.fill(v));
				}
				e.restore();
			}
		}
		if (t.borderWidth > 0) {
			if (e.save(), e.lineWidth = t.borderWidth, e.lineJoin = "round", t.cutGaps ? (e.globalCompositeOperation = "destination-out", e.strokeStyle = "#000") : e.strokeStyle = n.sliceBorder, t.cutGaps || n.sliceBorder !== "transparent") for (let t of o) e.stroke(t);
			e.restore();
		}
		this.drawLabels(r, i, a), t.center.show && t.innerRadius > 0 && this.drawCenter(r, i, a * t.innerRadius);
	}
	drawLabels(e, t, n) {
		let r = this.ctx, i = this.o, a = i.theme;
		if (this.animStart !== 0) return;
		let o = [];
		for (let r of this.layers) {
			let a = r.labels;
			if (!a.show) continue;
			let s = n * r.inner, c = n * r.outer;
			for (let n of r.slices) {
				let l = x(r.ring, n.id), u = this.geom.get(l);
				if (!u || n.hidden || n.percent < a.minPercent) continue;
				let d = this.offsets.get(l) ?? 0, f = (u.a0 + u.a1) / 2, p = s + (c - s) * u.r, m = s > 0 ? (s + p) / 2 : p * .62, h = this.measureRich(this.labelRuns(n, a, !1), a), g = (u.a1 - u.a0) * m, _ = h.w < Math.min(g * .9, (p - s) * 1.6) && p - s > h.h * 1.15;
				if ((a.position === "auto" ? _ ? "inside" : "outside" : a.position) === "inside") {
					if (!_ && a.position === "auto") continue;
					this.drawRich(h, e + Math.cos(f) * (m + d), t + Math.sin(f) * (m + d), "center", a.insideColor ?? y(n.color));
					continue;
				}
				let v = this.measureRich(this.labelRuns(n, a, !0), a), b = Math.cos(f) >= 0, S = e + Math.cos(f) * (p + d), C = t + Math.sin(f) * (p + d), w = p + d + a.radialLength, T = e + Math.cos(f) * w, E = t + Math.sin(f) * w, D = a.alignTo === "line" ? e + (b ? 1 : -1) * (c + i.hoverOffset + a.lineLength) : a.alignTo === "none" ? T + (b ? 1 : -1) * a.lineLength : b ? this.width - a.edgeDistance - v.w - 4 : a.edgeDistance + v.w + 4, O = a.alignTo === "line" ? t + Math.sin(f) * (c + 14) : E;
				o.push({
					index: n.index,
					ax: S,
					ay: C,
					x: D,
					y: O,
					right: b,
					h: v.h,
					block: v,
					color: n.color,
					ex: T,
					L: a
				});
			}
		}
		c(o, Math.max(...o.map((e) => e.L.fontSize), 12) + 6, this.titleH + 4, this.height - 4);
		for (let e of o) {
			let t = e.L;
			if (t.showLine) {
				let n = t.alignTo === "line" ? e.x + (e.right ? -8 : 8) : e.ex;
				r.strokeStyle = a.line, r.lineWidth = 1, r.beginPath(), r.moveTo(e.ax, e.ay), t.lineSmooth ? r.quadraticCurveTo(n, e.y, e.x, e.y) : (r.lineTo(n, e.y), r.lineTo(e.x, e.y)), r.stroke(), r.fillStyle = e.color, r.beginPath(), r.arc(e.ax, e.ay, 2, 0, Math.PI * 2), r.fill();
			}
			this.drawRich(e.block, e.x + (e.right ? 4 : -4), e.y, e.right ? "left" : "right", t.color ?? a.text);
		}
	}
	drawCenter(e, t, n) {
		if (n < 26) return;
		let r = this.ctx, i = this.o, a = i.theme, o = i.center.followHover ? this.sliceByKey(this.hoverKey) : null, s = this.total, c = o ? i.valueFormatter(o.value) : typeof i.center.value == "function" ? i.center.value(s) : i.center.value ?? i.valueFormatter(s), l = o ? `${o.label} · ${i.percentFormatter(o.percent)}` : i.center.title, u = Math.abs(i.endAngle - i.startAngle) <= 180 ? t - n * .3 : t, d = i.center, f = Math.max(10, Math.min(34, n * .36) * d.fontScale);
		for (r.font = `700 ${f}px ${a.font}`; f > 11 && r.measureText(c).width > n * 1.6;) --f, r.font = `700 ${f}px ${a.font}`;
		r.textAlign = "center", r.textBaseline = "middle", r.fillStyle = o ? o.color : d.valueColor ?? a.text, r.fillText(c, e, u - f * .25), r.font = `${Math.max(11, f * .42)}px ${a.font}`, r.fillStyle = d.titleColor ?? a.muted, r.fillText(l, e, u + f * .62);
	}
	sliceAt(e, t) {
		let { cx: n, cy: r, radius: i } = this.layoutCache, a = this.o.startAngle * u;
		for (let o of this.layers) {
			let c = i * o.inner, l = i * o.outer;
			for (let i of o.slices) {
				let u = x(o.ring, i.id), d = this.geom.get(u);
				if (!d || i.hidden || d.a1 - d.a0 <= 1e-4) continue;
				let f = this.offsets.get(u) ?? 0, p = (d.a0 + d.a1) / 2, m = e - (n + Math.cos(p) * f), h = t - (r + Math.sin(p) * f), g = Math.hypot(m, h), _ = c + (l - c) * d.r;
				if (g < c || g > _ + 2) continue;
				let v = s(Math.atan2(h, m), a);
				if (v >= d.a0 && v <= d.a1) return u;
			}
		}
		return null;
	}
	setHover(e, t = !1) {
		if (this.legendHover = t, this.hoverKey === e) return;
		this.hoverKey = e;
		let n = this.sliceByKey(e);
		this.legendEl.querySelectorAll(".pc-legend__item").forEach((e) => e.classList.toggle("is-hover", e.dataset.id === n?.id)), this.emit("hover", n), this.kick();
	}
	showTooltip(e, t, n) {
		let r = this.tooltipEl;
		if (!e || !this.o.tooltip.show) {
			r.classList.remove("is-visible");
			return;
		}
		let i = this.o, a = this.layers.length > 1 && e.ringName ? `<div class="pc-tooltip__series">${b(e.ringName)}</div>` : "";
		if (r.innerHTML = i.tooltip.formatter ? i.tooltip.formatter({ ...e }, this.layerTotal(e.ring)) : `${a}<div class="pc-tooltip__head"><span class="pc-tooltip__dot" style="background:${e.color}"></span>${b(e.label)}</div>
         ${i.tooltip.showValue || i.tooltip.showPercent ? `<div class="pc-tooltip__value">${i.tooltip.showValue ? b(i.valueFormatter(e.value)) : ""}${i.tooltip.showPercent ? `<span>${b(i.percentFormatter(e.percent))}</span>` : ""}</div>` : ""}
         ${e.children ? `<div class="pc-tooltip__list">${e.children.slice(0, 8).map((e) => `<div><span>${b(e.label)}</span><b>${b(i.valueFormatter(e.value))}</b></div>`).join("")}${e.children.length > 8 ? `<div><span>+${e.children.length - 8}</span></div>` : ""}</div>` : ""}`, r.classList.add("is-visible"), !i.tooltip.followCursor) {
			let r = x(e.ring, e.id), i = this.geom.get(r), a = this.layers[e.ring], { cx: o, cy: s, radius: c } = this.layoutCache;
			if (i && a) {
				let e = (i.a0 + i.a1) / 2, l = c * (a.inner + (a.outer - a.inner) * i.r) + (this.offsets.get(r) ?? 0);
				t = o + Math.cos(e) * l, n = s + Math.sin(e) * l;
			}
		}
		let o = r.offsetWidth, s = r.offsetHeight, c = t + 14, l = n + 14;
		c + o > this.width - 4 && (c = t - o - 14), l + s > this.height - 4 && (l = n - s - 14), r.style.transform = `translate(${Math.max(4, c)}px, ${Math.max(4, l)}px)`;
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
			let { x: n, y: r } = e(t), i = this.sliceAt(n, r), a = i !== this.hoverKey;
			this.setHover(i), this.canvas.style.cursor = i ? "pointer" : "default", (this.o.tooltip.followCursor || a) && this.showTooltip(this.sliceByKey(i), n, r);
		}), this.canvas.addEventListener("pointerleave", () => {
			this.setHover(null), this.showTooltip(null, 0, 0);
		}), this.canvas.addEventListener("click", (t) => {
			let { x: n, y: r } = e(t), i = this.sliceAt(n, r);
			i && (this.emit("click", this.sliceByKey(i)), this.o.selectable && this.selectKey(i));
		});
	}
	renderLegend() {
		let e = this.o, t = this.legendEl;
		t.innerHTML = "";
		let n = /* @__PURE__ */ new Set();
		for (let r of this.layers) for (let i of r.slices) {
			if (n.has(i.id)) continue;
			n.add(i.id);
			let a = x(r.ring, i.id), o = document.createElement("li");
			o.className = `pc-legend__item${i.hidden ? " is-hidden" : ""}${e.legend.interactive ? " is-interactive" : ""}${this.sliceByKey(this.hoverKey)?.id === i.id ? " is-hover" : ""}`, o.dataset.id = i.id, o.innerHTML = `<span class="pc-legend__swatch" style="background:${i.color}"></span><span class="pc-legend__label">${b(i.label)}</span>${e.legend.values ? `<span class="pc-legend__value">${b(e.valueFormatter(i.value))}<small>${i.hidden ? "—" : b(e.percentFormatter(i.percent))}</small></span>` : ""}`, o.addEventListener("mouseenter", () => !i.hidden && this.setHover(a, !0)), o.addEventListener("mouseleave", () => this.setHover(null)), e.legend.interactive && o.addEventListener("click", () => this.toggle(i.id)), t.append(o);
		}
	}
};
function C(e, t = {}) {
	return new S(e, t);
}
//#endregion
export { f as a, d as i, S as n, e as o, C as r, p as t };

//# sourceMappingURL=pie.js.map