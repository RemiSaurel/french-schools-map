<script setup lang="ts">
defineProps<{
  name: string;
  shortName: string;
  link: string;
  description: string;
  year: string;
}>();
</script>

<template>
  <div
    class="border border-zinc-200/80 rounded-lg p-4 bg-white flex justify-between flex-col h-full"
  >
    <div class="flex flex-col flex-1  gap-2">
      <p class="text-sm font-semibold text-highlighted leading-tight">
        {{ name }}
      </p>
      <UBadge
        variant="subtle"
        size="sm"
        class="self-start"
        color="neutral"
        icon="i-lucide-calendar"
      >
        {{ year }}
      </UBadge>
      <p class="text-xs text-muted leading-relaxed">
        {{ description }}
      </p>
    </div>
    <UButton
      :to="link"
      target="_blank"
      icon="i-lucide-external-link"
      variant="link"
      size="xs"
      :label="shortName"
      class="text-xs self-start mt-2 -ml-2"
    />
  </div>
</template>
