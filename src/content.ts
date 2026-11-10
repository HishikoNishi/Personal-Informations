import type { IconName } from "./Icons";
import { profile as bundledProfile, type LocalizedText, type ProfileCell, type Project, type TabId } from "./data/profile";
import type { ImageMetadata, ProjectDocument, SectionDocument, SectionKey } from "../worker/model";

export type AdminContent = {
  sections: Record<SectionKey, SectionDocument>;
  projects: ProjectDocument[];
  images: ImageMetadata[];
};

export type ViewProject = Omit<Project, "style"> & { id: string; liveUrl: string; style: Project["style"] | "neutral" };
export type ViewHobby = Omit<ProfileCell, "value"> & { value?: LocalizedText | LocalizedText[]; hint?: LocalizedText };
export type ViewContact = { id: string; label: LocalizedText; icon: IconName; mark?: string; value: string; url: string };
export type ViewImage = { id: string; caption: LocalizedText; url: string };
export type ViewProfile = {
  nickname: LocalizedText;
  fullName: LocalizedText;
  monogram: string;
  location: LocalizedText;
  photo: string;
  intro: LocalizedText;
  tabDescriptions: Record<TabId, LocalizedText>;
  overview: ProfileCell[];
  skills: { label: LocalizedText; items: LocalizedText[] }[];
  projects: ViewProject[];
  hobbies: ViewHobby[];
  personality: ProfileCell[];
  lifestyle: ProfileCell[];
  style: ProfileCell[];
  health: ProfileCell[];
  contacts: ViewContact[];
  images: ViewImage[];
};

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
const emptyText = (): LocalizedText => ({ vi: "", en: "" });
const asText = (value: unknown): LocalizedText => isObject(value) && typeof value.vi === "string"
  ? { vi: value.vi, ...(typeof value.en === "string" ? { en: value.en } : {}) }
  : emptyText();
const asString = (value: unknown) => typeof value === "string" ? value : "";
function unwrap(value: unknown): unknown {
  return isObject(value) && Object.prototype.hasOwnProperty.call(value, "value") ? value.value : value;
}
function fields(section: unknown): Record<string, unknown> {
  return isObject(section) && isObject(section.fields) ? section.fields : {};
}
function items(section: unknown): Record<string, unknown>[] {
  return isObject(section) && Array.isArray(section.items) ? section.items.filter(isObject) : [];
}
function itemFields(item: Record<string, unknown>) {
  return isObject(item.fields) ? item.fields : {};
}
function profileCells(section: unknown): ProfileCell[] {
  return items(section).map((item) => {
    const row = itemFields(item);
    const label = asText(unwrap(row.label));
    const value = asText(unwrap(row.value));
    const hint = asText(unwrap(row.hint));
    return { label, value, ...(Object.prototype.hasOwnProperty.call(row, "hint") ? { hint } : {}) };
  });
}

function hobbyCells(section: unknown): ViewHobby[] {
  return items(section).map((item) => {
    const row = itemFields(item);
    const rawValue = unwrap(row.value);
    const value = Array.isArray(rawValue) ? rawValue.map(asText) : asText(rawValue);
    return {
      label: asText(unwrap(row.label)),
      value,
      hint: asText(unwrap(row.hint)),
    };
  });
}

export function bundledView(): ViewProfile {
  return {
    nickname: bundledProfile.nickname, fullName: bundledProfile.fullName, monogram: bundledProfile.monogram,
    location: bundledProfile.location, photo: bundledProfile.photo, intro: bundledProfile.intro,
    tabDescriptions: bundledProfile.tabDescriptions, overview: [...bundledProfile.overview],
    skills: bundledProfile.skills.map((group) => ({ label: group.label, items: [...group.items] })),
    projects: bundledProfile.projects.map((project, index) => ({ ...project, id: `bundled-${index}`, liveUrl: "" })),
    hobbies: [...bundledProfile.hobbies], personality: [...bundledProfile.personality], lifestyle: [...bundledProfile.lifestyle],
    style: [...bundledProfile.style], health: [...bundledProfile.health],
    contacts: bundledProfile.contacts.map((contact) => ({ ...contact, url: "" })), images: [],
  };
}

export function publicToView(value: unknown): ViewProfile {
  if (!isObject(value) || !isObject(value.sections) || !Array.isArray(value.projects) || !Array.isArray(value.images)) throw new TypeError("Invalid public content");
  const sections = value.sections;
  const hero = fields(sections.hero);
  const descriptions = {} as Record<TabId, LocalizedText>;
  for (const id of Object.keys(bundledProfile.tabDescriptions) as TabId[]) descriptions[id] = asText(unwrap(hero[`tabDescription_${id}`]));
  const projects = value.projects.filter(isObject).map((project, index): ViewProject => {
    const row = fields(project);
    const style = asString(unwrap(row.style));
    const icon = asString(unwrap(row.icon));
    const rawTags = unwrap(row.tags);
    return {
      id: asString(project.id) || `public-${index}`,
      name: asText(unwrap(row.name)), type: asText(unwrap(row.type)), category: asText(unwrap(row.category)), description: asText(unwrap(row.description)),
      tags: Array.isArray(rawTags) ? rawTags.filter(isObject).map((tag) => asText(unwrap(tag.value))) : [],
      repoUrl: asString(unwrap(row.repoUrl)), liveUrl: asString(unwrap(row.liveUrl)),
      style: ["sage", "music", "clinic", "neutral"].includes(style) ? style as ViewProject["style"] : "neutral",
      icon: icon as IconName,
    };
  });
  const skills = items(sections.skills).map((group) => ({
    label: asText(unwrap(itemFields(group).label)),
    items: Array.isArray(group.items) ? group.items.filter(isObject).map((tag) => asText(unwrap(itemFields(tag).value))) : [],
  }));
  const contacts = items(sections.contacts).map((contact, index) => {
    const row = itemFields(contact);
    const iconName = asString(unwrap(row.icon));
    return { id: asString(contact.id) || `contact-${index}`, label: asText(unwrap(row.label)), icon: iconName as IconName, mark: asString(unwrap(row.mark)) || undefined, value: asString(unwrap(row.value)), url: asString(unwrap(row.url)) };
  });
  const avatarId = asString(unwrap(hero.photo)).match(/^\/api\/images\/([^/?#]+)/)?.[1];
  const images = value.images.filter(isObject).filter((image) => asString(image.id) !== avatarId).map((image) => ({ id: asString(image.id), caption: asText(unwrap(image.caption)), url: `/api/images/${encodeURIComponent(asString(image.id))}` }));
  return {
    nickname: asText(unwrap(hero.nickname)), fullName: asText(unwrap(hero.fullName)), monogram: asString(unwrap(hero.monogram)) || "HN",
    location: asText(unwrap(hero.location)), intro: asText(unwrap(hero.intro)), photo: asString(unwrap(hero.photo)), tabDescriptions: descriptions,
    overview: profileCells(sections.overview), skills, projects,
    hobbies: hobbyCells(sections.hobbies),
    personality: profileCells(sections.personality), lifestyle: profileCells(sections.lifestyle), style: profileCells(sections.style),
    health: profileCells(sections.health), contacts, images,
  };
}

