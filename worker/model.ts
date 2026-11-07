/// <reference types="@cloudflare/workers-types" />
export type Visibility = "public" | "private";
export type LocalizedText = { vi: string; en?: string };
export type EditableField = { value: unknown; visibility: Visibility };
export type EditableItem = {
  id: string;
  visibility: Visibility;
  fields: Record<string, EditableField>;
  items?: EditableItem[];
};
export type SectionDocument = {
  visibility: Visibility;
  fields?: Record<string, EditableField>;
  items?: EditableItem[];
};
export type SectionKey = "hero" | "overview" | "skills" | "hobbies" | "personality" | "lifestyle" | "style" | "health" | "contacts";
export type ProjectDocument = {
  id: string;
  position: number;
  visibility: Visibility;
  fields: Record<string, EditableField>;
};
export type ImageMetadata = {
  id: string;
  mime: "image/jpeg" | "image/png" | "image/webp";
  caption: EditableField;
  position: number;
  visibility: Visibility;
  created_at: string;
};
export type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD_HASH?: string;
  SESSION_SECRET?: string;
};

export const SECTION_KEYS: readonly SectionKey[] = ["hero", "overview", "skills", "hobbies", "personality", "lifestyle", "style", "health", "contacts"];
export const ICONS = ["overview", "code", "projects", "person", "leaf", "style", "heart", "sun", "moon", "pin", "arrow", "spark", "check", "camera", "copy", "mail", "chat", "github", "eye", "eye-off", "close", "edit", "external", "music"] as const;
export const PROJECT_STYLES = ["sage", "music", "clinic", "neutral"] as const;
export const MAX_PROJECTS = 20;
export const MAX_IMAGES = 24;
export const MAX_IMAGE_BYTES = 600 * 1024;

