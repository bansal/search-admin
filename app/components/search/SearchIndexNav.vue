<script setup lang="ts">
const route = useRoute();
const uid = computed(() => route.params.uid as string);

const items = computed(() => {
  const base = `/indexes/${uid.value}`;

  return [
    {
      label: uid.value,
      icon: "i-lucide-file-text",
      to: base,
      active: route.path === base,
    },
    {
      label: "Settings",
      icon: "i-lucide-settings",
      to: `${base}/settings`,
      active: route.path === `${base}/settings`,
    },
  ];
});
</script>

<template>
  <div class="flex items-center gap-2">
    <UButton
      v-for="item in items"
      :key="item.to"
      :label="item.label"
      :icon="item.icon"
      :to="item.to"
      :variant="item.active ? 'subtle' : 'ghost'"
      color="neutral"
    />
  </div>
</template>
