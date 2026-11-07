import { encodeProject, readImage, readImages, readProjects, readSections } from "./db";
import { MAX_IMAGES, MAX_IMAGE_BYTES, MAX_PROJECTS, SECTION_KEYS, type Env, type ProjectDocument } from "./model";
import { imageMagicMatches, isRecord, validateImageMetadata, validateProject, validateProjectList, validateSectionDocument, validateSectionKey, validateSectionSet } from "./validation";

const noStoreHeaders = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...noStoreHeaders, "Content-Type": "application/json; charset=utf-8" } });
const jsonBytes = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

async function bodyJson(request: Request, maxBytes = 1_200_000): Promise<unknown> {
  const declared = Number(request.headers.get("Content-Length") ?? 0);
  if (declared > maxBytes) throw new RangeError("payload too large");
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length > maxBytes) throw new RangeError("payload too large");
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
}

function uniqueIds(values: readonly { id: string }[]): boolean {
  return new Set(values.map((value) => value.id)).size === values.length;
}

function projectStatements(projects: ProjectDocument[]) {
  return projects.map((project, position) => {
    const normalized = { ...project, position };
    return { statement: "INSERT INTO projects (id, position, visibility, name, category, description, tags, repo_url, live_url, style, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", bindings: encodeProject(normalized) };
  });
}

async function saveFullContent(env: Env, value: unknown): Promise<Response> {
  if (!isRecord(value) || !validateSectionSet(value.sections) || !validateProjectList(value.projects) || !Array.isArray(value.images) || value.images.length > MAX_IMAGES || !value.images.every(validateImageMetadata) || !uniqueIds(value.projects) || !uniqueIds(value.images)) {
    return json({ error: "Nội dung không hợp lệ hoặc vượt giới hạn." }, 400);
  }
  const existing = await env.DB.prepare("SELECT id FROM images").all<{ id: string }>();
  const availableImageIds = new Set((existing.results ?? []).map((image) => image.id));
  if (value.images.some((image) => !availableImageIds.has(image.id))) return json({ error: "Có ảnh chưa được tải lên." }, 400);

  const statements = [env.DB.prepare("DELETE FROM site_sections"), env.DB.prepare("DELETE FROM projects")];
  for (const section of SECTION_KEYS) statements.push(env.DB.prepare("INSERT INTO site_sections (section, document) VALUES (?, ?)").bind(section, JSON.stringify(value.sections[section])));
  for (const statement of projectStatements(value.projects)) statements.push(env.DB.prepare(statement.statement).bind(...statement.bindings));
  const imageIds = value.images.map((image) => image.id);
  if (imageIds.length) {
    const placeholders = imageIds.map(() => "?").join(",");
    statements.push(env.DB.prepare(`DELETE FROM images WHERE id NOT IN (${placeholders})`).bind(...imageIds));
  } else {
    statements.push(env.DB.prepare("DELETE FROM images"));
  }
  for (const image of value.images) statements.push(env.DB.prepare("UPDATE images SET caption = ?, position = ?, visibility = ? WHERE id = ?").bind(JSON.stringify(image.caption), image.position, image.visibility, image.id));
  await env.DB.batch(statements);
  return json({ saved: true });
}

async function exportBackup(env: Env): Promise<Response> {
  const [sections, projects, imageRows] = await Promise.all([
    readSections(env.DB), readProjects(env.DB),
    env.DB.prepare("SELECT id, mime, bytes, caption, position, visibility, created_at FROM images ORDER BY position, created_at, id").all<Record<string, unknown>>(),
  ]);
  const images = (imageRows.results ?? []).map((row) => ({
    id: String(row.id), mime: String(row.mime), bytes: jsonBytes(new Uint8Array(row.bytes as ArrayBuffer)),
    caption: JSON.parse(String(row.caption)), position: Number(row.position), visibility: String(row.visibility), created_at: String(row.created_at),
  }));
  return json({ version: 1, sections, projects, images });
}

async function importBackup(env: Env, request: Request): Promise<Response> {
  let value: unknown;
  try { value = await bodyJson(request, 20 * 1024 * 1024); }
  catch { return json({ error: "Tệp sao lưu không hợp lệ hoặc quá lớn." }, 400); }
  if (!isRecord(value) || value.version !== 1 || !validateSectionSet(value.sections) || !validateProjectList(value.projects) || !Array.isArray(value.images) || value.images.length > MAX_IMAGES || !uniqueIds(value.projects) || !uniqueIds(value.images)) {
    return json({ error: "Cấu trúc tệp sao lưu không hợp lệ." }, 400);
  }

  const imageRows: { id: string; mime: string; bytes: Uint8Array; caption: unknown; position: number; visibility: string; created_at: string }[] = [];
  for (const item of value.images) {
    if (!isRecord(item)) return json({ error: "Thông tin ảnh trong bản sao lưu không hợp lệ." }, 400);
    const encodedBytes = item.bytes;
    if (typeof item.id !== "string" || typeof item.mime !== "string" || typeof encodedBytes !== "string" || encodedBytes.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 8 || !validateImageMetadata(item)) {
      return json({ error: "Thông tin ảnh trong bản sao lưu không hợp lệ." }, 400);
    }
    let bytes: Uint8Array;
    try { bytes = Uint8Array.from(atob(encodedBytes), (character) => character.charCodeAt(0)); }
    catch { return json({ error: "Dữ liệu ảnh trong bản sao lưu không hợp lệ." }, 400); }
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES || !imageMagicMatches(item.mime, bytes)) return json({ error: "Ảnh phải là JPEG, PNG hoặc WebP hợp lệ dưới 600 KB." }, 400);
    imageRows.push({ id: item.id, mime: item.mime, bytes, caption: item.caption, position: item.position, visibility: item.visibility, created_at: typeof item.created_at === "string" ? item.created_at : new Date().toISOString() });
  }

  const statements = [env.DB.prepare("DELETE FROM images"), env.DB.prepare("DELETE FROM projects"), env.DB.prepare("DELETE FROM site_sections")];
  for (const section of SECTION_KEYS) statements.push(env.DB.prepare("INSERT INTO site_sections (section, document) VALUES (?, ?)").bind(section, JSON.stringify(value.sections[section])));
  for (const statement of projectStatements(value.projects)) statements.push(env.DB.prepare(statement.statement).bind(...statement.bindings));
  for (const image of imageRows) statements.push(env.DB.prepare("INSERT INTO images (id, mime, bytes, caption, position, visibility, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(image.id, image.mime, image.bytes, JSON.stringify(image.caption), image.position, image.visibility, image.created_at));
  await env.DB.batch(statements);
  return json({ imported: true });
}

async function createImage(env: Env, request: Request): Promise<Response> {
  const total = await env.DB.prepare("SELECT COUNT(*) AS count FROM images").first<{ count: number }>();
  if ((total?.count ?? 0) >= MAX_IMAGES) return json({ error: "Đã đạt giới hạn 24 ảnh." }, 400);
  const declared = Number(request.headers.get("Content-Length") ?? 0);
  if (declared > MAX_IMAGE_BYTES + 16_384) return json({ error: "Ảnh vượt quá 600 KB." }, 413);
  let form: FormData;
  try { form = await request.formData(); }
  catch { return json({ error: "Dữ liệu ảnh không hợp lệ." }, 400); }
  const file = form.get("file");
  if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size === 0 || file.size > MAX_IMAGE_BYTES) return json({ error: "Chỉ nhận JPEG, PNG hoặc WebP dưới 600 KB." }, 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!imageMagicMatches(file.type, bytes)) return json({ error: "Định dạng ảnh không khớp với dữ liệu tệp." }, 400);
  let caption: unknown;
  try { caption = JSON.parse(String(form.get("caption") ?? "")); } catch { return json({ error: "Chú thích ảnh không hợp lệ." }, 400); }
  const metadata = { id: crypto.randomUUID(), mime: file.type, caption, position: Number(form.get("position") ?? total?.count ?? 0), visibility: "private" as const };
  if (!validateImageMetadata(metadata)) return json({ error: "Thông tin ảnh không hợp lệ." }, 400);
  await env.DB.prepare("INSERT INTO images (id, mime, bytes, caption, position, visibility) VALUES (?, ?, ?, ?, ?, 'private')").bind(metadata.id, metadata.mime, bytes, JSON.stringify(metadata.caption), metadata.position).run();
  const created = await env.DB.prepare("SELECT created_at FROM images WHERE id = ?").bind(metadata.id).first<{ created_at: string }>();
  return json({ ...metadata, created_at: created?.created_at ?? new Date().toISOString() }, 201);
}

export async function adminRoute(request: Request, env: Env, pathname: string): Promise<Response> {
  if (pathname === "/api/admin/content" && request.method === "GET") {
    const [sections, projects, images] = await Promise.all([readSections(env.DB), readProjects(env.DB), readImages(env.DB)]);
    return json({ sections, projects, images });
  }
  if (pathname === "/api/admin/content" && request.method === "PUT") {
    let value: unknown;
    try { value = await bodyJson(request); } catch { return json({ error: "Nội dung không hợp lệ." }, 400); }
    return saveFullContent(env, value);
  }
  if (pathname === "/api/admin/export" && request.method === "GET") return exportBackup(env);
  if (pathname === "/api/admin/import" && request.method === "POST") return importBackup(env, request);

  const sectionMatch = pathname.match(/^\/api\/admin\/sections\/([A-Za-z-]{1,40})$/);
  if (sectionMatch && request.method === "PUT") {
    if (!validateSectionKey(sectionMatch[1])) return json({ error: "Mục hồ sơ không hợp lệ." }, 404);
    let document: unknown;
    try { document = await bodyJson(request); } catch { return json({ error: "Nội dung không hợp lệ." }, 400); }
    if (!validateSectionDocument(sectionMatch[1], document)) return json({ error: "Nội dung không hợp lệ hoặc vượt giới hạn." }, 400);
    await env.DB.prepare("INSERT INTO site_sections (section, document, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(section) DO UPDATE SET document = excluded.document, updated_at = CURRENT_TIMESTAMP").bind(sectionMatch[1], JSON.stringify(document)).run();
    return json({ saved: true });
  }

  if (pathname === "/api/admin/projects" && request.method === "POST") {
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM projects").first<{ count: number }>();
    if ((count?.count ?? 0) >= MAX_PROJECTS) return json({ error: "Đã đạt giới hạn 20 dự án." }, 400);
    let value: unknown;
    try { value = await bodyJson(request); } catch { return json({ error: "Dự án không hợp lệ." }, 400); }
    if (!validateProject(value)) return json({ error: "Thông tin dự án không hợp lệ." }, 400);
    const project = { ...value, id: crypto.randomUUID(), position: count?.count ?? 0 } as ProjectDocument;
    const statement = projectStatements([project])[0];
    await env.DB.prepare(statement.statement).bind(...statement.bindings).run();
    return json(project, 201);
  }

  if (pathname === "/api/admin/projects/reorder" && request.method === "POST") {
    let body: unknown;
    try { body = await bodyJson(request, 10_000); } catch { return json({ error: "Thứ tự dự án không hợp lệ." }, 400); }
    if (!isRecord(body) || !Array.isArray(body.ids) || body.ids.length > MAX_PROJECTS || !body.ids.every((id) => typeof id === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(id)) || new Set(body.ids).size !== body.ids.length) return json({ error: "Thứ tự dự án không hợp lệ." }, 400);
    const projectIds = body.ids as string[];
    const projects = await readProjects(env.DB);
    if (projects.length !== projectIds.length || projects.some((project) => !projectIds.includes(project.id))) return json({ error: "Danh sách dự án đã thay đổi." }, 409);
    await env.DB.batch(projectIds.map((id, position) => env.DB.prepare("UPDATE projects SET position = ? WHERE id = ?").bind(position, id)));
    return json({ reordered: true });
  }

  const projectMatch = pathname.match(/^\/api\/admin\/projects\/([A-Za-z0-9_-]{1,80})$/);
  if (projectMatch && request.method === "PUT") {
    let value: unknown;
    try { value = await bodyJson(request); } catch { return json({ error: "Dự án không hợp lệ." }, 400); }
    if (!isRecord(value) || value.id !== projectMatch[1] || !validateProject(value, true)) return json({ error: "Thông tin dự án không hợp lệ." }, 400);
    const statement = projectStatements([value as ProjectDocument])[0];
    await env.DB.batch([
      env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(projectMatch[1]),
      env.DB.prepare(statement.statement).bind(...statement.bindings),
    ]);
    return json({ saved: true });
  }
  if (projectMatch && request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(projectMatch[1]).run();
    const projects = await readProjects(env.DB);
    await env.DB.batch(projects.map((project, position) => env.DB.prepare("UPDATE projects SET position = ? WHERE id = ?").bind(position, project.id)));
    return json({ deleted: true });
  }

  if (pathname === "/api/admin/images" && request.method === "POST") return createImage(env, request);
  const imageMatch = pathname.match(/^\/api\/admin\/images\/([A-Za-z0-9_-]{1,80})$/);
  if (imageMatch && request.method === "GET") {
    const image = await readImage(env.DB, imageMatch[1]);
    if (!image) return json({ error: "Không tìm thấy ảnh." }, 404);
    return new Response(image.bytes, { headers: { ...noStoreHeaders, "Content-Type": image.mime } });
  }
  if (imageMatch && request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM images WHERE id = ?").bind(imageMatch[1]).run();
    return json({ deleted: true });
  }
  if (imageMatch && request.method === "PUT") {
    let value: unknown;
    try { value = await bodyJson(request, 10_000); } catch { return json({ error: "Thông tin ảnh không hợp lệ." }, 400); }
    const metadata = { ...(isRecord(value) ? value : {}), id: imageMatch[1] };
    if (!validateImageMetadata(metadata)) return json({ error: "Thông tin ảnh không hợp lệ." }, 400);
    const result = await env.DB.prepare("UPDATE images SET caption = ?, position = ?, visibility = ? WHERE id = ?").bind(JSON.stringify(metadata.caption), metadata.position, metadata.visibility, metadata.id).run();
    if (!result.meta.changes) return json({ error: "Không tìm thấy ảnh." }, 404);
    return json({ saved: true });
  }

  return json({ error: "Không tìm thấy API." }, 404);
}

