import type { IconName } from "../Icons";

export type LocalizedText = { vi: string; en?: string };
export type TabId =
  | "tong-quan"
  | "ky-nang"
  | "du-an"
  | "so-thich"
  | "tinh-cach"
  | "loi-song"
  | "phong-cach"
  | "suc-khoe"
  | "lien-he";
export type ProfileCell = { label: LocalizedText; value?: LocalizedText; hint?: LocalizedText };
export type Project = {
  name: LocalizedText;
  description: LocalizedText;
  tags: LocalizedText[];
  category: LocalizedText;
  style: "sage" | "music" | "clinic";
  icon: IconName;
  repoUrl: string; // TODO: Add the real repository URL when it is known.
};

export const tabs: { id: TabId; label: LocalizedText; icon: IconName }[] = [
  { id: "tong-quan", label: { vi: "Tổng quan", en: "Overview" }, icon: "overview" },
  { id: "ky-nang", label: { vi: "Kỹ năng", en: "Skills" }, icon: "code" },
  { id: "du-an", label: { vi: "Dự án", en: "Projects" }, icon: "projects" },
  { id: "so-thich", label: { vi: "Sở thích", en: "Interests" }, icon: "music" },
  { id: "tinh-cach", label: { vi: "Tính cách", en: "Personality" }, icon: "person" },
  { id: "loi-song", label: { vi: "Lối sống", en: "Lifestyle" }, icon: "leaf" },
  { id: "phong-cach", label: { vi: "Phong cách", en: "Style" }, icon: "style" },
  { id: "suc-khoe", label: { vi: "Sức khỏe", en: "Health" }, icon: "heart" },
  { id: "lien-he", label: { vi: "Liên hệ", en: "Contact" }, icon: "chat" },
];

export const profile = {
  nickname: { vi: "HishikoNíhi" },
  fullName: { vi: "Trang Hùng Gia Bảo" },
  location: { vi: "Khu vực Đà Nẵng, Việt Nam" },
  photo: "",
  intro: { vi: "" },
  tabDescriptions: {
    "tong-quan": { vi: "Một vài điều cơ bản, để chúng mình bắt đầu làm quen.", en: "A few basics to help us get to know each other." },
    "ky-nang": { vi: "Những thứ mình biết làm, và vẫn đang học thêm mỗi ngày.", en: "Things I can do and am still learning every day." },
    "du-an": { vi: "Một vài ý tưởng mình đã thử biến thành hiện thực.", en: "A few ideas I have tried to bring to life." },
    "so-thich": { vi: "Những điều nhỏ khiến một ngày của mình thú vị hơn.", en: "Little things that make my days more interesting." },
    "tinh-cach": { vi: "Hiểu mình thêm một chút, ngoài những lời giới thiệu.", en: "A little more about me beyond an introduction." },
    "loi-song": { vi: "Nhịp sống thường ngày và những điều mình đang hướng tới.", en: "My everyday rhythm and the things I am working toward." },
    "phong-cach": { vi: "Gu của mình, từ cách ăn mặc đến cách chuyện trò.", en: "My tastes, from how I dress to how I communicate." },
    "suc-khoe": { vi: "Một góc chia sẻ nhỏ, trong giới hạn mình thấy thoải mái.", en: "A small space for what I feel comfortable sharing." },
    "lien-he": { vi: "Nếu có điều muốn kể, cứ nhắn cho mình nhé.", en: "If you have something to share, feel free to message me." },
  } satisfies Record<TabId, LocalizedText>,
  overview: [
    { label: { vi: "Biệt danh" }, value: { vi: "HishikoNíhi" } },
    { label: { vi: "Họ và tên" }, value: { vi: "Trang Hùng Gia Bảo" } },
    { label: { vi: "Tuổi" } },
    { label: { vi: "Nơi ở" }, value: { vi: "Khu vực Đà Nẵng, Việt Nam" } },
    { label: { vi: "Học vấn" }, value: { vi: "Tốt nghiệp cao đẳng ngành phát triển phần mềm" } },
    { label: { vi: "Ngôn ngữ" }, value: { vi: "Tiếng Việt và tiếng Anh, đang ôn IELTS." } },
  ] satisfies ProfileCell[],
  skills: [
    { label: { vi: "Frontend" }, items: [{ vi: "Vue.js" }, { vi: "React" }] },
    { label: { vi: "Backend" }, items: [{ vi: "C#" }, { vi: "Node.js" }] },
    { label: { vi: "Dữ liệu và triển khai" }, items: [{ vi: "SQL" }, { vi: "Docker" }] },
    { label: { vi: "Công cụ code" }, items: [{ vi: "Visual Studio" }, { vi: "VS Code" }] },
    { label: { vi: "Sáng tạo" }, items: [{ vi: "Sản xuất nhạc (FL Studio)" }, { vi: "Thiết kế đồ họa" }, { vi: "Dựng video" }] },
  ],
  projects: [
    { name: { vi: "Great Sage" }, description: { vi: "Trợ lý AI bằng giọng nói trên máy tính." }, style: "sage", icon: "spark", category: { vi: "MỘT NGƯỜI BẠN ẢO", en: "A VIRTUAL COMPANION" }, tags: [{ vi: "AI" }, { vi: "Giọng nói", en: "Voice" }], repoUrl: "" },
    { name: { vi: "Music-app" }, description: { vi: "Trình phát nhạc chạy nền, điều khiển qua khay hệ thống." }, style: "music", icon: "music", category: { vi: "CHO NHỮNG LÚC NGHE NHẠC", en: "FOR LISTENING TO MUSIC" }, tags: [{ vi: "Âm nhạc", en: "Music" }, { vi: "Máy tính", en: "Desktop" }], repoUrl: "" },
    { name: { vi: "clinic-management-system" }, description: { vi: "Hệ thống quản lý phòng khám, C# và Vue.js." }, style: "clinic", icon: "heart", category: { vi: "MỘT BÀI TOÁN THỰC TẾ", en: "A PRACTICAL CHALLENGE" }, tags: [{ vi: "C#" }, { vi: "Vue.js" }], repoUrl: "" },
  ] satisfies Project[],
  hobbies: [
    { label: { vi: "Âm nhạc" }, hint: { vi: "Thể loại nghe và làm" } },
    { label: { vi: "Game" }, hint: { vi: "Đang chơi" } },
    { label: { vi: "Nhiếp ảnh" }, hint: { vi: "Máy ảnh, kiểu ảnh" } },
  ] satisfies ProfileCell[],
  personality: ["Điểm mạnh", "Điểm yếu", "Ba từ mô tả mình", "Thích", "Không thích"].map((vi) => ({ label: { vi } })) satisfies ProfileCell[],
  lifestyle: [
    { label: { vi: "Một ngày của mình" } },
    { label: { vi: "Thói quen" } },
    { label: { vi: "Đang theo đuổi" }, value: { vi: "Có việc làm đầu tiên ở vị trí junior frontend, nhận thêm dự án freelance và hoàn thiện trang portfolio." } },
  ] satisfies ProfileCell[],
  style: ["Ăn mặc", "Thẩm mỹ", "Cách giao tiếp", "Điều nên biết khi chơi với mình"].map((vi) => ({ label: { vi } })) satisfies ProfileCell[],
  health: ["Điều nên biết", "Ghi chú"].map((vi) => ({ label: { vi } })) satisfies ProfileCell[],
  contacts: [
    { id: "facebook", label: { vi: "Facebook", en: "Facebook" }, icon: "person", mark: "f", value: "" },
    { id: "zalo", label: { vi: "Zalo", en: "Zalo" }, icon: "chat", mark: "Z", value: "" },
    { id: "discord", label: { vi: "Discord", en: "Discord" }, icon: "chat", value: "" },
    { id: "github", label: { vi: "GitHub", en: "GitHub" }, icon: "github", value: "" },
    { id: "email", label: { vi: "Email", en: "Email" }, icon: "mail", value: "" },
  ] satisfies { id: string; label: LocalizedText; icon: IconName; mark?: string; value: string }[],
} as const;
