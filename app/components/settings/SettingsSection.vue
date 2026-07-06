<script setup lang="ts">
const props = defineProps<{
  label?: string;
  description?: string;
}>();
</script>

<template>
  <section class="scroll-mt-6 space-y-6">
    <div>
      <h2 v-if="label" class="text-lg font-semibold text-default">
        {{ label }}
      </h2>
      <p v-if="description" class="mt-1 text-sm text-muted">
        {{ description }}
      </p>
    </div>
    <slot />
  </section>
</template>
