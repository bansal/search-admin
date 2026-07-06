<script setup lang="ts">
import {
  documentEntries,
  formatScalar,
  isHttpUrl,
  isImageUrl,
  isPlainObject
} from '~/utils/documentDisplay'

const props = defineProps<{
  data: Record<string, unknown> | unknown[]
  nested?: boolean
}>()

const rows = computed(() => documentEntries(props.data))
const isEmpty = computed(() => rows.value.length === 0)

function isNestedValue(value: unknown): value is Record<string, unknown> | unknown[] {
  return isPlainObject(value) || Array.isArray(value)
}
</script>

<template>
  <div
    :class="[
      nested ? 'rounded-md border border-muted overflow-hidden' : 'rounded-lg border border-muted overflow-hidden'
    ]"
  >
    <table class="w-full text-sm">
      <tbody>
        <template v-if="isEmpty">
          <tr>
            <td colspan="2" class="px-3 py-2 text-muted italic">
              (empty)
            </td>
          </tr>
        </template>

        <template v-else>
          <tr
            v-for="row in rows"
            :key="row.key"
            class="border-b border-muted last:border-b-0 align-top"
          >
          <th
            scope="row"
            class="w-1/3 min-w-32 max-w-xs px-3 py-2 text-left font-medium text-default bg-elevated/50 break-all"
          >
            {{ row.key }}
          </th>
          <td class="px-3 py-2 text-default wrap-break-word">
            <SearchDocumentViewer
              v-if="isNestedValue(row.value)"
              :data="row.value"
              nested
            />

            <a
              v-else-if="typeof row.value === 'string' && isImageUrl(row.value)"
              :href="row.value"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex flex-col gap-2 group"
            >
              <img
                :src="row.value"
                :alt="row.value"
                loading="lazy"
                class="max-h-32 max-w-xs rounded-md border border-muted object-contain bg-elevated"
              >
              <span class="text-primary group-hover:underline break-all">
                {{ row.value }}
              </span>
            </a>

            <a
              v-else-if="typeof row.value === 'string' && isHttpUrl(row.value)"
              :href="row.value"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline break-all"
            >
              {{ row.value }}
            </a>

            <span v-else-if="row.value === null" class="text-muted italic">
              null
            </span>

            <span v-else-if="typeof row.value === 'boolean'" class="font-mono">
              {{ row.value ? 'true' : 'false' }}
            </span>

            <span v-else-if="typeof row.value === 'number'" class="font-mono">
              {{ row.value }}
            </span>

            <span v-else class="whitespace-pre-wrap wrap-break-word">
              {{ formatScalar(row.value) }}
            </span>
          </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
