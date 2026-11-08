import type { LocalizedText } from "./data/profile";
import { profile } from "./data/profile";

export type Language = "vi" | "en";
export const ui = {
  vi: {
    language: "Ngôn ngữ", themeLight: "Chuyển sang chế độ sáng", themeDark: "Chuyển sang chế độ tối",
    top: "Về đầu trang", tagline: "một chút về mình", profile: "HỒ SƠ CÁ NHÂN", hello: "chào bạn.",
    introPlaceholder: "Viết vài câu giới thiệu về bản thân ở đây.", locationPlaceholder: "Chưa điền",
    heroNote: "Một góc nhỏ, để bạn hiểu mình hơn.", tabList: "Các mục hồ sơ", welcome: "RẤT VUI VÌ BẠN GHÉ QUA",
    more: "THÊM MỘT CHÚT VỀ MÌNH", showEmpty: "Hiện ô trống", hideEmpty: "Ẩn ô trống",
    who: "Mình là ai?", sectionCount: " / 09", contactFootnote: "Một lời chào nhỏ cũng có thể bắt đầu một tình bạn.",
    defaultFootnote: "Không cần hoàn hảo, chỉ cần là chính mình.", emptyTitle: "Một khoảng trống, để dành.",
    emptyBody: "Mình chưa chia sẻ điều gì ở đây.", emptyHelp: "Bạn có thể bật lại các ô trống để xem những mục đang chờ điền.",
    gallery: "Một vài khoảnh khắc", galleryCaption: "Góc ảnh của mình", healthPrivacy: "Chỉ ghi những gì bạn thấy thoải mái chia sẻ.",
    placeholder: "Chưa điền", copy: "Sao chép", copied: "Đã sao chép", copyLabel: "Sao chép {name}", copiedLabel: "Đã sao chép {name}",
    noCopy: "Chưa có thông tin để sao chép", copyError: "Chưa sao chép được. Hãy thử lại.",
    viewGithub: "Xem trên GitHub", viewLive: "Mở dự án", footer: "Một góc nhỏ trên internet.", thanks: "Cảm ơn bạn đã ghé chơi.",
    sideToc: "Dạo quanh một chút", sideProgress: "Đang mở", sideSkipNote: "Không cần đọc theo thứ tự. Cứ ghé điều bạn tò mò.",
    sideGreeting: "cứ tự nhiên nhé", sideTitle: "Chậm một chút, hiểu nhau hơn.", sideBody: "Một vài câu chuyện nhỏ, một vài điều thân quen. Cứ tự nhiên khám phá nhé.",
    sideQuickTitle: "Những niềm vui nhỏ", sideHobbies: "Một chút âm nhạc", sideContact: "Gửi mình lời chào",
    heroRegistration: "MỘT GÓC NHỎ TRÊN INTERNET", heroInterestSkills: "Kỹ năng", heroInterestHobbies: "Sở thích", heroInterestContact: "Liên hệ",
    overviewDetailLabel: "NGOÀI NHỮNG DÒNG MÃ", overviewDetailTitle: "Mình còn có những niềm vui nhỏ.", overviewDetailBody: "Khám phá những điều mình quan tâm ở mục Sở thích.",
    overviewCurrentLabel: "CHƯƠNG HIỆN TẠI", overviewCurrentTitle: "Từng bước, tìm lối đi của mình.", overviewCurrentBody: "", overviewCurrentLink: "Xem điều mình đang theo đuổi",
    galleryMoment: "Khoảnh khắc để dành", panelNavigation: "Chuyển mục hồ sơ", previousPanel: "Mục trước", exploreNext: "Khám phá tiếp",
    sidebarGreetingLabel: "GỬI NGƯỜI GHÉ CHƠI", sidebarInterestMusic: "Khám phá sở thích", sidebarInterestPhotos: "Gửi mình lời chào", sidebarBottom: "MỘT GÓC NHỎ, RẤT RIÊNG.",
  },
  en: {
    language: "Language", themeLight: "Switch to light mode", themeDark: "Switch to dark mode",
    top: "Back to top", tagline: "a little about me", profile: "PERSONAL PROFILE", hello: "hello there.",
    introPlaceholder: "Write a few lines to introduce yourself here.", locationPlaceholder: "Not filled in",
    heroNote: "A little corner to help you get to know me.", tabList: "Profile sections", welcome: "GLAD YOU STOPPED BY",
    more: "A LITTLE MORE ABOUT ME", showEmpty: "Show empty fields", hideEmpty: "Hide empty fields",
    who: "Who am I?", sectionCount: " / 09", contactFootnote: "A small hello can be the start of a friendship.",
    defaultFootnote: "You don't have to be perfect, just be yourself.", emptyTitle: "A little space, saved for later.",
    emptyBody: "I haven't shared anything here yet.", emptyHelp: "Show empty fields to see what is waiting to be filled in.",
    gallery: "A few moments", galleryCaption: "My photo corner", healthPrivacy: "Only share what feels comfortable.",
    placeholder: "Not filled in", copy: "Copy", copied: "Copied", copyLabel: "Copy {name}", copiedLabel: "Copied {name}",
    noCopy: "Nothing to copy yet", copyError: "Couldn't copy that. Please try again.",
    viewGithub: "View on GitHub", viewLive: "Open project", footer: "A little corner of the internet.", thanks: "Thanks for stopping by.",
    sideToc: "Take a little look around", sideProgress: "Viewing", sideSkipNote: "No need to read in order. Visit whatever catches your eye.",
    sideGreeting: "make yourself at home", sideTitle: "Slow down a little, get to know each other.", sideBody: "A few little stories and familiar things. Feel free to explore.",
    sideQuickTitle: "Little joys", sideHobbies: "A little music", sideContact: "Send me a hello",
    heroRegistration: "A LITTLE CORNER OF THE INTERNET", heroInterestSkills: "Skills", heroInterestHobbies: "Interests", heroInterestContact: "Contact",
    overviewDetailLabel: "BEYOND THE LINES OF CODE", overviewDetailTitle: "There are little joys beyond coding.", overviewDetailBody: "Explore the things I care about in the Interests section.",
    overviewCurrentLabel: "CURRENT CHAPTER", overviewCurrentTitle: "Finding my way, one step at a time.", overviewCurrentBody: "", overviewCurrentLink: "See what I'm working toward",
    galleryMoment: "A moment for later", panelNavigation: "Profile section navigation", previousPanel: "Previous section", exploreNext: "Explore next",
    sidebarGreetingLabel: "A NOTE FOR VISITORS", sidebarInterestMusic: "Explore interests", sidebarInterestPhotos: "Send me a hello", sidebarBottom: "A LITTLE CORNER, ALL MY OWN.",
  },
} as const;

export type UiKey = keyof typeof ui.vi;

// Saved D1 content may predate the English fields in the editor. Reuse the
// bundled profile's translations for exact Vietnamese matches so EN works for
// existing entries without sending private profile text to a translation API.
const builtInTranslations = new Map<string, string>();
function collectTranslations(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(collectTranslations);
    return;
  }
  if (!value || typeof value !== "object") return;

  const record = value as Record<string, unknown>;
  if (typeof record.vi === "string" && record.vi && typeof record.en === "string" && record.en) {
    builtInTranslations.set(record.vi, record.en);
  }
  Object.values(record).forEach(collectTranslations);
}
collectTranslations(profile);

export function t(language: Language, key: UiKey): string {
  return ui[language][key];
}
export function content(value: LocalizedText | undefined, language: Language): string {
  if (language === "vi") return value?.vi || "";
  if (value?.en) return value.en;
  if (value?.vi) return builtInTranslations.get(value.vi) || value.vi;
  return "";
}
export function named(template: string, name: string): string {
  return template.replace("{name}", name);
}
