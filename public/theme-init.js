try {
  const saved = localStorage.getItem("theme");
  const dark = saved === "light" || saved === "dark"
    ? saved === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]').content = dark ? "#0b1114" : "#f1f4f6";
} catch {
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]').content = dark ? "#0b1114" : "#f1f4f6";
}
