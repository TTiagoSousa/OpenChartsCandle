//#region src/shared/curve.ts
function e(e, t) {
	let n = e.length, r = Array(n).fill(0);
	if (n < 2) return r;
	let i = [];
	for (let r = 0; r < n - 1; r++) i.push((t[r + 1] - t[r]) / (e[r + 1] - e[r] || 1));
	r[0] = i[0], r[n - 1] = i[n - 2];
	for (let e = 1; e < n - 1; e++) r[e] = i[e - 1] * i[e] <= 0 ? 0 : (i[e - 1] + i[e]) / 2;
	for (let e = 0; e < n - 1; e++) {
		if (i[e] === 0) {
			r[e] = 0, r[e + 1] = 0;
			continue;
		}
		let t = r[e] / i[e], n = r[e + 1] / i[e], a = t * t + n * n;
		if (a > 9) {
			let o = 3 / Math.sqrt(a);
			r[e] = o * t * i[e], r[e + 1] = o * n * i[e];
		}
	}
	return r;
}
//#endregion
export { e as t };

//# sourceMappingURL=curve.js.map