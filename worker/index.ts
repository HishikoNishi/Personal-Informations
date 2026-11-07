/// <reference types="@cloudflare/workers-types" />
import { readImage, readPublicSnapshot } from "./db";
import type { Env } from "./model";

const noStore = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const jsonResponse = (value: unknown, status = 200, admin = false) => new Response(JSON.stringify(value), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff", "Cache-Control": admin ? "no-store" : "no-cache" },
});

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

  if (pathname.startsWith("/api/admin/") || pathname.startsWith("/api/auth/")) {
    return jsonResponse({ error: "Cần đăng nhập để tiếp tục." }, 401, true);
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
      return jsonResponse({ error: "Không thể xử lý yêu cầu lúc này." }, 500, url.pathname.startsWith("/api/admin/"));
    }
  },
} satisfies ExportedHandler<Env>;

export { handleApi, imageMagicMatches, noStore };
