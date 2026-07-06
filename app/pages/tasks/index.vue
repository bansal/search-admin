<script setup lang="ts">
import type {
  SearchIndex,
  SearchPaginated,
  SearchTask,
  SearchTaskFilters,
  SearchTaskStatus,
  SearchTaskType
} from '~/types/search'
import { TASK_STATUSES, TASK_TYPES } from '~/types/search'

const { request } = useSearchApi()
const { getTasks, cancelTasks, deleteTasks, runWithTask } = useSearchTask()

const PAGE_SIZE = 20

const selectedStatuses = ref<SearchTaskStatus[]>([])
const selectedTypes = ref<SearchTaskType[]>([])
const selectedIndex = ref<string | undefined>(undefined)
const cursorFrom = ref<number | undefined>(undefined)

const viewOpen = ref(false)
const cancelOpen = ref(false)
const deleteOpen = ref(false)
const pendingTask = ref<SearchTask | null>(null)
const actionLoading = ref(false)

const filters = computed<SearchTaskFilters>(() => ({
  limit: PAGE_SIZE,
  from: cursorFrom.value,
  statuses: selectedStatuses.value.length ? selectedStatuses.value : undefined,
  types: selectedTypes.value.length ? selectedTypes.value : undefined,
  indexUids: selectedIndex.value ? [selectedIndex.value] : undefined
}))

const { data, status, refresh } = await useAsyncData(
  'search-tasks',
  () => getTasks(filters.value),
  { watch: [filters] }
)

const { data: indexesData } = await useAsyncData('search-tasks-indexes', () =>
  request<SearchPaginated<SearchIndex>>('indexes', { query: { limit: 100 } })
)

const tasks = computed(() => data.value?.results ?? [])
const total = computed(() => data.value?.total ?? 0)
const hasNext = computed(() => data.value?.next != null)
const hasActiveTasks = computed(() =>
  tasks.value.some(task => task.status === 'enqueued' || task.status === 'processing')
)

const indexOptions = computed(() =>
  (indexesData.value?.results ?? []).map(index => ({
    label: index.uid,
    value: index.uid
  }))
)

const cancelDescription = computed(() =>
  pendingTask.value
    ? `Cancel task #${pendingTask.value.uid}? Only enqueued or processing tasks can be canceled.`
    : undefined
)

const deleteDescription = computed(() =>
  pendingTask.value
    ? `Permanently delete task #${pendingTask.value.uid} from the task history?`
    : undefined
)

function formatTaskType(type: string) {
  return TASK_TYPES.find(item => item.value === type)?.label ?? type
}

function canCancel(task: SearchTask) {
  return task.status === 'enqueued' || task.status === 'processing'
}

function viewTask(task: SearchTask) {
  pendingTask.value = task
  viewOpen.value = true
}

function confirmCancel(task: SearchTask) {
  pendingTask.value = task
  cancelOpen.value = true
}

function confirmDelete(task: SearchTask) {
  pendingTask.value = task
  deleteOpen.value = true
}

function resetFilters() {
  selectedStatuses.value = []
  selectedTypes.value = []
  selectedIndex.value = undefined
  cursorFrom.value = undefined
}

function loadNext() {
  if (data.value?.next != null) {
    cursorFrom.value = data.value.next
  }
}

async function cancelTask() {
  if (!pendingTask.value) {
    return
  }

  actionLoading.value = true

  try {
    await runWithTask(
      cancelTasks({ uids: [pendingTask.value.uid] }),
      { successMessage: `Task #${pendingTask.value.uid} canceled`, wait: false }
    )
    cancelOpen.value = false
    pendingTask.value = null
    await refresh()
  } catch {
    // Toast handled in runWithTask
  } finally {
    actionLoading.value = false
  }
}

async function deleteTask() {
  if (!pendingTask.value) {
    return
  }

  actionLoading.value = true

  try {
    await runWithTask(
      deleteTasks({ uids: [pendingTask.value.uid] }),
      { successMessage: `Task #${pendingTask.value.uid} deleted`, wait: false }
    )
    deleteOpen.value = false
    pendingTask.value = null
    await refresh()
  } catch {
    // Toast handled in runWithTask
  } finally {
    actionLoading.value = false
  }
}

let refreshTimer: ReturnType<typeof setInterval> | undefined

watch(hasActiveTasks, (active) => {
  if (active) {
    refreshTimer ??= setInterval(() => refresh(), 3000)
  } else if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = undefined
  }
}, { immediate: true })

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})

watch([selectedStatuses, selectedTypes, selectedIndex], () => {
  cursorFrom.value = undefined
})
</script>

<template>
  <UDashboardPanel id="tasks">
    <template #header>
      <UDashboardNavbar title="Tasks">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="status === 'pending'"
            @click="refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-4">
        <div class="flex flex-wrap items-end gap-3">
          <UFormField label="Status" class="min-w-48">
            <USelectMenu
              v-model="selectedStatuses"
              :items="[...TASK_STATUSES]"
              value-key="value"
              label-key="label"
              multiple
              searchable
              placeholder="All statuses"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Type" class="min-w-56">
            <USelectMenu
              v-model="selectedTypes"
              :items="[...TASK_TYPES]"
              value-key="value"
              label-key="label"
              multiple
              searchable
              placeholder="All types"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Index" class="min-w-48">
            <USelectMenu
              v-model="selectedIndex"
              :items="indexOptions"
              value-key="value"
              label-key="label"
              searchable
              placeholder="All indexes"
              class="w-full"
            />
          </UFormField>

          <UButton
            label="Clear filters"
            color="neutral"
            variant="outline"
            :disabled="!selectedStatuses.length && !selectedTypes.length && !selectedIndex"
            @click="resetFilters"
          />
        </div>

        <p class="text-sm text-muted">
          {{ total }} task{{ total === 1 ? '' : 's' }} matching filters
          <span v-if="hasActiveTasks"> · auto-refreshing</span>
        </p>

        <UTable
          v-if="tasks.length"
          :data="tasks"
          :columns="[
            { accessorKey: 'uid', header: 'UID' },
            { accessorKey: 'type', header: 'Type' },
            { id: 'status', header: 'Status' },
            { accessorKey: 'indexUid', header: 'Index' },
            { accessorKey: 'enqueuedAt', header: 'Enqueued' },
            { accessorKey: 'duration', header: 'Duration' },
            { id: 'row-actions', header: '' }
          ]"
        >
          <template #uid-cell="{ row }">
            <button
              type="button"
              class="font-mono font-medium text-primary hover:underline"
              @click="viewTask(row.original)"
            >
              #{{ row.original.uid }}
            </button>
          </template>

          <template #type-cell="{ row }">
            <span class="text-sm text-default">
              {{ formatTaskType(row.original.type) }}
            </span>
          </template>

          <template #status-cell="{ row }">
            <SearchTaskBadge :status="row.original.status" />
          </template>

          <template #indexUid-cell="{ row }">
            <NuxtLink
              v-if="row.original.indexUid"
              :to="`/indexes/${row.original.indexUid}`"
              class="font-mono text-sm text-primary hover:underline"
            >
              {{ row.original.indexUid }}
            </NuxtLink>
            <span v-else class="text-muted">—</span>
          </template>

          <template #enqueuedAt-cell="{ row }">
            {{ formatDate(row.original.enqueuedAt) }}
          </template>

          <template #duration-cell="{ row }">
            {{ formatDuration(row.original.duration) }}
          </template>

          <template #row-actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UButton
                icon="i-lucide-eye"
                color="neutral"
                variant="ghost"
                @click="viewTask(row.original)"
              />
              <UButton
                v-if="canCancel(row.original)"
                icon="i-lucide-ban"
                color="warning"
                variant="ghost"
                @click="confirmCancel(row.original)"
              />
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                @click="confirmDelete(row.original)"
              />
            </div>
          </template>
        </UTable>

        <UEmpty
          v-else
          icon="i-lucide-list-todo"
          title="No tasks"
          description="Asynchronous operations like indexing and settings updates appear here."
        />

        <div v-if="tasks.length" class="flex items-center justify-between">
          <UButton
            label="Previous"
            color="neutral"
            variant="outline"
            :disabled="cursorFrom === undefined"
            @click="cursorFrom = undefined"
          />
          <UButton
            v-if="hasNext"
            label="Load more"
            color="neutral"
            variant="outline"
            :loading="status === 'pending'"
            @click="loadNext"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <SearchTaskViewModal
    v-model:open="viewOpen"
    :task="pendingTask"
  />

  <SearchConfirmModal
    v-model:open="cancelOpen"
    title="Cancel task"
    :description="cancelDescription"
    confirm-label="Cancel task"
    color="primary"
    :loading="actionLoading"
    @confirm="cancelTask"
  />

  <SearchConfirmModal
    v-model:open="deleteOpen"
    title="Delete task"
    :description="deleteDescription"
    confirm-label="Delete"
    :loading="actionLoading"
    @confirm="deleteTask"
  />
</template>
