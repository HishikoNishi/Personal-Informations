import type { LocalizedText } from "./data/profile";

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
  },
} as const;

export type UiKey = keyof typeof ui.vi;
export function t(language: Language, key: UiKey): string {
  return ui[language][key];
}
export function content(value: LocalizedText | undefined, language: Language): string {
  return value?.[language] || value?.vi || "";
}
export function named(template: string, name: string): string {
  return template.replace("{name}", name);
}
