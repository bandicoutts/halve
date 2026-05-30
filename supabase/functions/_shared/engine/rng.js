/** mulberry32 — small, fast, good-enough 32-bit PRNG returning [0,1). */
export function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/** Hash an arbitrary string/number seed into a 32-bit integer (FNV-1a). */
export function hashSeed(seed) {
    const str = String(seed);
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}
/** Integer in [0, n). */
export function randInt(rng, n) {
    return Math.floor(rng() * n);
}
/** In-place Fisher–Yates shuffle; returns the same array. */
export function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = randInt(rng, i + 1);
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}
//# sourceMappingURL=rng.js.map