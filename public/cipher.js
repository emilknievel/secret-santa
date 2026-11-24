// Tiny obfuscation so the pairings can't be read from the page source.
// Each person's link carries a random token; the token is needed to decode
// their match. Good enough to keep friends honest, not real cryptography.

const NAME_LEN = 16; // names are padded so their length doesn't leak

// cyrb53: small, fast 53-bit string hash.
function hash(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

const keyByte = (token, i) => hash(`${token}:${i}`, 7) & 0xff;

export const idFor = (token) => hash(token).toString(36);

export function seal(token, name) {
  if (name.length > NAME_LEN || /[^\x20-\x7e]/.test(name)) {
    throw new Error(`Name must be plain ASCII, max ${NAME_LEN} chars: ${name}`);
  }
  return [...name.padEnd(NAME_LEN)]
    .map((c, i) => (c.charCodeAt(0) ^ keyByte(token, i)).toString(16).padStart(2, "0"))
    .join("");
}

export function unseal(token, hex) {
  let out = "";
  for (let i = 0; i < hex.length / 2; i++) {
    out += String.fromCharCode(parseInt(hex.slice(i * 2, i * 2 + 2), 16) ^ keyByte(token, i));
  }
  return out.trimEnd();
}
