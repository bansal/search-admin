<script setup lang="ts">
import type { SortingState } from "@tanstack/table-core";
import type { TableColumn } from "@nuxt/ui";
import type {
  SearchDocument,
  SearchEnqueuedTask,
  SearchIndex,
  IndexSettings,
  SearchHit,
  SearchResponse,
} from "~/types/search";
import {
  buildDocumentPreview,
  buildPreviewFields,
  type PreviewField,
} from "~/utils/documentDisplay";
import { countFilterConditions } from "~/utils/searchFilters";

const PAGE_SIZE = 20;

const route = useRoute();
const uid = computed(() => route.params.uid as string);

const { request } = useSearchApi();
const { runWithTask } = useSearchTask();
const toast = useToast();

const searchInput = ref("");
const filterInput = ref("");
const debouncedSearch = refDebounced(searchInput, 300);
const debouncedFilter = refDebounced(filterInput, 300);
const sorting = ref<SortingState>([]);

const hits = ref<SearchHit[]>([]);
const totalHits = ref(0);
const processingTimeMs = ref<number | null>(null);
const searchStatus = ref<"idle" | "pending" | "success" | "error">("idle");
const loadingMore = ref(false);

const filtersOpen = ref(false);
const addOpen = ref(false);
const editOpen = ref(false);
const viewOpen = ref(false);
const deleteOpen = ref(false);
const deleteAllOpen = ref(false);
const actionLoading = ref(false);

const selectedDocument = ref<SearchDocument | null>(null);
const selectedPrimaryKey = ref<string | null>(null);

const scrollContainer = useTemplateRef<HTMLElement>("scrollContainer");

const { data: index, refresh: refreshIndex } = await useAsyncData(
  () => `search-index-${uid.value}`,
  () => request<SearchIndex>(`indexes/${uid.value}`),
);

const { data: settings } = await useAsyncData(
  () => `search-settings-${uid.value}`,
  () => request<IndexSettings>(`indexes/${uid.value}/settings`),
);

const sortParam = computed(() =>
  sorting.value.map((item) => `${item.id}:${item.desc ? "desc" : "asc"}`),
);

const primaryKey = computed(() => index.value?.primaryKey ?? "id");
const sortableAttributes = computed(
  () => settings.value?.sortableAttributes ?? [],
);
const displayedAttributes = computed(
  () => settings.value?.displayedAttributes ?? ["*"],
);
const isSearching = computed(() => debouncedSearch.value.trim().length > 0);
const hasMore = computed(() => hits.value.length < totalHits.value);
const hasActiveFilters = computed(
  () => debouncedFilter.value.trim().length > 0,
);
const activeFilterCount = computed(() =>
  countFilterConditions(filterInput.value),
);

function getDocumentId(doc: SearchDocument): string {
  const key = primaryKey.value;
  const value = doc[key];
  return value != null ? String(value) : "";
}

function getFormattedId(hit: SearchHit): string | undefined {
  const formatted = hit._formatted?.[primaryKey.value];
  return formatted != null ? String(formatted) : undefined;
}

function formatSortableValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "string") {
    return value.length > 48 ? `${value.slice(0, 48)}…` : value;
  }

  const serialized = JSON.stringify(value);
  return serialized.length > 48 ? `${serialized.slice(0, 48)}…` : serialized;
}

interface TableRow {
  id: string;
  idFormatted?: string;
  preview: string;
  previewFormatted: string;
  previewFields: PreviewField[];
  document: SearchHit;
  hasHighlights: boolean;
  [key: string]: unknown;
}

const tableRows = computed<TableRow[]>(() =>
  hits.value.map((hit) => {
    const idFormatted = getFormattedId(hit);
    const row: TableRow = {
      id: getDocumentId(hit),
      idFormatted,
      preview: buildDocumentPreview(hit, undefined, displayedAttributes.value),
      previewFormatted: buildDocumentPreview(
        hit,
        hit._formatted,
        displayedAttributes.value,
      ),
      previewFields: buildPreviewFields(
        hit,
        hit._formatted,
        displayedAttributes.value,
      ),
      document: hit,
      hasHighlights: isSearching.value && !!hit._formatted,
    };

    for (const attribute of sortableAttributes.value) {
      row[attribute] = formatSortableValue(hit[attribute]);
    }

    return row;
  }),
);

const columns = computed<TableColumn<TableRow>[]>(() => {
  const cols: TableColumn<TableRow>[] = [];

  for (const attribute of sortableAttributes.value) {
    if (attribute === primaryKey.value) {
      continue;
    }

    cols.push({
      accessorKey: attribute,
      header: attribute,
      enableSorting: true,
    });
  }

  cols.push(
    {
      accessorKey: "preview",
      header: "",
      enableSorting: false,
    },
    { id: "actions", header: "" },
  );

  return cols;
});

const fileInputRef = useTemplateRef<HTMLInputElement>("fileInput");

const deleteDescription = computed(() =>
  selectedPrimaryKey.value
    ? `Delete document "${selectedPrimaryKey.value}"?`
    : undefined,
);

const deleteAllDescription = computed(
  () => `Delete all documents in "${uid.value}"? Index settings are preserved.`,
);

async function runSearch(reset: boolean) {
  if (!reset) {
    if (
      !hasMore.value ||
      loadingMore.value ||
      searchStatus.value === "pending"
    ) {
      return;
    }

    loadingMore.value = true;
  } else {
    searchStatus.value = "pending";
    hits.value = [];
    totalHits.value = 0;
    processingTimeMs.value = null;
  }

  const body: Record<string, unknown> = {
    q: debouncedSearch.value,
    offset: reset ? 0 : hits.value.length,
    limit: PAGE_SIZE,
  };

  if (debouncedSearch.value) {
    body.attributesToHighlight = ["*"];
  }

  if (debouncedFilter.value.trim()) {
    body.filter = debouncedFilter.value.trim();
  }

  if (sortParam.value.length) {
    body.sort = sortParam.value;
  }

  try {
    const response = await request<SearchResponse>(
      `indexes/${uid.value}/search`,
      {
        method: "POST",
        body,
      },
    );

    hits.value = reset ? response.hits : [...hits.value, ...response.hits];
    totalHits.value =
      response.estimatedTotalHits ?? response.totalHits ?? hits.value.length;
    processingTimeMs.value = response.processingTimeMs;
    searchStatus.value = "success";
  } catch (error) {
    if (reset) {
      hits.value = [];
      totalHits.value = 0;
      processingTimeMs.value = 0;
    }

    searchStatus.value = "error";

    toast.add({
      title: "Search failed",
      description:
        error instanceof Error
          ? error.message
          : "Check your filter or sort settings.",
      color: "error",
    });
  } finally {
    loadingMore.value = false;
  }
}

async function refreshSearch() {
  await runSearch(true);
}

watch(
  [debouncedSearch, debouncedFilter, sortParam, uid],
  () => {
    runSearch(true);
  },
  { immediate: true },
);

useInfiniteScroll(scrollContainer, () => runSearch(false), {
  distance: 240,
  canLoadMore: () =>
    hasMore.value && !loadingMore.value && searchStatus.value !== "pending",
});

function openView(doc: SearchDocument) {
  selectedDocument.value = doc;
  viewOpen.value = true;
}

function openEdit(doc: SearchDocument) {
  selectedDocument.value = { ...doc };
  editOpen.value = true;
}

function confirmDelete(doc: SearchDocument) {
  selectedDocument.value = doc;
  selectedPrimaryKey.value = getDocumentId(doc);
  deleteOpen.value = true;
}

async function addDocuments(document: SearchDocument | SearchDocument[]) {
  actionLoading.value = true;

  try {
    const payload = Array.isArray(document) ? document : [document];
    await runWithTask(
      request<SearchEnqueuedTask>(`indexes/${uid.value}/documents`, {
        method: "POST",
        body: payload,
      }),
      { successMessage: "Documents added" },
    );
    addOpen.value = false;
    await Promise.all([refreshSearch(), refreshIndex()]);
  } finally {
    actionLoading.value = false;
  }
}

async function updateDocument(document: SearchDocument) {
  actionLoading.value = true;

  try {
    await runWithTask(
      request<SearchEnqueuedTask>(`indexes/${uid.value}/documents`, {
        method: "PUT",
        body: [document],
      }),
      { successMessage: "Document updated" },
    );
    editOpen.value = false;
    await refreshSearch();
  } finally {
    actionLoading.value = false;
  }
}

async function deleteDocument() {
  if (!selectedPrimaryKey.value) {
    return;
  }

  actionLoading.value = true;

  try {
    await runWithTask(
      request<SearchEnqueuedTask>(
        `indexes/${uid.value}/documents/${selectedPrimaryKey.value}`,
        {
          method: "DELETE",
        },
      ),
      { successMessage: "Document deleted" },
    );
    deleteOpen.value = false;
    selectedPrimaryKey.value = null;
    await refreshSearch();
  } finally {
    actionLoading.value = false;
  }
}

async function deleteAllDocuments() {
  actionLoading.value = true;

  try {
    await runWithTask(
      request<SearchEnqueuedTask>(`indexes/${uid.value}/documents`, {
        method: "DELETE",
      }),
      { successMessage: "All documents deleted" },
    );
    deleteAllOpen.value = false;
    await refreshSearch();
  } finally {
    actionLoading.value = false;
  }
}

async function onFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const payload = Array.isArray(parsed) ? parsed : [parsed];
    await addDocuments(payload);
  } catch {
    toast.add({
      title: "Invalid file",
      description: "Upload a JSON array or object.",
      color: "error",
    });
  } finally {
    input.value = "";
  }
}

function clearSearchAndFilters() {
  searchInput.value = "";
  filterInput.value = "";
}
const { style } = useScrollShadow(scrollContainer);
</script>

<template>
  <UDashboardPanel
    :id="`index-${uid}`"
    class="bg-elevated"
    :ui="{
      body: 'p-0 sm:p-0',
    }"
  >
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
          <SearchIndexNav />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="searchStatus === 'pending'"
            @click="refreshSearch()"
          />
          <UButton
            icon="i-lucide-upload"
            label="Import JSON"
            color="neutral"
            variant="outline"
            @click="fileInputRef?.click()"
          />
          <input
            ref="fileInput"
            type="file"
            accept=".json,.ndjson"
            class="hidden"
            @change="onFileUpload"
          />
          <UButton
            icon="i-lucide-plus"
            label="Add document"
            @click="addOpen = true"
          />
          <UButton
            icon="i-lucide-trash-2"
            label="Delete all"
            color="error"
            variant="outline"
            :disabled="!hits.length"
            @click="deleteAllOpen = true"
          />
        </template>
      </UDashboardNavbar>

      <div class="flex justify-between gap-3 px-8 pb-2 pt-4">
        <div class="flex w-full items-center gap-3">
          <UInput
            v-model="searchInput"
            icon="i-lucide-search"
            placeholder="Search documents..."
            size="xl"
            class="flex-1 grow"
            :ui="{ base: 'text-base', leadingIcon: 'size-4' }"
          />
          <UChip
            :show="activeFilterCount > 0"
            color="secondary"
            size="3xl"
            :text="activeFilterCount.toString()"
          >
            <UButton
              icon="i-lucide-sliders-horizontal"
              label="Filters"
              size="lg"
              color="neutral"
              variant="outline"
              @click="filtersOpen = true"
            />
          </UChip>
        </div>
      </div>
      <div class="flex items-center gap-3 px-10 py-1">
        <div
          v-if="processingTimeMs != null"
          class="flex items-center justify-start gap-2 min-w-24"
        >
          <p class="text-xs uppercase tracking-wider font-medium text-muted">
            Time (ms)
          </p>
          <p class="text-xs font-bold">
            {{ processingTimeMs }}
          </p>
        </div>
        <div class="flex items-center justify-start gap-2 min-w-24">
          <p class="text-xs uppercase tracking-wider font-medium text-muted">
            Documents
          </p>
          <p class="text-xs font-bold">
            {{ totalHits.toLocaleString() }}
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div ref="scrollContainer" :style="style" class="h-full overflow-y-auto">
        <div class="space-y-4 px-6">
          <UTable
            v-if="tableRows.length || searchStatus === 'pending'"
            v-model:sorting="sorting"
            :data="tableRows"
            :columns="columns"
            :loading="searchStatus === 'pending'"
            :ui="{
              th: 'p-1',
            }"
          >
            <template #id-cell="{ row }">
              <SearchHighlightText
                v-if="row.original.hasHighlights && row.original.idFormatted"
                :text="row.original.idFormatted"
                class="font-medium"
              />
              <span v-else class="font-medium">
                {{ row.original.id }}
              </span>
            </template>

            <template #preview-cell="{ row }">
              <div class="space-y-1 max-w-2xl">
                <div
                  v-for="field in row.original.previewFields"
                  :key="field.key"
                  class="text-sm leading-snug"
                >
                  <span class="text-muted">{{ field.key }}:</span>
                  <SearchHighlightText
                    v-if="row.original.hasHighlights && field.formatted"
                    :text="field.formatted"
                    class="ml-1 text-default font-medium"
                  />
                  <span v-else class="ml-1 text-default font-medium">
                    {{ field.value }}
                  </span>
                </div>
              </div>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex justify-end gap-1">
                <UButton
                  icon="i-lucide-eye"
                  color="neutral"
                  variant="ghost"
                  @click="openView(row.original.document)"
                />
                <UButton
                  icon="i-lucide-pencil"
                  color="neutral"
                  variant="ghost"
                  @click="openEdit(row.original.document)"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  @click="confirmDelete(row.original.document)"
                />
              </div>
            </template>
          </UTable>

          <UEmpty
            v-else-if="debouncedSearch || debouncedFilter"
            icon="i-lucide-search-x"
            title="No matching documents"
            description="Try a different search query or filter expression."
          >
            <UButton
              label="Clear search and filters"
              color="neutral"
              variant="outline"
              @click="clearSearchAndFilters()"
            />
          </UEmpty>

          <UEmpty
            v-else
            icon="i-lucide-file-text"
            title="No documents"
            description="Add a document or import a JSON file."
          >
            <UButton label="Add document" @click="addOpen = true" />
          </UEmpty>

          <div v-if="loadingMore" class="flex justify-center py-4">
            <UIcon
              name="i-lucide-loader-circle"
              class="size-5 animate-spin text-muted"
            />
          </div>

          <p
            v-else-if="hits.length && !hasMore"
            class="text-center text-sm text-muted py-4"
          >
            All {{ hits.length.toLocaleString() }} documents loaded
          </p>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <SearchIndexFiltersSlideover
    v-model:open="filtersOpen"
    v-model:filter="filterInput"
    :filterable-attributes="settings?.filterableAttributes"
  />

  <SearchDocumentModal
    v-model:open="addOpen"
    title="Add document"
    description="Paste a JSON object. For multiple documents, use Import JSON."
    :initial-document="{}"
    :loading="actionLoading"
    confirm-label="Add"
    @submit="addDocuments"
  />

  <SearchDocumentModal
    v-model:open="editOpen"
    title="Edit document"
    :initial-document="selectedDocument ?? undefined"
    :loading="actionLoading"
    @submit="updateDocument"
  />

  <SearchDocumentViewModal
    v-model:open="viewOpen"
    :document="selectedDocument ?? undefined"
  />

  <SearchConfirmModal
    v-model:open="deleteOpen"
    title="Delete document"
    :description="deleteDescription"
    confirm-label="Delete"
    :loading="actionLoading"
    @confirm="deleteDocument"
  />

  <SearchConfirmModal
    v-model:open="deleteAllOpen"
    title="Delete all documents"
    :description="deleteAllDescription"
    confirm-label="Delete all"
    :loading="actionLoading"
    @confirm="deleteAllDocuments"
  />
</template>
