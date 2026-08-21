<script setup lang="ts">
import { computed, ref, provide } from "vue";
import { useRoute, useRouter } from "vue-router";
import Sidebar from "./Sidebar.vue";
import TopBar from "./TopBar.vue";

const route = useRoute();
const router = useRouter();
const searchQuery = ref("");

provide("vaultSearchQuery", searchQuery);

const hideTopBar = computed(() => Boolean(route.meta.hideTopBar));

function onAdd() {
  router.push({ name: "credential-create" });
}
</script>

<template>
  <div class="flex h-full overflow-hidden bg-[var(--bg)] text-[13px]">
    <Sidebar />
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <TopBar
        v-if="!hideTopBar"
        v-model:search-query="searchQuery"
        @add="onAdd"
      />
      <main class="min-h-0 flex-1 overflow-hidden">
        <router-view />
      </main>
    </div>
  </div>
</template>
