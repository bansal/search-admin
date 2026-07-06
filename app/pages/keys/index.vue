<script setup lang="ts">
import type { ApiKey, KeyCreatePayload, KeyUpdatePayload, SearchPaginated } from '~/types/search'

const { request } = useSearchApi()
const toast = useToast()

const createOpen = ref(false)
const editOpen = ref(false)
const revealOpen = ref(false)
const deleteOpen = ref(false)
const pendingDelete = ref<ApiKey | null>(null)
const pendingEdit = ref<ApiKey | null>(null)
const createdKey = ref<ApiKey | null>(null)
const actionLoading = ref(false)

const { data, status, refresh } = await useAsyncData('search-keys', () =>
  request<SearchPaginated<ApiKey>>('keys', { query: { limit: 100 } })
)

const keys = computed(() => data.value?.results ?? [])

const deleteDescription = computed(() => {
  if (!pendingDelete.value) {
    return undefined
  }

  const label = pendingDelete.value.name || pendingDelete.value.uid
  return `Permanently revoke "${label}"? Requests using this key will be rejected immediately.`
})

function isExpired(expiresAt: string | null) {
  if (!expiresAt) {
    return false
  }

  return new Date(expiresAt) < new Date()
}

function displayName(apiKey: ApiKey) {
  return apiKey.name || apiKey.uid
}

async function createKey(payload: KeyCreatePayload) {
  actionLoading.value = true

  try {
    const key = await request<ApiKey>('keys', {
      method: 'POST',
      body: payload as unknown as Record<string, unknown>
    })

    createOpen.value = false
    createdKey.value = key
    revealOpen.value = true

    toast.add({ title: 'API key created', color: 'success' })
    await refresh()
  } catch (error) {
    toast.add({
      title: 'Failed to create key',
      description: error instanceof Error ? error.message : 'Unknown error',
      color: 'error'
    })
  } finally {
    actionLoading.value = false
  }
}

function openCreateModal() {
  createOpen.value = true
}

function confirmEdit(apiKey: ApiKey) {
  pendingEdit.value = apiKey
  editOpen.value = true
}

async function updateKey(payload: KeyUpdatePayload) {
  if (!pendingEdit.value) {
    return
  }

  actionLoading.value = true

  try {
    await request<ApiKey>(`keys/${pendingEdit.value.uid}`, {
      method: 'PATCH',
      body: payload as unknown as Record<string, unknown>
    })

    editOpen.value = false
    pendingEdit.value = null

    toast.add({ title: 'API key updated', color: 'success' })
    await refresh()
  } catch (error) {
    toast.add({
      title: 'Failed to update key',
      description: error instanceof Error ? error.message : 'Unknown error',
      color: 'error'
    })
  } finally {
    actionLoading.value = false
  }
}

function confirmDelete(apiKey: ApiKey) {
  pendingDelete.value = apiKey
  deleteOpen.value = true
}

async function deleteKey() {
  if (!pendingDelete.value) {
    return
  }

  actionLoading.value = true

  try {
    await request(`keys/${pendingDelete.value.uid}`, { method: 'DELETE' })

    deleteOpen.value = false
    pendingDelete.value = null

    toast.add({ title: 'API key deleted', color: 'success' })
    await refresh()
  } catch (error) {
    toast.add({
      title: 'Failed to delete key',
      description: error instanceof Error ? error.message : 'Unknown error',
      color: 'error'
    })
  } finally {
    actionLoading.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="keys">
    <template #header>
      <UDashboardNavbar title="API keys">
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
            label="Create key"
            @click="openCreateModal"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <UTable
          v-if="keys.length"
          :data="keys"
          :columns="[
            { accessorKey: 'name', header: 'Name' },
            { accessorKey: 'actions', header: 'Actions' },
            { accessorKey: 'indexes', header: 'Indexes' },
            { accessorKey: 'expiresAt', header: 'Expires' },
            { accessorKey: 'createdAt', header: 'Created' },
            { id: 'row-actions', header: '' }
          ]"
        >
          <template #name-cell="{ row }">
            <div>
              <p class="font-medium text-default">
                {{ displayName(row.original) }}
              </p>
              <p v-if="row.original.description" class="text-sm text-muted truncate max-w-xs">
                {{ row.original.description }}
              </p>
              <p class="font-mono text-xs text-muted mt-0.5">
                {{ row.original.uid }}
              </p>
            </div>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex flex-wrap gap-1 max-w-md">
              <UBadge
                v-for="action in row.original.actions.slice(0, 4)"
                :key="action"
                color="neutral"
                variant="subtle"
                class="font-mono text-xs"
              >
                {{ action }}
              </UBadge>
              <UBadge
                v-if="row.original.actions.length > 4"
                color="neutral"
                variant="outline"
              >
                +{{ row.original.actions.length - 4 }}
              </UBadge>
            </div>
          </template>

          <template #indexes-cell="{ row }">
            <div class="flex flex-wrap gap-1 max-w-xs">
              <UBadge
                v-for="index in row.original.indexes.slice(0, 3)"
                :key="index"
                color="neutral"
                variant="outline"
                class="font-mono text-xs"
              >
                {{ index }}
              </UBadge>
              <UBadge
                v-if="row.original.indexes.length > 3"
                color="neutral"
                variant="outline"
              >
                +{{ row.original.indexes.length - 3 }}
              </UBadge>
            </div>
          </template>

          <template #expiresAt-cell="{ row }">
            <div class="flex items-center gap-2">
              <span>{{ formatDate(row.original.expiresAt) }}</span>
              <UBadge
                v-if="isExpired(row.original.expiresAt)"
                color="error"
                variant="subtle"
              >
                Expired
              </UBadge>
            </div>
          </template>

          <template #createdAt-cell="{ row }">
            {{ formatDate(row.original.createdAt) }}
          </template>

          <template #row-actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                @click="confirmEdit(row.original)"
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
          icon="i-lucide-key"
          title="No API keys"
          description="Create scoped keys to control access to your search instance."
        >
          <UButton label="Create key" @click="openCreateModal" />
        </UEmpty>
      </div>
    </template>
  </UDashboardPanel>

  <SearchKeyFormModal
    v-model:open="createOpen"
    :loading="actionLoading"
    @submit="createKey"
  />

  <SearchKeyEditModal
    v-model:open="editOpen"
    :api-key="pendingEdit"
    :loading="actionLoading"
    @submit="updateKey"
  />

  <SearchKeyRevealModal
    v-model:open="revealOpen"
    :api-key="createdKey"
  />

  <SearchConfirmModal
    v-model:open="deleteOpen"
    title="Delete API key"
    :description="deleteDescription"
    confirm-label="Delete"
    :loading="actionLoading"
    @confirm="deleteKey"
  />
</template>
