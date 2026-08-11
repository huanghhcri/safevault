<script setup lang="ts">
withDefaults(
  defineProps<{
    padded?: boolean;
  }>(),
  {
    padded: true,
  },
);
</script>

<template>
  <div
    class="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] shadow-card"
    :class="padded ? 'p-4' : ''"
  >
    <slot />
  </div>
</template>
