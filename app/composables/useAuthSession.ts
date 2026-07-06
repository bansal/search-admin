export type AuthSessionCredentials = {
  url?: string;
  masterKey?: string;
};

const credentials = ref<AuthSessionCredentials | null>(null);
const sessionAuthenticated = ref(false);
const sessionPersisted = ref(false);

function hasInMemoryCredentials(
  stored: AuthSessionCredentials | null,
  envUrl: boolean,
  envMasterKey: boolean,
) {
  if (!stored) {
    return false;
  }

  if (!envUrl && !stored.url?.trim()) {
    return false;
  }

  if (!envMasterKey && !stored.masterKey?.trim()) {
    return false;
  }

  return true;
}

export function useAuthSession() {
  const isAuthenticated = computed(() => {
    const { envConfigured, envUrl, envMasterKey } = useAuthConfig();

    if (envConfigured.value) {
      return true;
    }

    if (sessionAuthenticated.value) {
      return true;
    }

    return hasInMemoryCredentials(
      credentials.value,
      envUrl.value,
      envMasterKey.value,
    );
  });

  const usesBrowserCredentials = computed(() => {
    const { envConfigured } = useAuthConfig();
    return !envConfigured.value && isAuthenticated.value;
  });

  function applySessionStatus(
    authenticated: boolean,
    persisted: boolean,
  ) {
    sessionAuthenticated.value = authenticated;
    sessionPersisted.value = persisted;
  }

  function setCredentials(stored: AuthSessionCredentials) {
    const current = credentials.value ?? {};

    credentials.value = {
      url: stored.url?.trim() || current.url,
      masterKey: stored.masterKey?.trim() || current.masterKey,
    };
  }

  function clearCredentials() {
    credentials.value = null;
    sessionAuthenticated.value = false;
    sessionPersisted.value = false;
  }

  function getAuthHeaders(): Record<string, string> {
    if (sessionPersisted.value) {
      return {};
    }

    const { envUrl, envMasterKey } = useAuthConfig();
    const stored = credentials.value;
    const headers: Record<string, string> = {};

    if (!envUrl.value && stored?.url) {
      headers["X-Auth-Url"] = stored.url;
    }

    if (!envMasterKey.value && stored?.masterKey) {
      headers["X-Auth-Master-Key"] = stored.masterKey;
    }

    return headers;
  }

  async function logout() {
    await $fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    clearCredentials();
    await navigateTo("/connect");
  }

  return {
    credentials,
    sessionAuthenticated,
    sessionPersisted,
    isAuthenticated,
    usesBrowserCredentials,
    applySessionStatus,
    setCredentials,
    clearCredentials,
    getAuthHeaders,
    logout,
  };
}
