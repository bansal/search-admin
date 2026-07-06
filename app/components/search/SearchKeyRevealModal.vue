<script setup lang="ts">
import type { ApiKey } from '~/types/search'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  apiKey: ApiKey | null
}>()

const { copy, copied } = useClipboard({ source: () => props.apiKey?.key ?? '' })

function copyKey() {
  if (props.apiKey?.key) {
    copy(props.apiKey.key)
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="API key created"
    description="Copy this key now. It will not be shown again."
  >
    <template #body>
      <UAlert
        color="warning"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        title="Store this key securely"
        description="The search provider does not return the key value when listing keys. Save it before closing this dialog."
        class="mb-4"
      />

      <UFormField label="Key">
        <div class="flex gap-2">
          <UInput
            :model-value="apiKey?.key"
            readonly
            class="w-full font-mono text-sm"
          />
          <UButton
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            color="neutral"
            variant="outline"
            :disabled="!apiKey?.key"
            @click="copyKey"
          />
        </div>
      </UFormField>
    </template>

    <template #footer>
      <UButton label="Done" @click="open = false" />
    </template>
  </UModal>
</template>
