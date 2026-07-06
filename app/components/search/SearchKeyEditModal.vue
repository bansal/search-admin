<script setup lang="ts">
import type { ApiKey, KeyUpdatePayload } from '~/types/search'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  apiKey: ApiKey | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: KeyUpdatePayload]
}>()

const name = ref('')
const description = ref('')

watch([open, () => props.apiKey], ([isOpen, apiKey]) => {
  if (isOpen && apiKey) {
    name.value = apiKey.name ?? ''
    description.value = apiKey.description ?? ''
  }
})

function onSubmit() {
  emit('submit', {
    name: name.value.trim() || undefined,
    description: description.value.trim() || undefined
  })
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Edit API key"
    description="Only the name and description can be updated."
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="UID">
          <UInput :model-value="apiKey?.uid" readonly class="w-full font-mono text-sm" />
        </UFormField>

        <UFormField label="Name">
          <UInput v-model="name" placeholder="Frontend search key" class="w-full" />
        </UFormField>

        <UFormField label="Description">
          <UTextarea v-model="description" placeholder="Optional description" class="w-full" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UButton label="Cancel" color="neutral" variant="outline" @click="open = false" />
      <UButton label="Save" :loading="loading" @click="onSubmit" />
    </template>
  </UModal>
</template>
