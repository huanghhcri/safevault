<script setup lang="ts">
import { computed } from "vue";
import type { CredentialCategory } from "../../types/credential";
import { CATEGORY_TAG_CLASS } from "../../types/credential";

const props = defineProps<{
  type: CredentialCategory;
  text: string;
}>();

const classes = computed(() => CATEGORY_TAG_CLASS[props.type]);
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="classes"
  >
    {{ text }}
  </span>
</template>
