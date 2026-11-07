import { ICONS, MAX_IMAGES, MAX_PROJECTS, PROJECT_STYLES, SECTION_KEYS, type EditableField, type ProjectDocument, type SectionDocument, type SectionKey, type Visibility } from "./model";

const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
export const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
export const isVisibility = (value: unknown): value is Visibility => value === "public" || value === "private";
const idPattern = /^[A-Za-z0-9_-]{1,80}$/;
const localized = (value: unknown, max = 5000): value is { vi: string; en?: string } =>
  isRecord(value) && typeof value.vi === "string" && value.vi.length <= max &&
  (!own(value, "en") || (typeof value.en === "string" && value.en.length <= max)) &&
  Object.keys(value).every((key) => key === "vi" || key === "en");

export function validHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; }
  catch { return false; }
}

function validatePlain(value: unknown, path: string, depth: number, maxArray: number): boolean {
  if (depth > 12) return false;
  if (value === null || typeof value === "boolean" || typeof value === "number") return true;
  if (typeof value === "string") return value.length <= (/(^|\.)(label|type|style|icon|mark)$/.test(path) ? 160 : 5000);
  if (Array.isArray(value)) return value.length <= maxArray && value.every((entry, index) => validatePlain(entry, `${path}.${index}`, depth + 1, maxArray));
  if (!isRecord(value)) return false;
  for (const [key, entry] of Object.entries(value)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") return false;
    if (key === "visibility" && !isVisibility(entry)) return false;
    if (["url", "repoUrl", "liveUrl"].includes(key) && !validHttpUrl(entry)) return false;
    if (key === "id" && (typeof entry !== "string" || !idPattern.test(entry))) return false;
    if (key === "style" && typeof entry === "string" && !(PROJECT_STYLES as readonly string[]).includes(entry)) return false;
    if (key === "icon" && typeof entry === "string" && !(ICONS as readonly string[]).includes(entry)) return false;
    if (key === "vi" || key === "en") {
      if (typeof entry !== "string" || entry.length > 5000) return false;
      continue;
    }
    if (!validatePlain(entry, path ? `${path}.${key}` : key, depth + 1, maxArray)) return false;
  }
  return true;
}

function validateFieldMap(value: unknown, maxFields = 60): value is Record<string, EditableField> {
  if (!isRecord(value) || Object.keys(value).length > maxFields) return false;
  return Object.entries(value).every(([key, field]) => {
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,59}$/.test(key) || !isRecord(field) || !isVisibility(field.visibility) || !own(field, "value")) return false;
    if (Object.keys(field).some((fieldKey) => fieldKey !== "value" && fieldKey !== "visibility")) return false;
    if (["url", "repoUrl", "liveUrl"].includes(key) && !validHttpUrl(field.value)) return false;
    if (key === "style" && (typeof field.value !== "string" || !(PROJECT_STYLES as readonly string[]).includes(field.value))) return false;
    if (key === "icon" && (typeof field.value !== "string" || !(ICONS as readonly string[]).includes(field.value))) return false;
    return validatePlain(field.value, key, 0, 50);
  });
}

function validateItems(value: unknown, depth = 0): value is SectionDocument["items"] {
  if (!Array.isArray(value) || value.length > 100 || depth > 8) return false;
  return value.every((item) => isRecord(item) && typeof item.id === "string" && idPattern.test(item.id) &&
    isVisibility(item.visibility) && validateFieldMap(item.fields) &&
    (!own(item, "items") || validateItems(item.items, depth + 1)) &&
    Object.keys(item).every((key) => ["id", "visibility", "fields", "items"].includes(key)));
}

export function validateSectionDocument(section: SectionKey, value: unknown): value is SectionDocument {
  if (!isRecord(value) || !isVisibility(value.visibility)) return false;
  void section;
  if (Object.keys(value).some((key) => !["visibility", "fields", "items"].includes(key))) return false;
  if (own(value, "fields") && !validateFieldMap(value.fields)) return false;
  if (own(value, "items") && !validateItems(value.items)) return false;
  return JSON.stringify(value).length <= 100_000;
}

function fieldValue(document: ProjectDocument, key: string): unknown {
  const entry = document.fields[key];
  return isRecord(entry) ? entry.value : undefined;
}

export function validateProject(value: unknown, requireId = false): value is ProjectDocument {
  if (!isRecord(value) || !isVisibility(value.visibility) || !Number.isInteger(value.position) || (value.position as number) < 0) return false;
  if (requireId && (typeof value.id !== "string" || !idPattern.test(value.id))) return false;
  if (!validateFieldMap(value.fields, 12)) return false;
  const document = value as unknown as ProjectDocument;
  for (const key of ["name", "category", "description"]) if (!localized(fieldValue(document, key))) return false;
  for (const key of ["repoUrl", "liveUrl"]) if (!validHttpUrl(fieldValue(document, key))) return false;
  if (!PROJECT_STYLES.includes(fieldValue(document, "style") as (typeof PROJECT_STYLES)[number])) return false;
  if (!ICONS.includes(fieldValue(document, "icon") as (typeof ICONS)[number])) return false;
  const tags = fieldValue(document, "tags");
  if (!Array.isArray(tags) || tags.length > 10 || !tags.every((tag) => isRecord(tag) && typeof tag.id === "string" && idPattern.test(tag.id) && isVisibility(tag.visibility) && localized(tag.value, 80))) return false;
  return JSON.stringify(value).length <= 30_000;
}

export function validateProjectList(value: unknown): value is ProjectDocument[] {
  return Array.isArray(value) && value.length <= MAX_PROJECTS && value.every((project) => validateProject(project, true));
}

export function validateSectionKey(value: string): value is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(value);
}

export function validateImageInput(value: unknown): value is { id?: string; mime: string; bytes: number[]; caption: EditableField; position: number; visibility: Visibility } {
  return isRecord(value) && (value.id === undefined || (typeof value.id === "string" && idPattern.test(value.id))) &&
    ["image/jpeg", "image/png", "image/webp"].includes(String(value.mime)) && Array.isArray(value.bytes) &&
    value.bytes.length > 0 && value.bytes.length <= 600 * 1024 && value.bytes.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255) &&
    isRecord(value.caption) && isVisibility(value.caption.visibility) && localized(value.caption.value, 300) &&
    Number.isInteger(value.position) && (value.position as number) >= 0 && isVisibility(value.visibility) &&
    (value.visibility === "private" || value.visibility === "public");
}

export function maxImagesReached(count: number): boolean {
  return count >= MAX_IMAGES;
}
