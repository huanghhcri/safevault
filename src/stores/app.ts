import { defineStore } from "pinia";
import { ref } from "vue";

/** 应用级状态（主题偏好等）；凭证数据在后续步骤接入 */
export const useAppStore = defineStore("app", () => {
  const ready = ref(true);
  const lastError = ref<string | null>(null);

  function setError(message: string | null) {
    lastError.value = message;
  }

  return {
    ready,
    lastError,
    setError,
  };
});
