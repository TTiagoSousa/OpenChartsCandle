import { n as e, t } from "./format.js";
//#region src/gauge/geometry.ts
var n = {
	speedometer: [-120, 120],
	semi: [-90, 90],
	full: [0, 360]
}, r = (e) => (e - 90) * Math.PI / 180;
function i(e = "speedometer", t, i) {
	let [a, o] = n[e];
	return {
		start: r(t ?? a),
		end: r(i ?? o)
	};
}
var a = (e, t, n) => Math.min(n, Math.max(t, e));
function o(e, t, n, r) {
	let i = a((e - t) / (n - t || 1), 0, 1);
	return r.start + (r.end - r.start) * i;
}
function s(e, t, n, r) {
	let i = r.end - r.start, a = e;
	for (; a < r.start;) a += Math.PI * 2;
	for (; a > r.start + Math.PI * 2;) a -= Math.PI * 2;
	return a - r.start > i + 1e-9 ? null : t + (a - r.start) / i * (n - t);
}
function c(t, n, r) {
	let i = e(t, n, r).ticks.filter((e) => e >= t - 1e-9 && e <= n + 1e-9);
	if (i.length >= 2 && Math.abs(i[0] - t) < 1e-9 && Math.abs(i[i.length - 1] - n) < 1e-9) return i;
	let a = Math.max(1, r - 1);
	return Array.from({ length: a + 1 }, (e, r) => +(t + (n - t) * r / a).toPrecision(12));
}
function l(e, t = []) {
	return t.find((t) => e >= Math.min(t.from, t.to) && e <= Math.max(t.from, t.to)) ?? null;
}
function u(e) {
	let t = [
		[Math.cos(e.start), Math.sin(e.start)],
		[Math.cos(e.end), Math.sin(e.end)],
		[0, 0]
	];
	for (let n = Math.ceil(e.start / (Math.PI / 2)); Math.PI / 2 * n <= e.end; n++) {
		let e = Math.PI / 2 * n;
		t.push([Math.cos(e), Math.sin(e)]);
	}
	return {
		minX: Math.min(...t.map((e) => e[0])),
		maxX: Math.max(...t.map((e) => e[0])),
		minY: Math.min(...t.map((e) => e[1])),
		maxY: Math.max(...t.map((e) => e[1]))
	};
}
function d(e) {
	return e >= 1 ? 1 : 1 - Math.exp(-6 * e) * Math.cos(7.5 * e);
}
//#endregion
//#region src/gauge/gauge.ts
var f = "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif", p = {
	background: "#131722",
	text: "#d1d4dc",
	muted: "#787b86",
	track: "rgba(120, 123, 134, 0.18)",
	needle: "#d1d4dc",
	tooltipBg: "#1e222d",
	tooltipText: "#d1d4dc",
	tooltipBorder: "#2a2e39",
	font: f
}, m = {
	background: "#ffffff",
	text: "#131722",
	muted: "#787b86",
	track: "rgba(42, 46, 57, 0.08)",
	needle: "#131722",
	tooltipBg: "#ffffff",
	tooltipText: "#131722",
	tooltipBorder: "#e0e3eb",
	font: f
};
function h(e, t, n = [.6, .85]) {
	let r = e + (t - e) * n[0], i = e + (t - e) * n[1];
	return [
		{
			from: e,
			to: r,
			color: "#089981",
			label: "Normal"
		},
		{
			from: r,
			to: i,
			color: "#ffb300",
			label: "Atenção"
		},
		{
			from: i,
			to: t,
			color: "#f23645",
			label: "Crítico"
		}
	];
}
var g = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), _ = (e) => 1 - (1 - e) ** 3, v = class {
	constructor(e, t = {}) {
		this.target = 0, this.shown = 0, this.from = 0, this.animStart = 0, this.raf = 0, this.width = 0, this.height = 0, this.dpr = 1, this.cx = 0, this.cy = 0, this.radius = 0, this.arc = i(), this.lastZone = null, this.extraShown = [], this.extraFrom = [], this.hovered = null, this.handlers = /* @__PURE__ */ new Map(), this.opts = { ...t }, this.root = e, e.classList.add("gc-root"), this.canvas = document.createElement("canvas"), this.canvas.className = "gc-canvas", this.canvas.setAttribute("role", "meter"), this.ctx = this.canvas.getContext("2d"), this.tooltipEl = document.createElement("div"), this.tooltipEl.className = "gc-tooltip", e.append(this.canvas, this.tooltipEl), this.applyLook(), this.bind(), this.ro = new ResizeObserver(() => this.resize()), this.ro.observe(e), this.resize();
		let n = this.clampValue(t.value ?? this.min);
		this.target = n, this.lastZone = l(n, this.opts.zones), this.shown = this.min, this.animateTo(n), this.updateAria();
	}
	get value() {
		return this.target;
	}
	setValue(e, t = !0) {
		this.target = e, this.updateAria(), this.emit("change", e);
		let n = l(e, this.opts.zones);
		n !== this.lastZone && (this.lastZone = n, this.emit("zone", n)), t ? this.animateTo(e) : (cancelAnimationFrame(this.raf), this.shown = this.clampValue(e), this.draw());
	}
	setOptions(e, t = !0) {
		this.opts = {
			...this.opts,
			...e
		}, this.applyLook(), this.layout(), e.value === void 0 ? e.pointers || e.rings ? t ? this.animateTo(this.target) : (cancelAnimationFrame(this.raf), this.extraShown = this.extraTargets(), this.draw()) : this.draw() : this.setValue(e.value, t);
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
		cancelAnimationFrame(this.raf), this.ro.disconnect(), this.root.classList.remove("gc-root"), this.canvas.remove(), this.tooltipEl.remove();
	}
	get min() {
		return this.opts.min ?? 0;
	}
	get max() {
		return this.opts.max ?? 100;
	}
	clampValue(e) {
		return a(e, Math.min(this.min, this.max), Math.max(this.min, this.max));
	}
	emit(e, t) {
		this.handlers.get(e)?.forEach((e) => e(t));
	}
	fmt(e) {
		return this.opts.valueFormatter ? this.opts.valueFormatter(e) : Math.abs(e) >= 1e4 ? t(e, 1) : e.toFixed(+(Math.abs(this.max - this.min) <= 10));
	}
	updateAria() {
		this.canvas.setAttribute("aria-valuemin", String(this.min)), this.canvas.setAttribute("aria-valuemax", String(this.max)), this.canvas.setAttribute("aria-valuenow", String(this.target)), this.canvas.setAttribute("aria-label", `${this.opts.title ?? "Gauge"}: ${this.fmt(this.target)}${this.opts.unit ? " " + this.opts.unit : ""}`);
	}
	applyLook() {
		let e = this.opts, t = e.theme === "light" ? m : p;
		this.theme = {
			...t,
			...typeof e.theme == "object" ? e.theme : {}
		}, e.background !== void 0 && (this.theme.background = e.background);
		let n = this.theme, r = {
			"--gc-bg": n.background,
			"--gc-text": n.text,
			"--gc-tt-bg": n.tooltipBg,
			"--gc-tt-text": n.tooltipText,
			"--gc-tt-border": n.tooltipBorder,
			"--gc-font": n.font
		};
		for (let [e, t] of Object.entries(r)) this.root.style.setProperty(e, t);
		this.arc = i(e.shape ?? "speedometer", e.startAngle, e.endAngle);
	}
	duration() {
		let e = this.opts.animation ?? !0;
		return e === !1 ? 0 : typeof e == "object" ? e.duration ?? 1100 : 1100;
	}
	ease(e) {
		let t = this.opts.animation, n = typeof t == "object" ? t.easing ?? "spring" : "spring";
		return n === "linear" ? e : n === "smooth" ? _(e) : d(e);
	}
	extraTargets() {
		return (this.opts.pointers ?? this.opts.rings ?? []).map((e) => this.clampValue(e.value));
	}
	animateTo(e) {
		cancelAnimationFrame(this.raf);
		let t = this.clampValue(e), n = this.extraTargets(), r = this.duration();
		if (!r) {
			this.shown = t, this.extraShown = n, this.draw();
			return;
		}
		this.from = this.shown, this.extraFrom = n.map((e, t) => this.extraShown[t] ?? this.min), this.animStart = performance.now();
		let i = (e) => {
			let a = Math.min(1, (e - this.animStart) / r), o = this.ease(a);
			this.shown = this.clampValue(this.from + (t - this.from) * o), this.extraShown = n.map((e, t) => this.clampValue(this.extraFrom[t] + (e - this.extraFrom[t]) * o)), this.draw(), a < 1 && (this.raf = requestAnimationFrame(i));
		};
		this.raf = requestAnimationFrame(i);
	}
	resize() {
		let e = this.root.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height)), this.canvas.width = Math.round(this.width * this.dpr), this.canvas.height = Math.round(this.height * this.dpr), this.canvas.style.width = `${this.width}px`, this.canvas.style.height = `${this.height}px`, this.layout(), this.draw();
	}
	get full() {
		return this.arc.end - this.arc.start >= Math.PI * 2 - 1e-6;
	}
	layout() {
		let e = this.opts.padding ?? 10, t = u(this.arc), n = this.opts.ticks?.position === "outside" && this.opts.ticks?.show !== !1 || this.opts.markers?.length ? .16 : .02, r = this.full ? 0 : this.textBelowHub ? .62 : .18, i = Math.max(10, this.width - e * 2), a = Math.max(10, this.height - e * 2), o = t.maxX - t.minX + n * 2, s = t.maxY - t.minY + n * 2 + (this.full ? 0 : Math.max(0, r - (t.maxY > .3 ? .1 : 0)));
		this.radius = Math.max(10, Math.min(i / o, a / s));
		let c = o * this.radius, l = s * this.radius;
		this.cx = e + (i - c) / 2 + (-t.minX + n) * this.radius, this.cy = e + (a - l) / 2 + (-t.minY + n) * this.radius;
	}
	get textBelowHub() {
		return !this.full && this.needleOpts().show && u(this.arc).maxY < .3;
	}
	get thickness() {
		let e = this.opts.thickness ?? .16;
		return e <= 1 ? Math.max(3, this.radius * e) : e;
	}
	draw() {
		let e = this.ctx, t = this.theme, n = this.opts;
		if (e.setTransform(this.dpr, 0, 0, this.dpr, 0, 0), e.clearRect(0, 0, this.width, this.height), t.background !== "transparent" && (e.fillStyle = t.background, e.fillRect(0, 0, this.width, this.height)), n.rings?.length) {
			this.drawRings();
			return;
		}
		let r = this.radius, i = this.thickness, a = r - i / 2, s = n.rounded ?? !0, c = this.needleOpts(), l = n.zones ?? [], u = o(this.shown, this.min, this.max, this.arc), d = n.progress ?? (!c.show || !l.length && !n.gradient);
		if (e.lineWidth = i, e.lineCap = s && !this.full ? "round" : "butt", this.strokeArc(a, this.arc.start, this.arc.end, t.track), l.length) {
			let t = (n.zoneGap ?? 1.2) * Math.PI / 180, r = [...l].sort((e, t) => Math.min(e.from, e.to) - Math.min(t.from, t.to));
			r.forEach((n, c) => {
				let l = o(Math.min(n.from, n.to), this.min, this.max, this.arc), u = o(Math.max(n.from, n.to), this.min, this.max, this.arc), f = c === 0 && l <= this.arc.start + 1e-6, p = c === r.length - 1 && u >= this.arc.end - 1e-6;
				if (f || (l += t / 2), p || (u -= t / 2), u <= l) return;
				let m = d && this.shown < Math.min(n.from, n.to) ? .35 : 1, h = this.hovered === n;
				e.save(), e.globalAlpha = m, e.lineWidth = h ? i + 4 : i, this.strokeArcCapped(a, l, u, n.color, s && f && !this.full, s && p && !this.full), e.restore();
			});
		} else if (n.gradient && n.gradient.length >= 2) {
			let t = this.gradientFill(n.gradient);
			e.save(), e.lineWidth = i, e.lineCap = s && !this.full ? "round" : "butt", d ? (e.globalAlpha = .25, this.strokeArc(a, this.arc.start, this.arc.end, t), e.globalAlpha = 1, u > this.arc.start + 1e-4 && this.strokeArc(a, this.arc.start, u, t)) : this.strokeArc(a, this.arc.start, this.arc.end, t), e.restore();
		}
		if (d && !l.length && !n.gradient && u > this.arc.start + 1e-4) {
			let t = typeof n.progress == "object" && n.progress.color ? n.progress.color : "#2962ff";
			e.lineWidth = i, e.lineCap = s ? "round" : "butt", this.strokeArc(a, this.arc.start, u, t);
		}
		this.drawTicks(), this.drawZoneLabels(), this.drawSecondaryScale(), this.drawMarkers(), n.pointers?.length ? this.drawPointers() : c.show && this.drawNeedle(u, c), this.drawText();
	}
	drawPointers() {
		let e = this.needleOpts(), t = this.opts.pointers;
		t.forEach((t, n) => {
			let r = o(this.extraShown[n] ?? this.min, this.min, this.max, this.arc);
			this.drawNeedle(r, {
				...e,
				shape: t.shape ?? e.shape,
				color: t.color ?? e.color,
				width: t.width ?? e.width,
				length: t.length ?? e.length,
				hub: !1
			});
		}), e.hub && this.drawHub(t[t.length - 1].color ?? e.color, Math.max(...t.map((t) => t.width ?? e.width)));
	}
	drawHub(e, t) {
		let n = this.ctx;
		n.fillStyle = e, n.beginPath(), n.arc(this.cx, this.cy, t * 1.8, 0, Math.PI * 2), n.fill(), n.fillStyle = this.theme.background === "transparent" ? "rgba(0,0,0,0.35)" : this.theme.background, n.beginPath(), n.arc(this.cx, this.cy, t * .75, 0, Math.PI * 2), n.fill();
	}
	drawZoneLabels() {
		let e = this.opts.zoneLabels;
		if (!e) return;
		let t = typeof e == "object" ? e : {}, n = this.ctx, r = this.radius, i = t.fontSize ?? a(r * .075, 10, 15), s = this.opts.secondaryScale ? this.secondaryGeom().labels - i * 1.6 : r - this.thickness - i * 1.6;
		n.save(), n.font = `600 ${i}px ${this.theme.font}`, n.textAlign = "center", n.textBaseline = "middle";
		for (let e of this.opts.zones ?? []) {
			if (!e.label) continue;
			let r = o((e.from + e.to) / 2, this.min, this.max, this.arc);
			n.fillStyle = t.color ?? e.color, n.fillText(e.label, this.cx + Math.cos(r) * s, this.cy + Math.sin(r) * s);
		}
		n.restore();
	}
	drawSecondaryScale() {
		let e = this.opts.secondaryScale;
		if (!e) return;
		let n = this.ctx, r = this.radius, { base: i, labels: a, size: o } = this.secondaryGeom(), s = e.color ?? this.theme.muted, l = (t) => this.arc.start + (t - e.min) / (e.max - e.min || 1) * (this.arc.end - this.arc.start), u = c(e.min, e.max, e.major ?? 6), d = e.minor ?? 4;
		n.save(), n.strokeStyle = s, n.lineWidth = 1, n.beginPath(), n.arc(this.cx, this.cy, i, this.arc.start, this.arc.end), n.stroke(), n.beginPath();
		for (let e = 0; e < u.length - 1; e++) for (let t = 1; t <= d; t++) this.tickLine(l(u[e] + (u[e + 1] - u[e]) * t / (d + 1)), i, i - Math.max(3, r * .03));
		n.stroke(), n.lineWidth = 1.5, n.beginPath();
		for (let e of u) this.tickLine(l(e), i, i - Math.max(5, r * .06));
		n.stroke(), n.font = `${o}px ${this.theme.font}`, n.fillStyle = s, n.textAlign = "center", n.textBaseline = "middle";
		let f = e.format ?? ((e) => t(e));
		u.forEach((e, t) => {
			if (this.full && t === u.length - 1) return;
			let r = l(e);
			n.fillText(f(e), this.cx + Math.cos(r) * a, this.cy + Math.sin(r) * a);
		}), e.label && (n.font = `600 ${o}px ${this.theme.font}`, n.fillText(e.label, this.cx, this.cy - a * .45)), n.restore();
	}
	secondaryGeom() {
		let e = this.radius, t = this.thickness, n = this.opts.ticks ?? {}, r = n.show !== !1 && (n.position ?? "inside") === "inside", i = a(e * .07, 9, 12), o = r ? e - t - Math.max(6, e * .075) - a(e * .085, 9, 14) * 2.2 - 8 : e - t - 6;
		return {
			base: o,
			labels: o - Math.max(5, e * .06) - i * 1.1,
			size: i
		};
	}
	drawRings() {
		let e = this.ctx, t = this.opts, n = t.rings, r = this.radius, i = this.thickness, s = i * .35, c = t.rounded ?? !0, l = [
			"#2962ff",
			"#089981",
			"#ff9800",
			"#f23645",
			"#9c27b0"
		];
		n.forEach((t, n) => {
			let a = r - i / 2 - n * (i + s);
			if (a <= i / 2) return;
			let u = t.color ?? l[n % l.length];
			e.lineWidth = i, e.lineCap = "butt", this.strokeArc(a, this.arc.start, this.arc.end, this.theme.track);
			let d = o(this.extraShown[n] ?? this.min, this.min, this.max, this.arc);
			d > this.arc.start + 1e-4 && (e.lineCap = c ? "round" : "butt", this.strokeArc(a, this.arc.start, d, u));
		});
		let u = a((r - n.length * (i + s)) * .2, 10, 20), d = u * 1.35;
		e.save(), e.textBaseline = "middle";
		let f = this.cy - (n.length - 1) * d / 2 - (t.title ? d * .6 : 0);
		t.title && (e.font = `600 ${u * .8}px ${this.theme.font}`, e.fillStyle = this.theme.muted, e.textAlign = "center", e.fillText(t.title, this.cx, f - d * .6)), n.forEach((n, r) => {
			let i = f + r * d + (t.title ? d * .6 : 0), a = n.color ?? l[r % l.length], o = `${this.fmt(this.extraShown[r] ?? this.min)}${t.unit ?? ""}`;
			e.font = `500 ${u * .8}px ${this.theme.font}`, e.fillStyle = this.theme.muted, e.textAlign = "right", e.fillText(n.label ?? "", this.cx - 4, i), e.font = `700 ${u}px ${this.theme.font}`, e.fillStyle = a, e.textAlign = "left", e.fillText(o, this.cx + 4, i);
		}), e.restore();
	}
	strokeArc(e, t, n, r) {
		let i = this.ctx;
		i.strokeStyle = r, i.beginPath(), i.arc(this.cx, this.cy, e, t, n), i.stroke();
	}
	strokeArcCapped(e, t, n, r, i, a) {
		let o = this.ctx, s = o.lineWidth;
		o.lineCap = "butt", this.strokeArc(e, t, n, r), o.fillStyle = r;
		for (let [r, c] of [[i, t], [a, n]]) r && (o.beginPath(), o.arc(this.cx + Math.cos(c) * e, this.cy + Math.sin(c) * e, s / 2, 0, Math.PI * 2), o.fill());
	}
	gradientFill(e) {
		let t = this.ctx, n = this.arc.end - this.arc.start, r = t.createConicGradient(this.arc.start, this.cx, this.cy), i = Math.min(1, n / (Math.PI * 2));
		return e.forEach((t, n) => r.addColorStop(n / (e.length - 1) * i * .9999, t)), i < 1 && r.addColorStop(Math.min(1, i + .001), e[e.length - 1]), r;
	}
	drawTicks() {
		let e = this.opts.ticks ?? {};
		if (e.show === !1) return;
		let n = this.ctx, r = this.radius, i = this.thickness, s = e.position ?? "inside", l = s === "on", u = s === "inside" || l, d = c(this.min, this.max, e.major ?? 6), f = e.minor ?? 4, p = e.color ?? (l ? "#ffffff" : this.theme.muted), m = l ? r : u ? r - i - 4 : r + 4, h = u ? -1 : 1, g = l ? i : Math.max(6, r * .075), _ = l ? i * .35 : Math.max(3, r * .035);
		n.save(), n.strokeStyle = p, n.lineCap = "butt", n.lineWidth = 1, n.globalAlpha = .6, n.beginPath();
		for (let e = 0; e < d.length - 1; e++) for (let t = 1; t <= f; t++) {
			let n = o(d[e] + (d[e + 1] - d[e]) * t / (f + 1), this.min, this.max, this.arc);
			this.tickLine(n, m, m + h * _);
		}
		n.stroke(), n.globalAlpha = 1, n.lineWidth = 2, n.beginPath();
		for (let e of d) this.tickLine(o(e, this.min, this.max, this.arc), m, m + h * g);
		if (n.stroke(), e.labels ?? !0) {
			let i = a(r * .085, 9, 14);
			n.font = `${i}px ${this.theme.font}`, n.fillStyle = l ? e.color ?? this.theme.muted : p, n.textAlign = "center", n.textBaseline = "middle";
			let s = m + h * (g + i * 1.1), c = e.format ?? ((e) => t(e));
			d.forEach((e, t) => {
				if (this.full && t === d.length - 1) return;
				let r = o(e, this.min, this.max, this.arc);
				n.fillText(c(e), this.cx + Math.cos(r) * s, this.cy + Math.sin(r) * s);
			});
		}
		n.restore();
	}
	tickLine(e, t, n) {
		let r = Math.cos(e), i = Math.sin(e);
		this.ctx.moveTo(this.cx + r * t, this.cy + i * t), this.ctx.lineTo(this.cx + r * n, this.cy + i * n);
	}
	drawMarkers() {
		let e = this.ctx, t = this.radius;
		e.save(), e.font = `600 ${a(t * .075, 9, 12)}px ${this.theme.font}`, e.textAlign = "center", e.textBaseline = "middle";
		for (let n of this.opts.markers ?? []) {
			let r = o(n.value, this.min, this.max, this.arc), i = n.color ?? this.theme.text, a = t + 2, s = Math.max(5, t * .05) * (this.hovered === n ? 1.4 : 1), c = Math.cos(r), l = Math.sin(r);
			if (e.fillStyle = i, e.beginPath(), e.moveTo(this.cx + c * a, this.cy + l * a), e.lineTo(this.cx + c * (a + s * 1.6) - l * s, this.cy + l * (a + s * 1.6) + c * s), e.lineTo(this.cx + c * (a + s * 1.6) + l * s, this.cy + l * (a + s * 1.6) - c * s), e.closePath(), e.fill(), e.strokeStyle = i, e.lineWidth = 2, e.beginPath(), this.tickLine(r, t - this.thickness, t), e.stroke(), n.label) {
				let t = a + s * 1.6 + 10;
				e.fillText(n.label, this.cx + c * t, this.cy + l * t);
			}
		}
		e.restore();
	}
	needleOpts() {
		let e = this.opts.needle, t = typeof e == "object" ? e : {}, n = e === void 0 || e !== !1;
		return {
			show: t.show ?? n,
			shape: t.shape ?? "classic",
			color: t.color === "zone" ? l(this.shown, this.opts.zones)?.color ?? this.theme.needle : t.color ?? this.theme.needle,
			width: t.width ?? Math.max(3, this.radius * .045),
			length: t.length ?? .82,
			hub: t.hub ?? !0
		};
	}
	drawNeedle(e, t) {
		let n = this.ctx, r = this.radius * t.length, i = Math.cos(e), a = Math.sin(e), o = t.width;
		n.save(), n.fillStyle = t.color, n.strokeStyle = t.color, n.shadowColor = "rgba(0,0,0,0.35)", n.shadowBlur = 6, n.shadowOffsetY = 2;
		let s = this.cx + i * r, c = this.cy + a * r;
		if (t.shape === "line") n.lineWidth = o * .6, n.lineCap = "round", n.beginPath(), n.moveTo(this.cx - i * r * .12, this.cy - a * r * .12), n.lineTo(s, c), n.stroke();
		else if (t.shape === "arrow") {
			n.lineWidth = o * .5, n.beginPath(), n.moveTo(this.cx, this.cy), n.lineTo(this.cx + i * (r - o * 2.5), this.cy + a * (r - o * 2.5)), n.stroke();
			let e = this.cx + i * (r - o * 3), t = this.cy + a * (r - o * 3);
			n.beginPath(), n.moveTo(s, c), n.lineTo(e - a * o * 1.3, t + i * o * 1.3), n.lineTo(e + a * o * 1.3, t - i * o * 1.3), n.closePath(), n.fill();
		} else {
			let e = r * .16;
			n.beginPath(), n.moveTo(s, c), n.lineTo(this.cx - a * o, this.cy + i * o), n.lineTo(this.cx - i * e - a * o * .5, this.cy - a * e + i * o * .5), n.lineTo(this.cx - i * e + a * o * .5, this.cy - a * e - i * o * .5), n.lineTo(this.cx + a * o, this.cy - i * o), n.closePath(), n.fill();
		}
		n.restore(), t.hub && (n.fillStyle = t.color, n.beginPath(), n.arc(this.cx, this.cy, o * 1.8, 0, Math.PI * 2), n.fill(), n.fillStyle = this.theme.background === "transparent" ? "rgba(0,0,0,0.35)" : this.theme.background, n.beginPath(), n.arc(this.cx, this.cy, o * .75, 0, Math.PI * 2), n.fill());
	}
	drawText() {
		let e = this.ctx, n = this.opts, r = this.theme, i = this.radius;
		if (n.pointers?.length) {
			this.drawPointerValues();
			return;
		}
		let o = this.needleOpts().show, s = l(this.shown, n.zones), c = (n.valueColorByZone ?? !0) && s ? s.color : r.text, u = n.valueSize === void 0 || n.valueSize === "auto" ? a(i * (o ? .24 : .32), 14, 64) : n.valueSize, d = this.arc.end - this.arc.start, f;
		f = this.textBelowHub ? this.cy + this.needleOpts().width * 1.8 + u * .75 : this.full || !o ? this.cy + (d <= Math.PI + 1e-6 && !this.full ? -u * .45 : 0) : this.cy + i * .42;
		let p = this.fmt(this.shown);
		e.save(), e.textAlign = "center", e.textBaseline = "middle", e.font = `700 ${u}px ${r.font}`;
		let m = e.measureText(p).width;
		if (e.fillStyle = c, n.unit) {
			e.font = `600 ${u * .42}px ${r.font}`;
			let t = e.measureText(n.unit).width + u * .15;
			e.font = `700 ${u}px ${r.font}`, e.fillText(p, this.cx - t / 2, f), e.font = `600 ${u * .42}px ${r.font}`, e.fillStyle = r.muted, e.textAlign = "left", e.fillText(n.unit, this.cx - t / 2 + m / 2 + u * .15, f + u * .12);
		} else e.fillText(p, this.cx, f);
		if (e.textAlign = "center", n.title && (e.font = `500 ${a(u * .36, 11, 18)}px ${r.font}`, e.fillStyle = r.muted, e.fillText(n.title, this.cx, f + u * .78)), n.showMinMax ?? (!this.full && n.ticks?.labels === !1)) {
			e.font = `${a(i * .08, 10, 13)}px ${r.font}`, e.fillStyle = r.muted;
			let o = i - this.thickness / 2, s = n.ticks?.format ?? ((e) => t(e));
			e.fillText(s(this.min), this.cx + Math.cos(this.arc.start) * o, this.cy + Math.sin(this.arc.start) * o + this.thickness / 2 + 12), e.fillText(s(this.max), this.cx + Math.cos(this.arc.end) * o, this.cy + Math.sin(this.arc.end) * o + this.thickness / 2 + 12);
		}
		e.restore();
	}
	drawPointerValues() {
		let e = this.opts, t = e.pointers, n = this.ctx, r = this.radius, i = this.theme;
		if (n.save(), n.textAlign = "center", n.textBaseline = "middle", e.title && (n.font = `600 ${a(r * .08, 11, 16)}px ${i.font}`, n.fillStyle = i.muted, n.fillText(e.title, this.cx, this.cy - r * .32)), e.pointerValues !== !1) {
			let o = this.textBelowHub ? this.cy + r * .18 : this.cy + r * .45, s = Math.min(r * 1.5, this.width - 20), c = s / t.length, l = a(r * .11, 12, 26);
			t.forEach((t, r) => {
				let a = this.cx - s / 2 + c * (r + .5), u = t.color ?? i.text;
				t.label && (n.font = `500 ${l * .6}px ${i.font}`, n.fillStyle = i.muted, n.fillText(t.label, a, o - l * .6)), n.font = `700 ${l}px ${i.font}`, n.fillStyle = u, n.fillText(`${this.fmt(this.extraShown[r] ?? this.min)}${e.unit ? " " + e.unit : ""}`, a, o + l * .35);
			});
		}
		n.restore();
	}
	hitTest(e, t) {
		let n = e - this.cx, r = t - this.cy, i = Math.hypot(n, r), a = this.radius, c = Math.atan2(r, n);
		for (let n of this.opts.markers ?? []) {
			let r = o(n.value, this.min, this.max, this.arc), i = this.cx + Math.cos(r) * (a + 8), s = this.cy + Math.sin(r) * (a + 8);
			if (Math.hypot(e - i, t - s) < 12) return n;
		}
		if (i >= a - this.thickness - 4 && i <= a + 4) {
			let e = s(c, this.min, this.max, this.arc);
			if (e !== null) return l(e, this.opts.zones) ?? "value";
		}
		return i < a * .6 ? "value" : null;
	}
	bind() {
		let e = this.canvas;
		e.addEventListener("pointermove", (t) => {
			let n = e.getBoundingClientRect(), r = t.clientX - n.left, i = t.clientY - n.top, a = this.hitTest(r, i), o = a && a !== "value" ? a : null;
			o !== this.hovered && (this.hovered = o, this.draw()), this.showTooltip(a, r, i);
		}), e.addEventListener("pointerleave", () => {
			this.hovered = null, this.tooltipEl.classList.remove("is-visible"), this.draw();
		});
	}
	showTooltip(e, t, n) {
		let r = this.tooltipEl, i = this.opts.tooltip;
		if (i === !1 || typeof i == "object" && i.show === !1 || !e) {
			r.classList.remove("is-visible");
			return;
		}
		let a = this.opts.unit ? ` ${this.opts.unit}` : "", o = l(this.target, this.opts.zones), s = e === "value" ? null : e;
		r.innerHTML = typeof i == "object" && i.formatter ? i.formatter({
			value: this.target,
			zone: o,
			hovered: s
		}) : e === "value" && (this.opts.pointers?.length || this.opts.rings?.length) ? `<div class="gc-tooltip__head">${g(this.opts.title ?? "Valores")}</div>${(this.opts.pointers ?? this.opts.rings ?? []).map((e, t) => `<div class="gc-tooltip__row"><span class="gc-tooltip__dot" style="background:${e.color ?? this.theme.text}"></span><span>${g(e.label ?? `#${t + 1}`)}</span><b>${g(this.fmt(e.value) + a)}</b></div>`).join("")}` : e === "value" ? `<div class="gc-tooltip__head">${g(this.opts.title ?? "Valor")}</div><div class="gc-tooltip__row">${o ? `<span class="gc-tooltip__dot" style="background:${o.color}"></span>` : ""}<span>${g(o?.label ?? "Atual")}</span><b>${g(this.fmt(this.target) + a)}</b></div>` : "from" in e ? `<div class="gc-tooltip__row"><span class="gc-tooltip__dot" style="background:${e.color}"></span><span>${g(e.label ?? "Zona")}</span><b>${g(`${this.fmt(Math.min(e.from, e.to))} – ${this.fmt(Math.max(e.from, e.to))}${a}`)}</b></div>` : `<div class="gc-tooltip__row"><span class="gc-tooltip__dot" style="background:${e.color ?? this.theme.text}"></span><span>${g(e.label ?? "Marcador")}</span><b>${g(this.fmt(e.value) + a)}</b></div>`, r.classList.add("is-visible");
		let c = r.offsetWidth, u = r.offsetHeight, d = t + 14, f = n + 14;
		d + c > this.width - 4 && (d = t - c - 14), f + u > this.height - 4 && (f = n - u - 14), r.style.transform = `translate(${Math.max(4, d)}px, ${Math.max(4, f)}px)`;
	}
};
function y(e, t = {}) {
	return new v(e, t);
}
//#endregion
export { h as a, c, m as i, o as l, y as n, s as o, p as r, i as s, v as t, l as u };

//# sourceMappingURL=gauge.js.map