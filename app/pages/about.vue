<script setup lang="ts">
definePageMeta({ layout: false });

const dataset = useDataset();

useSeoMeta({
  title: `À propos — Carte des ${dataset.labelPluralTitle}`,
  description: `Sources de données, méthode et crédits du projet Carte des ${dataset.labelPluralTitle}.`,
});
</script>

<template>
  <div class="min-h-screen bg-default">
    <!-- Header -->
    <header class="sticky top-0 z-10 border-b border-default bg-(--ui-bg)/80 backdrop-blur-sm">
      <div class="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
        <UButton
          to="/"
          icon="i-lucide-arrow-left"
          variant="ghost"
          color="neutral"
          size="sm"
        />
        <h1 class="text-lg font-semibold text-highlighted">
          À propos
        </h1>
      </div>
    </header>

    <!-- Content -->
    <main class="mx-auto max-w-3xl space-y-10 px-6 py-10">
      <!-- Intro -->
      <section>
        <h2 class="text-2xl font-bold text-highlighted">
          Carte des {{ dataset.labelPluralTitle }}
        </h2>
        <p class="mt-3 text-muted leading-relaxed">
          {{ dataset.aboutIntro }}
          {{ dataset.aboutDescription }}
        </p>
      </section>

      <!-- Datasets -->
      <section>
        <h3 class="text-lg font-semibold text-highlighted">
          Sources de données
        </h3>
        <p class="mt-2 text-sm text-muted">
          Toutes les données proviennent de
          <UButton
            to="https://data.education.gouv.fr"
            target="_blank"
            variant="link"
            class="px-0"
            label="data.education.gouv.fr"
          />,
          la plateforme open data du ministère de l'Éducation nationale
          (Licence Ouverte v2.0).
        </p>

        <div class="mt-4 grid gap-3 md:grid-cols-3">
          <DatasetCard
            v-for="ds in dataset.dataSources"
            :key="ds.link"
            :name="ds.name"
            :short-name="ds.shortName"
            :link="ds.link"
            :description="ds.description"
            :year="ds.year"
          />
        </div>
      </section>

      <div class="mt-3 space-y-3 text-sm text-muted leading-relaxed">
        <p
          v-for="(paragraph, i) in dataset.aboutExplanation"
          :key="i"
        >
          {{ paragraph }}
        </p>
        <p>
          Les couleurs sur la carte suivent un gradient divergent :
          <span class="inline-block h-3 w-3 rounded-full bg-[#dc3c32]" /> IPS faible (≤ 80),
          <span class="inline-block h-3 w-3 rounded-full bg-[#e8d832]" /> moyen (~100),
          <span class="inline-block h-3 w-3 rounded-full bg-[#3278c8]" /> élevé (≥ 135).
        </p>
      </div>

      <!-- Footer -->
      <footer class="border-t border-default pt-6 pb-10 text-center text-xs text-dimmed">
        Projet réalisé avec 💙 par <NuxtLink
          to="https://remisaurel.dev"
          target="_blank"
          class="text-highlighted underline"
        >
          Rémi Saurel
        </NuxtLink>
        ·
        Code source disponible sur <a
          :href="dataset.githubUrl"
          target="_blank"
          class="text-highlighted underline"
        >GitHub</a>
      </footer>
    </main>
  </div>
</template>
