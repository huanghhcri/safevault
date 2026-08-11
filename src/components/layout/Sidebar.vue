<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRoute, RouterLink } from "vue-router";
import {
  Shield,
  KeyRound,
  HeartPulse,
  Settings,
  Moon,
  Sun,
} from "lucide-vue-next";
import {
  getResolvedAppearance,
  toggleAppearance,
} from "../../utils/appearance";

const route = useRoute();
const isDark = ref(false);

const navItems = [
  { to: "/", name: "vault", icon: Shield, title: "密码库" },
  { to: "/generator", name: "generator", icon: KeyRound, title: "密码生成器" },
  { to: "/health", name: "health", icon: HeartPulse, title: "密码健康" },
  { to: "/settings", name: "settings", icon: Settings, title: "设置" },
] as const;

function isActive(path: string) {
  if (path === "/") {
    return route.path === "/";
  }
  return route.path.startsWith(path);
}

const ThemeIcon = computed(() => (isDark.value ? Sun : Moon));

function onToggleTheme() {
  toggleAppearance();
  isDark.value = getResolvedAppearance() === "dark";
}

onMounted(() => {
  isDark.value = getResolvedAppearance() === "dark";
});
</script>

<template>
  <aside
    class="flex h-full w-[60px] flex-shrink-0 flex-col items-center border-r border-[var(--border)] bg-[var(--surface)] py-4"
  >
    <div
      class="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]"
      title="SafeVault"
    >
      <Shield class="h-[18px] w-[18px] text-white" :stroke-width="2.25" />
    </div>

    <nav class="flex flex-1 flex-col items-center gap-2">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :title="item.title"
        class="relative flex h-10 w-10 items-center justify-center rounded-lg text-[var(--fg-secondary)] transition-all duration-150 hover:bg-[var(--bg)] hover:text-[var(--fg)]"
        :class="isActive(item.to) ? 'bg-[var(--accent-light,#EEF2FF)] text-[var(--accent)]' : ''"
      >
        <span
          v-if="isActive(item.to)"
          class="absolute -left-[10px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[var(--accent)]"
        />
        <component :is="item.icon" class="h-5 w-5" :stroke-width="1.75" />
      </RouterLink>
    </nav>

    <button
      type="button"
      class="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--fg-secondary)] transition-all duration-150 hover:bg-[var(--bg)] hover:text-[var(--fg)]"
      :title="isDark ? '切换浅色模式' : '切换深色模式'"
      @click="onToggleTheme"
    >
      <component :is="ThemeIcon" class="h-5 w-5" :stroke-width="1.75" />
    </button>
  </aside>
</template>
