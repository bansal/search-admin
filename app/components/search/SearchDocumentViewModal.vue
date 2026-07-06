<script setup lang="ts">
import type { SearchDocument } from '~/types/search'

const open = defineModel<boolean>('open', { default: false })

defineProps<{
  document?: SearchDocument
}>()
</script>

<template>
  <UModal
    v-model:open="open"
    title="View document"
    scrollable
    :ui="{
      content: 'sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl w-[calc(100vw-2rem)]'
    }"
  >
    <template #body>
      <SearchDocumentViewer
        v-if="document && Object.keys(document).length"
        :data="document"
      />
      <UEmpty
        v-else
        icon="i-lucide-file-text"
        title="Empty document"
        description="This document has no fields."
      />
    </template>
  </UModal>
</template>
