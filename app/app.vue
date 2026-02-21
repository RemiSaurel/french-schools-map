<script setup lang="ts">
const config = useRuntimeConfig();
const dataset = useDataset();

useHead({
  meta: [
    { name: "viewport", content: "width=device-width, initial-scale=1" },
  ],
  link: [
    { rel: "icon", type: "image/x-icon", href: `${config.app.baseURL}favicon.ico` },
  ],
  htmlAttrs: {
    lang: "fr",
  },
});

useSeoMeta({
  title: dataset.seoTitle,
  description: dataset.seoDescription,
  ogTitle: dataset.seoTitle,
  ogDescription: dataset.seoDescription,
  twitterCard: "summary_large_image",
});
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
