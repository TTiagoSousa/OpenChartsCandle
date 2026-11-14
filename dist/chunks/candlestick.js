var e = {
	bg: "#131722",
	appBg: "#0c0e15",
	grid: "rgba(42, 46, 57, 0.55)",
	border: "#2a2e39",
	text: "#b2b5be",
	textStrong: "#d1d4dc",
	muted: "#787b86",
	up: "#089981",
	down: "#f23645",
	wickUp: "#089981",
	wickDown: "#f23645",
	borderUp: "#089981",
	borderDown: "#f23645",
	candleBorder: !1,
	line: "#2962ff",
	crosshair: "#9598a1",
	crosshairLabel: "#363a45",
	accent: "#2962ff",
	selection: "rgba(41, 98, 255, 0.18)",
	handleFill: "#131722",
	font: "-apple-system, BlinkMacSystemFont, \"Trebuchet MS\", Roboto, Ubuntu, sans-serif",
	fontSize: 12
}, t = {
	...e,
	bg: "#ffffff",
	appBg: "#e9ecf2",
	grid: "rgba(42, 46, 57, 0.07)",
	border: "#e0e3eb",
	text: "#434651",
	textStrong: "#131722",
	muted: "#787b86",
	crosshair: "#9598a1",
	crosshairLabel: "#131722",
	handleFill: "#ffffff"
}, n = { ...e }, r = { ...e };
function i(e = {}, t = n) {
	let r = {
		...t,
		...e
	};
	return e.up && !e.wickUp && (r.wickUp = e.up), e.down && !e.wickDown && (r.wickDown = e.down), e.up && !e.borderUp && (r.borderUp = e.up), e.down && !e.borderDown && (r.borderDown = e.down), e.bg && !e.handleFill && (r.handleFill = e.bg), r;
}
function a(e = r.fontSize, t = "") {
	return `${t ? t + " " : ""}${e}px ${r.font}`;
}
//#endregion
//#region src/candlestick/core/timezone.ts
var o = [
	{
		id: "local",
		label: "Hora do browser"
	},
	{
		id: "exchange",
		label: "Bolsa do símbolo"
	},
	{
		id: "UTC",
		label: "UTC"
	},
	{
		id: "Europe/Lisbon",
		label: "Lisboa"
	},
	{
		id: "Europe/London",
		label: "Londres"
	},
	{
		id: "Europe/Madrid",
		label: "Madrid"
	},
	{
		id: "Europe/Berlin",
		label: "Berlim / Frankfurt"
	},
	{
		id: "Europe/Moscow",
		label: "Moscovo"
	},
	{
		id: "America/Sao_Paulo",
		label: "São Paulo"
	},
	{
		id: "America/New_York",
		label: "Nova Iorque"
	},
	{
		id: "America/Chicago",
		label: "Chicago"
	},
	{
		id: "America/Los_Angeles",
		label: "Los Angeles"
	},
	{
		id: "Asia/Dubai",
		label: "Dubai"
	},
	{
		id: "Asia/Kolkata",
		label: "Bombaim"
	},
	{
		id: "Asia/Hong_Kong",
		label: "Hong Kong"
	},
	{
		id: "Asia/Shanghai",
		label: "Xangai"
	},
	{
		id: "Asia/Tokyo",
		label: "Tóquio"
	},
	{
		id: "Australia/Sydney",
		label: "Sydney"
	}
];
function s(e) {
	e !== "local" && e !== "UTC" && e !== "exchange" && new Intl.DateTimeFormat("en-US", { timeZone: e });
}
var c = class {
	constructor(e = "local") {
		this.id = e, this.dtf = null, this.cache = /* @__PURE__ */ new Map(), e !== "local" && e !== "UTC" && (this.dtf = new Intl.DateTimeFormat("en-US", {
			timeZone: e,
			hourCycle: "h23",
			year: "numeric",
			month: "numeric",
			day: "numeric",
			hour: "numeric",
			minute: "numeric",
			second: "numeric"
		}));
	}
	offset(e) {
		if (this.id === "UTC") return 0;
		if (!this.dtf) return -(/* @__PURE__ */ new Date(e * 1e3)).getTimezoneOffset() * 60;
		let t = Math.floor(e / 900), n = this.cache.get(t);
		if (n === void 0) {
			let e = t * 900 * 1e3, r = {};
			for (let t of this.dtf.formatToParts(e)) t.type !== "literal" && (r[t.type] = Number(t.value));
			n = (Date.UTC(r.year, r.month - 1, r.day, r.hour % 24, r.minute, r.second) - e) / 1e3, this.cache.size > 2e4 && this.cache.clear(), this.cache.set(t, n);
		}
		return n;
	}
	wall(e) {
		return /* @__PURE__ */ new Date((e + this.offset(e)) * 1e3);
	}
	label(e = Date.now() / 1e3) {
		let t = Math.round(this.offset(e) / 60), n = Math.trunc(Math.abs(t) / 60), r = Math.abs(t) % 60;
		return `UTC${t < 0 ? "-" : "+"}${n}${r ? ":" + String(r).padStart(2, "0") : ""}`;
	}
};
function l(e, t, n, r, i = 0, a = 0) {
	let o = Date.UTC(t, n, r, i, a) / 1e3, s = o - e.offset(o);
	return s = o - e.offset(s), s;
}
function u(e) {
	return /* @__PURE__ */ new Date((e + 43200) * 1e3);
}
//#endregion
//#region src/candlestick/core/utils.ts
var d = (e, t, n) => e < t ? t : e > n ? n : e;
function f(e, t) {
	return isFinite(e) ? e.toFixed(t) : "—";
}
function p(e, t = 2) {
	return isFinite(e) ? e.toLocaleString("en-US", {
		minimumFractionDigits: t,
		maximumFractionDigits: t
	}) : "—";
}
function m(e) {
	if (!isFinite(e)) return "—";
	let t = Math.abs(e);
	return t >= 1e9 ? (e / 1e9).toFixed(2) + "B" : t >= 1e6 ? (e / 1e6).toFixed(2) + "M" : t >= 1e3 ? (e / 1e3).toFixed(2) + "K" : e.toFixed(t < 10 ? 2 : 0);
}
function h(e) {
	if (e <= 0 || !isFinite(e)) return 1;
	let t = 10 ** Math.floor(Math.log10(e)), n = e / t, r;
	return r = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10, r * t;
}
function g(e, t) {
	let { r: n, g: r, b: i } = _(e);
	return `rgba(${n},${r},${i},${t})`;
}
function _(e) {
	let t = e.trim();
	if (t.startsWith("#")) {
		let e = t.slice(1);
		return e.length === 3 && (e = e.split("").map((e) => e + e).join("")), {
			r: parseInt(e.slice(0, 2), 16),
			g: parseInt(e.slice(2, 4), 16),
			b: parseInt(e.slice(4, 6), 16),
			a: e.length === 8 ? parseInt(e.slice(6, 8), 16) / 255 : 1
		};
	}
	let n = t.match(/rgba?\(([^)]+)\)/);
	if (n) {
		let e = n[1].split(",").map((e) => parseFloat(e));
		return {
			r: e[0],
			g: e[1],
			b: e[2],
			a: e.length > 3 ? e[3] : 1
		};
	}
	return {
		r: 41,
		g: 98,
		b: 255,
		a: 1
	};
}
function v(e, t, n, r, i, a) {
	let o = i - n, s = a - r, c = o * o + s * s, l = c === 0 ? 0 : ((e - n) * o + (t - r) * s) / c;
	l = d(l, 0, 1);
	let u = n + l * o, f = r + l * s;
	return Math.hypot(e - u, t - f);
}
function y(e, t, n, r, i, a, o, s) {
	let c = i - n, l = a - r, u = c * c + l * l, d = u === 0 ? 0 : ((e - n) * c + (t - r) * l) / u;
	return o || (d = Math.max(d, 0)), s || (d = Math.min(d, 1)), Math.hypot(e - (n + d * c), t - (r + d * l));
}
var b = 0;
function x(e = "id") {
	return b++, `${e}_${Date.now().toString(36)}_${b.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}
var S = (e) => e < 10 ? "0" + e : "" + e, C = [
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
], ee = [
	"Dom",
	"Seg",
	"Ter",
	"Qua",
	"Qui",
	"Sex",
	"Sáb"
];
function w(e, t, n) {
	let r = t >= 86400 ? u(e) : (n ?? te).wall(e), i = `${ee[r.getUTCDay()]} ${S(r.getUTCDate())} ${C[r.getUTCMonth()]} '${String(r.getUTCFullYear()).slice(2)}`;
	return t >= 86400 ? i : `${i}  ${S(r.getUTCHours())}:${S(r.getUTCMinutes())}`;
}
var te = new c();
function ne(e) {
	let t = Math.abs(Math.round(e)), n = Math.floor(t / 86400), r = Math.floor(t % 86400 / 3600), i = Math.floor(t % 3600 / 60), a = [];
	return n && a.push(`${n}d`), r && a.push(`${r}h`), (i || a.length === 0) && a.push(`${i}m`), a.join(" ");
}
function re(e) {
	let t = Math.max(0, Math.floor(e)), n = Math.floor(t / 86400), r = Math.floor(t % 86400 / 3600), i = Math.floor(t % 3600 / 60), a = t % 60;
	return n > 0 ? `${n}d ${S(r)}h` : r > 0 ? `${S(r)}:${S(i)}:${S(a)}` : `${S(i)}:${S(a)}`;
}
var T = class {
	constructor() {
		this.handlers = /* @__PURE__ */ new Set();
	}
	on(e) {
		return this.handlers.add(e), () => this.handlers.delete(e);
	}
	emit(e) {
		this.handlers.forEach((t) => t(e));
	}
	get size() {
		return this.handlers.size;
	}
};
function ie(e, t) {
	try {
		let n = localStorage.getItem(e);
		return n ? JSON.parse(n) : t;
	} catch {
		return t;
	}
}
function ae(e, t) {
	try {
		localStorage.setItem(e, JSON.stringify(t));
	} catch {}
}
//#endregion
//#region src/candlestick/drawings/base.ts
var oe = [
	{
		value: 0,
		color: "#787b86",
		enabled: !0
	},
	{
		value: .236,
		color: "#f23645",
		enabled: !0
	},
	{
		value: .382,
		color: "#ff9800",
		enabled: !0
	},
	{
		value: .5,
		color: "#4caf50",
		enabled: !0
	},
	{
		value: .618,
		color: "#089981",
		enabled: !0
	},
	{
		value: .786,
		color: "#00bcd4",
		enabled: !0
	},
	{
		value: 1,
		color: "#787b86",
		enabled: !0
	},
	{
		value: 1.618,
		color: "#2962ff",
		enabled: !0
	},
	{
		value: 2.618,
		color: "#f23645",
		enabled: !0
	},
	{
		value: 3.618,
		color: "#9c27b0",
		enabled: !0
	},
	{
		value: 4.236,
		color: "#e91e63",
		enabled: !0
	},
	{
		value: 1.272,
		color: "#ff9800",
		enabled: !1
	},
	{
		value: 1.414,
		color: "#f23645",
		enabled: !1
	},
	{
		value: 2,
		color: "#089981",
		enabled: !1
	}
], se = 5.5, E = class {
	constructor(e) {
		this.id = x("drw"), this.points = [], this.locked = !1, this.hidden = !1, this.opts = {
			...le(),
			...this.defaults(),
			...e ?? {}
		};
	}
	defaults() {
		return {};
	}
	settings() {
		return [
			{
				key: "color",
				label: "Linha",
				type: "color"
			},
			{
				key: "width",
				label: "Espessura",
				type: "width"
			},
			{
				key: "dash",
				label: "Estilo",
				type: "dash"
			}
		];
	}
	init(e) {}
	handles(e) {
		return this.points.map((t) => e.toXY(t));
	}
	insideFill(e, t, n) {
		return !1;
	}
	hitTest(e, t, n, r) {
		if (this.hidden) return null;
		if (r) {
			let r = this.handles(e);
			for (let e = r.length - 1; e >= 0; e--) if (Math.hypot(r[e].x - t, r[e].y - n) <= 8.5) return {
				kind: "handle",
				index: e,
				cursor: r[e].cursor ?? "pointer"
			};
		}
		return this.distance(e, t, n) <= 6 || this.insideFill(e, t, n) ? {
			kind: "body",
			index: -1,
			cursor: "pointer"
		} : null;
	}
	moveHandle(e, t, n, r) {
		e < this.points.length && (this.points[e] = { ...t });
	}
	setCreationPoint(e, t, n, r) {
		this.moveHandle(e, t, n, r);
	}
	axisMarks(e) {
		return {
			prices: this.points.map((e) => ({ price: e.price })),
			times: this.points.map((e) => e.time),
			...ce(this.points)
		};
	}
	clone() {
		let e = Object.create(Object.getPrototypeOf(this));
		return Object.assign(e, this), e.id = x("drw"), e.points = this.points.map((e) => ({ ...e })), e.opts = JSON.parse(JSON.stringify(this.opts)), e;
	}
	toJSON() {
		return {
			type: this.type,
			id: this.id,
			points: this.points,
			opts: this.opts,
			locked: this.locked,
			hidden: this.hidden
		};
	}
};
function ce(e) {
	if (e.length < 2) return {};
	let t = e.map((e) => e.price), n = e.map((e) => e.time);
	return {
		priceBand: [Math.min(...t), Math.max(...t)],
		timeBand: [Math.min(...n), Math.max(...n)]
	};
}
function le() {
	return {
		color: r.accent,
		width: 2,
		dash: "solid",
		fill: g(r.accent, .2),
		fillEnabled: !0,
		extendLeft: !1,
		extendRight: !1,
		text: "",
		textColor: r.accent,
		fontSize: 14,
		showLabels: !0,
		showPrice: !0,
		levels: []
	};
}
function ue(e, t) {
	return e === "dashed" ? [Math.max(4, t * 3), Math.max(3, t * 2)] : e === "dotted" ? [Math.max(1, t), Math.max(2, t * 1.6)] : [];
}
function D(e, t, n, r = "solid") {
	e.strokeStyle = t, e.lineWidth = n, e.setLineDash(ue(r, n)), e.lineCap = r === "dotted" ? "round" : "butt", e.lineJoin = "round";
}
function de(e, t, n, r, i, a, o, s) {
	let c = n - e, l = r - t;
	if (c === 0 && l === 0) return [
		e,
		t,
		n,
		r
	];
	let u = (Math.abs(i) + Math.abs(a) + Math.abs(e) + Math.abs(n) + Math.abs(t) + Math.abs(r)) * 4 + 1e4, d = Math.hypot(c, l), f = c / d, p = l / d, m = e, h = t, g = n, _ = r;
	return o && (m = e - f * u, h = t - p * u), s && (g = n + f * u, _ = r + p * u), [
		m,
		h,
		g,
		_
	];
}
function O(e, t, n, r, i) {
	e.beginPath(), e.moveTo(t, n), e.lineTo(r, i), e.stroke();
}
function k(e, t, n, r, i, a) {
	let o = fe(i, a, t.dpr);
	O(e, n, o, r, o);
}
function A(e, t, n, r, i, a) {
	let o = fe(n, a, t.dpr);
	O(e, o, r, o, i);
}
function fe(e, t, n) {
	let r = Math.round(e * n);
	return (Math.max(1, Math.round(t * n)) % 2 == 1 ? r + .5 : r) / n;
}
function pe(e, t, n = r.accent) {
	e.save(), e.setLineDash([]);
	for (let i of t) e.beginPath(), e.arc(i.x, i.y, se, 0, Math.PI * 2), e.fillStyle = r.handleFill, e.fill(), e.lineWidth = 1.5, e.strokeStyle = n, e.stroke();
	e.restore();
}
function j(e, t, n, r, i, a) {
	let o = Math.atan2(i - n, r - t), s = 6 + a * 2.5;
	e.save(), e.setLineDash([]), e.beginPath(), e.moveTo(r - s * Math.cos(o - Math.PI / 7), i - s * Math.sin(o - Math.PI / 7)), e.lineTo(r, i), e.lineTo(r - s * Math.cos(o + Math.PI / 7), i - s * Math.sin(o + Math.PI / 7)), e.stroke(), e.restore();
}
function M(e, t, n, i, o = {}) {
	let s = o.size ?? 12;
	e.save(), e.font = a(s, o.bold ? "600" : ""), e.setLineDash([]);
	let c = t.split("\n"), l = o.padX ?? (o.bg ? 8 : 0), u = o.padY ?? (o.bg ? 5 : 0), d = Math.round(s * 1.3), f = Math.max(...c.map((t) => e.measureText(t).width)) + l * 2, p = d * c.length + u * 2, m = o.align ?? "left", h = o.baseline ?? "middle", g = m === "center" ? n - f / 2 : m === "right" ? n - f : n, _ = h === "middle" ? i - p / 2 : h === "bottom" ? i - p : i;
	return g = Math.round(g), _ = Math.round(_), o.bg && (e.fillStyle = o.bg, me(e, g, _, f, p, o.radius ?? 3), e.fill()), e.fillStyle = o.color ?? r.textStrong, e.textBaseline = "middle", e.textAlign = "center", c.forEach((t, n) => e.fillText(t, g + f / 2, _ + u + d * n + d / 2 + .5)), e.restore(), {
		x: g,
		y: _,
		w: f,
		h: p
	};
}
function me(e, t, n, r, i, a) {
	let o = Math.min(a, r / 2, i / 2);
	e.beginPath(), e.moveTo(t + o, n), e.arcTo(t + r, n, t + r, n + i, o), e.arcTo(t + r, n + i, t, n + i, o), e.arcTo(t, n + i, t, n, o), e.arcTo(t, n, t + r, n, o), e.closePath();
}
//#endregion
//#region src/candlestick/indicators/volume-profile.ts
function he(e, t, n, r) {
	let i = e.length, a = r.close >= r.open, o = r.high - r.low;
	if (o <= 0) {
		let o = Math.max(0, Math.min(i - 1, Math.floor((r.close - t) / n)));
		a ? e[o].up += r.volume : e[o].down += r.volume;
		return;
	}
	let s = Math.max(0, Math.floor((r.low - t) / n)), c = Math.min(i - 1, Math.floor((r.high - t) / n));
	for (let t = s; t <= c; t++) {
		let n = Math.min(r.high, e[t].hi) - Math.max(r.low, e[t].lo);
		if (n <= 0) continue;
		let i = r.volume * n / o;
		a ? e[t].up += i : e[t].down += i;
	}
}
function ge(e, t) {
	let n = e.length, r = 0, i = 0, a = 0;
	e.forEach((e, t) => {
		let n = e.up + e.down;
		a += n, n > i && (i = n, r = t);
	});
	let o = r, s = r, c = i;
	for (; c < a * t && (o > 0 || s < n - 1);) {
		let t = o > 0 ? e[o - 1].up + e[o - 1].down : -1, r = s < n - 1 ? e[s + 1].up + e[s + 1].down : -1;
		r >= t ? (s++, c += r) : (o--, c += t);
	}
	return {
		poc: r,
		vaLow: o,
		vaHigh: s,
		max: i,
		total: a
	};
}
var _e = 2e3;
function ve(e, t, n, r, i = .7, a = 0) {
	if (t = Math.max(0, t), n = Math.min(e.length - 1, n), n < t) return null;
	let o = Infinity, s = -Infinity;
	for (let r = t; r <= n; r++) e[r].low < o && (o = e[r].low), e[r].high > s && (s = e[r].high);
	if (!isFinite(o) || !isFinite(s)) return null;
	let c, l;
	if (a > 0) o = Math.floor(o / a + 1e-9) * a, c = Math.max(1, Math.ceil((s - o) / a - 1e-9)), o + c * a <= s && c++, l = a, c > _e && (c = _e, l = (s - o) / c);
	else {
		if (!(s > o)) return null;
		c = Math.max(1, Math.round(r)), l = (s - o) / c;
	}
	let u = [];
	for (let e = 0; e < c; e++) u.push({
		lo: o + e * l,
		hi: o + (e + 1) * l,
		up: 0,
		down: 0
	});
	for (let r = t; r <= n; r++) he(u, o, l, e[r]);
	return {
		rows: u,
		...ge(u, i)
	};
}
function ye(e, t, n, r, i = .7) {
	let a = r.rows.map((e) => ({
		lo: e.lo,
		hi: e.hi,
		up: 0,
		down: 0
	})), o = a[0].lo, s = a[0].hi - a[0].lo, c = [], l = [], u = [];
	for (let r = t; r <= n; r++) {
		he(a, o, s, e[r]);
		let t = ge(a, i);
		c.push((a[t.poc].lo + a[t.poc].hi) / 2), l.push(a[t.vaHigh].hi), u.push(a[t.vaLow].lo);
	}
	return {
		poc: c,
		vah: l,
		val: u
	};
}
var be = {
	up: "rgba(41, 98, 255, 0.55)",
	down: "rgba(251, 192, 45, 0.55)",
	upOut: "rgba(41, 98, 255, 0.22)",
	downOut: "rgba(251, 192, 45, 0.22)",
	poc: "#f23645"
};
function xe(e, t, n, r, i, a, o, s) {
	t.rows.forEach((o, s) => {
		let c = n(o.hi), l = n(o.lo), u = Math.min(c, l) + .5, d = Math.max(1, Math.abs(l - c) - 1), f = s >= t.vaLow && s <= t.vaHigh, p = o.up / t.max * i, m = o.down / t.max * i;
		e.fillStyle = f ? be.up : be.upOut, a === 1 ? e.fillRect(r, u, p, d) : e.fillRect(r - p, u, p, d), e.fillStyle = f ? be.down : be.downOut, a === 1 ? e.fillRect(r + p, u, m, d) : e.fillRect(r - p - m, u, m, d);
	});
	let c = t.rows[t.poc], l = Math.round(n((c.lo + c.hi) / 2)) + .5;
	e.strokeStyle = be.poc, e.lineWidth = 1, e.setLineDash([]), e.beginPath(), e.moveTo(o, l), e.lineTo(s, l), e.stroke();
}
//#endregion
//#region src/candlestick/drawings/tools.ts
function Se(e, t) {
	return e.data.indexToTime(Math.round(e.ts.xToIndex(t)));
}
function Ce(e, t, n) {
	let r = e.toXY(t), i = e.toXY(n), a = i.x - r.x, o = i.y - r.y, s = Math.PI / 4, c = Math.round(Math.atan2(o, a) / s) * s, l = Math.hypot(a, o), u = r.x + Math.cos(c) * l, d = r.y + Math.sin(c) * l, f = Math.abs(Math.sin(c)) < 1e-6;
	return {
		time: Math.abs(Math.cos(c)) < 1e-6 ? t.time : Se(e, u),
		price: f ? t.price : e.yToPrice(d)
	};
}
function we(e, t) {
	return e.data.timeToIndex(t);
}
function Te(e, t, n, r) {
	let i = we(e, t.time), a = we(e, n.time);
	return a === i ? t.price : t.price + (n.price - t.price) * (we(e, r) - i) / (a - i);
}
function Ee(e, t, n, r, i, o) {
	if (!t.opts.text) return;
	let s = Math.atan2(o - r, i - n);
	s > Math.PI / 2 && (s -= Math.PI), s < -Math.PI / 2 && (s += Math.PI), e.save(), e.translate((n + i) / 2, (r + o) / 2), e.rotate(s), e.font = a(t.opts.fontSize), e.fillStyle = t.opts.textColor || t.opts.color, e.textAlign = "center", e.textBaseline = "bottom", e.fillText(t.opts.text, 0, -4), e.restore();
}
var De = (e) => (e >= 0 ? "" : "−") + Math.abs(e).toFixed(2) + "%", Oe = (e, t) => t >= 0 ? e : "−" + e.replace("-", "");
function ke() {
	return [{
		key: "fill",
		label: "Fundo",
		type: "fill"
	}];
}
var Ae = class extends E {
	constructor(...e) {
		super(...e), this.type = "trendline", this.title = "Linha de tendência", this.pointsNeeded = 2, this.arrow = !1;
	}
	settings() {
		return [
			...super.settings(),
			{
				key: "extendLeft",
				label: "Estender à esquerda",
				type: "bool"
			},
			{
				key: "extendRight",
				label: "Estender à direita",
				type: "bool"
			},
			{
				key: "showLabels",
				label: "Mostrar estatísticas",
				type: "bool"
			},
			{
				key: "text",
				label: "Texto",
				type: "text"
			}
		];
	}
	defaults() {
		return { showLabels: !1 };
	}
	draw(e, t) {
		if (this.points.length < 2) return;
		let n = e.ctx, r = e.toXY(this.points[0]), i = e.toXY(this.points[1]), [a, o, s, c] = de(r.x, r.y, i.x, i.y, e.width, e.height, this.opts.extendLeft, this.opts.extendRight);
		D(n, this.opts.color, this.opts.width, this.opts.dash), O(n, a, o, s, c), this.arrow && (D(n, this.opts.color, this.opts.width), j(n, r.x, r.y, i.x, i.y, this.opts.width)), Ee(n, this, r.x, r.y, i.x, i.y), (this.opts.showLabels || t.creating && this.type === "infoline") && this.drawStats(e, r, i);
	}
	drawStats(e, t, n) {
		let [i, a] = this.points, o = a.price - i.price, s = Math.round(we(e, a.time) - we(e, i.time)), c = Math.atan2(-(n.y - t.y), n.x - t.x) * 180 / Math.PI, l = `${Oe(e.fmt(Math.abs(o)), o)} (${De(o / i.price * 100)})\n${s} barras, ${ne(a.time - i.time)}\n∠ ${c.toFixed(2)}°`;
		M(e.ctx, l, n.x + 12, n.y, {
			bg: g(r.bg, .92),
			color: r.textStrong,
			size: 12,
			align: "left"
		});
	}
	distance(e, t, n) {
		if (this.points.length < 2) return Infinity;
		let r = e.toXY(this.points[0]), i = e.toXY(this.points[1]);
		return y(t, n, r.x, r.y, i.x, i.y, this.opts.extendLeft, this.opts.extendRight);
	}
	moveHandle(e, t, n, r) {
		let i = this.points[1 - e];
		this.points[e] = r && i ? Ce(n, i, t) : { ...t };
	}
}, je = class extends Ae {
	constructor(...e) {
		super(...e), this.type = "ray", this.title = "Raio";
	}
	defaults() {
		return {
			extendRight: !0,
			showLabels: !1
		};
	}
}, Me = class extends Ae {
	constructor(...e) {
		super(...e), this.type = "extended", this.title = "Linha estendida";
	}
	defaults() {
		return {
			extendRight: !0,
			extendLeft: !0,
			showLabels: !1
		};
	}
}, Ne = class extends Ae {
	constructor(...e) {
		super(...e), this.type = "infoline", this.title = "Linha de informação";
	}
	defaults() {
		return { showLabels: !0 };
	}
}, Pe = class extends Ae {
	constructor(...e) {
		super(...e), this.type = "arrow", this.title = "Seta", this.arrow = !0;
	}
}, Fe = class extends E {
	constructor(...e) {
		super(...e), this.type = "hline", this.title = "Linha horizontal", this.pointsNeeded = 1, this.ray = !1;
	}
	defaults() {
		return { width: 1 };
	}
	settings() {
		return [
			...super.settings(),
			{
				key: "showPrice",
				label: "Etiqueta de preço",
				type: "bool"
			},
			{
				key: "text",
				label: "Texto",
				type: "text"
			}
		];
	}
	x(e) {
		return this.ray ? e.timeToX(this.points[0].time) : 0;
	}
	draw(e) {
		let t = e.ctx, n = e.priceToY(this.points[0].price);
		D(t, this.opts.color, this.opts.width, this.opts.dash), k(t, e, this.x(e), e.width, n, this.opts.width), this.opts.text && (t.save(), t.font = a(this.opts.fontSize), t.fillStyle = this.opts.textColor || this.opts.color, t.textBaseline = "bottom", t.textAlign = "right", t.fillText(this.opts.text, e.width - 8, n - 4), t.restore());
	}
	handles(e) {
		let t = e.priceToY(this.points[0].price);
		return [{
			x: this.ray ? e.timeToX(this.points[0].time) : Math.min(Math.max(e.timeToX(this.points[0].time), 24), e.width - 24),
			y: t,
			cursor: "ns-resize"
		}];
	}
	distance(e, t, n) {
		return t < this.x(e) - 6 ? Infinity : Math.abs(n - e.priceToY(this.points[0].price));
	}
	moveHandle(e, t) {
		this.points[0] = this.ray ? { ...t } : {
			time: this.points[0]?.time ?? t.time,
			price: t.price
		};
	}
	setCreationPoint(e, t) {
		this.points[0] = { ...t };
	}
	axisMarks() {
		return {
			prices: [{
				price: this.points[0].price,
				color: this.opts.color,
				persistent: this.opts.showPrice
			}],
			times: this.ray ? [this.points[0].time] : []
		};
	}
}, Ie = class extends Fe {
	constructor(...e) {
		super(...e), this.type = "hray", this.title = "Raio horizontal", this.ray = !0;
	}
}, Le = class extends E {
	constructor(...e) {
		super(...e), this.type = "vline", this.title = "Linha vertical", this.pointsNeeded = 1;
	}
	defaults() {
		return { width: 1 };
	}
	draw(e) {
		let t = e.ctx;
		D(t, this.opts.color, this.opts.width, this.opts.dash), A(t, e, e.timeToX(this.points[0].time), 0, e.height, this.opts.width);
	}
	handles(e) {
		return [{
			x: e.timeToX(this.points[0].time),
			y: Math.min(Math.max(e.priceToY(this.points[0].price), 24), e.height - 24),
			cursor: "ew-resize"
		}];
	}
	distance(e, t) {
		return Math.abs(t - e.timeToX(this.points[0].time));
	}
	axisMarks() {
		return {
			prices: [],
			times: [this.points[0].time]
		};
	}
}, Re = class extends E {
	constructor(...e) {
		super(...e), this.type = "crossline", this.title = "Linha cruzada", this.pointsNeeded = 1;
	}
	defaults() {
		return { width: 1 };
	}
	draw(e) {
		let t = e.ctx, { x: n, y: r } = e.toXY(this.points[0]);
		D(t, this.opts.color, this.opts.width, this.opts.dash), A(t, e, n, 0, e.height, this.opts.width), k(t, e, 0, e.width, r, this.opts.width);
	}
	distance(e, t, n) {
		let r = e.toXY(this.points[0]);
		return Math.min(Math.abs(t - r.x), Math.abs(n - r.y));
	}
	axisMarks() {
		return {
			prices: [{
				price: this.points[0].price,
				color: this.opts.color,
				persistent: !0
			}],
			times: [this.points[0].time]
		};
	}
}, ze = class extends E {
	constructor(...e) {
		super(...e), this.type = "channel", this.title = "Canal paralelo", this.pointsNeeded = 3;
	}
	defaults() {
		return {
			fill: g(r.accent, .12),
			width: 2
		};
	}
	settings() {
		return [
			...super.settings(),
			...ke(),
			{
				key: "extendLeft",
				label: "Estender à esquerda",
				type: "bool"
			},
			{
				key: "extendRight",
				label: "Estender à direita",
				type: "bool"
			}
		];
	}
	offset() {
		return this.points.length > 2 ? this.points[2].price - this.points[0].price : 0;
	}
	lines(e) {
		let [t, n] = this.points, r = this.offset(), i = e.toXY(t), a = e.toXY(n);
		return {
			a: i,
			b: a,
			c: {
				x: i.x,
				y: e.priceToY(t.price + r)
			},
			d: {
				x: a.x,
				y: e.priceToY(n.price + r)
			}
		};
	}
	draw(e) {
		if (this.points.length < 2) return;
		let t = e.ctx, { a: n, b: r, c: i, d: a } = this.lines(e), o = this.opts.extendLeft, s = this.opts.extendRight, c = de(n.x, n.y, r.x, r.y, e.width, e.height, o, s), l = de(i.x, i.y, a.x, a.y, e.width, e.height, o, s);
		if (this.points.length > 2 && this.opts.fillEnabled && (t.fillStyle = this.opts.fill, t.beginPath(), t.moveTo(c[0], c[1]), t.lineTo(c[2], c[3]), t.lineTo(l[2], l[3]), t.lineTo(l[0], l[1]), t.closePath(), t.fill()), D(t, this.opts.color, this.opts.width, this.opts.dash), O(t, c[0], c[1], c[2], c[3]), this.points.length > 2) {
			O(t, l[0], l[1], l[2], l[3]);
			let c = de((n.x + i.x) / 2, (n.y + i.y) / 2, (r.x + a.x) / 2, (r.y + a.y) / 2, e.width, e.height, o, s);
			D(t, g(this.opts.color, .7), 1, "dashed"), O(t, c[0], c[1], c[2], c[3]);
		}
	}
	handles(e) {
		if (this.points.length < 2) return this.points.map((t) => e.toXY(t));
		let { a: t, b: n, c: r, d: i } = this.lines(e), a = [t, n];
		return this.points.length > 2 && a.push(r, i, {
			x: (r.x + i.x) / 2,
			y: (r.y + i.y) / 2
		}, {
			x: (t.x + n.x) / 2,
			y: (t.y + n.y) / 2
		}), a;
	}
	distance(e, t, n) {
		if (this.points.length < 2) return Infinity;
		let { a: r, b: i, c: a, d: o } = this.lines(e), s = this.opts.extendLeft, c = this.opts.extendRight;
		return Math.min(y(t, n, r.x, r.y, i.x, i.y, s, c), this.points.length > 2 ? y(t, n, a.x, a.y, o.x, o.y, s, c) : Infinity);
	}
	insideFill(e, t, n) {
		if (this.points.length < 3 || !this.opts.fillEnabled) return !1;
		let { a: r, b: i, c: a, d: o } = this.lines(e), s = Math.min(r.x, i.x), c = Math.max(r.x, i.x);
		if (t < s || t > c || c === s) return !1;
		let l = (t - r.x) / (i.x - r.x), u = r.y + (i.y - r.y) * l, d = a.y + (o.y - a.y) * l;
		return n >= Math.min(u, d) && n <= Math.max(u, d);
	}
	setCreationPoint(e, t, n, r) {
		if (e < 2) {
			this.points[e] = e === 1 && r ? Ce(n, this.points[0], t) : { ...t }, e === 1 && this.points.length > 2 && (this.points.length = 2);
			return;
		}
		let i = t.price - Te(n, this.points[0], this.points[1], t.time);
		this.points[2] = {
			time: this.points[0].time,
			price: this.points[0].price + i
		};
	}
	moveHandle(e, t, n, r) {
		let i = this.offset();
		if (e === 0 || e === 1) this.points[e] = r ? Ce(n, this.points[1 - e], t) : { ...t }, this.points.length > 2 && (this.points[2] = {
			time: this.points[0].time,
			price: this.points[0].price + i
		});
		else if (e === 2 || e === 3 || e === 4) {
			let e = t.price - Te(n, this.points[0], this.points[1], t.time);
			this.points[2] = {
				time: this.points[0].time,
				price: this.points[0].price + e
			};
		} else if (e === 5) {
			let e = this.points[0].price + i, r = t.price - Te(n, this.points[0], this.points[1], t.time);
			this.points[0] = {
				...this.points[0],
				price: this.points[0].price + r
			}, this.points[1] = {
				...this.points[1],
				price: this.points[1].price + r
			}, this.points[2] = {
				time: this.points[0].time,
				price: e
			};
		}
	}
}, Be = class extends E {
	defaults() {
		return {
			levels: oe.map((e) => ({ ...e })),
			width: 1,
			color: "#787b86",
			fillEnabled: !0,
			showLabels: !0,
			showPrice: !0,
			extendLeft: !1,
			extendRight: !1
		};
	}
	settings() {
		return [
			{
				key: "color",
				label: "Linha de tendência",
				type: "color"
			},
			{
				key: "width",
				label: "Espessura dos níveis",
				type: "width"
			},
			{
				key: "fillEnabled",
				label: "Fundo",
				type: "bool"
			},
			{
				key: "showLabels",
				label: "Etiquetas de nível",
				type: "bool"
			},
			{
				key: "showPrice",
				label: "Preços",
				type: "bool"
			},
			{
				key: "extendLeft",
				label: "Estender à esquerda",
				type: "bool"
			},
			{
				key: "extendRight",
				label: "Estender à direita",
				type: "bool"
			},
			{
				key: "levels",
				label: "Níveis",
				type: "levels"
			}
		];
	}
	drawLevels(e) {
		let t = e.ctx, [n, r] = this.span(e);
		this.opts.extendLeft && (n = 0), this.opts.extendRight && (r = e.width);
		let i = this.opts.levels.filter((e) => e.enabled).sort((e, t) => e.value - t.value);
		if (this.opts.fillEnabled) for (let a = 0; a < i.length - 1; a++) {
			let o = e.priceToY(this.levelPrice(i[a].value)), s = e.priceToY(this.levelPrice(i[a + 1].value));
			t.fillStyle = g(i[a + 1].color, .12), t.fillRect(n, Math.min(o, s), r - n, Math.abs(s - o));
		}
		for (let o of i) {
			let i = this.levelPrice(o.value), s = e.priceToY(i);
			if (D(t, o.color, this.opts.width, "solid"), k(t, e, n, r, s, this.opts.width), this.opts.showLabels || this.opts.showPrice) {
				let c = [];
				this.opts.showLabels && c.push(String(o.value)), this.opts.showPrice && c.push(this.opts.showLabels ? `(${e.fmt(i)})` : e.fmt(i)), t.save(), t.font = a(12), t.fillStyle = o.color, t.textAlign = "right", t.textBaseline = "middle", t.fillText(c.join(" "), Math.min(n, r) - 6, s), t.restore();
			}
		}
	}
	distance(e, t, n) {
		let [r, i] = this.span(e);
		this.opts.extendLeft && (r = 0), this.opts.extendRight && (i = e.width);
		let a = Infinity;
		for (let o of this.opts.levels) {
			if (!o.enabled) continue;
			let s = e.priceToY(this.levelPrice(o.value));
			a = Math.min(a, v(t, n, r, s, i, s));
		}
		let o = this.points.map((t) => e.toXY(t));
		for (let e = 0; e < o.length - 1; e++) a = Math.min(a, v(t, n, o[e].x, o[e].y, o[e + 1].x, o[e + 1].y));
		return a;
	}
	insideFill(e, t, n) {
		if (!this.opts.fillEnabled) return !1;
		let [r, i] = this.span(e), a = this.opts.levels.filter((e) => e.enabled).map((t) => e.priceToY(this.levelPrice(t.value)));
		return t >= Math.min(r, i) && t <= Math.max(r, i) && n >= Math.min(...a) && n <= Math.max(...a);
	}
	axisMarks(e) {
		return {
			prices: this.points.map((e) => ({ price: e.price })),
			times: this.points.map((e) => e.time),
			...ce(this.points)
		};
	}
}, Ve = class extends Be {
	constructor(...e) {
		super(...e), this.type = "fib", this.title = "Retração de Fibonacci", this.pointsNeeded = 2;
	}
	levelPrice(e) {
		let [t, n] = this.points;
		return n.price + (t.price - n.price) * e;
	}
	span(e) {
		let t = e.timeToX(this.points[0].time), n = e.timeToX(this.points[1].time);
		return [Math.min(t, n), Math.max(t, n)];
	}
	draw(e) {
		if (this.points.length < 2) return;
		this.drawLevels(e);
		let t = e.toXY(this.points[0]), n = e.toXY(this.points[1]);
		D(e.ctx, g(this.opts.color, .9), 1, "dashed"), O(e.ctx, t.x, t.y, n.x, n.y);
	}
}, He = class extends Be {
	constructor(...e) {
		super(...e), this.type = "fibext", this.title = "Extensão de Fibonacci baseada em tendência", this.pointsNeeded = 3;
	}
	defaults() {
		let e = super.defaults();
		return {
			...e,
			levels: (e.levels ?? []).map((e) => ({
				...e,
				enabled: [
					0,
					.382,
					.618,
					1,
					1.272,
					1.618,
					2,
					2.618
				].includes(e.value)
			}))
		};
	}
	levelPrice(e) {
		let [t, n, r] = this.points;
		return (r ?? n).price + (n.price - t.price) * e;
	}
	span(e) {
		let t = e.timeToX(this.points[1].time), n = e.timeToX((this.points[2] ?? this.points[1]).time), r = e.timeToX(this.points[0].time), i = Math.min(t, n);
		return [i, Math.max(n, i + Math.max(Math.abs(t - r), 40))];
	}
	draw(e) {
		if (this.points.length < 2) return;
		this.points.length > 2 && this.drawLevels(e);
		let t = this.points.map((t) => e.toXY(t));
		D(e.ctx, g(this.opts.color, .9), 1, "dashed"), e.ctx.beginPath(), t.forEach((t, n) => n ? e.ctx.lineTo(t.x, t.y) : e.ctx.moveTo(t.x, t.y)), e.ctx.stroke();
	}
}, Ue = class extends E {
	constructor(...e) {
		super(...e), this.type = "fibchannel", this.title = "Canal de Fibonacci", this.pointsNeeded = 3;
	}
	defaults() {
		return {
			levels: oe.filter((e) => e.value <= 1.618).map((e) => ({ ...e })),
			width: 1,
			color: "#787b86",
			fillEnabled: !0
		};
	}
	settings() {
		return [
			{
				key: "width",
				label: "Espessura",
				type: "width"
			},
			{
				key: "fillEnabled",
				label: "Fundo",
				type: "bool"
			},
			{
				key: "levels",
				label: "Níveis",
				type: "levels"
			}
		];
	}
	off() {
		return this.points.length > 2 ? this.points[2].price - this.points[0].price : 0;
	}
	draw(e) {
		if (this.points.length < 2) return;
		let t = e.ctx, n = e.toXY(this.points[0]), r = e.toXY(this.points[1]);
		if (this.points.length < 3) {
			D(t, "#787b86", 1), O(t, n.x, n.y, r.x, r.y);
			return;
		}
		let i = this.off(), a = this.opts.levels.filter((e) => e.enabled).sort((e, t) => e.value - t.value), o = (t) => {
			let a = e.priceToY(this.points[0].price + i * t), o = e.priceToY(this.points[1].price + i * t);
			return de(n.x, a, r.x, o, e.width, e.height, !1, !0);
		};
		if (this.opts.fillEnabled) for (let e = 0; e < a.length - 1; e++) {
			let n = o(a[e].value), r = o(a[e + 1].value);
			t.fillStyle = g(a[e + 1].color, .1), t.beginPath(), t.moveTo(n[0], n[1]), t.lineTo(n[2], n[3]), t.lineTo(r[2], r[3]), t.lineTo(r[0], r[1]), t.closePath(), t.fill();
		}
		for (let e of a) {
			let n = o(e.value);
			D(t, e.color, this.opts.width), O(t, n[0], n[1], n[2], n[3]), M(t, String(e.value), n[0] - 6, n[1], {
				color: e.color,
				align: "right"
			});
		}
	}
	handles(e) {
		let t = this.points.slice(0, 2).map((t) => e.toXY(t));
		return this.points.length > 2 && t.push({
			x: e.timeToX(this.points[0].time),
			y: e.priceToY(this.points[2].price)
		}), t;
	}
	distance(e, t, n) {
		if (this.points.length < 2) return Infinity;
		let r = e.toXY(this.points[0]), i = e.toXY(this.points[1]), a = y(t, n, r.x, r.y, i.x, i.y, !1, !0), o = this.off();
		for (let s of this.opts.levels) {
			if (!s.enabled) continue;
			let c = e.priceToY(this.points[0].price + o * s.value), l = e.priceToY(this.points[1].price + o * s.value);
			a = Math.min(a, y(t, n, r.x, c, i.x, l, !1, !0));
		}
		return a;
	}
	setCreationPoint(e, t, n) {
		if (e < 2) {
			this.points[e] = { ...t };
			return;
		}
		let r = t.price - Te(n, this.points[0], this.points[1], t.time);
		this.points[2] = {
			time: this.points[0].time,
			price: this.points[0].price + r
		};
	}
	moveHandle(e, t, n) {
		let r = this.off();
		e < 2 ? (this.points[e] = { ...t }, this.points.length > 2 && (this.points[2] = {
			time: this.points[0].time,
			price: this.points[0].price + r
		})) : this.setCreationPoint(2, t, n);
	}
}, We = class extends E {
	constructor(...e) {
		super(...e), this.type = "rect", this.title = "Retângulo", this.pointsNeeded = 2;
	}
	defaults() {
		return {
			color: "#9c27b0",
			fill: g("#9c27b0", .2),
			width: 1
		};
	}
	settings() {
		return [
			{
				key: "color",
				label: "Borda",
				type: "color"
			},
			{
				key: "width",
				label: "Espessura",
				type: "width"
			},
			{
				key: "dash",
				label: "Estilo",
				type: "dash"
			},
			...ke(),
			{
				key: "extendLeft",
				label: "Estender à esquerda",
				type: "bool"
			},
			{
				key: "extendRight",
				label: "Estender à direita",
				type: "bool"
			},
			{
				key: "text",
				label: "Texto",
				type: "text"
			}
		];
	}
	box(e) {
		let t = e.toXY(this.points[0]), n = e.toXY(this.points[1]), r = Math.min(t.x, n.x), i = Math.max(t.x, n.x);
		return this.opts.extendLeft && (r = -10), this.opts.extendRight && (i = e.width + 10), {
			x1: r,
			x2: i,
			y1: Math.min(t.y, n.y),
			y2: Math.max(t.y, n.y)
		};
	}
	draw(e) {
		if (this.points.length < 2) return;
		let t = e.ctx, { x1: n, y1: r, x2: i, y2: a } = this.box(e);
		this.opts.fillEnabled && (t.fillStyle = this.opts.fill, t.fillRect(n, r, i - n, a - r)), D(t, this.opts.color, this.opts.width, this.opts.dash);
		let o = this.opts.width, s = Math.round(n * e.dpr) / e.dpr + (o % 2 ? .5 / e.dpr : 0), c = Math.round(r * e.dpr) / e.dpr + (o % 2 ? .5 / e.dpr : 0), l = Math.round(i * e.dpr) / e.dpr + (o % 2 ? .5 / e.dpr : 0), u = Math.round(a * e.dpr) / e.dpr + (o % 2 ? .5 / e.dpr : 0);
		t.strokeRect(s, c, l - s, u - c), this.opts.text && (t.save(), t.beginPath(), t.rect(n, r, i - n, a - r), t.clip(), M(t, this.opts.text, (n + i) / 2, (r + a) / 2, {
			color: this.opts.textColor || this.opts.color,
			size: this.opts.fontSize,
			align: "center"
		}), t.restore());
	}
	handles(e) {
		if (this.points.length < 2) return this.points.map((t) => e.toXY(t));
		let t = e.toXY(this.points[0]), n = e.toXY(this.points[1]), r = (t.x + n.x) / 2, i = (t.y + n.y) / 2, a = (t.x - n.x) * (t.y - n.y) > 0 ? "nwse-resize" : "nesw-resize", o = a === "nwse-resize" ? "nesw-resize" : "nwse-resize";
		return [
			{
				x: t.x,
				y: t.y,
				cursor: a
			},
			{
				x: n.x,
				y: n.y,
				cursor: a
			},
			{
				x: n.x,
				y: t.y,
				cursor: o
			},
			{
				x: t.x,
				y: n.y,
				cursor: o
			},
			{
				x: r,
				y: t.y,
				cursor: "ns-resize"
			},
			{
				x: r,
				y: n.y,
				cursor: "ns-resize"
			},
			{
				x: t.x,
				y: i,
				cursor: "ew-resize"
			},
			{
				x: n.x,
				y: i,
				cursor: "ew-resize"
			}
		];
	}
	distance(e, t, n) {
		if (this.points.length < 2) return Infinity;
		let { x1: r, y1: i, x2: a, y2: o } = this.box(e);
		return Math.min(v(t, n, r, i, a, i), v(t, n, r, o, a, o), v(t, n, r, i, r, o), v(t, n, a, i, a, o));
	}
	insideFill(e, t, n) {
		if (this.points.length < 2 || !this.opts.fillEnabled) return !1;
		let { x1: r, y1: i, x2: a, y2: o } = this.box(e);
		return t >= r && t <= a && n >= i && n <= o;
	}
	moveHandle(e, t) {
		let [n, r] = this.points;
		switch (e) {
			case 0:
				this.points[0] = { ...t };
				break;
			case 1:
				this.points[1] = { ...t };
				break;
			case 2:
				this.points[1] = {
					time: t.time,
					price: r.price
				}, this.points[0] = {
					time: n.time,
					price: t.price
				};
				break;
			case 3:
				this.points[0] = {
					time: t.time,
					price: n.price
				}, this.points[1] = {
					time: r.time,
					price: t.price
				};
				break;
			case 4:
				this.points[0] = {
					time: n.time,
					price: t.price
				};
				break;
			case 5:
				this.points[1] = {
					time: r.time,
					price: t.price
				};
				break;
			case 6:
				this.points[0] = {
					time: t.time,
					price: n.price
				};
				break;
			case 7: this.points[1] = {
				time: t.time,
				price: r.price
			};
		}
	}
}, Ge = class extends E {
	constructor(...e) {
		super(...e), this.type = "ellipse", this.title = "Elipse", this.pointsNeeded = 2;
	}
	defaults() {
		return {
			color: "#f23645",
			fill: g("#f23645", .18),
			width: 1
		};
	}
	settings() {
		return [...super.settings(), ...ke()];
	}
	geom(e) {
		let t = e.toXY(this.points[0]), n = e.toXY(this.points[1]);
		return {
			cx: (t.x + n.x) / 2,
			cy: (t.y + n.y) / 2,
			rx: Math.abs(n.x - t.x) / 2,
			ry: Math.abs(n.y - t.y) / 2
		};
	}
	draw(e) {
		if (this.points.length < 2) return;
		let t = e.ctx, { cx: n, cy: r, rx: i, ry: a } = this.geom(e);
		t.beginPath(), t.ellipse(n, r, Math.max(i, .5), Math.max(a, .5), 0, 0, Math.PI * 2), this.opts.fillEnabled && (t.fillStyle = this.opts.fill, t.fill()), D(t, this.opts.color, this.opts.width, this.opts.dash), t.stroke();
	}
	handles(e) {
		if (this.points.length < 2) return this.points.map((t) => e.toXY(t));
		let { cx: t, cy: n, rx: r, ry: i } = this.geom(e);
		return [
			{
				x: t - r,
				y: n,
				cursor: "ew-resize"
			},
			{
				x: t + r,
				y: n,
				cursor: "ew-resize"
			},
			{
				x: t,
				y: n - i,
				cursor: "ns-resize"
			},
			{
				x: t,
				y: n + i,
				cursor: "ns-resize"
			}
		];
	}
	distance(e, t, n) {
		if (this.points.length < 2) return Infinity;
		let { cx: r, cy: i, rx: a, ry: o } = this.geom(e);
		if (a < 1 || o < 1) return Infinity;
		let s = (t - r) / a, c = (n - i) / o;
		return Math.abs(Math.hypot(s, c) - 1) * Math.min(a, o);
	}
	insideFill(e, t, n) {
		if (this.points.length < 2 || !this.opts.fillEnabled) return !1;
		let { cx: r, cy: i, rx: a, ry: o } = this.geom(e);
		return ((t - r) / a) ** 2 + ((n - i) / o) ** 2 <= 1;
	}
	moveHandle(e, t, n) {
		if (this.points.length < 2) {
			this.points[e] = { ...t };
			return;
		}
		let r = this.points[0], i = this.points[1], a = n.timeToX(r.time) <= n.timeToX(i.time), o = n.priceToY(r.price) <= n.priceToY(i.price);
		e === 0 && ((a ? r : i).time = t.time), e === 1 && ((a ? i : r).time = t.time), e === 2 && ((o ? r : i).price = t.price), e === 3 && ((o ? i : r).price = t.price);
	}
	setCreationPoint(e, t) {
		this.points[e] = { ...t };
	}
}, Ke = class extends E {
	constructor(...e) {
		super(...e), this.type = "triangle", this.title = "Triângulo", this.pointsNeeded = 3;
	}
	defaults() {
		return {
			color: "#ff9800",
			fill: g("#ff9800", .18),
			width: 1
		};
	}
	settings() {
		return [...super.settings(), ...ke()];
	}
	draw(e) {
		let t = e.ctx, n = this.points.map((t) => e.toXY(t));
		t.beginPath(), n.forEach((e, n) => n ? t.lineTo(e.x, e.y) : t.moveTo(e.x, e.y)), t.closePath(), this.opts.fillEnabled && n.length > 2 && (t.fillStyle = this.opts.fill, t.fill()), D(t, this.opts.color, this.opts.width, this.opts.dash), t.stroke();
	}
	distance(e, t, n) {
		let r = this.points.map((t) => e.toXY(t)), i = Infinity;
		for (let e = 0; e < r.length; e++) {
			let a = r[e], o = r[(e + 1) % r.length];
			i = Math.min(i, v(t, n, a.x, a.y, o.x, o.y));
		}
		return i;
	}
	insideFill(e, t, n) {
		if (this.points.length < 3 || !this.opts.fillEnabled) return !1;
		let [r, i, a] = this.points.map((t) => e.toXY(t)), o = (e, r) => (t - r.x) * (e.y - r.y) - (e.x - r.x) * (n - r.y), s = o(r, i), c = o(i, a), l = o(a, r);
		return !((s < 0 || c < 0 || l < 0) && (s > 0 || c > 0 || l > 0));
	}
}, qe = class extends E {
	constructor(...e) {
		super(...e), this.type = "brush", this.title = "Pincel", this.pointsNeeded = 0;
	}
	defaults() {
		return {
			color: "#2962ff",
			width: 2,
			fillEnabled: !1
		};
	}
	draw(e) {
		let t = e.ctx, n = this.points.map((t) => e.toXY(t));
		if (n.length < 2) return;
		D(t, this.opts.color, this.opts.width, this.opts.dash), t.lineCap = "round", t.beginPath(), t.moveTo(n[0].x, n[0].y);
		for (let e = 1; e < n.length - 1; e++) {
			let r = (n[e].x + n[e + 1].x) / 2, i = (n[e].y + n[e + 1].y) / 2;
			t.quadraticCurveTo(n[e].x, n[e].y, r, i);
		}
		let r = n[n.length - 1];
		t.lineTo(r.x, r.y), this.opts.fillEnabled && (t.fillStyle = this.opts.fill, t.fill()), t.stroke();
	}
	handles() {
		return [];
	}
	distance(e, t, n) {
		let r = this.points.map((t) => e.toXY(t)), i = Infinity;
		for (let e = 0; e < r.length - 1; e++) i = Math.min(i, v(t, n, r[e].x, r[e].y, r[e + 1].x, r[e + 1].y));
		return i;
	}
	axisMarks() {
		return {
			prices: [],
			times: [],
			...ce(this.points)
		};
	}
}, Je = class extends E {
	constructor(...e) {
		super(...e), this.type = "path", this.title = "Caminho", this.pointsNeeded = -1;
	}
	defaults() {
		return {
			color: "#2962ff",
			width: 2
		};
	}
	draw(e) {
		let t = e.ctx, n = this.points.map((t) => e.toXY(t));
		if (n.length < 2) return;
		D(t, this.opts.color, this.opts.width, this.opts.dash), t.beginPath(), n.forEach((e, n) => n ? t.lineTo(e.x, e.y) : t.moveTo(e.x, e.y)), t.stroke();
		let r = n[n.length - 2], i = n[n.length - 1];
		D(t, this.opts.color, this.opts.width), j(t, r.x, r.y, i.x, i.y, this.opts.width);
	}
	distance(e, t, n) {
		let r = this.points.map((t) => e.toXY(t)), i = Infinity;
		for (let e = 0; e < r.length - 1; e++) i = Math.min(i, v(t, n, r[e].x, r[e].y, r[e + 1].x, r[e + 1].y));
		return i;
	}
}, Ye = class extends E {
	constructor(...e) {
		super(...e), this.type = "text", this.title = "Texto", this.pointsNeeded = 1;
	}
	defaults() {
		return {
			text: "Texto",
			textColor: "#d1d4dc",
			color: "#2962ff",
			fontSize: 16,
			fillEnabled: !1,
			fill: g("#2962ff", .25)
		};
	}
	settings() {
		return [
			{
				key: "textColor",
				label: "Cor do texto",
				type: "color"
			},
			{
				key: "fontSize",
				label: "Tamanho",
				type: "number",
				min: 8,
				max: 72
			},
			{
				key: "fillEnabled",
				label: "Fundo",
				type: "bool"
			},
			{
				key: "fill",
				label: "Cor de fundo",
				type: "fill"
			},
			{
				key: "text",
				label: "Texto",
				type: "text"
			}
		];
	}
	box(e) {
		let t = e.ctx;
		t.save(), t.font = a(this.opts.fontSize);
		let n = (this.opts.text || " ").split("\n"), r = Math.max(...n.map((e) => t.measureText(e).width)) + 12;
		t.restore();
		let i = n.length * Math.round(this.opts.fontSize * 1.3) + 8, o = e.toXY(this.points[0]);
		return {
			x: o.x,
			y: o.y - i,
			w: r,
			h: i
		};
	}
	draw(e, t) {
		let n = e.ctx, i = this.box(e);
		this.opts.fillEnabled && (n.fillStyle = this.opts.fill, me(n, i.x, i.y, i.w, i.h, 4), n.fill()), (t.selected || t.hovered) && (n.save(), n.strokeStyle = g(r.accent, t.selected ? .9 : .5), n.setLineDash([]), n.lineWidth = 1, me(n, Math.round(i.x) + .5, Math.round(i.y) + .5, i.w, i.h, 4), n.stroke(), n.restore()), n.save(), n.font = a(this.opts.fontSize), n.fillStyle = this.opts.textColor, n.textBaseline = "middle";
		let o = Math.round(this.opts.fontSize * 1.3);
		(this.opts.text || "").split("\n").forEach((e, t) => n.fillText(e, i.x + 6, i.y + 4 + o * t + o / 2)), n.restore();
	}
	handles(e) {
		return [e.toXY(this.points[0])];
	}
	distance(e, t, n) {
		let r = this.box(e);
		return t >= r.x && t <= r.x + r.w && n >= r.y && n <= r.y + r.h ? 0 : Infinity;
	}
}, Xe = class extends E {
	constructor(...e) {
		super(...e), this.pointsNeeded = 2;
	}
	defaults() {
		return {
			color: r.accent,
			fill: g(r.accent, .2),
			width: 1
		};
	}
	distance(e, t, n) {
		return this.insideFill(e, t, n) ? 0 : Infinity;
	}
	insideFill(e, t, n) {
		if (this.points.length < 2) return !1;
		let r = e.toXY(this.points[0]), i = e.toXY(this.points[1]);
		return t >= Math.min(r.x, i.x) - 4 && t <= Math.max(r.x, i.x) + 4 && n >= Math.min(r.y, i.y) - 4 && n <= Math.max(r.y, i.y) + 4;
	}
	stats(e) {
		let [t, n] = this.points, r = n.price - t.price, i = Math.round(e.data.timeToIndex(t.time)), a = Math.round(e.data.timeToIndex(n.time)), o = 0;
		for (let t = Math.max(0, Math.min(i, a)); t <= Math.min(e.bars.length - 1, Math.max(i, a)); t++) o += e.bars[t].volume;
		return {
			dp: r,
			pct: r / t.price * 100,
			ticks: Math.round(r / e.tick),
			bars: a - i,
			dt: n.time - t.time,
			vol: o
		};
	}
	color(e) {
		return this.stats(e).dp >= 0 ? r.accent : r.down;
	}
}, Ze = class extends Xe {
	constructor(...e) {
		super(...e), this.type = "pricerange", this.title = "Intervalo de preço";
	}
	draw(e) {
		if (this.points.length < 2) return;
		let t = e.ctx, n = e.toXY(this.points[0]), i = e.toXY(this.points[1]), a = this.stats(e), o = a.dp >= 0 ? r.accent : r.down, s = Math.min(n.x, i.x), c = Math.max(n.x, i.x);
		t.fillStyle = g(o, .2), t.fillRect(s, Math.min(n.y, i.y), c - s, Math.abs(i.y - n.y)), D(t, o, 1), k(t, e, s, c, n.y, 1), k(t, e, s, c, i.y, 1);
		let l = (s + c) / 2;
		A(t, e, l, n.y, i.y, 1), j(t, l, n.y, l, i.y, 1);
		let u = `${Oe(e.fmt(Math.abs(a.dp)), a.dp)} (${De(a.pct)}) ${a.ticks}`, d = i.y > n.y;
		M(t, u, l, i.y + (d ? 8 : -8), {
			bg: o,
			color: "#fff",
			align: "center",
			baseline: d ? "top" : "bottom"
		});
	}
}, Qe = class extends Xe {
	constructor(...e) {
		super(...e), this.type = "daterange", this.title = "Intervalo de data";
	}
	draw(e) {
		if (this.points.length < 2) return;
		let t = e.ctx, n = e.toXY(this.points[0]), i = e.toXY(this.points[1]), a = this.stats(e), o = a.bars >= 0 ? r.accent : r.down, s = Math.min(n.y, i.y), c = Math.max(n.y, i.y);
		t.fillStyle = g(o, .2), t.fillRect(Math.min(n.x, i.x), s, Math.abs(i.x - n.x), c - s), D(t, o, 1), A(t, e, n.x, s, c, 1), A(t, e, i.x, s, c, 1);
		let l = (s + c) / 2;
		k(t, e, n.x, i.x, l, 1), j(t, n.x, l, i.x, l, 1), M(t, `${a.bars} barras, ${ne(a.dt)}\nVol ${m(a.vol)}`, (n.x + i.x) / 2, c + 8, {
			bg: o,
			color: "#fff",
			align: "center",
			baseline: "top"
		});
	}
}, $e = class extends Xe {
	constructor(...e) {
		super(...e), this.type = "datepricerange", this.title = "Intervalo de data e preço";
	}
	draw(e) {
		if (this.points.length < 2) return;
		let t = e.ctx, n = e.toXY(this.points[0]), i = e.toXY(this.points[1]), a = this.stats(e), o = a.dp >= 0 ? r.accent : r.down;
		t.fillStyle = g(o, .2), t.fillRect(Math.min(n.x, i.x), Math.min(n.y, i.y), Math.abs(i.x - n.x), Math.abs(i.y - n.y)), D(t, o, 1);
		let s = (n.x + i.x) / 2, c = (n.y + i.y) / 2;
		A(t, e, s, n.y, i.y, 1), j(t, s, n.y, s, i.y, 1), k(t, e, n.x, i.x, c, 1), j(t, n.x, c, i.x, c, 1);
		let l = `${Oe(e.fmt(Math.abs(a.dp)), a.dp)} (${De(a.pct)}) ${a.ticks}\n${a.bars} barras, ${ne(a.dt)}\nVol ${m(a.vol)}`, u = i.y > n.y;
		M(t, l, s, (u ? Math.max(n.y, i.y) : Math.min(n.y, i.y)) + (u ? 8 : -8), {
			bg: o,
			color: "#fff",
			align: "center",
			baseline: u ? "top" : "bottom"
		});
	}
}, et = class extends E {
	constructor(e, t) {
		super(t), this.long = e, this.pointsNeeded = 1, this.type = e ? "long" : "short", this.title = e ? "Posição comprada" : "Posição vendida";
	}
	defaults() {
		return {
			width: 1,
			accountSize: 1e3,
			riskPct: 1
		};
	}
	settings() {
		return [{
			key: "accountSize",
			label: "Tamanho da conta",
			type: "number",
			min: 1,
			max: 1e9
		}, {
			key: "riskPct",
			label: "Risco (%)",
			type: "number",
			min: .01,
			max: 100,
			step: .1
		}];
	}
	init(e) {
		let t = this.points[0], n = e.yToPrice(0) - e.yToPrice(e.height), r = Math.abs(n) * .06, i = e.data.indexToTime(e.data.timeToIndex(t.time) + Math.max(12, Math.round(80 / e.ts.barSpacing))), a = this.long ? 1 : -1;
		this.points[1] = {
			time: i,
			price: t.price + a * r * 2
		}, this.points[2] = {
			time: i,
			price: t.price - a * r
		};
	}
	setCreationPoint(e, t, n) {
		e === 0 && (this.points[0] = { ...t }, this.init(n));
	}
	geo(e) {
		let [t, n, r] = this.points;
		return {
			x1: e.timeToX(t.time),
			x2: e.timeToX(n.time),
			ye: e.priceToY(t.price),
			yt: e.priceToY(n.price),
			ys: e.priceToY(r.price)
		};
	}
	draw(e, t) {
		if (this.points.length < 3) return;
		let n = e.ctx, [i, a, o] = this.points, { x1: s, x2: c, ye: l, yt: u, ys: d } = this.geo(e), f = Math.min(s, c), p = Math.abs(c - s);
		n.fillStyle = g(r.up, .2), n.fillRect(f, Math.min(l, u), p, Math.abs(u - l)), n.fillStyle = g(r.down, .2), n.fillRect(f, Math.min(l, d), p, Math.abs(d - l));
		let m = e.bars, h = Math.ceil(e.data.timeToIndex(i.time)), _ = Math.floor(e.data.timeToIndex(a.time)), v = Math.min(m.length - 1, _), y = null;
		if (h <= v && h >= 0) {
			for (let e = h; e <= v; e++) {
				let t = m[e], n = this.long ? t.high >= a.price : t.low <= a.price, r = this.long ? t.low <= o.price : t.high >= o.price;
				if (r || n) {
					y = r ? "stop" : "target", v = e;
					break;
				}
			}
			let t = y === "target" ? a.price : y === "stop" ? o.price : m[v].close, c = e.ts.indexToX(v), u = e.priceToY(t);
			n.fillStyle = g((this.long ? t >= i.price : t <= i.price) ? r.up : r.down, .25), n.fillRect(f, Math.min(l, u), Math.max(0, Math.min(c, f + p) - f), Math.abs(u - l)), D(n, g(r.textStrong, .6), 1, "dashed"), O(n, s, l, Math.min(c, f + p), u);
		}
		D(n, "#787b86", 1), k(n, e, f, f + p, l, 1), D(n, r.up, 1), k(n, e, f, f + p, u, 1), D(n, r.down, 1), k(n, e, f, f + p, d, 1);
		let b = a.price - i.price, x = o.price - i.price, S = Math.abs(b / (x || 1e-12)), C = (Number(this.opts.accountSize) || 1e3) * (Number(this.opts.riskPct) || 1) / 100 / Math.abs(x || 1e-12), ee = (t) => Math.round(Math.abs(t) / e.tick), w = t.selected || t.hovered || t.creating, te = f + p / 2, ne = w ? `Alvo: ${e.fmt(Math.abs(b))} (${De(Math.abs(b / i.price) * 100)}) ${ee(b)}, Valor: ${(C * Math.abs(b)).toFixed(2)}` : `Alvo: ${e.fmt(a.price)}`, re = w ? `Stop: ${e.fmt(Math.abs(x))} (${De(Math.abs(x / i.price) * 100)}) ${ee(x)}, Valor: ${(C * Math.abs(x)).toFixed(2)}` : `Stop: ${e.fmt(o.price)}`, T = u < l;
		if (M(n, ne, te, u + (T ? -6 : 6), {
			bg: r.up,
			color: "#fff",
			align: "center",
			baseline: T ? "bottom" : "top"
		}), M(n, re, te, d + (T ? 6 : -6), {
			bg: r.down,
			color: "#fff",
			align: "center",
			baseline: T ? "top" : "bottom"
		}), w) {
			let e = "";
			if (h <= v && h >= 0) {
				let t = ((y === "target" ? a.price : y === "stop" ? o.price : m[v].close) - i.price) * (this.long ? 1 : -1);
				e = `${y ? "P&L fechado" : "P&L aberto"}: ${t >= 0 ? "" : "−"}${Math.abs(t * C).toFixed(2)}, `;
			}
			M(n, `${e}Qtd: ${C < 1 ? C.toFixed(4) : C.toFixed(2)}\nRisco/Retorno: ${S.toFixed(2)}`, te, l, {
				bg: g("#4c525e", .95),
				color: "#fff",
				align: "center"
			});
		}
	}
	handles(e) {
		if (this.points.length < 3) return [];
		let { x1: t, x2: n, ye: r, yt: i, ys: a } = this.geo(e);
		return [
			{
				x: t,
				y: r,
				cursor: "move"
			},
			{
				x: t,
				y: i,
				cursor: "ns-resize"
			},
			{
				x: t,
				y: a,
				cursor: "ns-resize"
			},
			{
				x: n,
				y: r,
				cursor: "ew-resize"
			}
		];
	}
	moveHandle(e, t, n) {
		let [r, i, a] = this.points, o = this.long ? 1 : -1;
		if (e === 0) {
			let e = n.data.timeToIndex(i.time) - n.data.timeToIndex(r.time);
			this.points[0] = { ...t };
			let s = n.data.indexToTime(n.data.timeToIndex(t.time) + e);
			this.points[1] = {
				time: s,
				price: o * (i.price - t.price) > 0 ? i.price : t.price + o * Math.abs(i.price - r.price)
			}, this.points[2] = {
				time: s,
				price: o * (t.price - a.price) > 0 ? a.price : t.price - o * Math.abs(a.price - r.price)
			};
		} else e === 1 ? o * (t.price - r.price) > 0 && (i.price = t.price) : e === 2 ? o * (r.price - t.price) > 0 && (a.price = t.price) : e === 3 && n.data.timeToIndex(t.time) > n.data.timeToIndex(r.time) && (i.time = t.time, a.time = t.time);
	}
	distance(e, t, n) {
		return this.insideFill(e, t, n) ? 0 : Infinity;
	}
	insideFill(e, t, n) {
		if (this.points.length < 3) return !1;
		let { x1: r, x2: i, yt: a, ys: o } = this.geo(e);
		return t >= Math.min(r, i) && t <= Math.max(r, i) && n >= Math.min(a, o) && n <= Math.max(a, o);
	}
	axisMarks() {
		let [e, t, n] = this.points;
		return {
			prices: [
				{
					price: t.price,
					color: r.up
				},
				{
					price: e.price,
					color: "#787b86"
				},
				{
					price: n.price,
					color: r.down
				}
			],
			times: [e.time, t.time]
		};
	}
	toJSON() {
		return super.toJSON();
	}
}, tt = class extends E {
	constructor(...e) {
		super(...e), this.type = "frvp", this.title = "Perfil de volume de intervalo fixo", this.pointsNeeded = 2;
	}
	defaults() {
		return {
			rows: 24,
			widthPct: 40,
			va: 70,
			extendPoc: !1
		};
	}
	settings() {
		return [
			{
				key: "rows",
				label: "Número de linhas",
				type: "number",
				min: 4,
				max: 300
			},
			{
				key: "widthPct",
				label: "Largura (%)",
				type: "number",
				min: 5,
				max: 100
			},
			{
				key: "va",
				label: "Value Area (%)",
				type: "number",
				min: 10,
				max: 100
			},
			{
				key: "extendPoc",
				label: "Estender POC à direita",
				type: "bool"
			}
		];
	}
	range(e) {
		let t = Math.round(e.data.timeToIndex(this.points[0].time)), n = Math.round(e.data.timeToIndex(this.points[1].time));
		return [Math.min(t, n), Math.max(t, n)];
	}
	draw(e, t) {
		if (this.points.length < 2) return;
		let n = e.ctx, [i, a] = this.range(e), o = ve(e.bars, i, a, Number(this.opts.rows) || 24, (Number(this.opts.va) || 70) / 100), s = e.ts.indexToX(i) - e.ts.barSpacing / 2, c = e.ts.indexToX(a) + e.ts.barSpacing / 2;
		if (!o) return;
		let l = e.priceToY(o.rows[o.rows.length - 1].hi), u = e.priceToY(o.rows[0].lo);
		n.fillStyle = g(r.accent, t.selected ? .08 : .04), n.fillRect(s, l, c - s, u - l), D(n, g(r.accent, .5), 1, "solid"), A(n, e, s, l, u, 1), A(n, e, c, l, u, 1), xe(n, o, (t) => e.priceToY(t), s, (c - s) * (Number(this.opts.widthPct) || 40) / 100, 1, s, this.opts.extendPoc ? e.width : c);
	}
	distance(e, t, n) {
		if (this.points.length < 2) return Infinity;
		let [r, i] = this.range(e), a = e.ts.indexToX(r) - e.ts.barSpacing / 2, o = e.ts.indexToX(i) + e.ts.barSpacing / 2, s = ve(e.bars, r, i, 4);
		if (!s) return Infinity;
		let c = e.priceToY(s.rows[s.rows.length - 1].hi), l = e.priceToY(s.rows[0].lo);
		return t >= a && t <= o && n >= c && n <= l ? 0 : Infinity;
	}
}, nt = class extends E {
	constructor(...e) {
		super(...e), this.type = "avwap", this.title = "VWAP ancorado", this.pointsNeeded = 1, this.cache = null;
	}
	defaults() {
		return {
			color: "#2962ff",
			width: 2
		};
	}
	series(e) {
		let t = Math.max(0, Math.round(e.data.timeToIndex(this.points[0].time))), n = [], r = 0, i = 0, a = Math.min(e.bars.length - 1, e.to + 1);
		for (let o = t; o <= a; o++) {
			let t = e.bars[o], a = (t.high + t.low + t.close) / 3;
			r += a * t.volume, i += t.volume, o >= e.from - 1 && n.push({
				i: o,
				val: i > 0 ? r / i : a
			});
		}
		return n;
	}
	draw(e) {
		let t = this.series(e), n = e.ctx;
		D(n, this.opts.color, this.opts.width, this.opts.dash), n.beginPath(), t.forEach((t, r) => {
			let i = e.ts.indexToX(t.i), a = e.priceToY(t.val);
			r ? n.lineTo(i, a) : n.moveTo(i, a);
		}), n.stroke(), this.cache = {
			key: "",
			xs: t.map((t) => e.ts.indexToX(t.i)),
			ys: t.map((t) => e.priceToY(t.val))
		};
	}
	handles(e) {
		let t = Math.round(e.data.timeToIndex(this.points[0].time)), n = e.bars[Math.max(0, Math.min(e.bars.length - 1, t))], r = n ? (n.high + n.low + n.close) / 3 : this.points[0].price;
		return [{
			x: e.timeToX(this.points[0].time),
			y: e.priceToY(r)
		}];
	}
	distance(e, t, n) {
		let r = this.cache;
		if (!r) return Infinity;
		let i = Infinity;
		for (let e = 0; e < r.xs.length - 1; e++) i = Math.min(i, v(t, n, r.xs[e], r.ys[e], r.xs[e + 1], r.ys[e + 1]));
		return i;
	}
	axisMarks() {
		return {
			prices: [],
			times: [this.points[0].time]
		};
	}
}, rt = [
	{
		id: "lines",
		title: "Ferramentas de linha",
		tools: [
			{
				id: "trendline",
				title: "Linha de tendência",
				icon: "trendline",
				hotkey: "Alt + T",
				create: (e) => new Ae(e)
			},
			{
				id: "ray",
				title: "Raio",
				icon: "ray",
				create: (e) => new je(e)
			},
			{
				id: "infoline",
				title: "Linha de informação",
				icon: "infoline",
				create: (e) => new Ne(e)
			},
			{
				id: "extended",
				title: "Linha estendida",
				icon: "extended",
				create: (e) => new Me(e)
			},
			{
				id: "arrow",
				title: "Seta",
				icon: "arrow",
				create: (e) => new Pe(e)
			},
			{
				id: "hline",
				title: "Linha horizontal",
				icon: "hline",
				hotkey: "Alt + H",
				create: (e) => new Fe(e)
			},
			{
				id: "hray",
				title: "Raio horizontal",
				icon: "hray",
				hotkey: "Alt + J",
				create: (e) => new Ie(e)
			},
			{
				id: "vline",
				title: "Linha vertical",
				icon: "vline",
				hotkey: "Alt + V",
				create: (e) => new Le(e)
			},
			{
				id: "crossline",
				title: "Linha cruzada",
				icon: "crossline",
				hotkey: "Alt + C",
				create: (e) => new Re(e)
			},
			{
				id: "channel",
				title: "Canal paralelo",
				icon: "channel",
				create: (e) => new ze(e)
			}
		]
	},
	{
		id: "fib",
		title: "Ferramentas de Fibonacci",
		tools: [
			{
				id: "fib",
				title: "Retração de Fibonacci",
				icon: "fib",
				hotkey: "Alt + F",
				create: (e) => new Ve(e)
			},
			{
				id: "fibext",
				title: "Extensão de Fibonacci baseada em tendência",
				icon: "fibext",
				create: (e) => new He(e)
			},
			{
				id: "fibchannel",
				title: "Canal de Fibonacci",
				icon: "fibchannel",
				create: (e) => new Ue(e)
			}
		]
	},
	{
		id: "forecast",
		title: "Previsão e medição",
		tools: [
			{
				id: "long",
				title: "Posição comprada",
				icon: "long",
				create: (e) => new et(!0, e)
			},
			{
				id: "short",
				title: "Posição vendida",
				icon: "short",
				create: (e) => new et(!1, e)
			},
			{
				id: "pricerange",
				title: "Intervalo de preço",
				icon: "pricerange",
				create: (e) => new Ze(e)
			},
			{
				id: "daterange",
				title: "Intervalo de data",
				icon: "daterange",
				create: (e) => new Qe(e)
			},
			{
				id: "datepricerange",
				title: "Intervalo de data e preço",
				icon: "datepricerange",
				create: (e) => new $e(e)
			}
		]
	},
	{
		id: "volume",
		title: "Ferramentas de volume",
		tools: [{
			id: "frvp",
			title: "Perfil de volume de intervalo fixo",
			icon: "frvp",
			create: (e) => new tt(e)
		}, {
			id: "avwap",
			title: "VWAP ancorado",
			icon: "avwap",
			create: (e) => new nt(e)
		}]
	},
	{
		id: "shapes",
		title: "Formas geométricas",
		tools: [
			{
				id: "brush",
				title: "Pincel",
				icon: "brush",
				create: (e) => new qe(e)
			},
			{
				id: "rect",
				title: "Retângulo",
				icon: "rect",
				create: (e) => new We(e)
			},
			{
				id: "ellipse",
				title: "Elipse",
				icon: "ellipse",
				create: (e) => new Ge(e)
			},
			{
				id: "triangle",
				title: "Triângulo",
				icon: "triangle",
				create: (e) => new Ke(e)
			},
			{
				id: "path",
				title: "Caminho",
				icon: "path",
				create: (e) => new Je(e)
			}
		]
	},
	{
		id: "text",
		title: "Anotação",
		tools: [{
			id: "text",
			title: "Texto",
			icon: "text",
			create: (e) => new Ye(e)
		}]
	}
], it = rt.flatMap((e) => e.tools);
function N(e) {
	return it.find((t) => t.id === e);
}
function at(e) {
	let t = N(e.type);
	if (!t) return null;
	let n = t.create(e.opts);
	return n.id = e.id, n.points = e.points.map((e) => ({ ...e })), n.locked = !!e.locked, n.hidden = !!e.hidden, n;
}
//#endregion
//#region src/candlestick/drawings/manager.ts
function ot(e = "openchartscandle") {
	return {
		load: (t) => ie(`${e}.drawings.${t}`, []),
		save: (t, n) => ae(`${e}.drawings.${t}`, n)
	};
}
var st = class {
	constructor(e, t = ot()) {
		this.requestRender = e, this.storage = t, this.drawings = [], this.tool = null, this.magnet = "off", this.stayInDrawMode = !1, this.hideAll = !1, this.lockAll = !1, this.selected = null, this.hovered = null, this.hoverHit = null, this.creating = null, this.drag = null, this.undoStack = [], this.redoStack = [], this.symbol = "", this.clipboard = null, this.toolDefaults = ie("openchartscandle.toolDefaults", {}), this.changed = new T(), this.selection = new T(), this.toolChanged = new T(), this.textEdit = new T(), this.historyChanged = new T();
	}
	load(e) {
		this.cancelCreation(), this.symbol = e;
		let t = this.storage?.load(e) ?? [];
		this.drawings = t.map(at).filter((e) => !!e), this.selected = null, this.hovered = null, this.undoStack = [], this.redoStack = [], this.selection.emit(null), this.historyChanged.emit();
	}
	save() {
		this.symbol && this.storage && this.storage.save(this.symbol, this.toJSON());
	}
	toJSON() {
		return this.drawings.map((e) => e.toJSON());
	}
	fromJSON(e) {
		this.cancelCreation(), this.drawings = e.map(at).filter((e) => !!e), this.selected = null, this.hovered = null, this.selection.emit(null), this.save(), this.changed.emit(), this.requestRender();
	}
	serialize() {
		return JSON.stringify(this.drawings.map((e) => e.toJSON()));
	}
	restore(e) {
		let t = JSON.parse(e), n = this.selected?.id;
		this.drawings = t.map(at).filter((e) => !!e), this.selected = this.drawings.find((e) => e.id === n) ?? null, this.hovered = null, this.selection.emit(this.selected);
	}
	pushUndo(e) {
		this.undoStack.push(e), this.undoStack.length > 200 && this.undoStack.shift(), this.redoStack = [], this.historyChanged.emit();
	}
	checkpoint() {
		this.pushUndo(this.serialize());
	}
	commit() {
		this.save(), this.changed.emit(), this.requestRender();
	}
	canUndo() {
		return this.undoStack.length > 0;
	}
	canRedo() {
		return this.redoStack.length > 0;
	}
	undo() {
		if (this.creating) {
			this.cancelCreation();
			return;
		}
		let e = this.undoStack.pop();
		e !== void 0 && (this.redoStack.push(this.serialize()), this.restore(e), this.historyChanged.emit(), this.commit());
	}
	redo() {
		let e = this.redoStack.pop();
		e !== void 0 && (this.undoStack.push(this.serialize()), this.restore(e), this.historyChanged.emit(), this.commit());
	}
	setTool(e) {
		this.cancelCreation(), this.tool = e, e && this.select(null), this.toolChanged.emit(e), this.requestRender();
	}
	select(e) {
		this.selected !== e && (this.selected = e, this.selection.emit(e), this.requestRender());
	}
	remove(e) {
		let t = this.drawings.indexOf(e);
		t < 0 || (this.checkpoint(), this.drawings.splice(t, 1), this.selected === e && this.select(null), this.hovered === e && (this.hovered = null), this.commit());
	}
	deleteSelected() {
		this.selected && this.remove(this.selected);
	}
	clearAll() {
		this.drawings.length && (this.checkpoint(), this.drawings = [], this.select(null), this.commit());
	}
	copySelected() {
		this.selected && (this.clipboard = JSON.parse(JSON.stringify(this.selected.toJSON())));
	}
	paste(e) {
		if (!this.clipboard) return;
		let t = at(this.clipboard);
		if (!t) return;
		this.checkpoint(), t.id = `${t.id}_c${Date.now()}`;
		let n = Math.max(3, Math.round(20 / e.ts.barSpacing));
		t.points = t.points.map((t) => ({
			time: e.data.indexToTime(e.data.timeToIndex(t.time) + n),
			price: t.price
		})), this.clipboard = t.toJSON(), this.drawings.push(t), this.select(t), this.commit();
	}
	add(e, t, n) {
		let r = N(e);
		if (!r) return null;
		let i = r.create({
			...this.toolDefaults[e] ?? {},
			...n ?? {}
		});
		return i.points = t.map((e) => ({
			time: e.time > 1e11 ? Math.floor(e.time / 1e3) : e.time,
			price: e.price
		})), this.checkpoint(), this.drawings.push(i), this.commit(), i;
	}
	clone(e) {
		this.checkpoint();
		let t = e.clone();
		this.drawings.push(t), this.select(t), this.commit();
	}
	bringToFront(e) {
		this.checkpoint(), this.drawings = [...this.drawings.filter((t) => t !== e), e], this.commit();
	}
	sendToBack(e) {
		this.checkpoint(), this.drawings = [e, ...this.drawings.filter((t) => t !== e)], this.commit();
	}
	updateOptions(e, t, n = !0) {
		if (this.checkpoint(), Object.assign(e.opts, t), n && N(e.type)) {
			let n = [
				"color",
				"width",
				"dash",
				"fill",
				"fillEnabled",
				"textColor",
				"fontSize"
			], r = { ...this.toolDefaults[e.type] ?? {} };
			for (let e of Object.keys(t)) n.includes(e) && (r[e] = t[e]);
			this.toolDefaults[e.type] = r, ae("openchartscandle.toolDefaults", this.toolDefaults);
		}
		this.commit();
	}
	snap(e, t, n, r = !1) {
		let i = e.ts.xToIndex(t), a = Math.round(i), o = r ? e.data.indexToTime(i) : e.data.indexToTime(a), s = e.yToPrice(n);
		if (this.magnet !== "off" && !r) {
			let t = e.bars[a];
			if (t) {
				let r = Infinity, i = s;
				for (let a of [
					t.open,
					t.high,
					t.low,
					t.close
				]) {
					let t = Math.abs(e.priceToY(a) - n);
					t < r && (r = t, i = a);
				}
				(this.magnet === "strong" || r < 32) && (s = i);
			}
		}
		return {
			time: o,
			price: s
		};
	}
	hitTest(e, t, n) {
		if (this.hideAll) return null;
		if (this.selected && !this.selected.hidden) {
			let r = this.selected.hitTest(e, t, n, !0);
			if (r && r.kind === "handle") return {
				d: this.selected,
				hit: r
			};
		}
		for (let r = this.drawings.length - 1; r >= 0; r--) {
			let i = this.drawings[r], a = i.hitTest(e, t, n, i === this.selected || i === this.hovered);
			if (a) return {
				d: i,
				hit: a
			};
		}
		return null;
	}
	hover(e, t, n) {
		if (this.creating || this.drag || this.tool) return null;
		let r = this.hitTest(e, t, n), i = this.hovered;
		return this.hovered = r?.d ?? null, this.hoverHit = r?.hit ?? null, i !== this.hovered && this.requestRender(), r ? this.lockAll || r.d.locked ? "pointer" : r.hit.cursor : null;
	}
	isBusy() {
		return !!(this.creating || this.drag);
	}
	pointerDown(e, t, n, r) {
		if (this.tool) return this.createStep(e, t, n, r, !0), !0;
		let i = this.hitTest(e, t, n);
		return i ? (this.select(i.d), this.lockAll || i.d.locked || (this.drag = {
			d: i.d,
			kind: i.hit.kind === "handle" ? "handle" : "move",
			index: i.hit.index,
			startX: t,
			startY: n,
			orig: i.d.points.map((e) => ({ ...e })),
			before: this.serialize(),
			changed: !1
		}), !0) : (this.select(null), !1);
	}
	pointerMove(e, t, n, r) {
		let i = this.creating;
		if (i) {
			if (i.freehand) {
				if (!i.pressed) return;
				let r = e.toXY(i.d.points[i.d.points.length - 1]);
				Math.hypot(r.x - t, r.y - n) >= 2 && i.d.points.push(this.snap(e, t, n, !0));
			} else i.pressed && Math.hypot(t - i.downX, n - i.downY) > 5 && (i.dragged = !0), i.d.setCreationPoint(i.step, this.snap(e, t, n), e, r.shift);
			this.requestRender();
			return;
		}
		let a = this.drag;
		if (a && !(!a.changed && Math.hypot(t - a.startX, n - a.startY) < 2)) {
			if (a.changed || (a.changed = !0, this.pushUndo(a.before)), a.kind === "handle") a.d.moveHandle(a.index, this.snap(e, t, n), e, r.shift);
			else {
				let r = Math.round(e.ts.xToIndex(t) - e.ts.xToIndex(a.startX)), i = n - a.startY;
				a.d.points = a.orig.map((t) => ({
					time: e.data.indexToTime(e.data.timeToIndex(t.time) + r),
					price: e.yToPrice(e.priceToY(t.price) + i)
				}));
			}
			this.requestRender();
		}
	}
	pointerUp(e, t, n, r) {
		let i = this.creating;
		if (i) {
			if (i.freehand) {
				this.finishCreation();
				return;
			}
			let a = i.pressed && i.dragged;
			i.pressed = !1, i.dragged = !1, a && this.createStep(e, t, n, r, !1);
			return;
		}
		let a = this.drag;
		this.drag = null, a?.changed && this.commit();
	}
	doubleClick(e, t, n) {
		if (this.creating && this.creating.d.pointsNeeded === -1) {
			let t = this.creating.d;
			for (; t.points.length > 2;) {
				let n = e.toXY(t.points[t.points.length - 1]), r = e.toXY(t.points[t.points.length - 2]);
				if (Math.hypot(n.x - r.x, n.y - r.y) < 4) t.points.pop();
				else break;
			}
			return this.finishCreation(), null;
		}
		let r = this.hitTest(e, t, n);
		return r ? r.d : null;
	}
	createStep(e, t, n, r, i) {
		let a = this.creating;
		if (!a) {
			if (!i || !this.tool) return;
			let a = N(this.tool);
			if (!a) return;
			let o = a.create(this.toolDefaults[this.tool]), s = this.serialize(), c = o.pointsNeeded;
			if (c === 0) {
				o.points = [this.snap(e, t, n, !0)], this.drawings.push(o), this.creating = {
					d: o,
					step: 0,
					downX: t,
					downY: n,
					pressed: !0,
					dragged: !1,
					freehand: !0,
					before: s
				}, this.requestRender();
				return;
			}
			let l = this.snap(e, t, n);
			if (o.points = [l], c === 1) {
				o.setCreationPoint(0, l, e, r.shift), o.init(e), this.drawings.push(o), this.creating = {
					d: o,
					step: 0,
					downX: t,
					downY: n,
					pressed: !1,
					dragged: !1,
					freehand: !1,
					before: s
				}, this.finishCreation(), o.type === "text" && this.textEdit.emit(o);
				return;
			}
			o.points.push({ ...l }), this.drawings.push(o), this.creating = {
				d: o,
				step: 1,
				downX: t,
				downY: n,
				pressed: !0,
				dragged: !1,
				freehand: !1,
				before: s
			}, this.requestRender();
			return;
		}
		i && (a.pressed = !0, a.dragged = !1, a.downX = t, a.downY = n);
		let o = a.d, s = this.snap(e, t, n);
		o.setCreationPoint(a.step, s, e, r.shift);
		let c = o.pointsNeeded;
		c === -1 || a.step < c - 1 ? (a.step++, o.points.push({ ...o.points[o.points.length - 1] }), o.setCreationPoint(a.step, s, e, r.shift)) : this.finishCreation(), this.requestRender();
	}
	finishCreation() {
		let e = this.creating;
		if (!e) return;
		this.creating = null;
		let t = e.d;
		t.pointsNeeded === -1 && t.points.length > 2 && t.points.pop(), t.pointsNeeded === 1 || t.points.length >= 2 ? (this.pushUndo(e.before), this.select(t)) : this.drawings = this.drawings.filter((e) => e !== t), this.stayInDrawMode || (this.tool = null, this.toolChanged.emit(null)), this.commit();
	}
	cancelCreation() {
		let e = this.creating;
		e && (this.creating = null, e.d.pointsNeeded === -1 && e.d.points.length > 2 ? (this.creating = e, this.finishCreation()) : (this.drawings = this.drawings.filter((t) => t !== e.d), this.requestRender()));
	}
	draw(e) {
		if (this.hideAll && !this.creating) return;
		let t = e.ctx;
		for (let n of this.drawings) {
			if (n.hidden) continue;
			let r = n === this.selected, i = n === this.hovered, a = this.creating?.d === n;
			t.save(), n.draw(e, {
				selected: r,
				hovered: i,
				creating: a
			}), t.restore();
		}
		let n = /* @__PURE__ */ new Set();
		this.selected && !this.selected.hidden && n.add(this.selected), this.hovered && !this.hovered.hidden && !this.drag && n.add(this.hovered), this.creating && n.add(this.creating.d);
		for (let i of n) {
			let n = i.locked || this.lockAll;
			pe(t, i.handles(e), n ? r.muted : r.accent);
		}
	}
	axisMarks(e) {
		let t = [], n = [];
		if (!this.hideAll) for (let r of this.drawings) {
			if (r.hidden || r.points.length === 0) continue;
			let i = r.axisMarks(e);
			if (r.type === "hline" || r.type === "hray" || r.type === "crossline") for (let e of i.prices) e.persistent && t.push({
				price: e.price,
				color: e.color ?? r.opts.color
			});
			(r.type === "vline" || r.type === "crossline") && n.push({
				time: r.points[0].time,
				color: r.opts.color
			});
		}
		let r = this.creating?.d ?? this.drag?.d ?? this.selected ?? null;
		return {
			active: r && !r.hidden && r.points.length ? r.axisMarks(e) : null,
			persistent: t,
			persistentTimes: n
		};
	}
};
//#endregion
//#region src/candlestick/core/axes.ts
function ct(e, t) {
	if (e.getUTCFullYear() !== t.getUTCFullYear()) return 9;
	if (e.getUTCMonth() !== t.getUTCMonth()) return 8;
	if (e.getUTCDate() !== t.getUTCDate()) return 7;
	let n = e.getUTCHours();
	if (n !== t.getUTCHours()) return n % 12 == 0 ? 6 : n % 6 == 0 ? 5.5 : n % 3 == 0 ? 5 : 4.5;
	let r = e.getUTCMinutes();
	return r % 30 == 0 ? 4 : r % 15 == 0 ? 3.5 : r % 5 == 0 ? 3 : 2;
}
function lt(e, t) {
	return t >= 9 ? String(e.getUTCFullYear()) : t >= 8 ? C[e.getUTCMonth()] : t >= 7 ? String(e.getUTCDate()) : `${S(e.getUTCHours())}:${S(e.getUTCMinutes())}`;
}
function ut(e, t, n = new c(), r = 76) {
	if (t.length === 0) return [];
	let i = t.tf >= 86400 ? u : (e) => n.wall(e), a = Math.max(1, Math.floor(e.xToIndex(-r))), o = Math.ceil(e.xToIndex(e.width + r));
	if (o <= a) return [];
	let s = o - a + 1, l = new Float32Array(s), d = /* @__PURE__ */ new Set(), f = i(t.indexToTime(a - 1));
	for (let e = a; e <= o; e++) {
		let n = i(t.indexToTime(e)), r = ct(n, f);
		l[e - a] = r, d.add(r), f = n;
	}
	let p = [...d].sort((e, t) => t - e), m = [], h = Math.max(r, e.barSpacing * .9);
	for (let t of p) for (let n = 0; n < s; n++) {
		if (l[n] !== t) continue;
		let r = a + n, i = e.indexToX(r), o = 0, s = m.length;
		for (; o < s;) {
			let e = o + s >> 1;
			m[e].x < i ? o = e + 1 : s = e;
		}
		let c = m[o - 1], u = m[o];
		c && i - c.x < h || u && u.x - i < h || m.splice(o, 0, {
			x: i,
			i: r,
			w: t
		});
	}
	return m.map((e) => ({
		x: e.x,
		weight: e.w,
		label: lt(i(t.indexToTime(e.i)), e.w)
	}));
}
function dt(e, t, n, r = 46) {
	if (t <= 0) return [];
	let i = e.yToPrice(0), a = e.yToPrice(t), o = Math.max(i, a), s = Math.min(i, a), c = o - s;
	if (!(c > 0)) return [];
	let l = h(c / Math.max(2, t / r)), u = 10 ** -n;
	l < u && (l = u);
	let d = [], f = Math.ceil(s / l) * l;
	for (let e = f; e <= o + l * 1e-6 && (d.push(Math.round(e / u) * u), !(d.length > 200)); e += l);
	return d;
}
//#endregion
//#region src/candlestick/core/data.ts
function P(e, t) {
	if (t === 604800) {
		let n = 345600;
		return Math.floor((e - n) / t) * t + n;
	}
	return Math.floor(e / t) * t;
}
function ft(e, t, n = 0, r = []) {
	let i = null;
	for (let a = n; a < e.length; a++) {
		let n = e[a], o = P(n.time, t);
		!i || i.time !== o ? (i = {
			time: o,
			open: n.open,
			high: n.high,
			low: n.low,
			close: n.close,
			volume: n.volume
		}, r.push(i)) : (n.high > i.high && (i.high = n.high), n.low < i.low && (i.low = n.low), i.close = n.close, i.volume += n.volume);
	}
	return r;
}
function pt(e) {
	return {
		time: e.time > 1e11 ? Math.floor(e.time / 1e3) : e.time,
		open: +e.open,
		high: +e.high,
		low: +e.low,
		close: +e.close,
		volume: +(e.volume ?? 0)
	};
}
function mt(e) {
	let t = [], n = e.map(pt).sort((e, t) => e.time - t.time);
	for (let e of n) t.length && t[t.length - 1].time === e.time ? t[t.length - 1] = e : t.push(e);
	return t;
}
var ht = class {
	constructor(e, t = []) {
		this.tf = e, this.bars = [], this.bars = mt(t);
	}
	get length() {
		return this.bars.length;
	}
	update(e) {
		let t = pt(e), n = this.bars.length;
		if (n === 0) return this.bars.push(t), 0;
		let r = this.bars[n - 1];
		return t.time === r.time ? (this.bars[n - 1] = t, n - 1) : t.time > r.time ? (this.bars.push(t), n) : -1;
	}
	prepend(e) {
		if (!this.bars.length) return this.bars = mt(e), this.bars.length;
		let t = this.bars[0].time, n = mt(e).filter((e) => e.time < t);
		return n.length && (this.bars = n.concat(this.bars)), n.length;
	}
	append(e) {
		let t = this.bars.length;
		if (!t) return this.bars = mt(e), this.bars.length ? {
			from: 0,
			added: this.bars.length
		} : null;
		let n = this.bars[t - 1].time, r = mt(e).filter((e) => e.time >= n);
		if (!r.length) return null;
		r[0].time === n && (this.bars[t - 1] = r.shift());
		for (let e of r) this.bars.push(e);
		return {
			from: t - 1,
			added: r.length
		};
	}
	indexAt(e) {
		let t = this.bars, n = t.length;
		if (n === 0) return 0;
		if (e < t[0].time) return Math.floor((e - t[0].time) / this.tf);
		if (e >= t[n - 1].time) return n - 1 + Math.floor((e - t[n - 1].time) / this.tf);
		let r = 0, i = n - 1;
		for (; i - r > 1;) {
			let n = r + i >> 1;
			t[n].time <= e ? r = n : i = n;
		}
		return r;
	}
	timeToIndex(e) {
		let t = this.bars, n = t.length;
		if (n === 0) return 0;
		if (e <= t[0].time) return (e - t[0].time) / this.tf;
		if (e >= t[n - 1].time) return n - 1 + (e - t[n - 1].time) / this.tf;
		let r = 0, i = n - 1;
		for (; i - r > 1;) {
			let n = r + i >> 1;
			t[n].time <= e ? r = n : i = n;
		}
		return r + (e - t[r].time) / (t[i].time - t[r].time);
	}
	indexToTime(e) {
		let t = this.bars, n = t.length;
		if (n === 0) return 0;
		if (e <= 0) return t[0].time + e * this.tf;
		if (e >= n - 1) return t[n - 1].time + (e - (n - 1)) * this.tf;
		let r = Math.floor(e), i = e - r;
		return t[r].time + i * (t[r + 1].time - t[r].time);
	}
}, gt = (e) => e > 1e11 ? Math.floor(e / 1e3) : e, _t = class {
	constructor(e) {
		this.chart = e, this.source = null, this.gen = 0, this.noMoreBack = !0, this.liveGap = !1, this.follow = !1, this.countBack = 1e3, this.maxJump = 2e4, this.liveBar = null, this.fwdCursor = 0, this.queue = Promise.resolve(), this.ctrl = null, this.pending = 0, this.backTask = null, this.retryAt = 0, this.fwdTask = null;
	}
	get loading() {
		return this.pending > 0;
	}
	reset() {
		this.ctrl?.abort(), this.ctrl = null, this.gen++, this.source = null, this.queue = Promise.resolve(), this.backTask = this.fwdTask = null, this.noMoreBack = !0, this.liveGap = !1, this.follow = !1, this.liveBar = null, this.pending && (this.pending = 0, this.chart.loadingChanged.emit(!1));
	}
	async start(e, t, n) {
		this.reset(), this.source = e, this.countBack = Math.max(10, n.countBack ?? 1e3), this.maxJump = Math.max(this.countBack, n.maxJump ?? 2e4);
		let r = this.gen, i = n.time === void 0 ? void 0 : gt(n.time);
		return await this.run(async (e) => {
			let n = this.edge(t), a = i !== void 0 && (n - i) / t > this.maxJump ? this.windowEnd(i, t) : n, o = await this.fetch({
				to: a,
				countBack: this.countBack,
				firstRequest: !0
			}, e, r);
			return o ? (this.chart.replaceData(o.bars, t, i === void 0), this.noMoreBack = o.noMore || o.bars.length === 0, this.liveGap = a < n, this.fwdCursor = a, this.chart.viewChanged.emit(), this.chart.historyLoaded.emit({
				added: o.bars.length,
				direction: "reset"
			}), !0) : !1;
		}) === !0 && r === this.gen;
	}
	check() {
		if (!this.source || this.pending || performance.now() < this.retryAt) return;
		let e = this.chart.data.length;
		if (!e) return;
		let t = this.chart.ts, n = t.width / t.barSpacing, r = t.visibleRange();
		!this.noMoreBack && r.from < n + this.chart.warmupBars() ? this.loadBack() : this.liveGap && r.to > e - 1 - n && this.loadForward();
	}
	loadBack(e = this.countBack) {
		if (this.backTask) return this.backTask;
		let t = this.gen, n = this.run(async (n) => {
			let r = this.chart.data;
			if (this.noMoreBack || !r.length) return 0;
			let i = r.bars[0].time, a = await this.fetch({
				to: i,
				countBack: e,
				firstRequest: !1
			}, n, t);
			if (!a) return -1;
			let o = this.chart.prependBars(a.bars);
			return (a.noMore || o === 0) && (this.noMoreBack = !0), this.chart.viewChanged.emit(), this.chart.historyLoaded.emit({
				added: o,
				direction: "back"
			}), o;
		}).then((e) => e ?? -1);
		return this.backTask = n, n.finally(() => {
			this.backTask === n && (this.backTask = null);
		}), n;
	}
	loadForward() {
		if (this.fwdTask) return this.fwdTask;
		let e = this.gen, t = this.run(async (t) => {
			let n = this.chart.data;
			if (!this.liveGap || !n.length) return 0;
			let r = n.tf, i = n.bars[n.length - 1].time, a = this.edge(r), o = Math.max(i, this.fwdCursor) + (this.countBack + 1) * r, s = o >= a;
			s && (o = a);
			let c = await this.fetch({
				to: o,
				countBack: this.countBack,
				firstRequest: !1
			}, t, e);
			if (!c) return -1;
			let l = this.chart.appendBars(c.bars, this.follow);
			if (this.fwdCursor = o, s) {
				this.liveGap = !1, this.follow = !1;
				let e = this.liveBar;
				this.liveBar = null, e && this.chart.update(e);
			}
			return this.chart.viewChanged.emit(), this.chart.historyLoaded.emit({
				added: l,
				direction: "forward"
			}), s || this.chart.requestRender(), l;
		}).then((e) => e ?? -1);
		return this.fwdTask = t, t.finally(() => {
			this.fwdTask === t && (this.fwdTask = null);
		}), t;
	}
	async cover(e, t = 0) {
		let n = gt(e);
		if (!Number.isFinite(n)) return !1;
		let r = this.gen;
		for (let e = 0; e < 1e3; e++) {
			if (r !== this.gen) return !1;
			let e = this.chart.data;
			if (!e.length) return !1;
			if (!this.source) return n >= e.bars[0].time;
			let i = e.tf, a = e.bars[0].time, o = e.bars[e.length - 1].time;
			if (n >= a && (n <= o + i || !this.liveGap)) {
				for (; t > 0 && !this.noMoreBack && r === this.gen && this.chart.data.indexAt(n) < t && !(await this.loadBack(Math.max(this.countBack, t - this.chart.data.indexAt(n))) <= 0););
				return !0;
			}
			if (n < a) {
				if (this.noMoreBack) return !1;
				let e = Math.ceil((a - n) / i);
				if (e > this.maxJump) {
					if (!await this.jump(n)) return !1;
					continue;
				}
				if (await this.loadBack(Math.min(this.maxJump, Math.max(this.countBack, e + t))) < 0) return !1;
			} else if ((n - o) / i > this.maxJump) {
				if (!await this.jump(n)) return !1;
			} else if (await this.loadForward() < 0) return !1;
		}
		return !1;
	}
	async jump(e) {
		let t = this.gen;
		return await this.run(async (n) => {
			let r = this.chart.data.tf, i = this.edge(r), a = Math.min(i, this.windowEnd(e, r)), o = await this.fetch({
				to: a,
				countBack: this.countBack,
				firstRequest: !1
			}, n, t);
			return !o || !o.bars.length ? !1 : (this.chart.replaceData(o.bars, r, !1), this.noMoreBack = !!o.noMore, this.liveGap = a < i, this.follow = !1, this.fwdCursor = a, this.chart.viewChanged.emit(), this.chart.historyLoaded.emit({
				added: o.bars.length,
				direction: "reset"
			}), !0);
		}) === !0;
	}
	async toLatest() {
		if (!this.liveGap) return !0;
		let e = this.gen;
		return await this.run(async (t) => {
			let n = this.chart.data.tf, r = this.edge(n), i = await this.fetch({
				to: r,
				countBack: this.countBack,
				firstRequest: !1
			}, t, e);
			if (!i || !i.bars.length) return !1;
			this.chart.replaceData(i.bars, n, !0), this.noMoreBack = !!i.noMore, this.liveGap = !1, this.follow = !1;
			let a = this.liveBar;
			return this.liveBar = null, a && this.chart.update(a), this.chart.viewChanged.emit(), this.chart.historyLoaded.emit({
				added: i.bars.length,
				direction: "reset"
			}), !0;
		}) === !0;
	}
	resync() {
		let e = this.chart.data;
		this.source && e.length && !this.liveGap && (this.follow = !this.chart.isScrolledBack(), this.liveGap = !0, this.fwdCursor = e.bars[e.length - 1].time, this.loadForward());
	}
	holdLive(e) {
		if (!this.liveGap) return !1;
		let t = gt(e.time);
		return (!this.liveBar || t >= this.liveBar.time) && (this.liveBar = {
			...e,
			time: t
		}), !0;
	}
	edge(e) {
		let t = P(Date.now() / 1e3, e) + e;
		return this.liveBar ? Math.max(t, this.liveBar.time + e) : t;
	}
	windowEnd(e, t) {
		return P(e, t) + Math.ceil(this.countBack / 2) * t;
	}
	async fetch(e, t, n) {
		let r = this.source;
		if (!r || n !== this.gen) return null;
		let i = await r({
			...e,
			signal: t
		});
		return n !== this.gen || t.aborted ? null : Array.isArray(i) ? {
			bars: i,
			noMore: !0
		} : {
			bars: i?.bars ?? [],
			noMore: !!i?.noMore
		};
	}
	run(e) {
		let t = this.gen;
		this.pending++ === 0 && this.chart.loadingChanged.emit(!0);
		let n = this.queue.then(async () => {
			if (t !== this.gen) return null;
			let n = new AbortController();
			this.ctrl = n;
			try {
				return await e(n.signal);
			} catch (e) {
				return t === this.gen && !n.signal.aborted && (this.retryAt = performance.now() + 3e3, this.chart.historyError.emit(e)), null;
			} finally {
				this.ctrl === n && (this.ctrl = null), t === this.gen && --this.pending === 0 && (this.chart.loadingChanged.emit(!1), this.chart.requestRender());
			}
		});
		return this.queue = n.catch(() => void 0), n;
	}
}, vt = class {
	constructor() {
		this.width = 0, this.barSpacing = 8, this.rightOffset = 8, this.baseIndex = 0, this.minSpacing = .5, this.maxSpacing = 80;
	}
	indexToX(e) {
		return this.width - (this.baseIndex + this.rightOffset - e) * this.barSpacing - this.barSpacing * .5;
	}
	xToIndex(e) {
		return this.baseIndex + this.rightOffset - (this.width - e - this.barSpacing * .5) / this.barSpacing;
	}
	setBarSpacing(e) {
		this.barSpacing = d(e, this.minSpacing, this.maxSpacing);
	}
	zoom(e, t) {
		let n = this.xToIndex(e);
		this.setBarSpacing(this.barSpacing + t * (this.barSpacing / 10)), this.rightOffset += n - this.xToIndex(e), this.constrain();
	}
	constrain() {
		let e = this.width / this.barSpacing, t = Math.max(e - 3, 0), n = -this.baseIndex + 3 - e;
		this.rightOffset = d(this.rightOffset, Math.min(n, t), t);
	}
	visibleRange() {
		return {
			from: Math.floor(this.xToIndex(0)),
			to: Math.ceil(this.xToIndex(this.width))
		};
	}
}, yt = class {
	constructor() {
		this.height = 0, this.min = 0, this.max = 1, this.auto = !0, this.log = !1, this.invert = !1, this.marginTop = .1, this.marginBottom = .1;
	}
	tr(e) {
		return this.log ? Math.log10(Math.max(e, 1e-12)) : e;
	}
	itr(e) {
		return this.log ? 10 ** e : e;
	}
	get innerTop() {
		return this.height * this.marginTop;
	}
	get inner() {
		return Math.max(1, this.height * (1 - this.marginTop - this.marginBottom));
	}
	setRange(e, t) {
		if (isFinite(e) && isFinite(t)) {
			if (t - e < Math.abs(t) * 1e-9 || t === e) {
				let n = Math.abs(t) * .01 || 1;
				e -= n, t += n;
			}
			this.log && e <= 0 && (e = t / 100), this.min = e, this.max = t;
		}
	}
	priceToY(e) {
		let t = this.tr(this.min), n = this.tr(this.max), r = (this.tr(e) - t) / (n - t);
		return this.invert && (r = 1 - r), this.innerTop + (1 - r) * this.inner;
	}
	yToPrice(e) {
		let t = this.tr(this.min), n = this.tr(this.max), r = 1 - (e - this.innerTop) / this.inner;
		return this.invert && (r = 1 - r), this.itr(t + r * (n - t));
	}
	scaleFrom(e, t, n) {
		let r = this.tr(e), i = this.tr(t), a = (r + i) / 2, o = (i - r) / 2 * n;
		this.min = this.itr(a - o), this.max = this.itr(a + o);
	}
	panFrom(e, t, n) {
		let r = this.tr(e), i = this.tr(t), a = (i - r) / this.inner * n * (this.invert ? -1 : 1);
		this.min = this.itr(r + a), this.max = this.itr(i + a);
	}
}, bt = class {
	constructor(e = .2, t = 7, n = .997, r = 15) {
		this.minSpeed = e, this.maxSpeed = t, this.damping = n, this.minMove = r, this.positions = [], this.startPos = null, this.speed = 0, this.duration = 0;
	}
	reset() {
		this.positions = [], this.startPos = null;
	}
	addPosition(e, t) {
		let n = this.positions[0];
		if (n) {
			if (n.time === t) {
				n.position = e;
				return;
			}
			if (Math.abs(n.position - e) < this.minMove) return;
		}
		this.positions.unshift({
			time: t,
			position: e
		}), this.positions.length > 4 && (this.positions.length = 4);
	}
	start(e, t) {
		let n = this.positions;
		if (n.length < 2 || t - n[0].time > 50) return !1;
		let r = (e, t) => {
			let n = (e.position - t.position) / (e.time - t.time);
			return Math.sign(n) * Math.min(Math.abs(n), this.maxSpeed);
		}, i = r(n[0], n[1]), a = [i], o = [n[0].position - n[1].position];
		for (let e = 1; e < n.length - 1; e++) {
			let t = r(n[e], n[e + 1]);
			if (Math.sign(t) !== Math.sign(i)) break;
			a.push(t), o.push(n[e].position - n[e + 1].position);
		}
		let s = o.reduce((e, t) => e + t, 0), c = 0;
		for (let e = 0; e < a.length; e++) c += o[e] / s * a[e];
		if (!isFinite(c) || Math.abs(c) < this.minSpeed) return !1;
		let l = Math.log(this.damping);
		return this.startPos = {
			time: t,
			position: e
		}, this.speed = c, this.duration = Math.log(1 * l / -Math.abs(c)) / l, !0;
	}
	position(e) {
		let t = this.startPos, n = Math.min(e - t.time, this.duration);
		return t.position + this.speed * (this.damping ** +n - 1) / Math.log(this.damping);
	}
	finished(e) {
		return this.startPos === null || e - this.startPos.time >= this.duration;
	}
};
//#endregion
//#region src/candlestick/core/series.ts
function xt(e, t) {
	if (e >= 2.5 && e <= 4) return Math.floor(3 * t);
	let n = 1 - .2 * Math.atan(Math.max(4, e) - 4) / (Math.PI * .5), r = Math.floor(e * n * t), i = Math.floor(e * t);
	return Math.max(Math.floor(t), Math.min(r, i));
}
function St(e, t, n) {
	t.length = Math.min(t.length, n);
	for (let n = t.length; n < e.length; n++) {
		let r = e[n], i = (r.open + r.high + r.low + r.close) / 4, a = n === 0 ? (r.open + r.close) / 2 : (t[n - 1].open + t[n - 1].close) / 2;
		t.push({
			time: r.time,
			open: a,
			close: i,
			high: Math.max(r.high, a, i),
			low: Math.min(r.low, a, i),
			volume: r.volume
		});
	}
	return t;
}
function Ct() {
	return {
		up: r.up,
		down: r.down,
		wickUp: r.wickUp,
		wickDown: r.wickDown,
		borderUp: r.borderUp,
		borderDown: r.borderDown,
		border: r.candleBorder,
		line: r.line
	};
}
function wt(e, t, n, r = Ct()) {
	let i = Math.max(0, e.from - 1), a = Math.min(n.length - 1, e.to + 1);
	if (!(a < i)) switch (t) {
		case "candles":
		case "heikin":
			Et(e, n, i, a, r, !1);
			break;
		case "hollow":
			Et(e, n, i, a, r, !0);
			break;
		case "bars":
			Dt(e, n, i, a, r);
			break;
		case "line":
		case "step":
			kt(e, n, i, a, r.line, t === "step");
			break;
		case "area":
			At(e, n, i, a, r.line);
			break;
		case "baseline": jt(e, n, i, a, r);
	}
}
function Tt(e, t) {
	let n = e.ctx;
	n.save(), n.setTransform(1, 0, 0, 1, Math.round(e.rect.x * e.dpr), Math.round(e.rect.y * e.dpr)), t(n), n.restore();
}
function Et(e, t, n, r, i, a) {
	let o = e.dpr, s = e.ts.barSpacing, c = xt(s, o), l = Math.max(1, Math.min(Math.floor(o), c));
	c >= 2 && c % 2 != l % 2 && c--;
	let u = Math.floor(l * .5), d = Math.max(1, Math.floor(o)), f = s * o < 2.5, p = (e) => {
		let n = t[e];
		return a ? n.close >= (e > 0 ? t[e - 1].close : n.open) : n.close >= n.open;
	}, m = (t) => Math.round(e.ps.priceToY(t) * o);
	Tt(e, (s) => {
		for (let a of [!0, !1]) {
			s.fillStyle = f ? a ? i.up : i.down : a ? i.wickUp : i.wickDown;
			for (let i = n; i <= r; i++) {
				if (p(i) !== a) continue;
				let n = t[i], r = Math.round(e.ts.indexToX(i) * o), c = m(n.open), d = m(n.close), h = m(n.high), g = m(n.low), _ = Math.min(c, d), v = Math.max(c, d), y = r - u;
				f ? s.fillRect(y, Math.min(h, _), l, Math.max(g, v) - Math.min(h, _) + 1) : (_ > h && s.fillRect(y, h, l, _ - h), g > v && s.fillRect(y, v + 1, l, g - v));
			}
		}
		if (!f) for (let l of [!0, !1]) {
			let u = l ? i.up : i.down, f = l ? i.borderUp : i.borderDown;
			for (let h = n; h <= r; h++) {
				if (p(h) !== l) continue;
				let n = t[h], r = Math.round(e.ts.indexToX(h) * o), g = m(n.open), _ = m(n.close), v = Math.min(g, _), y = Math.max(g, _), b = r - Math.floor(c * .5), x = y - v + 1, S = a && n.close > n.open || i.border, C = c > d * 2 + 1 && x > d * 2;
				S && C ? (s.fillStyle = a && n.close > n.open ? u : f, s.fillRect(b, v, c, d), s.fillRect(b, y - d + 1, c, d), s.fillRect(b, v, d, x), s.fillRect(b + c - d, v, d, x), a && n.close > n.open || (s.fillStyle = u, s.fillRect(b + d, v + d, c - d * 2, x - d * 2))) : (s.fillStyle = i.border ? f : u, s.fillRect(b, v, c, x));
			}
		}
	});
}
function Dt(e, t, n, r, i) {
	let a = e.dpr, o = e.ts.barSpacing, s = Math.max(1, Math.min(Math.floor(a * Math.max(1, o / 12)), Math.floor(o * a * .3) || 1)), c = Math.max(Math.floor(a), Math.floor(xt(o, a) / 2)), l = Math.floor(s / 2);
	Tt(e, (u) => {
		for (let d of [0, 1]) {
			u.fillStyle = d === 0 ? i.up : i.down;
			for (let i = n; i <= r; i++) {
				let n = t[i], r = n.close >= (i > 0 ? t[i - 1].close : n.open);
				if (d === 0 !== r) continue;
				let f = Math.round(e.ts.indexToX(i) * a), p = Math.round(e.ps.priceToY(n.open) * a), m = Math.round(e.ps.priceToY(n.close) * a), h = Math.round(e.ps.priceToY(n.high) * a), g = Math.round(e.ps.priceToY(n.low) * a);
				u.fillRect(f - l, h, s, Math.max(g - h + 1, s)), o * a >= 3 && (u.fillRect(f - l - c, p - l, c, s), u.fillRect(f - l + s, m - l, c, s));
			}
		}
	});
}
function Ot(e, t, n, r, i, a) {
	let o = 0;
	for (let s = r; s <= i; s++) {
		let i = t.ts.indexToX(s), c = t.ps.priceToY(n[s].close);
		s === r ? e.moveTo(i, c) : (a && e.lineTo(i, o), e.lineTo(i, c)), o = c;
	}
}
function kt(e, t, n, r, i, a) {
	let o = e.ctx;
	o.save(), o.lineWidth = 2, o.lineJoin = "round", o.lineCap = "round", o.strokeStyle = i, o.beginPath(), Ot(o, e, t, n, r, a), o.stroke(), o.restore();
}
function At(e, t, n, r, i) {
	let a = e.ctx;
	a.save();
	let o = a.createLinearGradient(0, 0, 0, e.height);
	o.addColorStop(0, g(i, .28)), o.addColorStop(1, g(i, .02)), a.beginPath(), Ot(a, e, t, n, r, !1), a.lineTo(e.ts.indexToX(r), e.height), a.lineTo(e.ts.indexToX(n), e.height), a.closePath(), a.fillStyle = o, a.fill(), a.lineWidth = 2, a.lineJoin = "round", a.strokeStyle = i, a.beginPath(), Ot(a, e, t, n, r, !1), a.stroke(), a.restore();
}
function jt(e, t, n, i, a) {
	let o = e.ctx, s = e.height / 2;
	for (let r of [0, 1]) {
		let c = r === 0 ? a.up : a.down;
		o.save(), o.beginPath(), r === 0 ? o.rect(0, 0, e.width, s) : o.rect(0, s, e.width, e.height - s), o.clip();
		let l = o.createLinearGradient(0, r === 0 ? 0 : e.height, 0, s);
		l.addColorStop(0, g(c, .28)), l.addColorStop(1, g(c, .05)), o.beginPath(), Ot(o, e, t, n, i, !1), o.lineTo(e.ts.indexToX(i), s), o.lineTo(e.ts.indexToX(n), s), o.closePath(), o.fillStyle = l, o.fill(), o.lineWidth = 2, o.lineJoin = "round", o.strokeStyle = c, o.beginPath(), Ot(o, e, t, n, i, !1), o.stroke(), o.restore();
	}
	o.save(), o.strokeStyle = g(r.muted, .6), o.setLineDash([4, 4]), o.lineWidth = 1, o.beginPath();
	let c = Math.round(s) + .5;
	o.moveTo(0, c), o.lineTo(e.width, c), o.stroke(), o.restore();
}
//#endregion
//#region src/candlestick/core/trades.ts
var Mt = (e) => e > 1e11 ? Math.floor(e / 1e3) : e;
function Nt(e, t) {
	let n = ((e.exitPrice ?? t) - e.entryPrice) * (e.side === "long" ? 1 : -1);
	return {
		abs: n * (e.qty ?? 1),
		pct: n / e.entryPrice * 100
	};
}
function Pt(e, t) {
	let n = 0, r = 0, i = 0, a = 0, o = 0;
	for (let s of e) {
		let e = Nt(s, t);
		i += e.abs, a += e.pct, s.exitPrice !== void 0 && (o++, e.abs > 0 ? n++ : r++);
	}
	return {
		total: e.length,
		closed: o,
		open: e.length - o,
		wins: n,
		losses: r,
		winRate: o ? n / o * 100 : 0,
		pnlPct: a,
		pnl: i
	};
}
function Ft(e, t) {
	return e.ts.indexToX(e.data.indexAt(Mt(t)));
}
function It(e, t, n, r, i, a = 7) {
	e.fillStyle = i, e.beginPath(), r ? (e.moveTo(t, n), e.lineTo(t - a, n + a * 1.3), e.lineTo(t - a * .35, n + a * 1.3), e.lineTo(t - a * .35, n + a * 2.2), e.lineTo(t + a * .35, n + a * 2.2), e.lineTo(t + a * .35, n + a * 1.3), e.lineTo(t + a, n + a * 1.3)) : (e.moveTo(t, n), e.lineTo(t - a, n - a * 1.3), e.lineTo(t - a * .35, n - a * 1.3), e.lineTo(t - a * .35, n - a * 2.2), e.lineTo(t + a * .35, n - a * 2.2), e.lineTo(t + a * .35, n - a * 1.3), e.lineTo(t + a, n - a * 1.3)), e.closePath(), e.fill();
}
function Lt(e, t, n, r, i, o) {
	e.font = a(11, "600");
	let s = e.measureText(t).width + 10, c = Math.round(n - s / 2), l = Math.round(o ? r : r - 17);
	return e.fillStyle = i, e.beginPath(), e.roundRect(c, l, s, 17, 3), e.fill(), e.fillStyle = "#ffffff", e.textAlign = "center", e.textBaseline = "middle", e.fillText(t, c + s / 2, l + 17 / 2 + .5), {
		x: c,
		y: l,
		w: s,
		h: 17
	};
}
function Rt(e, t, n, r) {
	e.strokeStyle = r, e.lineWidth = 2, e.beginPath(), e.arc(t, n, 7, 0, Math.PI * 2), e.stroke(), e.fillStyle = g(r, .25), e.beginPath(), e.arc(t, n, 12, 0, Math.PI * 2), e.fill();
}
function zt(e, t, n, r, i, a) {
	let o = i ? r - 6 : r - 6 - 7 * 2.2, s = i ? r + 6 + 7 * 2.2 : r + 6, c = n - 9, l = n + 9;
	return a && (o = Math.min(o, a.y), s = Math.max(s, a.y + a.h), c = Math.min(c, a.x), l = Math.max(l, a.x + a.w)), {
		trade: e,
		point: t,
		x: c,
		y: o,
		w: l - c,
		h: s - o
	};
}
var Bt = (e) => `${e >= 0 ? "+" : "−"}${Math.abs(e).toFixed(2)}%`;
function Vt(e, t, n, r = {
	entries: !0,
	exits: !0,
	lines: !0
}, i = null) {
	let o = [], s = e.bars, c = s[s.length - 1];
	if (!c || !r.entries && !r.exits) return o;
	let l = e.ctx, u = e.ts.indexToX(s.length - 1), d = r.lines && r.entries && r.exits;
	for (let s of t) {
		let t = Ft(e, s.entryTime), f = s.exitTime === void 0 || s.exitPrice === void 0, p = f ? u : Ft(e, s.exitTime);
		if (Math.max(t, p) < -40 || Math.min(t, p) > e.width + 40) continue;
		let m = e.priceToY(s.entryPrice), h = e.priceToY(f ? c.close : s.exitPrice), { abs: _, pct: v } = Nt(s, c.close), y = _ >= 0 ? n.profit : n.loss, b = s.side === "long" ? n.long : n.short, x = s.side === "long", S = i !== null && s.id === i;
		if (l.save(), d && (l.strokeStyle = g(y, S ? 1 : .85), l.lineWidth = S ? 2.5 : 1.5, l.setLineDash([5, 4]), l.beginPath(), l.moveTo(t, m), l.lineTo(p, h), l.stroke()), f && r.entries) {
			l.strokeStyle = g(b, .7), l.lineWidth = 1, l.setLineDash([2, 3]);
			let n = Math.round(m) + .5;
			l.beginPath(), l.moveTo(t, n), l.lineTo(e.width, n), l.stroke();
		}
		if (l.setLineDash([]), r.entries) {
			S && Rt(l, t, m, b), l.fillStyle = b, l.beginPath(), l.arc(t, m, 2.5, 0, Math.PI * 2), l.fill(), It(l, t, x ? m + 5 : m - 5, x, b);
			let e = s.qty === void 0 ? "" : ` ${s.qty}`, n = Lt(l, `${s.label ?? (x ? "Long" : "Short")}${e}`, t, x ? m + 24 : m - 24, b, x);
			o.push(zt(s, "entry", t, m, x, n));
		}
		if (!f && r.exits) {
			S && Rt(l, p, h, y), l.fillStyle = y, l.beginPath(), l.arc(p, h, 2.5, 0, Math.PI * 2), l.fill(), It(l, p, x ? h - 5 : h + 5, !x, y);
			let e = null;
			if (d) {
				let e = (t + p) / 2, n = (m + h) / 2;
				Math.abs(p - t) > 46 && Lt(l, s.exitLabel ?? Bt(v), e, n - 8, g(y, .9), !0);
			} else {
				let t = s.exitLabel ?? Bt(v);
				l.font = a(11, "600");
				let n = l.measureText(t).width + 10;
				e = Lt(l, t, p + 9 + n / 2, x ? h - 3.5 : h + 3.5, g(y, .9), !x);
			}
			o.push(zt(s, "exit", p, h, !x, e));
		} else f && r.entries && Lt(l, `${x ? "Long" : "Short"} aberto ${Bt(v)}`, Math.min(e.width - 70, u + 60), h - 12, y, !1);
		l.restore();
	}
	return o;
}
function Ht(e, t) {
	let n = e.ctx;
	for (let i of t) {
		let t = Ft(e, i.time);
		if (t < -20 || t > e.width + 20) continue;
		let o = e.priceToY(i.price), s = i.color ?? r.accent, c = i.shape ?? "circle";
		if (n.save(), n.fillStyle = s, c === "arrowUp" || c === "arrowDown" ? It(n, t, o, c === "arrowUp", s, 6) : c === "square" ? n.fillRect(t - 4, o - 4, 8, 8) : (n.beginPath(), n.arc(t, o, 4, 0, Math.PI * 2), n.fill()), i.text) {
			let e = c === "arrowUp", r = c === "arrowUp" ? 22 : c === "arrowDown" ? -22 : -8;
			n.font = a(11, "600"), n.fillStyle = s, n.textAlign = "center", n.textBaseline = e ? "top" : "bottom", n.fillText(i.text, t, o + r);
		}
		n.restore();
	}
}
//#endregion
//#region src/candlestick/core/time-ranges.ts
var Ut = (e) => e > 1e11 ? Math.floor(e / 1e3) : e, Wt = {
	solid: [],
	dashed: [6, 4],
	dotted: [1, 3]
};
function Gt(e, t) {
	return e.ts.indexToX(e.data.indexAt(t)) - e.ts.barSpacing / 2;
}
function Kt(e, t, n, r, i) {
	let a = e.ctx, o = (Math.round(t * e.dpr) + (Math.round(i * e.dpr) % 2 ? .5 : 0)) / e.dpr;
	a.save(), a.strokeStyle = n, a.lineWidth = i, a.setLineDash(Wt[r] ?? []), a.beginPath(), a.moveTo(o, 0), a.lineTo(o, e.height), a.stroke(), a.restore();
}
function qt(e, t, n) {
	if (!e.data.length) return;
	let i = e.ctx, o = [];
	for (let s of t) {
		if (!n && s.allPanes === !1) continue;
		let t = s.color ?? r.accent, c = s.lineWidth ?? 1, l = Gt(e, Ut(s.from)), u = l;
		if (s.to !== void 0) {
			let t = Ut(s.to);
			if (t <= Ut(s.from)) continue;
			u = e.ts.indexToX(e.data.indexAt(t - 1e-6)) + e.ts.barSpacing / 2;
		}
		if (u < -2 || l > e.width + 2 || (s.to === void 0 ? Kt(e, l, t, s.lineStyle ?? "dashed", c) : (i.fillStyle = g(t, s.opacity ?? .12), i.fillRect(l, 0, u - l, e.height), s.border && (Kt(e, l, t, s.lineStyle ?? "solid", c), Kt(e, u, t, s.lineStyle ?? "solid", c))), !n || !s.label)) continue;
		i.font = a(11, "600");
		let d = i.measureText(s.label).width + 10, f = Math.max(2, l + 4);
		s.to !== void 0 && l < 2 && (f = Math.min(f, u - d - 4)), f = Math.min(f, e.width - d - 2);
		let p = e.height - 24;
		for (; o.some((e) => f < e.b && f + d > e.a && e.y === p);) p -= 22;
		o.push({
			a: f,
			b: f + d,
			y: p
		}), i.fillStyle = g(t, .9), i.beginPath(), i.roundRect(f, p, d, 18, 3), i.fill(), i.fillStyle = "#ffffff", i.textAlign = "left", i.textBaseline = "middle", i.fillText(s.label, f + 5, p + 9.5);
	}
}
//#endregion
//#region src/candlestick/core/timeframes.ts
function Jt(e, t, n, r, i) {
	let a = e.length, o = n.length, s = new Int32Array(a).fill(-1);
	if (!a || !o) return s;
	let c = r > t, l = n[o - 1].time + r <= e[a - 1].time ? o : o - 1, u = -1;
	for (let d = 0; d < a; d++) {
		let a = e[d].time + (c ? 0 : t);
		for (; u + 1 < l && n[u + 1].time + r <= a;) u++;
		u < 0 || u === o - 1 && !i && a >= n[u].time + 2 * r || (s[d] = u);
	}
	return s;
}
var Yt = class {
	constructor(e, t, n, r, i) {
		this.tf = e, this.feed = t, this.changed = n, this.idle = r, this.failed = i, this.noMoreBack = !1, this.live = !1, this.whole = !1, this.busy = !1, this.dead = !1, this.retryAt = 0, this.fwdCursor = 0, this.first = !0, this.emptyWindow = NaN, this.held = [], this.ctrl = new AbortController(), this.data = new ht(e.seconds), this.unsub = t.subscribeBars?.(e, (e) => this.onLive(e)) ?? null;
	}
	destroy() {
		this.dead = !0, this.ctrl.abort(), this.unsub?.(), this.unsub = null;
	}
	ensure(e, t, n, r) {
		if (this.busy || this.dead || this.whole || performance.now() < this.retryAt) return;
		let i = this.tf.seconds, a = P(Date.now() / 1e3, i) + i, o = Math.min(a, P(t, i) + i), s = P(e, i);
		(o - s) / i > r && (s = o - r * i);
		let c = this.data, l = c.length;
		if (!l || s > c.bars[l - 1].time + r * i || o < c.bars[0].time - r * i) {
			o !== this.emptyWindow && this.run("window", o, n, a);
			return;
		}
		let u = c.bars[0].time, d = c.bars[l - 1].time;
		if (s < u && !this.noMoreBack) this.run("back", u, n, a);
		else if (!this.live && o > d + i) {
			let e = Math.max(d, this.fwdCursor) + (n + 1) * i;
			this.run("forward", Math.min(a, e), n, a);
		}
	}
	async run(e, t, n, r) {
		this.busy = !0;
		try {
			let i = this.first;
			this.first = !1;
			let a = await this.feed.getBars(this.tf, {
				to: t,
				countBack: n,
				signal: this.ctrl.signal,
				firstRequest: i
			});
			if (this.dead) return;
			if (Array.isArray(a)) this.data = new ht(this.tf.seconds, a), this.noMoreBack = this.live = this.whole = !0, this.changed(0);
			else {
				let n = a?.bars ?? [];
				if (e === "window") this.data = new ht(this.tf.seconds, n), this.noMoreBack = !!a?.noMore || !n.length, this.live = t >= r, this.fwdCursor = t, this.emptyWindow = n.length ? NaN : t, this.changed(0);
				else if (e === "back") {
					let e = this.data.prepend(n);
					(a?.noMore || !e) && (this.noMoreBack = !0), e && this.changed(0);
				} else {
					let e = this.data.append(n);
					this.fwdCursor = t, t >= r && (this.live = !0), e && this.changed(e.from);
				}
			}
			this.live && this.flush();
		} catch (e) {
			!this.dead && !this.ctrl.signal.aborted && (this.retryAt = performance.now() + 3e3, this.failed(e));
		} finally {
			this.busy = !1, this.dead || this.idle();
		}
	}
	onLive(e) {
		if (this.dead) return;
		if (!this.live || this.busy) {
			this.held.push(e), this.held.length > 50 && this.held.shift();
			return;
		}
		let t = this.data.update(e);
		t >= 0 && this.changed(t);
	}
	flush() {
		if (!this.held.length) return;
		let e = Infinity;
		for (let t of this.held.splice(0)) {
			let n = this.data.update(t);
			n >= 0 && (e = Math.min(e, n));
		}
		e !== Infinity && this.changed(e);
	}
}, Xt = class {
	constructor(e, t, n, r, i, a, o, s, c, l = {
		symbol: "",
		precision: o
	}) {
		this.ctx = e, this.rect = t, this.dpr = n, this.ts = r, this.ps = i, this.data = a, this.precision = o, this.from = s, this.to = c, this.symbol = l;
	}
	get bars() {
		return this.data.bars;
	}
	get width() {
		return this.rect.w;
	}
	get height() {
		return this.rect.h;
	}
	timeToX(e) {
		return this.ts.indexToX(this.data.timeToIndex(e));
	}
	xToTime(e) {
		return this.data.indexToTime(this.ts.xToIndex(e));
	}
	priceToY(e) {
		return this.ps.priceToY(e);
	}
	yToPrice(e) {
		return this.ps.yToPrice(e);
	}
	toXY(e) {
		return {
			x: this.timeToX(e.time),
			y: this.priceToY(e.price)
		};
	}
	fmt(e) {
		return f(e, this.precision);
	}
	get tick() {
		return 10 ** -this.precision;
	}
	get tf() {
		return this.data.tf;
	}
}, F = 10, Zt = class {
	constructor(e, t = {}) {
		this.width = 0, this.height = 0, this.dpr = 1, this.symbol = {
			symbol: "",
			precision: 2
		}, this.data = new ht(60), this.ts = new vt(), this.panes = [], this.chartType = "candles", this.haBars = [], this.crosshair = {
			x: 0,
			y: 0,
			pane: null,
			visible: !1,
			index: -1
		}, this.cursorMode = "cross", this.priceAxisW = 64, this.timeAxisH = 28, this.showPriceAxis = !0, this.showTimeAxis = !0, this.crosshairEnabled = !0, this.mouseWheel = !0, this.lastPriceLine = !0, this.trades = [], this.markers = [], this.timeRanges = [], this.tradeColors = {
			long: "#2962ff",
			short: "#ff6d00",
			profit: "#089981",
			loss: "#f23645"
		}, this.tradeDisplay = {
			entries: !0,
			exits: !0,
			lines: !0
		}, this.selectedTradeId = null, this.tradeHits = [], this.percentMode = !1, this.crosshairMoved = new T(), this.dataUpdated = new T(), this.layoutChanged = new T(), this.indicatorsChanged = new T(), this.viewChanged = new T(), this.drawingDblClick = new T(), this.contextMenu = new T(), this.tradeClick = new T(), this.tradeSelected = new T(), this.tradesChanged = new T(), this.tradeDisplayChanged = new T(), this.loadingChanged = new T(), this.historyError = new T(), this.historyLoaded = new T(), this.timezoneChanged = new T(), this.history = new _t(this), this.holding = !1, this.tfFeed = null, this.tfSeries = /* @__PURE__ */ new Map(), this.indMode = /* @__PURE__ */ new WeakMap(), this.tzId = "local", this.tzCache = new c(), this.frame = 0, this.interaction = null, this.kinetic = new bt(), this.kineticRaf = 0, this.animRaf = 0, this.lastLayoutKey = "", this.lastCrosshairIndex = -2, this.pointerInside = !1, this.el = e, getComputedStyle(e).position === "static" && (e.style.position = "relative"), this.canvas = document.createElement("canvas"), this.canvas.className = "tc-chart-canvas", this.canvas.style.position = "absolute", this.canvas.style.left = "0", this.canvas.style.top = "0", e.appendChild(this.canvas), this.ctx = this.canvas.getContext("2d");
		let n = t.drawingStorage === void 0 ? ot() : t.drawingStorage;
		this.drawings = new st(() => this.requestRender(), n), this.panes.push(this.makePane(!0)), this.ts.barSpacing = 8, this.ts.rightOffset = F, t.chartType && (this.chartType = t.chartType), this.theme = i(t.theme), this.applyOptions(t), t.timezone && this.setTimezone(t.timezone), t.symbol && this.setSymbol(t.symbol), this.resizeObserver = new ResizeObserver(() => this.resize()), this.resizeObserver.observe(e), this.resize(), this.bindEvents();
	}
	applyTheme(e) {
		this.theme = i(e, this.theme), this.requestRender();
	}
	applyOptions(e) {
		e.mouseWheel !== void 0 && (this.mouseWheel = e.mouseWheel), e.priceAxis !== void 0 && (this.showPriceAxis = e.priceAxis), e.timeAxis !== void 0 && (this.showTimeAxis = e.timeAxis), e.crosshair !== void 0 && (this.crosshairEnabled = e.crosshair), e.lastPriceLine !== void 0 && (this.lastPriceLine = e.lastPriceLine), e.tradeColors && (this.tradeColors = {
			...this.tradeColors,
			...e.tradeColors
		}), e.tradeDisplay && this.setTradeDisplay(e.tradeDisplay), this.timeAxisH = this.showTimeAxis ? 28 : 0, this.showPriceAxis || (this.priceAxisW = 0), this.requestRender();
	}
	setTrades(e) {
		this.trades = e.map((e, t) => ({
			...e,
			id: e.id ?? String(t + 1)
		})), this.selectedTradeId !== null && !this.trade(this.selectedTradeId) && (this.selectedTradeId = null), this.tradesChanged.emit(), this.requestRender();
	}
	addTrade(e) {
		this.trades.push({
			...e,
			id: e.id ?? String(this.trades.length + 1)
		}), this.tradesChanged.emit(), this.requestRender();
	}
	updateTrade(e, t) {
		let n = this.trade(e);
		n && Object.assign(n, t, { id: e }), this.tradesChanged.emit(), this.requestRender();
	}
	trade(e) {
		return this.trades.find((t) => t.id === e);
	}
	setTradeDisplay(e) {
		this.tradeDisplay = {
			...this.tradeDisplay,
			...e
		}, this.tradeDisplayChanged.emit({ ...this.tradeDisplay }), this.requestRender();
	}
	selectTrade(e) {
		let t = e !== null && this.trade(e) ? e : null;
		t !== this.selectedTradeId && (this.selectedTradeId = t, this.tradeSelected.emit(t === null ? null : this.trade(t)), this.requestRender());
	}
	async goToTrade(e, t = "entry", n = {}) {
		let r = this.trade(e);
		if (!r || this.data.length === 0) return !1;
		let i = (e) => e > 1e11 ? Math.floor(e / 1e3) : e, a = r.exitPrice !== void 0 && r.exitTime !== void 0, o = this.history.gen, s = Math.ceil(this.ts.width / this.ts.barSpacing / 2) + this.warmupBars();
		if (t === "exit" && a ? await this.history.cover(i(r.exitTime), s) : (await this.history.cover(i(r.entryTime), s), t === "both" && a && await this.history.cover(i(r.exitTime))), o !== this.history.gen || !this.trade(e)) return !1;
		let c = this.data.length;
		if (c === 0) return !1;
		let l = this.data.bars[0].time;
		if (i(r.entryTime) < l && (r.exitTime === void 0 || i(r.exitTime) < l)) return !1;
		let u = (e) => e === void 0 ? c - 1 : d(this.data.indexAt(i(e)), 0, c - 1), f = u(r.entryTime), p = r.exitPrice === void 0 ? c - 1 : u(r.exitTime), m;
		if (t === "both") {
			let e = Math.abs(p - f) + 1, t = this.ts.width / this.ts.barSpacing;
			(e > t * .6 || e < t * .15) && this.ts.setBarSpacing(d(this.ts.width * .6 / Math.max(e, 12), 2, 30)), m = (f + p) / 2;
		} else m = t === "exit" ? p : f;
		let h = this.ts.width / this.ts.barSpacing / 2, g = m - (c - 1) + h - .5;
		return n.select !== !1 && this.selectTrade(e), this.mainPane.ps.auto = !0, this.animateRightOffset(g, n.animate !== !1), !0;
	}
	animateRightOffset(e, t) {
		cancelAnimationFrame(this.animRaf), this.stopKinetic();
		let n = ((e) => {
			let t = this.ts.rightOffset;
			this.ts.rightOffset = e, this.ts.constrain();
			let n = this.ts.rightOffset;
			return this.ts.rightOffset = t, n;
		})(e), r = this.ts.rightOffset;
		if (!t || Math.abs(n - r) < .01) {
			this.ts.rightOffset = n, this.viewChanged.emit(), this.requestRender();
			return;
		}
		let i = performance.now(), a = (e) => {
			let t = Math.min(1, (e - i) / 500), o = 1 - (1 - t) ** 3;
			this.ts.rightOffset = r + (n - r) * o, this.viewChanged.emit(), this.requestRender(), t < 1 && (this.animRaf = requestAnimationFrame(a));
		};
		this.animRaf = requestAnimationFrame(a);
	}
	tradeAt(e, t) {
		let n = this.tradeHitAt(e, t);
		return n ? {
			trade: n.trade,
			point: n.point
		} : null;
	}
	get timezone() {
		return this.tzId;
	}
	get timeZone() {
		let e = this.tzId === "exchange" ? this.symbol.timezone || "UTC" : this.tzId;
		if (this.tzCache.id !== e) try {
			this.tzCache = new c(e);
		} catch {
			this.tzCache = new c("UTC");
		}
		return this.tzCache;
	}
	setTimezone(e) {
		s(e), e !== this.tzId && (this.tzId = e, this.timezoneChanged.emit(e), this.requestRender());
	}
	formatTime(e, t = this.data.tf < 86400) {
		return w(e > 1e11 ? e / 1e3 : e, t ? 0 : 86400, this.timeZone);
	}
	setTimeRanges(e) {
		this.timeRanges = e.map((e) => ({
			...e,
			id: e.id ?? x("range")
		})), this.requestRender();
	}
	addTimeRange(e) {
		let t = {
			...e,
			id: e.id ?? x("range")
		};
		return this.timeRanges = [...this.timeRanges.filter((e) => e.id !== t.id), t], this.requestRender(), t.id;
	}
	removeTimeRange(e) {
		this.timeRanges = this.timeRanges.filter((t) => t.id !== e), this.requestRender();
	}
	setMarkers(e) {
		this.markers = e.map((e) => ({ ...e })), this.requestRender();
	}
	destroy() {
		this.history.reset(), this.tfSeries.forEach((e) => e.destroy()), this.tfSeries.clear(), this.resizeObserver.disconnect(), cancelAnimationFrame(this.frame), this.stopKinetic(), this.canvas.remove();
	}
	get mainPane() {
		return this.panes[0];
	}
	makePane(e) {
		let t = new yt();
		return e && (t.marginTop = .1, t.marginBottom = .08), {
			id: x("pane"),
			ps: t,
			rect: {
				x: 0,
				y: 0,
				w: 0,
				h: 0
			},
			ratio: e ? 3 : 1,
			indicators: [],
			main: e
		};
	}
	setSymbol(e) {
		this.symbol = { ...e }, this.drawings.load(e.symbol), this.requestRender();
	}
	setData(e, t, n = !0) {
		this.history.reset(), this.dropTimeframeSeries(), this.replaceData(e, t, n);
	}
	replaceData(e, t, n) {
		this.data = new ht(t, e), this.afterDataReset(n);
	}
	async setDataSource(e, t, n = {}) {
		if (!e) return this.history.reset(), !1;
		this.holding = n.time !== void 0, this.dropTimeframeSeries(), this.replaceData([], t, !1);
		let r = this.history.gen + 1;
		try {
			return await this.history.start(e, t, n) ? (n.time !== void 0 && await this.goToTime(n.time, {
				align: n.align,
				animate: !1
			}), this.history.gen === r) : !1;
		} finally {
			this.history.gen === r && (this.holding = !1, this.requestRender());
		}
	}
	resync() {
		this.history.resync();
	}
	get isHolding() {
		return this.holding;
	}
	get isLoading() {
		return this.history.loading;
	}
	ensureHistory(e) {
		return this.history.cover(e);
	}
	prependBars(e) {
		let t = this.data.prepend(e);
		return t ? (this.ts.baseIndex = this.data.length - 1, this.crosshair.visible && (this.crosshair.index += t), this.haBars = [], this.recomputeIndicators(0), this.dataUpdated.emit(), this.requestRender(), t) : 0;
	}
	appendBars(e, t = !1) {
		let n = this.data.append(e);
		return n ? (this.ts.baseIndex = this.data.length - 1, !t && n.added && (this.ts.rightOffset -= n.added), this.recomputeIndicators(n.from), this.chartType === "heikin" && St(this.data.bars, this.haBars, Math.min(n.from, this.haBars.length)), this.dataUpdated.emit(), this.viewChanged.emit(), this.requestRender(), n.added) : 0;
	}
	afterDataReset(e) {
		if (this.ts.baseIndex = this.data.length - 1, this.haBars = [], e) {
			this.ts.rightOffset = F;
			for (let e of this.panes) e.ps.auto = !0;
		}
		this.ts.constrain(), this.syncTimeframes(), this.recomputeIndicators(0), this.dataUpdated.emit(), this.viewChanged.emit(), this.requestRender();
	}
	update(e) {
		if (this.history.holdLive(e)) return;
		let t = this.data.length, n = this.data.update(e);
		if (n < 0) return;
		let r = this.data.length - t;
		this.ts.baseIndex = this.data.length - 1, r > 0 && this.ts.rightOffset < 0 && (this.ts.rightOffset -= r), this.recomputeIndicators(n), this.chartType === "heikin" && St(this.data.bars, this.haBars, n), this.dataUpdated.emit(), this.requestRender();
	}
	get bars() {
		return this.data.bars;
	}
	recomputeIndicators(e) {
		for (let t of this.indicators) this.indMode.get(t) ? this.mapIndicator(t) : t.compute(this.data.bars, e);
	}
	setTimeframeFeed(e) {
		this.tfFeed = e, this.dropTimeframeSeries();
	}
	ownTimeframe(e) {
		let t = e.timeframe();
		return t && t.seconds !== this.data.tf ? t : null;
	}
	dropTimeframeSeries() {
		this.tfSeries.forEach((e) => e.destroy()), this.tfSeries.clear(), this.syncTimeframes();
	}
	syncTimeframes() {
		let e = /* @__PURE__ */ new Map();
		for (let t of this.indicators) {
			t.chartTimeframe = this.data.tf;
			let n = this.ownTimeframe(t);
			n && e.set(n.seconds, n);
		}
		for (let [t, n] of this.tfSeries) e.has(t) || (n.destroy(), this.tfSeries.delete(t));
		if (this.tfFeed) for (let [t, n] of e) {
			if (this.tfSeries.has(t)) continue;
			let e = new Yt(n, this.tfFeed, (t) => this.onTimeframeBars(e, t), () => this.requestRender(), (e) => this.historyError.emit(e));
			this.tfSeries.set(t, e);
		}
		for (let e of this.indicators) this.computeIndicator(e, !1);
	}
	computeIndicator(e, t) {
		let n = this.ownTimeframe(e)?.seconds ?? 0, r = (this.indMode.get(e) ?? 0) !== n || !this.indMode.has(e);
		this.indMode.set(e, n), n ? ((r || t) && e.compute(this.tfSeries.get(n)?.data.bars ?? [], 0), this.mapIndicator(e)) : (e.values !== e.raw && (e.values = e.raw), e.lines !== e.rawLines && (e.lines = e.rawLines), e.points = null, (r || t) && e.compute(this.data.bars, 0));
	}
	mapIndicator(e) {
		let t = this.indMode.get(e) ?? 0, n = this.tfSeries.get(t), r = this.data.length, i = Array(r).fill(NaN), a = e.rawLines.map(() => Array(r).fill(NaN)), o = t > this.data.tf ? new Uint8Array(r) : null;
		if (n) {
			let s = Jt(this.data.bars, this.data.tf, n.data.bars, t, n.live);
			for (let t = 0; t < r; t++) if (!(s[t] < 0)) {
				i[t] = e.raw[s[t]];
				for (let n = 0; n < a.length; n++) a[n][t] = e.rawLines[n][s[t]];
				o && s[t] !== s[t - 1] && (o[t] = 1);
			}
		}
		e.values = i, e.lines = a, e.points = o;
	}
	onTimeframeBars(e, t) {
		let n = e.tf.seconds;
		if (this.tfSeries.get(n) === e) {
			for (let r of this.indicators) this.indMode.get(r) === n && (r.compute(e.data.bars, t), this.mapIndicator(r));
			this.requestRender();
		}
	}
	warmupBars() {
		let e = 0;
		for (let t of this.indicators) this.ownTimeframe(t) || (e = Math.max(e, t.warmup()));
		return e;
	}
	checkTimeframes() {
		let e = this.data.length;
		if (!this.tfSeries.size || !e || this.holding) return;
		let t = this.ts.visibleRange(), n = d(Math.floor(t.from), 0, e - 1), r = d(Math.ceil(t.to), 0, e - 1), i = this.data.bars[n].time, a = this.data.bars[r].time + this.data.tf;
		for (let [e, t] of this.tfSeries) {
			let n = 0;
			for (let t of this.indicators) this.indMode.get(t) === e && (n = Math.max(n, t.warmup()));
			t.ensure(i - (n + 1) * e, a, this.history.countBack, 2e4 + n);
		}
	}
	displayBars() {
		return this.chartType === "heikin" ? (this.haBars.length !== this.data.length && St(this.data.bars, this.haBars, Math.max(0, this.haBars.length - 1)), this.haBars) : this.data.bars;
	}
	setChartType(e) {
		this.chartType = e, this.haBars = [], this.requestRender();
	}
	get indicators() {
		return this.panes.flatMap((e) => e.indicators);
	}
	addIndicator(e) {
		if (e.onDataChanged = () => {
			this.dataUpdated.emit(), this.requestRender();
		}, e.overlay) this.mainPane.indicators.push(e);
		else {
			let t = this.makePane(!1);
			t.indicators.push(e), this.panes.push(t);
		}
		this.indMode.delete(e), this.syncTimeframes(), this.indicatorsChanged.emit(), this.requestRender();
	}
	removeIndicator(e) {
		e.onDataChanged = null;
		for (let t of this.panes) {
			let n = t.indicators.indexOf(e);
			n >= 0 && t.indicators.splice(n, 1);
		}
		this.panes = this.panes.filter((e) => e.main || e.indicators.length > 0), this.indMode.delete(e), this.syncTimeframes(), this.indicatorsChanged.emit(), this.requestRender();
	}
	updateIndicator(e) {
		this.syncTimeframes(), this.computeIndicator(e, !0), this.indicatorsChanged.emit(), this.requestRender();
	}
	paneOf(e) {
		return this.panes.find((t) => t.indicators.includes(e));
	}
	resetView() {
		this.ts.barSpacing = 8, this.ts.rightOffset = F;
		for (let e of this.panes) e.ps.auto = !0;
		this.ts.constrain(), this.viewChanged.emit(), this.requestRender();
	}
	showLastBars(e) {
		let t = Math.max(5, e);
		this.ts.setBarSpacing(this.ts.width / (t + F * .5)), this.ts.rightOffset = F * .5, this.ts.constrain(), this.mainPane.ps.auto = !0, this.viewChanged.emit(), this.requestRender();
	}
	scrollBars(e) {
		this.ts.rightOffset -= e, this.ts.constrain(), this.viewChanged.emit(), this.requestRender();
	}
	zoomStep(e) {
		this.ts.zoom(this.ts.width - this.ts.barSpacing * Math.max(this.ts.rightOffset, 0), e), this.viewChanged.emit(), this.requestRender();
	}
	scrollToRealtime() {
		if (this.history.liveGap && !this.history.follow) {
			this.history.toLatest();
			return;
		}
		cancelAnimationFrame(this.animRaf);
		let e = this.ts.rightOffset, t = F, n = performance.now(), r = (i) => {
			let a = Math.min(1, (i - n) / 450), o = 1 - (1 - a) ** 3;
			this.ts.rightOffset = e + (t - e) * o, this.viewChanged.emit(), this.requestRender(), a < 1 && (this.animRaf = requestAnimationFrame(r));
		};
		this.animRaf = requestAnimationFrame(r);
	}
	isScrolledBack() {
		return this.ts.rightOffset < -1 || this.history.liveGap && !this.history.follow;
	}
	centerTime() {
		return this.data.indexToTime(this.ts.xToIndex(this.ts.width / 2));
	}
	async goToTime(e, t = {}) {
		let n = e > 1e11 ? Math.floor(e / 1e3) : e, r = this.history.gen, i = Math.ceil(this.ts.width / this.ts.barSpacing / 2) + this.warmupBars(), a = await this.history.cover(n, i);
		if (r !== this.history.gen || !this.data.length) return !1;
		let o = this.data.length, s = d(this.data.indexAt(n), 0, o - 1), c = this.ts.width / this.ts.barSpacing, l = t.align === "start" ? s - (o - 1) + c - 3 : s - (o - 1) + c / 2 - .5;
		return this.mainPane.ps.auto = !0, this.animateRightOffset(l, t.animate !== !1), a;
	}
	setAutoScale(e) {
		this.mainPane.ps.auto = e, this.viewChanged.emit(), this.requestRender();
	}
	setLog(e) {
		this.mainPane.ps.log = e, this.mainPane.ps.auto = !0, this.viewChanged.emit(), this.requestRender();
	}
	setPercent(e) {
		this.percentMode = e, this.viewChanged.emit(), this.requestRender();
	}
	setInvert(e) {
		this.mainPane.ps.invert = e, this.viewChanged.emit(), this.requestRender();
	}
	view(e) {
		let t = this.data.length, n = this.ts.visibleRange(), r = d(n.from, 0, Math.max(0, t - 1)), i = d(n.to, 0, Math.max(0, t - 1));
		return new Xt(this.ctx, e.rect, this.dpr, this.ts, e.ps, this.data, this.symbol.precision, r, i, this.symbol);
	}
	mainView() {
		return this.view(this.mainPane);
	}
	fmt(e) {
		return f(e, this.symbol.precision);
	}
	resize() {
		let e = this.el.getBoundingClientRect();
		this.dpr = window.devicePixelRatio || 1, this.width = Math.max(1, Math.floor(e.width)), this.height = Math.max(1, Math.floor(e.height)), this.canvas.width = Math.round(this.width * this.dpr), this.canvas.height = Math.round(this.height * this.dpr), this.canvas.style.width = this.width + "px", this.canvas.style.height = this.height + "px", this.layout(), this.ts.constrain(), this.draw();
	}
	layout() {
		let e = this.width - this.priceAxisW, t = this.height - this.timeAxisH, n = this.panes.reduce((e, t) => e + t.ratio, 0), r = 0;
		this.panes.forEach((i, a) => {
			let o = a === this.panes.length - 1 ? t - r : Math.round(t * i.ratio / n);
			i.rect = {
				x: 0,
				y: r,
				w: e,
				h: o
			}, i.ps.height = o, r += o;
		}), this.ts.width = e;
		let i = this.panes.map((e) => `${e.id}:${e.rect.y}:${e.rect.h}`).join("|") + `|${e}`;
		i !== this.lastLayoutKey && (this.lastLayoutKey = i, queueMicrotask(() => this.layoutChanged.emit()));
	}
	updatePriceAxisWidth() {
		if (!this.showPriceAxis) {
			this.priceAxisW = 0;
			return;
		}
		let e = this.ctx;
		e.font = a(12);
		let t = this.mainPane.ps, n = Math.max(Math.abs(t.max), Math.abs(t.min), Math.abs(this.data.bars[this.data.length - 1]?.close ?? 0)), r = e.measureText(this.fmt(n)).width;
		this.percentMode && (r = Math.max(r, e.measureText("-100.00%").width));
		for (let t of this.panes) t.main || (r = Math.max(r, e.measureText(t.ps.max.toFixed(2)).width, e.measureText(t.ps.min.toFixed(2)).width));
		let i = Math.max(56, Math.ceil(r + 26));
		Math.abs(i - this.priceAxisW) > 2 && (this.priceAxisW = i, this.ts.width = this.width - i);
	}
	autoscale(e, t) {
		let n = this.displayBars();
		for (let r of this.panes) {
			if (!r.ps.auto) continue;
			let i = Infinity, a = -Infinity;
			if (r.main) {
				let r = this.chartType === "line" || this.chartType === "area" || this.chartType === "baseline" || this.chartType === "step";
				for (let o = e; o <= t; o++) {
					let e = n[o];
					if (!e) continue;
					let t = r ? e.close : e.low, s = r ? e.close : e.high;
					t < i && (i = t), s > a && (a = s);
				}
			}
			for (let n of r.indicators) {
				if (!n.shown || r.main && !n.affectsScale) continue;
				let o = n.range(e, t);
				o && (i = Math.min(i, o[0]), a = Math.max(a, o[1]));
			}
			i <= a && r.ps.setRange(i, a);
		}
	}
	requestRender() {
		this.frame ||= requestAnimationFrame(() => this.draw());
	}
	draw() {
		this.frame = 0;
		let e = this.ctx, t = this.dpr;
		if (Object.assign(r, this.theme), e.setTransform(t, 0, 0, t, 0, 0), e.fillStyle = r.bg, e.fillRect(0, 0, this.width, this.height), !this.data || this.data.length === 0 || this.holding) return;
		this.updatePriceAxisWidth(), this.layout();
		let n = this.data.length;
		this.ts.baseIndex = n - 1;
		let i = this.ts.visibleRange(), a = d(i.from, 0, n - 1), o = d(i.to, 0, n - 1);
		this.autoscale(a, o);
		let s = this.displayBars(), c = ut(this.ts, this.data, this.timeZone), l = this.drawings.axisMarks(this.mainView());
		for (let t of this.panes) {
			let n = t.rect, r = this.view(t), i = dt(t.ps, n.h, t.main ? this.symbol.precision : 2);
			if (e.save(), e.beginPath(), e.rect(n.x, n.y, n.w, n.h), e.clip(), e.translate(n.x, n.y), this.drawGrid(r, c, i), this.timeRanges.length && qt(r, this.timeRanges, t.main), t.main) {
				for (let e of t.indicators) e.shown && !e.affectsScale && e.draw(r);
				wt(r, this.chartType, s);
				for (let e of t.indicators) e.shown && e.affectsScale && e.draw(r);
				this.markers.length && Ht(r, this.markers), this.tradeHits = this.trades.length ? Vt(r, this.trades, this.tradeColors, this.tradeDisplay, this.selectedTradeId) : [], this.lastPriceLine && this.drawLastPriceLine(r), this.drawings.draw(r);
			} else for (let e of t.indicators) e.shown && e.draw(r);
			this.drawCrosshair(r, t), e.restore(), this.showPriceAxis && this.drawPriceAxis(t, r, i, t.main ? l : null);
		}
		e.fillStyle = r.border;
		for (let t = 1; t < this.panes.length; t++) {
			let n = this.panes[t].rect.y;
			e.fillRect(0, n, this.width, 1);
		}
		this.showTimeAxis && this.drawTimeAxis(c, l), this.history.check(), this.checkTimeframes();
	}
	drawGrid(e, t, n) {
		let i = e.ctx;
		i.strokeStyle = r.grid, i.lineWidth = 1 / this.dpr, i.beginPath();
		let a = (e) => (Math.round(e * this.dpr) + .5) / this.dpr;
		for (let n of t) {
			let t = a(n.x);
			i.moveTo(t, 0), i.lineTo(t, e.height);
		}
		for (let t of n) {
			let n = a(e.priceToY(t));
			i.moveTo(0, n), i.lineTo(e.width, n);
		}
		i.stroke();
	}
	lastBarColor() {
		let e = this.data.bars[this.data.length - 1];
		return e.close >= e.open ? r.up : r.down;
	}
	drawLastPriceLine(e) {
		let t = this.data.bars[this.data.length - 1], n = (Math.round(e.priceToY(t.close) * this.dpr) + .5) / this.dpr, r = e.ctx;
		r.save(), r.strokeStyle = this.lastBarColor(), r.lineWidth = 1 / this.dpr, r.setLineDash([1, 2]), r.beginPath(), r.moveTo(0, n), r.lineTo(e.width, n), r.stroke(), r.restore();
	}
	crosshairActive() {
		return this.crosshairEnabled && this.crosshair.visible && this.crosshair.pane !== null && this.cursorMode !== "eraser";
	}
	drawCrosshair(e, t) {
		if (!this.crosshairActive()) return;
		let n = e.ctx, i = (Math.round(this.ts.indexToX(this.crosshair.index) * this.dpr) + .5) / this.dpr;
		if (this.cursorMode === "dot") t === this.crosshair.pane && (n.fillStyle = r.textStrong, n.beginPath(), n.arc(this.ts.indexToX(this.crosshair.index), this.crosshair.y - t.rect.y, 2.5, 0, Math.PI * 2), n.fill());
		else if (this.cursorMode !== "arrow") {
			if (n.save(), n.strokeStyle = g(r.crosshair, .9), n.lineWidth = 1 / this.dpr, n.setLineDash([5, 4]), n.beginPath(), n.moveTo(i, 0), n.lineTo(i, e.height), t === this.crosshair.pane) {
				let r = (Math.round((this.crosshair.y - t.rect.y) * this.dpr) + .5) / this.dpr;
				n.moveTo(0, r), n.lineTo(e.width, r);
			}
			n.stroke(), n.restore();
		}
	}
	fmtAxis(e, t) {
		if (!e.main) {
			let e = Math.abs(t);
			return t.toFixed(e >= 1e3 ? 0 : e >= 1 || e < 1e-9 ? 2 : 4);
		}
		if (this.percentMode) {
			let e = this.percentBase(), n = (t - e) / e * 100;
			return `${n >= 0 ? "" : "−"}${Math.abs(n).toFixed(2)}%`;
		}
		return this.fmt(t);
	}
	percentBase() {
		let e = d(this.ts.visibleRange().from, 0, this.data.length - 1);
		return this.data.bars[e].close;
	}
	drawPriceAxis(e, t, n, i) {
		let o = this.ctx, s = this.width - this.priceAxisW, c = e.rect, l = this.priceAxisW;
		o.save(), o.beginPath(), o.rect(s, c.y, l, c.h), o.clip(), o.fillStyle = r.bg, o.fillRect(s, c.y, l, c.h), o.fillStyle = r.border, o.fillRect(s, c.y, 1, c.h), o.font = a(12), o.textBaseline = "middle", o.textAlign = "left", o.fillStyle = r.text;
		for (let t of n) {
			let n = c.y + e.ps.priceToY(t);
			n < c.y + 8 || n > c.y + c.h - 8 || o.fillText(this.fmtAxis(e, t), s + 10, n);
		}
		if (i?.active?.priceBand) {
			let [t, n] = i.active.priceBand, a = c.y + e.ps.priceToY(t), u = c.y + e.ps.priceToY(n);
			o.fillStyle = g(r.accent, .2), o.fillRect(s + 1, Math.min(a, u), l, Math.abs(u - a));
		}
		let u = [];
		for (let t of e.indicators) if (t.shown) for (let n of t.axisLabels()) isFinite(n.price) && u.push({
			y: c.y + e.ps.priceToY(n.price),
			bg: n.color,
			text: n.text ?? this.fmtAxis(e, n.price)
		});
		if (i) {
			for (let t of i.persistent) u.push({
				y: c.y + e.ps.priceToY(t.price),
				bg: t.color,
				text: this.fmtAxis(e, t.price)
			});
			if (i.active) for (let t of i.active.prices) u.push({
				y: c.y + e.ps.priceToY(t.price),
				bg: t.color ?? r.accent,
				text: this.fmtAxis(e, t.price)
			});
		}
		if (e.main) for (let t of this.trades) t.exitPrice === void 0 && this.tradeDisplay.entries && u.push({
			y: c.y + e.ps.priceToY(t.entryPrice),
			bg: t.side === "long" ? this.tradeColors.long : this.tradeColors.short,
			text: this.fmtAxis(e, t.entryPrice)
		});
		if (e.main && this.lastPriceLine) {
			let t = this.data.bars[this.data.length - 1], n = t.time + this.data.tf - Date.now() / 1e3;
			u.push({
				y: c.y + e.ps.priceToY(t.close),
				bg: this.lastBarColor(),
				text: this.fmtAxis(e, t.close),
				sub: this.data.tf <= 604800 ? re(n) : void 0
			});
		}
		this.layoutLabels(u, c.y, c.y + c.h);
		for (let e of u) this.drawAxisLabel(s, e.y, l, e);
		if (this.crosshairActive() && this.crosshair.pane === e) {
			let t = e.ps.yToPrice(this.crosshair.y - c.y);
			this.drawAxisLabel(s, this.crosshair.y, l, {
				y: this.crosshair.y,
				bg: r.crosshairLabel,
				text: this.fmtAxis(e, t)
			});
		}
		o.restore();
	}
	layoutLabels(e, t, n) {
		e.sort((e, t) => e.y - t.y);
		let r = (e) => e.sub ? 34 : 20;
		for (let t = 1; t < e.length; t++) {
			let n = e[t - 1], i = n.y + r(n);
			e[t].y < i && e[t].y - n.y < 40 && (e[t].y = i);
		}
		for (let i of e) i.y = d(i.y, t + 10, n - r(i) + 10);
	}
	drawAxisLabel(e, t, n, r) {
		let i = this.ctx, o = r.sub ? 34 : 20, s = Math.round(t - 10);
		i.fillStyle = r.bg, i.beginPath();
		let c = e + 1, l = n - 1;
		i.moveTo(c, s), i.lineTo(c + l - 3, s), i.arcTo(c + l, s, c + l, s + 3, 3), i.lineTo(c + l, s + o - 3), i.arcTo(c + l, s + o, c + l - 3, s + o, 3), i.lineTo(c, s + o), i.closePath(), i.fill(), i.fillStyle = r.fg ?? Qt(r.bg), i.font = a(12), i.textBaseline = "middle", i.textAlign = "left", i.fillText(r.text, e + 10, s + 10.5), r.sub && (i.globalAlpha = .85, i.fillText(r.sub, e + 10, s + 25), i.globalAlpha = 1);
	}
	drawTimeAxis(e, t) {
		let n = this.ctx, i = this.height - this.timeAxisH, o = this.ts.width;
		n.save(), n.fillStyle = r.bg, n.fillRect(0, i, this.width, this.timeAxisH), n.fillStyle = r.border, n.fillRect(0, i, this.width, 1), n.beginPath(), n.rect(0, i, o, this.timeAxisH), n.clip(), n.textBaseline = "middle", n.textAlign = "center";
		for (let t of e) n.font = a(12, t.weight >= 8 ? "600" : ""), n.fillStyle = t.weight >= 7 ? r.textStrong : r.text, n.fillText(t.label, t.x, i + this.timeAxisH / 2 + 1);
		let s = [], c = (e, t) => {
			let n = this.ts.indexToX(this.data.timeToIndex(e)), r = this.drawTimeLabel(n, i, w(e, this.data.tf, this.timeZone), t, s);
			r && s.push(r);
		};
		if (t.active?.timeBand) {
			let [e, a] = t.active.timeBand, o = this.ts.indexToX(this.data.timeToIndex(e)), s = this.ts.indexToX(this.data.timeToIndex(a));
			n.fillStyle = g(r.accent, .2), n.fillRect(Math.min(o, s), i + 1, Math.abs(s - o), this.timeAxisH);
		}
		for (let e of t.persistentTimes) c(e.time, e.color);
		if (t.active) for (let e of t.active.times) c(e, r.accent);
		if (this.crosshairActive()) {
			let e = this.data.indexToTime(this.crosshair.index);
			this.drawTimeLabel(this.ts.indexToX(this.crosshair.index), i, w(e, this.data.tf, this.timeZone), r.crosshairLabel);
		}
		n.restore();
	}
	drawTimeLabel(e, t, n, r, i = []) {
		let o = this.ctx;
		o.font = a(12);
		let s = o.measureText(n).width + 16, c = d(Math.round(e - s / 2), 0, this.ts.width - s);
		return i.some(([e, t]) => c < t && c + s > e) ? null : (o.fillStyle = r, o.beginPath(), o.roundRect(c, t + 1, s, this.timeAxisH - 4, [
			0,
			0,
			3,
			3
		]), o.fill(), o.fillStyle = Qt(r), o.textAlign = "center", o.textBaseline = "middle", o.fillText(n, c + s / 2, t + this.timeAxisH / 2 - .5), [c, c + s]);
	}
	area(e, t) {
		let n = this.width - this.priceAxisW;
		if (this.timeAxisH > 0 && t >= this.height - this.timeAxisH) return e < n ? { kind: "time" } : { kind: "none" };
		for (let r = 0; r < this.panes.length; r++) {
			let i = this.panes[r];
			if (r > 0 && Math.abs(t - i.rect.y) <= 3) return {
				kind: "sep",
				index: r
			};
			if (t >= i.rect.y && t < i.rect.y + i.rect.h) return e >= n ? {
				kind: "price",
				pane: i
			} : {
				kind: "pane",
				pane: i
			};
		}
		return { kind: "none" };
	}
	local(e) {
		let t = this.canvas.getBoundingClientRect();
		return {
			x: e.clientX - t.left,
			y: e.clientY - t.top
		};
	}
	mods(e) {
		return {
			shift: e.shiftKey,
			ctrl: e.ctrlKey || e.metaKey,
			alt: e.altKey
		};
	}
	setCrosshair(e, t, n) {
		let r = Math.round(this.ts.xToIndex(e));
		this.crosshair.x = e, this.crosshair.index = r, this.crosshair.pane = n, this.crosshair.visible = n !== null;
		let i = t, a = this.drawings;
		if (n?.main && a.magnet !== "off" && (a.tool || a.isBusy())) {
			let r = this.mainView(), o = a.snap(r, e, t - n.rect.y);
			i = n.rect.y + r.priceToY(o.price);
		}
		this.crosshair.y = i;
		let o = n && r >= 0 && r < this.data.length ? r : null;
		o !== this.lastCrosshairIndex && (this.lastCrosshairIndex = o, this.crosshairMoved.emit(o)), this.requestRender();
	}
	hideCrosshair() {
		this.crosshair.visible = !1, this.crosshair.pane = null, this.lastCrosshairIndex !== null && (this.lastCrosshairIndex = null, this.crosshairMoved.emit(null)), this.requestRender();
	}
	baseCursor() {
		if (this.drawings.tool) return "crosshair";
		switch (this.cursorMode) {
			case "arrow": return "default";
			case "dot": return "none";
			case "eraser": return "cell";
			default: return "crosshair";
		}
	}
	setCursor(e) {
		this.canvas.style.cursor !== e && (this.canvas.style.cursor = e);
	}
	bindEvents() {
		let e = this.canvas;
		e.addEventListener("pointerdown", (e) => this.onDown(e)), e.addEventListener("pointermove", (e) => this.onMove(e)), e.addEventListener("pointerup", (e) => this.onUp(e)), e.addEventListener("pointercancel", (e) => this.onUp(e)), e.addEventListener("pointerleave", () => {
			this.pointerInside = !1, !this.interaction && !this.drawings.creating && this.hideCrosshair();
		}), e.addEventListener("pointerenter", () => this.pointerInside = !0), e.addEventListener("dblclick", (e) => this.onDblClick(e)), e.addEventListener("wheel", (e) => this.onWheel(e), { passive: !1 }), e.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			let { x: t, y: n } = this.local(e), r = this.area(t, n), i = null;
			r.kind === "pane" && r.pane.main && (i = this.drawings.hitTest(this.mainView(), t, n - r.pane.rect.y)?.d ?? null, i && this.drawings.select(i)), this.contextMenu.emit({
				clientX: e.clientX,
				clientY: e.clientY,
				drawing: i,
				pane: r.kind === "pane" ? r.pane : null
			});
		});
	}
	stopKinetic() {
		this.kineticRaf && cancelAnimationFrame(this.kineticRaf), this.kineticRaf = 0, cancelAnimationFrame(this.animRaf);
	}
	onDown(e) {
		if (e.button !== 0) return;
		let { x: t, y: n } = this.local(e);
		this.stopKinetic();
		let r = this.area(t, n);
		this.canvas.setPointerCapture(e.pointerId);
		let i = this.drawings;
		if (i.creating || i.tool && r.kind === "pane" && r.pane.main) {
			let r = this.mainPane;
			i.pointerDown(this.mainView(), t, n - r.rect.y, this.mods(e)), this.interaction = { kind: "drawing" };
		} else switch (r.kind) {
			case "pane": {
				if (r.pane.main) {
					let a = this.mainView();
					if (this.cursorMode === "eraser") {
						let e = i.hitTest(a, t, n - r.pane.rect.y);
						e && i.remove(e.d);
						return;
					}
					if (i.pointerDown(a, t, n - r.pane.rect.y, this.mods(e))) {
						this.interaction = { kind: "drawing" };
						return;
					}
				}
				let a = r.pane.ps, o = r.pane.main ? this.tradeHitAt(t, n - r.pane.rect.y) : null;
				this.interaction = {
					kind: "pan",
					pane: r.pane,
					startX: t,
					startY: n,
					startRO: this.ts.rightOffset,
					startMin: a.min,
					startMax: a.max,
					moved: !1,
					trade: o
				}, this.kinetic.reset(), this.kinetic.addPosition(t, performance.now()), this.setCursor("grabbing");
				break;
			}
			case "price":
				this.interaction = {
					kind: "price",
					pane: r.pane,
					startY: n,
					startMin: r.pane.ps.min,
					startMax: r.pane.ps.max
				};
				break;
			case "time":
				this.interaction = {
					kind: "time",
					startX: t,
					startSpacing: this.ts.barSpacing
				};
				break;
			case "sep": {
				let e = this.panes[r.index - 1], t = this.panes[r.index];
				this.interaction = {
					kind: "sep",
					index: r.index,
					startY: n,
					r1: e.ratio,
					r2: t.ratio,
					h1: e.rect.h,
					h2: t.rect.h
				};
				break;
			}
		}
	}
	onMove(e) {
		let { x: t, y: n } = this.local(e), r = this.interaction, i = this.drawings, a = this.area(t, n);
		if (r?.kind === "drawing" || i.creating && !r) {
			let r = this.mainPane;
			i.pointerMove(this.mainView(), t, n - r.rect.y, this.mods(e)), this.setCrosshair(t, d(n, r.rect.y, r.rect.y + r.rect.h - 1), r), i.drag && this.setCursor(i.drag.kind === "move" ? "grabbing" : i.hoverHit?.cursor ?? "pointer");
		} else if (r) switch (r.kind) {
			case "pan": {
				let e = t - r.startX, i = n - r.startY;
				if (!r.moved && Math.hypot(e, i) < 2) break;
				r.moved = !0, this.ts.rightOffset = r.startRO - e / this.ts.barSpacing, this.ts.constrain(), Math.abs(i) > 0 && (!r.pane.ps.auto || Math.abs(i) > 25) && (r.pane.ps.auto && (r.pane.ps.auto = !1, r.startMin = r.pane.ps.min, r.startMax = r.pane.ps.max, r.startY = n), r.pane.ps.panFrom(r.startMin, r.startMax, n - r.startY)), this.kinetic.addPosition(t, performance.now()), this.viewChanged.emit(), this.setCrosshair(t, n, r.pane);
				break;
			}
			case "price": {
				let e = Math.exp((n - r.startY) * .006);
				r.pane.ps.auto = !1, r.pane.ps.scaleFrom(r.startMin, r.startMax, e), this.viewChanged.emit(), this.requestRender();
				break;
			}
			case "time": {
				let e = this.ts.width, n = d((e - r.startX + 1) / Math.max(1, e - t + 1), .05, 20);
				this.ts.setBarSpacing(r.startSpacing * n ** .9), this.ts.constrain(), this.viewChanged.emit(), this.requestRender();
				break;
			}
			case "sep": {
				let e = n - r.startY, t = d(r.h1 + e, 40, r.h1 + r.h2 - 40), i = r.h1 + r.h2 - t, a = r.r1 + r.r2;
				this.panes[r.index - 1].ratio = a * t / (t + i), this.panes[r.index].ratio = a * i / (t + i), this.requestRender();
				break;
			}
		}
		else if (a.kind === "pane") {
			if (this.setCrosshair(t, n, a.pane), a.pane.main && !i.tool) {
				let e = i.hover(this.mainView(), t, n - a.pane.rect.y);
				this.setCursor(e ?? (this.tradeHitAt(t, n - a.pane.rect.y) ? "pointer" : this.baseCursor()));
			} else i.hovered && (i.hovered = null, this.requestRender()), this.setCursor(this.baseCursor());
		} else this.hideCrosshair(), i.hovered && (i.hovered = null, this.requestRender()), this.setCursor(a.kind === "price" ? "ns-resize" : a.kind === "time" ? "ew-resize" : a.kind === "sep" ? "row-resize" : "default");
	}
	tradeHitAt(e, t) {
		for (let n = this.tradeHits.length - 1; n >= 0; n--) {
			let r = this.tradeHits[n];
			if (e >= r.x && e <= r.x + r.w && t >= r.y && t <= r.y + r.h) return r;
		}
		return null;
	}
	onUp(e) {
		let { x: t, y: n } = this.local(e), r = this.interaction;
		if (this.interaction = null, this.canvas.hasPointerCapture(e.pointerId) && this.canvas.releasePointerCapture(e.pointerId), r?.kind === "drawing") this.drawings.pointerUp(this.mainView(), t, n - this.mainPane.rect.y, this.mods(e)), this.setCursor(this.baseCursor());
		else {
			if (r?.kind === "pan" && !r.moved && r.trade) {
				let { trade: e, point: t } = r.trade;
				this.selectTrade(e.id ?? null), this.tradeClick.emit({
					trade: e,
					point: t
				});
			} else r?.kind === "pan" && !r.moved && r.pane.main && this.selectedTradeId !== null && this.selectTrade(null);
			if (r?.kind === "pan" && (this.setCursor(this.baseCursor()), r.moved && this.kinetic.start(t, performance.now()))) {
				let e = this.ts.rightOffset, n = t, r = () => {
					let t = performance.now(), i = this.kinetic.position(t);
					this.ts.rightOffset = e - (i - n) / this.ts.barSpacing, this.ts.constrain(), this.viewChanged.emit(), this.requestRender(), this.kineticRaf = this.kinetic.finished(t) ? 0 : requestAnimationFrame(r);
				};
				this.kineticRaf = requestAnimationFrame(r);
			}
			this.pointerInside || this.hideCrosshair();
		}
	}
	onDblClick(e) {
		let { x: t, y: n } = this.local(e), r = this.area(t, n);
		if (this.drawings.creating) this.drawings.doubleClick(this.mainView(), t, n - this.mainPane.rect.y);
		else if (r.kind === "price") r.pane.ps.auto = !0, this.viewChanged.emit(), this.requestRender();
		else if (r.kind === "time") this.resetView();
		else if (r.kind === "pane" && r.pane.main) {
			let e = this.drawings.doubleClick(this.mainView(), t, n - r.pane.rect.y);
			e && this.drawingDblClick.emit(e);
		}
	}
	onWheel(e) {
		if (!this.mouseWheel) return;
		e.preventDefault(), this.stopKinetic();
		let { x: t, y: n } = this.local(e), r = this.area(t, n), i = 1;
		e.deltaMode === 1 ? i = 32 : e.deltaMode === 2 && (i = 120);
		let a = i * e.deltaX / 100, o = -(i * e.deltaY) / 100;
		if (r.kind === "price") {
			let e = r.pane.ps;
			e.auto = !1, e.scaleFrom(e.min, e.max, Math.exp(-o * .08)), this.viewChanged.emit(), this.requestRender();
		} else {
			if (o !== 0 && !e.shiftKey) {
				let e = Math.sign(o) * Math.min(1, Math.abs(o));
				this.ts.zoom(t, e);
			}
			if (a !== 0 || e.shiftKey && o !== 0) {
				let e = a === 0 ? -o : a;
				this.ts.rightOffset += e * 80 / this.ts.barSpacing, this.ts.constrain();
			}
			this.viewChanged.emit(), r.kind === "pane" && this.setCrosshair(t, n, r.pane), this.requestRender();
		}
	}
	finishPath() {
		this.drawings.finishCreation();
	}
	screenshot() {
		return this.draw(), this.canvas.toDataURL("image/png");
	}
};
function Qt(e) {
	let { r: t, g: n, b: r } = _(e);
	return (.299 * t + .587 * n + .114 * r) / 255 > .62 ? "#131722" : "#ffffff";
}
//#endregion
//#region src/candlestick/core/types.ts
var I = [
	{
		id: "1",
		label: "1 minuto",
		short: "1m",
		seconds: 60
	},
	{
		id: "3",
		label: "3 minutos",
		short: "3m",
		seconds: 180
	},
	{
		id: "5",
		label: "5 minutos",
		short: "5m",
		seconds: 300
	},
	{
		id: "15",
		label: "15 minutos",
		short: "15m",
		seconds: 900
	},
	{
		id: "30",
		label: "30 minutos",
		short: "30m",
		seconds: 1800
	},
	{
		id: "60",
		label: "1 hora",
		short: "1h",
		seconds: 3600
	},
	{
		id: "120",
		label: "2 horas",
		short: "2h",
		seconds: 7200
	},
	{
		id: "240",
		label: "4 horas",
		short: "4h",
		seconds: 14400
	},
	{
		id: "1D",
		label: "1 dia",
		short: "D",
		seconds: 86400
	},
	{
		id: "1W",
		label: "1 semana",
		short: "W",
		seconds: 604800
	}
];
function $t(e) {
	return I.find((t) => t.id === e) ?? I[0];
}
var en = {
	s: {
		sec: 1,
		one: "segundo",
		many: "segundos",
		short: "s"
	},
	m: {
		sec: 60,
		one: "minuto",
		many: "minutos",
		short: "m"
	},
	h: {
		sec: 3600,
		one: "hora",
		many: "horas",
		short: "h"
	},
	d: {
		sec: 86400,
		one: "dia",
		many: "dias",
		short: "D"
	},
	w: {
		sec: 604800,
		one: "semana",
		many: "semanas",
		short: "W"
	}
};
function L(e) {
	let t = I.find((t) => t.id === e);
	if (t) return t;
	let n = /^\s*(\d*)\s*(s|m|min|h|d|w)?\s*$/i.exec(e);
	if (!n || !n[1] && !n[2]) return null;
	let r = n[1] ? parseInt(n[1], 10) : 1, i = en[(n[2] ?? "m").slice(0, 1).toLowerCase()];
	if (!r || !i) return null;
	let a = r * i.sec, o = i.sec === 1 ? `${r}S` : i.sec < 86400 ? String(a / 60) : `${r}${i.short}`;
	return I.find((e) => e.id === o) ?? {
		id: o,
		label: `${r} ${r === 1 ? i.one : i.many}`,
		short: `${r}${i.short}`,
		seconds: a
	};
}
//#endregion
//#region src/candlestick/core/sessions.ts
var tn = [
	{
		id: "NYSE",
		label: "NYSE / NASDAQ (EUA)",
		aliases: [
			"NASDAQ",
			"AMEX",
			"ARCA",
			"NYSEARCA",
			"BATS",
			"CBOE",
			"OTC",
			"US"
		],
		timezone: "America/New_York",
		overnight: "2000-0400",
		pre: "0400-0930",
		regular: "0930-1600",
		post: "1600-2000"
	},
	{
		id: "CME",
		label: "CME / CBOT / NYMEX / COMEX (futuros)",
		aliases: [
			"CBOT",
			"NYMEX",
			"COMEX",
			"CME_MINI",
			"GLOBEX"
		],
		timezone: "America/Chicago",
		overnight: "1700-0830",
		regular: "0830-1500",
		post: "1500-1600"
	},
	{
		id: "B3",
		label: "B3 (Brasil)",
		aliases: [
			"BMFBOVESPA",
			"BOVESPA",
			"BVMF"
		],
		timezone: "America/Sao_Paulo",
		pre: "0945-1000",
		regular: "1000-1755",
		post: "1755-1800"
	},
	{
		id: "EURONEXT",
		label: "Euronext (Lisboa, Paris, Amesterdão…)",
		aliases: [
			"ENXTLS",
			"ENXTPA",
			"ENXTAM",
			"ENXTBR",
			"XLIS",
			"XPAR",
			"XAMS",
			"EURONEXT_LISBON"
		],
		timezone: "Europe/Paris",
		pre: "0715-0900",
		regular: "0900-1730",
		post: "1730-1740"
	},
	{
		id: "XETRA",
		label: "Xetra / Frankfurt",
		aliases: [
			"XETR",
			"FWB",
			"FRA"
		],
		timezone: "Europe/Berlin",
		pre: "0800-0900",
		regular: "0900-1730",
		post: "1730-2200"
	},
	{
		id: "LSE",
		label: "Londres (LSE)",
		aliases: ["XLON"],
		timezone: "Europe/London",
		pre: "0750-0800",
		regular: "0800-1630",
		post: "1630-1635"
	},
	{
		id: "TSE",
		label: "Tóquio (TSE)",
		aliases: [
			"TYO",
			"JPX",
			"XTKS"
		],
		timezone: "Asia/Tokyo",
		regular: "0900-1130,1230-1530"
	},
	{
		id: "HKEX",
		label: "Hong Kong (HKEX)",
		aliases: ["HKG", "XHKG"],
		timezone: "Asia/Hong_Kong",
		pre: "0900-0930",
		regular: "0930-1200,1300-1600",
		post: "1600-1610"
	},
	{
		id: "FOREX",
		label: "Forex (dia das 17:00 de Nova Iorque)",
		aliases: [
			"FX",
			"FX_IDC",
			"OANDA",
			"FXCM",
			"SAXO"
		],
		timezone: "America/New_York",
		regular: "1700-1700"
	},
	{
		id: "CRYPTO",
		label: "Cripto (24h, UTC)",
		aliases: [
			"BINANCE",
			"COINBASE",
			"BYBIT",
			"KRAKEN",
			"BITSTAMP",
			"OKX",
			"BITFINEX",
			"KUCOIN"
		],
		timezone: "UTC",
		regular: "0000-2400"
	}
];
function nn(e) {
	let t = [];
	for (let n of String(e).split(",")) {
		let e = /^\s*(\d{2}):?(\d{2})\s*-\s*(\d{2}):?(\d{2})\s*$/.exec(n);
		if (!e) return null;
		let r = Number(e[1]) * 60 + Number(e[2]), i = Number(e[3]) * 60 + Number(e[4]);
		if (Number(e[2]) > 59 || Number(e[4]) > 59 || r > 1439 || i > 1440) return null;
		t.push([r, i]);
	}
	return t.length ? t : null;
}
function rn(e) {
	if (!e) return;
	let t = e.toUpperCase();
	return tn.find((e) => e.id === t || e.aliases?.includes(t));
}
function an(e, t) {
	let n = rn(e);
	if (n) return {
		hours: n,
		timezone: n.timezone
	};
	if (t?.sessions) return {
		hours: t.sessions,
		timezone: t.timezone || "UTC"
	};
	let r = rn(t?.exchange) ?? (t?.type === "crypto" ? rn("CRYPTO") : t?.type === "forex" ? rn("FOREX") : void 0);
	return r ? {
		hours: r,
		timezone: t?.timezone || r.timezone
	} : {
		hours: { regular: "0000-2400" },
		timezone: t?.timezone || "UTC"
	};
}
function on(e, t) {
	for (let n = 0; n < e.length; n++) for (let [r, i] of e[n].ranges) if (r < i) {
		if (t >= r && t < i) return {
			k: n,
			next: !1
		};
	} else if (t >= r) return {
		k: n,
		next: r > 0
	};
	else if (t < i) return {
		k: n,
		next: !1
	};
	return null;
}
function sn(e, t, n, r, i, a) {
	let o = [], s = null;
	for (let c = Math.max(0, t); c < e.length; c++) {
		let t = e[c].time, l, u;
		if (n >= 86400) l = Math.floor((t + 43200) / 86400), u = a ? "all" : i[0]?.part ?? "regular";
		else {
			let e = t + r.offset(t), n = Math.floor(e / 86400), o = on(i, Math.floor((e - n * 86400) / 60));
			if (!o) {
				s = null;
				continue;
			}
			l = n + +!!o.next, u = a ? "all" : i[o.k].part;
		}
		s && s.day === l && s.part === u && s.to === c - 1 ? s.to = c : (s = {
			from: c,
			to: c,
			day: l,
			part: u
		}, o.push(s));
	}
	return o;
}
//#endregion
//#region src/candlestick/indicators/indicators.ts
var cn = [
	{
		key: "seconds",
		label: "Segundos",
		max: 59
	},
	{
		key: "minutes",
		label: "Minutos",
		max: 59
	},
	{
		key: "hours",
		label: "Horas",
		max: 24
	},
	{
		key: "days",
		label: "Dias",
		max: 366
	},
	{
		key: "weeks",
		label: "Semanas",
		max: 52
	},
	{
		key: "months",
		label: "Meses",
		max: 12
	}
];
function ln(e) {
	return e < 60 ? {
		unit: "seconds",
		n: e
	} : e < 3600 ? {
		unit: "minutes",
		n: Math.round(e / 60)
	} : e < 86400 ? {
		unit: "hours",
		n: Math.round(e / 3600)
	} : e >= 2419200 ? {
		unit: "months",
		n: Math.max(1, Math.round(e / 2592e3))
	} : e % 604800 == 0 ? {
		unit: "weeks",
		n: e / 604800
	} : {
		unit: "days",
		n: Math.round(e / 86400)
	};
}
var R = (e, t) => Number(e[t]), z = (e, t) => String(e[t]);
function un(e, t) {
	switch (t) {
		case "open": return e.open;
		case "high": return e.high;
		case "low": return e.low;
		case "volume": return e.volume;
		default: return e.close;
	}
}
function B(e, t, n) {
	for (e.length > t && (e.length = t); e.length < t;) e.push(NaN);
	for (let r = Math.max(0, n); r < t; r++) e[r] = NaN;
}
function dn(e, t, n, r, i) {
	if (B(e, n, i), i <= r) {
		let i = 0;
		for (let a = 0; a < n; a++) i += t(a), a >= r && (i -= t(a - r)), e[a] = a >= r - 1 ? i / r : NaN;
	} else for (let a = i; a < n; a++) {
		let n = 0;
		for (let e = a - r + 1; e <= a; e++) n += t(e);
		e[a] = n / r;
	}
}
function fn(e, t, n, r, i, a, o) {
	B(e, i, o), B(t, i, o), B(n, i, o);
	let s = (e, t) => t === 0 ? e === 0 ? 50 : 100 : e === 0 ? 0 : 100 - 100 / (1 + e / t), c = Math.max(0, o);
	if (c <= a || !isFinite(t[c - 1])) {
		for (let r = 0; r < Math.min(i, a); r++) e[r] = t[r] = n[r] = NaN;
		if (i <= a) return;
		let o = 0, l = 0;
		for (let e = 1; e <= a; e++) {
			let t = r(e) - r(e - 1);
			t > 0 ? o += t : l -= t;
		}
		t[a] = o / a, n[a] = l / a, e[a] = s(t[a], n[a]), c = a + 1;
	}
	for (; c < i; c++) {
		let i = r(c) - r(c - 1);
		t[c] = (t[c - 1] * (a - 1) + Math.max(i, 0)) / a, n[c] = (n[c - 1] * (a - 1) + Math.max(-i, 0)) / a, e[c] = s(t[c], n[c]);
	}
}
function pn(e, t, n, r, i, a, o) {
	B(e, r, o);
	let s = Math.max(0, o);
	if (a === "ema" || a === "rma") {
		s > 0 && !isFinite(e[s - 1]) && isFinite(t(s - 1)) && (s = 0);
		let o = a === "ema" ? 2 / (i + 1) : 1 / i;
		for (let c = s; c < r; c++) {
			let r = t(c), s = c > 0 ? e[c - 1] : NaN;
			isFinite(r) ? isFinite(s) ? e[c] = o * r + (1 - o) * s : e[c] = a === "ema" ? r : mn(t, n, c, i, "sma") : e[c] = NaN;
		}
	} else for (let o = s; o < r; o++) e[o] = mn(t, n, o, i, a);
}
function mn(e, t, n, r, i) {
	if (n - r + 1 < 0) return NaN;
	let a = 0, o = 0;
	for (let s = 0; s < r; s++) {
		let c = e(n - s);
		if (!isFinite(c)) return NaN;
		let l = i === "wma" ? r - s : i === "vwma" ? t(n - s) : 1;
		a += c * l, o += l;
	}
	return o ? a / o : NaN;
}
function hn(e, t, n, r = 1, i = null, a = 0) {
	let o = e.ctx, s = Math.max(0, e.from - 1), c = Math.min(t.length - 1, e.to + 1 + Math.max(0, a));
	if (i) {
		for (; s > 0 && !i[s];) s--;
		for (; c < t.length - 1 && !i[c];) c++;
	}
	o.save(), o.strokeStyle = n, o.lineWidth = r, o.lineJoin = "round", o.beginPath();
	let l = !1;
	for (let n = s; n <= c; n++) {
		let r = t[n];
		if (!isFinite(r)) {
			l = !1;
			continue;
		}
		if (i && !i[n]) continue;
		let a = e.ts.indexToX(n), s = e.ps.priceToY(r);
		l ? o.lineTo(a, s) : o.moveTo(a, s), l = !0;
	}
	o.stroke(), o.restore();
}
function gn(e, t, n) {
	let r = Infinity, i = -Infinity;
	for (let a = Math.max(0, t); a <= Math.min(e.length - 1, n); a++) {
		let t = e[a];
		isFinite(t) && (t < r && (r = t), t > i && (i = t));
	}
	return r <= i ? [r, i] : null;
}
var _n = class {
	get shown() {
		return this.visible && vn(this.visibility, this.chartTimeframe);
	}
	constructor(e, t) {
		this.id = x("ind"), this.visible = !0, this.affectsScale = !0, this.onDataChanged = null, this.raw = [], this.values = this.raw, this.rawLines = [], this.lines = this.rawLines, this.chartTimeframe = 0, this.points = null, this.origin = null, this.visibility = null, this.params = {
			...e,
			...t ?? {}
		};
	}
	warmup() {
		return 0;
	}
	timeframe() {
		let e = String(this.params.timeframe ?? "");
		return e ? L(e) : null;
	}
	timeframeSuffix() {
		let e = this.timeframe();
		return e && e.seconds !== this.chartTimeframe ? ` · ${e.short}` : "";
	}
	range(e, t) {
		return null;
	}
	axisLabels() {
		return [];
	}
	title() {
		let e = this.schema.filter((e) => (e.type === "number" || e.type === "select") && !e.section && e.key !== "width" && e.key !== "timeframe").map((e) => this.params[e.key]);
		return (e.length ? `${this.short} ${e.join(" ")}` : this.short) + this.timeframeSuffix();
	}
	formatValue(e, t) {
		return isFinite(e) ? t.fmt(e) : "∅";
	}
	toJSON() {
		return {
			type: this.type,
			params: this.params,
			visible: this.visible,
			...this.visibility ? { visibility: this.visibility } : {}
		};
	}
};
function vn(e, t) {
	if (!e || !(t > 0)) return !0;
	let { unit: n, n: r } = ln(t), i = e[n];
	return !i || i.on && r >= i.min && r <= i.max;
}
var yn = [
	"open",
	"high",
	"low",
	"close",
	"volume"
], bn = {
	key: "source",
	label: "Fonte",
	type: "select",
	options: yn,
	optionLabels: {
		open: "Abertura",
		high: "Máxima",
		low: "Mínima",
		close: "Fechamento",
		volume: "Volume"
	}
}, xn = {
	key: "timeframe",
	label: "Tempo gráfico",
	type: "select",
	options: ["", ...I.map((e) => e.id)],
	optionLabels: {
		"": "O do gráfico",
		...Object.fromEntries(I.map((e) => [e.id, e.label]))
	}
}, V = "Estilo";
function Sn(e) {
	let t = e.timeframe ? L(String(e.timeframe)) : null;
	return {
		...e,
		source: yn.includes(String(e.source)) ? e.source : "close",
		timeframe: t ? t.id : ""
	};
}
function Cn(e, t, n) {
	if (!n) return {
		values: e,
		points: t
	};
	let r = e.length, i = Math.max(r, r + n), a = Array(i).fill(NaN), o = t ? new Uint8Array(i) : null;
	for (let s = 0; s < r; s++) {
		let r = s + n;
		r < 0 || r >= i || (a[r] = e[s], o && (o[r] = t[s]));
	}
	return {
		values: a,
		points: o
	};
}
var wn = class extends _n {
	constructor(e, t) {
		super(Sn({
			length: e === "ema" ? 9 : 50,
			source: "close",
			offset: 0,
			timeframe: "",
			color: "#2962ff",
			width: 1,
			...t ?? {}
		})), this.type = e, this.overlay = !0, this.schema = [
			{
				key: "length",
				label: "Período",
				type: "number",
				min: 1,
				max: 1e3
			},
			bn,
			{
				key: "offset",
				label: "Deslocamento",
				type: "number",
				min: -500,
				max: 500
			},
			xn,
			{
				key: "color",
				label: "Cor",
				type: "color",
				section: V
			},
			{
				key: "width",
				label: "Espessura",
				type: "number",
				min: 1,
				max: 4,
				section: V
			}
		];
	}
	get name() {
		return this.type === "ema" ? "Moving Average Exponential" : "Moving Average";
	}
	get short() {
		return this.type === "ema" ? "EMA" : "MA";
	}
	get length() {
		return Math.max(1, Math.round(R(this.params, "length")));
	}
	get offset() {
		return Math.round(R(this.params, "offset")) || 0;
	}
	title() {
		return `${this.short} ${this.length} ${this.params.source}${this.offset ? ` ${this.offset}` : ""}${this.timeframeSuffix()}`;
	}
	warmup() {
		return this.type === "ema" ? 10 * this.length : this.length - 1;
	}
	compute(e, t) {
		let n = z(this.params, "source"), r = (t) => un(e[t], n);
		this.type === "ema" ? pn(this.raw, r, (t) => e[t].volume, e.length, this.length, "ema", t) : dn(this.raw, r, e.length, this.length, t);
	}
	plotted() {
		return Cn(this.values, this.points, this.offset);
	}
	draw(e) {
		let t = this.plotted();
		hn(e, t.values, z(this.params, "color"), R(this.params, "width"), t.points, this.offset);
	}
	range(e, t) {
		return gn(this.plotted().values, e, t);
	}
	legend(e, t) {
		let n = e - this.offset;
		return [{
			text: this.formatValue(n >= 0 && n < this.values.length ? this.values[n] : NaN, t),
			color: z(this.params, "color")
		}];
	}
	axisLabels() {
		let e = this.values[this.values.length - 1];
		return isFinite(e) ? [{
			price: e,
			color: z(this.params, "color")
		}] : [];
	}
}, Tn = [
	"none",
	"sma",
	"ema"
], En = {
	none: "Nenhuma",
	sma: "Média móvel simples (SMA)",
	ema: "Média móvel exponencial (EMA)"
}, Dn = {
	sma: "SMA",
	ema: "EMA"
}, On = "Média do RSI", kn = class extends _n {
	constructor(e) {
		let t = Sn({
			length: 14,
			source: "close",
			timeframe: "",
			maType: "none",
			maLength: 14,
			showRsi: !0,
			color: "#7e57c2",
			width: 1,
			maColor: "#fdd835",
			showUpper: !0,
			upper: 70,
			upperColor: "#787b86",
			showMiddle: !0,
			middle: 50,
			middleColor: "rgba(120,123,134,0.5)",
			showLower: !0,
			lower: 30,
			lowerColor: "#787b86",
			showBg: !0,
			bgColor: "rgba(126,87,194,0.1)",
			...e ?? {}
		}), { bbMult: n, ...r } = t, i = String(t.maType);
		super({
			...r,
			maType: Tn.includes(i) ? i : [
				"sma_bb",
				"rma",
				"wma",
				"vwma"
			].includes(i) ? "sma" : "none"
		}), this.type = "rsi", this.name = "Relative Strength Index", this.short = "RSI", this.overlay = !1, this.schema = [
			{
				key: "length",
				label: "Período IFR",
				type: "number",
				min: 1,
				max: 500
			},
			bn,
			xn,
			{
				key: "maType",
				label: "Tipo",
				type: "select",
				options: Tn,
				optionLabels: En,
				section: On
			},
			{
				key: "maLength",
				label: "Período",
				type: "number",
				min: 1,
				max: 500,
				section: On,
				enabled: (e) => e.maType !== "none"
			},
			{
				key: "color",
				label: "RSI",
				type: "color",
				toggle: "showRsi",
				section: V
			},
			{
				key: "width",
				label: "Espessura do RSI",
				type: "number",
				min: 1,
				max: 4,
				section: V
			},
			{
				key: "maColor",
				label: "Média do RSI",
				type: "color",
				section: V,
				enabled: (e) => e.maType !== "none"
			},
			{
				key: "upperColor",
				label: "Banda superior",
				type: "color",
				toggle: "showUpper",
				numberKey: "upper",
				min: 0,
				max: 100,
				section: V
			},
			{
				key: "middleColor",
				label: "Banda do meio",
				type: "color",
				toggle: "showMiddle",
				numberKey: "middle",
				min: 0,
				max: 100,
				section: V
			},
			{
				key: "lowerColor",
				label: "Banda inferior",
				type: "color",
				toggle: "showLower",
				numberKey: "lower",
				min: 0,
				max: 100,
				section: V
			},
			{
				key: "bgColor",
				label: "Fundo entre as bandas",
				type: "color",
				toggle: "showBg",
				section: V
			}
		], this.gain = [], this.loss = [], this.ma = [], this.rawLines.push(this.ma);
	}
	get length() {
		return Math.max(1, Math.round(R(this.params, "length")));
	}
	get maLength() {
		return Math.max(1, Math.round(R(this.params, "maLength")));
	}
	get maType() {
		return z(this.params, "maType");
	}
	title() {
		let e = this.maType, t = e === "none" ? "" : ` ${Dn[e]} ${this.maLength}`;
		return `${this.short} ${this.length} ${this.params.source}${t}${this.timeframeSuffix()}`;
	}
	warmup() {
		let e = this.maType;
		return 10 * this.length + (e === "none" ? 0 : e === "ema" ? 10 * this.maLength : this.maLength);
	}
	compute(e, t) {
		let n = z(this.params, "source"), r = e.length;
		fn(this.raw, this.gain, this.loss, (t) => un(e[t], n), r, this.length, t);
		let i = this.maType;
		if (i === "none") for (let e of this.rawLines) B(e, r, 0);
		else pn(this.ma, (e) => this.raw[e], (t) => e[t].volume, r, this.maLength, i, t);
	}
	draw(e) {
		let t = e.ctx, n = this.params, r = e.ps.priceToY(R(n, "upper")), i = e.ps.priceToY(R(n, "lower"));
		t.save(), n.showBg && (t.fillStyle = z(n, "bgColor"), t.fillRect(0, Math.min(r, i), e.width, Math.abs(i - r))), t.lineWidth = 1, t.setLineDash([4, 4]);
		for (let [r, i, a] of [
			[
				"showUpper",
				"upper",
				"upperColor"
			],
			[
				"showMiddle",
				"middle",
				"middleColor"
			],
			[
				"showLower",
				"lower",
				"lowerColor"
			]
		]) {
			if (!n[r]) continue;
			let o = Math.round(e.ps.priceToY(R(n, i))) + .5;
			t.strokeStyle = z(n, a), t.beginPath(), t.moveTo(0, o), t.lineTo(e.width, o), t.stroke();
		}
		t.restore();
		let [a] = this.lines;
		n.showRsi && hn(e, this.values, z(n, "color"), R(n, "width"), this.points), this.maType !== "none" && hn(e, a, z(this.params, "maColor"), 1, this.points);
	}
	range(e, t) {
		let n = Math.min(R(this.params, "lower"), R(this.params, "upper")), r = Math.max(R(this.params, "lower"), R(this.params, "upper")), i = this.params.showRsi ? [this.values] : [], a = this.maType === "none" ? i : [...i, this.lines[0]];
		for (let i of a) {
			let a = gn(i, e, t);
			a && (n = Math.min(n, a[0]), r = Math.max(r, a[1]));
		}
		return [n, r];
	}
	formatValue(e) {
		return isFinite(e) ? (Math.trunc(e * 100 + 1e-7) / 100).toFixed(2) : "∅";
	}
	legend(e) {
		let t = [];
		return this.params.showRsi && t.push({
			text: this.formatValue(this.values[e]),
			color: z(this.params, "color")
		}), this.maType !== "none" && t.push({
			text: this.formatValue(this.lines[0][e]),
			color: z(this.params, "maColor")
		}), t;
	}
	axisLabels() {
		let e = [], t = this.values[this.values.length - 1];
		this.params.showRsi && isFinite(t) && e.push({
			price: t,
			color: z(this.params, "color"),
			text: this.formatValue(t)
		});
		let n = this.maType === "none" ? NaN : this.lines[0][this.lines[0].length - 1];
		return isFinite(n) && e.push({
			price: n,
			color: z(this.params, "maColor"),
			text: this.formatValue(n)
		}), e;
	}
}, An = [
	"each",
	"all",
	"pre",
	"regular",
	"post",
	"overnight",
	"custom"
], jn = {
	each: "Cada (pré-mercado, mercado, pós-mercado, noturno)",
	all: "Todos",
	pre: "Somente o pré-mercado",
	regular: "Somente o mercado",
	post: "Somente o pós-mercado",
	overnight: "Apenas noturno",
	custom: "Personalizado"
}, Mn = {
	each: "Cada",
	all: "Todos",
	pre: "Pré",
	regular: "Mercado",
	post: "Pós",
	overnight: "Noturno",
	custom: "Pers."
}, Nn = [
	"solid",
	"dashed",
	"dotted"
];
function Pn(e, t) {
	return e === "dashed" ? [Math.max(4, t * 3), Math.max(3, t * 2)] : e === "dotted" ? [Math.max(1, t), Math.max(2, t * 1.6)] : [];
}
var Fn = [
	{
		show: "showVah",
		color: "vahColor",
		dash: "vahStyle",
		extend: "extendVah",
		name: "VAH"
	},
	{
		show: "showVal",
		color: "valColor",
		dash: "valStyle",
		extend: "extendVal",
		name: "VAL"
	},
	{
		show: "showPoc",
		color: "pocColor",
		dash: "pocStyle",
		extend: "extendPoc",
		name: "POC"
	}
], In = {
	updown: "Alta/Baixa",
	total: "Total",
	delta: "Delta"
};
function Ln(e) {
	let t = Math.min(500, Math.max(6, e / 3));
	return Math.round(2 ** (Math.round(Math.log2(t) * 4) / 4));
}
var Rn = class extends _n {
	constructor(e) {
		let t = {
			session: "each",
			customSession: "0930-1600",
			exchange: "",
			rowsLayout: "auto",
			rowSize: 24,
			volume: "updown",
			vaPct: 70,
			extendPoc: !0,
			extendVah: !1,
			extendVal: !1,
			showProfile: !0,
			showValues: !1,
			valuesColor: "#b2b5be",
			widthPct: 30,
			placement: "left",
			upColor: "rgba(41,98,255,0.25)",
			downColor: "rgba(251,192,45,0.25)",
			vaUpColor: "rgba(41,98,255,0.6)",
			vaDownColor: "rgba(251,192,45,0.6)",
			showVah: !1,
			vahColor: "#787b86",
			vahStyle: "solid",
			showVal: !1,
			valColor: "#787b86",
			valStyle: "solid",
			showPoc: !0,
			pocColor: "#ff9800",
			pocStyle: "dotted",
			showDevPoc: !1,
			devPocColor: "#787b86",
			devPocStyle: "solid",
			showDevVa: !1,
			devVaColor: "#00838f",
			devVaStyle: "solid",
			boxColor: "rgba(120,134,170,0.08)",
			labelsOnScale: !0,
			legendValues: !0,
			inputsInTitle: !0,
			...e ?? {}
		}, n = (e, n) => {
			n.includes(String(t[e])) || (t[e] = n[0]);
		};
		n("session", An), n("exchange", ["", ...tn.map((e) => e.id)]), n("rowsLayout", [
			"auto",
			"rows",
			"ticks"
		]), n("volume", [
			"updown",
			"total",
			"delta"
		]), n("placement", ["left", "right"]);
		for (let e of [
			"vahStyle",
			"valStyle",
			"pocStyle",
			"devPocStyle",
			"devVaStyle"
		]) n(e, Nn);
		super(t), this.type = "svp", this.name = "Session Volume Profile HD", this.short = "SVP HD", this.overlay = !0, this.affectsScale = !1, this.schema = [
			{
				key: "session",
				label: "Sessão",
				type: "select",
				options: An,
				optionLabels: jn
			},
			{
				key: "customSession",
				label: "Sessão customizada",
				type: "session",
				enabled: (e) => e.session === "custom",
				check: (e) => nn(e) ? null : `horário inválido "${e}", ex.: 0930-1600 ou 0900-1130,1230-1530`
			},
			{
				key: "exchange",
				label: "Bolsa",
				type: "select",
				options: ["", ...tn.map((e) => e.id)],
				optionLabels: {
					"": "A do símbolo",
					...Object.fromEntries(tn.map((e) => [e.id, e.label]))
				}
			},
			{
				key: "rowsLayout",
				label: "Layout das linhas",
				type: "select",
				options: [
					"auto",
					"rows",
					"ticks"
				],
				optionLabels: {
					auto: "Automático (HD)",
					rows: "Número de linhas",
					ticks: "Ticks por linha"
				}
			},
			{
				key: "rowSize",
				label: "Tamanho da linha",
				type: "number",
				min: 1,
				max: 2e3,
				indent: !0,
				enabled: (e) => e.rowsLayout !== "auto"
			},
			{
				key: "volume",
				label: "Volume",
				type: "select",
				options: [
					"updown",
					"total",
					"delta"
				],
				optionLabels: In
			},
			{
				key: "vaPct",
				label: "Volume da Área do Valor",
				type: "number",
				min: 1,
				max: 100
			},
			{
				key: "extendPoc",
				label: "Estender POC à direita",
				type: "bool"
			},
			{
				key: "extendVah",
				label: "Estender VAH à direita",
				type: "bool"
			},
			{
				key: "extendVal",
				label: "Estender VAL à direita",
				type: "bool"
			},
			{
				key: "showProfile",
				label: "Perfil de Volume",
				type: "bool",
				section: V
			},
			{
				key: "valuesColor",
				label: "Valores",
				type: "color",
				toggle: "showValues",
				indent: !0,
				section: V
			},
			{
				key: "widthPct",
				label: "Largura (% da caixa)",
				type: "number",
				min: 1,
				max: 100,
				indent: !0,
				section: V
			},
			{
				key: "placement",
				label: "Posição",
				type: "select",
				options: ["left", "right"],
				optionLabels: {
					left: "Esquerda",
					right: "Direita"
				},
				indent: !0,
				section: V
			},
			{
				key: "upColor",
				label: "Volume de alta",
				type: "color",
				indent: !0,
				section: V
			},
			{
				key: "downColor",
				label: "Volume de baixa",
				type: "color",
				indent: !0,
				section: V
			},
			{
				key: "vaUpColor",
				label: "Área de Valor de Alta",
				type: "color",
				indent: !0,
				section: V
			},
			{
				key: "vaDownColor",
				label: "Área de Valor de Baixa",
				type: "color",
				indent: !0,
				section: V
			},
			{
				key: "vahColor",
				label: "VAH",
				type: "color",
				toggle: "showVah",
				dashKey: "vahStyle",
				section: V
			},
			{
				key: "valColor",
				label: "VAL",
				type: "color",
				toggle: "showVal",
				dashKey: "valStyle",
				section: V
			},
			{
				key: "pocColor",
				label: "POC",
				type: "color",
				toggle: "showPoc",
				dashKey: "pocStyle",
				section: V
			},
			{
				key: "devPocColor",
				label: "Desenvolvendo o POC",
				type: "color",
				toggle: "showDevPoc",
				dashKey: "devPocStyle",
				section: V
			},
			{
				key: "devVaColor",
				label: "VA em desenvolvimento",
				type: "color",
				toggle: "showDevVa",
				dashKey: "devVaStyle",
				section: V
			},
			{
				key: "boxColor",
				label: "Caixa do Histograma",
				type: "color",
				section: V
			},
			{
				key: "labelsOnScale",
				label: "Legendas na escala de preço",
				type: "bool",
				section: V
			},
			{
				key: "legendValues",
				label: "Valores na linha de status",
				type: "bool",
				section: V
			},
			{
				key: "inputsInTitle",
				label: "Inputs na barra de status",
				type: "bool",
				section: "Valores de entrada",
				tab: "style"
			}
		], this.bars = [], this.spans = null, this.spanKey = "", this.zone = new c("UTC"), this.dirtyFrom = Infinity, this.cache = /* @__PURE__ */ new Map(), this.cacheTick = NaN, this.lastView = null;
	}
	title() {
		let e = this.params;
		if (!e.inputsInTitle) return this.short;
		let t = e.rowsLayout === "auto" ? "" : ` ${R(e, "rowSize")}`;
		return `${this.short} ${Mn[z(e, "session")]}${t} ${In[z(e, "volume")]} ${R(e, "vaPct")}`;
	}
	warmup() {
		let e = this.chartTimeframe;
		return e > 0 && e < 86400 ? Math.min(2e3, Math.ceil(86400 / e)) : 0;
	}
	compute(e, t) {
		this.bars = e, t <= 0 ? (this.spans = null, this.cache.clear(), this.dirtyFrom = Infinity) : this.dirtyFrom = Math.min(this.dirtyFrom, t);
	}
	filter(e) {
		let t = this.params, { hours: n, timezone: r } = an(z(t, "exchange"), e.symbol), i = z(t, "session");
		if (i === "custom") return {
			tz: r,
			filter: [{
				part: "custom",
				ranges: nn(z(t, "customSession")) ?? []
			}],
			merge: !1
		};
		let a = [];
		for (let e of [
			"regular",
			"pre",
			"post",
			"overnight"
		]) {
			if (i !== "each" && i !== "all" && i !== e) continue;
			let t = n[e] ? nn(n[e]) : null;
			t && a.push({
				part: e,
				ranges: t
			});
		}
		return {
			tz: r,
			filter: a,
			merge: i === "all"
		};
	}
	sessions(e) {
		let { tz: t, filter: n, merge: r } = this.filter(e), i = `${t}|${e.tf}|${r}|${JSON.stringify(n)}`;
		if (!this.spans || i !== this.spanKey) {
			this.spanKey = i;
			try {
				this.zone = new c(t);
			} catch {
				this.zone = new c("UTC");
			}
			this.spans = sn(this.bars, 0, e.tf, this.zone, n, r), this.cache.clear(), this.dirtyFrom = Infinity;
		} else if (this.dirtyFrom < Infinity) {
			let t = this.spans, i = t.length;
			for (; i > 0 && t[i - 1].to >= this.dirtyFrom - 1;) i--;
			let a = Math.min(i < t.length ? t[i].from : this.dirtyFrom, this.dirtyFrom);
			for (let e of t.splice(i)) this.cache.delete(this.bars[e.from]?.time);
			t.push(...sn(this.bars, a, e.tf, this.zone, n, r)), this.dirtyFrom = Infinity;
		}
		return this.spans;
	}
	profile(e, t, n = !1) {
		let r = this.params;
		t.tick !== this.cacheTick && (this.cacheTick = t.tick, this.cache.clear());
		let i = this.bars[e.from].time, a = this.cache.get(i);
		if (a && a.to === e.to && n) return a;
		let o = z(r, "rowsLayout"), s = Math.max(1, Math.round(R(r, "rowSize")));
		if (o === "auto") {
			let n = Infinity, r = -Infinity;
			for (let t = e.from; t <= e.to; t++) n = Math.min(n, this.bars[t].low), r = Math.max(r, this.bars[t].high);
			s = Ln(Math.abs(t.ps.priceToY(n) - t.ps.priceToY(r)));
		}
		if (!a || a.to !== e.to || a.rows !== s) {
			let n = ve(this.bars, e.from, e.to, s, R(r, "vaPct") / 100, o === "ticks" ? s * t.tick : 0);
			if (!n) return null;
			a = {
				to: e.to,
				rows: s,
				vp: n,
				hits: {},
				checked: {}
			}, this.cache.set(i, a);
		}
		return !a.dev && (r.showDevPoc || r.showDevVa) && (a.dev = ye(this.bars, e.from, e.to, a.vp, R(r, "vaPct") / 100)), a;
	}
	spanAt(e, t) {
		let n = 0, r = e.length - 1;
		for (; n <= r;) {
			let i = n + r >> 1;
			if (e[i].to < t) n = i + 1;
			else if (e[i].from > t) r = i - 1;
			else return e[i];
		}
		return null;
	}
	levels(e) {
		let t = e.rows[e.poc];
		return {
			POC: (t.lo + t.hi) / 2,
			VAH: e.rows[e.vaHigh].hi,
			VAL: e.rows[e.vaLow].lo
		};
	}
	reachedAt(e, t, n, r) {
		let i = e.hits[n];
		if (i !== void 0 && i >= 0) return i;
		let a = this.bars;
		for (let i = Math.max(t.to + 1, (e.checked[n] ?? t.to) + 1); i < a.length; i++) if (a[i].low <= r && a[i].high >= r) return e.hits[n] = i;
		return e.checked[n] = a.length - 2, e.hits[n] = -1;
	}
	drawLevels(e, t, n, r, i, a) {
		let o = this.params, s = e.ctx, c = this.levels(n.vp);
		s.lineWidth = 1;
		for (let l of Fn) {
			if (!o[l.show]) continue;
			let u = i;
			if (o[l.extend]) {
				let r = this.reachedAt(n, t, l.name, c[l.name]);
				u = r >= 0 ? e.ts.indexToX(r) : e.width;
			} else if (!a) continue;
			if (u < 0) continue;
			let d = Math.round(e.ps.priceToY(c[l.name])) + .5;
			s.strokeStyle = z(o, l.color), s.setLineDash(Pn(z(o, l.dash), 1)), s.beginPath(), s.moveTo(r, d), s.lineTo(Math.max(i, u), d), s.stroke();
		}
		s.setLineDash([]);
	}
	draw(e) {
		if (this.lastView = e, !this.bars.length) return;
		let t = this.params, n = this.sessions(e), r = e.ctx, i = e.ts.barSpacing, a = Fn.some((e) => t[e.show] && t[e.extend]);
		r.save();
		for (let o of n) {
			if (o.from > e.to + 1) break;
			if (o.to < e.from - 1) {
				if (!a) continue;
				let t = this.profile(o, e, !0);
				t && this.drawLevels(e, o, t, e.ts.indexToX(o.from) - i / 2, e.ts.indexToX(o.to) + i / 2, !1);
				continue;
			}
			let n = this.profile(o, e);
			if (!n) continue;
			let s = n.vp, c = e.ts.indexToX(o.from) - i / 2, l = e.ts.indexToX(o.to) + i / 2;
			if (_(z(t, "boxColor")).a > 0) {
				let n = e.ps.priceToY(s.rows[s.rows.length - 1].hi), i = e.ps.priceToY(s.rows[0].lo);
				r.fillStyle = z(t, "boxColor"), r.fillRect(c, Math.min(n, i), l - c, Math.abs(i - n));
			}
			t.showProfile && this.drawHistogram(e, s, c, l), r.lineWidth = 1, n.dev && t.showDevPoc && this.drawSteps(e, o, n.dev.poc, z(t, "devPocColor"), z(t, "devPocStyle")), n.dev && t.showDevVa && (this.drawSteps(e, o, n.dev.vah, z(t, "devVaColor"), z(t, "devVaStyle")), this.drawSteps(e, o, n.dev.val, z(t, "devVaColor"), z(t, "devVaStyle"))), this.drawLevels(e, o, n, c, l, !0);
		}
		r.restore();
	}
	drawHistogram(e, t, n, r) {
		let i = this.params, o = e.ctx, s = z(i, "volume"), c = i.placement === "right", l = (r - n) * R(i, "widthPct") / 100, u = 0;
		for (let e of t.rows) u = Math.max(u, s === "delta" ? Math.abs(e.up - e.down) : e.up + e.down);
		if (!(u > 0)) return;
		let d = (e, t, i, a) => {
			t > 0 && o.fillRect(c ? r - e - t : n + e, i, t, a);
		};
		o.font = a(10), o.textBaseline = "middle", o.textAlign = c ? "right" : "left", t.rows.forEach((a, f) => {
			let p = e.ps.priceToY(a.hi), h = e.ps.priceToY(a.lo), g = Math.min(p, h) + .5, _ = Math.max(1, Math.abs(h - p) - 1), v = f >= t.vaLow && f <= t.vaHigh, y = z(i, v ? "vaUpColor" : "upColor"), b = z(i, v ? "vaDownColor" : "downColor"), x, S = a.up + a.down;
			if (s === "delta") S = a.up - a.down, x = Math.abs(S) / u * l, o.fillStyle = S >= 0 ? y : b, d(0, x, g, _);
			else if (s === "total") x = S / u * l, o.fillStyle = y, d(0, x, g, _);
			else {
				let e = a.up / u * l, t = a.down / u * l;
				o.fillStyle = y, d(0, e, g, _), o.fillStyle = b, d(e, t, g, _), x = e + t;
			}
			i.showValues && _ >= 9 && S && (o.fillStyle = z(i, "valuesColor"), o.fillText(m(S), c ? r - x - 3 : n + x + 3, g + _ / 2));
		});
	}
	drawSteps(e, t, n, r, i) {
		let a = e.ctx, o = e.ts.barSpacing;
		a.strokeStyle = r, a.setLineDash(Pn(i, 1)), a.beginPath();
		let s = Math.max(t.from, e.from - 1), c = Math.min(t.to, e.to + 1);
		for (let r = s; r <= c; r++) {
			let i = e.ts.indexToX(r), c = Math.round(e.ps.priceToY(n[r - t.from])) + .5;
			r === s ? a.moveTo(i - o / 2, c) : a.lineTo(i - o / 2, c), a.lineTo(i + o / 2, c);
		}
		a.stroke();
	}
	legend(e, t) {
		let n = this.params;
		if (!n.legendValues || !this.bars.length) return [];
		let r = this.spanAt(this.sessions(t), e), i = r && this.profile(r, t);
		if (!i) return [];
		let a = this.levels(i.vp);
		return Fn.filter((e) => n[e.show]).map((e) => ({
			text: t.fmt(a[e.name]),
			color: z(n, e.color)
		}));
	}
	axisLabels() {
		let e = this.params, t = this.lastView;
		if (!e.labelsOnScale || !t || !this.spans?.length) return [];
		let n = this.profile(this.spans[this.spans.length - 1], t);
		if (!n) return [];
		let r = this.levels(n.vp);
		return Fn.filter((t) => e[t.show]).map((t) => ({
			price: r[t.name],
			color: z(e, t.color)
		}));
	}
}, zn = [
	{
		type: "sma",
		name: "Moving Average",
		description: "Média móvel simples (SMA)",
		create: (e) => new wn("sma", e)
	},
	{
		type: "ema",
		name: "Moving Average Exponential",
		description: "Média móvel exponencial (EMA)",
		create: (e) => new wn("ema", e)
	},
	{
		type: "rsi",
		name: "Relative Strength Index",
		description: "Índice de força relativa (RSI), num painel próprio",
		create: (e) => new kn(e)
	},
	{
		type: "svp",
		name: "Session Volume Profile HD",
		description: "Perfil de volume de cada sessão (pré-mercado, mercado, pós-mercado, noturno)",
		create: (e) => new Rn(e)
	}
];
function H(e, t) {
	let n = zn.find((t) => t.type === e);
	return n ? n.create(t) : null;
}
function Bn(e, t = {}) {
	let n = H(e);
	if (!n) return [`tipo '${e}' desconhecido (existem: ${zn.map((e) => e.type).join(", ")})`];
	let r = [], i = n.params;
	for (let [a, o] of Object.entries(t)) {
		if (!(a in i)) {
			r.push(`'${a}' não existe no ${e} (existem: ${Object.keys(i).join(", ")})`);
			continue;
		}
		let t = typeof i[a];
		if (typeof o !== t) {
			r.push(`'${a}' devia ser ${t === "number" ? "um número" : t === "boolean" ? "true / false" : "um texto"}, veio ${JSON.stringify(o)}`);
			continue;
		}
		let s = n.schema.find((e) => e.key === a || e.numberKey === a);
		if (!s) continue;
		s.type === "select" && s.key === a && a !== "timeframe" && !s.options?.includes(String(o)) && r.push(`'${a}' = ${JSON.stringify(o)} não é válido (valores: ${s.options.map((e) => JSON.stringify(e)).join(", ")})`);
		let c = (s.type === "text" || s.type === "session") && s.key === a ? s.check?.(String(o)) : null;
		c && r.push(`'${a}': ${c}`), a === "timeframe" && o && !L(String(o)) && r.push(`'timeframe' = ${JSON.stringify(o)} não é um tempo gráfico (ex.: '60', '4h', '1D')`), typeof o == "number" && (s.type === "number" || s.numberKey === a) && (s.min !== void 0 && o < s.min || s.max !== void 0 && o > s.max) && r.push(`'${a}' = ${o} fora do intervalo ${s.min} a ${s.max}`);
	}
	return r;
}
//#endregion
//#region src/candlestick/ui/dom.ts
function U(e, t = {}, ...n) {
	let r = document.createElement(e);
	for (let [e, n] of Object.entries(t)) n !== void 0 && n !== !1 && (e.startsWith("on") && typeof n == "function" ? r.addEventListener(e.slice(2).toLowerCase(), n) : e === "class" ? r.className = String(n) : e === "html" ? r.innerHTML = String(n) : e === "text" ? r.textContent = String(n) : n === !0 ? r.setAttribute(e, "") : r.setAttribute(e, String(n)));
	for (let e of n) e != null && e !== !1 && r.append(e instanceof Node ? e : document.createTextNode(e));
	return r;
}
var W = null, Vn = "";
function Hn(e) {
	Vn = e;
}
function Un(e) {
	return Vn && (e.style.cssText += Vn), e;
}
function G() {
	if (!W) return;
	let e = W;
	W = null, e.el.remove(), e.anchor?.classList.remove("is-open"), e.onClose?.();
}
function K(e, t, n = {}) {
	let r = W && t instanceof HTMLElement && W.anchor === t;
	if (G(), r) return e;
	let i = Un(U("div", { class: `tc-popover ${n.className ?? ""}` }, e));
	i.addEventListener("pointerdown", (e) => e.stopPropagation()), document.body.appendChild(i);
	let a = n.side ?? "bottom", o = i.getBoundingClientRect(), s, c;
	if (t instanceof HTMLElement) {
		let e = t.getBoundingClientRect();
		t.classList.add("is-open"), a === "right" ? (s = e.right + 4, c = e.top) : a === "top" ? (s = e.left, c = e.top - o.height - 4) : (s = e.left, c = e.bottom + 4);
	} else s = t.x, c = t.y;
	return s = Math.max(4, Math.min(s, window.innerWidth - o.width - 4)), c = Math.max(4, Math.min(c, window.innerHeight - o.height - 4)), i.style.left = `${s}px`, i.style.top = `${c}px`, W = {
		el: i,
		anchor: t instanceof HTMLElement ? t : null,
		onClose: n.onClose
	}, i;
}
document.addEventListener("pointerdown", (e) => {
	if (!W) return;
	let t = e.target;
	W.el.contains(t) || W.anchor && W.anchor.contains(t) || G();
});
function q(e, t, n) {
	let r = null, i = 0;
	e.addEventListener("pointerenter", () => {
		i = window.setTimeout(() => {
			if (e.classList.contains("is-open")) return;
			r = Un(U("div", { class: "tc-tooltip" }, t, n ? U("span", { class: "tc-tooltip__key" }, n) : null)), document.body.appendChild(r);
			let i = e.getBoundingClientRect(), a = r.getBoundingClientRect(), o = e.closest(".tc-left-toolbar") !== null, s = o ? i.right + 8 : i.left + i.width / 2 - a.width / 2, c = o ? i.top + i.height / 2 - a.height / 2 : i.bottom + 8;
			s = Math.max(4, Math.min(s, window.innerWidth - a.width - 4)), c = Math.max(4, Math.min(c, window.innerHeight - a.height - 4)), r.style.left = `${s}px`, r.style.top = `${c}px`;
		}, 450);
	});
	let a = () => {
		clearTimeout(i), r?.remove(), r = null;
	};
	e.addEventListener("pointerleave", a), e.addEventListener("pointerdown", a);
}
function J(e) {
	let t = U("div", { class: "tc-menu" });
	for (let n of e) n.separator ? t.append(U("div", { class: "tc-menu__sep" })) : t.append(U("button", {
		class: `tc-menu__item${n.active ? " is-active" : ""}${n.danger ? " is-danger" : ""}`,
		onclick: () => {
			G(), n.action?.();
		}
	}, n.icon ? U("span", {
		class: "tc-menu__icon",
		html: n.icon
	}) : null, U("span", { class: "tc-menu__label" }, n.label), n.hotkey ? U("span", { class: "tc-menu__hotkey" }, n.hotkey) : null));
	return t;
}
function Wn(e, t, n = {}) {
	let r = Un(U("div", { class: "tc-modal-backdrop" })), i = () => {
		r.remove(), document.removeEventListener("keydown", a, !0), n.onClose?.();
	}, a = (e) => {
		e.key === "Escape" && (e.stopPropagation(), i());
	}, o = U("div", {
		class: "tc-modal",
		style: `width:${n.width ?? 460}px`
	}, U("div", { class: "tc-modal__header" }, U("div", { class: "tc-modal__title" }, e), U("button", {
		class: "tc-icon-btn tc-modal__close",
		html: Gn,
		onclick: i
	})), U("div", { class: "tc-modal__body" }, t), n.footer ? U("div", { class: "tc-modal__footer" }, n.footer) : null);
	return r.append(o), r.addEventListener("pointerdown", (e) => {
		e.target === r && i();
	}), document.addEventListener("keydown", a, !0), document.body.appendChild(r), {
		el: o,
		close: i
	};
}
var Gn = "<svg viewBox=\"0 0 28 28\" width=\"24\" height=\"24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\"><path d=\"M8 8l12 12M20 8L8 20\"/></svg>", Kn = [
	"#ffffff",
	"#d1d4dc",
	"#b2b5be",
	"#9598a1",
	"#787b86",
	"#5d606b",
	"#434651",
	"#2a2e39",
	"#131722",
	"#000000"
], qn = [
	"#f23645",
	"#ff9800",
	"#ffeb3b",
	"#4caf50",
	"#089981",
	"#00bcd4",
	"#2962ff",
	"#673ab7",
	"#9c27b0",
	"#e91e63"
], Jn = [
	.8,
	.6,
	.4,
	.2,
	0,
	-.2,
	-.4
];
function Yn(e, t) {
	let { r: n, g: r, b: i } = _(e), a = t > 0 ? 255 : 0, o = Math.abs(t), s = (e) => Math.round(e + (a - e) * o);
	return "#" + [
		s(n),
		s(r),
		s(i)
	].map((e) => e.toString(16).padStart(2, "0")).join("");
}
function Xn(e, t) {
	let { r: n, g: r, b: i } = _(e);
	return t >= 1 ? "#" + [
		n,
		r,
		i
	].map((e) => Math.round(e).toString(16).padStart(2, "0")).join("") : `rgba(${n},${r},${i},${+t.toFixed(2)})`;
}
function Zn(e, t, n = !0) {
	let r = _(e), i = r.a, a = "#" + [
		r.r,
		r.g,
		r.b
	].map((e) => Math.round(e).toString(16).padStart(2, "0")).join(""), o = U("div", { class: "tc-color-picker" }), s = U("div", { class: "tc-color-picker__grid" }), c = [...Kn];
	for (let e of Jn) for (let t of qn) c.push(Yn(t, e));
	let l = [], u = () => {
		l.forEach((e) => e.classList.toggle("is-active", e.dataset.c === a.toLowerCase())), d.style.setProperty("--c", a), f.textContent = `${Math.round(i * 100)}%`;
	};
	for (let e of c) {
		let n = U("button", {
			class: "tc-color-picker__swatch",
			style: `background:${e}`,
			"data-c": e.toLowerCase()
		});
		n.addEventListener("click", () => {
			a = e, u(), t(Xn(a, i));
		}), l.push(n), s.append(n);
	}
	o.append(s);
	let d = U("input", {
		type: "range",
		min: 0,
		max: 100,
		value: Math.round(i * 100),
		class: "tc-color-picker__opacity"
	}), f = U("span", { class: "tc-color-picker__pct" });
	return d.addEventListener("input", () => {
		i = Number(d.value) / 100, u(), t(Xn(a, i));
	}), n && o.append(U("div", { class: "tc-color-picker__row" }, U("span", { class: "tc-color-picker__label" }, "Opacidade"), d, f)), u(), o;
}
//#endregion
//#region src/candlestick/ui/icons.ts
var Y = (e, t = 28) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">${e}</svg>`, X = (e, t, n = 1.9) => `<circle cx="${e}" cy="${t}" r="${n}" fill="currentColor" stroke="none"/>`, Z = (e, t, n = 2) => `<circle cx="${e}" cy="${t}" r="${n}"/>`, Qn = {
	cross: Y("<path d=\"M14 5v18M5 14h18\"/>"),
	dot: Y(`${X(14, 14, 2.5)}`),
	arrowCursor: Y("<path d=\"M9 6l12 8.5-5.6 1.1 3.3 6.2-2.2 1.2-3.3-6.3L9 20.5z\"/>"),
	eraser: Y("<path d=\"M6.5 18.5l9-9 6 6-6.5 6.5H11z\"/><path d=\"M11 22h11M12 13l6 6\"/>"),
	trendline: Y(`<path d="M8.5 19.5l11-11"/>${Z(7, 21)}${Z(21, 7)}`),
	ray: Y(`<path d="M8.5 19.5L24 4"/>${Z(7, 21)}${Z(15, 13)}`),
	infoline: Y(`<path d="M8.5 19.5l11-11"/>${Z(7, 21)}${Z(21, 7)}<path d="M15 21h8M19 18v6"/>`),
	extended: Y(`<path d="M3 25L25 3"/>${Z(10, 18)}${Z(18, 10)}`),
	arrow: Y("<path d=\"M6 22L21 7M13 7h8v8\"/>"),
	hline: Y(`<path d="M3 14h9M16 14h9"/>${Z(14, 14)}`),
	hray: Y(`<path d="M10 14h15"/>${Z(8, 14)}`),
	vline: Y(`<path d="M14 3v9M14 16v9"/>${Z(14, 14)}`),
	crossline: Y(`<path d="M14 3v9M14 16v9M3 14h9M16 14h9"/>${Z(14, 14)}`),
	channel: Y(`<path d="M4 17L17 4M11 24L24 11"/>${Z(5.5, 15.5)}${Z(15.5, 5.5)}${Z(22.5, 12.5)}`),
	fib: Y(`<path d="M3 6h22M3 11h22M3 16h22M3 22h22" opacity=".9"/><path d="M6 22L22 6" stroke-dasharray="2 2"/>${X(6, 22)}${X(22, 6)}`),
	fibext: Y(`<path d="M3 5h22M3 10h22M3 15h22" /><path d="M5 25l6-9 5 5" stroke-dasharray="2 2"/>${X(5, 25)}${X(11, 16)}${X(16, 21)}`),
	fibchannel: Y("<path d=\"M3 15L15 3M3 21L21 3M3 26L26 3M8 26L26 8\"/>"),
	long: Y("<path d=\"M5 6h18v8H5z\" fill=\"currentColor\" fill-opacity=\".18\"/><path d=\"M5 14h18v8H5z\"/><path d=\"M8 18l3-3 3 2 5-5\"/>"),
	short: Y("<path d=\"M5 6h18v8H5z\"/><path d=\"M5 14h18v8H5z\" fill=\"currentColor\" fill-opacity=\".18\"/><path d=\"M8 9l3 3 3-2 5 5\"/>"),
	pricerange: Y("<path d=\"M6 5h16M6 23h16M14 7v14M11 10l3-3 3 3M11 18l3 3 3-3\"/>"),
	daterange: Y("<path d=\"M5 6v16M23 6v16M7 14h14M10 11l-3 3 3 3M18 11l3 3-3 3\"/>"),
	datepricerange: Y("<path d=\"M5 5h18v18H5z\"/><path d=\"M14 8v12M8 14h12\"/>"),
	frvp: Y("<path d=\"M5 4v20M5 6h7M5 9h11M5 12h16M5 15h12M5 18h8M5 21h5\"/><path d=\"M23 4v20\" stroke-dasharray=\"2 2\"/>"),
	avwap: Y(`<path d="M5 20c4-1 6-8 10-9s5 3 8 1"/>${X(5, 20)}<path d="M5 24V8" stroke-dasharray="2 2"/>`),
	brush: Y("<path d=\"M20.5 4.5l3 3-9.5 9.5-3-3z\"/><path d=\"M11 14c-3 0-4.5 2-4.5 4 0 1.8-1 3-2.5 3.5 3.5 1.5 9 1 9.5-4z\"/>"),
	rect: Y(`<path d="M7 7h14v14H7z"/>${Z(7, 7)}${Z(21, 21)}`),
	ellipse: Y("<ellipse cx=\"14\" cy=\"14\" rx=\"10\" ry=\"7\"/>"),
	triangle: Y("<path d=\"M14 5l10 17H4z\"/>"),
	path: Y("<path d=\"M5 21l6-9 6 5 6-11M19 6h4v4\"/>"),
	text: Y("<path d=\"M7 7h14M14 7v15M11 22h6\"/>"),
	magnet: Y("<path d=\"M8 5v9a6 6 0 0012 0V5h-4v9a2 2 0 01-4 0V5z\"/><path d=\"M8 9h4M16 9h4\"/>"),
	magnetStrong: Y("<path d=\"M8 5v9a6 6 0 0012 0V5h-4v9a2 2 0 01-4 0V5z\" fill=\"currentColor\" fill-opacity=\".25\"/><path d=\"M8 9h4M16 9h4\"/>"),
	stayDrawing: Y("<path d=\"M7 21l2-6 9-9 4 4-9 9z\"/><path d=\"M15 9l4 4\"/><path d=\"M5 25h18\" stroke-dasharray=\"2 2\"/>"),
	lock: Y("<rect x=\"7\" y=\"13\" width=\"14\" height=\"10\" rx=\"2\"/><path d=\"M10 13V9.5a4 4 0 018 0V13\"/>"),
	unlock: Y("<rect x=\"7\" y=\"13\" width=\"14\" height=\"10\" rx=\"2\"/><path d=\"M10 13V9.5a4 4 0 017.6-1.6\"/>"),
	eye: Y("<path d=\"M3.5 14S7.5 7 14 7s10.5 7 10.5 7-4 7-10.5 7S3.5 14 3.5 14z\"/><circle cx=\"14\" cy=\"14\" r=\"3\"/>"),
	eyeOff: Y("<path d=\"M3.5 14S7.5 7 14 7s10.5 7 10.5 7-4 7-10.5 7S3.5 14 3.5 14z\"/><circle cx=\"14\" cy=\"14\" r=\"3\"/><path d=\"M5 23L23 5\"/>"),
	trash: Y("<path d=\"M7 9h14M11 9V6.5h6V9M9 9l1 13.5h8L19 9M12.5 12.5v7M15.5 12.5v7\"/>"),
	zoomIn: Y("<circle cx=\"12.5\" cy=\"12.5\" r=\"6.5\"/><path d=\"M17.5 17.5l5.5 5.5M12.5 9.5v6M9.5 12.5h6\"/>"),
	settings: Y("<circle cx=\"14\" cy=\"14\" r=\"3\"/><path d=\"M14 4.5l2 2.3 3-.4.9 2.9 2.7 1.4-.9 2.9 1.6 2.6-2.4 1.9.1 3-3 .6-1.5 2.6-2.5-1.7-2.5 1.7-1.5-2.6-3-.6.1-3-2.4-1.9 1.6-2.6-.9-2.9 2.7-1.4.9-2.9 3 .4z\"/>"),
	candles: Y("<path d=\"M9 4v4M9 20v4M19 6v3M19 19v3\"/><rect x=\"6.5\" y=\"8\" width=\"5\" height=\"12\" rx=\".5\"/><rect x=\"16.5\" y=\"9\" width=\"5\" height=\"10\" rx=\".5\" fill=\"currentColor\"/>"),
	hollow: Y("<path d=\"M9 4v4M9 20v4M19 6v3M19 19v3\"/><rect x=\"6.5\" y=\"8\" width=\"5\" height=\"12\" rx=\".5\"/><rect x=\"16.5\" y=\"9\" width=\"5\" height=\"10\" rx=\".5\"/>"),
	bars: Y("<path d=\"M9 5v18M6 9h3M9 19h3M19 5v18M16 17h3M19 8h3\"/>"),
	heikin: Y("<path d=\"M9 4v4M9 20v4M19 6v3M19 19v3\"/><rect x=\"6.5\" y=\"8\" width=\"5\" height=\"12\" rx=\"2\" fill=\"currentColor\" fill-opacity=\".4\"/><rect x=\"16.5\" y=\"9\" width=\"5\" height=\"10\" rx=\"2\"/>"),
	line: Y("<path d=\"M4 20l6-7 5 4 9-11\"/>"),
	step: Y("<path d=\"M4 20h5v-7h6v4h4V7h5\"/>"),
	area: Y("<path d=\"M4 20l6-7 5 4 9-11v18H4z\" fill=\"currentColor\" fill-opacity=\".2\"/><path d=\"M4 20l6-7 5 4 9-11\"/>"),
	baseline: Y("<path d=\"M3 15h22\" stroke-dasharray=\"2 2\"/><path d=\"M4 18l5-8 5 4 4-6 6 10\"/>"),
	indicators: Y("<path d=\"M4 21l6-8 5 4 9-11\"/><path d=\"M4 9c3 0 4 5 7 5s4-6 7-6 4 4 6 4\" opacity=\".6\"/>"),
	undo: Y("<path d=\"M9 11h9a5 5 0 010 10h-3\"/><path d=\"M12 7l-4 4 4 4\"/>"),
	redo: Y("<path d=\"M19 11h-9a5 5 0 000 10h3\"/><path d=\"M16 7l4 4-4 4\"/>"),
	camera: Y("<path d=\"M5 9h4l2-3h6l2 3h4v13H5z\"/><circle cx=\"14\" cy=\"15\" r=\"4\"/>"),
	fullscreen: Y("<path d=\"M5 10V5h5M18 5h5v5M23 18v5h-5M10 23H5v-5\"/>"),
	search: Y("<circle cx=\"12.5\" cy=\"12.5\" r=\"6.5\"/><path d=\"M17.5 17.5l5 5\"/>"),
	plus: Y("<path d=\"M14 7v14M7 14h14\"/>"),
	close: Y("<path d=\"M8 8l12 12M20 8L8 20\"/>"),
	chevronDown: Y("<path d=\"M10 12l4 4 4-4\"/>"),
	chevronRight: Y("<path d=\"M12 9l5 5-5 5\"/>"),
	doubleRight: Y("<path d=\"M9 9l5 5-5 5M15 9l5 5-5 5\"/>"),
	watchlist: Y("<path d=\"M6 8h16M6 14h16M6 20h10\"/>"),
	alert: Y("<path d=\"M14 5a6 6 0 016 6v5l2 3H6l2-3v-5a6 6 0 016-6zM12 22a2 2 0 004 0\"/>"),
	copy: Y("<rect x=\"9\" y=\"9\" width=\"12\" height=\"13\" rx=\"1.5\"/><path d=\"M7 18V7a1 1 0 011-1h10\"/>"),
	more: Y(`${X(8, 14, 1.4)}${X(14, 14, 1.4)}${X(20, 14, 1.4)}`),
	front: Y("<rect x=\"10\" y=\"10\" width=\"11\" height=\"11\" fill=\"currentColor\" fill-opacity=\".3\"/><path d=\"M7 17V7h10\"/>"),
	back: Y("<rect x=\"7\" y=\"7\" width=\"11\" height=\"11\"/><path d=\"M21 11v10H11\" />"),
	layout: Y("<rect x=\"5\" y=\"6\" width=\"18\" height=\"16\" rx=\"1.5\"/><path d=\"M14 6v16\"/>"),
	logo: "<svg viewBox=\"0 0 36 28\" width=\"36\" height=\"28\" fill=\"none\"><path d=\"M3 21l8-9 6 5 9-11\" stroke=\"#2962ff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"29\" cy=\"6\" r=\"3.2\" fill=\"#2962ff\"/></svg>"
};
function Q(e) {
	return Qn[e] ?? Qn.trendline;
}
//#endregion
//#region src/candlestick/ui/dialogs.ts
function $n(e, t) {
	let n = U("input", {
		class: "tc-search-input",
		placeholder: "Pesquisar símbolo",
		autofocus: !0
	}), r = U("div", { class: "tc-list" }), i = ["Todos", ...new Set(e.map((e) => e.type).filter((e) => !!e))], a = "Todos", o = U("div", { class: "tc-tabs" }), s = () => {
		let i = n.value.trim().toLowerCase();
		r.innerHTML = "";
		for (let n of e) (a === "Todos" || n.type === a) && (!i || n.symbol.toLowerCase().includes(i) || (n.name ?? "").toLowerCase().includes(i)) && r.append(U("button", {
			class: "tc-list__row",
			onclick: () => {
				t(n), l.close();
			}
		}, U("span", {
			class: "tc-sym-badge",
			"data-type": n.type ?? ""
		}, n.symbol.slice(0, 1)), U("span", { class: "tc-list__main" }, n.symbol), U("span", { class: "tc-list__desc" }, n.name ?? ""), U("span", { class: "tc-list__meta" }, [n.type, n.exchange].filter(Boolean).join(" · "))));
		o.querySelectorAll("button").forEach((e) => e.classList.toggle("is-active", e.textContent === c(a)));
	}, c = (e) => ({
		Todos: "Todos",
		crypto: "Cripto",
		forex: "Forex",
		commodity: "Commodities",
		index: "Índices",
		stock: "Ações"
	})[e] ?? e;
	for (let e of i) o.append(U("button", {
		class: "tc-tab",
		onclick: () => {
			a = e, s();
		}
	}, c(e)));
	n.addEventListener("input", s), n.addEventListener("keydown", (e) => {
		e.key === "Enter" && r.querySelector(".tc-list__row")?.click();
	});
	let l = Wn("Pesquisa de símbolo", U("div", { class: "tc-symbol-search" }, U("div", { class: "tc-search-box" }, U("span", { html: Q("search") }), n), o, r), { width: 680 });
	s(), setTimeout(() => n.focus(), 0);
}
function er(e, t, n) {
	let r = U("input", {
		class: "tc-search-input",
		placeholder: "Pesquisar"
	}), i = U("div", { class: "tc-list" }), a = () => {
		let a = r.value.trim().toLowerCase();
		i.innerHTML = "";
		let o = (e) => !a || e.name.toLowerCase().includes(a) || e.description.toLowerCase().includes(a), s = n ? n.items().filter(o) : [];
		s.length && i.append(U("div", { class: "tc-list-title" }, n.title));
		for (let e of s) {
			let t = U("input", {
				type: "checkbox",
				class: "tc-checkbox"
			});
			t.checked = e.on, t.addEventListener("change", () => n.onToggle(e.id, t.checked)), i.append(U("label", { class: "tc-list__row tc-list__row--check" }, t, U("span", { class: "tc-list__main" }, e.name), U("span", { class: "tc-list__desc" }, e.description)));
		}
		let c = e.filter(o);
		c.length && i.append(U("div", { class: "tc-list-title" }, "Indicadores técnicos"));
		for (let e of c) i.append(U("button", {
			class: "tc-list__row",
			onclick: () => t(e)
		}, U("span", {
			class: "tc-list__icon",
			html: Q("indicators")
		}), U("span", { class: "tc-list__main" }, e.name), U("span", { class: "tc-list__desc" }, e.description)));
		i.childElementCount || i.append(U("div", { class: "tc-list-title" }, "Sem resultados"));
	};
	r.addEventListener("input", a), Wn("Indicadores, métricas e estratégias", U("div", { class: "tc-symbol-search" }, U("div", { class: "tc-search-box" }, U("span", { html: Q("search") }), r), i), { width: 620 }), a(), setTimeout(() => r.focus(), 0);
}
function tr(e, t) {
	let n = U("button", { class: "tc-color-btn" }, U("span", {
		class: "tc-color-btn__swatch",
		style: `background:${e}`
	}));
	return n.addEventListener("click", () => {
		K(Zn(e, (r) => {
			e = r, n.firstChild.style.background = r, t(r);
		}), n);
	}), n;
}
function nr(e, t) {
	return U("div", { class: "tc-form-row" }, U("label", { class: "tc-form-row__label" }, e), U("div", { class: "tc-form-row__control" }, t));
}
function rr(e, t) {
	let n = U("input", {
		type: "checkbox",
		class: "tc-checkbox"
	});
	return n.checked = e, n.addEventListener("change", () => t(n.checked)), n;
}
function $(e, t, n, r, i) {
	let a = U("input", {
		type: "number",
		class: "tc-input tc-input--num",
		value: e,
		min: n,
		max: r,
		step: i ?? 1
	});
	return a.addEventListener("change", () => {
		let e = Number(a.value);
		isFinite(e) && (n !== void 0 && (e = Math.max(n, e)), r !== void 0 && (e = Math.min(r, e)), a.value = String(e), t(e));
	}), a;
}
function ir(e, t, n) {
	let r = U("select", { class: "tc-input tc-select" });
	for (let n of t) r.append(U("option", {
		value: n.value,
		selected: n.value === e
	}, n.label));
	return r.addEventListener("change", () => n(r.value)), r;
}
function ar(e, t, n) {
	let r = U("input", {
		type: "text",
		class: "tc-input tc-input--text",
		value: e
	});
	return r.addEventListener("change", () => {
		let e = n?.(r.value) ?? null;
		r.classList.toggle("is-invalid", !!e), r.title = e ?? "", e || t(r.value.trim());
	}), r;
}
function or(e, t, n) {
	let r = /^(\d{2}):?(\d{2})-(\d{2}):?(\d{2})$/.exec(e.trim());
	if (!r) return ar(e, t, n);
	let i = (e, t) => U("input", {
		type: "time",
		class: "tc-input tc-input--time",
		value: `${e === "24" ? "00" : e}:${t}`
	}), a = i(r[1], r[2]), o = i(r[3], r[4]), s = () => {
		a.value && o.value && t(`${a.value.replace(":", "")}-${o.value.replace(":", "")}`);
	};
	return a.addEventListener("change", s), o.addEventListener("change", s), U("div", { class: "tc-form-row__pair" }, a, U("span", { class: "tc-form-row__dash" }, "–"), o);
}
var sr = [
	{
		id: "values",
		label: "Valores"
	},
	{
		id: "style",
		label: "Estilo"
	},
	{
		id: "visibility",
		label: "Visibilidade"
	}
];
function cr(e) {
	return e.tab ?? (e.section === "Estilo" ? "style" : "values");
}
function lr(e, t, n) {
	let r = JSON.stringify(t.params), i = t.visibility ? JSON.stringify(t.visibility) : null, a = U("div", { class: "tc-dlg-tabs" }), o = U("div", { class: "tc-form" }), s = sr.filter((e) => e.id === "visibility" || t.schema.some((t) => cr(t) === e.id)), c = s[0].id, l = () => {
		e.updateIndicator(t), n();
	}, u = () => {
		if (a.replaceChildren(...s.map((e) => U("button", {
			class: `tc-dlg-tab${e.id === c ? " is-active" : ""}`,
			onclick: () => {
				c = e.id, u();
			}
		}, e.label))), o.replaceChildren(), c === "visibility") {
			d();
			return;
		}
		let e;
		for (let n of t.schema) {
			if (cr(n) !== c) continue;
			let r = t.params[n.key], i = (e) => {
				t.params[n.key] = e, l(), (n.type === "select" || n.type === "bool") && t.schema.some((e) => e.enabled) && u();
			}, a = (e, n) => {
				t.params[e] = n, l();
			}, s;
			if (n.type === "color" && n.numberKey) {
				let e = n.numberKey;
				s = U("div", { class: "tc-form-row__pair" }, tr(String(r), i), $(Number(t.params[e]), (t) => a(e, t), n.min, n.max, n.step));
			} else if (n.type === "color" && n.dashKey) {
				let e = n.dashKey;
				s = U("div", { class: "tc-form-row__pair" }, tr(String(r), i), ir(String(t.params[e]), ur, (t) => a(e, t)));
			} else if (n.type === "color") s = tr(String(r), i);
			else if (n.type === "bool") s = null;
			else if (n.type === "text") s = ar(String(r), i, n.check);
			else if (n.type === "session") s = or(String(r), i, n.check);
			else if (n.type === "select") {
				let e = n.options ?? [], t = e.includes(String(r)) ? e : [...e, String(r)];
				s = ir(String(r), t.map((e) => ({
					value: e,
					label: n.optionLabels?.[e] ?? e
				})), i);
			} else s = $(Number(r), i, n.min, n.max, n.step);
			let d = n.section === "Estilo" ? void 0 : n.section;
			d && d !== e && o.append(U("div", { class: "tc-form-section" }, d)), e = d;
			let f;
			if (!s) f = U("div", { class: "tc-form-row" }, U("label", { class: "tc-form-row__label tc-form-row__label--check" }, rr(!!r, i), n.label));
			else if (n.toggle) {
				let e = n.toggle;
				f = U("div", { class: "tc-form-row" }, U("label", { class: "tc-form-row__label tc-form-row__label--check" }, rr(!!t.params[e], (t) => a(e, t)), n.label), U("div", { class: "tc-form-row__control" }, s));
			} else f = nr(n.label, s);
			n.indent && f.classList.add("tc-form-row--indent"), n.enabled && !n.enabled(t.params) && (f.classList.add("tc-form-row--disabled"), f.querySelectorAll("input, select, button").forEach((e) => e.disabled = !0)), o.append(f);
		}
	}, d = () => {
		for (let e of cn) {
			let n = t.visibility?.[e.key] ?? {
				on: !0,
				min: 1,
				max: e.max
			}, r = (r) => {
				let i = {
					...n,
					...r
				};
				Object.assign(n, i);
				let a = {
					...t.visibility ?? {},
					[e.key]: i
				};
				t.visibility = cn.every((e) => {
					let t = a[e.key];
					return !t || t.on && t.min <= 1 && t.max >= e.max;
				}) ? null : a, l();
			}, i = $(n.min, (e) => r({ min: e }), 1, e.max), a = $(n.max, (e) => r({ max: e }), 1, e.max), s = U("div", { class: "tc-form-row" }, U("label", { class: "tc-form-row__label tc-form-row__label--check" }, rr(n.on, (e) => r({ on: e })), e.label), U("div", { class: "tc-form-row__pair" }, i, U("span", { class: "tc-form-row__dash" }, "–"), a));
			o.append(s);
		}
		o.append(U("div", { class: "tc-form-note" }, "O indicador só aparece nos tempos gráficos marcados (ex.: Minutos 1–15 = de 1 a 15 minutos)."));
	}, f = (e) => {
		K(U("div", { class: "tc-menu" }, U("button", {
			class: "tc-menu__item",
			onclick: () => {
				G();
				let e = H(t.type);
				e && (t.params = { ...e.params }, t.visibility = null, l(), u());
			}
		}, U("span", { class: "tc-menu__label" }, "Repor padrões"))), e, { side: "top" });
	}, p = U("button", { class: "tc-btn tc-btn--menu" }, "Padrões ▾");
	p.addEventListener("click", () => f(p)), u();
	let m = Wn(t.name, U("div", { class: "tc-dlg" }, a, o), {
		width: 420,
		footer: U("div", { class: "tc-modal__actions tc-modal__actions--split" }, p, U("span", { class: "tc-modal__spacer" }), U("button", {
			class: "tc-btn",
			onclick: () => {
				t.params = JSON.parse(r), t.visibility = i ? JSON.parse(i) : null, l(), m.close();
			}
		}, "Cancelar"), U("button", {
			class: "tc-btn tc-btn--primary",
			onclick: () => m.close()
		}, "Ok"))
	});
}
var ur = [
	{
		value: "solid",
		label: "——— Sólida"
	},
	{
		value: "dashed",
		label: "- - - Tracejada"
	},
	{
		value: "dotted",
		label: "······ Pontilhada"
	}
];
function dr(e, t) {
	let n = e.drawings, r = U("div", { class: "tc-form" }), i = (e) => {
		n.updateOptions(t, e);
	};
	for (let n of t.settings()) {
		let a = t.opts[n.key], o;
		switch (n.type) {
			case "color":
			case "fill":
				o = tr(String(a), (e) => i({ [n.key]: e }));
				break;
			case "width":
				o = ir(String(a), [
					1,
					2,
					3,
					4
				].map((e) => ({
					value: String(e),
					label: `${e}px`
				})), (e) => i({ [n.key]: Number(e) }));
				break;
			case "dash":
				o = ir(String(a), ur, (e) => i({ [n.key]: e }));
				break;
			case "bool":
				o = rr(!!a, (e) => i({ [n.key]: e }));
				break;
			case "text": {
				let n = U("textarea", {
					class: "tc-input tc-textarea",
					rows: 3
				});
				n.value = String(a ?? ""), n.addEventListener("input", () => {
					t.opts.text = n.value, e.requestRender();
				}), n.addEventListener("change", () => i({ text: n.value })), o = n;
				break;
			}
			case "number":
				o = $(Number(a), (e) => i({ [n.key]: e }), n.min, n.max, n.step);
				break;
			case "levels":
				o = pr(t.opts.levels, (e) => i({ levels: e }));
				break;
			default: continue;
		}
		r.append(n.type === "levels" ? U("div", { class: "tc-form-block" }, U("div", { class: "tc-form-row__label" }, n.label), o) : nr(n.label, o));
	}
	let a = Wn(t.title, r, {
		width: fr(t),
		footer: U("div", { class: "tc-modal__actions" }, U("button", {
			class: "tc-btn tc-btn--primary",
			onclick: () => a.close()
		}, "Ok"))
	});
}
function fr(e) {
	return e.settings().some((e) => e.type === "levels") ? 520 : 400;
}
function pr(e, t) {
	let n = U("div", { class: "tc-levels" }), r = e.map((e) => ({ ...e }));
	return r.forEach((e, i) => {
		let a = () => t(r.map((e) => ({ ...e })));
		n.append(U("div", { class: "tc-levels__item" }, rr(e.enabled, (e) => {
			r[i].enabled = e, a();
		}), $(e.value, (e) => {
			r[i].value = e, a();
		}, -10, 100, .001), tr(e.color, (e) => {
			r[i].color = e, a();
		})));
	}), n;
}
function mr(e, t) {
	G();
	let n = e.mainView().toXY(t.points[0]), r = e.canvas.getBoundingClientRect(), i = U("textarea", {
		class: "tc-inline-editor",
		rows: 2
	});
	i.value = t.opts.text, i.style.left = `${r.left + n.x}px`, i.style.top = `${r.top + e.mainPane.rect.y + n.y - 8}px`, i.style.fontSize = `${t.opts.fontSize}px`, i.style.color = t.opts.textColor, document.body.appendChild(i), i.focus(), i.select();
	let a = t.opts.text;
	i.addEventListener("input", () => {
		t.opts.text = i.value, e.requestRender();
	}), i.addEventListener("keydown", (e) => {
		e.stopPropagation(), e.key === "Enter" && !e.shiftKey && (e.preventDefault(), i.blur()), e.key === "Escape" && i.blur();
	}), i.addEventListener("blur", () => {
		i.remove(), i.value !== a && (t.opts.text = a, e.drawings.updateOptions(t, { text: i.value || "Texto" }, !1));
	}, { once: !0 });
}
//#endregion
//#region src/candlestick/ui/legend.ts
var hr = class {
	constructor(e, t, n) {
		this.chart = t, this.cb = n, this.index = null, this.collapsed = !1, this.paneEls = [], this.ohlcEl = null, this.titleEl = null, this.root = U("div", { class: "tc-legend-layer" }), e.appendChild(this.root), t.crosshairMoved.on((e) => {
			this.index = e, this.update();
		}), t.dataUpdated.on(() => this.update()), t.indicatorsChanged.on(() => this.rebuild()), t.layoutChanged.on(() => this.rebuild()), this.rebuild();
	}
	rebuild() {
		this.root.innerHTML = "", this.paneEls = [];
		let e = this.chart;
		e.data && (e.panes.forEach((t) => {
			let n = U("div", {
				class: "tc-legend",
				style: `top:${t.rect.y + 6}px`
			}), r = {
				pane: t.id,
				el: n,
				rows: []
			};
			if (t.main) {
				let t = I.find((t) => t.seconds === e.data.tf);
				this.titleEl = U("div", {
					class: "tc-legend__title",
					onclick: () => this.cb.onSymbolClick()
				}, U("span", { class: "tc-legend__live" }), U("span", { class: "tc-legend__sym" }, [
					e.symbol.name ?? e.symbol.symbol,
					t?.short ?? "",
					e.symbol.exchange
				].filter(Boolean).join(" · "))), this.ohlcEl = U("div", { class: "tc-legend__ohlc" }), n.append(U("div", { class: "tc-legend__head" }, this.titleEl, this.ohlcEl));
			}
			let i = U("div", { class: `tc-legend__rows${this.collapsed && t.main ? " is-collapsed" : ""}` });
			for (let e of t.indicators) {
				let t = U("span", { class: "tc-legend__values" }), n = U("div", { class: `tc-legend__row${e.shown ? "" : " is-hidden"}` }, U("span", { class: "tc-legend__name" }, e.title()), t, U("span", { class: "tc-legend__actions" }, U("button", {
					class: "tc-legend__btn",
					title: e.visible ? "Ocultar" : "Mostrar",
					html: Q(e.visible ? "eye" : "eyeOff"),
					onclick: () => this.cb.onToggle(e)
				}), U("button", {
					class: "tc-legend__btn",
					title: "Definições",
					html: Q("settings"),
					onclick: () => this.cb.onSettings(e)
				}), U("button", {
					class: "tc-legend__btn",
					title: "Remover",
					html: Q("close"),
					onclick: () => this.cb.onRemove(e)
				})));
				n.addEventListener("dblclick", () => this.cb.onSettings(e)), r.rows.push({
					ind: e,
					values: t,
					row: n
				}), i.append(n);
			}
			if (t.main && t.indicators.length > 0) {
				let e = U("button", {
					class: `tc-legend__collapse${this.collapsed ? " is-collapsed" : ""}`,
					html: Q("chevronDown")
				});
				e.addEventListener("click", () => {
					this.collapsed = !this.collapsed, this.rebuild();
				}), n.append(i, e);
			} else n.append(i);
			this.root.append(n), this.paneEls.push(r);
		}), this.update());
	}
	update() {
		let e = this.chart;
		if (!e.data || e.data.length === 0) return;
		let t = e.displayBars(), n = this.index ?? t.length - 1, r = t[Math.min(n, t.length - 1)];
		if (!r) return;
		if (this.ohlcEl) {
			let i = t[n - 1], a = i ? r.close - i.close : r.close - r.open, o = i ? a / i.close * 100 : a / r.open * 100, s = r.close >= r.open ? e.theme.up : e.theme.down, c = (t) => e.fmt(t), l = a >= 0 ? "+" : "−";
			this.ohlcEl.innerHTML = "";
			let u = (e, t) => U("span", { class: "tc-legend__kv" }, U("span", { class: "tc-legend__k" }, e), U("span", {
				class: "tc-legend__v",
				style: `color:${s}`
			}, t));
			this.ohlcEl.append(u("O", c(r.open)), u("H", c(r.high)), u("L", c(r.low)), u("C", c(r.close)), U("span", {
				class: "tc-legend__v",
				style: `color:${s}`
			}, `${l}${c(Math.abs(a))} (${l}${Math.abs(o).toFixed(2)}%)`), U("span", { class: "tc-legend__kv tc-legend__vol" }, U("span", { class: "tc-legend__k" }, "Vol"), U("span", {
				class: "tc-legend__v",
				style: `color:${s}`
			}, m(r.volume))));
		}
		let i = e.mainView();
		for (let t of this.paneEls) {
			let r = e.panes.find((e) => e.id === t.pane), a = r ? e.view(r) : i;
			for (let r of t.rows) {
				let t = r.ind.shown ? r.ind.legend(Math.min(n, e.data.length - 1), a) : [];
				r.values.innerHTML = "";
				for (let e of t) r.values.append(U("span", { style: `color:${e.color}` }, e.text));
			}
		}
	}
}, gr = (e) => e > 1e11 ? Math.floor(e / 1e3) : e, _r = (e) => `${e >= 0 ? "+" : "−"}${Math.abs(e).toFixed(2)}%`;
function vr(e) {
	return {
		"--tc-bg": e.bg,
		"--tc-border": e.border,
		"--tc-text": e.text,
		"--tc-text-strong": e.textStrong,
		"--tc-muted": e.muted,
		"--tc-accent": e.accent,
		"--tc-up": e.up,
		"--tc-down": e.down
	};
}
var yr = class {
	constructor(e, t, n = {}) {
		this.chart = t, this.body = null, this.statsEl = null, this.modeBtns = /* @__PURE__ */ new Map(), this.lineBtn = null, this.rows = /* @__PURE__ */ new Map(), this.offs = [], this.lastBars = -1, this.opts = {
			toggles: !0,
			search: !0,
			stats: !0,
			table: !0,
			rowClick: "entry",
			newestFirst: !0,
			collapsible: !1,
			collapsed: !1,
			...n,
			title: n.title === void 0 ? "Lista de trades" : n.title
		}, this.el = U("div", { class: "tc-trades" }), this.el.classList.toggle("tc-trades--bar", !this.opts.table), this.el.classList.toggle("is-collapsed", this.opts.collapsible && this.opts.collapsed), this.applyTheme(), this.el.append(this.buildHeader()), this.opts.table && (this.body = U("div", { class: "tc-trades__body" }), this.el.append(this.body)), e.append(this.el), this.syncToggles(), this.render(), this.offs.push(t.tradesChanged.on(() => this.render()), t.timezoneChanged.on(() => this.render()), t.tradeDisplayChanged.on(() => this.syncToggles()), t.tradeSelected.on((e) => this.markSelected(e?.id ?? null, !0)), t.dataUpdated.on(() => this.onData()));
	}
	applyTheme() {
		for (let [e, t] of Object.entries(vr(this.chart.theme))) this.el.style.setProperty(e, t);
	}
	destroy() {
		this.offs.forEach((e) => e()), this.el.remove();
	}
	buildHeader() {
		let e = this.opts, t = U("div", { class: "tc-trades__head" });
		if (e.title !== null) {
			let n = U("div", { class: "tc-trades__title" }, e.title ?? "");
			e.collapsible && (n.classList.add("is-toggle"), n.prepend(U("span", { class: "tc-trades__chevron" }, "▾")), n.addEventListener("click", () => this.el.classList.toggle("is-collapsed"))), t.append(n);
		}
		if (e.toggles) {
			let e = U("div", {
				class: "tc-trades__seg",
				role: "group",
				"aria-label": "Mostrar trades"
			});
			for (let [t, n] of [
				["both", "Ambas"],
				["entries", "Entradas"],
				["exits", "Saídas"]
			]) {
				let r = U("button", {
					class: "tc-trades__seg-btn",
					type: "button",
					onclick: () => this.setMode(t)
				}, n);
				this.modeBtns.set(t, r), e.append(r);
			}
			this.lineBtn = U("button", {
				class: "tc-trades__switch",
				type: "button",
				role: "switch",
				title: "Linha tracejada da entrada à saída",
				onclick: () => this.chart.setTradeDisplay({ lines: !this.chart.tradeDisplay.lines })
			}, U("span", { class: "tc-trades__knob" }), "Linha"), t.append(e, this.lineBtn);
		}
		if (e.search) {
			let e = U("input", {
				class: "tc-trades__search",
				type: "search",
				placeholder: "Ir para id…",
				"aria-label": "Ir para o trade com este id"
			}), n = (t) => {
				let n = e.value.trim().replace(/^#/, "");
				if (!n) return;
				let r = (t) => {
					e.classList.add("is-error"), e.title = t;
				};
				if (!this.chart.trade(n)) return r(`Não há trade com id "${n}"`);
				e.classList.remove("is-error"), e.title = "", this.chart.goToTrade(n, t).then((e) => {
					!e && this.chart.trade(n) && r(`O trade "${n}" é anterior ao histórico disponível`);
				});
			};
			e.addEventListener("keydown", (e) => {
				e.key === "Enter" && n(e.shiftKey ? "exit" : "entry"), e.stopPropagation();
			}), e.addEventListener("input", () => e.classList.remove("is-error"));
			let r = U("div", { class: "tc-trades__find" }, e, U("button", {
				class: "tc-trades__go",
				type: "button",
				title: "Ir para a entrada (Enter)",
				onclick: () => n("entry")
			}, "Entrada"), U("button", {
				class: "tc-trades__go",
				type: "button",
				title: "Ir para a saída (Shift+Enter)",
				onclick: () => n("exit")
			}, "Saída"));
			t.append(r);
		}
		return e.stats && (this.statsEl = U("div", { class: "tc-trades__stats" }), t.append(this.statsEl)), t;
	}
	setMode(e) {
		this.chart.setTradeDisplay({
			entries: e !== "exits",
			exits: e !== "entries"
		});
	}
	syncToggles() {
		let e = this.chart.tradeDisplay, t = e.entries && e.exits ? "both" : e.entries ? "entries" : e.exits ? "exits" : "both";
		for (let [n, r] of this.modeBtns) {
			let i = n === t && (e.entries || e.exits);
			r.classList.toggle("is-on", i), r.setAttribute("aria-pressed", String(i));
		}
		if (this.lineBtn) {
			let t = e.entries && e.exits;
			this.lineBtn.classList.toggle("is-on", e.lines && t), this.lineBtn.setAttribute("aria-checked", String(e.lines && t)), this.lineBtn.disabled = !t;
		}
	}
	fmtTime(e) {
		return this.opts.formatTime ? this.opts.formatTime(gr(e)) : this.chart.formatTime(gr(e), !0).replace("  ", " ");
	}
	fmtPrice(e) {
		return this.opts.formatPrice ? this.opts.formatPrice(e) : f(e, this.chart.symbol.precision);
	}
	lastPrice() {
		let e = this.chart.bars;
		return e.length ? e[e.length - 1].close : NaN;
	}
	onData() {
		if (this.chart.bars.length !== this.lastBars) return this.render();
		let e = this.lastPrice();
		for (let { pnl: t, trade: n } of this.rows.values()) n.exitPrice === void 0 && this.fillPnl(t, n, e);
		this.renderStats();
	}
	fillPnl(e, t, n) {
		if (!isFinite(n)) {
			e.textContent = "—";
			return;
		}
		let r = Nt(t, n);
		e.textContent = "", e.append(U("b", {}, _r(r.pct)), U("small", {}, `${r.abs >= 0 ? "+" : "−"}${this.fmtPrice(Math.abs(r.abs))}`)), e.classList.toggle("is-up", r.abs >= 0), e.classList.toggle("is-down", r.abs < 0);
	}
	renderStats() {
		if (!this.statsEl) return;
		let e = this.lastPrice(), t = Pt(this.chart.trades, isFinite(e) ? e : 0);
		this.statsEl.innerHTML = "", this.statsEl.append(U("span", {}, U("small", {}, "Trades "), String(t.total)), U("span", {}, U("small", {}, "Acerto "), `${t.winRate.toFixed(0)}%`), U("span", { class: t.pnlPct >= 0 ? "is-up" : "is-down" }, U("small", {}, "P&L "), _r(t.pnlPct)));
	}
	render() {
		this.lastBars = this.chart.bars.length, this.renderStats();
		let e = this.body;
		if (!e) return;
		let t = e.scrollTop;
		e.innerHTML = "", this.rows.clear();
		let n = [...this.chart.trades];
		if (this.opts.newestFirst && n.reverse(), !n.length) {
			e.append(U("div", { class: "tc-trades__empty" }, "Sem trades. Usa chart.setTrades([...])."));
			return;
		}
		let r = this.lastPrice(), i = this.chart.bars[0]?.time ?? 0, a = U("table", { class: "tc-trades__table" });
		a.append(U("thead", {}, U("tr", {}, U("th", {}, "Id"), U("th", {}, "Tipo"), U("th", {}, "Entrada"), U("th", {}, "Saída"), U("th", { class: "is-num" }, "Qtd"), U("th", { class: "is-num" }, "P&L"))));
		let o = U("tbody");
		for (let e of n) {
			let t = e.id, n = e.exitPrice === void 0, a = gr(e.entryTime) < i && (n || gr(e.exitTime ?? 0) < i), s = (e, n, r) => U("button", {
				class: "tc-trades__point",
				type: "button",
				title: e === "entry" ? "Ir para a entrada" : "Ir para a saída",
				onclick: (n) => {
					n.stopPropagation(), this.chart.goToTrade(t, e);
				}
			}, U("b", {}, this.fmtPrice(r)), U("small", {}, this.fmtTime(n))), c = U("td", { class: "tc-trades__pnl is-num" });
			this.fillPnl(c, e, r);
			let l = U("tr", {
				class: `tc-trades__row${a ? " is-away" : ""}`,
				"data-id": t,
				title: a ? "Fora das velas carregadas: carrega ao clicar" : "",
				onclick: () => void this.chart.goToTrade(t, this.opts.rowClick)
			}, U("td", { class: "tc-trades__id" }, `#${t}`), U("td", {}, U("span", { class: `tc-trades__side is-${e.side}` }, e.side === "long" ? "Long" : "Short")), U("td", {}, s("entry", e.entryTime, e.entryPrice)), U("td", {}, n ? U("span", { class: "tc-trades__open" }, "aberto") : s("exit", e.exitTime, e.exitPrice)), U("td", { class: "is-num" }, e.qty === void 0 ? "—" : String(e.qty)), c);
			o.append(l), this.rows.set(t, {
				row: l,
				pnl: c,
				trade: e
			});
		}
		a.append(o), e.append(a), e.scrollTop = t, this.markSelected(this.chart.selectedTradeId, !1);
	}
	markSelected(e, t) {
		for (let [t, { row: n }] of this.rows) n.classList.toggle("is-selected", t === e);
		if (!t || e === null || !this.body) return;
		let n = this.rows.get(e)?.row;
		if (!n) return;
		let r = n.offsetTop - this.body.clientHeight / 2 + n.offsetHeight / 2;
		this.body.scrollTo({
			top: r,
			behavior: "smooth"
		});
	}
};
function br(e, t, n = {}) {
	return new yr(e, t, n);
}
//#endregion
//#region src/candlestick/ui/terminal.ts
var xr = {
	symbol: "",
	tf: "5",
	chartType: "candles",
	indicators: [{
		type: "sma",
		params: {
			length: 50,
			color: "#2962ff"
		},
		visible: !0
	}],
	magnet: "off",
	stay: !1,
	favorites: [
		"1",
		"5",
		"15",
		"60",
		"240",
		"1D",
		"1W"
	],
	groupTools: {},
	toolbarPos: null,
	showWatchlist: !0
}, Sr = [
	{
		id: "bars",
		label: "Barras"
	},
	{
		id: "candles",
		label: "Velas"
	},
	{
		id: "hollow",
		label: "Velas ocas"
	},
	{
		id: "heikin",
		label: "Heikin Ashi"
	},
	{
		id: "line",
		label: "Linha"
	},
	{
		id: "step",
		label: "Linha em degraus"
	},
	{
		id: "area",
		label: "Área"
	},
	{
		id: "baseline",
		label: "Linha de base"
	}
], Cr = [
	{
		id: "cross",
		label: "Cruz",
		icon: "cross"
	},
	{
		id: "dot",
		label: "Ponto",
		icon: "dot"
	},
	{
		id: "arrow",
		label: "Seta",
		icon: "arrowCursor"
	},
	{
		id: "eraser",
		label: "Borracha",
		icon: "eraser"
	}
], wr = class {
	constructor(e, t) {
		this.tradeList = null, this.timeframeChanged = new T(), this.symbolChanged = new T(), this.loadingChanged = new T(), this.error = new T(), this.timezoneChanged = new T(), this.symbols = [], this.quotes = /* @__PURE__ */ new Map(), this.els = {}, this.watchRows = /* @__PURE__ */ new Map(), this.legend = null, this.tfTyping = "", this.tfTypingEl = null, this.tfTypingTimer = 0, this.loadToken = 0, this.firstLoad = !0, this.unsubBars = null, this.unsubQuotes = null, this.timers = [], this.keyHandler = (e) => this.onKey(e), this.toolGroups = [], this.sim = [], this.cssVars = "", this.opts = {
			timeframe: "5",
			timeframes: I,
			watchlist: !0,
			topbar: !0,
			leftToolbar: !0,
			bottomBar: !0,
			brand: null,
			storageKey: "openchartscandle",
			indicators: [{
				type: "sma",
				params: {
					length: 50,
					color: "#2962ff"
				}
			}],
			keyboard: !0,
			symbolSearch: !0,
			timeframeSelector: !0,
			chartTypes: !0,
			indicatorPicker: !0,
			undoRedo: !0,
			screenshot: !0,
			fullscreen: !0,
			drawingTools: !0,
			legend: !0,
			rangeButtons: !0,
			minimal: !1,
			compact: !1,
			priceAxis: !0,
			timeAxis: !0,
			crosshair: !0,
			lastPriceLine: !0,
			mouseWheel: !0,
			countBack: 1e3,
			loadingIndicator: !0,
			timezones: o,
			...t.minimal ? {
				topbar: !1,
				leftToolbar: !1,
				bottomBar: !1,
				watchlist: !1,
				legend: !1
			} : {},
			...t
		}, this.datafeed = t.datafeed, this.timeframes = this.opts.timeframes.map((e) => typeof e == "string" ? L(e) : e).filter((e) => !!e), this.timeframes.length || (this.timeframes = I);
		let n = this.opts.storageKey ? ie(`${this.opts.storageKey}.state`, null) : null;
		this.state = {
			...xr,
			tf: this.opts.timeframe,
			chartType: this.opts.chartType ?? xr.chartType,
			indicators: this.opts.indicators.map((e) => ({
				type: e.type,
				params: e.params ?? {},
				visible: !0
			})),
			...n ?? {}
		}, t.symbol && (this.state.symbol = t.symbol), (!this.state.timezone || !this.validZone(this.state.timezone)) && (this.state.timezone = this.opts.timezone ?? "local");
		let r = this.selectableTimeframes();
		this.tf = r.find((e) => e.id === this.state.tf) ?? r.find((e) => e.id === this.opts.timeframe) ?? r[0] ?? this.timeframes[0], this.root = e, this.chart = this.build(), this.ready = this.start();
	}
	save() {
		this.state.indicators = this.chart.indicators.filter((e) => !e.origin).map((e) => e.toJSON()), this.opts.storageKey && ae(`${this.opts.storageKey}.state`, this.state);
	}
	destroy() {
		this.unsubBars?.(), this.unsubQuotes?.(), this.timers.forEach((e) => clearInterval(e)), document.removeEventListener("keydown", this.keyHandler), G(), this.tradeList?.destroy(), this.chart.destroy(), this.root.innerHTML = "", this.root.classList.remove("tc-terminal");
	}
	build() {
		let e = this.opts;
		this.root.classList.add("tc-terminal"), this.root.classList.toggle("tc-compact", e.compact), this.root.classList.toggle("tc-minimal", e.minimal), e.border && (this.root.style.border = e.border), e.radius !== void 0 && (this.root.style.borderRadius = `${e.radius}px`), this.applyCssTheme(i(e.theme)), this.root.addEventListener("pointerdown", () => Hn(this.cssVars), !0), this.root.addEventListener("focusin", () => Hn(this.cssVars));
		let t = U("div", { class: "tc-chart-host" }), n = U("div", { class: "tc-chart-wrap" }, t), r = U("div", { class: "tc-center-col" }, n, e.bottomBar ? this.buildBottomBar() : null), a = U("div", { class: "tc-workspace" }, e.leftToolbar ? this.buildLeftToolbar() : null, r, e.watchlist === !1 ? null : this.buildRightPanel());
		e.topbar && this.root.append(this.buildTopbar()), this.root.append(a);
		let o = new Zt(t, {
			drawingStorage: e.storageKey ? ot(e.storageKey) : null,
			chartType: this.state.chartType,
			theme: e.theme,
			priceAxis: e.priceAxis,
			timeAxis: e.timeAxis,
			crosshair: e.crosshair,
			lastPriceLine: e.lastPriceLine,
			tradeColors: e.tradeColors,
			tradeDisplay: e.tradeDisplay,
			mouseWheel: e.mouseWheel,
			timezone: this.validZone(this.state.timezone) ? this.state.timezone : "local"
		});
		if (this.chart = o, o.timezoneChanged.on((e) => {
			this.state.timezone = e, this.save(), this.els.clock && this.updateClock(), this.timezoneChanged.emit(e);
		}), e.tradeList) {
			let t = U("div", { class: "tc-trades-panel" });
			e.tradeListHeight && t.style.setProperty("--tc-trades-h", `${e.tradeListHeight}px`), r.insertBefore(t, n.nextSibling), this.tradeList = new yr(t, o, e.tradeList === !0 ? {} : e.tradeList);
		}
		o.drawings.magnet = this.state.magnet, o.drawings.stayInDrawMode = this.state.stay, e.legend && (this.legend = new hr(n, o, {
			onSettings: (e) => lr(this.chart, e, () => {
				this.legend?.rebuild(), this.save();
			}),
			onRemove: (e) => this.removeIndicator(e),
			onToggle: (e) => {
				e.visible = !e.visible, this.chart.updateIndicator(e), this.save();
			},
			onSymbolClick: () => e.symbolSearch ? this.openSymbolSearch() : void 0
		})), this.loading = U("div", { class: "tc-loading" }, U("div", { class: "tc-loading__spinner" })), n.append(this.loading), !e.topbar && e.timeframeSelector !== !1 && (this.els.tfFloat = U("div", { class: "tc-tf-float" }), n.append(this.els.tfFloat)), this.floating = U("div", { class: "tc-floating-toolbar" }), n.append(this.floating);
		let s = U("button", {
			class: "tc-realtime-btn",
			html: Q("doubleRight"),
			onclick: () => this.chart.scrollToRealtime()
		});
		return q(s, "Rolar para a barra mais recente"), n.append(s), this.els.realtime = s, this.chart.viewChanged.on(() => {
			s.classList.toggle("is-visible", this.chart.isScrolledBack()), this.syncBottomToggles(), this.els.tfFloat?.style.setProperty("right", `${this.chart.priceAxisW + 8}px`);
		}), this.chart.loadingChanged.on((e) => {
			this.loading.classList.toggle("is-visible", e && this.opts.loadingIndicator && (this.chart.bars.length === 0 || this.chart.isHolding)), this.loadingChanged.emit(e);
		}), this.chart.historyError.on((e) => this.emitError(e)), this.chart.drawings.selection.on((e) => this.renderFloating(e)), this.chart.drawings.changed.on(() => this.renderFloating(this.chart.drawings.selected)), this.chart.drawings.toolChanged.on(() => this.syncLeftToolbar()), this.chart.drawings.historyChanged.on(() => this.syncUndo()), this.chart.drawings.textEdit.on((e) => mr(this.chart, e)), this.chart.drawingDblClick.on((e) => e.type === "text" ? mr(this.chart, e) : dr(this.chart, e)), this.chart.contextMenu.on((e) => this.showContextMenu(e.clientX, e.clientY, e.drawing)), this.chart.dataUpdated.on(() => this.renderDetails()), e.keyboard && document.addEventListener("keydown", this.keyHandler), o;
	}
	async start() {
		if (this.symbols = await this.datafeed.getSymbols(), !this.symbols.length) throw Error("openchartscandle: datafeed.getSymbols() returned no symbols");
		let e = this.symbols.find((e) => e.symbol === this.state.symbol) ?? this.symbols[0];
		for (let e of this.state.indicators) {
			let t = this.builtinAllowed(e.type) ? H(e.type, e.params) : null;
			t && (t.visible = e.visible, t.visibility = e.visibility ?? null, this.chart.addIndicator(t));
		}
		this.opts.simulationIndicators && !this.sim.length && this.setSimulationIndicators(this.opts.simulationIndicators), this.buildWatchlistRows(), this.syncLeftToolbar(), this.syncUndo(), await this.load(e), this.opts.watchlist !== !1 && this.datafeed.subscribeQuotes && (this.unsubQuotes = this.datafeed.subscribeQuotes(this.watchlistSymbols().map((e) => e.symbol), (e) => {
			this.quotes.set(e.symbol, e), this.updateWatchRow(e), e.symbol === this.chart.symbol.symbol && this.renderDetails();
		})), this.opts.bottomBar && (this.updateClock(), this.timers.push(window.setInterval(() => this.updateClock(), 1e3)));
	}
	emitError(e) {
		this.error.size ? this.error.emit(e) : console.error("openchartscandle: failed to load bars", e);
	}
	async load(e, t) {
		let n = ++this.loadToken;
		this.unsubBars?.(), this.unsubBars = null, this.chart.symbol.symbol !== e.symbol && (this.chart.setSymbol(e), this.symbolChanged.emit(e)), this.fitTimeframe(e), this.syncTopbar(), this.updateWatchActive();
		let r = e.symbol, i = this.tf;
		this.firstLoad && (this.firstLoad = !1, t ??= this.opts.initialTime), this.chart.setTimeframeFeed({
			getBars: (e, t) => this.datafeed.getBars(r, e, t),
			subscribeBars: (e, t) => this.datafeed.subscribeBars(r, e, t)
		});
		let a = await this.chart.setDataSource((e) => this.datafeed.getBars(r, i, e), i.seconds, {
			time: t,
			countBack: this.opts.countBack
		});
		n === this.loadToken && (a && (this.unsubBars = this.datafeed.subscribeBars(r, i, (e) => {
			n === this.loadToken && this.chart.update(e);
		}, () => {
			n === this.loadToken && this.chart.resync();
		})), this.legend?.rebuild(), this.renderDetails());
	}
	reload() {
		return this.load(this.chart.symbol, this.keepTime());
	}
	keepTime() {
		return this.chart.bars.length && this.chart.isScrolledBack() ? this.chart.centerTime() : void 0;
	}
	fitTimeframe(e) {
		let t = this.selectableTimeframes(e);
		if (!t.length || t.some((e) => e.id === this.tf.id)) return;
		let n = this.tf.seconds, r = t.reduce((e, t) => Math.abs(t.seconds - n) < Math.abs(e.seconds - n) ? t : e);
		this.tf = r, this.state.tf = r.id, this.save(), this.timeframeChanged.emit(r);
	}
	builtinAllowed(e) {
		let t = this.opts.indicatorPicker;
		return !Array.isArray(t) || t.includes(e);
	}
	openIndicators() {
		er(zn.filter((e) => this.builtinAllowed(e.type)).map((e) => ({
			id: e.type,
			name: e.name,
			description: e.description
		})), (e) => {
			let t = H(e.id);
			t && this.chart.addIndicator(t), this.save();
		}, this.sim.length ? {
			title: this.opts.simulationTitle ?? "Da simulação",
			items: () => this.sim.map((e) => ({
				id: e.def.id,
				name: e.def.label ?? e.ind.name,
				description: e.ind.title(),
				on: this.chart.indicators.includes(e.ind)
			})),
			onToggle: (e, t) => this.showSimulationIndicator(e, t)
		} : void 0);
	}
	setSimulationIndicators(e) {
		let t = [], n = new Map(this.sim.map((e) => [e.def.id, e])), r = [], i = /* @__PURE__ */ new Set();
		e.forEach((e, a) => {
			let o = `simulationIndicators[${a}]${e?.id ? ` (${e.id})` : ""}`;
			if (!e || typeof e.id != "string" || !e.id) {
				t.push(`${o}: falta o 'id' (um texto único)`);
				return;
			}
			if (i.has(e.id)) {
				t.push(`${o}: o id '${e.id}' está repetido`);
				return;
			}
			i.add(e.id);
			let s = Bn(e.type, e.params ?? {});
			t.push(...s.map((e) => `${o}: ${e}`));
			let c = n.get(e.id);
			if (c && c.def.type === e.type && JSON.stringify(c.def.params ?? {}) === JSON.stringify(e.params ?? {})) {
				n.delete(e.id), r.push({
					def: e,
					ind: c.ind
				});
				return;
			}
			let l = Object.fromEntries(Object.entries(e.params ?? {}).filter(([e]) => !s.some((t) => t.startsWith(`'${e}'`)))), u = H(e.type, l);
			u && (u.origin = e.id, e.visible !== !1 && this.chart.addIndicator(u), r.push({
				def: e,
				ind: u
			}));
		});
		for (let e of n.values()) this.chart.indicators.includes(e.ind) && this.chart.removeIndicator(e.ind);
		return this.sim = r, this.legend?.rebuild(), t.length && console.warn("openchartscandle: simulationIndicators\n- " + t.join("\n- ")), t;
	}
	getSimulationIndicators() {
		return this.sim.map((e) => ({
			id: e.def.id,
			type: e.def.type,
			label: e.def.label ?? e.ind.name,
			params: { ...e.ind.params },
			shown: this.chart.indicators.includes(e.ind)
		}));
	}
	showSimulationIndicator(e, t) {
		let n = this.sim.find((t) => t.def.id === e);
		if (!n) return;
		let r = this.chart.indicators.includes(n.ind);
		t && !r ? this.chart.addIndicator(n.ind) : !t && r && this.chart.removeIndicator(n.ind), this.legend?.rebuild();
	}
	removeIndicator(e) {
		this.chart.removeIndicator(e), this.save();
	}
	applyTheme(e) {
		this.chart.applyTheme(e), this.applyCssTheme(this.chart.theme), this.tradeList?.applyTheme();
	}
	applyCssTheme(e) {
		let t = {
			"--tc-bg": e.bg,
			"--tc-app-bg": e.appBg,
			"--tc-border": e.border,
			"--tc-text": e.text,
			"--tc-text-strong": e.textStrong,
			"--tc-muted": e.muted,
			"--tc-accent": e.accent,
			"--tc-up": e.up,
			"--tc-down": e.down
		};
		this.cssVars = Object.entries(t).map(([e, t]) => `${e}:${t};`).join("");
		for (let [e, n] of Object.entries(t)) this.root.style.setProperty(e, n);
	}
	openSymbolSearch() {
		$n(this.symbols, (e) => this.setSymbol(e.symbol));
	}
	chartTypeList() {
		let e = this.opts.chartTypes;
		return Array.isArray(e) ? Sr.filter((t) => e.includes(t.id)) : Sr;
	}
	buildTopbar() {
		let e = this.opts, t = [], n = (e, t, n, r) => {
			let i = U("button", {
				class: "tc-tb-btn tc-tb-btn--icon",
				html: Q(e),
				onclick: n
			});
			return q(i, t, r), i;
		};
		if (e.symbolSearch) {
			let e = U("button", {
				class: "tc-tb-btn tc-tb-symbol",
				onclick: () => this.openSymbolSearch()
			}, U("span", {
				class: "tc-tb-symbol__icon",
				html: Q("search")
			}), U("span", { class: "tc-tb-symbol__name" }));
			this.els.symbol = e, q(e, "Pesquisa de símbolo"), t.push([e]);
		}
		if (e.timeframeSelector !== !1) {
			let e = U("div", { class: "tc-tb-group tc-tb-tfs" });
			this.els.tfs = e;
			let n = U("button", {
				class: "tc-tb-btn tc-tb-btn--icon tc-tb-caret",
				html: Q("chevronDown")
			});
			n.addEventListener("click", () => this.showTimeframeMenu(n)), q(n, "Intervalo de tempo"), t.push([e, this.selectableTimeframes().length > 1 ? n : null]);
		}
		if (e.chartTypes !== !1 && this.chartTypeList().length > 1) {
			let e = U("button", { class: "tc-tb-btn tc-tb-btn--icon" });
			e.addEventListener("click", () => K(J(this.chartTypeList().map((e) => ({
				label: e.label,
				icon: Q(e.id),
				active: this.chart.chartType === e.id,
				action: () => this.setChartType(e.id)
			}))), e)), q(e, "Tipo de gráfico"), this.els.ctype = e, t.push([e]);
		}
		e.indicatorPicker !== !1 && t.push([U("button", {
			class: "tc-tb-btn tc-tb-btn--text",
			onclick: () => this.openIndicators()
		}, U("span", { html: Q("indicators") }), U("span", {}, "Indicadores"))]), e.undoRedo && (this.els.undo = n("undo", "Desfazer", () => this.chart.drawings.undo(), "Ctrl + Z"), this.els.redo = n("redo", "Refazer", () => this.chart.drawings.redo(), "Ctrl + Y"), t.push([this.els.undo, this.els.redo]));
		let r = [];
		return t.forEach((e, t) => {
			t > 0 && r.push(U("div", { class: "tc-tb-sep" }));
			for (let t of e) t && r.push(t);
		}), U("header", { class: "tc-topbar" }, U("div", {
			class: "tc-topbar__logo",
			html: Q("logo")
		}), ...r, U("div", { class: "tc-tb-spacer" }), e.brand ? U("div", { class: "tc-tb-brand" }, e.brand) : null, e.screenshot ? n("camera", "Captura de ecrã", () => this.screenshot()) : null, e.fullscreen ? n("fullscreen", "Ecrã inteiro", () => document.fullscreenElement ? document.exitFullscreen() : this.root.requestFullscreen()) : null, e.watchlist === !1 ? null : n("watchlist", "Lista de observação", () => this.toggleWatchlist()));
	}
	selectableTimeframes(e = this.currentSymbolInfo()) {
		let t = e?.timeframes?.map(L).filter((e) => !!e), n = t?.length ? t : this.timeframes, r = this.opts.timeframeSelector;
		if (!Array.isArray(r)) return n;
		let i = r.map((e) => L(e)?.id ?? e), a = n.filter((e) => i.includes(e.id));
		return a.length ? a : n;
	}
	currentSymbolInfo() {
		let e = this.chart?.symbol.symbol;
		return e ? this.symbols.find((t) => t.symbol === e) : void 0;
	}
	syncTfFloat() {
		let e = this.els.tfFloat;
		if (!e) return;
		e.innerHTML = "";
		let t = this.selectableTimeframes();
		if (t.length < 2) {
			e.style.display = "none";
			return;
		}
		if (e.style.display = "", t.length <= 6) {
			for (let n of t) {
				let t = U("button", {
					class: `tc-tf-float__btn${n.id === this.tf.id ? " is-active" : ""}`,
					onclick: () => void this.setTimeframe(n)
				}, n.short);
				q(t, n.label), e.append(t);
			}
			return;
		}
		let n = U("button", { class: "tc-tf-float__btn is-active" }, U("span", {}, this.tf.short), U("span", {
			class: "tc-tf-float__caret",
			html: Q("chevronDown")
		}));
		n.addEventListener("click", () => K(J(t.map((e) => ({
			label: e.label,
			active: e.id === this.tf.id,
			action: () => void this.setTimeframe(e)
		}))), n)), q(n, "Intervalo de tempo"), e.append(n);
	}
	syncTopbar() {
		this.syncTfFloat();
		let e = this.chart.symbol, t = this.els.symbol?.querySelector(".tc-tb-symbol__name");
		t && (t.textContent = e.symbol), this.els.ctype && (this.els.ctype.innerHTML = Q(this.chart.chartType));
		let n = this.els.tfs;
		if (!n) return;
		n.innerHTML = "";
		let r = Array.isArray(this.opts.timeframeSelector), i = this.selectableTimeframes().filter((e) => r || this.state.favorites.includes(e.id) || e.id === this.tf.id);
		for (let e of i) {
			let t = U("button", {
				class: `tc-tb-btn tc-tb-tf${e.id === this.tf.id ? " is-active" : ""}`,
				onclick: () => this.setTimeframe(e)
			}, e.short);
			q(t, e.label), n.append(t);
		}
		this.els.ctype.innerHTML = Q(this.chart.chartType);
	}
	showTimeframeMenu(e) {
		let t = U("div", { class: "tc-menu tc-tf-menu" });
		t.append(U("div", { class: "tc-menu__title" }, "Intervalos"));
		for (let n of this.selectableTimeframes()) {
			let r = this.state.favorites.includes(n.id), i = U("span", {
				class: `tc-tf-star${r ? " is-fav" : ""}`,
				text: "★"
			});
			i.addEventListener("click", (t) => {
				t.stopPropagation(), this.state.favorites = r ? this.state.favorites.filter((e) => e !== n.id) : [...this.state.favorites, n.id], this.save(), this.syncTopbar(), G(), this.showTimeframeMenu(e);
			}), t.append(U("button", {
				class: `tc-menu__item${n.id === this.tf.id ? " is-active" : ""}`,
				onclick: () => {
					G(), this.setTimeframe(n);
				}
			}, U("span", { class: "tc-menu__label" }, n.label), i));
		}
		K(t, e);
	}
	buildLeftToolbar() {
		let e = U("aside", { class: "tc-left-toolbar" });
		this.els.left = e, e.append(this.groupButton("cursor"));
		let t = this.opts.drawingTools;
		this.toolGroups = rt.map((e) => ({
			...e,
			tools: Array.isArray(t) ? e.tools.filter((e) => t.includes(e.id)) : e.tools
		})).filter((e) => e.tools.length > 0 && t !== !1);
		for (let t of this.toolGroups) e.append(this.groupButton(t.id));
		e.append(U("div", { class: "tc-lt-sep" }));
		let n = U("button", {
			class: "tc-lt-btn",
			html: Q("zoomIn"),
			onclick: () => this.chart.zoomStep(1)
		});
		q(n, "Ampliar"), e.append(n);
		let r = U("div", { class: "tc-lt-item" }), i = U("button", {
			class: "tc-lt-btn",
			onclick: () => this.setMagnet(this.chart.drawings.magnet === "off" ? "weak" : "off")
		}), a = U("button", {
			class: "tc-lt-arrow",
			html: Q("chevronRight")
		});
		a.addEventListener("click", () => K(J([{
			label: "Íman fraco",
			icon: Q("magnet"),
			active: this.chart.drawings.magnet === "weak",
			action: () => this.setMagnet("weak")
		}, {
			label: "Íman forte",
			icon: Q("magnetStrong"),
			active: this.chart.drawings.magnet === "strong",
			action: () => this.setMagnet("strong")
		}]), a, { side: "right" })), q(i, "Modo íman: ajusta os pontos ao OHLC"), r.append(i, a), this.els.magnet = i, e.append(r);
		let o = U("button", {
			class: "tc-lt-btn",
			html: Q("stayDrawing"),
			onclick: () => {
				this.state.stay = !this.state.stay, this.chart.drawings.stayInDrawMode = this.state.stay, this.save(), this.syncLeftToolbar();
			}
		});
		q(o, "Manter o modo de desenho"), this.els.stay = o;
		let s = U("button", {
			class: "tc-lt-btn",
			onclick: () => {
				let e = this.chart.drawings;
				e.lockAll = !e.lockAll, this.syncLeftToolbar(), this.chart.requestRender();
			}
		});
		q(s, "Bloquear todos os desenhos"), this.els.lock = s;
		let c = U("button", {
			class: "tc-lt-btn",
			onclick: () => {
				let e = this.chart.drawings;
				e.hideAll = !e.hideAll, e.select(null), this.syncLeftToolbar(), this.chart.requestRender();
			}
		});
		q(c, "Ocultar todos os desenhos"), this.els.hide = c;
		let l = U("button", {
			class: "tc-lt-btn",
			html: Q("trash")
		});
		return l.addEventListener("click", () => K(J([
			{
				label: `Remover ${this.chart.drawings.drawings.length} desenho(s)`,
				icon: Q("trash"),
				action: () => this.chart.drawings.clearAll()
			},
			{
				label: `Remover ${this.chart.indicators.length} indicador(es)`,
				icon: Q("indicators"),
				action: () => this.removeAllIndicators()
			},
			{
				separator: !0,
				label: ""
			},
			{
				label: "Remover desenhos e indicadores",
				danger: !0,
				action: () => {
					this.chart.drawings.clearAll(), this.removeAllIndicators();
				}
			}
		]), l, { side: "right" })), q(l, "Remover objetos"), e.append(o, s, c, U("div", { class: "tc-lt-sep" }), l), e;
	}
	groupButton(e) {
		let t = U("div", {
			class: "tc-lt-item",
			"data-group": e
		}), n = U("button", { class: "tc-lt-btn" }), r = U("button", {
			class: "tc-lt-arrow",
			html: Q("chevronRight")
		});
		n.addEventListener("click", () => {
			if (e === "cursor") {
				this.chart.drawings.setTool(null), this.syncLeftToolbar();
				return;
			}
			let t = this.currentGroupTool(e), n = this.chart.drawings;
			n.setTool(n.tool === t ? null : t);
		}), r.addEventListener("click", () => {
			let t;
			t = e === "cursor" ? Cr.map((e) => ({
				label: e.label,
				icon: Q(e.icon),
				active: this.chart.cursorMode === e.id,
				action: () => {
					this.chart.cursorMode = e.id, this.chart.drawings.setTool(null), this.syncLeftToolbar();
				}
			})) : this.toolGroups.find((t) => t.id === e).tools.map((t) => ({
				label: t.title,
				icon: Q(t.icon),
				hotkey: t.hotkey,
				active: this.chart.drawings.tool === t.id,
				action: () => {
					this.state.groupTools[e] = t.id, this.save(), this.chart.drawings.setTool(t.id);
				}
			})), K(J(t), r, {
				side: "right",
				className: "tc-popover--tools"
			});
		}), t.append(n, r);
		let i = this.toolGroups.find((t) => t.id === e);
		return q(n, e === "cursor" ? "Cursor" : i?.title ?? ""), t;
	}
	toolAllowed(e) {
		return this.toolGroups.some((t) => t.tools.some((t) => t.id === e));
	}
	currentGroupTool(e) {
		let t = this.toolGroups.find((t) => t.id === e), n = this.state.groupTools[e];
		return t.tools.some((e) => e.id === n) ? n : t.tools[0].id;
	}
	syncLeftToolbar() {
		if (!this.els.left) return;
		let e = this.chart.drawings;
		this.els.left.querySelectorAll(".tc-lt-item[data-group]").forEach((t) => {
			let n = t.dataset.group, r = t.querySelector(".tc-lt-btn");
			if (n === "cursor") {
				r.innerHTML = Q(Cr.find((e) => e.id === this.chart.cursorMode).icon), r.classList.toggle("is-active", !e.tool);
				return;
			}
			let i = this.toolGroups.find((e) => e.id === n).tools.find((t) => t.id === e.tool);
			i && (this.state.groupTools[n] = i.id), r.innerHTML = Q(N(this.currentGroupTool(n)).icon), r.classList.toggle("is-active", !!i);
		});
		let t = e.magnet;
		this.els.magnet.innerHTML = Q(t === "strong" ? "magnetStrong" : "magnet"), this.els.magnet.classList.toggle("is-active", t !== "off"), this.els.stay.classList.toggle("is-active", e.stayInDrawMode), this.els.lock.innerHTML = Q(e.lockAll ? "lock" : "unlock"), this.els.lock.classList.toggle("is-active", e.lockAll), this.els.hide.innerHTML = Q(e.hideAll ? "eyeOff" : "eye"), this.els.hide.classList.toggle("is-active", e.hideAll);
	}
	setMagnet(e) {
		this.chart.drawings.magnet = e, this.state.magnet = e, this.save(), this.syncLeftToolbar();
	}
	buildBottomBar() {
		let e = [
			{
				label: "1D",
				tf: "1",
				bars: 1440,
				tip: "1 dia em intervalos de 1 minuto"
			},
			{
				label: "5D",
				tf: "5",
				bars: 1440,
				tip: "5 dias em intervalos de 5 minutos"
			},
			{
				label: "1M",
				tf: "30",
				bars: 1440,
				tip: "1 mês em intervalos de 30 minutos"
			},
			{
				label: "3M",
				tf: "60",
				bars: 2160,
				tip: "3 meses em intervalos de 1 hora"
			},
			{
				label: "YTD",
				tf: "1D",
				bars: "ytd",
				tip: "Desde o início do ano"
			},
			{
				label: "Tudo",
				tf: "1D",
				bars: "all",
				tip: "Todo o histórico"
			}
		], t = U("div", { class: "tc-bb-group" }), n = this.selectableTimeframes();
		for (let r of this.opts.rangeButtons ? e.filter((e) => n.some((t) => t.id === e.tf)) : []) {
			let e = U("button", {
				class: "tc-bb-btn",
				onclick: async () => {
					await this.setTimeframe(r.tf);
					let e = this.chart.timeZone, t = l(e, e.wall(Date.now() / 1e3).getUTCFullYear(), 0, 1);
					if (r.bars === "ytd") await this.chart.ensureHistory(t);
					else if (r.bars === "all") for (let e = 0; e < 50 && !this.chart.history.noMoreBack && !(await this.chart.history.loadBack() < 0); e++);
					else await this.chart.ensureHistory(this.chart.bars[this.chart.bars.length - 1]?.time - r.bars * this.tf.seconds);
					let n = this.chart.data.length, i;
					i = r.bars === "all" ? n : r.bars === "ytd" ? n - Math.max(0, this.chart.data.indexAt(t)) : r.bars, this.chart.showLastBars(Math.min(n, i));
				}
			}, r.label);
			q(e, r.tip), t.append(e);
		}
		let r = U("button", {
			class: "tc-bb-btn tc-bb-clock",
			onclick: () => this.openTimezoneMenu()
		});
		q(r, "Fuso horário"), this.els.clock = r;
		let i = (e, t, n) => {
			let r = U("button", {
				class: "tc-bb-btn tc-bb-toggle",
				onclick: n
			}, e);
			return q(r, t), r;
		};
		return this.els.pct = i("%", "Escala de percentagem", () => this.chart.setPercent(!this.chart.percentMode)), this.els.log = i("log", "Escala logarítmica", () => this.chart.setLog(!this.chart.mainPane.ps.log)), this.els.auto = i("auto", "Escala automática", () => this.chart.setAutoScale(!this.chart.mainPane.ps.auto)), U("footer", { class: "tc-bottombar" }, t, U("div", { class: "tc-tb-spacer" }), r, U("div", { class: "tc-bb-sep" }), this.els.pct, this.els.log, this.els.auto);
	}
	syncBottomToggles() {
		if (!this.chart || !this.els.pct) return;
		let e = this.chart.mainPane.ps;
		this.els.pct.classList.toggle("is-active", this.chart.percentMode), this.els.log.classList.toggle("is-active", e.log), this.els.auto.classList.toggle("is-active", e.auto);
	}
	updateClock() {
		let e = this.chart.timeZone, t = Date.now() / 1e3, n = e.wall(t), r = this.chart.timezone === "local" ? "" : `${this.chart.timezone === "exchange" ? e.id : this.chart.timezone} `;
		this.els.clock.textContent = `${S(n.getUTCHours())}:${S(n.getUTCMinutes())}:${S(n.getUTCSeconds())} (${r}${e.label(t)})`;
	}
	openTimezoneMenu() {
		let e = [...this.opts.timezones], t = this.chart.timezone;
		e.some((e) => e.id === t) || e.push({
			id: t,
			label: t
		});
		let n = Date.now() / 1e3;
		K(J(e.filter((e) => this.validZone(e.id)).map((e) => {
			let r = e.id === "exchange" ? this.chart.symbol.timezone || "UTC" : e.id, i = e.label;
			try {
				let t = new c(r);
				i = `${e.label}  (${e.id === "exchange" && r !== "UTC" ? `${r} ` : ""}${t.label(n)})`;
			} catch {}
			return {
				label: i,
				active: e.id === t,
				action: () => this.setTimezone(e.id)
			};
		})), this.els.clock, { side: "top" });
	}
	validZone(e) {
		try {
			return s(e), !0;
		} catch {
			return !1;
		}
	}
	setTimezone(e) {
		this.chart.setTimezone(e);
	}
	get timezone() {
		return this.chart.timezone;
	}
	buildRightPanel() {
		let e = U("div", { class: "tc-wl-list" });
		this.els.wlList = e;
		let t = U("div", { class: "tc-details" });
		this.els.details = t;
		let n = U("aside", { class: `tc-right-panel${this.state.showWatchlist ? "" : " is-hidden"}` }, U("div", { class: "tc-rp-header" }, U("span", { class: "tc-rp-title" }, "Lista de observação")), U("div", { class: "tc-wl-head" }, U("span", {}, "Símbolo"), U("span", {}, "Último"), U("span", {}, "Var"), U("span", {}, "Var%")), e, t);
		return this.els.right = n, n;
	}
	watchlistSymbols() {
		let e = this.opts.watchlist;
		return Array.isArray(e) ? e.map((e) => this.symbols.find((t) => t.symbol === e)).filter((e) => !!e) : this.symbols;
	}
	buildWatchlistRows() {
		let e = this.els.wlList;
		if (e) {
			e.innerHTML = "", this.watchRows.clear();
			for (let t of this.watchlistSymbols()) {
				let n = U("span", { class: "tc-wl-num" }, "—"), r = U("span", { class: "tc-wl-num" }, ""), i = U("span", { class: "tc-wl-num" }, ""), a = U("button", {
					class: "tc-wl-row",
					onclick: () => this.setSymbol(t.symbol)
				}, U("span", { class: "tc-wl-sym" }, U("span", {
					class: "tc-sym-badge",
					"data-type": t.type ?? ""
				}, t.symbol.slice(0, 1)), t.symbol), n, r, i);
				this.watchRows.set(t.symbol, {
					row: a,
					last: n,
					chg: r,
					pct: i,
					prev: NaN
				}), e.append(a);
			}
		}
	}
	toggleWatchlist() {
		this.els.right && (this.state.showWatchlist = !this.state.showWatchlist, this.els.right.classList.toggle("is-hidden", !this.state.showWatchlist), this.save());
	}
	updateWatchActive() {
		for (let [e, t] of this.watchRows) t.row.classList.toggle("is-active", this.chart.symbol.symbol === e);
	}
	precisionOf(e) {
		return this.symbols.find((t) => t.symbol === e)?.precision ?? 2;
	}
	updateWatchRow(e) {
		let t = this.watchRows.get(e.symbol);
		if (!t) return;
		let n = this.precisionOf(e.symbol);
		t.last.textContent = f(e.last, n), t.chg.textContent = (e.change >= 0 ? "" : "−") + f(Math.abs(e.change), n), t.pct.textContent = (e.changePct >= 0 ? "+" : "−") + Math.abs(e.changePct).toFixed(2) + "%";
		let r = e.change >= 0 ? "is-up" : "is-down";
		t.chg.className = `tc-wl-num ${r}`, t.pct.className = `tc-wl-num ${r}`, isFinite(t.prev) && t.prev !== e.last && (t.last.classList.remove("flash-up", "flash-down"), t.last.offsetWidth, t.last.classList.add(e.last > t.prev ? "flash-up" : "flash-down")), t.prev = e.last;
	}
	activeQuote() {
		let e = this.chart.symbol.symbol, t = this.chart.bars, n = t[t.length - 1];
		if (!n) return this.quotes.get(e) ?? null;
		let r = this.quotes.get(e);
		if (r) return {
			...r,
			last: n.close
		};
		let i = n.time - 86400, a = t.length - 1, o = -Infinity, s = Infinity, c = 0;
		for (; a >= 0 && t[a].time > i;) o = Math.max(o, t[a].high), s = Math.min(s, t[a].low), c += t[a].volume, a--;
		let l = t[Math.max(0, a + 1)].open, u = n.close - l;
		return {
			symbol: e,
			last: n.close,
			change: u,
			changePct: u / l * 100,
			open: l,
			high: o,
			low: s,
			volume: c
		};
	}
	renderDetails() {
		let e = this.els.details;
		if (!e) return;
		let t = this.chart.symbol, n = this.activeQuote();
		if (e.innerHTML = "", !n) return;
		let r = t.precision, i = n.change >= 0, a = (e) => e === void 0 || !isFinite(e) ? "—" : p(e, r);
		e.append(U("div", { class: "tc-details__head" }, U("span", {
			class: "tc-sym-badge tc-sym-badge--lg",
			"data-type": t.type ?? ""
		}, t.symbol.slice(0, 1)), U("div", {}, U("div", { class: "tc-details__sym" }, t.symbol), U("div", { class: "tc-details__name" }, [t.name, t.exchange].filter(Boolean).join(" · ")))), U("div", { class: "tc-details__price" }, U("span", { class: "tc-details__last" }, a(n.last)), t.currency ? U("span", { class: "tc-details__ccy" }, t.currency) : null, U("span", { class: `tc-details__chg ${i ? "is-up" : "is-down"}` }, `${i ? "+" : "−"}${p(Math.abs(n.change), r)}  ${i ? "+" : "−"}${Math.abs(n.changePct).toFixed(2)}%`)), U("div", { class: "tc-details__status" }, U("span", { class: "tc-dot-live" }), "Em tempo real"), U("div", { class: "tc-details__stats" }, Tr("Máx. 24h", a(n.high)), Tr("Mín. 24h", a(n.low)), Tr("Abertura 24h", a(n.open)), Tr("Volume 24h", n.volume === void 0 ? "—" : m(n.volume)))), n.high !== void 0 && n.low !== void 0 && e.append(Er(n.low, n.high, n.last));
	}
	renderFloating(e) {
		let t = this.floating;
		if (t.innerHTML = "", !e) {
			t.classList.remove("is-visible");
			return;
		}
		let n = this.chart.drawings;
		t.classList.add("is-visible");
		let r = U("div", { class: "tc-ft-grip" });
		this.makeDraggable(r), t.append(r);
		let i = e.settings().map((e) => e.key), a = i.includes("color"), o = i.includes("fill") || i.includes("fillEnabled");
		if (a) {
			let r = U("button", { class: "tc-ft-btn tc-ft-color" }, U("span", { html: Q("trendline") }), U("span", {
				class: "tc-ft-color__bar",
				style: `background:${e.opts.color}`
			}));
			r.addEventListener("click", () => K(Zn(e.opts.color, (t) => n.updateOptions(e, { color: t })), r)), q(r, "Cor da linha"), t.append(r);
		}
		if (o) {
			let r = U("button", { class: "tc-ft-btn tc-ft-color" }, U("span", { html: Q("rect") }), U("span", {
				class: "tc-ft-color__bar",
				style: `background:${e.opts.fill}`
			}));
			r.addEventListener("click", () => K(Zn(e.opts.fill, (t) => n.updateOptions(e, {
				fill: t,
				fillEnabled: !0
			})), r)), q(r, "Cor de fundo"), t.append(r);
		}
		if (e.type === "text") {
			let r = U("button", { class: "tc-ft-btn tc-ft-color" }, U("span", { html: Q("text") }), U("span", {
				class: "tc-ft-color__bar",
				style: `background:${e.opts.textColor}`
			}));
			r.addEventListener("click", () => K(Zn(e.opts.textColor, (t) => n.updateOptions(e, { textColor: t })), r)), t.append(r);
		}
		if (i.includes("width")) {
			let r = U("button", { class: "tc-ft-btn tc-ft-width" }, U("span", {
				class: "tc-ft-width__line",
				style: `height:${e.opts.width}px`
			}), U("span", {}, `${e.opts.width}px`));
			r.addEventListener("click", () => K(J([
				1,
				2,
				3,
				4
			].map((t) => ({
				label: `${t}px`,
				active: e.opts.width === t,
				icon: `<span class="w-sample" style="height:${t}px"></span>`,
				action: () => n.updateOptions(e, { width: t })
			}))), r)), q(r, "Espessura"), t.append(r);
		}
		if (i.includes("dash")) {
			let r = {
				solid: "———",
				dashed: "- - -",
				dotted: "·····"
			}, i = U("button", { class: "tc-ft-btn tc-ft-dash" }, r[e.opts.dash]);
			i.addEventListener("click", () => K(J([
				"solid",
				"dashed",
				"dotted"
			].map((t) => ({
				label: r[t],
				active: e.opts.dash === t,
				action: () => n.updateOptions(e, { dash: t })
			}))), i)), q(i, "Estilo"), t.append(i);
		}
		let s = U("button", {
			class: "tc-ft-btn",
			html: Q("settings"),
			onclick: () => e.type === "text" ? mr(this.chart, e) : dr(this.chart, e)
		});
		q(s, "Definições");
		let c = U("button", {
			class: `tc-ft-btn${e.locked ? " is-active" : ""}`,
			html: Q(e.locked ? "lock" : "unlock"),
			onclick: () => {
				n.checkpoint(), e.locked = !e.locked, n.commit();
			}
		});
		q(c, e.locked ? "Desbloquear" : "Bloquear");
		let l = U("button", {
			class: "tc-ft-btn",
			html: Q("trash"),
			onclick: () => n.remove(e)
		});
		q(l, "Remover", "Del");
		let u = U("button", {
			class: "tc-ft-btn",
			html: Q("more")
		});
		u.addEventListener("click", () => K(J(this.drawingMenuItems(e)), u)), t.append(s, c, l, u), this.positionFloating();
	}
	makeDraggable(e) {
		e.addEventListener("pointerdown", (e) => {
			e.preventDefault();
			let t = this.floating, n = t.parentElement.getBoundingClientRect(), r = t.getBoundingClientRect(), i = e.clientX - r.left, a = e.clientY - r.top, o = (e) => {
				let o = Math.max(0, Math.min(e.clientX - n.left - i, n.width - r.width)), s = Math.max(0, Math.min(e.clientY - n.top - a, n.height - r.height));
				this.state.toolbarPos = {
					x: o,
					y: s
				}, t.style.left = `${o}px`, t.style.top = `${s}px`, t.style.transform = "none";
			}, s = () => {
				window.removeEventListener("pointermove", o), window.removeEventListener("pointerup", s), this.save();
			};
			window.addEventListener("pointermove", o), window.addEventListener("pointerup", s);
		});
	}
	positionFloating() {
		let e = this.floating, t = this.state.toolbarPos;
		t ? (e.style.left = `${t.x}px`, e.style.top = `${t.y}px`, e.style.transform = "none") : (e.style.left = "50%", e.style.top = "40px", e.style.transform = "translateX(-50%)");
	}
	drawingMenuItems(e) {
		let t = this.chart.drawings;
		return [
			{
				label: "Definições…",
				icon: Q("settings"),
				action: () => e.type === "text" ? mr(this.chart, e) : dr(this.chart, e)
			},
			{
				label: "Clonar",
				icon: Q("copy"),
				hotkey: "Ctrl + C/V",
				action: () => t.clone(e)
			},
			{
				separator: !0,
				label: ""
			},
			{
				label: "Trazer para a frente",
				icon: Q("front"),
				action: () => t.bringToFront(e)
			},
			{
				label: "Enviar para trás",
				icon: Q("back"),
				action: () => t.sendToBack(e)
			},
			{
				label: e.locked ? "Desbloquear" : "Bloquear",
				icon: Q(e.locked ? "unlock" : "lock"),
				action: () => {
					t.checkpoint(), e.locked = !e.locked, t.commit();
				}
			},
			{
				label: "Ocultar",
				icon: Q("eyeOff"),
				action: () => {
					t.checkpoint(), e.hidden = !0, t.select(null), t.commit();
				}
			},
			{
				separator: !0,
				label: ""
			},
			{
				label: "Remover",
				icon: Q("trash"),
				hotkey: "Del",
				danger: !0,
				action: () => t.remove(e)
			}
		];
	}
	showContextMenu(e, t, n) {
		let r;
		if (n) r = this.drawingMenuItems(n);
		else {
			let e = this.chart.drawings;
			r = [
				{
					label: "Repor vista do gráfico",
					icon: Q("fullscreen"),
					hotkey: "Alt + R",
					action: () => this.chart.resetView()
				},
				{
					separator: !0,
					label: ""
				},
				{
					label: "Adicionar indicador…",
					icon: Q("indicators"),
					action: () => this.openIndicators()
				},
				{
					label: "Mostrar desenhos ocultos",
					icon: Q("eye"),
					action: () => {
						e.checkpoint(), e.drawings.forEach((e) => e.hidden = !1), e.hideAll = !1, e.commit(), this.syncLeftToolbar();
					}
				},
				{
					separator: !0,
					label: ""
				},
				{
					label: "Remover todos os desenhos",
					icon: Q("trash"),
					danger: !0,
					action: () => e.clearAll()
				},
				{
					label: "Remover todos os indicadores",
					icon: Q("trash"),
					danger: !0,
					action: () => this.removeAllIndicators()
				}
			];
		}
		K(J(r), {
			x: e,
			y: t
		});
	}
	async setSymbol(e) {
		if (this.chart.symbol.symbol === e) return;
		let t = this.symbols.find((t) => t.symbol === e);
		if (!t) throw Error(`openchartscandle: unknown symbol "${e}"`);
		this.state.symbol = e, this.save(), await this.load(t);
	}
	async setTimeframe(e) {
		let t = typeof e == "string" ? this.selectableTimeframes().find((t) => t.id === e) ?? L(e) : e;
		if (!t || t.id === this.tf.id) return;
		let n = this.keepTime();
		this.tf = t, this.state.tf = t.id, this.save(), this.timeframeChanged.emit(t), await this.load(this.chart.symbol, n);
	}
	get timeframe() {
		return this.tf;
	}
	setChartType(e) {
		this.state.chartType = e, this.chart.setChartType(e), this.save(), this.syncTopbar(), this.legend?.update();
	}
	removeAllIndicators() {
		for (let e of [...this.chart.indicators]) this.removeIndicator(e);
		this.save();
	}
	syncUndo() {
		if (!this.els.undo) return;
		let e = this.chart.drawings;
		this.els.undo.classList.toggle("is-disabled", !e.canUndo()), this.els.redo.classList.toggle("is-disabled", !e.canRedo());
	}
	screenshot() {
		let e = this.chart.screenshot(), t = document.createElement("a"), n = /* @__PURE__ */ new Date();
		t.href = e, t.download = `${this.chart.symbol.symbol}_${n.getFullYear()}-${S(n.getMonth() + 1)}-${S(n.getDate())}_${S(n.getHours())}-${S(n.getMinutes())}.png`, t.click();
	}
	onKey(e) {
		let t = e.target;
		if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable) || document.querySelector(".tc-modal-backdrop")) return;
		let n = this.chart.drawings, r = e.ctrlKey || e.metaKey, i = e.key.toLowerCase();
		if (r && i === "z" && !e.shiftKey) e.preventDefault(), n.undo();
		else if (r && (i === "y" || i === "z" && e.shiftKey)) e.preventDefault(), n.redo();
		else if (r && i === "c") n.copySelected();
		else if (r && i === "v") n.paste(this.chart.mainView());
		else {
			if (e.altKey && !r) {
				let t = {
					t: "trendline",
					h: "hline",
					j: "hray",
					v: "vline",
					c: "crossline",
					f: "fib"
				};
				if (t[i] && this.toolAllowed(t[i])) {
					e.preventDefault(), n.setTool(t[i]);
					return;
				}
				if (i === "r") {
					e.preventDefault(), this.chart.resetView();
					return;
				}
			}
			switch (e.key) {
				case "Delete":
				case "Backspace":
					n.selected && (e.preventDefault(), n.deleteSelected());
					return;
				case "Escape":
					if (G(), this.tfTypingEl) {
						this.cancelTfTyping();
						return;
					}
					n.creating ? n.cancelCreation() : n.tool ? n.setTool(null) : n.select(null);
					return;
				case "Enter":
					if (this.tfTypingEl) {
						this.applyTfTyping();
						return;
					}
					n.creating && n.finishCreation();
					return;
				case "ArrowLeft":
					this.chart.scrollBars(e.shiftKey ? 10 : 1);
					return;
				case "ArrowRight":
					this.chart.scrollBars(e.shiftKey ? -10 : -1);
					return;
				case "ArrowUp":
					e.preventDefault(), this.chart.zoomStep(1);
					return;
				case "ArrowDown":
					e.preventDefault(), this.chart.zoomStep(-1);
					return;
			}
			!r && !e.altKey && /^[0-9dwhDWH]$/.test(e.key) && this.tfTypingKey(e.key);
		}
	}
	tfTypingKey(e) {
		this.tfTyping += e.toUpperCase(), this.tfTypingEl || (this.tfTypingEl = U("div", { class: "tc-tf-typing" }), document.querySelector(".tc-chart-wrap")?.append(this.tfTypingEl)), this.tfTypingEl.innerHTML = "", this.tfTypingEl.append(U("div", { class: "tc-tf-typing__label" }, "Alterar intervalo"), U("div", { class: "tc-tf-typing__value" }, this.tfTyping)), clearTimeout(this.tfTypingTimer), this.tfTypingTimer = window.setTimeout(() => this.applyTfTyping(), 2200);
	}
	applyTfTyping() {
		let e = this.tfTyping;
		this.cancelTfTyping();
		let t = e, n = e.match(/^(\d+)H$/);
		n && (t = String(Number(n[1]) * 60)), (e === "D" || e === "1D") && (t = "1D"), (e === "W" || e === "1W") && (t = "1W");
		let r = this.selectableTimeframes().find((e) => e.id === t);
		r && this.setTimeframe(r);
	}
	cancelTfTyping() {
		clearTimeout(this.tfTypingTimer), this.tfTyping = "", this.tfTypingEl?.remove(), this.tfTypingEl = null;
	}
};
function Tr(e, t) {
	return U("div", { class: "tc-stat" }, U("span", { class: "tc-stat__label" }, e), U("span", { class: "tc-stat__value" }, t));
}
function Er(e, t, n) {
	let r = t > e ? (n - e) / (t - e) * 100 : 50;
	return U("div", { class: "tc-range-bar" }, U("div", { class: "tc-range-bar__label" }, "Intervalo 24h"), U("div", { class: "tc-range-bar__track" }, U("div", {
		class: "tc-range-bar__marker",
		style: `left:${r}%`
	})));
}
//#endregion
//#region src/candlestick/index.ts
function Dr(e, t = {}) {
	return new Zt(e, t);
}
function Or(e, t) {
	return new wr(e, t);
}
function kr(e) {
	Object.assign(n, i(e, n));
}
//#endregion
export { e as A, mt as C, rt as D, it as E, r as M, N as O, P as S, ot as T, $t as _, yr as a, Pt as b, _n as c, tn as d, rn as f, L as g, I as h, wr as i, t as j, o as k, Bn as l, an as m, Or as n, br as o, nn as p, kr as r, zn as s, Dr as t, H as u, Zt as v, st as w, ft as x, Nt as y };

//# sourceMappingURL=candlestick.js.map