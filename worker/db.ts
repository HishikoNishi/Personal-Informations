import { defaultProjects, defaultSections } from "./defaults";
import { publicContent } from "./public-filter";
import { SECTION_KEYS, type Env, type ImageMetadata, type ProjectDocument, type SectionDocument, type SectionKey } from "./model";

const json = (value: unknown) => JSON.stringify(value);
const parse = <T,>(value: string): T => JSON.parse(value) as T;

function projectColumns(project: ProjectDocument) {
  const value = (key: string) => project.fields[key];
  return [project.id, project.position, project.visibility, json(value("name")), json(value("category")), json(value("description")), json(value("tags")), json(value("repoUrl")), json(value("liveUrl")), json(value("style")), json(value("icon"))] as const;
}

export async function seedIfEmpty(db: D1Database): Promise<void> {
  const [sections, projects, images] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS count FROM site_sections").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) AS count FROM projects").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) AS count FROM images").first<{ count: number }>(),
  ]);
  if ((sections?.count ?? 0) || (projects?.count ?? 0) || (images?.count ?? 0)) return;

  const statements = SECTION_KEYS.map((section) => db.prepare("INSERT INTO site_sections (section, document) VALUES (?, ?)").bind(section, json(defaultSections[section])));
  for (const project of defaultProjects) {
    statements.push(db.prepare("INSERT INTO projects (id, position, visibility, name, category, description, tags, repo_url, live_url, style, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(...projectColumns(project)));
  }
  await db.batch(statements);
}

export async function readSections(db: D1Database): Promise<Record<SectionKey, SectionDocument>> {
  await seedIfEmpty(db);
  const rows = await db.prepare("SELECT section, document FROM site_sections").all<{ section: SectionKey; document: string }>();
  const result = { ...defaultSections };
  for (const row of rows.results ?? []) if (SECTION_KEYS.includes(row.section)) result[row.section] = parse<SectionDocument>(row.document);
  return result;
}

function projectFromRow(row: Record<string, unknown>): ProjectDocument {
  return {
    id: String(row.id), position: Number(row.position), visibility: row.visibility === "private" ? "private" : "public",
    fields: {
      name: parse(row.name as string), category: parse(row.category as string), description: parse(row.description as string),
      tags: parse(row.tags as string), repoUrl: parse(row.repo_url as string), liveUrl: parse(row.live_url as string),
      style: parse(row.style as string), icon: parse(row.icon as string),
    },
  };
}

export async function readProjects(db: D1Database): Promise<ProjectDocument[]> {
  const rows = await db.prepare("SELECT id, position, visibility, name, category, description, tags, repo_url, live_url, style, icon FROM projects ORDER BY position, id").all<Record<string, unknown>>();
  return (rows.results ?? []).map(projectFromRow);
}

export async function readImages(db: D1Database): Promise<ImageMetadata[]> {
  const rows = await db.prepare("SELECT id, mime, caption, position, visibility, created_at FROM images ORDER BY position, created_at, id").all<Record<string, unknown>>();
  return (rows.results ?? []).map((row) => ({
    id: String(row.id), mime: row.mime as ImageMetadata["mime"], caption: parse(row.caption as string),
    position: Number(row.position), visibility: row.visibility as ImageMetadata["visibility"], created_at: String(row.created_at),
  }));
}

export async function readImage(db: D1Database, id: string) {
  return db.prepare("SELECT id, mime, bytes, visibility FROM images WHERE id = ?").bind(id).first<{ id: string; mime: string; bytes: ArrayBuffer; visibility: string }>();
}

export async function readPublicSnapshot(env: Env) {
  await seedIfEmpty(env.DB);
  const [sections, projects, images] = await Promise.all([readSections(env.DB), readProjects(env.DB), readImages(env.DB)]);
  return publicContent(sections, projects, images);
}

export async function saveSection(db: D1Database, section: SectionKey, document: SectionDocument) {
  await db.prepare("INSERT INTO site_sections (section, document, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(section) DO UPDATE SET document = excluded.document, updated_at = CURRENT_TIMESTAMP").bind(section, json(document)).run();
}

export function decodeProjectRow(row: Record<string, unknown>): ProjectDocument {
  return projectFromRow(row);
}

export function encodeProject(project: ProjectDocument) {
  return projectColumns(project);
}

