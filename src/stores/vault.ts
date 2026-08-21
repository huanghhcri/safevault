import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { vaultApi, type VaultStatus } from "../services/vaultApi";
import { useCredentialStore } from "./credentials";

export const useVaultStore = defineStore("vault", () => {
  const initialized = ref(false);
  const unlocked = ref(false);
  const booting = ref(true);
  const busy = ref(false);
  const lastError = ref<string | null>(null);

  const ready = computed(() => !booting.value && unlocked.value);

  async function refreshStatus(): Promise<VaultStatus> {
    const status = await vaultApi.status();
    initialized.value = status.initialized;
    unlocked.value = status.unlocked;
    return status;
  }

  async function boot() {
    booting.value = true;
    lastError.value = null;
    try {
      await refreshStatus();
      if (unlocked.value) {
        await useCredentialStore().refresh();
      }
    } catch (e) {
      lastError.value = e instanceof Error ? e.message : String(e);
    } finally {
      booting.value = false;
    }
  }

  async function setup(password: string) {
    busy.value = true;
    lastError.value = null;
    try {
      await vaultApi.setup(password);
      initialized.value = true;
      unlocked.value = true;
      useCredentialStore().clearSession();
      await useCredentialStore().refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      lastError.value = msg;
      throw e;
    } finally {
      busy.value = false;
    }
  }

  async function unlock(password: string) {
    busy.value = true;
    lastError.value = null;
    try {
      await vaultApi.unlock(password);
      unlocked.value = true;
      await useCredentialStore().refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      lastError.value = msg;
      throw e;
    } finally {
      busy.value = false;
    }
  }

  async function lock() {
    busy.value = true;
    lastError.value = null;
    try {
      await vaultApi.lock();
      unlocked.value = false;
      useCredentialStore().clearSession();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      lastError.value = msg;
      throw e;
    } finally {
      busy.value = false;
    }
  }

  return {
    initialized,
    unlocked,
    booting,
    busy,
    lastError,
    ready,
    boot,
    refreshStatus,
    setup,
    unlock,
    lock,
  };
});
