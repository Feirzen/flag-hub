// One-time setup: makes the Claude OS key pair.
// Usage: node keygen.mjs "your passcode" > ../data/key.json
// The public key goes in seal.mjs (printed to stderr). The private key is saved
// locked with the passcode, so only a device that knows the passcode can read messages.
const { subtle } = globalThis.crypto;
const b64 = u => Buffer.from(u).toString("base64");
const norm = s => String(s).toLowerCase().replace(/\s+/g, "");
const pass = norm(process.argv[2] || "");
if (pass.length < 6) { console.error("Passcode must be at least 6 characters."); process.exit(1); }

const pair = await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
const pub = await subtle.exportKey("jwk", pair.publicKey);
const priv = await subtle.exportKey("jwk", pair.privateKey);
for (const k of [pub, priv]) { delete k.key_ops; delete k.ext; }

const iter = 310000;
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
const wrapKey = await subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const ct = await subtle.encrypt({ name: "AES-GCM", iv }, wrapKey, new TextEncoder().encode(JSON.stringify(priv)));

console.log(JSON.stringify({ v: 1, publicKey: { kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y }, wrapped: { iter, salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)) } }, null, 1));
console.error("PUBLIC KEY for seal.mjs:", JSON.stringify({ x: pub.x, y: pub.y }));
