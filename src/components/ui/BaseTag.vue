<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  type: "account" | "server" | "token" | "other";
  text: string;
}>();

const classes = computed(() => {
  const map = {
    account: "bg-[#EEF2FF] text-[#5E6AD2] dark:bg-[#5E6AD2]/20 dark:text-[#A5B4FC]",
    server: "bg-[#F0FDF4] text-[#22C55E] dark:bg-[#22C55E]/20 dark:text-[#86EFAC]",
    token: "bg-[#FFF7ED] text-[#F59E0B] dark:bg-[#F59E0B]/20 dark:text-[#FCD34D]",
    other: "bg-[#F3F4F6] text-[#6B7280] dark:bg-[#374151] dark:text-[#D1D5DB]",
  };
  return map[props.type];
});
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="classes"
  >
    {{ text }}
  </span>
</template>
