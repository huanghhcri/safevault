import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "../components/layout/MainLayout.vue";
import HomeView from "../views/HomeView.vue";
import CredentialFormView from "../views/CredentialFormView.vue";
import UnlockView from "../views/UnlockView.vue";
import GeneratorView from "../views/GeneratorView.vue";
import HealthView from "../views/HealthView.vue";
import SettingsView from "../views/SettingsView.vue";
import { useVaultStore } from "../stores/vault";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/unlock",
      name: "unlock",
      component: UnlockView,
      meta: { public: true, title: "解锁" },
    },
    {
      path: "/",
      component: MainLayout,
      children: [
        {
          path: "",
          name: "vault",
          component: HomeView,
          meta: { title: "密码库" },
        },
        {
          path: "credentials/new",
          name: "credential-create",
          component: CredentialFormView,
          meta: { title: "添加凭证", hideTopBar: true },
        },
        {
          path: "credentials/:id/edit",
          name: "credential-edit",
          component: CredentialFormView,
          meta: { title: "编辑凭证", hideTopBar: true },
        },
        {
          path: "generator",
          name: "generator",
          component: GeneratorView,
          meta: { title: "密码生成器" },
        },
        {
          path: "health",
          name: "health",
          component: HealthView,
          meta: { title: "密码健康" },
        },
        {
          path: "settings",
          name: "settings",
          component: SettingsView,
          meta: { title: "设置" },
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const vault = useVaultStore();
  if (vault.booting) {
    await vault.boot();
  }
  if (to.meta.public) {
    if (vault.unlocked && to.name === "unlock") {
      return { name: "vault" };
    }
    return true;
  }
  if (!vault.unlocked) {
    return { name: "unlock", query: { redirect: to.fullPath } };
  }
  return true;
});

export default router;
