export const PBKDF2_ITERATIONS = 310_000;
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
export const LOGIN_WINDOW_SECONDS = 15 * 60;
export const MAX_FAILED_LOGINS = 5;
export const SESSION_COOKIE = "__Host-owner-session";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const asArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
};

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid Base64URL value");
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function isValidPasswordHashConfiguration(encoded: string): boolean {
  const parts = encoded.split("$");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") return false;
  const iterations = Number(parts[2]);
  if (!Number.isInteger(iterations) || iterations < 100_000 || iterations > 1_000_000) return false;
  try {
    const salt = decodeBase64Url(parts[3]);
    const digest = decodeBase64Url(parts[4]);
    return salt.length >= 16 && salt.length <= 64 && digest.length === 32;
  } catch {
    return false;
  }
}

export function isValidSessionSecretConfiguration(secret: string): boolean {
  try { return decodeBase64Url(secret).length >= 32; }
  catch { return false; }
}

async function derivePasswordBits(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: asArrayBuffer(salt), iterations }, key, 256));
}

export async function hashPassword(password: string, salt = crypto.getRandomValues(new Uint8Array(16)), iterations = PBKDF2_ITERATIONS): Promise<string> {
  const bits = await derivePasswordBits(password, salt, iterations);
  return `pbkdf2$sha256$${iterations}$${encodeBase64Url(salt)}$${encodeBase64Url(bits)}`;
}

export function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index++) difference |= (left[index % (left.length || 1)] ?? 0) ^ (right[index % (right.length || 1)] ?? 0);
  return difference === 0;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const parts = encoded.split("$");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") return false;
  const iterations = Number(parts[2]);
  if (!Number.isInteger(iterations) || iterations < 100_000 || iterations > 1_000_000) return false;
  try {
    const salt = decodeBase64Url(parts[3]);
    const expected = decodeBase64Url(parts[4]);
    if (salt.length < 16 || salt.length > 64 || expected.length !== 32) return false;
    const actual = await derivePasswordBits(password, salt, iterations);
    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
}

type SessionPayload = { sub: "owner"; iat: number; exp: number; nonce: string };

async function importHmacKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  const bytes = decodeBase64Url(secret);
  if (bytes.length < 32) throw new Error("SESSION_SECRET must decode to at least 32 bytes");
  return crypto.subtle.importKey("raw", asArrayBuffer(bytes), { name: "HMAC", hash: "SHA-256" }, false, usages);
}

export async function signSession(secret: string, now = Date.now()): Promise<string> {
  const issued = Math.floor(now / 1000);
  const payload: SessionPayload = {
    sub: "owner", iat: issued, exp: issued + SESSION_SECONDS,
    nonce: encodeBase64Url(crypto.getRandomValues(new Uint8Array(16))),
  };
  const encoded = encodeBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await importHmacKey(secret, ["sign"]), encoder.encode(encoded));
  return `${encoded}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifySession(token: string, secret: string, now = Date.now()): Promise<boolean> {
  if (token.length > 2048) return false;
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra !== undefined) return false;
  try {
    const validSignature = await crypto.subtle.verify("HMAC", await importHmacKey(secret, ["verify"]), asArrayBuffer(decodeBase64Url(signature)), encoder.encode(encoded));
    if (!validSignature) return false;
    const payload = JSON.parse(decoder.decode(decodeBase64Url(encoded))) as Partial<SessionPayload>;
    const current = Math.floor(now / 1000);
    return payload.sub === "owner" && Number.isInteger(payload.iat) && Number.isInteger(payload.exp) &&
      typeof payload.nonce === "string" && (payload.iat as number) <= current + 60 &&
      (payload.exp as number) > current && (payload.exp as number) - (payload.iat as number) <= SESSION_SECONDS;
  } catch {
    return false;
  }
}

export function isRateLimited(failedAttempts: number): boolean {
  return failedAttempts >= MAX_FAILED_LOGINS;
}

export function getCookie(request: Request, name = SESSION_COOKIE): string | undefined {
  const cookies = request.headers.get("Cookie") ?? "";
  for (const entry of cookies.split(";")) {
    const separator = entry.indexOf("=");
    if (separator < 0 || entry.slice(0, separator).trim() !== name) continue;
    return entry.slice(separator + 1).trim();
  }
  return undefined;
}

export async function isOwnerRequest(request: Request, secret?: string): Promise<boolean> {
  if (!secret) return false;
  const token = getCookie(request);
  return token ? verifySession(token, secret) : false;
}

export function hasValidOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}

export function hasCsrfHeader(request: Request): boolean {
  return request.headers.get("X-Requested-With") === "fetch" && hasValidOrigin(request);
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

export function expiredSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

