<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { uid: string, primaryKey?: string }]
}>()

const uid = ref('')
const primaryKey = ref('')

watch(open, (isOpen) => {
  if (isOpen) {
    uid.value = ''
    primaryKey.value = ''
  }
})

function onSubmit() {
  if (!uid.value.trim()) {
    return
  }

  emit('submit', {
    uid: uid.value.trim(),
    primaryKey: primaryKey.value.trim() || undefined
  })
}
</script>

<template>
  <UModal v-model:open="open" title="Create index" description="Add a new search index.">
    <template #body>
      <div class="space-y-4">
        <UFormField label="UID" required>
          <UInput v-model="uid" placeholder="movies" class="w-full" />
        </UFormField>

        <UFormField label="Primary key" hint="Optional. Can be inferred from first document.">
          <UInput v-model="primaryKey" placeholder="id" class="w-full" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UButton label="Cancel" color="neutral" variant="outline" @click="open = false" />
      <UButton
        label="Create"
        :loading="loading"
        :disabled="!uid.trim()"
        @click="onSubmit"
      />
    </template>
  </UModal>
</template>
