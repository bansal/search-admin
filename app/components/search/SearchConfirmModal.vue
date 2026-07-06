<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

defineProps<{
  title: string
  description?: string
  confirmLabel?: string
  loading?: boolean
  color?: 'error' | 'primary' | 'neutral'
}>()

const emit = defineEmits<{
  confirm: []
}>()
</script>

<template>
  <UModal v-model:open="open" :title="title" :description="description">
    <template #footer>
      <UButton
        label="Cancel"
        color="neutral"
        variant="outline"
        @click="open = false"
      />
      <UButton
        :label="confirmLabel ?? 'Confirm'"
        :color="color ?? 'error'"
        :loading="loading"
        @click="emit('confirm')"
      />
    </template>
  </UModal>
</template>
