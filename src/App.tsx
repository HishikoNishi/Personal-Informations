import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { Icon, type IconName } from "./Icons";
import { tabs, type LocalizedText, type ProfileCell, type TabId } from "./data/profile";
import { content, named, t, type Language } from "./i18n";
import { bundledView, publicToView, type AdminContent, type ViewProfile } from "./content";
import { ProfileEditor } from "./Editor";
import type { SectionKey } from "../worker/model";

declare global {
  interface Window {
    profileLogin?: (username: string, password: string) => Promise<void>;
  }
}

const HideEmptyContext = createContext(false);
const LanguageContext = createContext<Language>("vi");
const ProfileContext = createContext<ViewProfile>(bundledView());
const text = (value: LocalizedText | undefined, language: Language) => content(value, language);

function PlaceholderTag({ children }: { children?: ReactNode }) {
  const language = useContext(LanguageContext);
  const placeholder = children ?? t(language, "placeholder");
  return <span className="placeholder-tag"><span />{placeholder}</span>;
}

function Chip({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "accent" }) {
  return <span className={`chip chip-${variant}`}>{children}</span>;
}

function InfoCell({ label, children, wide = false, number }: { label: string; children?: ReactNode; wide?: boolean; number?: string }) {
  const hideEmpty = useContext(HideEmptyContext);
  if (!children && hideEmpty) return null;
  return <div className={`info-cell${wide ? " info-cell-wide" : ""}`} data-empty={!children}>
    <div className="cell-label"><span>{label}</span>{number && <span className="cell-number">{number}</span>}</div>
    <div className="cell-value">{children || <PlaceholderTag />}</div>
  </div>;
}

function EmptyState() {
  const language = useContext(LanguageContext);
  return <div className="empty-state"><span className="empty-icon"><Icon name="leaf" size={25} /></span><h3>{t(language, "emptyTitle")}</h3><p>{t(language, "emptyBody")}<br />{t(language, "emptyHelp")}</p></div>;
}

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const language = useContext(LanguageContext);
  const label = t(language, dark ? "themeLight" : "themeDark");
  return <button className="theme-toggle icon-button" onClick={onToggle} aria-label={label} aria-pressed={dark} title={label}><Icon name={dark ? "sun" : "moon"} size={17} /></button>;
}

function PhotoFrame() {
  const language = useContext(LanguageContext);
  const viewProfile = useContext(ProfileContext);
  const [failed, setFailed] = useState(false);
  const photo = viewProfile.photo;
  return <div className="avatar-wrap"><div className="photo-frame" aria-label={language === "vi" ? "Ảnh đại diện" : "Profile photo"}>
    {photo && !failed ? <img src={photo} alt={language === "vi" ? "Ảnh đại diện" : "Profile photo"} onError={() => setFailed(true)} /> : <span className="monogram">{viewProfile.monogram}</span>}
  </div></div>;
}

function isUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}

function ContactRow({ contact }: { contact: ViewProfile["contacts"][number] }) {
  const language = useContext(LanguageContext);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const value = contact.value.trim();
  const href = contact.url || (isUrl(value) ? value : "");
  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true); setError(false);
      window.setTimeout(() => setCopied(false), 2500);
    } catch { setError(true); }
  }
  return <div className={`contact-row${copied ? " copied" : ""}`}>
    <div className="contact-main">
      <span className="contact-icon">{contact.mark || <Icon name={contact.icon} size={20} />}</span>
      <span className="contact-text"><span className="cell-label">{text(contact.label, language)}</span><span className="contact-handle">
        {value ? (href ? <a href={href} target="_blank" rel="noreferrer">{value}</a> : value) : <PlaceholderTag />}
      </span></span>
    </div>
    <button className="copy-button icon-button" onClick={copy} disabled={!value} aria-label={named(t(language, copied ? "copiedLabel" : "copyLabel"), text(contact.label, language))} title={value ? t(language, "copy") : t(language, "noCopy")}><Icon name={copied ? "check" : "copy"} size={16} /></button>
    <span className="copy-feedback" role="status">{copied ? t(language, "copied") : error ? t(language, "copyError") : ""}</span>
  </div>;
}

function CellGrid({ cells, numbered = true, health = false }: { cells: readonly ProfileCell[]; numbered?: boolean; health?: boolean }) {
  const language = useContext(LanguageContext);
  const hideEmpty = useContext(HideEmptyContext);
  if (hideEmpty && cells.every((cell) => !text(cell.value, language))) return <EmptyState />;
  return <div className={`info-grid${health ? " health-grid" : ""}`}>
    {cells.map((cell, i) => <InfoCell key={text(cell.label, language)} label={text(cell.label, language)} number={numbered ? `0${i + 1}` : undefined}>
      {cell.value && text(cell.value, language)}
    </InfoCell>)}
  </div>;
}

function ProjectCard({ project, index }: { project: ViewProfile["projects"][number]; index: number }) {
  const language = useContext(LanguageContext);
  return <article className="project-card"><div className={`project-strip project-strip-${project.style}`}><span className="project-symbol"><Icon name={project.icon} size={25} /></span><span className="project-index">0{index + 1}</span></div>
    <div className="project-body"><span className="eyebrow project-category">{text(project.category, language)}</span><h3>{text(project.name, language)}</h3><p>{text(project.description, language) || <PlaceholderTag />}</p>
      <div className="chips">{project.tags.map((tag) => <Chip key={text(tag, language)}>{text(tag, language)}</Chip>)}</div>
      {project.repoUrl && <a className="project-link" href={project.repoUrl} target="_blank" rel="noreferrer"><Icon name="github" size={15} />{t(language, "viewGithub")}<Icon name="external" size={12} /></a>}
      {project.liveUrl && <a className="project-link" href={project.liveUrl} target="_blank" rel="noreferrer"><Icon name="external" size={15} />{t(language, "viewLive")}<Icon name="external" size={12} /></a>}
    </div>
  </article>;
}

function TabContent({ active }: { active: TabId }) {
  const language = useContext(LanguageContext);
  const viewProfile = useContext(ProfileContext);
  const hideEmpty = useContext(HideEmptyContext);
  if (active === "tong-quan") return <CellGrid cells={viewProfile.overview} />;
  if (active === "ky-nang") return <div className="info-grid skills-grid">{viewProfile.skills.map((group, i) => <InfoCell key={text(group.label, language)} label={text(group.label, language)} number={`0${i + 1}`} wide={i === viewProfile.skills.length - 1}><div className="chips">{group.items.map((item) => <Chip key={text(item, language)} variant={i === 0 ? "accent" : "default"}>{text(item, language)}</Chip>)}</div></InfoCell>)}</div>;
  if (active === "du-an") return <div className="project-grid">{viewProfile.projects.map((project, i) => <ProjectCard key={project.id} project={project} index={i} />)}</div>;
  if (active === "so-thich") {
    const hobbies = hideEmpty ? viewProfile.hobbies.filter((cell) => text(cell.value, language)) : viewProfile.hobbies;
    if (!hobbies.length) return <EmptyState />;
    return <><div className="info-grid">{hobbies.map((cell, i) => <div className="info-cell" key={text(cell.label, language)}><div className="cell-label"><span>{text(cell.label, language)}</span><span className="cell-number">0{i + 1}</span></div><p className="cell-hint">{text(cell.hint, language)}</p><div className="cell-value">{text(cell.value, language) || <PlaceholderTag />}</div></div>)}</div><div className="gallery-heading"><span className="cell-label">{t(language, "gallery")}</span><span>{t(language, "galleryCaption")}</span></div><div className="photo-gallery">{viewProfile.images.length ? viewProfile.images.map((image) => <figure className="gallery-photo" key={image.id}><img src={image.url} alt={text(image.caption, language)} /><figcaption>{text(image.caption, language) || <PlaceholderTag />}</figcaption></figure>) : [1, 2, 3, 4].map((i) => <div className="gallery-placeholder" key={i} aria-label={language === "vi" ? `Ảnh ${i} chưa điền` : `Photo ${i} not filled in`}><Icon name="camera" size={22} /><PlaceholderTag /></div>)}</div></>;
  }
  if (active === "tinh-cach") return <CellGrid cells={viewProfile.personality} />;
  if (active === "loi-song") return <CellGrid cells={viewProfile.lifestyle} />;
  if (active === "phong-cach") return <CellGrid cells={viewProfile.style} />;
  if (active === "suc-khoe") return <><CellGrid cells={viewProfile.health} health /><p className="privacy-note"><Icon name="heart" size={15} />{t(language, "healthPrivacy")}</p></>;
  const contacts = hideEmpty ? viewProfile.contacts.filter((contact) => contact.value.trim()) : viewProfile.contacts;
  return contacts.length ? <div className="contact-grid">{contacts.map((contact) => <ContactRow key={contact.id} contact={contact} />)}</div> : <EmptyState />;
}

function AppTab({ index, active, onSelect, onKeyDown }: { index: number; active: boolean; onSelect: () => void; onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void }) {
  const language = useContext(LanguageContext);
  const tab = tabs[index];
  return <button role="tab" id={`tab-${index}`} aria-controls={`panel-${index}`} aria-selected={active} tabIndex={active ? 0 : -1} className={`tab${active ? " active" : ""}`} onClick={onSelect} onKeyDown={onKeyDown}><Icon name={tab.icon} size={16} /><span>{text(tab.label, language)}</span></button>;
}

export default function App() {
  const [viewProfile, setViewProfile] = useState<ViewProfile>(() => bundledView());
  const [adminContent, setAdminContent] = useState<AdminContent | null>(null);
  const [savedContent, setSavedContent] = useState<AdminContent | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const [importCandidate, setImportCandidate] = useState<unknown>(null);
  const [discardAction, setDiscardAction] = useState<"cancel" | "logout" | null>(null);
  const dirty = Boolean(adminContent && savedContent && JSON.stringify(adminContent) !== JSON.stringify(savedContent));
  const localizedUi: Record<Language, Record<string, string>> = {
    vi: { login: "Đăng nhập", loginTitle: "Đăng nhập quản trị", loginDescription: "Đăng nhập để chỉnh sửa hồ sơ cá nhân.", username: "Tên đăng nhập", password: "Mật khẩu", loginSubmit: "Đăng nhập", loginBusy: "Đang đăng nhập…", edit: "Chế độ chỉnh sửa", logout: "Đăng xuất", saving: "Đang lưu…", save: "Lưu thay đổi", cancel: "Hủy", dirty: "Có thay đổi chưa lưu", saved: "Đã lưu thay đổi.", saveError: "Chưa lưu được. Hãy kiểm tra kết nối rồi thử lại.", cancelConfirm: "Bỏ các thay đổi chưa lưu?", export: "Xuất JSON", import: "Nhập JSON", importTitle: "Xem trước bản sao lưu", importConfirm: "Thay thế nội dung hiện tại bằng bản sao lưu này?", importError: "Tệp JSON không hợp lệ hoặc không thể nhập.", importSuccess: "Đã nhập bản sao lưu.", backupInfo: "Bản sao lưu gồm nội dung và ảnh đang lưu.", loading: "Đang tải…" },
    en: { login: "Sign in", loginTitle: "Owner sign in", loginDescription: "Sign in to edit this personal profile.", username: "Username", password: "Password", loginSubmit: "Sign in", loginBusy: "Signing in…", edit: "Edit mode", logout: "Sign out", saving: "Saving…", save: "Save changes", cancel: "Cancel", dirty: "Unsaved changes", saved: "Changes saved.", saveError: "Could not save. Check your connection and try again.", cancelConfirm: "Discard unsaved changes?", export: "Export JSON", import: "Import JSON", importTitle: "Backup preview", importConfirm: "Replace current content with this backup?", importError: "The JSON file is invalid or could not be imported.", importSuccess: "Backup imported.", backupInfo: "The backup includes content and stored images.", loading: "Loading…" },
  };
  const uiText = (key: string) => localizedUi[language][key] ?? key;
  const [language, setLanguage] = useState<Language>(() => {
    try { return localStorage.getItem("language") === "en" ? "en" : "vi"; }
    catch { return "vi"; }
  });
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved === "dark";
    } catch { /* Storage can be unavailable in private browsing contexts. */ }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const tabFromHash = () => {
    const index = tabs.findIndex((tab) => `#${tab.id}` === window.location.hash);
    return index < 0 ? 0 : index;
  };
  const [active, setActive] = useState(tabFromHash);
  const [hideEmpty, setHideEmpty] = useState(false);
  const tabList = useRef<HTMLDivElement>(null);
  const loginDialog = useRef<HTMLDialogElement>(null);
  const api = async (url: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (init.method && init.method !== "GET") headers.set("X-Requested-With", "fetch");
    const response = await fetch(url, { ...init, headers, credentials: "same-origin" });
    if (!response.ok) {
      let message = "";
      try { message = (await response.json() as { error?: string }).error ?? ""; } catch { /* Keep a localized fallback. */ }
      throw new Error(message || `Request failed (${response.status})`);
    }
    return response;
  };
  const loadPublic = async () => {
    try { const response = await api("/api/content"); setViewProfile(publicToView(await response.json())); } catch { /* Bundled data remains available when the Worker is offline. */ }
  };
  const loadAdmin = async () => {
    const response = await api("/api/admin/content");
    const snapshot = await response.json() as AdminContent;
    setAdminContent(snapshot); setSavedContent(snapshot); setViewProfile(publicToView(snapshot));
  };
  useEffect(() => {
    void loadPublic();
    void api("/api/auth/me").then(async (response) => {
      const status = await response.json() as { authenticated?: boolean };
      if (status.authenticated) { setAuthenticated(true); try { await loadAdmin(); } catch { setAuthenticated(false); } }
    }).catch(() => undefined);
  }, []);
  useEffect(() => { if (editMode && adminContent) setViewProfile(publicToView(adminContent)); }, [adminContent, editMode]);
  useEffect(() => {
    if (!authenticated) {
      window.profileLogin = async (username, password) => {
        try {
          await api("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
          setAuthenticated(true); setEditMode(true); await loadAdmin(); setNotice(language === "vi" ? "Đăng nhập thành công." : "Signed in successfully.");
        } catch (error) {
          setAuthenticated(false); setEditMode(false);
          if (error instanceof Error) throw error;
          throw new Error(language === "vi" ? "Không thể đăng nhập lúc này." : "Unable to sign in right now.");
        }
      };
    } else {
      delete window.profileLogin;
    }
    return () => { delete window.profileLogin; };
  }, [authenticated, language]);
  useEffect(() => {
    if (!loginOpen) return;
    const dialog = loginDialog.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, [loginOpen]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const finishLogout = async () => {
    setBusy(true);
    try { await api("/api/auth/logout", { method: "POST" }); } catch { /* Local UI still clears the session state. */ }
    setAuthenticated(false); setEditMode(false); setAdminContent(null); setSavedContent(null); await loadPublic(); setBusy(false);
  };
  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");
    setLoginBusy(true);
    try {
      if (!window.profileLogin) throw new Error(language === "vi" ? "Chưa thể đăng nhập lúc này. Hãy tải lại trang rồi thử lại." : "Sign in is unavailable. Reload the page and try again.");
      await window.profileLogin(loginUsername, loginPassword);
      setLoginOpen(false);
      setLoginPassword("");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : language === "vi" ? "Không thể đăng nhập lúc này." : "Unable to sign in right now.");
      setLoginPassword("");
    } finally {
      setLoginBusy(false);
    }
  };
  const logout = async () => {
    if (dirty) { setDiscardAction("logout"); return; }
    await finishLogout();
  };
  const discardEdits = async () => {
    if (!adminContent || !savedContent) return;
    const savedIds = new Set(savedContent.images.map((image) => image.id));
    const newIds = adminContent.images.filter((image) => !savedIds.has(image.id)).map((image) => image.id);
    for (const id of newIds) { try { await api(`/api/admin/images/${encodeURIComponent(id)}`, { method: "DELETE" }); } catch { /* An orphan remains private and can be removed later. */ } }
    setAdminContent(savedContent); setViewProfile(publicToView(savedContent)); setEditMode(false);
  };
  const cancelEdits = async () => {
    if (dirty) { setDiscardAction("cancel"); return; }
    await discardEdits();
  };
  const confirmDiscard = async () => {
    const action = discardAction; setDiscardAction(null);
    if (action === "logout") await finishLogout();
    else if (action === "cancel") await discardEdits();
  };
  const saveEdits = async () => {
    if (!adminContent) return;
    setBusy(true);
    setSaveError("");
    try {
      const ordered = { ...adminContent, images: adminContent.images.map((image, position) => ({ ...image, position })) };
      await api("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ordered) });
      setAdminContent(ordered); setSavedContent(ordered); setViewProfile(publicToView(ordered)); setNotice(uiText("saved"));
    } catch (error) { setSaveError(error instanceof Error ? error.message : uiText("saveError")); }
    finally { setBusy(false); }
  };
  const resizeAndUpload = async (file: File, caption = { vi: "", en: "" }) => {
    setBusy(true);
    try {
      const image = await createImageBitmap(file);
      const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d"); if (!context) throw new Error(uiText("saveError"));
      context.drawImage(image, 0, 0, canvas.width, canvas.height); image.close();
      let blob: Blob | null = null; let quality = 0.88;
      while (quality >= 0.38) { blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality)); if (blob && blob.size <= 600 * 1024) break; quality -= 0.1; }
      if (!blob || blob.size > 600 * 1024) throw new Error(uiText("saveError"));
      const form = new FormData(); form.set("file", new File([blob], "upload.webp", { type: "image/webp" })); form.set("caption", JSON.stringify(caption));
      const response = await api("/api/admin/images", { method: "POST", body: form }); const uploaded = await response.json() as AdminContent["images"][number];
      setAdminContent((previous) => previous ? { ...previous, images: [...previous.images, active === 0 ? { ...uploaded, visibility: "public" as const } : uploaded], sections: active === 0 ? { ...previous.sections, hero: { ...previous.sections.hero, fields: { ...previous.sections.hero.fields, photo: { value: `/api/images/${uploaded.id}`, visibility: "public" } } } } : previous.sections } : previous);
      setNotice("");
    } catch (error) { setNotice(error instanceof Error ? error.message : uiText("saveError")); }
    finally { setBusy(false); }
  };
  const exportBackup = async () => {
    try { const response = await api("/api/admin/export"); const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "personal-information-backup.json"; link.click(); URL.revokeObjectURL(url); }
    catch (error) { setNotice(error instanceof Error ? error.message : uiText("saveError")); }
  };
  const importFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file || file.size > 20 * 1024 * 1024) { setNotice(uiText("importError")); return; }
    try { const value: unknown = JSON.parse(await file.text()); if (!value || typeof value !== "object" || (value as { version?: unknown }).version !== 1 || !Array.isArray((value as { projects?: unknown }).projects) || !Array.isArray((value as { images?: unknown }).images) || !(value as { sections?: unknown }).sections || typeof (value as { sections?: unknown }).sections !== "object") throw new Error(); setImportCandidate(value); }
    catch { setNotice(uiText("importError")); }
  };
  const confirmImport = async () => {
    setBusy(true);
    try { await api("/api/admin/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(importCandidate) }); await loadAdmin(); setImportCandidate(null); setNotice(uiText("importSuccess")); }
    catch (error) { setNotice(error instanceof Error ? error.message : uiText("importError")); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    themeColor?.setAttribute("content", dark ? "#0b1114" : "#f1f4f6");
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch { /* Ignore unavailable storage. */ }
  }, [dark]);
  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem("language", language); } catch { /* Ignore unavailable storage. */ }
  }, [language]);
  useEffect(() => {
    const updateFromHash = () => setActive(tabFromHash());
    window.addEventListener("hashchange", updateFromHash);
    return () => window.removeEventListener("hashchange", updateFromHash);
  }, []);
  useEffect(() => {
    const hash = `#${tabs[active].id}`;
    if (window.location.hash !== hash) window.history.replaceState(null, "", hash);
  }, [active]);
  useEffect(() => {
    const list = tabList.current;
    const button = list?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[active];
    if (!list || !button) return;
    const left = button.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft;
    if (left < list.scrollLeft + 6 || left + button.offsetWidth > list.scrollLeft + list.clientWidth - 6) {
      list.scrollTo({ left: left - (list.clientWidth - button.offsetWidth) / 2, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
  }, [active]);
  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault(); setActive(next);
    tabList.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus({ preventScroll: true });
  }
  return <LanguageContext.Provider value={language}><ProfileContext.Provider value={viewProfile}><HideEmptyContext.Provider value={hideEmpty}><div className={`site${dark ? " dark" : ""}`}><div className="page-shell">
    <header className="site-header"><a className="wordmark" href="#" aria-label={t(language, "top")}><span className="brand-mark">hn<span>.</span></span><span className="brand-divider" /><span>{t(language, "tagline")}</span></a><div className="header-controls">{!authenticated && <button className="secondary-button owner-control" onClick={() => { setLoginError(""); setLoginOpen(true); }}>{uiText("login")}</button>}{authenticated && <><button className={`secondary-button owner-control${editMode ? " selected" : ""}`} aria-pressed={editMode} onClick={() => { if (editMode) void cancelEdits(); else setEditMode(true); }}>{uiText("edit")}</button><button className="secondary-button owner-control" onClick={() => void logout()}>{uiText("logout")}</button></>}<div className="language-toggle" role="group" aria-label={t(language, "language")}><button className={language === "vi" ? "selected" : ""} aria-pressed={language === "vi"} onClick={() => setLanguage("vi")} aria-label="Tiếng Việt">VI</button><span aria-hidden="true">|</span><button className={language === "en" ? "selected" : ""} aria-pressed={language === "en"} onClick={() => setLanguage("en")} aria-label="English">EN</button></div><span className="control-divider" /><ThemeToggle dark={dark} onToggle={() => setDark(!dark)} /></div></header>
    <main><section className="hero" aria-labelledby="profile-name"><div className="hero-profile"><PhotoFrame /><div className="hero-identity"><p className="eyebrow">{t(language, "profile")}</p><h1 id="profile-name">{text(viewProfile.nickname, language)}<span>.</span></h1><p className="real-name">{text(viewProfile.fullName, language)}</p></div><span className="hero-hello" aria-hidden="true">{t(language, "hello")}</span></div>
      {!hideEmpty && <div className="intro-area"><span className="intro-quote" aria-hidden="true">“</span>{text(viewProfile.intro, language) || <PlaceholderTag>{t(language, "introPlaceholder")}</PlaceholderTag>}<span className="intro-guides" aria-hidden="true"><i /><i /></span></div>}
      <div className="hero-bottom"><span><Icon name="pin" size={14} />{text(viewProfile.location, language) || <PlaceholderTag>{t(language, "locationPlaceholder")}</PlaceholderTag>}</span><span>{t(language, "heroNote")}<Icon name="spark" size={13} /></span></div></section>
      <div className="tab-bar" role="tablist" aria-label={t(language, "tabList")} ref={tabList}>{tabs.map((tab, index) => <AppTab key={tab.id} index={index} active={active === index} onSelect={() => setActive(index)} onKeyDown={(event) => handleTabKey(event, index)} />)}</div>
      <div className="content-toolbar"><span className="section-kicker"><span />{active === 0 ? t(language, "welcome") : t(language, "more")}</span>{!editMode && <button className={`empty-toggle${hideEmpty ? " enabled" : ""}`} aria-pressed={hideEmpty} onClick={() => setHideEmpty(!hideEmpty)}><Icon name={hideEmpty ? "eye-off" : "eye"} size={14} /><span>{hideEmpty ? t(language, "showEmpty") : t(language, "hideEmpty")}</span><span className="switch-track"><span /></span></button>}</div>
      <section className="content-panel" role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`} tabIndex={0}><div key={active} className="panel-content"><div className="panel-heading"><div><h2>{active === 0 ? t(language, "who") : text(tabs[active].label, language)}</h2><p>{text(viewProfile.tabDescriptions[tabs[active].id], language)}</p></div><span className="section-number" aria-hidden="true">0{active + 1}<span>{t(language, "sectionCount")}</span></span></div><TabContent active={tabs[active].id} />{editMode && adminContent && <ProfileEditor activeTab={tabs[active].id} language={language} data={adminContent} setData={setAdminContent as React.Dispatch<React.SetStateAction<AdminContent>>} onUpload={resizeAndUpload} />}</div><div className="panel-footnote"><Icon name="spark" size={14} /><span>{active === 8 ? t(language, "contactFootnote") : t(language, "defaultFootnote")}</span><span className="footnote-line" /></div></section>
    </main><footer className="site-footer"><span>© 2026 {text(viewProfile.nickname, language)}<span className="footer-separator">/</span>{t(language, "footer")}</span><span className="footer-signoff">{t(language, "thanks")}<Icon name="arrow" size={15} /></span></footer>
    {editMode && adminContent && <div className="editor-sticky" role="region" aria-label={uiText("edit")}><span className={dirty ? "dirty-indicator is-dirty" : "dirty-indicator"}>{dirty ? uiText("dirty") : uiText("saveHint")}</span><button className="secondary-button" onClick={() => void exportBackup()} disabled={busy}>{uiText("export")}</button><label className="secondary-button import-button">{uiText("import")}<input type="file" accept="application/json,.json" onChange={importFile} /></label><button className="secondary-button" onClick={() => void cancelEdits()} disabled={busy}>{uiText("cancel")}</button><button className="primary-button" onClick={() => void saveEdits()} disabled={busy || !dirty}>{busy ? uiText("saving") : uiText("save")}</button>{saveError && <span className="save-error" role="alert">{saveError}</span>}</div>}
    {loginOpen && !authenticated && <dialog ref={loginDialog} className="modal login-modal" aria-labelledby="login-title" onCancel={(event) => { event.preventDefault(); setLoginOpen(false); }} onClose={() => setLoginOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setLoginOpen(false); }}>
      <div className="modal-heading"><div><h2 id="login-title">{uiText("loginTitle")}</h2><p className="modal-description">{uiText("loginDescription")}</p></div><button type="button" className="icon-button" aria-label={uiText("cancel")} onClick={() => setLoginOpen(false)}><Icon name="close" /></button></div>
      <form className="login-form" onSubmit={(event) => void submitLogin(event)}>
        <label className="form-label">{uiText("username")}<input className="text-input" name="username" type="text" autoComplete="username" maxLength={128} required autoFocus value={loginUsername} onChange={(event) => setLoginUsername(event.target.value)} /></label>
        <label className="form-label">{uiText("password")}<input className="text-input" name="password" type="password" autoComplete="current-password" maxLength={1024} required value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} /></label>
        {loginError && <p className="form-error" role="alert">{loginError}</p>}
        <div className="form-actions"><button type="button" className="secondary-button" disabled={loginBusy} onClick={() => setLoginOpen(false)}>{uiText("cancel")}</button><button type="submit" className="primary-button" disabled={loginBusy}>{loginBusy ? uiText("loginBusy") : uiText("loginSubmit")}</button></div>
      </form>
    </dialog>}
    {notice && <div className="app-toast" role="status">{notice}</div>}
    {importCandidate !== null && <dialog className="modal" open><div className="modal-heading"><h2>{uiText("importTitle")}</h2><button className="icon-button" aria-label={uiText("cancel")} onClick={() => setImportCandidate(null)}><Icon name="close" /></button></div><p className="modal-description">{uiText("backupInfo")} {uiText("importConfirm")}<br />{language === "vi" ? `Dự án: ${(importCandidate as { projects: unknown[] }).projects.length} · Ảnh: ${(importCandidate as { images: unknown[] }).images.length}` : `Projects: ${(importCandidate as { projects: unknown[] }).projects.length} · Photos: ${(importCandidate as { images: unknown[] }).images.length}`}</p><div className="form-actions"><button className="secondary-button" onClick={() => setImportCandidate(null)}>{uiText("cancel")}</button><button className="primary-button" disabled={busy} onClick={() => void confirmImport()}>{busy ? uiText("saving") : uiText("import")}</button></div></dialog>}
    {discardAction && <dialog className="modal" open><div className="modal-heading"><h2>{uiText("cancelConfirm")}</h2><button className="icon-button" aria-label={uiText("cancel")} onClick={() => setDiscardAction(null)}><Icon name="close" /></button></div><div className="form-actions"><button className="secondary-button" onClick={() => setDiscardAction(null)}>{language === "vi" ? "Tiếp tục chỉnh sửa" : "Keep editing"}</button><button className="primary-button" onClick={() => void confirmDiscard()}>{language === "vi" ? "Bỏ thay đổi" : "Discard changes"}</button></div></dialog>}
  </div></div></HideEmptyContext.Provider></ProfileContext.Provider></LanguageContext.Provider>;
}
