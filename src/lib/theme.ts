import { useEffect, useState } from "react";

const KEY = "scn-theme";
export function applyStoredTheme() {
  const t = localStorage.getItem(KEY);
  document.documentElement.classList.toggle("dark", t === "dark");
}
export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);
  const set = (t: "light" | "dark") => {
    localStorage.setItem(KEY, t);
    document.documentElement.classList.toggle("dark", t === "dark");
    setTheme(t);
  };
  return { theme, setTheme: set, toggle: () => set(theme === "dark" ? "light" : "dark") };
}
