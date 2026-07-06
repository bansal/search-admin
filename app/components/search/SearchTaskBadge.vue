<script setup lang="ts">
import type { SearchTaskStatus } from '~/types/search'

const props = defineProps<{
  status: SearchTaskStatus
}>()

const color = computed(() => {
  switch (props.status) {
    case 'succeeded': return 'success'
    case 'failed': return 'error'
    case 'canceled': return 'warning'
    case 'processing': return 'info'
    default: return 'neutral'
  }
})
</script>

<template>
  <UBadge :color="color" variant="subtle" class="capitalize">
    {{ status }}
  </UBadge>
</template>
