import { describe, expect, it } from "vitest";
import { constantTimeEqual, hashPassword, hasCsrfHeader, isRateLimited, SESSION_COOKIE, SESSION_SECONDS, sessionCookie, signSession, verifyPassword, verifySession } from "../worker/auth";

function secretForTests() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
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
