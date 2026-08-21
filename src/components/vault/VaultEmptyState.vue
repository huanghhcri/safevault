<script setup lang="ts">
import { Shield } from "lucide-vue-next";

const emit = defineEmits<{
  add: [];
}>();
</script>

<template>
  <div
    class="flex flex-1 flex-col items-center justify-center gap-4 bg-[var(--bg)] px-10 text-center"
  >
    <Shield class="h-12 w-12 text-[var(--border)]" :stroke-width="1.5" />
    <h3 class="text-[15px] font-semibold text-[var(--fg)]">密码库为空</h3>
    <p class="max-w-[280px] text-[13px] text-[var(--muted)]">
      添加您的第一个凭证以开始安全管理您的密码。
    </p>
    <button
      type="button"
      class="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[var(--accent)] px-3 text-[13px] font-medium text-[var(--on-accent)] transition-all hover:bg-[var(--accent-hover)]"
      @click="emit('add')"
    >
      添加凭证
    </button>
  </div>
</template>
