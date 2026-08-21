<script setup lang="ts">
import { computed } from "vue";
import type { Credential, CredentialCategory } from "../../types/credential";
import {
  CATEGORY_LABEL,
  CATEGORY_OPTIONS,
  CATEGORY_TAG_CLASS,
} from "../../types/credential";

const props = defineProps<{
  credentials: Credential[];
  selectedId: string | null;
  filter: CredentialCategory | "all";
}>();

const emit = defineEmits<{
  select: [id: string];
  "update:filter": [filter: CredentialCategory | "all"];
}>();

const filters = computed(() => [
  { key: "all" as const, label: "全部" },
  ...CATEGORY_OPTIONS.map((key) => ({
    key,
    label: CATEGORY_LABEL[key],
  })),
]);

const filtered = computed(() => {
  if (props.filter === "all") return props.credentials;
  return props.credentials.filter((c) => c.category === props.filter);
});
</script>

<template>
  <aside
    class="flex w-[340px] min-w-[340px] flex-col border-r border-[var(--border)] bg-[var(--surface)]"
  >
    <div
      class="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-3"
    >
      <span class="text-xs font-medium tracking-wide text-[var(--fg-secondary)]">
        全部凭证
      </span>
      <span
        class="rounded-full bg-[var(--border-soft)] px-1.5 py-0.5 text-[11px] text-[var(--muted)]"
      >
        {{ filtered.length }} 项
      </span>
    </div>

    <div
      class="flex gap-1.5 overflow-x-auto border-b border-[var(--border-soft)] px-4 py-2"
    >
      <button
        v-for="item in filters"
        :key="item.key"
        type="button"
        class="h-[26px] flex-shrink-0 rounded-full border px-2.5 text-xs font-medium transition-all duration-150"
        :class="
          filter === item.key
            ? 'border-[var(--fg)] bg-[var(--fg)] text-[var(--surface)]'
            : 'border-[var(--border)] bg-transparent text-[var(--fg-secondary)] hover:bg-[var(--border-soft)]'
        "
        @click="emit('update:filter', item.key)"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <button
        v-for="item in filtered"
        :key="item.id"
        type="button"
        class="relative flex w-full items-center gap-3 border-b border-[var(--border-soft)] px-4 py-2.5 text-left transition-colors duration-100"
        :class="
          selectedId === item.id
            ? 'bg-[var(--accent-light)]'
            : 'hover:bg-[var(--bg)]'
        "
        @click="emit('select', item.id)"
      >
        <span
          v-if="selectedId === item.id"
          class="absolute bottom-0 left-0 top-0 w-0.5 bg-[var(--accent)]"
        />
        <span
          class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
          :style="{ background: item.iconColor }"
        >
          {{ item.iconLetter }}
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[13px] font-medium text-[var(--fg)]">
            {{ item.name }}
          </span>
          <span class="mt-0.5 block truncate text-xs text-[var(--muted)]">
            {{ item.username }}
          </span>
        </span>
        <span class="flex flex-shrink-0 flex-col items-end gap-1">
          <span
            class="rounded-full px-1.5 py-0.5 text-[10px] font-medium tracking-wide"
            :class="CATEGORY_TAG_CLASS[item.category]"
          >
            {{ CATEGORY_LABEL[item.category] }}
          </span>
        </span>
      </button>

      <div
        v-if="filtered.length === 0"
        class="px-4 py-10 text-center text-[13px] text-[var(--muted)]"
      >
        没有匹配的凭证
      </div>
    </div>
  </aside>
</template>
