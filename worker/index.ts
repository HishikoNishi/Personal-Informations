/// <reference types="@cloudflare/workers-types" />
import { readImage, readPublicSnapshot } from "./db";
import { expiredSessionCookie, getCookie, hasCsrfHeader, isOwnerRequest, isRateLimited, SESSION_COOKIE, sessionCookie, signSession, verifyPassword } from "./auth";
import { isRecord } from "./validation";
import type { Env } from "./model";

const noStore = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const jsonResponse = (value: unknown, status = 200, admin = false, extraHeaders: HeadersInit = {}) => new Response(JSON.stringify(value), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff", "Cache-Control": admin ? "no-store" : "no-cache", ...Object.fromEntries(new Headers(extraHeaders).entries()) },
});

const DUMMY_PASSWORD_HASH = `pbkdf2$sha256$310000$${"A".repeat(22)}$${"A".repeat(43)}`;
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function parseJson(request: Request, maxBytes: number): Promise<unknown> {
  const length = Number(request.headers.get("Content-Length") ?? 0);
  if (length > maxBytes) throw new RangeError("request body too large");
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length > maxBytes) throw new RangeError("request body too large");
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
}

async function hashIp(secret: string, ip: string): Promise<string> {
  const base64 = secret.replace(/-/g, "+").replace(/_/g, "/");
  const keyBytes = Uint8Array.from(atob(base64 + "=".repeat((4 - base64.length % 4) % 4)), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ip)));
  return Array.from(signature, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return jsonResponse({ error: "Phương thức không được hỗ trợ." }, 405, true);
  if (!hasCsrfHeader(request)) return jsonResponse({ error: "Yêu cầu không hợp lệ." }, 403, true);
  let body: unknown;
  try { body = await parseJson(request, 4096); } catch { return jsonResponse({ error: "Yêu cầu không hợp lệ." }, 400, true); }
  const password = isRecord(body) ? body.password : undefined;
  if (typeof password !== "string" || password.length > 1024 || !password) return jsonResponse({ error: "Mật khẩu không đúng." }, 401, true);

  const keySecret = env.SESSION_SECRET ?? "local-rate-limit-key-is-not-a-session-secret";
  const address = request.headers.get("CF-Connecting-IP") ?? request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = await hashIp(keySecret, address);
  const now = Math.floor(Date.now() / 1000);
  const recent = await env.DB.prepare("SELECT COUNT(*) AS count FROM login_attempts WHERE ip_hash = ? AND attempted_at > ? AND succeeded = 0").bind(ipHash, now - 15 * 60).first<{ count: number }>();
  if (isRateLimited(recent?.count ?? 0)) {
    return jsonResponse({ error: "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút." }, 429, true);
  }

  const validPassword = await verifyPassword(password, env.ADMIN_PASSWORD_HASH ?? DUMMY_PASSWORD_HASH);
  if (!validPassword || !env.ADMIN_PASSWORD_HASH || !env.SESSION_SECRET) {
    await env.DB.prepare("INSERT INTO login_attempts (ip_hash, attempted_at, succeeded) VALUES (?, ?, 0)").bind(ipHash, now).run();
    await env.DB.prepare("DELETE FROM login_attempts WHERE attempted_at < ?").bind(now - 30 * 24 * 60 * 60).run();
    await wait(350);
    return jsonResponse({ error: "Mật khẩu không đúng." }, 401, true);
  }

  await env.DB.prepare("DELETE FROM login_attempts WHERE ip_hash = ?").bind(ipHash).run();
  const token = await signSession(env.SESSION_SECRET);
  return jsonResponse({ authenticated: true }, 200, true, { "Set-Cookie": sessionCookie(token) });
}

async function handleAuth(request: Request, env: Env, pathname: string): Promise<Response> {
  if (pathname === "/api/auth/login") return handleLogin(request, env);
  if (pathname === "/api/auth/me") {
    if (request.method !== "GET") return jsonResponse({ error: "Phương thức không được hỗ trợ." }, 405, true);
    return jsonResponse({ authenticated: await isOwnerRequest(request, env.SESSION_SECRET) }, 200, true);
  }
  if (pathname === "/api/auth/logout") {
    if (request.method !== "POST") return jsonResponse({ error: "Phương thức không được hỗ trợ." }, 405, true);
    if (!hasCsrfHeader(request)) return jsonResponse({ error: "Yêu cầu không hợp lệ." }, 403, true);
    if (!getCookie(request, SESSION_COOKIE) || !(await isOwnerRequest(request, env.SESSION_SECRET))) {
      return jsonResponse({ error: "Phiên đăng nhập đã hết hạn." }, 401, true, { "Set-Cookie": expiredSessionCookie() });
    }
    return jsonResponse({ authenticated: false }, 200, true, { "Set-Cookie": expiredSessionCookie() });
  }
  return jsonResponse({ error: "Không tìm thấy API." }, 404, true);
}

function imageMagicMatches(mime: string, bytes: Uint8Array): boolean {
  if (mime === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return bytes.length >= 8 && bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10";
  if (mime === "image/webp") return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (pathname === "/api/content") {
    if (request.method !== "GET") return jsonResponse({ error: "Phương thức không được hỗ trợ." }, 405);
    return jsonResponse(await readPublicSnapshot(env));
  }

  const imageMatch = pathname.match(/^\/api\/images\/([A-Za-z0-9_-]{1,80})$/);
  if (imageMatch && request.method === "GET") {
    const image = await readImage(env.DB, imageMatch[1]);
    if (!image || image.visibility !== "public") return jsonResponse({ error: "Không tìm thấy ảnh." }, 404);
    return new Response(image.bytes, { headers: {
      "Content-Type": image.mime,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=86400, immutable",
    } });
  }

  if (pathname.startsWith("/api/auth/")) return handleAuth(request, env, pathname);

  if (pathname.startsWith("/api/admin/")) {
    if (!(await isOwnerRequest(request, env.SESSION_SECRET))) return jsonResponse({ error: "Cần đăng nhập để tiếp tục." }, 401, true);
    if (!hasCsrfHeader(request) && request.method !== "GET") return jsonResponse({ error: "Yêu cầu không hợp lệ." }, 403, true);
    return jsonResponse({ error: "Không tìm thấy API." }, 404, true);
  }
  return jsonResponse({ error: "Không tìm thấy API." }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    try {
      return await handleApi(request, env);
    } catch {
      return jsonResponse({ error: "Không thể xử lý yêu cầu lúc này." }, 500, url.pathname.startsWith("/api/admin/") || url.pathname.startsWith("/api/auth/"));
    }
  },
} satisfies ExportedHandler<Env>;

export { handleApi, imageMagicMatches, noStore };
