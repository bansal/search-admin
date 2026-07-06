<script setup lang="ts">
definePageMeta({
  layout: "auth",
});

const toast = useToast();
const { envUrl, envMasterKey, loadConfigStatus } = useAuthConfig();
const { setCredentials } = useAuthSession();

const url = ref("");
const masterKey = ref("");
const remember = ref(false);
const loading = ref(false);
const error = ref("");

await loadConfigStatus();

const needsUrl = computed(() => !envUrl.value);
const needsMasterKey = computed(() => !envMasterKey.value);

async function onSubmit() {
  error.value = "";

  if (needsUrl.value && !url.value.trim()) {
    error.value = "Search URL is required";
    return;
  }

  if (needsMasterKey.value && !masterKey.value.trim()) {
    error.value = "Master key is required";
    return;
  }

  loading.value = true;

  try {
    const { persisted } = await $fetch<{ persisted: boolean }>(
      "/api/auth/connect",
      {
        method: "POST",
        credentials: "include",
        body: {
          url: needsUrl.value ? url.value.trim() : undefined,
          masterKey: needsMasterKey.value ? masterKey.value.trim() : undefined,
          remember: remember.value,
        },
      },
    );

    setCredentials({
      url: needsUrl.value ? url.value.trim() : undefined,
      masterKey: needsMasterKey.value ? masterKey.value.trim() : undefined,
    });

    useAuthSession().applySessionStatus(persisted, persisted);

    toast.add({
      title: "Connected",
      description: persisted
        ? "Search credentials saved in a secure cookie."
        : "Connected for this browser tab only.",
      color: "success",
    });
    await navigateTo("/");
  } catch (err: unknown) {
    const fetchError = err as {
      statusMessage?: string;
      data?: { statusMessage?: string; message?: string };
      message?: string;
    };
    error.value =
      fetchError.data?.statusMessage ||
      fetchError.statusMessage ||
      fetchError.data?.message ||
      fetchError.message ||
      "Failed to connect to Search instance";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex justify-end w-full p-2">
    <UButton
      to="https://github.com/bansal/search-admin"
      target="_blank"
      label="View on GitHub"
      icon="i-simple-icons-github"
      variant="link"
      color="neutral"
      size="sm"
    />
  </div>
  <div class="flex flex-col min-h-dvh items-center justify-center px-6 py-2">
    <UPageCard class="w-full max-w-md" variant="subtle">
      <div class="space-y-8">
        <div class="space-y-4 text-center">
          <h1 class="text-xl font-semibold text-default">
            Connect to Search instance
          </h1>
          <p class="text-sm text-muted">
            Enter your MeiliSearch URL and master key to use this dashboard.
          </p>
        </div>

        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="For demo only"
          description="Use a public or disposable MeiliSearch credentials. Do not connect a production server or real customer data."
          :ui="{
            title: 'text-warning-700',
            description: 'text-toned opacity-100',
          }"
        />

        <UAlert v-if="error" color="error" variant="subtle" :title="error" />

        <form @submit.prevent="onSubmit">
          <div class="space-y-8">
            <UFormField v-if="needsUrl" label="Search URL" required>
              <UInput
                v-model="url"
                type="url"
                placeholder="http://localhost:7700"
                autocomplete="url"
                class="w-full"
              />
            </UFormField>

            <UFormField v-if="needsMasterKey" label="Master key" required>
              <UInput
                v-model="masterKey"
                type="password"
                placeholder="Enter your master key"
                autocomplete="current-password"
                class="w-full"
              />
            </UFormField>

            <UCheckbox
              v-model="remember"
              label="Remember connection in a secure cookie"
              description="Keeps you signed in after refresh. Leave unchecked to stay connected for this tab only."
            />

            <UButton type="submit" label="Connect" block :loading="loading" />
          </div>
        </form>

        <div class="space-y-2 text-center">
          <p class="text-xs text-muted">
            Built by
            <ULink
              to="https://bansal.io"
              target="_blank"
              class="text-default hover:text-primary"
            >
              Jiten Bansal
            </ULink>
          </p>
        </div>
      </div>
    </UPageCard>
  </div>
</template>
