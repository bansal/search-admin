<script setup lang="ts">
import type { SearchIndex, KeyAction, KeyCreatePayload, SearchPaginated } from '~/types/search'
import { KEY_ACTIONS } from '~/types/search'

const open = defineModel<boolean>('open', { default: false })

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: KeyCreatePayload]
}>()

const { request } = useSearchApi()

const name = ref('')
const description = ref('')
const selectedActions = ref<KeyAction[]>([])
const allIndexes = ref(false)
const selectedIndexes = ref<string[]>([])
const expiresAt = ref('')

const { data: indexesData } = await useAsyncData(
  'search-key-form-indexes',
  () => request<SearchPaginated<SearchIndex>>('indexes', { query: { limit: 100 } }),
  { watch: [open] }
)

const indexOptions = computed(() =>
  (indexesData.value?.results ?? []).map(index => ({
    label: index.uid,
    value: index.uid
  }))
)

watch(open, (isOpen) => {
  if (isOpen) {
    name.value = ''
    description.value = ''
    selectedActions.value = []
    allIndexes.value = false
    selectedIndexes.value = []
    expiresAt.value = ''
  }
})

function onSubmit() {
  if (!selectedActions.value.length) {
    return
  }

  const indexes = allIndexes.value ? ['*'] : selectedIndexes.value

  if (!indexes.length) {
    return
  }

  emit('submit', {
    name: name.value.trim() || undefined,
    description: description.value.trim() || undefined,
    actions: selectedActions.value,
    indexes,
    expiresAt: expiresAt.value ? new Date(expiresAt.value).toISOString() : null
  })
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Create API key"
    description="Scope permissions and indexes. Actions, indexes, and expiration cannot be changed later."
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="Name" hint="Optional human-readable label.">
          <UInput v-model="name" placeholder="Frontend search key" class="w-full" />
        </UFormField>

        <UFormField label="Description" hint="Optional note about how this key is used.">
          <UTextarea v-model="description" placeholder="Search-only key for the products index" class="w-full" />
        </UFormField>

        <UFormField label="Actions" required hint="Grant only the permissions this key needs.">
          <USelectMenu
            v-model="selectedActions"
            :items="[...KEY_ACTIONS]"
            value-key="value"
            label-key="label"
            multiple
            searchable
            placeholder="Select actions"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Indexes" required hint="Use * for all indexes, or pick specific ones.">
          <div class="space-y-3">
            <UCheckbox v-model="allIndexes" label="All indexes (*)" />

            <USelectMenu
              v-if="!allIndexes"
              v-model="selectedIndexes"
              :items="indexOptions"
              value-key="value"
              label-key="label"
              multiple
              searchable
              placeholder="Select indexes"
              class="w-full"
            />
          </div>
        </UFormField>

        <UFormField label="Expires at" hint="Leave empty for a key that never expires.">
          <UInput v-model="expiresAt" type="datetime-local" class="w-full" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UButton label="Cancel" color="neutral" variant="outline" @click="open = false" />
      <UButton
        label="Create"
        :loading="loading"
        :disabled="!selectedActions.length || (!allIndexes && !selectedIndexes.length)"
        @click="onSubmit"
      />
    </template>
  </UModal>
</template>
