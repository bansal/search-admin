<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui/components/NavigationMenu.vue";

useDashboard();

const open = ref(false);
const { usesBrowserCredentials, logout } = useAuthSession();

const links = [
  [
    {
      label: "Overview",
      icon: "i-lucide-layout-dashboard",
      to: "/",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Indexes",
      icon: "i-lucide-database",
      to: "/indexes",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Tasks",
      icon: "i-lucide-list-todo",
      to: "/tasks",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "API keys",
      icon: "i-lucide-key",
      to: "/keys",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
] satisfies NavigationMenuItem[][];
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar id="default" v-model:open="open" collapsible resizable>
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 px-1">
          <UIcon name="i-lucide-search" class="size-4 text-primary shrink-0" />
          <span v-if="!collapsed" class="font-semibold text-default truncate">
            Search Dashboard
          </span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          :ui="{
            linkLeadingIcon: 'size-4 text-elevated',
            link: 'py-2.5 overflow-hidden text-sm font-medium gap-2',
          }"
        />
      </template>

      <template v-if="usesBrowserCredentials" #footer="{ collapsed }">
        <UButton
          icon="i-lucide-log-out"
          :label="collapsed ? undefined : 'Log out'"
          color="neutral"
          variant="ghost"
          block
          @click="logout()"
        />
      </template>
    </UDashboardSidebar>
    <slot />
  </UDashboardGroup>
</template>
