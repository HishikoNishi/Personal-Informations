const encoder = new TextEncoder();
export const PBKDF2_ITERATIONS = 100_000;
export const PBKDF2_PASSES = 4;
const HASH_SCHEME = "sha256-chain4";

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("base64url");
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (encodeBase64Url(bytes) !== value) throw new Error("base64url");
  return bytes;
}

export function inspectPasswordHash(encoded) {
  const parts = encoded.split("$");
  if (parts.length !== 5) return { valid: false, message: "Hash phải có đúng 5 phần ngăn cách bằng dấu $." };
  if (parts[0] !== "pbkdf2" || !["sha256", HASH_SCHEME].includes(parts[1])) return { valid: false, message: `Sai tiền tố hoặc thuật toán; hash cần bắt đầu bằng pbkdf2$${HASH_SCHEME}$.` };
  const iterations = Number(parts[2]);
  if (iterations !== PBKDF2_ITERATIONS) {
    return { valid: false, message: "Hash phải dùng đúng 100.000 vòng mỗi lượt; Worker Cloudflare giới hạn 100.000 vòng cho một phép PBKDF2." };
  }
  try {
    const salt = decodeBase64Url(parts[3]);
    const digest = decodeBase64Url(parts[4]);
    if (salt.length < 16 || salt.length > 64) return { valid: false, message: "Salt trong hash phải dài từ 16 đến 64 byte." };
    if (digest.length !== 32) return { valid: false, message: "Digest trong hash phải dài đúng 32 byte." };
    return { valid: true, scheme: parts[1], iterations, salt, digest };
  } catch {
    return { valid: false, message: "Salt hoặc digest không phải Base64URL hợp lệ." };
  }
}

export function isValidPasswordHashConfiguration(encoded) {
  return inspectPasswordHash(encoded).valid;
}

export function isValidSessionSecretConfiguration(secret) {
  try { return decodeBase64Url(secret).length >= 32; }
  catch { return false; }
}

function asArrayBuffer(bytes) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function derivePasswordBits(passwordBytes, salt, iterations, cryptoApi) {
  const key = await cryptoApi.subtle.importKey("raw", passwordBytes, "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await cryptoApi.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: asArrayBuffer(salt), iterations }, key, 256));
}

async function derivePasswordHash(passwordBytes, salt, iterations, passes, cryptoApi) {
  let derived = passwordBytes;
  for (let pass = 0; pass < passes; pass++) {
    const stageSalt = new Uint8Array(salt.length + 1);
    stageSalt.set(salt);
    stageSalt[salt.length] = pass;
    derived = await derivePasswordBits(derived, stageSalt, iterations, cryptoApi);
  }
  return derived;
}

export async function hashPassword(password, salt = globalThis.crypto.getRandomValues(new Uint8Array(16)), iterations = PBKDF2_ITERATIONS, cryptoApi = globalThis.crypto) {
  if (iterations !== PBKDF2_ITERATIONS) throw new RangeError("Cloudflare Workers supports at most 100,000 PBKDF2 iterations per pass.");
  const digest = await derivePasswordHash(encoder.encode(password), salt, iterations, PBKDF2_PASSES, cryptoApi);
  return `pbkdf2$${HASH_SCHEME}$${iterations}$${encodeBase64Url(salt)}$${encodeBase64Url(digest)}`;
}

export function constantTimeEqual(left, right) {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index++) difference |= (left[index % (left.length || 1)] ?? 0) ^ (right[index % (right.length || 1)] ?? 0);
  return difference === 0;
}

export async function verifyPassword(password, encoded, cryptoApi = globalThis.crypto) {
  const parsed = inspectPasswordHash(encoded);
  if (!parsed.valid) return false;
  const passes = parsed.scheme === HASH_SCHEME ? PBKDF2_PASSES : 1;
  const actual = await derivePasswordHash(encoder.encode(password), parsed.salt, parsed.iterations, passes, cryptoApi);
  return constantTimeEqual(actual, parsed.digest);
}
