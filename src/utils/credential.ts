import zxcvbn from "zxcvbn";
import type {
  CredentialCategory,
  CredentialFormInput,
  PasswordStrength,
} from "../types/credential";
import { CATEGORY_COLOR } from "../types/credential";

export function evaluateStrength(password: string): PasswordStrength {
  if (!password) return "weak";
  const score = zxcvbn(password).score;
  if (score >= 3) return "strong";
  if (score >= 2) return "medium";
  return "weak";
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function deriveIconLetter(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const first = Array.from(trimmed)[0] ?? "?";
  return first.toUpperCase();
}

export function buildCredentialFields(input: CredentialFormInput) {
  return {
    name: input.name.trim(),
    username: input.username.trim(),
    password: input.password,
    url: input.url?.trim() || undefined,
    category: input.category,
    iconColor: CATEGORY_COLOR[input.category],
    iconLetter: deriveIconLetter(input.name),
    strength: evaluateStrength(input.password),
    totpSecret: input.totpSecret?.trim() || undefined,
    note: input.note?.trim() || undefined,
    tags: input.tags?.filter(Boolean) ?? [],
  };
}

let clipboardClearTimer: ReturnType<typeof setTimeout> | null = null;

/** 复制文本；敏感内容默认 30 秒后尝试清空剪贴板 */
export async function copyText(
  text: string,
  options?: { clearAfterMs?: number },
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    if (clipboardClearTimer) clearTimeout(clipboardClearTimer);
    const ms = options?.clearAfterMs;
    if (ms && ms > 0) {
      const snapshot = text;
      clipboardClearTimer = setTimeout(async () => {
        try {
          const current = await navigator.clipboard.readText();
          if (current === snapshot) {
            await navigator.clipboard.writeText("");
          }
        } catch {
          // 无读权限时仍尝试清空（密码管理器常见策略）
          try {
            await navigator.clipboard.writeText("");
          } catch {
            /* ignore */
          }
        }
      }, ms);
    }
    return true;
  } catch {
    return false;
  }
}

export function emptyFormInput(
  category: CredentialCategory = "custom",
): CredentialFormInput {
  return {
    name: "",
    username: "",
    password: "",
    url: "",
    category,
    totpSecret: "",
    note: "",
    tags: [],
  };
}
