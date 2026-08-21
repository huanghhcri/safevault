<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Plus, Search, X } from "lucide-vue-next";

const props = defineProps<{
  searchQuery?: string;
}>();

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  add: [];
}>();

const route = useRoute();
const inputRef = ref<HTMLInputElement | null>(null);

const title = computed(() => {
  const metaTitle = route.meta.title;
  if (typeof metaTitle === "string") return metaTitle;
  return "密码库";
});

const showAdd = computed(() => route.path === "/");
const showSearch = computed(() => route.path === "/");
const hasQuery = computed(() => Boolean(props.searchQuery?.trim()));

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && props.searchQuery) {
    emit("update:searchQuery", "");
  }
}

watch(
  () => route.path,
  (path) => {
    if (path !== "/" && props.searchQuery) {
      emit("update:searchQuery", "");
    }
  },
);
</script>

<template>
  <header
    class="flex h-[52px] flex-shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-5"
  >
    <h1 class="whitespace-nowrap text-sm font-semibold tracking-tight text-[var(--fg)]">
      {{ title }}
    </h1>

    <div
      v-if="showSearch"
      class="relative h-8 max-w-[420px] flex-1"
    >
      <Search
        class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
        :stroke-width="1.75"
      />
      <input
        ref="inputRef"
        type="search"
        class="h-full w-full rounded-[6px] border border-[var(--border)] bg-[var(--bg)] py-0 pl-8 pr-8 text-[13px] text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
        placeholder="搜索名称、账号、网址、分类…"
        :value="props.searchQuery ?? ''"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        @keydown="onKeydown"
      />
      <button
        v-if="hasQuery"
        type="button"
        class="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-[var(--muted)] hover:bg-[var(--border-soft)] hover:text-[var(--fg-secondary)]"
        title="清除搜索"
        @click="emit('update:searchQuery', '')"
      >
        <X class="h-3.5 w-3.5" />
      </button>
    </div>

    <span class="flex-1" />

    <div v-if="showAdd" class="flex items-center gap-2">
      <button
        type="button"
        class="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[var(--accent)] px-3 text-[13px] font-medium text-[var(--on-accent)] transition-all hover:bg-[var(--accent-hover)]"
        @click="emit('add')"
      >
        <Plus class="h-[15px] w-[15px]" :stroke-width="2.25" />
        添加凭证
      </button>
    </div>
  </header>
</template>
