import { createContext, useContext, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Icon, type IconName } from "./Icons";
import { profile, tabs, type LocalizedText, type ProfileCell, type TabId } from "./data/profile";
import { content, named, t, type Language } from "./i18n";

const HideEmptyContext = createContext(false);
const LanguageContext = createContext<Language>("vi");
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
  const [failed, setFailed] = useState(false);
  const photo = profile.photo;
  return <div className="avatar-wrap"><div className="photo-frame" aria-label={language === "vi" ? "Ảnh đại diện" : "Profile photo"}>
    {photo && !failed ? <img src={photo} alt={language === "vi" ? "Ảnh đại diện" : "Profile photo"} onError={() => setFailed(true)} /> : <span className="monogram">{profile.monogram}</span>}
  </div></div>;
}

function isUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}

function ContactRow({ contact }: { contact: (typeof profile.contacts)[number] }) {
  const language = useContext(LanguageContext);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const value = contact.value.trim();
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
        {value ? (isUrl(value) ? <a href={value} target="_blank" rel="noreferrer">{value}</a> : value) : <PlaceholderTag />}
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

function ProjectCard({ project, index }: { project: (typeof profile.projects)[number]; index: number }) {
  const language = useContext(LanguageContext);
  return <article className="project-card"><div className={`project-strip project-strip-${project.style}`}><span className="project-symbol"><Icon name={project.icon} size={25} /></span><span className="project-index">0{index + 1}</span></div>
    <div className="project-body"><span className="eyebrow project-category">{text(project.category, language)}</span><h3>{text(project.name, language)}</h3><p>{text(project.description, language) || <PlaceholderTag />}</p>
      <div className="chips">{project.tags.map((tag) => <Chip key={text(tag, language)}>{text(tag, language)}</Chip>)}</div>
      {project.repoUrl && <a className="project-link" href={project.repoUrl} target="_blank" rel="noreferrer"><Icon name="github" size={15} />{t(language, "viewGithub")}<Icon name="external" size={12} /></a>}
    </div>
  </article>;
}

function TabContent({ active }: { active: TabId }) {
  const language = useContext(LanguageContext);
  const hideEmpty = useContext(HideEmptyContext);
  if (active === "tong-quan") return <CellGrid cells={profile.overview} />;
  if (active === "ky-nang") return <div className="info-grid skills-grid">{profile.skills.map((group, i) => <InfoCell key={text(group.label, language)} label={text(group.label, language)} number={`0${i + 1}`} wide={i === profile.skills.length - 1}><div className="chips">{group.items.map((item) => <Chip key={text(item, language)} variant={i === 0 ? "accent" : "default"}>{text(item, language)}</Chip>)}</div></InfoCell>)}</div>;
  if (active === "du-an") return <div className="project-grid">{profile.projects.map((project, i) => <ProjectCard key={text(project.name, language)} project={project} index={i} />)}</div>;
  if (active === "so-thich") {
    const hobbies = hideEmpty ? profile.hobbies.filter((cell) => text(cell.value, language)) : profile.hobbies;
    if (!hobbies.length) return <EmptyState />;
    return <><div className="info-grid">{hobbies.map((cell, i) => <div className="info-cell" key={text(cell.label, language)}><div className="cell-label"><span>{text(cell.label, language)}</span><span className="cell-number">0{i + 1}</span></div><p className="cell-hint">{text(cell.hint, language)}</p><div className="cell-value">{text(cell.value, language) || <PlaceholderTag />}</div></div>)}</div><div className="gallery-heading"><span className="cell-label">{t(language, "gallery")}</span><span>{t(language, "galleryCaption")}</span></div><div className="photo-gallery">{[1, 2, 3, 4].map((i) => <div className="gallery-placeholder" key={i} aria-label={language === "vi" ? `Ảnh ${i} chưa điền` : `Photo ${i} not filled in`}><Icon name="camera" size={22} /><PlaceholderTag /></div>)}</div></>;
  }
  if (active === "tinh-cach") return <CellGrid cells={profile.personality} />;
  if (active === "loi-song") return <CellGrid cells={profile.lifestyle} />;
  if (active === "phong-cach") return <CellGrid cells={profile.style} />;
  if (active === "suc-khoe") return <><CellGrid cells={profile.health} health /><p className="privacy-note"><Icon name="heart" size={15} />{t(language, "healthPrivacy")}</p></>;
  const contacts = hideEmpty ? profile.contacts.filter((contact) => contact.value.trim()) : profile.contacts;
  return contacts.length ? <div className="contact-grid">{contacts.map((contact) => <ContactRow key={contact.id} contact={contact} />)}</div> : <EmptyState />;
}

function AppTab({ index, active, onSelect, onKeyDown }: { index: number; active: boolean; onSelect: () => void; onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void }) {
  const language = useContext(LanguageContext);
  const tab = tabs[index];
  return <button role="tab" id={`tab-${index}`} aria-controls={`panel-${index}`} aria-selected={active} tabIndex={active ? 0 : -1} className={`tab${active ? " active" : ""}`} onClick={onSelect} onKeyDown={onKeyDown}><Icon name={tab.icon} size={16} /><span>{text(tab.label, language)}</span></button>;
}

export default function App() {
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
  return <LanguageContext.Provider value={language}><HideEmptyContext.Provider value={hideEmpty}><div className={`site${dark ? " dark" : ""}`}><div className="page-shell">
    <header className="site-header"><a className="wordmark" href="#" aria-label={t(language, "top")}><span className="brand-mark">hn<span>.</span></span><span className="brand-divider" /><span>{t(language, "tagline")}</span></a><div className="header-controls"><div className="language-toggle" role="group" aria-label={t(language, "language")}><button className={language === "vi" ? "selected" : ""} aria-pressed={language === "vi"} onClick={() => setLanguage("vi")} aria-label="Tiếng Việt">VI</button><span aria-hidden="true">|</span><button className={language === "en" ? "selected" : ""} aria-pressed={language === "en"} onClick={() => setLanguage("en")} aria-label="English">EN</button></div><span className="control-divider" /><ThemeToggle dark={dark} onToggle={() => setDark(!dark)} /></div></header>
    <main><section className="hero" aria-labelledby="profile-name"><div className="hero-profile"><PhotoFrame /><div className="hero-identity"><p className="eyebrow">{t(language, "profile")}</p><h1 id="profile-name">{text(profile.nickname, language)}<span>.</span></h1><p className="real-name">{text(profile.fullName, language)}</p></div><span className="hero-hello" aria-hidden="true">{t(language, "hello")}</span></div>
      {!hideEmpty && <div className="intro-area"><span className="intro-quote" aria-hidden="true">“</span>{text(profile.intro, language) || <PlaceholderTag>{t(language, "introPlaceholder")}</PlaceholderTag>}<span className="intro-guides" aria-hidden="true"><i /><i /></span></div>}
      <div className="hero-bottom"><span><Icon name="pin" size={14} />{text(profile.location, language) || <PlaceholderTag>{t(language, "locationPlaceholder")}</PlaceholderTag>}</span><span>{t(language, "heroNote")}<Icon name="spark" size={13} /></span></div></section>
      <div className="tab-bar" role="tablist" aria-label={t(language, "tabList")} ref={tabList}>{tabs.map((tab, index) => <AppTab key={tab.id} index={index} active={active === index} onSelect={() => setActive(index)} onKeyDown={(event) => handleTabKey(event, index)} />)}</div>
      <div className="content-toolbar"><span className="section-kicker"><span />{active === 0 ? t(language, "welcome") : t(language, "more")}</span><button className={`empty-toggle${hideEmpty ? " enabled" : ""}`} aria-pressed={hideEmpty} onClick={() => setHideEmpty(!hideEmpty)}><Icon name={hideEmpty ? "eye-off" : "eye"} size={14} /><span>{hideEmpty ? t(language, "showEmpty") : t(language, "hideEmpty")}</span><span className="switch-track"><span /></span></button></div>
      <section className="content-panel" role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`} tabIndex={0}><div key={active} className="panel-content"><div className="panel-heading"><div><h2>{active === 0 ? t(language, "who") : text(tabs[active].label, language)}</h2><p>{text(profile.tabDescriptions[tabs[active].id], language)}</p></div><span className="section-number" aria-hidden="true">0{active + 1}<span>{t(language, "sectionCount")}</span></span></div><TabContent active={tabs[active].id} /></div><div className="panel-footnote"><Icon name="spark" size={14} /><span>{active === 8 ? t(language, "contactFootnote") : t(language, "defaultFootnote")}</span><span className="footnote-line" /></div></section>
    </main><footer className="site-footer"><span>© 2026 {text(profile.nickname, language)}<span className="footer-separator">/</span>{t(language, "footer")}</span><span className="footer-signoff">{t(language, "thanks")}<Icon name="arrow" size={15} /></span></footer>
  </div></div></HideEmptyContext.Provider></LanguageContext.Provider>;
}
