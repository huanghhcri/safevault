import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { initAppearance } from "./utils/appearance";
import "./assets/styles/main.css";

initAppearance();

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount("#app");
