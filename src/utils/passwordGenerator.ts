import type { PasswordStrength } from "../types/credential";
import { evaluateStrength } from "./credential";

export interface GenerateOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?";
const AMBIGUOUS = /[l1IO0]/g;

export const DEFAULT_GENERATE_OPTIONS: GenerateOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: false,
};

function buildPool(options: GenerateOptions): string {
  let pool = "";
  if (options.uppercase) pool += UPPER;
  if (options.lowercase) pool += LOWER;
  if (options.digits) pool += DIGITS;
  if (options.symbols) pool += SYMBOLS;
  if (options.excludeAmbiguous) {
    pool = pool.replace(AMBIGUOUS, "");
  }
  return pool;
}

function secureIndex(max: number): number {
  if (max <= 0) return 0;
  const arr = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  let x = 0;
  do {
    crypto.getRandomValues(arr);
    x = arr[0];
  } while (x >= limit);
  return x % max;
}

/** 确保每种启用的字符集至少出现一次（长度足够时） */
export function generatePassword(options: GenerateOptions): string {
  const length = Math.min(64, Math.max(8, Math.floor(options.length)));
  const pools: string[] = [];
  if (options.uppercase) {
    pools.push(
      options.excludeAmbiguous ? UPPER.replace(AMBIGUOUS, "") : UPPER,
    );
  }
  if (options.lowercase) {
    pools.push(
      options.excludeAmbiguous ? LOWER.replace(AMBIGUOUS, "") : LOWER,
    );
  }
  if (options.digits) {
    pools.push(
      options.excludeAmbiguous ? DIGITS.replace(AMBIGUOUS, "") : DIGITS,
    );
  }
  if (options.symbols) pools.push(SYMBOLS);

  const pool = buildPool(options);
  if (!pool || pools.every((p) => !p)) {
    throw new Error("请至少选择一种字符类型");
  }

  const chars: string[] = [];
  for (const p of pools) {
    if (!p) continue;
    chars.push(p[secureIndex(p.length)]);
  }

  while (chars.length < length) {
    chars.push(pool[secureIndex(pool.length)]);
  }

  // Fisher–Yates
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.slice(0, length).join("");
}

export function estimateEntropyBits(
  password: string,
  options: GenerateOptions,
): number {
  const poolSize = buildPool(options).length || 1;
  if (!password) return 0;
  return Math.round(password.length * Math.log2(poolSize) * 10) / 10;
}

export type CharKind = "upper" | "lower" | "digit" | "symbol";

export function classifyChar(ch: string): CharKind {
  if (/[A-Z]/.test(ch)) return "upper";
  if (/[a-z]/.test(ch)) return "lower";
  if (/[0-9]/.test(ch)) return "digit";
  return "symbol";
}

export function strengthOfGenerated(password: string): PasswordStrength {
  return evaluateStrength(password);
}

export function strengthLabelZh(strength: PasswordStrength): string {
  const map = { strong: "强密码", medium: "中等", weak: "弱密码" } as const;
  return map[strength];
}
