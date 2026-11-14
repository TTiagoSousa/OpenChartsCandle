//#region src/shared/color.ts
var e = (e) => Math.min(1, Math.max(0, e));
function t(e) {
	let n = e.trim().toLowerCase();
	if (n[0] === "#") {
		let e = n.slice(1);
		(e.length === 3 || e.length === 4) && (e = [...e].map((e) => e + e).join(""));
		let t = parseInt(e.slice(0, 6), 16);
		return [
			t >> 16 & 255,
			t >> 8 & 255,
			t & 255,
			e.length === 8 ? parseInt(e.slice(6), 16) / 255 : 1
		];
	}
	let r = n.match(/^(rgba?|hsla?)\(([^)]+)\)$/);
	if (r) {
		let e = r[2].split(/[\s,/]+/).filter(Boolean).map((e) => parseFloat(e)), t = e[3] ?? 1;
		if (r[1].startsWith("rgb")) return [
			e[0],
			e[1],
			e[2],
			t
		];
		let [n, a, o] = i(e[0] / 360, e[1] / 100, e[2] / 100);
		return [
			n,
			a,
			o,
			t
		];
	}
	if (n === "transparent") return [
		0,
		0,
		0,
		0
	];
	if (typeof document < "u") {
		let e = document.createElement("canvas").getContext("2d");
		if (e && (e.fillStyle = n, e.fillStyle !== n)) return t(e.fillStyle);
	}
	return [
		128,
		128,
		128,
		1
	];
}
function n([e, t, n, r]) {
	let i = Math.round(e), a = Math.round(t), o = Math.round(n);
	return r >= 1 ? `rgb(${i}, ${a}, ${o})` : `rgba(${i}, ${a}, ${o}, ${+r.toFixed(3)})`;
}
function r(e, t, n) {
	e /= 255, t /= 255, n /= 255;
	let r = Math.max(e, t, n), i = Math.min(e, t, n), a = (r + i) / 2;
	if (r === i) return [
		0,
		0,
		a
	];
	let o = r - i, s = a > .5 ? o / (2 - r - i) : o / (r + i);
	return [
		(r === e ? (t - n) / o + (t < n ? 6 : 0) : r === t ? (n - e) / o + 2 : (e - t) / o + 4) / 6,
		s,
		a
	];
}
function i(e, t, n) {
	if (t === 0) return [
		n * 255,
		n * 255,
		n * 255
	];
	let r = n < .5 ? n * (1 + t) : n + t - n * t, i = 2 * n - r, a = (e) => (e = (e + 1) % 1, e < 1 / 6 ? i + (r - i) * 6 * e : e < 1 / 2 ? r : e < 2 / 3 ? i + (r - i) * (2 / 3 - e) * 6 : i);
	return [
		a(e + 1 / 3) * 255,
		a(e) * 255,
		a(e - 1 / 3) * 255
	];
}
function a(e, r, i) {
	let a = t(e), o = t(r);
	return n(a.map((e, t) => e + (o[t] - e) * i));
}
function o(t, n) {
	if (t.length === 1) return t[0];
	let r = e(n) * (t.length - 1), i = Math.min(t.length - 2, Math.floor(r));
	return a(t[i], t[i + 1], r - i);
}
function s(a, o, s, c) {
	let [l, u, d, f] = t(a), [p, m, h] = r(l, u, d), [g, _, v] = i(p, o === void 0 ? m : e(o), s === void 0 ? h : e(s));
	return n([
		g,
		_,
		v,
		c === void 0 ? f : e(c)
	]);
}
function c(a, o) {
	let [s, c, l, u] = t(a), [d, f, p] = r(s, c, l), [m, h, g] = i(d, f, e(p + o));
	return n([
		m,
		h,
		g,
		u
	]);
}
function l(e) {
	let [n, r, i] = t(e).map((e, t) => t < 3 ? e / 255 : e), a = (e) => e <= .03928 ? e / 12.92 : ((e + .055) / 1.055) ** 2.4;
	return .2126 * a(n) + .7152 * a(r) + .0722 * a(i);
}
//#endregion
export { t as a, a as i, o as n, c as o, l as r, n as s, s as t };

//# sourceMappingURL=color.js.map