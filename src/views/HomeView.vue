<script setup lang="ts">
import { computed, ref, watch, inject, type Ref } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useCredentialStore } from "../stores/credentials";
import type { CredentialCategory } from "../types/credential";
import { copyText } from "../utils/credential";
import { searchCredentials } from "../utils/searchCredentials";
import CredentialListPanel from "../components/vault/CredentialListPanel.vue";
import CredentialDetailPanel from "../components/vault/CredentialDetailPanel.vue";
import VaultEmptyState from "../components/vault/VaultEmptyState.vue";

const router = useRouter();
const store = useCredentialStore();
const { credentials, selectedId, selected, filter } = storeToRefs(store);

const toast = ref<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const searchQuery = inject<Ref<string>>("vaultSearchQuery", ref(""));

function showToast(message: string) {
  toast.value = message;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = null;
  }, 2000);
}

function onAdd() {
  router.push({ name: "credential-create" });
}

const filteredBySearch = computed(() =>
  searchCredentials(credentials.value, searchQuery.value),
);

const hasSearchNoResult = computed(
  () =>
    searchQuery.value.trim().length > 0 &&
    filteredBySearch.value.length === 0 &&
    credentials.value.length > 0,
);

const isEmpty = computed(() => credentials.value.length === 0);

watch([filter, filteredBySearch], () => {
  const list =
    filter.value === "all"
      ? filteredBySearch.value
      : filteredBySearch.value.filter((c) => c.category === filter.value);
  if (!list.some((c) => c.id === selectedId.value)) {
    store.select(list[0]?.id ?? null);
  }
});

function onSelect(id: string) {
  store.select(id);
}

function onFilter(next: CredentialCategory | "all") {
  store.setFilter(next);
}

async function onCopy(field: "username" | "password" | "totp") {
  if (!selected.value) return;
  const map = {
    username: selected.value.username,
    password: selected.value.password,
    totp: selected.value.totpSecret ?? "",
  } as const;
  const labelMap = {
    username: "用户名",
    password: "密码",
    totp: "两步验证密钥",
  } as const;
  const clearAfterMs = field === "password" || field === "totp" ? 30_000 : undefined;
  const ok = await copyText(map[field], { clearAfterMs });
  showToast(
    ok
      ? clearAfterMs
        ? `已复制${labelMap[field]}（30 秒后清除）`
        : `已复制${labelMap[field]}`
      : "复制失败",
  );
}

function onEdit() {
  if (!selected.value) return;
  router.push({
    name: "credential-edit",
    params: { id: selected.value.id },
  });
}

async function onDelete() {
  if (!selected.value) return;
  const name = selected.value.name;
  const ok = window.confirm(`确定删除「${name}」吗？此操作不可恢复。`);
  if (!ok) return;
  try {
    await store.remove(selected.value.id);
    showToast(`已删除「${name}」`);
  } catch (e) {
    showToast(e instanceof Error ? e.message : "删除失败");
  }
}
</script>

<template>
  <div class="flex h-full min-h-0">
    <template v-if="!isEmpty">
      <CredentialListPanel
        :credentials="filteredBySearch"
        :selected-id="selectedId"
        :filter="filter"
        @select="onSelect"
        @update:filter="onFilter"
      />
      <CredentialDetailPanel
        v-if="!hasSearchNoResult"
        :credential="selected"
        @copy="onCopy"
        @edit="onEdit"
        @delete="onDelete"
      />
      <section
        v-else
        class="flex min-w-0 flex-1 flex-col items-center justify-center bg-[var(--bg)] px-10 text-center"
      >
        <p class="text-[13px] text-[var(--muted)]">
          没有匹配「{{ searchQuery }}」的凭证
        </p>
        <button
          type="button"
          class="mt-3 text-[13px] font-medium text-[var(--accent)] hover:underline"
          @click="searchQuery = ''"
        >
          清除搜索
        </button>
      </section>
    </template>
    <VaultEmptyState v-else @add="onAdd" />

    <div
      v-if="toast"
      class="fixed bottom-6 right-6 z-[100] flex items-center rounded-lg bg-[var(--fg)] px-4 py-2.5 text-[13px] font-medium text-[var(--surface)] shadow-[var(--shadow-float)]"
    >
      {{ toast }}
    </div>
  </div>
</template>
