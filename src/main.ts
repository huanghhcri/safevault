import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { initAppearance } from "./utils/appearance";
import { useVaultStore } from "./stores/vault";
import "./assets/styles/main.css";

initAppearance();

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

useVaultStore(pinia).boot().finally(() => {
  app.mount("#app");
});
