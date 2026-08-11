import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "../components/layout/MainLayout.vue";
import HomeView from "../views/HomeView.vue";
import GeneratorView from "../views/GeneratorView.vue";
import HealthView from "../views/HealthView.vue";
import SettingsView from "../views/SettingsView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
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

export default router;
