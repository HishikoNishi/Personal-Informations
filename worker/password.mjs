const encoder = new TextEncoder();
export const PBKDF2_ITERATIONS = 310_000;

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
  if (parts[0] !== "pbkdf2" || parts[1] !== "sha256") return { valid: false, message: "Sai tiền tố hoặc thuật toán; hash cần bắt đầu bằng pbkdf2$sha256$." };
  const iterations = Number(parts[2]);
  if (!Number.isInteger(iterations) || iterations < 100_000 || iterations > 1_000_000) {
    return { valid: false, message: "Số vòng lặp trong hash phải là số nguyên từ 100.000 đến 1.000.000." };
  }
  try {
    const salt = decodeBase64Url(parts[3]);
    const digest = decodeBase64Url(parts[4]);
    if (salt.length < 16 || salt.length > 64) return { valid: false, message: "Salt trong hash phải dài từ 16 đến 64 byte." };
    if (digest.length !== 32) return { valid: false, message: "Digest trong hash phải dài đúng 32 byte." };
    return { valid: true, iterations, salt, digest };
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

async function derivePasswordBits(password, salt, iterations, cryptoApi) {
  const key = await cryptoApi.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await cryptoApi.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256));
}

export async function hashPassword(password, salt = globalThis.crypto.getRandomValues(new Uint8Array(16)), iterations = PBKDF2_ITERATIONS, cryptoApi = globalThis.crypto) {
  const bits = await derivePasswordBits(password, salt, iterations, cryptoApi);
  return `pbkdf2$sha256$${iterations}$${encodeBase64Url(salt)}$${encodeBase64Url(bits)}`;
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
  const actual = await derivePasswordBits(password, parsed.salt, parsed.iterations, cryptoApi);
  return constantTimeEqual(actual, parsed.digest);
}
