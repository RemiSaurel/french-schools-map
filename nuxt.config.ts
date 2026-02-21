// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      script: [
        {
          "src": "https://cloud.umami.is/script.js",
          "defer": true,
          "data-site-id": "9353da54-9c48-4145-b325-843caf88bcd8",
        },
      ],
    },
  },

  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/fonts",
    "@vueuse/nuxt",
    "motion-v/nuxt",
    "@nuxt/image",
  ],

  devtools: {
    enabled: true,
  },

  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    public: {
      dataset: "colleges", // overridden by NUXT_PUBLIC_DATASET env var
    },
  },

  colorMode: {
    preference: "light",
    fallback: "light",
  },

  routeRules: {
    "/api/colleges": { swr: 86400 },
    "/api/lycees": { swr: 86400 },
  },

  compatibilityDate: "2025-01-15",

  nitro: {
    routeRules: {
      "/api/colleges": { cache: { maxAge: 86400 } },
      "/api/lycees": { cache: { maxAge: 86400 } },
    },
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },

  fonts: {
    families: [
      { name: "Instrument Sans", provider: "google" },
    ],
  },
});
