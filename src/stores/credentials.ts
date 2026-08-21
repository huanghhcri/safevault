import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type {
  Credential,
  CredentialCategory,
  CredentialFormInput,
} from "../types/credential";
import { vaultApi } from "../services/vaultApi";

export const useCredentialStore = defineStore("credentials", () => {
  const credentials = ref<Credential[]>([]);
  const selectedId = ref<string | null>(null);
  const filter = ref<CredentialCategory | "all">("all");
  const loading = ref(false);
  const error = ref<string | null>(null);

  const selected = computed(
    () => credentials.value.find((c) => c.id === selectedId.value) ?? null,
  );

  function select(id: string | null) {
    selectedId.value = id;
  }

  function setFilter(next: CredentialCategory | "all") {
    filter.value = next;
  }

  async function refresh() {
    loading.value = true;
    error.value = null;
    try {
      const list = await vaultApi.list();
      credentials.value = list;
      if (
        selectedId.value &&
        !list.some((c) => c.id === selectedId.value)
      ) {
        selectedId.value = list[0]?.id ?? null;
      } else if (!selectedId.value && list.length > 0) {
        selectedId.value = list[0].id;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
      credentials.value = [];
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function clearSession() {
    credentials.value = [];
    selectedId.value = null;
    error.value = null;
  }

  async function create(input: CredentialFormInput): Promise<Credential> {
    const item = await vaultApi.create(input);
    credentials.value = [item, ...credentials.value.filter((c) => c.id !== item.id)];
    selectedId.value = item.id;
    return item;
  }

  async function update(
    id: string,
    input: CredentialFormInput,
  ): Promise<Credential> {
    const item = await vaultApi.update(id, input);
    credentials.value = credentials.value.map((c) => (c.id === id ? item : c));
    selectedId.value = id;
    return item;
  }

  async function remove(id: string): Promise<void> {
    await vaultApi.remove(id);
    credentials.value = credentials.value.filter((c) => c.id !== id);
    if (selectedId.value === id) {
      selectedId.value = credentials.value[0]?.id ?? null;
    }
  }

  function getById(id: string): Credential | undefined {
    return credentials.value.find((c) => c.id === id);
  }

  return {
    credentials,
    selectedId,
    selected,
    filter,
    loading,
    error,
    select,
    setFilter,
    refresh,
    clearSession,
    create,
    update,
    remove,
    getById,
  };
});
