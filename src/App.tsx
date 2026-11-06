import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "./Icons";

const HideEmptyContext = createContext(false);
const tabs: { label: string; icon: IconName; description: string }[] = [
  {
    label: "Tổng quan",
    icon: "overview",
    description: "Một vài điều cơ bản, để chúng mình bắt đầu làm quen.",
  },
  {
    label: "Kỹ năng",
    icon: "code",
    description: "Những thứ mình biết làm, và vẫn đang học thêm mỗi ngày.",
  },
  {
    label: "Dự án",
    icon: "projects",
    description: "Một vài ý tưởng mình đã thử biến thành hiện thực.",
  },
  {
    label: "Sở thích",
    icon: "music",
    description: "Những điều nhỏ khiến một ngày của mình thú vị hơn.",
  },
  {
    label: "Tính cách",
    icon: "person",
    description: "Hiểu mình thêm một chút, ngoài những lời giới thiệu.",
  },
  {
    label: "Lối sống",
    icon: "leaf",
    description: "Nhịp sống thường ngày và những điều mình đang hướng tới.",
  },
  {
    label: "Phong cách",
    icon: "style",
    description: "Gu của mình, từ cách ăn mặc đến cách chuyện trò.",
  },
  {
    label: "Sức khỏe",
    icon: "heart",
    description: "Một góc chia sẻ nhỏ, trong giới hạn mình thấy thoải mái.",
  },
  { label: "Liên hệ", icon: "chat", description: "Nếu có điều muốn kể, cứ nhắn cho mình nhé." },
];

function PlaceholderTag({ children = "Chưa điền" }: { children?: ReactNode }) {
  return (
    <span className="placeholder-tag">
      <span />
      {children}
    </span>
  );
}

function Chip({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "accent";
}) {
  return <span className={`chip chip-${variant}`}>{children}</span>;
}

function InfoCell({
  label,
  children,
  wide = false,
  number,
}: {
  label: string;
  children?: ReactNode;
  wide?: boolean;
  number?: string;
}) {
  const hideEmpty = useContext(HideEmptyContext);
  if (!children && hideEmpty) return null;
  return (
    <div className={`info-cell${wide ? " info-cell-wide" : ""}`} data-empty={!children}>
      <div className="cell-label">
        <span>{label}</span>
        {number && <span className="cell-number">{number}</span>}
      </div>
      <div className="cell-value">{children || <PlaceholderTag />}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name="leaf" size={25} />
      </span>
      <h3>Một khoảng trống, để dành.</h3>
      <p>
        Mình chưa chia sẻ điều gì ở đây.
        <br />
        Bạn có thể bật lại các ô trống để xem những mục đang chờ điền.
      </p>
    </div>
  );
}

const projects = [
  {
    name: "Great Sage",
    description: "Trợ lý AI bằng giọng nói trên máy tính.",
    style: "sage",
    icon: "spark" as const,
    category: "MỘT NGƯỜI BẠN ẢO",
    tags: ["AI", "Giọng nói"],
  },
  {
    name: "Music-app",
    description: "Trình phát nhạc chạy nền, điều khiển qua khay hệ thống.",
    style: "music",
    icon: "music" as const,
    category: "CHO NHỮNG LÚC NGHE NHẠC",
    tags: ["Âm nhạc", "Máy tính"],
  },
  {
    name: "clinic-management-system",
    description: "Hệ thống quản lý phòng khám, C# và Vue.js.",
    style: "clinic",
    icon: "heart" as const,
    category: "MỘT BÀI TOÁN THỰC TẾ",
    tags: ["C#", "Vue.js"],
  },
];

function ProjectCard({ project, index }: { project: (typeof projects)[number]; index: number }) {
  return (
    <article className="project-card">
      <div className={`project-strip project-strip-${project.style}`}>
        <span className="project-symbol">
          <Icon name={project.icon} size={25} />
        </span>
        <span className="project-index">0{index + 1}</span>
      </div>
      <div className="project-body">
        <span className="eyebrow project-category">{project.category}</span>
        <h3>{project.name}</h3>
        <p>{project.description}</p>
        <div className="chips">
          {project.tags.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
        <a
          className="project-link"
          href={`https://github.com/search?q=${encodeURIComponent(project.name)}&type=repositories`}
          target="_blank"
          rel="noreferrer"
          title={`Tìm ${project.name} trên GitHub`}
        >
          <Icon name="github" size={15} />
          Xem trên GitHub
          <Icon name="external" size={12} />
        </a>
      </div>
    </article>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Đóng">
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function PhotoFrame() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [sample, setSample] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const uploaded = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (uploaded.current) URL.revokeObjectURL(uploaded.current);
    },
    [],
  );
  function useMonogram() {
    setPhoto(null);
    setSample(false);
    setOpen(false);
  }
  return (
    <>
      <div className="avatar-wrap">
        <button
          className="photo-frame"
          aria-label="Thay đổi ảnh đại diện"
          onClick={() => setOpen(true)}
        >
          {photo ? (
            <img
              src={photo}
              alt={sample ? "Ảnh chân dung minh họa, không phải chủ hồ sơ" : "Ảnh đại diện đã chọn"}
              onError={() => {
                setPhoto(null);
                setError("Không tải được ảnh. Bạn thử chọn ảnh từ thiết bị nhé.");
              }}
            />
          ) : (
            <span className="monogram">HN</span>
          )}
          <span className="avatar-edit">
            <Icon name="camera" size={13} />
          </span>
        </button>
        {sample && <span className="sample-caption">Ảnh minh họa</span>}
      </div>
      {open && (
        <Modal title="Một gương mặt, một câu chuyện" onClose={() => setOpen(false)}>
          <p className="modal-description">
            Chọn cách bạn muốn xuất hiện. Ảnh chỉ dùng trong lần xem này, không được tải lên máy
            chủ.
          </p>
          <div className="photo-options">
            <button className="option-button" onClick={useMonogram}>
              <span className="mini-monogram">HN</span>
              <span>
                Dùng chữ viết tắt<small>Đơn giản, vẫn là mình</small>
              </span>
              <Icon name="arrow" />
            </button>
            <button
              className="option-button"
              onClick={() => {
                setPhoto("/images/portrait-demo.jpg");
                setSample(true);
                setOpen(false);
              }}
            >
              <Icon name="person" size={24} />
              <span>
                Thử ảnh chân dung<small>Ảnh minh họa của Hà Nguyễn · Unsplash</small>
              </span>
              <Icon name="arrow" />
            </button>
            <label className="upload-option">
              <Icon name="camera" size={18} />
              Chọn ảnh từ thiết bị
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Chọn ảnh từ thiết bị"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (
                    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
                    file.size > 8 * 1024 * 1024
                  ) {
                    setError("Vui lòng chọn ảnh JPG, PNG hoặc WebP dưới 8 MB.");
                    return;
                  }
                  if (uploaded.current) URL.revokeObjectURL(uploaded.current);
                  uploaded.current = URL.createObjectURL(file);
                  setPhoto(uploaded.current);
                  setSample(false);
                  setError("");
                  setOpen(false);
                }}
              />
            </label>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </Modal>
      )}
    </>
  );
}

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      className="theme-toggle icon-button"
      onClick={onToggle}
      aria-label={dark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      aria-pressed={dark}
      title={dark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
    >
      <Icon name={dark ? "sun" : "moon"} size={17} />
    </button>
  );
}

function LanguageToggle() {
  const [notice, setNotice] = useState(false);
  return (
    <div className="language-wrap">
      <div className="language-toggle" role="group" aria-label="Ngôn ngữ">
        <button
          className="selected"
          aria-pressed="true"
          onClick={() => setNotice(false)}
          aria-label="Tiếng Việt"
        >
          VI
        </button>
        <span aria-hidden="true">|</span>
        <button
          aria-pressed="false"
          aria-label="Tiếng Anh — đang chuẩn bị"
          onClick={() => setNotice(!notice)}
        >
          EN
        </button>
      </div>
      {notice && (
        <div className="language-notice" role="status">
          Mình đang chuẩn bị phiên bản tiếng Anh. Hẹn bạn sớm nhé.
          <button
            className="icon-button"
            onClick={() => setNotice(false)}
            aria-label="Đóng thông báo"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

const contactTypes: { name: string; icon: IconName; mark?: string }[] = [
  { name: "Facebook", icon: "person", mark: "f" },
  { name: "Zalo", icon: "chat", mark: "Z" },
  { name: "Discord", icon: "chat" },
  { name: "GitHub", icon: "github" },
  { name: "Email", icon: "mail" },
];

function ContactRow({
  contact,
  value,
  onEdit,
}: {
  contact: (typeof contactTypes)[number];
  value: string;
  onEdit: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function copy() {
    if (!value) {
      onEdit();
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setError(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setError(true);
    }
  }
  return (
    <div className={`contact-row${copied ? " copied" : ""}`}>
      <button
        className="contact-main"
        onClick={onEdit}
        aria-label={`Điền hoặc sửa ${contact.name}`}
      >
        <span className="contact-icon">
          {contact.mark || <Icon name={contact.icon} size={20} />}
        </span>
        <span className="contact-text">
          <span className="cell-label">{contact.name}</span>
          <span className="contact-handle">{value || <PlaceholderTag />}</span>
        </span>
        <span className="contact-edit">
          <Icon name="edit" size={13} />
        </span>
      </button>
      <button
        className="copy-button icon-button"
        onClick={copy}
        aria-label={copied ? `Đã sao chép ${contact.name}` : `Sao chép ${contact.name}`}
        title={value ? "Sao chép" : "Điền thông tin để sao chép"}
      >
        <Icon name={copied ? "check" : "copy"} size={16} />
      </button>
      <span className="copy-feedback" role="status">
        {copied ? "Đã sao chép" : error ? "Chưa sao chép được. Hãy thử lại." : ""}
      </span>
    </div>
  );
}

function ContactPanel({
  values,
  setValues,
}: {
  values: Record<string, string>;
  setValues: (values: Record<string, string>) => void;
}) {
  const hideEmpty = useContext(HideEmptyContext);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const shown = contactTypes.filter((c) => !hideEmpty || values[c.name]);
  return (
    <>
      {shown.length ? (
        <div className="contact-grid">
          {shown.map((contact) => (
            <ContactRow
              key={contact.name}
              contact={contact}
              value={values[contact.name] || ""}
              onEdit={() => {
                setEditing(contact.name);
                setDraft(values[contact.name] || "");
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
      <p className="panel-note">
        Chưa có thông tin liên hệ thật. Nhấn vào một mục để thử điền và sao chép; thông tin chỉ giữ
        trong lần xem này.
      </p>
      {editing && (
        <Modal title={`Liên hệ qua ${editing}`} onClose={() => setEditing(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setValues({ ...values, [editing]: draft.trim() });
              setEditing(null);
            }}
          >
            <label className="form-label" htmlFor="contact-value">
              {editing === "Email" ? "Địa chỉ email" : "Tên tài khoản hoặc đường dẫn"}
            </label>
            <input
              autoFocus
              id="contact-value"
              className="text-input"
              type={editing === "Email" ? "email" : "text"}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Điền thông tin của bạn"
              maxLength={250}
            />
            <p className="modal-description">
              Chỉ dùng để thử giao diện, không lưu vào hồ sơ thật.
            </p>
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setEditing(null)}>
                Hủy
              </button>
              <button className="primary-button" type="submit">
                Dùng trong bản xem thử
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function TabContent({
  active,
  contacts,
  setContacts,
}: {
  active: number;
  contacts: Record<string, string>;
  setContacts: (values: Record<string, string>) => void;
}) {
  const hideEmpty = useContext(HideEmptyContext);
  if (active === 0)
    return (
      <div className="info-grid">
        <InfoCell label="Biệt danh" number="01">
          HishikoNíhi
        </InfoCell>
        <InfoCell label="Họ và tên" number="02">
          Trang Hùng Gia Bảo
        </InfoCell>
        <InfoCell label="Tuổi" number="03" />
        <InfoCell label="Nơi ở" number="04">
          Khu vực Đà Nẵng, Việt Nam
        </InfoCell>
        <InfoCell label="Học vấn" number="05">
          Tốt nghiệp cao đẳng ngành phát triển phần mềm
        </InfoCell>
        <InfoCell label="Ngôn ngữ" number="06">
          Tiếng Việt và tiếng Anh, đang ôn IELTS.
        </InfoCell>
      </div>
    );
  if (active === 1)
    return (
      <div className="info-grid skills-grid">
        {[
          { label: "Frontend", chips: ["Vue.js", "React"] },
          { label: "Backend", chips: ["C#", "Node.js"] },
          { label: "Dữ liệu và triển khai", chips: ["SQL", "Docker"] },
          { label: "Công cụ code", chips: ["Visual Studio", "VS Code"] },
          {
            label: "Sáng tạo",
            chips: ["Sản xuất nhạc (FL Studio)", "Thiết kế đồ họa", "Dựng video"],
          },
        ].map((group, i) => (
          <InfoCell key={group.label} label={group.label} number={`0${i + 1}`} wide={i === 4}>
            <div className="chips">
              {group.chips.map((chip) => (
                <Chip key={chip} variant={i === 0 ? "accent" : "default"}>
                  {chip}
                </Chip>
              ))}
            </div>
          </InfoCell>
        ))}
      </div>
    );
  if (active === 2)
    return (
      <>
        <div className="project-grid">
          {projects.map((project, index) => (
            <ProjectCard key={project.name} project={project} index={index} />
          ))}
        </div>
        <p className="panel-note">
          Chưa có đường dẫn kho mã cụ thể; các liên kết mở tìm kiếm theo tên trên GitHub.
        </p>
      </>
    );
  if (active === 3)
    return hideEmpty ? (
      <EmptyState />
    ) : (
      <>
        <div className="info-grid">
          {[
            { label: "Âm nhạc", hint: "Thể loại nghe và làm" },
            { label: "Game", hint: "Đang chơi" },
            { label: "Nhiếp ảnh", hint: "Máy ảnh, kiểu ảnh" },
          ].map((item, i) => (
            <div className="info-cell" key={item.label}>
              <div className="cell-label">
                {item.label}
                <span className="cell-number">0{i + 1}</span>
              </div>
              <p className="cell-hint">{item.hint}</p>
              <PlaceholderTag />
            </div>
          ))}
        </div>
        <div className="gallery-heading">
          <span className="cell-label">Một vài khoảnh khắc</span>
          <span>Góc ảnh của mình</span>
        </div>
        <div className="photo-gallery">
          {[1, 2, 3, 4].map((i) => (
            <div className="gallery-placeholder" key={i} aria-label={`Ảnh ${i} chưa điền`}>
              <Icon name="camera" size={22} />
              <PlaceholderTag />
            </div>
          ))}
        </div>
      </>
    );
  if (active === 5)
    return (
      <div className="info-grid">
        <InfoCell label="Một ngày của mình" number="01" />
        <InfoCell label="Thói quen" number="02" />
        <InfoCell label="Đang theo đuổi" number="03" wide>
          Có việc làm đầu tiên ở vị trí junior frontend, nhận thêm dự án freelance và hoàn thiện
          trang portfolio.
        </InfoCell>
      </div>
    );
  if (active === 8) return <ContactPanel values={contacts} setValues={setContacts} />;
  const emptyLabels: Record<number, string[]> = {
    4: ["Điểm mạnh", "Điểm yếu", "Ba từ mô tả mình", "Thích", "Không thích"],
    6: ["Ăn mặc", "Thẩm mỹ", "Cách giao tiếp", "Điều nên biết khi chơi với mình"],
    7: ["Điều nên biết", "Ghi chú"],
  };
  return (
    <>
      {hideEmpty ? (
        <EmptyState />
      ) : (
        <div className={`info-grid${active === 7 ? " health-grid" : ""}`}>
          {emptyLabels[active].map((label, i) => (
            <InfoCell key={label} label={label} number={`0${i + 1}`} />
          ))}
        </div>
      )}
      {active === 7 && (
        <p className="privacy-note">
          <Icon name="heart" size={15} />
          Chỉ ghi những gì bạn thấy thoải mái chia sẻ.
        </p>
      )}
    </>
  );
}

function Tab({
  index,
  active,
  onSelect,
  onKeyDown,
}: {
  index: number;
  active: boolean;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      role="tab"
      id={`tab-${index}`}
      aria-controls={`panel-${index}`}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      className={`tab${active ? " active" : ""}`}
      onClick={onSelect}
      onKeyDown={onKeyDown}
    >
      <Icon name={tabs[index].icon} size={16} />
      <span>{tabs[index].label}</span>
    </button>
  );
}

export default function App() {
  const [dark, setDark] = useState(false);
  const [active, setActive] = useState(0);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const tabList = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = tabList.current;
    const button = list?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[active];
    if (!list || !button) return;
    // Only scroll the tab strip; never move the page when changing panels.
    const left =
      button.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (
      left < list.scrollLeft + 6 ||
      left + button.offsetWidth > list.scrollLeft + list.clientWidth - 6
    )
      list.scrollTo({
        left: left - (list.clientWidth - button.offsetWidth) / 2,
        behavior: reducedMotion ? "instant" : "smooth",
      });
  }, [active]);
  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    tabList.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [next]?.focus({ preventScroll: true });
  }
  return (
    <HideEmptyContext.Provider value={hideEmpty}>
      <div className={`site${dark ? " dark" : ""}`}>
        <div className="page-shell">
          <header className="site-header">
            <a className="wordmark" href="#" aria-label="Về đầu trang">
              <span className="brand-mark">
                hn<span>.</span>
              </span>
              <span className="brand-divider" />
              <span>một chút về mình</span>
            </a>
            <div className="header-controls">
              <LanguageToggle />
              <span className="control-divider" />
              <ThemeToggle dark={dark} onToggle={() => setDark(!dark)} />
            </div>
          </header>
          <main>
            <section className="hero" aria-labelledby="profile-name">
              <div className="hero-profile">
                <PhotoFrame />
                <div className="hero-identity">
                  <p className="eyebrow">HỒ SƠ CÁ NHÂN</p>
                  <h1 id="profile-name">
                    HishikoNíhi<span>.</span>
                  </h1>
                  <p className="real-name">Trang Hùng Gia Bảo</p>
                </div>
                <span className="hero-hello" aria-hidden="true">
                  chào bạn.
                </span>
              </div>
              {!hideEmpty && (
                <div className="intro-area">
                  <span className="intro-quote" aria-hidden="true">
                    “
                  </span>
                  <PlaceholderTag>Viết vài câu giới thiệu về bản thân ở đây.</PlaceholderTag>
                  <span className="intro-guides" aria-hidden="true">
                    <i />
                    <i />
                  </span>
                </div>
              )}
              <div className="hero-bottom">
                <span>
                  <Icon name="pin" size={14} />
                  Đà Nẵng, Việt Nam
                </span>
                <span>
                  Một góc nhỏ, để bạn hiểu mình hơn.
                  <Icon name="spark" size={13} />
                </span>
              </div>
            </section>
            <div className="tab-bar" role="tablist" aria-label="Các mục hồ sơ" ref={tabList}>
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.label}
                  index={index}
                  active={active === index}
                  onSelect={() => setActive(index)}
                  onKeyDown={(event) => handleTabKey(event, index)}
                />
              ))}
            </div>
            <div className="content-toolbar">
              <span className="section-kicker">
                <span />
                {active === 0 ? "RẤT VUI VÌ BẠN GHÉ QUA" : "THÊM MỘT CHÚT VỀ MÌNH"}
              </span>
              <button
                className={`empty-toggle${hideEmpty ? " enabled" : ""}`}
                aria-pressed={hideEmpty}
                onClick={() => setHideEmpty(!hideEmpty)}
              >
                <Icon name={hideEmpty ? "eye-off" : "eye"} size={14} />
                <span>{hideEmpty ? "Hiện ô trống" : "Ẩn ô trống"}</span>
                <span className="switch-track">
                  <span />
                </span>
              </button>
            </div>
            <section
              className="content-panel"
              role="tabpanel"
              id={`panel-${active}`}
              aria-labelledby={`tab-${active}`}
              tabIndex={0}
            >
              <div key={active} className="panel-content">
                <div className="panel-heading">
                  <div>
                    <h2>{active === 0 ? "Mình là ai?" : tabs[active].label}</h2>
                    <p>{tabs[active].description}</p>
                  </div>
                  <span className="section-number" aria-hidden="true">
                    0{active + 1}
                    <span> / 09</span>
                  </span>
                </div>
                <TabContent active={active} contacts={contacts} setContacts={setContacts} />
              </div>
              <div className="panel-footnote">
                <Icon name="spark" size={14} />
                <span>
                  {active === 8
                    ? "Một lời chào nhỏ cũng có thể bắt đầu một tình bạn."
                    : "Không cần hoàn hảo, chỉ cần là chính mình."}
                </span>
                <span className="footnote-line" />
              </div>
            </section>
          </main>
          <footer className="site-footer">
            <span>
              © 2026 HishikoNíhi<span className="footer-separator">/</span>Một góc nhỏ trên
              internet.
            </span>
            <span className="footer-signoff">
              Cảm ơn bạn đã ghé chơi.
              <Icon name="arrow" size={15} />
            </span>
          </footer>
        </div>
      </div>
    </HideEmptyContext.Provider>
  );
}
