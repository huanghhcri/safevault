<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Copy, Eye, EyeOff, ExternalLink, Pencil, Trash2 } from "lucide-vue-next";
import type { Credential } from "../../types/credential";
import { CATEGORY_LABEL, CATEGORY_TAG_CLASS } from "../../types/credential";

const props = defineProps<{
  credential: Credential | null;
}>();

const emit = defineEmits<{
  edit: [];
  delete: [];
  copy: [field: "username" | "password" | "totp"];
}>();

const showPassword = ref(false);
const showTotp = ref(false);
let hidePasswordTimer: ReturnType<typeof setTimeout> | null = null;
let hideTotpTimer: ReturnType<typeof setTimeout> | null = null;

const AUTO_HIDE_MS = 15_000;

function clearHideTimers() {
  if (hidePasswordTimer) {
    clearTimeout(hidePasswordTimer);
    hidePasswordTimer = null;
  }
  if (hideTotpTimer) {
    clearTimeout(hideTotpTimer);
    hideTotpTimer = null;
  }
}

function revealPassword() {
  showPassword.value = true;
  if (hidePasswordTimer) clearTimeout(hidePasswordTimer);
  hidePasswordTimer = setTimeout(() => {
    showPassword.value = false;
  }, AUTO_HIDE_MS);
}

function togglePassword() {
  if (showPassword.value) {
    showPassword.value = false;
    if (hidePasswordTimer) clearTimeout(hidePasswordTimer);
    return;
  }
  revealPassword();
}

function toggleTotp() {
  if (showTotp.value) {
    showTotp.value = false;
    if (hideTotpTimer) clearTimeout(hideTotpTimer);
    return;
  }
  showTotp.value = true;
  if (hideTotpTimer) clearTimeout(hideTotpTimer);
  hideTotpTimer = setTimeout(() => {
    showTotp.value = false;
  }, AUTO_HIDE_MS);
}

watch(
  () => props.credential?.id,
  () => {
    showPassword.value = false;
    showTotp.value = false;
    clearHideTimers();
  },
);

onBeforeUnmount(() => {
  clearHideTimers();
});

const strengthClass = computed(() => {
  if (!props.credential) return "";
  const map = {
    strong: "strength-strong",
    medium: "strength-medium",
    weak: "strength-weak",
  };
  return map[props.credential.strength];
});

const strengthLabel = computed(() => {
  if (!props.credential) return "";
  const map = { strong: "强", medium: "中", weak: "弱" };
  return map[props.credential.strength];
});

function onCopy(field: "username" | "password" | "totp") {
  emit("copy", field);
}

function openUrl() {
  if (props.credential?.url) {
    window.open(props.credential.url, "_blank", "noreferrer");
  }
}

const extraTags = computed(() => {
  if (!props.credential?.tags) return [];
  const categoryLabel = CATEGORY_LABEL[props.credential.category];
  return props.credential.tags.filter((t) => t !== categoryLabel);
});
</script>

<template>
  <section
    v-if="credential"
    class="flex min-w-0 flex-1 flex-col overflow-y-auto bg-[var(--bg)] px-10 py-8"
  >
    <header class="mb-7 flex items-start gap-4">
      <div
        class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl font-semibold text-white"
        :style="{ background: credential.iconColor }"
      >
        {{ credential.iconLetter }}
      </div>
      <div class="min-w-0 flex-1">
        <h2 class="text-xl font-semibold tracking-tight text-[var(--fg)]">
          {{ credential.name }}
        </h2>
        <p class="mt-1 text-[13px] text-[var(--fg-secondary)]">
          上次修改：{{ credential.updatedAt }} · 创建于 {{ credential.createdAt }}
        </p>
      </div>
      <div class="flex flex-shrink-0 gap-2">
        <button
          type="button"
          class="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[var(--border)] px-3 text-[13px] font-medium text-[var(--fg-secondary)] transition-all hover:bg-[var(--border-soft)]"
          @click="emit('edit')"
        >
          <Pencil class="h-[15px] w-[15px]" />
          编辑
        </button>
        <button
          type="button"
          class="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[var(--border)] px-3 text-[13px] font-medium text-[var(--danger)] transition-all hover:bg-[var(--danger-light)]"
          @click="emit('delete')"
        >
          <Trash2 class="h-[15px] w-[15px]" />
          删除
        </button>
      </div>
    </header>

    <div class="mb-6">
      <div
        class="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]"
      >
        登录信息
      </div>

      <div
        class="mb-1.5 flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5"
      >
        <span class="w-[100px] flex-shrink-0 text-xs font-medium text-[var(--fg-secondary)]">
          用户名
        </span>
        <span class="min-w-0 flex-1 truncate text-[13px] text-[var(--fg)]">
          {{ credential.username }}
        </span>
        <button
          type="button"
          class="ml-2 flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--muted)] transition-all hover:bg-[var(--border-soft)] hover:text-[var(--fg-secondary)]"
          title="复制"
          @click="onCopy('username')"
        >
          <Copy class="h-[15px] w-[15px]" />
        </button>
      </div>

      <div
        class="mb-1.5 flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5"
        :class="strengthClass"
      >
        <span class="w-[100px] flex-shrink-0 text-xs font-medium text-[var(--fg-secondary)]">
          密码
        </span>
        <span
          class="min-w-0 flex-1 truncate font-mono text-[13px] text-[var(--fg)]"
          :class="showPassword ? '' : 'tracking-[0.15em]'"
        >
          {{ showPassword ? credential.password : "••••••••••••" }}
        </span>
        <span class="ml-2 flex items-center gap-0.5">
          <span
            v-for="i in 4"
            :key="i"
            class="strength-seg h-1 w-5 rounded-sm bg-[var(--border)]"
          />
          <span class="strength-text ml-1.5 text-[11px] font-medium">
            {{ strengthLabel }}
          </span>
        </span>
        <button
          type="button"
          class="ml-2 flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--muted)] transition-all hover:bg-[var(--border-soft)] hover:text-[var(--fg-secondary)]"
          :title="showPassword ? '隐藏密码' : '显示密码（15 秒后自动隐藏）'"
          @click="togglePassword"
        >
          <EyeOff v-if="showPassword" class="h-[15px] w-[15px]" />
          <Eye v-else class="h-[15px] w-[15px]" />
        </button>
        <button
          type="button"
          class="ml-1 flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--muted)] transition-all hover:bg-[var(--border-soft)] hover:text-[var(--fg-secondary)]"
          title="复制"
          @click="onCopy('password')"
        >
          <Copy class="h-[15px] w-[15px]" />
        </button>
      </div>

      <div
        v-if="credential.url"
        class="mb-1.5 flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5"
      >
        <span class="w-[100px] flex-shrink-0 text-xs font-medium text-[var(--fg-secondary)]">
          网址
        </span>
        <a
          :href="credential.url"
          target="_blank"
          rel="noreferrer"
          class="min-w-0 flex-1 truncate text-[13px] text-[var(--accent)]"
        >
          {{ credential.url }}
        </a>
        <button
          type="button"
          class="ml-2 flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--muted)] transition-all hover:bg-[var(--border-soft)] hover:text-[var(--fg-secondary)]"
          title="打开"
          @click="openUrl"
        >
          <ExternalLink class="h-[15px] w-[15px]" />
        </button>
      </div>
    </div>

    <div v-if="credential.totpSecret" class="mb-6">
      <div
        class="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]"
      >
        安全信息
      </div>
      <div
        class="mb-1.5 flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5"
      >
        <span class="w-[100px] flex-shrink-0 text-xs font-medium text-[var(--fg-secondary)]">
          两步验证
        </span>
        <span class="min-w-0 flex-1 truncate font-mono text-[13px] text-[var(--fg)]">
          {{ showTotp ? credential.totpSecret : "••••••••••••" }}
        </span>
        <button
          type="button"
          class="ml-2 flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--muted)] transition-all hover:bg-[var(--border-soft)] hover:text-[var(--fg-secondary)]"
          :title="showTotp ? '隐藏' : '显示（15 秒后自动隐藏）'"
          @click="toggleTotp"
        >
          <EyeOff v-if="showTotp" class="h-[15px] w-[15px]" />
          <Eye v-else class="h-[15px] w-[15px]" />
        </button>
        <button
          type="button"
          class="ml-1 flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--muted)] transition-all hover:bg-[var(--border-soft)] hover:text-[var(--fg-secondary)]"
          title="复制"
          @click="onCopy('totp')"
        >
          <Copy class="h-[15px] w-[15px]" />
        </button>
      </div>
    </div>

    <div v-if="credential.note" class="mb-6">
      <div
        class="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]"
      >
        备注
      </div>
      <div
        class="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--fg-secondary)]"
      >
        {{ credential.note }}
      </div>
    </div>

    <div>
      <div
        class="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]"
      >
        标签
      </div>
      <div class="flex flex-wrap gap-1.5">
        <span
          class="rounded-full px-1.5 py-0.5 text-[10px] font-medium tracking-wide"
          :class="CATEGORY_TAG_CLASS[credential.category]"
        >
          {{ CATEGORY_LABEL[credential.category] }}
        </span>
        <span
          v-for="tag in extraTags"
          :key="tag"
          class="rounded-full bg-[var(--border-soft)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--fg-secondary)]"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </section>

  <section
    v-else
    class="flex min-w-0 flex-1 flex-col items-center justify-center bg-[var(--bg)] px-10 text-center"
  >
    <p class="text-[13px] text-[var(--muted)]">从左侧选择一条凭证查看详情</p>
  </section>
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
.strength-weak .strength-seg:nth-child(-n + 2) {
  background: var(--danger);
}
.strength-weak .strength-text {
  color: var(--danger);
}
</style>
