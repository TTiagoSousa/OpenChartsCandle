//#region src/shared/format.ts
function e(e) {
	if (!(e > 0) || !Number.isFinite(e)) return 1;
	let t = 10 ** Math.floor(Math.log10(e)), n = e / t;
	return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * t;
}
function t(t, n, r) {
	if (!Number.isFinite(t) || !Number.isFinite(n)) return {
		min: 0,
		max: 1,
		ticks: [0, 1],
		step: 1
	};
	if (t === n) {
		let e = Math.abs(t) * .1 || 1;
		t -= e, n += e;
	}
	let i = e((n - t) / Math.max(1, r)), a = Math.floor(t / i + 1e-9) * i, o = Math.ceil(n / i - 1e-9) * i, s = [];
	for (let e = a; e <= o + i * 1e-6 && s.length < 100; e += i) s.push(+e.toPrecision(12));
	return {
		min: a,
		max: o,
		ticks: s,
		step: i
	};
}
function n(e, t = 2) {
	let n = Math.abs(e), r = (e, n) => `${+e.toFixed(t)}${n}`;
	return n >= 0xe8d4a51000 ? r(e / 0xe8d4a51000, "T") : n >= 1e9 ? r(e / 1e9, "B") : n >= 1e6 ? r(e / 1e6, "M") : n >= 1e4 ? r(e / 1e3, "K") : +e.toFixed(n >= 100 ? 0 : n >= 1 ? 2 : 4) + "";
}
//#endregion
export { t as n, e as r, n as t };

//# sourceMappingURL=format.js.map