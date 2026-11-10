import { profile } from "../src/data/profile";
import type { EditableField, EditableItem, ProjectDocument, SectionDocument, SectionKey, Visibility } from "./model";

const localized = (value: { vi: string; en?: string }): EditableField => ({ value, visibility: "public" });
const plain = (value: string): EditableField => ({ value, visibility: "public" });

function cell(id: string, data: { label: { vi: string; en?: string }; value?: { vi: string; en?: string }; hint?: { vi: string; en?: string } }, visibility: Visibility): EditableItem {
  return {
    id,
    visibility,
    fields: {
      label: { ...localized(data.label), visibility },
      value: { ...localized(data.value ?? { vi: "" }), visibility },
      ...(data.hint ? { hint: { ...localized(data.hint), visibility } } : {}),
    },
  };
}

const publicCells = (key: string, cells: readonly { label: { vi: string; en?: string }; value?: { vi: string; en?: string }; hint?: { vi: string; en?: string } }[]) =>
  cells.map((entry, index) => cell(`${key}-${index + 1}`, entry, "public"));

const healthCells = profile.health.map((entry, index) => cell(`health-${index + 1}`, entry, "private"));
const skills: EditableItem[] = profile.skills.map((group, index) => ({
  id: `skill-group-${index + 1}`,
  visibility: "public",
  fields: { label: localized(group.label) },
  items: group.items.map((value, tagIndex) => ({
    id: `skill-${index + 1}-${tagIndex + 1}`,
    visibility: "public",
    fields: { value: localized(value) },
  })),
}));

export const defaultSections: Record<SectionKey, SectionDocument> = {
  hero: {
    visibility: "public",
    fields: {
      nickname: localized(profile.nickname),
      fullName: localized(profile.fullName),
      location: localized(profile.location),
      intro: localized(profile.intro),
      photo: plain(profile.photo),
      monogram: plain(profile.monogram),
      ...Object.fromEntries(Object.entries(profile.tabDescriptions).map(([tabId, description]) => [`tabDescription_${tabId}`, localized(description)])),
    },
  },
  overview: { visibility: "public", items: publicCells("overview", profile.overview) },
  skills: { visibility: "public", items: skills },
  hobbies: { visibility: "public", items: publicCells("hobby", profile.hobbies) },
  personality: { visibility: "public", items: publicCells("personality", profile.personality) },
  lifestyle: { visibility: "public", items: publicCells("lifestyle", profile.lifestyle) },
  style: { visibility: "public", items: publicCells("style", profile.style) },
  health: { visibility: "private", items: healthCells },
  contacts: {
    visibility: "public",
    items: profile.contacts.map((contact) => ({
      id: contact.id,
      visibility: "public",
      fields: {
        type: plain(contact.id),
        label: localized(contact.label),
        value: plain(contact.value),
        url: plain(""),
        icon: plain(contact.icon),
        mark: plain(contact.mark ?? ""),
      },
    })),
  },
};

const projectField = (value: unknown): EditableField => ({ value, visibility: "public" });
export const defaultProjects: ProjectDocument[] = profile.projects.map((project, index) => ({
  id: `seed-project-${index + 1}`,
  position: index,
  visibility: "public",
  fields: {
    name: projectField(project.name),
    type: projectField(project.type),
    category: projectField(project.category),
    description: projectField(project.description),
    tags: projectField(project.tags.map((tag, tagIndex) => ({ id: `seed-project-${index + 1}-tag-${tagIndex + 1}`, visibility: "public", value: tag }))),
    repoUrl: projectField(project.repoUrl),
    liveUrl: projectField(""),
    style: projectField(project.style),
    icon: projectField(project.icon),
  },
}));

