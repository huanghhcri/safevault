<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Eye, EyeOff, ShieldCheck } from "lucide-vue-next";
import { useVaultStore } from "../stores/vault";

const vault = useVaultStore();
const router = useRouter();

const password = ref("");
const confirm = ref("");
const showPassword = ref(false);
const localError = ref("");

const isSetup = computed(() => !vault.initialized);

const title = computed(() =>
  isSetup.value ? "创建主密码" : "解锁 SafeVault",
);

async function onSubmit() {
  localError.value = "";
  if (password.value.trim().length < 8) {
    localError.value = "主密码至少 8 位，建议使用更长且不易被猜到的密码";
    return;
  }
  if (isSetup.value) {
    if (password.value !== confirm.value) {
      localError.value = "两次输入的主密码不一致";
      return;
    }
    try {
      await vault.setup(password.value);
      password.value = "";
      confirm.value = "";
      await router.replace({ name: "vault" });
    } catch (e) {
      localError.value = e instanceof Error ? e.message : String(e);
    }
    return;
  }
  try {
    await vault.unlock(password.value);
    password.value = "";
    await router.replace({ name: "vault" });
  } catch (e) {
    localError.value = e instanceof Error ? e.message : String(e);
  }
}
</script>

<template>
  <div
    class="flex h-full min-h-0 items-center justify-center overflow-y-auto bg-[var(--bg)] px-6 py-10"
  >
    <div class="w-full max-w-[440px]">
      <div class="mb-6 flex flex-col items-center text-center">
        <div
          class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--on-accent)]"
        >
          <ShieldCheck class="h-6 w-6" :stroke-width="2" />
        </div>
        <h1 class="text-xl font-semibold tracking-tight text-[var(--fg)]">
          {{ title }}
        </h1>
      </div>

      <!-- 创建主密码：详细说明 -->
      <div
        v-if="isSetup"
        class="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-left text-[13px] leading-relaxed text-[var(--fg-secondary)]"
      >
        <p class="font-medium text-[var(--fg)]">主密码是什么？</p>
        <p class="mt-1.5">
          它是进入 SafeVault 的<strong class="font-medium text-[var(--fg)]">总密码</strong>。
          每次打开软件时都需要输入，通过后才能查看和管理你保存的账号密码。
        </p>
        <p class="mt-3 font-medium text-[var(--fg)]">它和微信 / 支付宝密码有什么区别？</p>
        <ul class="mt-1.5 list-disc space-y-1 pl-4">
          <li>主密码：打开本软件保险箱的钥匙</li>
          <li>微信、支付宝等：放进保险箱里的那些登录密码</li>
        </ul>
        <p class="mt-3 font-medium text-[var(--fg)]">为什么需要它？</p>
        <p class="mt-1.5">
          所有凭证都会加密后保存在本机。没有正确主密码，即使别人拿到数据文件，也无法看到你的密码。
        </p>
        <p class="mt-3 rounded-lg bg-[var(--warn-light)] px-3 py-2 text-[12px] text-[var(--warning)]">
          请务必牢记主密码。软件不会以明文保存它，也没有「忘记密码」找回功能；遗失后密码库将无法打开。
        </p>
      </div>

      <!-- 解锁：说明 -->
      <div
        v-else
        class="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-left text-[13px] leading-relaxed text-[var(--fg-secondary)]"
      >
        <p>
          请输入你创建密码库时设置的<strong class="font-medium text-[var(--fg)]">主密码</strong>，以解锁并查看已保存的凭证。
        </p>
        <p class="mt-2 text-[12px] text-[var(--muted)]">
          主密码是进入 SafeVault 的总门禁，不是某个网站或 App 的登录密码。
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">
            主密码
          </label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="isSetup ? 'new-password' : 'current-password'"
              class="h-10 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] py-0 pl-3 pr-10 text-[13px] outline-none focus:border-[var(--accent)]"
              :placeholder="isSetup ? '设置进入软件的总密码' : '输入主密码以进入'"
            />
            <button
              type="button"
              class="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[6px] text-[var(--muted)] hover:bg-[var(--border-soft)]"
              :title="showPassword ? '隐藏' : '显示'"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="h-4 w-4" />
              <Eye v-else class="h-4 w-4" />
            </button>
          </div>
          <p v-if="isSetup" class="mt-1.5 text-[11px] text-[var(--muted)]">
            至少 8 位。建议使用较长密码，并混合字母、数字与符号。
          </p>
        </div>

        <div v-if="isSetup">
          <label class="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">
            确认主密码
          </label>
          <input
            v-model="confirm"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            class="h-10 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] outline-none focus:border-[var(--accent)]"
            placeholder="再输入一次，防止记错"
          />
        </div>

        <p
          v-if="localError || vault.lastError"
          class="text-[13px] text-[var(--danger)]"
        >
          {{ localError || vault.lastError }}
        </p>

        <button
          type="submit"
          class="inline-flex h-10 w-full items-center justify-center rounded-[6px] bg-[var(--accent)] text-[13px] font-medium text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
          :disabled="vault.busy"
        >
          {{ vault.busy ? "处理中…" : isSetup ? "创建并进入密码库" : "解锁进入" }}
        </button>
      </form>

      <p class="mt-5 text-center text-[11px] leading-relaxed text-[var(--muted)]">
        数据仅保存在本机，并使用 AES-256 加密。
        <br />
        技术细节：AES-256-GCM · PBKDF2-HMAC-SHA256（210,000 次）
      </p>
    </div>
  </div>
</template>
