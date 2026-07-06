<script setup lang="ts">
import type { SearchEnqueuedTask, IndexSettings } from "~/types/search";
import type { SettingsFormState } from "~/utils/indexSettingsForm";
import {
  formStateSnapshot,
  formStateToSettings,
  settingsSnapshot,
  settingsToFormState,
} from "~/utils/indexSettingsForm";

const route = useRoute();
const uid = computed(() => route.params.uid as string);

const { request } = useSearchApi();
const { runWithTask } = useSearchTask();
const toast = useToast();

const resetOpen = ref(false);
const actionLoading = ref(false);
const form = ref<SettingsFormState>(settingsToFormState({}));
const savedSnapshot = ref("");

const {
  data: settings,
  status,
  refresh,
} = await useAsyncData(
  () => `search-settings-${uid.value}`,
  () => request<IndexSettings>(`indexes/${uid.value}/settings`),
);

watch(
  settings,
  (value) => {
    if (value) {
      form.value = settingsToFormState(value);
      savedSnapshot.value = settingsSnapshot(value);
    }
  },
  { immediate: true },
);

const resetDescription = computed(
  () =>
    `Reset all settings for "${uid.value}" to their defaults? This cannot be undone.`,
);

const hasChanges = computed(
  () =>
    savedSnapshot.value !== "" &&
    formStateSnapshot(form.value) !== savedSnapshot.value,
);

function validateAdvancedJson(): boolean {
  try {
    JSON.parse(form.value.embeddersJson);
    JSON.parse(form.value.chatJson);
    return true;
  } catch {
    toast.add({
      title: "Invalid JSON",
      description: "Check the embedders or chat settings in Advanced.",
      color: "error",
    });
    return false;
  }
}

async function saveSettings() {
  if (!validateAdvancedJson()) {
    return;
  }

  actionLoading.value = true;

  try {
    const payload = formStateToSettings(form.value);

    await runWithTask(
      request<SearchEnqueuedTask>(`indexes/${uid.value}/settings`, {
        method: "PATCH",
        body: payload as unknown as Record<string, unknown>,
      }),
      { successMessage: "Settings updated" },
    );

    await refresh();
  } finally {
    actionLoading.value = false;
  }
}

async function resetSettings() {
  actionLoading.value = true;

  try {
    await runWithTask(
      request<SearchEnqueuedTask>(`indexes/${uid.value}/settings`, {
        method: "DELETE",
      }),
      { successMessage: "Settings reset to defaults" },
    );
    resetOpen.value = false;
    await refresh();
  } finally {
    actionLoading.value = false;
  }
}

function discardChanges() {
  if (settings.value) {
    form.value = settingsToFormState(settings.value);
    savedSnapshot.value = settingsSnapshot(settings.value);
  }
}
</script>

<template>
  <UDashboardPanel :id="`index-settings-${uid}`">
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
            :loading="status === 'pending'"
            @click="refresh()"
          />
          <UButton
            label="Discard"
            color="neutral"
            variant="outline"
            :disabled="!hasChanges || actionLoading"
            @click="discardChanges"
          />
          <UButton
            icon="i-lucide-rotate-ccw"
            label="Reset all"
            color="error"
            variant="outline"
            :disabled="actionLoading"
            @click="resetOpen = true"
          />
          <UButton
            icon="i-lucide-save"
            label="Save"
            :loading="actionLoading"
            :disabled="!hasChanges"
            @click="saveSettings"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <SearchIndexSettingsForm v-if="settings" v-model="form" />

      <div v-else-if="status === 'pending'" class="space-y-4 p-6">
        <USkeleton class="h-12 w-full" />
        <USkeleton class="h-48 w-full" />
        <USkeleton class="h-48 w-full" />
      </div>
    </template>
  </UDashboardPanel>

  <SearchConfirmModal
    v-model:open="resetOpen"
    title="Reset all settings"
    :description="resetDescription"
    confirm-label="Reset all"
    :loading="actionLoading"
    @confirm="resetSettings"
  />
</template>
