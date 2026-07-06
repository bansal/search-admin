<script setup lang="ts">
import type { SearchHealth, SearchStats, SearchVersion } from '~/types/search'

const { request } = useSearchApi()

const { data, status, error, refresh } = await useAsyncData('search-overview', async () => {
  const [health, version, stats] = await Promise.all([
    request<SearchHealth>('health'),
    request<SearchVersion>('version'),
    request<SearchStats>('stats')
  ])

  return { health, version, stats }
})

const indexRows = computed(() => {
  if (!data.value?.stats.indexes) {
    return []
  }

  return Object.entries(data.value.stats.indexes).map(([uid, indexStats]) => ({
    uid,
    documents: indexStats.numberOfDocuments,
    indexing: indexStats.isIndexing
  }))
})
</script>

<template>
  <UDashboardPanel id="overview">
    <template #header>
      <UDashboardNavbar title="Overview">
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
      <div v-if="error" class="p-6">
        <UAlert
          color="error"
          variant="subtle"
          title="Failed to connect to search provider"
          :description="error.message"
        />
      </div>

      <div v-else-if="data" class="space-y-6 p-6">
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <UCard>
            <div class="space-y-1">
              <p class="text-sm text-muted">Status</p>
              <div class="flex items-center gap-2">
                <UBadge color="success" variant="subtle">
                  {{ data.health.status }}
                </UBadge>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="space-y-1">
              <p class="text-sm text-muted">Version</p>
              <p class="text-lg font-semibold text-default">
                {{ data.version.pkgVersion }}
              </p>
            </div>
          </UCard>

          <UCard>
            <div class="space-y-1">
              <p class="text-sm text-muted">Database size</p>
              <p class="text-lg font-semibold text-default">
                {{ formatBytes(data.stats.databaseSize) }}
              </p>
            </div>
          </UCard>

          <UCard>
            <div class="space-y-1">
              <p class="text-sm text-muted">Last update</p>
              <p class="text-lg font-semibold text-default">
                {{ formatDate(data.stats.lastUpdate) }}
              </p>
            </div>
          </UCard>
        </div>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-default">
                Indexes
              </h2>
              <UButton
                label="Manage indexes"
                to="/indexes"
                color="neutral"
                variant="outline"
                size="sm"
              />
            </div>
          </template>

          <UTable
            v-if="indexRows.length"
            :data="indexRows"
            :columns="[
              { accessorKey: 'uid', header: 'UID' },
              { accessorKey: 'documents', header: 'Documents' },
              { id: 'indexing', header: 'Indexing' }
            ]"
          >
            <template #uid-cell="{ row }">
              <NuxtLink
                :to="`/indexes/${row.original.uid}`"
                class="font-medium text-primary hover:underline"
              >
                {{ row.original.uid }}
              </NuxtLink>
            </template>

            <template #indexing-cell="{ row }">
              <UBadge
                :color="row.original.indexing ? 'info' : 'neutral'"
                variant="subtle"
              >
                {{ row.original.indexing ? 'Indexing' : 'Idle' }}
              </UBadge>
            </template>
          </UTable>

          <UEmpty
            v-else
            icon="i-lucide-database"
            title="No indexes yet"
            description="Create your first index to start indexing documents."
          >
            <UButton label="Create index" to="/indexes" />
          </UEmpty>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
