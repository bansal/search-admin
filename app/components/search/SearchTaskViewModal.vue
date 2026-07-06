<script setup lang="ts">
import type { SearchTask } from '~/types/search'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  task?: SearchTask | null
}>()

const taskJson = computed(() =>
  props.task ? JSON.stringify(props.task, null, 2) : ''
)
</script>

<template>
  <UModal
    v-model:open="open"
    :title="task ? `Task #${task.uid}` : 'Task details'"
    scrollable
    :ui="{
      content: 'sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl w-[calc(100vw-2rem)]'
    }"
  >
    <template #body>
      <div v-if="task" class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p class="text-sm text-muted">Status</p>
            <SearchTaskBadge :status="task.status" />
          </div>
          <div>
            <p class="text-sm text-muted">Type</p>
            <p class="font-mono text-sm text-default">
              {{ task.type }}
            </p>
          </div>
          <div>
            <p class="text-sm text-muted">Index</p>
            <NuxtLink
              v-if="task.indexUid"
              :to="`/indexes/${task.indexUid}`"
              class="font-mono text-sm text-primary hover:underline"
            >
              {{ task.indexUid }}
            </NuxtLink>
            <span v-else class="text-sm text-muted">—</span>
          </div>
          <div>
            <p class="text-sm text-muted">Enqueued</p>
            <p class="text-sm text-default">
              {{ formatDate(task.enqueuedAt) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-muted">Started</p>
            <p class="text-sm text-default">
              {{ formatDate(task.startedAt) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-muted">Finished</p>
            <p class="text-sm text-default">
              {{ formatDate(task.finishedAt) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-muted">Duration</p>
            <p class="text-sm text-default">
              {{ formatDuration(task.duration) }}
            </p>
          </div>
          <div v-if="task.batchUid !== null">
            <p class="text-sm text-muted">Batch</p>
            <p class="font-mono text-sm text-default">
              #{{ task.batchUid }}
            </p>
          </div>
          <div v-if="task.canceledBy !== null">
            <p class="text-sm text-muted">Canceled by</p>
            <p class="font-mono text-sm text-default">
              #{{ task.canceledBy }}
            </p>
          </div>
        </div>

        <UAlert
          v-if="task.error"
          color="error"
          variant="subtle"
          :title="task.error.message"
          :description="`${task.error.code} · ${task.error.type}`"
        />

        <div v-if="task.details" class="space-y-2">
          <p class="text-sm font-medium text-default">Details</p>
          <SearchDocumentViewer :data="task.details" />
        </div>

        <div class="space-y-2">
          <p class="text-sm font-medium text-default">Raw JSON</p>
          <pre class="rounded-lg border border-muted bg-elevated p-4 text-xs font-mono overflow-x-auto">{{ taskJson }}</pre>
        </div>
      </div>

      <UEmpty
        v-else
        icon="i-lucide-list-todo"
        title="No task selected"
        description="Select a task to view its details."
      />
    </template>
  </UModal>
</template>
