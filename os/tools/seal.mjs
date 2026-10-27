// Claude OS: lock data so only Steven's phone can read it.
// Anyone can lock with the public key below; only the phone (with the passcode) can unlock.
// Needs Node 18+ and nothing else. See os/POSTING.md for how scheduled tasks use it.
//
//   node seal.mjs today   today-payload.json              > today.json
//   node seal.mjs message message.json [current-inbox.json] > inbox.json
//
// "today" replaces the whole Today file (weather + day). "message" adds one message to the
// inbox, keeps the newest 40, and drops ones past their "expires" date.
import { readFileSync, existsSync } from "node:fs";

const PUBLIC_KEY = { kty: "EC", crv: "P-256", x: "RxxvAmTd-eJn0vPO4L9ppbhysVwpIYUhiE-c_YlNezE", y: "NupxgDxarDvuHDIt_EKULv80fgFV0lYFYUtjsClvrRQ" };
const KEEP = 40;

const { subtle } = globalThis.crypto;
const b64 = u => Buffer.from(u).toString("base64");
const readJSON = p => JSON.parse(readFileSync(p, "utf8"));

async function seal(obj) {
  const to = await subtle.importKey("jwk", PUBLIC_KEY, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const eph = await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
  const key = await subtle.deriveKey({ name: "ECDH", public: to }, eph.privateKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  const epk = await subtle.exportKey("jwk", eph.publicKey);
  return { epk: { x: epk.x, y: epk.y }, iv: b64(iv), ct: b64(new Uint8Array(ct)) };
}

const [mode, file, inboxFile] = process.argv.slice(2);
if (!["today", "message"].includes(mode) || !file) {
  console.error("Usage: node seal.mjs today payload.json  |  node seal.mjs message msg.json [inbox.json]");
  process.exit(1);
}
const data = readJSON(file);
const now = new Date().toISOString();

if (mode === "today") {
  data.updatedAt = data.updatedAt || now;
  console.log(JSON.stringify({ v: 1, at: now, ...(await seal(data)) }));
} else {
  if (!data.title) { console.error("A message needs at least a title."); process.exit(1); }
  let inbox = { v: 1, items: [] };
  if (inboxFile && existsSync(inboxFile)) {
    try { inbox = readJSON(inboxFile); } catch (e) { console.error("Inbox file was not valid JSON, starting fresh."); }
  }
  const id = "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const item = { id, at: now, ...(data.expires ? { exp: data.expires } : {}), ...(await seal({ ...data, at: now })) };
  const live = (inbox.items || []).filter(m => !m.exp || new Date(m.exp) > new Date());
  inbox = { v: 1, updated: now, items: [item, ...live].slice(0, KEEP) };
  console.log(JSON.stringify(inbox, null, 1));
}
