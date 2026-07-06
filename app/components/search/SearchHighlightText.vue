<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>

<template>
  <span class="search-highlight" v-html="text" />
</template>

<style scoped>
.search-highlight :deep(em),
.search-highlight :deep(mark) {
  font-style: normal;
  font-weight: 500;
  border-radius: 0.125rem;
  padding-inline: 0.125rem;
  background-color: color-mix(in oklab, var(--ui-info) 30%, transparent);
  color: var(--ui-text-highlighted);
}
</style>
