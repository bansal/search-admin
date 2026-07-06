// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: "2025-07-15",
  devtools: {
    enabled: false,
  },
  runtimeConfig: {
    sessionSecret: process.env.NUXT_SESSION_SECRET || "",
    meili: {
      url: process.env.NUXT_SEARCH_ENDPOINT || "",
      masterKey: process.env.NUXT_SEARCH_MASTER_KEY || "",
    },
  },
  modules: ["@nuxt/ui", "@vueuse/nuxt"],

  css: ["~/assets/css/main.css"],

  routeRules: {
    "/api/**": {
      cors: true,
    },
  },
});
