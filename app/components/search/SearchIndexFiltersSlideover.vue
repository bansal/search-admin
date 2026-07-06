<script setup lang="ts">
import type { FilterableAttribute } from "~/types/search";
import {
  buildFilterExpression,
  createEmptyFilterRow,
  createFilterForm,
  FILTER_OPERATORS,
  getFilterableAttributeNames,
  hasActiveOverrideRows,
  resolveFilterExpression,
  type FilterFormValues,
  type FilterRow,
} from "~/utils/searchFilters";

const open = defineModel<boolean>("open", { default: false });
const filter = defineModel<string>("filter", { default: "" });

const props = defineProps<{
  filterableAttributes?: FilterableAttribute[] | null;
}>();

const formValues = ref<FilterFormValues>({});
const overrideRows = ref<FilterRow[]>([]);
const appliedForm = ref<FilterFormValues>({});
const appliedOverrides = ref<FilterRow[]>([]);

const filterableFields = computed(() =>
  getFilterableAttributeNames(props.filterableAttributes),
);

const attributeOptions = computed(() =>
  filterableFields.value.map((attribute) => ({
    label: attribute,
    value: attribute,
  })),
);

const overrideActive = computed(() =>
  hasActiveOverrideRows(overrideRows.value),
);

function syncFormFields() {
  formValues.value = createFilterForm(filterableFields.value);
  appliedForm.value = createFilterForm(filterableFields.value);
}

function resetOverrideRows() {
  overrideRows.value = [];
  appliedOverrides.value = [];
}

function restoreAppliedState() {
  formValues.value = {
    ...createFilterForm(filterableFields.value),
    ...appliedForm.value,
  };
  overrideRows.value = appliedOverrides.value.map((row) => ({
    ...row,
    valueTo: row.valueTo ?? "",
  }));
}

watch(filterableFields, syncFormFields, { immediate: true });

watch(open, (isOpen) => {
  if (isOpen) {
    restoreAppliedState();
  }
});

watch(
  () => filter.value,
  (value) => {
    if (!value.trim()) {
      syncFormFields();
      resetOverrideRows();
    }
  },
);

function addOverrideRow() {
  overrideRows.value.push(
    createEmptyFilterRow(filterableFields.value[0] ?? ""),
  );
}

function removeOverrideRow(index: number) {
  overrideRows.value.splice(index, 1);
}

function applyFilters() {
  filter.value = resolveFilterExpression(formValues.value, overrideRows.value);
  appliedForm.value = { ...formValues.value };
  appliedOverrides.value = overrideRows.value.map((row) => ({
    ...row,
    valueTo: row.valueTo ?? "",
  }));
  open.value = false;
}

function clearFilters() {
  syncFormFields();
  resetOverrideRows();
  filter.value = "";
  open.value = false;
}

function operatorNeedsValue(operator: FilterRow["operator"]) {
  return operator !== "EXISTS" && operator !== "NOT EXISTS";
}

function operatorNeedsRange(operator: FilterRow["operator"]) {
  return operator === "TO";
}
</script>

<template>
  <USlideover
    v-model:open="open"
    side="right"
    title="Filters"
    description="Filter documents by index filterable attributes."
    :ui="{ content: 'max-w-md w-full' }"
  >
    <template #body>
      <div class="space-y-6">
        <UForm class="space-y-4">
          <UFormField
            v-for="attribute in filterableFields"
            :key="attribute"
            :label="attribute"
            :description="
              attribute.includes('*')
                ? 'Pattern-based filterable attribute'
                : undefined
            "
          >
            <UInput
              v-model="formValues[attribute]"
              :placeholder="`Filter by ${attribute}`"
              class="w-full"
            />
          </UFormField>
        </UForm>

        <div class="space-y-4">
          <p class="text-sm text-muted">
            Add custom filter rows to override the form fields above.
          </p>

          <UAlert
            v-if="overrideActive"
            color="info"
            variant="subtle"
            icon="i-lucide-info"
            title="Override active"
            description="Custom filter rows replace form field values when applied."
          />

          <div
            v-for="(row, index) in overrideRows"
            :key="index"
            class="rounded-lg border border-default p-4 space-y-3"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-default">
                Override {{ index + 1 }}
              </span>
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="xs"
                @click="removeOverrideRow(index)"
              />
            </div>

            <UFormField label="Attribute">
              <USelectMenu
                v-model="row.attribute"
                :items="attributeOptions"
                value-key="value"
                label-key="label"
                placeholder="Select attribute"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Operator">
              <USelectMenu
                v-model="row.operator"
                :items="FILTER_OPERATORS"
                value-key="value"
                label-key="label"
                class="w-full"
              />
            </UFormField>

            <UFormField
              v-if="operatorNeedsValue(row.operator)"
              :label="operatorNeedsRange(row.operator) ? 'From' : 'Value'"
            >
              <UInput
                v-model="row.value"
                placeholder="Filter value"
                class="w-full"
              />
            </UFormField>

            <UFormField v-if="operatorNeedsRange(row.operator)" label="To">
              <UInput
                v-model="row.valueTo"
                placeholder="Upper bound"
                class="w-full"
              />
            </UFormField>
          </div>

          <UButton
            icon="i-lucide-plus"
            label="Add override row"
            color="neutral"
            variant="outline"
            size="sm"
            @click="addOverrideRow"
          />
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        label="Clear"
        color="neutral"
        variant="ghost"
        @click="clearFilters"
      />
      <UButton
        label="Cancel"
        color="neutral"
        variant="outline"
        @click="close"
      />
      <UButton
        label="Apply filters"
        icon="i-lucide-check"
        @click="applyFilters"
      />
    </template>
  </USlideover>
</template>
