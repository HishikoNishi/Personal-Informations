import { describe, expect, it } from "vitest";
import { handleApi } from "../worker/index";
import type { Env } from "../worker/model";
import { constantTimeEqual, hashPassword, hasCsrfHeader, isRateLimited, SESSION_COOKIE, SESSION_SECONDS, sessionCookie, signSession, verifyPassword, verifySession } from "../worker/auth";

function secretForTests() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function loginRequest(body: unknown) {
  return new Request("https://profile.example/api/auth/login", {
    method: "POST",
    headers: { Origin: "https://profile.example", "X-Requested-With": "fetch", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function envForLogin(failedAttempts = 0, overrides: Partial<Env> = {}): Env {
  const DB = {
    prepare() {
      return {
        bind() {
          return {
            first: async () => ({ count: failedAttempts }),
            run: async () => ({ success: true }),
          };
        },
      };
    },
  } as unknown as D1Database;
  return {
    DB,
    ASSETS: {} as Fetcher,
    ADMIN_USERNAME: "owner",
    ADMIN_PASSWORD_HASH: "",
    SESSION_SECRET: secretForTests(),
    ...overrides,
  };
}

describe("owner authentication primitives", () => {
  it("hashes with PBKDF2 and verifies without accepting another password", async () => {
    const salt = new Uint8Array(16).fill(7);
    const encoded = await hashPassword("test-only-password", salt, 100_000);
    expect(encoded).toMatch(/^pbkdf2\$sha256\$100000\$/);
    expect(await verifyPassword("test-only-password", encoded)).toBe(true);
    expect(await verifyPassword("another-password", encoded)).toBe(false);
    expect(await verifyPassword("test-only-password", "not-a-hash")).toBe(false);
  });

  it("signs sessions, accepts them before expiry, and rejects expired or altered sessions", async () => {
    const secret = secretForTests();
    const issuedAt = Date.UTC(2026, 0, 1);
    const token = await signSession(secret, issuedAt);
    expect(await verifySession(token, secret, issuedAt + 1000)).toBe(true);
    expect(await verifySession(token, secret, issuedAt + SESSION_SECONDS * 1000 + 1)).toBe(false);
    expect(await verifySession(`${token}x`, secret, issuedAt + 1000)).toBe(false);
    expect(await verifySession(token, secretForTests(), issuedAt + 1000)).toBe(false);
  });

  it("uses fixed-length comparison and applies the five-failure lockout threshold", () => {
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(true);
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(false);
    expect(constantTimeEqual(new Uint8Array([1]), new Uint8Array([1, 0]))).toBe(false);
    expect(isRateLimited(4)).toBe(false);
    expect(isRateLimited(5)).toBe(true);
  });

  it("requires the fetch CSRF marker and a same-origin Origin, and sets a hardened session cookie", () => {
    const request = new Request("https://profile.example/api/admin/content", {
      method: "PUT",
      headers: { Origin: "https://profile.example", "X-Requested-With": "fetch" },
    });
    expect(hasCsrfHeader(request)).toBe(true);
    expect(hasCsrfHeader(new Request(request.url, { method: "PUT", headers: { Origin: "https://other.example", "X-Requested-With": "fetch" } }))).toBe(false);
    expect(hasCsrfHeader(new Request(request.url, { method: "PUT", headers: { Origin: "https://profile.example" } }))).toBe(false);
    expect(sessionCookie("signed-value")).toContain(`${SESSION_COOKIE}=signed-value; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`);
  });
});

describe("owner login configuration and responses", () => {
  it.each([
    ["ADMIN_USERNAME", { ADMIN_USERNAME: undefined }],
    ["ADMIN_PASSWORD_HASH", { ADMIN_PASSWORD_HASH: undefined }],
    ["SESSION_SECRET", { SESSION_SECRET: undefined }],
    ["ADMIN_USERNAME", { ADMIN_USERNAME: "   " }],
    ["ADMIN_PASSWORD_HASH", { ADMIN_PASSWORD_HASH: "" }],
    ["SESSION_SECRET", { SESSION_SECRET: "  " }],
  ])("returns 503 when %s is empty", async (_name, override) => {
    const env = envForLogin(0, override as Partial<Env>);
    const response = await handleApi(loginRequest({ username: "owner", password: "test" }), env);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Chưa cấu hình đăng nhập" });
  });

  it("returns a distinct 429 message when the login limit is reached", async () => {
    const env = envForLogin(5, { ADMIN_PASSWORD_HASH: "configured-hash" });
    const response = await handleApi(loginRequest({ username: "owner", password: "wrong" }), env);
    const body = await response.json() as { error: string };
    expect(response.status).toBe(429);
    expect(body.error).toContain("thử đăng nhập quá nhiều lần");
    expect(body.error).not.toContain("không đúng");
  });

  it("returns 401 for wrong credentials after configuration is present", async () => {
    const env = envForLogin();
    env.ADMIN_PASSWORD_HASH = await hashPassword("correct-password", new Uint8Array(16).fill(9), 100_000);
    const response = await handleApi(loginRequest({ username: "wrong-user", password: "wrong-password" }), env);
    const body = await response.json() as { error: string };
    expect(response.status).toBe(401);
    expect(body.error).toContain("không đúng");
  });
});
