<script setup lang="ts">
import type { SearchDocument } from '~/types/search'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  title: string
  description?: string
  initialDocument?: SearchDocument
  loading?: boolean
  readonly?: boolean
  confirmLabel?: string
}>()

const emit = defineEmits<{
  submit: [document: SearchDocument]
}>()

const json = ref('{}')
const editorRef = useTemplateRef('editor')

watch(open, (isOpen) => {
  if (isOpen) {
    json.value = JSON.stringify(props.initialDocument ?? {}, null, 2)
  }
})

function onSubmit() {
  if (!editorRef.value?.validate()) {
    return
  }

  emit('submit', JSON.parse(json.value) as SearchDocument)
}
</script>

<template>
  <UModal v-model:open="open" :title="title" :description="description">
    <template #body>
      <SearchJsonEditor
        ref="editor"
        v-model="json"
        :readonly="readonly"
      />
    </template>

    <template v-if="!readonly" #footer>
      <UButton label="Cancel" color="neutral" variant="outline" @click="open = false" />
      <UButton
        :label="confirmLabel ?? 'Save'"
        :loading="loading"
        @click="onSubmit"
      />
    </template>
  </UModal>
</template>
