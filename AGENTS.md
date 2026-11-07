# Personal profile

React 19 + Vite + Tailwind CSS v4 personal profile page in Vietnamese. This is a friendly page for friends and new acquaintances, not a recruiting or business site. Preserve its existing visual identity, layout, copy and nine tabs unless a task specifically asks for a change.

## Project structure

- `src/main.tsx` mounts `src/App.tsx` and imports `src/index.css`.
- `src/App.tsx` contains the UI and interaction logic.
- `src/Icons.tsx` contains the icon set.
- `src/index.css` contains Tailwind imports, local font faces, theme tokens and component styles.
- `src/data/profile.ts` is the editable source for personal content.
- `src/i18n.ts` contains the typed Vietnamese and English UI strings.
- `worker/index.ts` routes Worker API requests; `worker/db.ts`, `worker/defaults.ts`, and `worker/validation.ts` own persistence, seed data, and input checks.
- `migrations/` contains D1 schema migrations; `tests/` contains Vitest coverage.
- `index.html` contains document metadata and startup theme handling.
- `public/` contains static assets; put the profile photo at `public/images/avatar.jpg`.
- `vite.config.ts` configures Vite, React, Tailwind CSS and the `@` alias.

## Scripts

- `npm run dev` starts the development server.
- `npm run typecheck` runs `tsc --noEmit`.
- `npm run build` creates the production site in `dist/`.
- `npm run preview` serves the production build locally.
- `npm test` runs Vitest.
- `npm run worker:dev` starts the local Cloudflare Worker.
- `npm run db:migrate:local` applies D1 migrations to the local database.
- `npm run format` formats files with oxfmt.

## Content and implementation rules

- Keep all visible text in Vietnamese with correct diacritics in the default language.
- Never invent personal facts, habits, health details, contacts, links or other owner content. Unknown values stay empty and display `Chưa điền` unless empty cells are hidden.
- Keep the nine sections: Tổng quan, Kỹ năng, Dự án, Sở thích, Tính cách, Lối sống, Phong cách, Sức khỏe and Liên hệ.
- Preserve light and dark theme tokens, Be Vietnam Pro, Bricolage Grotesque and JetBrains Mono fonts.
- Preserve accessible tab roles and arrow-key navigation, visible focus rings, dialog behavior where dialogs exist, and `prefers-reduced-motion` support.
- Avoid new runtime dependencies unless required; ask before adding one.
- Keep personal content editable in `src/data/profile.ts`; do not duplicate owner facts in UI components.
- Use URL hash navigation for tabs and guarded localStorage access for persistent preferences.
- Keep Cloudflare Worker development independent of remote account access and undeclared environment variables.
- Never run Wrangler commands against a remote account during development; use local D1 and `wrangler dev`.
- Public Worker responses must filter private content on the server; every owner API requires authentication and state-changing requests require origin and CSRF checks.
- Never commit `.dev.vars`, account passwords, password hashes, session secrets, or private image bytes.

Tailwind CSS v4 is configured through `@tailwindcss/vite`; global element styles belong inside `@layer base` so utility classes remain effective.
