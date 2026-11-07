import type { ImageMetadata, ProjectDocument, SectionDocument, SectionKey, Visibility } from "./model";

/** Remove private items and private editable-field values before a response is serialized. */
export function filterPublic<T>(value: T): unknown {
  if (Array.isArray(value)) return value.map(filterPublic).filter((item) => item !== undefined);
  if (!value || typeof value !== "object") return value;

  const source = value as Record<string, unknown>;
  if (source.visibility === "private") return undefined;

  if (Object.prototype.hasOwnProperty.call(source, "value") && (source.visibility === "public" || source.visibility === "private")) {
    return filterPublic(source.value);
  }

  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(source)) {
    if (key === "visibility") continue;
    const filtered = filterPublic(entry);
    if (filtered !== undefined) output[key] = filtered;
  }
  return output;
}

export function publicContent(
  sections: Record<SectionKey, SectionDocument>,
  projects: ProjectDocument[],
  images: ImageMetadata[],
) {
  return {
    sections: filterPublic(sections),
    projects: filterPublic(projects),
    images: filterPublic(images.filter((image) => image.visibility === "public")),
  };
}
