export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return;
  }

  const config = useAuthConfig();

  if (!config.loaded.value) {
    await config.loadConfigStatus();
  }

  const session = useAuthSession();

  if (to.path === "/connect") {
    if (config.envConfigured.value || session.isAuthenticated.value) {
      return navigateTo("/");
    }
    return;
  }

  if (config.envConfigured.value) {
    return;
  }

  if (!session.isAuthenticated.value) {
    return navigateTo("/connect");
  }
});
