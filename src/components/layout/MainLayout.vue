<script setup lang="ts">
import Sidebar from "./Sidebar.vue";
import TopBar from "./TopBar.vue";

function onSearch() {
  // 搜索弹窗后续接入
}

function onAdd() {
  // 新增条目后续接入
}
</script>

<template>
  <div class="flex h-full overflow-hidden bg-[var(--bg)]">
    <Sidebar />
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <TopBar @search="onSearch" @add="onAdd" />
      <main class="min-h-0 flex-1 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
