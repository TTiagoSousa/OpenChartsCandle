import { t as e } from "./format.js";
import { n as t } from "./color.js";
//#region src/calendar/layout.ts
var n = (e) => String(e).padStart(2, "0");
function r(e) {
	return `${e.getFullYear()}-${n(e.getMonth() + 1)}-${n(e.getDate())}`;
}
function i(e) {
	if (e instanceof Date) return isNaN(+e) ? null : new Date(e.getFullYear(), e.getMonth(), e.getDate());
	if (typeof e == "number") {
		if (!isFinite(e)) return null;
		let t = new Date(e < 1e11 ? e * 1e3 : e);
		return new Date(t.getFullYear(), t.getMonth(), t.getDate());
	}
	let t = e.trim().match(/^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?/);
	return t ? new Date(+t[1], t[2] ? t[2] - 1 : 0, t[3] ? +t[3] : 1) : null;
}
function a(e) {
	if (Array.isArray(e)) {
		let t = i(e[0]), n = i(e[1]);
		if (!t || !n) throw Error(`calendar: invalid range ${JSON.stringify(e)}`);
		return t <= n ? [t, n] : [n, t];
	}
	if (typeof e == "number") return [new Date(e, 0, 1), new Date(e, 11, 31)];
	let t = e.trim().match(/^(\d{4})(?:-(\d{1,2}))?$/);
	if (!t) {
		let t = i(e);
		if (!t) throw Error(`calendar: invalid range ${e}`);
		return [t, t];
	}
	let n = +t[1];
	if (!t[2]) return [new Date(n, 0, 1), new Date(n, 11, 31)];
	let r = t[2] - 1;
	return [new Date(n, r, 1), new Date(n, r + 1, 0)];
}
function o(e, t, n, i) {
	let [o, s] = a(e), c = (o.getDay() - i + 7) % 7, l = [], u = [], d = n === "horizontal";
	for (let e = 0, t = o; t <= s; e++, t = new Date(o.getFullYear(), o.getMonth(), o.getDate() + e)) {
		let n = e + c, i = n % 7, a = Math.floor(n / 7);
		l.push({
			key: r(t),
			date: t,
			weekday: i,
			week: a,
			col: d ? a : i,
			row: d ? i : a
		}), (t.getDate() === 1 || e === 0) && u.push({
			year: t.getFullYear(),
			month: t.getMonth(),
			at: i === 0 ? a : a + 1
		});
	}
	let f = l.length ? l[l.length - 1].week + 1 : 0;
	for (let e of u) e.at = Math.min(e.at, f - 1);
	let p = o.getFullYear(), m = s.getFullYear();
	return {
		index: t,
		start: o,
		end: s,
		days: l,
		cols: d ? f : 7,
		rows: d ? 7 : f,
		year: p === m ? String(p) : `${p}–${m}`,
		months: u
	};
}
function s(e, t) {
	let n = (n, r) => {
		let i = t.get(`${n},${r}`);
		return !i || i.date.getMonth() !== e.date.getMonth() || i.date.getFullYear() !== e.date.getFullYear();
	};
	return [
		n(e.col, e.row - 1),
		n(e.col + 1, e.row),
		n(e.col, e.row + 1),
		n(e.col - 1, e.row)
	];
}
//#endregion
//#region src/calendar/calendar.ts
var c = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", l = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	cell: "rgba(42, 46, 57, 0.55)",
	cellBorder: "#131722",
	splitLine: "rgba(209, 212, 220, 0.5)",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: c
}, u = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	cell: "#f0f3fa",
	cellBorder: "#ffffff",
	splitLine: "#9598a1",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: c
}, d = [
	"#1e3a5f",
	"#2962ff",
	"#ff9800",
	"#f23645"
], f = [
	"Seg",
	"Ter",
	"Qua",
	"Qui",
	"Sex",
	"Sáb",
	"Dom"
], p = [
	"Jan",
	"Fev",
	"Mar",
	"Abr",
	"Mai",
	"Jun",
	"Jul",
	"Ago",
	"Set",
	"Out",
	"Nov",
	"Dez"
], m = Math.PI * 2, h = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), g = (e, t, n) => Math.min(n, Math.max(t, e)), _ = (e) => 1 - (1 - e) ** 3, v = (e, t) => typeof e == "object" ? {
	...e,
	show: e.show ?? !0
} : { show: e ?? t }, y = class {
	constructor(e, t = {}) {
		this.data = /* @__PURE__ */ new Map(), this.grids = [], this.list = [], this.byKey = /* @__PURE__ */ new Map(), this.vmin = 0, this.vmax = 1, this.off = /* @__PURE__ */ new Set(), this.top = /* @__PURE__ */ new Set(), this.hover = null, this.width = 0, this.height = 0, this.dpr = 1, this.animStart = 0, this.raf = 0, this.handlers = /* @__PURE__ */ new Map(), this.destroyed = !1, this.origins = [], this.opts = { ...t }, this.root = e, e.classList.add("cc-root"), this.titleEl = document.createElement("div"), this.titleEl.className = "cc-title", this.bodyEl = document.createElement("div"), this.bodyEl.className = "cc-body", this.plotEl = document.createElement("div"), this.plotEl.className = "cc-plot", this.canvas = document.createElement("canvas"), this.canvas.className = "cc-canvas", this.canvas.setAttribute("role", "img"), this.ctx = this.canvas.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "cc-tooltip", this.vmEl = document.createElement("div"), this.vmEl.className = "cc-vm", this.plotEl.append(this.canvas, this.tooltipEl), this.bodyEl.append(this.plotEl, this.vmEl), e.append(this.titleEl, this.bodyEl), this.setDataInternal(t.data ?? []), this.applyLook(), this.bind(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(this.plotEl), this.measure(), this.rebuild(!0);
	}
	get cells() {
		return this.list.map(({ order: e, g: t, ...n }) => ({ ...n }));
	}
	setData(e, t = !1) {
		this.opts.data = e, this.setDataInternal(e ?? []), this.rebuild(t);
	}
	setOptions(e, t = !1) {
		e.data && this.setDataInternal(e.data), e.visualMap !== void 0 && this.off.clear(), this.opts = {
			...this.opts,
			...e
		}, this.applyLook(), this.rebuild(t);
	}
	cellAt(e) {
		let t = i(e);
		return t && this.byKey.get(r(t)) || null;
	}
	colorOf(e) {
		let n = this.vm();
		if (n.pieces) {
			let t = this.pieceOf(n, e);
			return t < 0 ? this.cellColor() : n.pieces[t].color;
		}
		return t(n.colors ?? d, (e - this.vmin) / (this.vmax - this.vmin || 1));
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
		this.destroyed = !0, cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("cc-root"), this.titleEl.remove(), this.bodyEl.remove();
	}
	setDataInternal(e) {
		this.data.clear();
		for (let t of e) {
			let e = Array.isArray(t) ? {
				date: t[0],
				value: t[1]
			} : t, n = i(e.date);
			n && this.data.set(r(n), e);
		}
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t));
	}
	applyLook() {
		let e = this.opts, t = {
			...e.theme === "light" ? u : l,
			...typeof e.theme == "object" ? e.theme : {}
		};
		e.background && (t.background = e.background), t.background === "transparent" && e.theme !== "light" && typeof e.theme != "object" && (t.cellBorder = "rgba(0,0,0,0)"), this.theme = t;
		let n = {
			"--cc-bg": t.background,
			"--cc-text": t.text,
			"--cc-muted": t.muted,
			"--cc-tt-bg": t.tooltipBg,
			"--cc-tt-text": t.tooltipText,
			"--cc-tt-border": t.tooltipBorder,
			"--cc-font": t.font
		};
		for (let [e, t] of Object.entries(n)) this.root.style.setProperty(e, t);
		let r = typeof e.title == "string" ? { text: e.title } : e.title;
		this.titleEl.style.display = r ? "" : "none", r && (this.titleEl.style.textAlign = r.align ?? "center", this.titleEl.innerHTML = `<b>${h(r.text)}</b>${r.subtext ? `<small>${h(r.subtext)}</small>` : ""}`);
	}
	vm() {
		return this.opts.visualMap || {};
	}
	hasVisual() {
		return this.opts.visualMap !== !1 && (this.opts.type ?? "heatmap") !== "none";
	}
	pieceOf(e, t) {
		return (e.pieces ?? []).findIndex((e) => e.value === void 0 ? (e.min === void 0 || t >= e.min) && (e.max === void 0 || t < e.max || t === e.max && e.max === this.vmax) : t === e.value);
	}
	cellColor() {
		return this.opts.cell?.color ?? this.theme.cell;
	}
	rebuild(e) {
		let t = this.opts, n = t.orient ?? "horizontal", r = t.range === void 0 ? [(/* @__PURE__ */ new Date()).getFullYear()] : Array.isArray(t.range) && !(t.range.length === 2 && b(t.range)) ? t.range : [t.range];
		this.grids = r.map((e, r) => o(e, r, n, t.firstDay ?? 1));
		let i = Infinity, a = -Infinity;
		for (let e of this.grids) for (let t of e.days) {
			let e = this.data.get(t.key)?.value;
			typeof e == "number" && isFinite(e) && (i = Math.min(i, e), a = Math.max(a, e));
		}
		let s = this.vm();
		if (this.vmin = s.min ?? (i === Infinity ? 0 : i), this.vmax = s.max ?? (a === -Infinity ? 1 : a), this.top = /* @__PURE__ */ new Set(), t.effect && (t.type ?? "heatmap") === "scatter") {
			let e = this.grids.flatMap((e) => e.days).filter((e) => typeof this.data.get(e.key)?.value == "number");
			e.sort((e, t) => this.data.get(t.key).value - this.data.get(e.key).value);
			for (let n of e.slice(0, t.effect.top)) this.top.add(n.key);
		}
		this.renderVisual(), this.layout();
		let c = t.animation ?? !0;
		this.animStart = e && c !== !1 ? performance.now() : 0, this.loop();
	}
	duration() {
		let e = this.opts.animation ?? !0;
		return e === !1 ? 0 : typeof e == "object" ? e.duration ?? 800 : 800;
	}
	progress(e) {
		return this.animStart ? g((e - this.animStart) / (this.duration() || 1), 0, 1) : 1;
	}
	loop() {
		if (cancelAnimationFrame(this.raf), this.destroyed) return;
		let e = performance.now();
		this.draw(e), this.progress(e) < 1 || this.top.size || this.opts.animate ? this.raf = requestAnimationFrame(() => this.loop()) : this.animStart = 0;
	}
	measure() {
		let e = this.plotEl.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height)), this.canvas.width = Math.round(this.width * this.dpr), this.canvas.height = Math.round(this.height * this.dpr), this.canvas.style.width = `${this.width}px`, this.canvas.style.height = `${this.height}px`;
	}
	labels() {
		let e = this.opts;
		return {
			day: v(e.dayLabel, !0),
			month: v(e.monthLabel, !0),
			year: v(e.yearLabel, this.grids.length > 1)
		};
	}
	layout() {
		let e = this.opts, t = (e.orient ?? "horizontal") === "horizontal", n = e.padding ?? 10, r = e.gap ?? 28, i = this.labels(), a = this.grids.length || 1, o = (t ? i.day.show ? 30 : 0 : i.month.show ? 34 : 0) + (t && i.year.show ? 24 : 0), s = (t ? i.month.show ? 18 : 0 : i.day.show ? 20 : 0) + (!t && i.year.show ? 22 : 0), c = Math.max(1, ...this.grids.map((e) => e.cols)), l = Math.max(1, ...this.grids.map((e) => e.rows)), u = this.width - n * 2, d = this.height - n * 2, f, p, m = e.cellSize ?? "auto";
		if (m === "auto") {
			let e = t ? (u - o) / c : (u - a * o - (a - 1) * r) / (7 * a), n = t ? (d - a * s - (a - 1) * r) / (7 * a) : (d - s) / l;
			f = Math.max(2, Math.min(e, n * 2.2)), p = Math.max(2, Math.min(n, e * 1.15));
		} else typeof m == "number" ? f = p = m : [f, p] = m;
		let h = t ? o + c * f : a * (o + 7 * f) + (a - 1) * r, g = t ? a * (s + 7 * p) + (a - 1) * r : s + l * p, _ = n + Math.max(0, (u - h) / 2), v = n + Math.max(0, (d - g) / 2);
		this.list = [], this.byKey.clear();
		let y = 0;
		for (let e of this.grids) y += e.days.length;
		let b = 0;
		this.origins = [];
		for (let e of this.grids) {
			let n = t ? _ + o : _ + e.index * (o + 7 * f + r) + o, i = t ? v + e.index * (s + 7 * p + r) + s : v + s;
			this.origins.push({
				x: n,
				y: i,
				cw: f,
				ch: p
			});
			for (let t of e.days) {
				let r = this.data.get(t.key) ?? null, a = r?.value, o = typeof a == "number" && isFinite(a) ? a : null, s = {
					key: t.key,
					date: t.date,
					weekday: t.weekday,
					week: t.week,
					calendar: e.index,
					value: o,
					datum: r,
					color: "",
					x: n + t.col * f,
					y: i + t.row * p,
					w: f,
					h: p,
					order: y > 1 ? b / (y - 1) : 0,
					g: t
				};
				s.color = this.fill(s), b++, this.list.push(s), this.byKey.set(t.key, s);
			}
		}
	}
	fill(e) {
		if (e.datum?.color) return e.datum.color;
		if (e.value === null || !this.hasVisual()) return this.cellColor();
		let t = this.vm();
		if (t.pieces) {
			let n = this.pieceOf(t, e.value);
			return n < 0 || this.off.has(n) ? this.cellColor() : t.pieces[n].color;
		}
		return this.colorOf(e.value);
	}
	symbolColor(e) {
		return e.datum?.color ?? (this.opts.visualMap && e.value !== null ? this.colorOf(e.value) : this.opts.color ?? "#2962ff");
	}
	filtered(e) {
		let t = this.vm();
		if (!t.pieces || e.value === null) return !1;
		let n = this.pieceOf(t, e.value);
		return n < 0 || this.off.has(n);
	}
	renderVisual() {
		let t = this.vm(), n = this.vmEl, r = this.hasVisual() && t.show !== !1 && this.opts.visualMap !== void 0 && (this.vmax > this.vmin || !!t.pieces);
		n.style.display = r ? "" : "none";
		let i = t.position ?? "bottom";
		if (this.bodyEl.className = `cc-body cc-vm-${i}`, !r) {
			n.innerHTML = "";
			return;
		}
		let a = t.format ?? ((t) => e(t)), o = t.title ? `<span class="cc-vm__title">${h(t.title)}</span>` : "";
		if (t.pieces) {
			n.innerHTML = o + t.pieces.map((e, t) => {
				let n = e.label ?? (e.value === void 0 ? e.min === void 0 ? `< ${a(e.max)}` : e.max === void 0 ? `≥ ${a(e.min)}` : `${a(e.min)} – ${a(e.max)}` : a(e.value));
				return `<button type="button" class="cc-vm__piece${this.off.has(t) ? " is-off" : ""}" data-i="${t}"><i style="background:${e.color}"></i>${h(n)}</button>`;
			}).join("");
			return;
		}
		let s = t.colors ?? d, c = i === "right";
		n.innerHTML = `${o}<span class="cc-vm__end">${h(a(c ? this.vmax : this.vmin))}</span><span class="cc-vm__bar" style="background:linear-gradient(${c ? "to bottom" : "to right"},${(c ? [...s].reverse() : s).join(",")})"></span><span class="cc-vm__end">${h(a(c ? this.vmin : this.vmax))}</span>`;
	}
	api(e) {
		return {
			width: this.width,
			height: this.height,
			theme: this.theme,
			cell: (e) => this.cellAt(e),
			cells: this.list,
			colorOf: (e) => this.colorOf(e),
			progress: _(this.progress(e)),
			time: e
		};
	}
	font(e, t = 400) {
		return `${t} ${e}px ${this.theme.font}`;
	}
	draw(e = performance.now()) {
		let t = this.ctx, n = this.theme, r = this.opts;
		t.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), t.clearRect(0, 0, this.width, this.height), n.background !== "transparent" && (t.fillStyle = n.background, t.fillRect(0, 0, this.width, this.height));
		let i = this.progress(e), a = this.api(e), o = r.type ?? "heatmap", s = r.cell ?? {}, c = s.gap ?? 0, l = s.radius ?? 0, u = s.borderWidth ?? 1, d = s.borderColor ?? n.cellBorder, [f, p] = r.symbolSize ?? [.15, .95], h = (e) => i >= 1 ? 1 : _(g(i * 1.6 - e.order * .6, 0, 1));
		for (let e of this.list) {
			let n = h(e), r = e.x + c / 2, i = e.y + c / 2, a = e.w - c, s = e.h - c;
			t.globalAlpha = 1, t.fillStyle = this.cellColor(), this.rect(r, i, a, s, l), t.fill(), (o === "heatmap" || o === "none" && e.datum?.color) && e.color !== this.cellColor() && (t.globalAlpha = n, t.fillStyle = e.color, this.rect(r, i, a, s, l), t.fill(), t.globalAlpha = 1), u > 0 && (t.strokeStyle = d, t.lineWidth = u, this.rect(r, i, a, s, l), t.stroke());
		}
		if (o === "scatter") {
			let n = this.vmax - this.vmin || 1;
			for (let i of this.list) {
				if (i.value === null || this.filtered(i)) continue;
				let a = g((i.value - this.vmin) / n, 0, 1), o = Math.min(i.w, i.h) / 2 * (f + (p - f) * a) * h(i);
				if (o <= 0) continue;
				let s = this.symbolColor(i), c = i.x + i.w / 2, l = i.y + i.h / 2;
				this.top.has(i.key) && this.ripple(c, l, o, r.effect?.color ?? s, e), t.fillStyle = s, t.beginPath(), t.arc(c, l, o, 0, m), t.fill();
			}
		}
		if (r.renderCell) for (let e of this.list) t.save(), t.globalAlpha = h(e), r.renderCell(t, e, a), t.restore();
		if (this.drawLabels(), this.drawSplit(), this.drawAxisLabels(), this.hover) {
			let e = this.hover;
			t.strokeStyle = n.text, t.lineWidth = 2, this.rect(e.x + c / 2 + 1, e.y + c / 2 + 1, e.w - c - 2, e.h - c - 2, l), t.stroke();
		}
		r.graphic && (t.save(), r.graphic(t, a), t.restore());
	}
	rect(e, t, n, r, i) {
		let a = this.ctx;
		a.beginPath(), i > 0 ? a.roundRect(e, t, Math.max(0, n), Math.max(0, r), Math.min(i, n / 2, r / 2)) : a.rect(e, t, Math.max(0, n), Math.max(0, r));
	}
	ripple(e, t, n, r, i) {
		let a = this.ctx;
		for (let o = 0; o < 3; o++) {
			let s = ((i / 1600 + o / 3) % 1 + 1) % 1;
			a.globalAlpha = (1 - s) * .55, a.strokeStyle = r, a.lineWidth = 1.5, a.beginPath(), a.arc(e, t, n * (1 + s * 1.6), 0, m), a.stroke();
		}
		a.globalAlpha = 1;
	}
	drawLabels() {
		let e = this.opts.label;
		if (!e) return;
		let t = e === !0 ? {} : e;
		if (t.show === !1) return;
		let n = this.ctx, r = t.position ?? "center";
		for (let e of this.list) {
			let i = t.format ? t.format(e) : String(e.date.getDate()), a = (Array.isArray(i) ? i : [i]).filter((e) => e !== "");
			if (!a.length) continue;
			let o = t.fontSize ?? g(Math.min(e.w, e.h) * .3, 8, 14);
			n.fillStyle = t.color ?? this.labelColor(e), a.forEach((t, i) => {
				let s = i === 0 ? o : o * .78;
				if (n.font = this.font(s, i === 0 ? 600 : 400), r === "center") {
					let r = o * 1.2, s = e.y + e.h / 2 - (a.length - 1) * r / 2 + i * r;
					n.textAlign = "center", n.textBaseline = "middle", n.fillText(t, e.x + e.w / 2, s, e.w - 4);
				} else {
					n.textAlign = r === "top" ? "center" : "left", n.textBaseline = "top";
					let a = r === "top" ? e.x + e.w / 2 : e.x + 5;
					n.fillText(t, a, e.y + 4 + i * o * 1.15, e.w - 8);
				}
			});
		}
	}
	labelColor(e) {
		if ((this.opts.type ?? "heatmap") !== "heatmap" || e.color === this.cellColor()) return this.theme.text;
		let t = e.color.match(/\d+(\.\d+)?/g), n = t && e.color.startsWith("rgb") ? t.slice(0, 3).map(Number) : null;
		if (!n && e.color[0] === "#") {
			let t = e.color.length === 4 ? [...e.color.slice(1)].map((e) => e + e).join("") : e.color.slice(1, 7), r = parseInt(t, 16);
			n = [
				r >> 16 & 255,
				r >> 8 & 255,
				r & 255
			];
		}
		return n ? .299 * n[0] + .587 * n[1] + .114 * n[2] > 150 ? "#131722" : "#ffffff" : this.theme.text;
	}
	drawSplit() {
		let e = v(this.opts.splitLine, !0);
		if (!e.show) return;
		let t = this.ctx;
		t.strokeStyle = e.color ?? this.theme.splitLine, t.lineWidth = e.width ?? 1.5, t.lineCap = "square", t.beginPath();
		for (let e of this.grids) {
			let t = new Map(e.days.map((e) => [`${e.col},${e.row}`, e]));
			for (let n of e.days) {
				let e = this.byKey.get(n.key), [r, i, a, o] = s(n, t);
				r && this.seg(e.x, e.y, e.x + e.w, e.y), i && this.seg(e.x + e.w, e.y, e.x + e.w, e.y + e.h), a && this.seg(e.x, e.y + e.h, e.x + e.w, e.y + e.h), o && this.seg(e.x, e.y, e.x, e.y + e.h);
			}
		}
		t.stroke();
	}
	seg(e, t, n, r) {
		this.ctx.moveTo(e, t), this.ctx.lineTo(n, r);
	}
	drawAxisLabels() {
		let e = this.ctx, t = this.theme, n = (this.opts.orient ?? "horizontal") === "horizontal", r = this.labels(), i = this.opts.firstDay ?? 1, a = r.day.names ?? f, o = r.day.names ? a : i === 0 ? [a[6], ...a.slice(0, 6)] : a, s = r.month.names ?? p;
		for (let i of this.grids) {
			let a = this.origins[i.index];
			if (!a) continue;
			let c = g(Math.min(a.cw, a.ch * 2) * .55, 8, 12);
			if (r.day.show) {
				e.fillStyle = r.day.color ?? t.muted, e.font = this.font(c);
				for (let t = 0; t < 7; t++) n && (a.ch < 13 && t % 2 || a.ch < 6) || (n ? (e.textAlign = "right", e.textBaseline = "middle", e.fillText(o[t], a.x - 6, a.y + (t + .5) * a.ch)) : (e.textAlign = "center", e.textBaseline = "bottom", e.fillText(o[t], a.x + (t + .5) * a.cw, a.y - 5)));
			}
			if (r.month.show) {
				e.fillStyle = r.month.color ?? t.muted, e.font = this.font(c + .5, 600);
				for (let t of i.months) n ? (e.textAlign = "left", e.textBaseline = "bottom", e.fillText(s[t.month], a.x + t.at * a.cw + 1, a.y - 5)) : (e.textAlign = "right", e.textBaseline = "middle", e.fillText(s[t.month], a.x - 6, a.y + (t.at + .5) * a.ch));
			}
			r.year.show && (e.fillStyle = r.year.color ?? t.text, e.font = this.font(13, 700), e.textAlign = "center", n ? (e.save(), e.translate(a.x - (r.day.show ? 30 : 0) - 12, a.y + 3.5 * a.ch), e.rotate(-Math.PI / 2), e.textBaseline = "middle", e.fillText(i.year, 0, 0), e.restore()) : (e.textBaseline = "bottom", e.fillText(i.year, a.x + 3.5 * a.cw, a.y - (r.day.show ? 22 : 4))));
		}
	}
	bind() {
		let e = (e) => {
			let t = this.canvas.getBoundingClientRect(), n = e.clientX - t.left, r = e.clientY - t.top;
			for (let e of this.list) if (n >= e.x && n < e.x + e.w && r >= e.y && r < e.y + e.h) return e;
			return null;
		};
		this.canvas.addEventListener("pointermove", (t) => {
			let n = e(t);
			n !== this.hover && (this.hover = n, this.emit("hover", n), this.draw()), this.canvas.style.cursor = n ? "pointer" : "", this.showTooltip(n, t);
		}), this.canvas.addEventListener("pointerleave", () => {
			this.hover && (this.hover = null, this.emit("hover", null), this.draw()), this.tooltipEl.classList.remove("is-visible");
		}), this.canvas.addEventListener("click", (t) => {
			let n = e(t);
			n && this.emit("click", n);
		}), this.vmEl.addEventListener("click", (e) => {
			let t = e.target.closest(".cc-vm__piece");
			if (!t) return;
			let n = Number(t.dataset.i);
			this.off.has(n) ? this.off.delete(n) : this.off.add(n);
			for (let e of this.list) e.color = this.fill(e);
			this.renderVisual(), this.draw();
		});
	}
	showTooltip(e, t) {
		let n = this.opts.tooltip ?? !0, r = this.tooltipEl;
		if (!e || n === !1 || typeof n == "object" && n.show === !1) {
			r.classList.remove("is-visible");
			return;
		}
		if (typeof n == "object" && n.formatter) r.innerHTML = n.formatter(e);
		else {
			let t = e.date.toLocaleDateString("pt-PT", {
				weekday: "long",
				day: "numeric",
				month: "long",
				year: "numeric"
			}), n = this.opts.valueFormatter ?? ((e) => e.toLocaleString("pt-PT")), i = (this.opts.type ?? "heatmap") === "scatter";
			r.innerHTML = `<div class="cc-tooltip__head">${e.value !== null && this.hasVisual() ? `<i class="cc-tooltip__dot" style="background:${i ? this.symbolColor(e) : e.color}"></i>` : ""}${h(t)}</div>` + (e.value === null ? "" : `<div class="cc-tooltip__row"><span>Valor</span><b>${h(n(e.value))}</b></div>`) + (e.datum?.label ? `<div class="cc-tooltip__row"><span>${h(e.datum.label)}</span></div>` : "");
		}
		r.classList.add("is-visible");
		let i = this.plotEl.getBoundingClientRect(), a = t.clientX - i.left, o = t.clientY - i.top, s = r.offsetWidth, c = r.offsetHeight, l = a + 14 + s > this.width ? a - 14 - s : a + 14, u = g(o + 14 + c > this.height ? o - 14 - c : o + 14, 0, Math.max(0, this.height - c));
		r.style.transform = `translate(${Math.max(0, l)}px, ${u}px)`;
	}
};
function b(e) {
	return e.every((e) => e instanceof Date || typeof e == "string" && /^\d{4}-\d{1,2}-\d{1,2}/.test(e) || typeof e == "number" && e > 1e5);
}
function x(e, t = {}) {
	return new y(e, t);
}
//#endregion
export { x as a, a as c, u as i, y as n, r as o, l as r, i as s, d as t };

//# sourceMappingURL=calendar.js.map