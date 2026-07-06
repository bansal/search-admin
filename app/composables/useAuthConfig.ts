import { createSharedComposable } from "@vueuse/core";

type AuthConfigStatus = {
  configured: boolean;
  missingFields: Array<"url" | "masterKey">;
  envUrl: boolean;
  envMasterKey: boolean;
  sessionAuthenticated: boolean;
  sessionPersisted: boolean;
};

const _useAuthConfig = () => {
  const envConfigured = useState("auth-env-configured", () => false);
  const envUrl = useState("auth-env-url", () => false);
  const envMasterKey = useState("auth-env-master-key", () => false);
  const missingFields = useState<Array<"url" | "masterKey">>(
    "auth-missing-fields",
    () => [],
  );
  const loaded = useState("auth-config-loaded", () => false);
  const loading = ref(false);

  async function loadConfigStatus() {
    if (loading.value) {
      return {
        configured: envConfigured.value,
        missingFields: missingFields.value,
        envUrl: envUrl.value,
        envMasterKey: envMasterKey.value,
        sessionAuthenticated: useAuthSession().sessionAuthenticated.value,
        sessionPersisted: useAuthSession().sessionPersisted.value,
      };
    }

    loading.value = true;

    try {
      const status = await $fetch<AuthConfigStatus>("/api/auth/status", {
        credentials: "include",
      });
      envConfigured.value = status.configured;
      envUrl.value = status.envUrl;
      envMasterKey.value = status.envMasterKey;
      missingFields.value = status.missingFields;
      loaded.value = true;

      useAuthSession().applySessionStatus(
        status.sessionAuthenticated,
        status.sessionPersisted,
      );

      return status;
    } finally {
      loading.value = false;
    }
  }

  return {
    envConfigured,
    envUrl,
    envMasterKey,
    missingFields,
    loaded,
    loading,
    loadConfigStatus,
  };
};

export const useAuthConfig = createSharedComposable(_useAuthConfig);
