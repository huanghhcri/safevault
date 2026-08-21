import type {
  Credential,
  CredentialFormInput,
} from "../types/credential";
import { buildCredentialFields } from "../utils/credential";

export interface VaultStatus {
  initialized: boolean;
  unlocked: boolean;
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function invokeTauri<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  try {
    return await invoke<T>(cmd, args);
  } catch (e) {
    if (typeof e === "string") throw new Error(e);
    if (e && typeof e === "object" && "message" in e) {
      throw new Error(String((e as { message: unknown }).message));
    }
    throw e instanceof Error ? e : new Error(String(e));
  }
}

/** 浏览器开发态：Web Crypto AES-GCM + PBKDF2，密文存 localStorage */
const WEB_STORAGE_KEY = "safevault.encrypted.v2";
const KDF_ITERATIONS = 210_000;

interface WebVaultFile {
  salt: string;
  verifier: string;
  iterations: number;
  credentials: Array<{ id: string; blob: string }>;
}

let webKey: CryptoKey | null = null;

function b64encode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  bytes.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function loadWebFile(): WebVaultFile | null {
  const raw = localStorage.getItem(WEB_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WebVaultFile;
  } catch {
    return null;
  }
}

function saveWebFile(file: WebVaultFile) {
  localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(file));
}

async function deriveWebKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptBytes(key: CryptoKey, data: Uint8Array): Promise<string> {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, data);
  const packed = new Uint8Array(nonce.length + ct.byteLength);
  packed.set(nonce, 0);
  packed.set(new Uint8Array(ct), nonce.length);
  return b64encode(packed);
}

async function decryptBytes(key: CryptoKey, packedB64: string): Promise<Uint8Array> {
  const packed = b64decode(packedB64);
  if (packed.length <= 12) throw new Error("密文格式无效");
  const nonce = packed.slice(0, 12);
  const ct = packed.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, ct);
  return new Uint8Array(plain);
}

const VERIFY_MSG = new TextEncoder().encode("safevault-master-v1");

async function webStatus(): Promise<VaultStatus> {
  return {
    initialized: loadWebFile() !== null,
    unlocked: webKey !== null,
  };
}

async function webSetup(password: string): Promise<void> {
  if (password.trim().length < 8) throw new Error("主密码至少 8 位");
  if (loadWebFile()) throw new Error("密码库已初始化");
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const key = await deriveWebKey(password, salt, KDF_ITERATIONS);
  const verifier = await encryptBytes(key, VERIFY_MSG);
  saveWebFile({
    salt: b64encode(salt),
    verifier,
    iterations: KDF_ITERATIONS,
    credentials: [],
  });
  webKey = key;
}

async function webUnlock(password: string): Promise<void> {
  const file = loadWebFile();
  if (!file) throw new Error("密码库尚未初始化");
  const key = await deriveWebKey(password, b64decode(file.salt), file.iterations);
  try {
    const plain = await decryptBytes(key, file.verifier);
    if (new TextDecoder().decode(plain) !== "safevault-master-v1") {
      throw new Error("主密码不正确");
    }
  } catch {
    throw new Error("主密码不正确");
  }
  webKey = key;
}

async function webLock(): Promise<void> {
  webKey = null;
}

async function webList(): Promise<Credential[]> {
  if (!webKey) throw new Error("密码库未解锁");
  const file = loadWebFile();
  if (!file) return [];
  const out: Credential[] = [];
  for (const row of file.credentials) {
    const plain = await decryptBytes(webKey, row.blob);
    out.push(JSON.parse(new TextDecoder().decode(plain)) as Credential);
  }
  out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return out;
}

async function webSaveCredential(cred: Credential): Promise<Credential> {
  if (!webKey) throw new Error("密码库未解锁");
  const file = loadWebFile();
  if (!file) throw new Error("密码库尚未初始化");
  const blob = await encryptBytes(
    webKey,
    new TextEncoder().encode(JSON.stringify(cred)),
  );
  const idx = file.credentials.findIndex((c) => c.id === cred.id);
  if (idx >= 0) file.credentials[idx] = { id: cred.id, blob };
  else file.credentials.unshift({ id: cred.id, blob });
  saveWebFile(file);
  return cred;
}

async function webDelete(id: string): Promise<void> {
  if (!webKey) throw new Error("密码库未解锁");
  const file = loadWebFile();
  if (!file) throw new Error("密码库尚未初始化");
  const next = file.credentials.filter((c) => c.id !== id);
  if (next.length === file.credentials.length) throw new Error("凭证不存在");
  file.credentials = next;
  saveWebFile(file);
}

function toInputPayload(input: CredentialFormInput) {
  const fields = buildCredentialFields(input);
  return {
    name: fields.name,
    username: fields.username,
    password: fields.password,
    url: fields.url ?? null,
    category: fields.category,
    iconColor: fields.iconColor,
    iconLetter: fields.iconLetter,
    strength: fields.strength,
    totpSecret: fields.totpSecret ?? null,
    note: fields.note ?? null,
    tags: fields.tags ?? null,
  };
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cred-${Date.now()}`;
}

export const vaultApi = {
  async status(): Promise<VaultStatus> {
    if (isTauri()) return invokeTauri("vault_status");
    return webStatus();
  },

  async setup(password: string): Promise<void> {
    if (isTauri()) return invokeTauri("vault_setup", { password });
    await webSetup(password);
    localStorage.removeItem("safevault.credentials.v1");
  },

  async unlock(password: string): Promise<void> {
    if (isTauri()) return invokeTauri("vault_unlock", { password });
    return webUnlock(password);
  },

  async lock(): Promise<void> {
    if (isTauri()) return invokeTauri("vault_lock");
    return webLock();
  },

  async list(): Promise<Credential[]> {
    if (isTauri()) return invokeTauri("list_credentials");
    return webList();
  },

  async create(input: CredentialFormInput): Promise<Credential> {
    const payload = toInputPayload(input);
    if (isTauri()) return invokeTauri("create_credential", { input: payload });
    const now = todayIsoDate();
    const cred: Credential = {
      id: createId(),
      ...buildCredentialFields(input),
      createdAt: now,
      updatedAt: now,
    };
    return webSaveCredential(cred);
  },

  async update(id: string, input: CredentialFormInput): Promise<Credential> {
    const payload = toInputPayload(input);
    if (isTauri()) return invokeTauri("update_credential", { id, input: payload });
    const list = await webList();
    const existing = list.find((c) => c.id === id);
    if (!existing) throw new Error("凭证不存在");
    const cred: Credential = {
      ...existing,
      ...buildCredentialFields(input),
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: todayIsoDate(),
    };
    return webSaveCredential(cred);
  },

  async remove(id: string): Promise<void> {
    if (isTauri()) return invokeTauri("delete_credential", { id });
    return webDelete(id);
  },
};
