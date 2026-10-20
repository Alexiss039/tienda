// SHA-256 en JavaScript puro (funciona también sin HTTPS). Se usa para hash de claves (RNF-01)
// y para la firma de las notificaciones de pago (RNF-02).
const sha256 = (function () {
  const K = [];
  const H0 = [];
  const fraccion = (x) => Math.floor((x - Math.floor(x)) * 4294967296);

  for (let n = 2; K.length < 64; n++) {
    let primo = true;
    for (let i = 2; i * i <= n; i++) {
      if (n % i === 0) { primo = false; break; }
    }
    if (!primo) continue;
    if (H0.length < 8) H0.push(fraccion(Math.sqrt(n)));
    K.push(fraccion(Math.pow(n, 1 / 3)));
  }

  const rotr = (x, n) => (x >>> n) | (x << (32 - n));

  return function (texto) {
    const bytes = Array.from(new TextEncoder().encode(texto));
    const bits = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const alto = Math.floor(bits / 4294967296);
    const bajo = bits >>> 0;
    for (let i = 3; i >= 0; i--) bytes.push((alto >>> (i * 8)) & 255);
    for (let i = 3; i >= 0; i--) bytes.push((bajo >>> (i * 8)) & 255);

    const H = H0.slice();
    const w = new Array(64);
    for (let o = 0; o < bytes.length; o += 64) {
      for (let i = 0; i < 16; i++) {
        w[i] = ((bytes[o + 4 * i] << 24) | (bytes[o + 4 * i + 1] << 16) |
                (bytes[o + 4 * i + 2] << 8) | bytes[o + 4 * i + 3]) >>> 0;
      }
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const mj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + mj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      [a, b, c, d, e, f, g, h].forEach((v, i) => { H[i] = (H[i] + v) >>> 0; });
    }
    return H.map((v) => v.toString(16).padStart(8, '0')).join('');
  };
})();
