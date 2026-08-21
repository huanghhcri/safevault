<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Check, Eye, EyeOff, KeyRound } from "lucide-vue-next";
import { useCredentialStore } from "../stores/credentials";
import {
  CATEGORY_LABEL,
  CATEGORY_OPTIONS,
  type CredentialCategory,
  type CredentialFormInput,
} from "../types/credential";
import { emptyFormInput, evaluateStrength } from "../utils/credential";
import { useGeneratorStore } from "../stores/generator";

const route = useRoute();
const router = useRouter();
const store = useCredentialStore();
const generator = useGeneratorStore();

const editId = computed(() => {
  const id = route.params.id;
  return typeof id === "string" ? id : null;
});

const isEdit = computed(() => Boolean(editId.value));

const form = reactive<CredentialFormInput>(emptyFormInput());
const showPassword = ref(false);
const error = ref("");

const strength = computed(() => evaluateStrength(form.password));
const strengthLabel = computed(() => {
  const map = { strong: "强", medium: "中", weak: "弱" } as const;
  return form.password ? map[strength.value] : "";
});

function loadForm() {
  error.value = "";
  showPassword.value = false;

  const draft = generator.takeFormDraft();
  const pending = generator.takePendingForForm();

  if (draft) {
    Object.assign(form, {
      ...emptyFormInput("custom"),
      ...draft,
      tags: [...(draft.tags ?? [])],
    });
    if (pending) {
      form.password = pending;
      showPassword.value = true;
    }
    return;
  }

  if (!editId.value) {
    Object.assign(form, emptyFormInput("custom"));
    if (pending) {
      form.password = pending;
      showPassword.value = true;
    }
    return;
  }
  const existing = store.getById(editId.value);
  if (!existing) {
    error.value = "未找到该凭证";
    return;
  }
  Object.assign(form, {
    name: existing.name,
    username: existing.username,
    password: existing.password,
    url: existing.url ?? "",
    category: existing.category,
    totpSecret: existing.totpSecret ?? "",
    note: existing.note ?? "",
    tags: [...(existing.tags ?? [])],
  });
  if (pending) {
    form.password = pending;
    showPassword.value = true;
  }
}

watch(
  () => route.fullPath,
  () => loadForm(),
  { immediate: true },
);

function validate(): boolean {
  if (!form.name.trim()) {
    error.value = "请填写名称";
    return false;
  }
  if (!form.username.trim()) {
    error.value = "请填写用户名 / 账号";
    return false;
  }
  if (!form.password) {
    error.value = "请填写密码";
    return false;
  }
  error.value = "";
  return true;
}

function onCancel() {
  router.push({ name: "vault" });
}

async function onSave() {
  if (!validate()) return;
  const payload: CredentialFormInput = {
    ...form,
    category: form.category as CredentialCategory,
  };
  try {
    if (isEdit.value && editId.value) {
      await store.update(editId.value, payload);
    } else {
      await store.create(payload);
    }
    await router.push({ name: "vault" });
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

function goGenerator() {
  generator.saveFormDraft({ ...form, tags: [...(form.tags ?? [])] });
  generator.returnToForm = true;
  if (editId.value) {
    generator.returnEditId = editId.value;
  } else {
    generator.returnEditId = null;
  }
  router.push({ name: "generator", query: { from: "form" } });
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col bg-[var(--bg)]">
    <header
      class="flex h-[52px] flex-shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-5"
    >
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-[13px] font-medium text-[var(--fg-secondary)] transition-all hover:bg-[var(--border-soft)] hover:text-[var(--fg)]"
        @click="onCancel"
      >
        <ArrowLeft class="h-4 w-4" />
        返回密码库
      </button>
      <h1 class="text-sm font-semibold text-[var(--fg)]">
        {{ isEdit ? "编辑凭证" : "添加凭证" }}
      </h1>
      <span class="flex-1" />
      <button
        type="button"
        class="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[var(--border)] px-3 text-[13px] font-medium text-[var(--fg-secondary)] hover:bg-[var(--border-soft)]"
        @click="onCancel"
      >
        取消
      </button>
      <button
        type="button"
        class="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[var(--accent)] px-3 text-[13px] font-medium text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
        @click="onSave"
      >
        <Check class="h-[15px] w-[15px]" />
        保存凭证
      </button>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto px-10 py-8">
      <div class="max-w-[600px]">
        <h2 class="text-xl font-semibold tracking-tight text-[var(--fg)]">
          {{ isEdit ? "编辑凭证" : "新建凭证" }}
        </h2>
        <p class="mb-7 mt-1 text-[13px] text-[var(--fg-secondary)]">
          填写以下信息以安全存储您的登录凭证。
        </p>

        <p v-if="error" class="mb-4 text-[13px] text-[var(--danger)]">{{ error }}</p>

        <div class="mb-5 flex gap-3">
          <div class="flex-1">
            <label class="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">
              名称
            </label>
            <input
              v-model="form.name"
              type="text"
              class="h-9 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] outline-none focus:border-[var(--accent)]"
              placeholder="例如：微信 / 支付宝"
            />
          </div>
          <div class="flex-1">
            <label class="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">
              分类
            </label>
            <select
              v-model="form.category"
              class="h-9 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] outline-none focus:border-[var(--accent)]"
            >
              <option
                v-for="key in CATEGORY_OPTIONS"
                :key="key"
                :value="key"
              >
                {{ CATEGORY_LABEL[key] }}
              </option>
            </select>
          </div>
        </div>

        <div class="mb-5">
          <label class="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">
            网址（可选）
          </label>
          <input
            v-model="form.url"
            type="url"
            class="h-9 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] outline-none focus:border-[var(--accent)]"
            placeholder="https://example.com"
          />
        </div>

        <div class="mb-5">
          <label class="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">
            用户名 / 账号
          </label>
          <input
            v-model="form.username"
            type="text"
            class="h-9 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] outline-none focus:border-[var(--accent)]"
            placeholder="手机号 / 邮箱 / 账号"
          />
        </div>

        <div class="mb-5">
          <label class="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">
            密码
          </label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="h-9 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] py-0 pl-3 pr-[72px] font-mono text-[13px] outline-none focus:border-[var(--accent)]"
              placeholder="输入密码"
            />
            <div class="absolute right-1 top-1/2 flex -translate-y-1/2 gap-0.5">
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--muted)] hover:bg-[var(--border-soft)] hover:text-[var(--fg-secondary)]"
                :title="showPassword ? '隐藏' : '显示'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="h-[15px] w-[15px]" />
                <Eye v-else class="h-[15px] w-[15px]" />
              </button>
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--muted)] hover:bg-[var(--border-soft)] hover:text-[var(--fg-secondary)]"
                title="密码生成器"
                @click="goGenerator"
              >
                <KeyRound class="h-[15px] w-[15px]" />
              </button>
            </div>
          </div>
          <div v-if="form.password" class="mt-2" :class="`strength-${strength}`">
            <div class="flex gap-0.5">
              <span
                v-for="i in 4"
                :key="i"
                class="strength-seg h-1 flex-1 rounded-sm bg-[var(--border)]"
              />
            </div>
            <div class="strength-text mt-1 text-[11px] font-medium">
              强度：{{ strengthLabel }}
            </div>
          </div>
        </div>

        <div class="my-6 h-px bg-[var(--border)]" />

        <div class="mb-5">
          <label class="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">
            两步验证密钥（可选）
          </label>
          <input
            v-model="form.totpSecret"
            type="text"
            class="h-9 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 font-mono text-[13px] outline-none focus:border-[var(--accent)]"
            placeholder="JBSWY3DPEHPK3PXP"
          />
        </div>

        <div class="mb-5">
          <label class="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">
            备注（可选）
          </label>
          <textarea
            v-model="form.note"
            class="min-h-[80px] w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-[var(--accent)]"
            placeholder="添加备注信息…"
          />
        </div>

        <div class="mt-8 flex justify-end gap-2 border-t border-[var(--border)] pt-5">
          <button
            type="button"
            class="inline-flex h-8 items-center rounded-[6px] border border-[var(--border)] px-3 text-[13px] font-medium text-[var(--fg-secondary)] hover:bg-[var(--border-soft)]"
            @click="onCancel"
          >
            取消
          </button>
          <button
            type="button"
            class="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[var(--accent)] px-3 text-[13px] font-medium text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
            @click="onSave"
          >
            <Check class="h-[15px] w-[15px]" />
            保存凭证
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.strength-strong .strength-seg {
  background: var(--success);
}
.strength-strong .strength-text {
  color: var(--success);
}
.strength-medium .strength-seg:nth-child(-n + 3) {
  background: var(--warning);
}
.strength-medium .strength-text {
  color: var(--warning);
}
.strength-weak .strength-seg:nth-child(1) {
  background: var(--danger);
}
.strength-weak .strength-text {
  color: var(--danger);
}
</style>
