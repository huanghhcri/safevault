export type AppearanceTheme = "light" | "dark" | "system";

const STORAGE_KEY = "safevault-appearance";

let mediaQuery: MediaQueryList | null = null;

function getPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(theme: AppearanceTheme): "light" | "dark" {
  if (theme === "system") {
    return getPrefersDark() ? "dark" : "light";
  }
  return theme;
}

/** 在 html 上切换 dark class，支持 light / dark / system */
export function applyAppearance(theme: AppearanceTheme): void {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;

  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  localStorage.setItem(STORAGE_KEY, theme);
}

export function getStoredAppearance(): AppearanceTheme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

/** 读取当前已应用的明暗（不考虑 system 原始值） */
export function getResolvedAppearance(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** 在 light / dark 间切换（侧边栏按钮） */
export function toggleAppearance(): void {
  applyAppearance(getResolvedAppearance() === "dark" ? "light" : "dark");
}

/** 应用已存储主题，并在 system 模式下监听系统偏好变化 */
export function initAppearance(): void {
  applyAppearance(getStoredAppearance());

  if (!mediaQuery) {
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", () => {
      if (getStoredAppearance() === "system") {
        applyAppearance("system");
      }
    });
  }
}
