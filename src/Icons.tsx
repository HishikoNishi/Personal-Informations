import type { ReactNode } from "react";

export type IconName =
  | "overview"
  | "code"
  | "projects"
  | "person"
  | "leaf"
  | "style"
  | "heart"
  | "sun"
  | "moon"
  | "pin"
  | "arrow"
  | "spark"
  | "check"
  | "camera"
  | "copy"
  | "mail"
  | "chat"
  | "github"
  | "eye"
  | "eye-off"
  | "close"
  | "edit"
  | "external"
  | "music";

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    code: <path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-16-2 20" />,
    projects: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a23 23 0 0 0 18 0m-9 0v3" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    leaf: <path d="M20 3C7 2 2 8 5 15s16 5 15-12ZM4 21l11-11" />,
    style: <path d="m9 3-6 5 4 5 2-2v10h6V11l2 2 4-5-6-5a3 3 0 0 1-6 0Z" />,
    heart: (
      <path d="M20.5 4.8a5.5 5.5 0 0 0-7.8 0l-.7.7-.7-.7a5.5 5.5 0 0 0-7.8 7.8L12 21l8.5-8.4a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
      </>
    ),
    moon: <path d="M20.9 13a9 9 0 0 1-9.9-9.9A9 9 0 1 0 20.9 13Z" />,
    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    spark: <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    camera: (
      <>
        <path d="M8 6 10 3h4l2 3h4a1 1 0 0 1 1 1v13H3V7a1 1 0 0 1 1-1Z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8V3H3v13h5" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 6 9 7 9-7" />
      </>
    ),
    chat: <path d="M21 11a8 8 0 0 1-8 8H7l-5 3 2-6a8 8 0 0 1-1-5 9 9 0 0 1 18 0Z" />,
    github: (
      <>
        <path d="M9 19c-5 2-5-2-7-2m14 5v-4a4 4 0 0 0-1-3c3 0 6-1.5 6-6a5 5 0 0 0-1.5-3.5A5 5 0 0 0 19 2s-1.5-.5-4 1a14 14 0 0 0-6 0C6.5 1.5 5 2 5 2a5 5 0 0 0-.5 3.5A5 5 0 0 0 3 9c0 4.5 3 6 6 6a4 4 0 0 0-1 3v4" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    "eye-off": (
      <>
        <path d="m3 3 18 18M10 5c7-1 12 7 12 7l-3 4M6 6a22 22 0 0 0-4 6s4 7 10 7a13 13 0 0 0 5-1" />
        <path d="M9 9a4 4 0 0 0 6 6" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    edit: (
      <>
        <path d="m15 4 5 5M3 21l5-1L21 7l-5-5L3 15Z" />
      </>
    ),
    external: <path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7" />,
    music: (
      <>
        <path d="M9 18V5l12-2v13M9 8l12-2" />
        <ellipse cx="6" cy="18" rx="3" ry="3" />
        <ellipse cx="18" cy="16" rx="3" ry="3" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
