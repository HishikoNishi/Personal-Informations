import { describe, expect, it } from "vitest";
import { handleApi } from "../worker/index";
import { SESSION_COOKIE, signSession } from "../worker/auth";
import type { Env } from "../worker/model";

describe("full-profile save validation", () => {
  it("returns the Vietnamese validation message for invalid content with a valid session and CSRF request", async () => {
    const secretBytes = crypto.getRandomValues(new Uint8Array(32));
    let binary = "";
    for (const byte of secretBytes) binary += String.fromCharCode(byte);
    const secret = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    const session = await signSession(secret);
    const request = new Request("https://profile.example/api/admin/content", {
      method: "PUT",
      headers: {
        Origin: "https://profile.example",
        "X-Requested-With": "fetch",
        "Content-Type": "application/json",
        Cookie: `${SESSION_COOKIE}=${session}`,
      },
      body: JSON.stringify({ sections: {}, projects: [], images: [] }),
    });
    const env = { DB: {} as D1Database, ASSETS: {} as Fetcher, SESSION_SECRET: secret } as Env;

    const response = await handleApi(request, env);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Nội dung không hợp lệ hoặc vượt giới hạn." });
  });
});
