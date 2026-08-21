/** 业务分类：微信 / 支付宝 / 银行卡 / 游戏 / 邮箱 / 社交 / 自定义 */
export type CredentialCategory =
  | "wechat"
  | "alipay"
  | "bank"
  | "game"
  | "email"
  | "social"
  | "custom";

export type PasswordStrength = "strong" | "medium" | "weak";

export interface Credential {
  id: string;
  name: string;
  username: string;
  /** 解锁会话内明文；持久化为 AES-256-GCM 密文 */
  password: string;
  url?: string;
  category: CredentialCategory;
  iconColor: string;
  iconLetter: string;
  strength: PasswordStrength;
  totpSecret?: string;
  note?: string;
  tags?: string[];
  updatedAt: string;
  createdAt: string;
}

export interface CredentialFormInput {
  name: string;
  username: string;
  password: string;
  url?: string;
  category: CredentialCategory;
  totpSecret?: string;
  note?: string;
  tags?: string[];
}

export const CATEGORY_LABEL: Record<CredentialCategory, string> = {
  wechat: "微信",
  alipay: "支付宝",
  bank: "银行卡",
  game: "游戏",
  email: "邮箱",
  social: "社交",
  custom: "自定义",
};

export const CATEGORY_COLOR: Record<CredentialCategory, string> = {
  wechat: "#07C160",
  alipay: "#1677FF",
  bank: "#F59E0B",
  game: "#A855F7",
  email: "#5E6AD2",
  social: "#EC4899",
  custom: "#6B7280",
};

export const CATEGORY_TAG_CLASS: Record<CredentialCategory, string> = {
  wechat: "bg-[#E8F8EF] text-[#07C160]",
  alipay: "bg-[#E8F3FF] text-[#1677FF]",
  bank: "bg-[#FEF3C7] text-[#B45309]",
  game: "bg-[#F3E8FF] text-[#7E22CE]",
  email: "bg-[#EDEDFB] text-[#5E6AD2]",
  social: "bg-[#FCE7F3] text-[#DB2777]",
  custom: "bg-[var(--border-soft)] text-[var(--fg-secondary)]",
};

export const CATEGORY_OPTIONS: CredentialCategory[] = [
  "wechat",
  "alipay",
  "bank",
  "game",
  "email",
  "social",
  "custom",
];
