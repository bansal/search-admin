export default defineNuxtPlugin({
  name: "auth-config",
  enforce: "pre",
  async setup() {
    if (!import.meta.client) {
      return;
    }

    await useAuthConfig().loadConfigStatus();
  },
});
