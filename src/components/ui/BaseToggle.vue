<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

function onChange(event: Event) {
  emit("update:modelValue", (event.target as HTMLInputElement).checked);
}
</script>

<template>
  <label
    class="relative inline-block h-6 w-11 flex-shrink-0"
    :class="disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'"
  >
    <input
      type="checkbox"
      class="peer sr-only"
      :checked="props.modelValue"
      :disabled="disabled"
      @change="onChange"
    />
    <span
      class="absolute inset-0 rounded-full bg-[var(--border)] transition-all duration-200 peer-checked:bg-[var(--accent)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent)]"
    />
    <span
      class="absolute bottom-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-[var(--surface)] shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-transform duration-200 peer-checked:translate-x-5"
    />
  </label>
</template>
