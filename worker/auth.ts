export { PBKDF2_ITERATIONS, PBKDF2_PASSES, constantTimeEqual, hashPassword, isValidPasswordHashConfiguration, isValidSessionSecretConfiguration, verifyPassword } from "./password.mjs";

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
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
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

