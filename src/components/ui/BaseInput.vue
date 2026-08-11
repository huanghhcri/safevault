<script setup lang="ts">
import type { Component } from "vue";

withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    type?: string;
    icon?: Component;
    disabled?: boolean;
  }>(),
  {
    modelValue: "",
    placeholder: "",
    type: "text",
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div class="relative w-full">
    <component
      :is="icon"
      v-if="icon"
      class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-secondary)]"
    />
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="h-9 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--fg)] transition-all duration-150 placeholder:text-[var(--fg-secondary)] focus:border-[var(--accent)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(94,106,210,0.1)] disabled:cursor-not-allowed disabled:opacity-50"
      :class="icon ? 'pl-9 pr-3' : 'px-3'"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>
