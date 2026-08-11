<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Plus, Search } from "lucide-vue-next";

const emit = defineEmits<{
  search: [];
  add: [];
}>();

const route = useRoute();

const title = computed(() => {
  const metaTitle = route.meta.title;
  if (typeof metaTitle === "string") return metaTitle;
  return "密码库";
});

const showAdd = computed(() => route.path === "/");
</script>

<template>
  <header
    class="flex h-[65px] flex-shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-6"
  >
    <h1 class="min-w-[96px] text-xl font-semibold tracking-tight text-[var(--fg)]">
      {{ title }}
    </h1>

    <button
      type="button"
      class="flex min-w-[240px] max-w-md flex-1 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-left transition-all duration-150 hover:border-[var(--accent)]"
      @click="emit('search')"
    >
      <Search class="h-4 w-4 flex-shrink-0 text-[var(--fg-secondary)]" />
      <span class="flex-1 text-[13px] text-[var(--fg-secondary)]">搜索密码...</span>
      <kbd
        class="rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--fg-secondary)]"
      >
        ⌘K
      </kbd>
    </button>

    <div class="flex min-w-[36px] items-center justify-end">
      <button
        v-if="showAdd"
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-white transition-all duration-150 hover:bg-[var(--accent-hover)]"
        title="添加密码"
        @click="emit('add')"
      >
        <Plus class="h-[18px] w-[18px]" :stroke-width="2.25" />
      </button>
    </div>
  </header>
</template>
