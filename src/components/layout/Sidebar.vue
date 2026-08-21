<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import {
  Shield,
  KeyRound,
  HeartPulse,
  Settings,
  Moon,
  Sun,
  Lock,
} from "lucide-vue-next";
import {
  getResolvedAppearance,
  toggleAppearance,
} from "../../utils/appearance";
import { useVaultStore } from "../../stores/vault";

const route = useRoute();
const router = useRouter();
const vault = useVaultStore();
const isDark = ref(false);

const primaryNav = [
  { to: "/", name: "vault", icon: Shield, title: "密码库" },
  { to: "/generator", name: "generator", icon: KeyRound, title: "密码生成器" },
  { to: "/health", name: "health", icon: HeartPulse, title: "密码健康" },
] as const;

const bottomNav = [
  { to: "/settings", name: "settings", icon: Settings, title: "设置" },
] as const;

function isActive(path: string) {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
}

const ThemeIcon = computed(() => (isDark.value ? Sun : Moon));

function onToggleTheme() {
  toggleAppearance();
  isDark.value = getResolvedAppearance() === "dark";
}

async function onLock() {
  await vault.lock();
  await router.push({ name: "unlock" });
}

onMounted(() => {
  isDark.value = getResolvedAppearance() === "dark";
});
</script>

<template>
  <aside
    class="flex h-full w-[60px] min-w-[60px] flex-shrink-0 flex-col items-center gap-1 border-r border-[var(--border)] bg-[var(--surface)] py-3"
  >
    <div
      class="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]"
      title="SafeVault"
    >
      <Shield class="h-[18px] w-[18px] text-white" :stroke-width="2.25" />
    </div>

    <nav class="flex flex-1 flex-col items-center gap-0.5">
      <RouterLink
        v-for="item in primaryNav"
        :key="item.to"
        :to="item.to"
        :title="item.title"
        class="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted)] transition-all duration-150 hover:bg-[var(--border-soft)] hover:text-[var(--fg-secondary)]"
        :class="
          isActive(item.to)
            ? 'bg-[var(--accent-light)] text-[var(--accent)]'
            : ''
        "
      >
        <component :is="item.icon" class="h-5 w-5" :stroke-width="1.75" />
      </RouterLink>
    </nav>

    <div class="mt-auto flex flex-col items-center gap-0.5">
      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted)] transition-all duration-150 hover:bg-[var(--border-soft)] hover:text-[var(--fg-secondary)]"
        title="锁定密码库"
        @click="onLock"
      >
        <Lock class="h-5 w-5" :stroke-width="1.75" />
      </button>

      <RouterLink
        v-for="item in bottomNav"
        :key="item.to"
        :to="item.to"
        :title="item.title"
        class="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted)] transition-all duration-150 hover:bg-[var(--border-soft)] hover:text-[var(--fg-secondary)]"
        :class="
          isActive(item.to)
            ? 'bg-[var(--accent-light)] text-[var(--accent)]'
            : ''
        "
      >
        <component :is="item.icon" class="h-5 w-5" :stroke-width="1.75" />
      </RouterLink>

      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted)] transition-all duration-150 hover:bg-[var(--border-soft)] hover:text-[var(--fg-secondary)]"
        :title="isDark ? '切换浅色模式' : '切换深色模式'"
        @click="onToggleTheme"
      >
        <component :is="ThemeIcon" class="h-5 w-5" :stroke-width="1.75" />
      </button>
    </div>
  </aside>
</template>
