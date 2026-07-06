<script setup lang="ts">
import type { Row } from '@tanstack/table-core'
import type { SearchEnqueuedTask, SearchIndex, SearchPaginated, SearchStats } from '~/types/search'

const { request } = useSearchApi()
const { runWithTask } = useSearchTask()

const createOpen = ref(false)
const deleteOpen = ref(false)
const pendingDelete = ref<SearchIndex | null>(null)
const actionLoading = ref(false)

type IndexRow = SearchIndex & {
  documents: number
  fields: number
  indexing: boolean
}

const { data, status, refresh } = await useAsyncData('search-indexes', async () => {
  const [indexes, stats] = await Promise.all([
    request<SearchPaginated<SearchIndex>>('indexes', { query: { limit: 100 } }),
    request<SearchStats>('stats')
  ])

  return { indexes, stats }
})

const indexes = computed<IndexRow[]>(() => {
  const results = data.value?.indexes.results ?? []
  const statsMap = data.value?.stats.indexes ?? {}

  return results.map(index => {
    const indexStats = statsMap[index.uid]

    return {
      ...index,
      documents: indexStats?.numberOfDocuments ?? 0,
      fields: indexStats ? Object.keys(indexStats.fieldDistribution).length : 0,
      indexing: indexStats?.isIndexing ?? false
    }
  })
})

function selectIndex(_e: Event, row: Row<IndexRow>) {
  navigateTo(`/indexes/${row.original.uid}`)
}

const deleteDescription = computed(() =>
  pendingDelete.value
    ? `Permanently delete "${pendingDelete.value.uid}" and all its documents?`
    : undefined
)

async function createIndex(payload: { uid: string, primaryKey?: string }) {
  actionLoading.value = true

  try {
    await runWithTask(
      request<SearchEnqueuedTask>('indexes', {
        method: 'POST',
        body: {
          uid: payload.uid,
          primaryKey: payload.primaryKey
        }
      }),
      { successMessage: `Index "${payload.uid}" created` }
    )
    createOpen.value = false
    await refresh()
  } catch {
    // Toast handled in runWithTask
  } finally {
    actionLoading.value = false
  }
}

function confirmDelete(index: SearchIndex) {
  pendingDelete.value = index
  deleteOpen.value = true
}

async function deleteIndex() {
  if (!pendingDelete.value) {
    return
  }

  actionLoading.value = true

  try {
    await runWithTask(
      request<SearchEnqueuedTask>(`indexes/${pendingDelete.value.uid}`, {
        method: 'DELETE'
      }),
      { successMessage: `Index "${pendingDelete.value.uid}" deleted` }
    )
    deleteOpen.value = false
    pendingDelete.value = null
    await refresh()
  } catch {
    // Toast handled in runWithTask
  } finally {
    actionLoading.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="indexes">
    <template #header>
      <UDashboardNavbar title="Indexes">
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
          <UButton
            icon="i-lucide-plus"
            label="Create index"
            @click="createOpen = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UTable
          v-if="indexes.length"
          :data="indexes"
          :loading="status === 'pending'"
          :on-select="selectIndex"
          :columns="[
            { accessorKey: 'uid', header: 'UID' },
            { accessorKey: 'primaryKey', header: 'Primary key' },
            { accessorKey: 'documents', header: 'Documents' },
            { accessorKey: 'fields', header: 'Fields' },
            { id: 'indexing', header: 'Status' },
            { id: 'actions', header: '' }
          ]"
        >
          <template #uid-cell="{ row }">
            <span class="font-medium text-default">
              {{ row.original.uid }}
            </span>
          </template>

          <template #primaryKey-cell="{ row }">
            {{ row.original.primaryKey ?? '—' }}
          </template>

          <template #documents-cell="{ row }">
            {{ row.original.documents.toLocaleString() }}
          </template>

          <template #fields-cell="{ row }">
            {{ row.original.fields.toLocaleString() }}
          </template>

          <template #indexing-cell="{ row }">
            <UBadge
              :color="row.original.indexing ? 'info' : 'neutral'"
              variant="subtle"
            >
              {{ row.original.indexing ? 'Indexing' : 'Idle' }}
            </UBadge>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UButton
                icon="i-lucide-file-text"
                color="neutral"
                variant="ghost"
                :to="`/indexes/${row.original.uid}`"
              />
              <UButton
                icon="i-lucide-settings"
                color="neutral"
                variant="ghost"
                :to="`/indexes/${row.original.uid}/settings`"
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
          icon="i-lucide-database"
          title="No indexes"
          description="Create an index to start adding documents."
        >
          <UButton label="Create index" @click="createOpen = true" />
        </UEmpty>
      </div>
    </template>
  </UDashboardPanel>

  <SearchIndexFormModal
    v-model:open="createOpen"
    :loading="actionLoading"
    @submit="createIndex"
  />

  <SearchConfirmModal
    v-model:open="deleteOpen"
    title="Delete index"
    :description="deleteDescription"
    confirm-label="Delete"
    :loading="actionLoading"
    @confirm="deleteIndex"
  />
</template>
