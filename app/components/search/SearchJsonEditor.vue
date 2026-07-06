<script setup lang="ts">
const model = defineModel<string>({ required: true })

const props = defineProps<{
  label?: string
  rows?: number
  readonly?: boolean
}>()

const error = ref<string | null>(null)

function format() {
  try {
    const parsed = JSON.parse(model.value)
    model.value = JSON.stringify(parsed, null, 2)
    error.value = null
  } catch {
    error.value = 'Cannot format: invalid JSON'
  }
}

defineExpose({
  validate(): boolean {
    try {
      JSON.parse(model.value)
      error.value = null
      return true
    } catch {
      error.value = 'Invalid JSON'
      return false
    }
  }
})
</script>

<template>
  <div class="space-y-2">
    <div v-if="label || !readonly" class="flex items-center justify-between gap-2">
      <label v-if="label" class="text-sm font-medium text-default">
        {{ label }}
      </label>
      <UButton
        v-if="!readonly"
        label="Format"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="format"
      />
    </div>

    <UTextarea
      v-model="model"
      :rows="rows ?? 12"
      :readonly="readonly"
      class="font-mono text-sm w-full"
      :color="error ? 'error' : undefined"
    />

    <p v-if="error" class="text-sm text-error">
      {{ error }}
    </p>
  </div>
</template>
