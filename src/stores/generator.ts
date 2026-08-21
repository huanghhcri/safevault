import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import {
  DEFAULT_GENERATE_OPTIONS,
  estimateEntropyBits,
  generatePassword,
  strengthOfGenerated,
  type GenerateOptions,
} from "../utils/passwordGenerator";
import type { CredentialFormInput } from "../types/credential";

export interface GeneratorHistoryItem {
  password: string;
  createdAt: number;
}

const HISTORY_LIMIT = 8;

export const useGeneratorStore = defineStore("generator", () => {
  const options = ref<GenerateOptions>({ ...DEFAULT_GENERATE_OPTIONS });
  const password = ref("");
  const history = ref<GeneratorHistoryItem[]>([]);
  const pendingForForm = ref<string | null>(null);
  const returnToForm = ref(false);
  const returnEditId = ref<string | null>(null);

  const strength = computed(() => strengthOfGenerated(password.value));
  const entropy = computed(() =>
    estimateEntropyBits(password.value, options.value),
  );

  function regenerate() {
    const next = generatePassword(options.value);
    password.value = next;
    history.value = [
      { password: next, createdAt: Date.now() },
      ...history.value.filter((h) => h.password !== next),
    ].slice(0, HISTORY_LIMIT);
  }

  function takePendingForForm(): string | null {
    const value = pendingForForm.value;
    pendingForForm.value = null;
    return value;
  }

  function useForNewCredential() {
    pendingForForm.value = password.value;
  }

  /** 离开表单去生成器前暂存，避免回填时丢失已填字段 */
  const formDraft = ref<CredentialFormInput | null>(null);

  function saveFormDraft(draft: CredentialFormInput | null) {
    formDraft.value = draft
      ? {
          ...draft,
          tags: [...(draft.tags ?? [])],
        }
      : null;
  }

  function takeFormDraft(): CredentialFormInput | null {
    const value = formDraft.value;
    formDraft.value = null;
    return value;
  }

  let skipWatch = true;
  watch(
    options,
    () => {
      if (skipWatch) {
        skipWatch = false;
        return;
      }
      try {
        regenerate();
      } catch {
        /* ignore */
      }
    },
    { deep: true },
  );

  return {
    options,
    password,
    history,
    pendingForForm,
    returnToForm,
    returnEditId,
    formDraft,
    strength,
    entropy,
    regenerate,
    takePendingForForm,
    useForNewCredential,
    saveFormDraft,
    takeFormDraft,
  };
});
