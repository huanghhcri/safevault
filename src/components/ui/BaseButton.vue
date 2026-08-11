<script setup lang="ts">
import { computed } from "vue";
import { Loader2 } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    loading?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  {
    variant: "primary",
    size: "md",
    disabled: false,
    loading: false,
    type: "button",
  },
);

const classes = computed(() => {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-[6px] transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(94,106,210,0.25)] disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-5 text-sm",
  };

  const variants = {
    primary:
      "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm",
    secondary:
      "bg-[var(--surface)] text-[var(--fg)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg)]",
    ghost:
      "bg-transparent text-[var(--fg-secondary)] hover:bg-[var(--bg)] hover:text-[var(--fg)]",
    danger: "bg-[var(--danger)] text-white hover:opacity-90 shadow-sm",
  };

  return [base, sizes[props.size], variants[props.variant]].join(" ");
});
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
  >
    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
    <slot />
  </button>
</template>
