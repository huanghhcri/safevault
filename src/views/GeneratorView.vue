<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Copy, RefreshCw } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { useGeneratorStore } from "../stores/generator";
import {
  classifyChar,
  strengthLabelZh,
} from "../utils/passwordGenerator";
import { copyText } from "../utils/credential";
import BaseToggle from "../components/ui/BaseToggle.vue";

const store = useGeneratorStore();
const { options, password, history, strength, entropy } = storeToRefs(store);
const route = useRoute();
const router = useRouter();

const toast = ref<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const fromForm = computed(
  () => route.query.from === "form" || store.returnToForm,
);

function showToast(message: string) {
  toast.value = message;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = null;
  }, 2000);
}

const strengthClass = computed(() => {
  const map = {
    strong: "gen-strong",
    medium: "gen-medium",
    weak: "gen-weak",
  } as const;
  return map[strength.value];
});

const coloredChars = computed(() =>
  Array.from(password.value).map((ch) => ({
    ch,
    kind: classifyChar(ch),
  })),
);

function formatTime(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  return `${Math.floor(diff / 3_600_000)} 小时前`;
}

async function onCopy(value: string) {
  const ok = await copyText(value, { clearAfterMs: 30_000 });
  showToast(ok ? "已复制（30 秒后清除）" : "复制失败");
}

function onRegenerate() {
  try {
    store.regenerate();
  } catch (e) {
    showToast(e instanceof Error ? e.message : "生成失败");
  }
}

function applyToForm() {
  store.useForNewCredential();
  const editId = store.returnEditId;
  store.returnToForm = false;
  store.returnEditId = null;
  if (editId) {
    router.push({ name: "credential-edit", params: { id: editId } });
    return;
  }
  router.push({ name: "credential-create" });
}

onMounted(() => {
  if (route.query.from === "form") {
    store.returnToForm = true;
  }
  if (!password.value) {
    try {
      store.regenerate();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "生成失败");
    }
  }
});

watch(
  () => [
    options.value.uppercase,
    options.value.lowercase,
    options.value.digits,
    options.value.symbols,
  ],
  () => {
    const any =
      options.value.uppercase ||
      options.value.lowercase ||
      options.value.digits ||
      options.value.symbols;
    if (!any) showToast("请至少选择一种字符类型");
  },
);
</script>

<template>
  <div class="h-full min-h-0 overflow-y-auto">
    <div class="mx-auto flex max-w-[560px] flex-col px-10 py-10">
      <h2 class="text-xl font-semibold tracking-tight text-[var(--fg)]">
        密码生成器
      </h2>
      <p class="mb-7 mt-1 text-[13px] text-[var(--fg-secondary)]">
        生成安全的随机密码，可自定义长度和字符类型。
      </p>

      <!-- 输出 -->
      <section
        class="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
      >
        <div
          class="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]"
        >
          生成结果
        </div>
        <div
          class="flex min-h-14 items-center break-all rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3.5 font-mono text-[22px] font-medium leading-snug tracking-wide text-[var(--fg)]"
        >
          <span
            v-for="(item, idx) in coloredChars"
            :key="`${idx}-${item.ch}`"
            :class="{
              'text-[var(--accent)]': item.kind === 'upper',
              'text-[var(--success)]': item.kind === 'digit',
              'text-[var(--warning)]': item.kind === 'symbol',
            }"
          >{{ item.ch }}</span>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[var(--accent)] px-3 text-[13px] font-medium text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
            @click="onRegenerate"
          >
            <RefreshCw class="h-[15px] w-[15px]" />
            重新生成
          </button>
          <button
            type="button"
            class="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[var(--border)] px-3 text-[13px] font-medium text-[var(--fg-secondary)] hover:bg-[var(--border-soft)]"
            @click="onCopy(password)"
          >
            <Copy class="h-[15px] w-[15px]" />
            复制
          </button>
          <button
            v-if="fromForm"
            type="button"
            class="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[var(--accent)] px-3 text-[13px] font-medium text-[var(--accent)] hover:bg-[var(--accent-light)]"
            @click="applyToForm"
          >
            填入表单
          </button>
          <button
            v-else
            type="button"
            class="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[var(--border)] px-3 text-[13px] font-medium text-[var(--fg-secondary)] hover:bg-[var(--border-soft)]"
            @click="applyToForm"
          >
            用于新建凭证
          </button>
        </div>

        <div class="mt-4 flex items-center gap-2.5" :class="strengthClass">
          <div class="flex flex-1 gap-0.5">
            <span
              v-for="i in 4"
              :key="i"
              class="gen-seg h-1 flex-1 rounded-sm bg-[var(--border)]"
            />
          </div>
          <span class="gen-label whitespace-nowrap text-xs font-medium">
            {{ strengthLabelZh(strength) }}
          </span>
          <span class="ml-auto text-[11px] text-[var(--muted)]">
            ≈ {{ entropy }} 位熵
          </span>
        </div>
      </section>

      <!-- 选项 -->
      <section
        class="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
      >
        <div class="mb-5">
          <div class="mb-2.5 flex items-center justify-between">
            <span class="text-[13px] font-medium text-[var(--fg)]">密码长度</span>
            <span class="font-mono text-[13px] font-medium text-[var(--accent)]">
              {{ options.length }}
            </span>
          </div>
          <input
            v-model.number="options.length"
            type="range"
            min="8"
            max="64"
            class="gen-range w-full"
          />
          <div class="mt-1 flex justify-between text-[11px] text-[var(--muted)]">
            <span>8</span>
            <span>64</span>
          </div>
        </div>

        <div class="mb-5">
          <div class="mb-2.5 text-[13px] font-medium text-[var(--fg)]">
            字符类型
          </div>
          <div class="divide-y divide-[var(--border-soft)]">
            <div class="flex items-center justify-between py-2">
              <span class="text-[13px] text-[var(--fg)]">大写字母 (A-Z)</span>
              <BaseToggle v-model="options.uppercase" />
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-[13px] text-[var(--fg)]">小写字母 (a-z)</span>
              <BaseToggle v-model="options.lowercase" />
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-[13px] text-[var(--fg)]">数字 (0-9)</span>
              <BaseToggle v-model="options.digits" />
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-[13px] text-[var(--fg)]">特殊符号 (!@#$%)</span>
              <BaseToggle v-model="options.symbols" />
            </div>
          </div>
        </div>

        <div>
          <div class="mb-2.5 text-[13px] font-medium text-[var(--fg)]">
            排除易混淆字符
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-[13px] text-[var(--fg)]">排除 l, 1, I, O, 0</span>
            <BaseToggle v-model="options.excludeAmbiguous" />
          </div>
        </div>
      </section>

      <!-- 历史 -->
      <section
        class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
      >
        <div class="mb-3 text-[13px] font-semibold text-[var(--fg)]">
          最近生成
        </div>
        <p
          v-if="history.length === 0"
          class="py-2 text-[13px] text-[var(--muted)]"
        >
          暂无记录（仅保存在本次会话内存中）
        </p>
        <div
          v-for="item in history"
          :key="`${item.createdAt}-${item.password}`"
          class="flex items-center gap-3 border-b border-[var(--border-soft)] py-2 last:border-b-0"
        >
          <span
            class="min-w-0 flex-1 truncate font-mono text-[13px] text-[var(--fg)]"
          >
            {{ item.password }}
          </span>
          <span class="whitespace-nowrap text-[11px] text-[var(--muted)]">
            {{ formatTime(item.createdAt) }}
          </span>
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--muted)] hover:bg-[var(--border-soft)] hover:text-[var(--fg-secondary)]"
            title="复制"
            @click="onCopy(item.password)"
          >
            <Copy class="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    </div>

    <div
      v-if="toast"
      class="fixed bottom-6 right-6 z-[100] flex items-center rounded-lg bg-[var(--fg)] px-4 py-2.5 text-[13px] font-medium text-[var(--surface)] shadow-[var(--shadow-float)]"
    >
      {{ toast }}
    </div>
  </div>
</template>

<style scoped>
.gen-strong .gen-seg {
  background: var(--success);
}
.gen-strong .gen-label {
  color: var(--success);
}
.gen-medium .gen-seg:nth-child(-n + 3) {
  background: var(--warning);
}
.gen-medium .gen-label {
  color: var(--warning);
}
.gen-weak .gen-seg:nth-child(1) {
  background: var(--danger);
}
.gen-weak .gen-label {
  color: var(--danger);
}

.gen-range {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--border);
  outline: none;
}
.gen-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: 2px solid var(--surface);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}
.gen-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: 2px solid var(--surface);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}
</style>
