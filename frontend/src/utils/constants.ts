export type Page = "home" | "history" | "documents";

export const navigationItems: {
  icon: string;
  label: string;
  page: Page;
}[] = [
  { icon: "home", label: "Trang chủ", page: "home" },
  { icon: "sandglass", label: "Lịch sử", page: "history" },
  { icon: "globe", label: "Tài liệu", page: "documents" },
];
