<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import type { SettingsFormState } from "~/utils/indexSettingsForm";
import {
  DEFAULT_RANKING_RULES,
  FACET_SORT_OPTIONS,
  PREFIX_SEARCH_OPTIONS,
  PROXIMITY_PRECISION_OPTIONS,
} from "~/utils/indexSettingsForm";

const form = defineModel<SettingsFormState>({ required: true });

const sections = [
  {
    id: "attributes",
    label: "Attributes",
    description:
      "Control which fields are searched, displayed, filtered, and sorted.",
    icon: "i-lucide-list",
  },
  {
    id: "ranking",
    label: "Ranking & search",
    description: "Tune relevance, tokenization, and search behavior.",
    icon: "i-lucide-trophy",
  },
  {
    id: "typo",
    label: "Typo tolerance",
    description: "Configure how the engine handles spelling mistakes.",
    icon: "i-lucide-spell-check",
  },
  {
    id: "faceting",
    label: "Faceting & pagination",
    description: "Manage facets, facet sorting, and result limits.",
    icon: "i-lucide-layout-grid",
  },
  {
    id: "synonyms",
    label: "Synonyms",
    description: "Map words to equivalent terms used during search.",
    icon: "i-lucide-shuffle",
  },
  {
    id: "localization",
    label: "Localization",
    description:
      "Associate locales with attribute patterns for language-specific tokenization.",
    icon: "i-lucide-languages",
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "Embedders and chat settings for semantic and hybrid search.",
    icon: "i-lucide-code",
  },
] as const;

type SettingsSectionId = (typeof sections)[number]["id"];

const activeSection = ref<SettingsSectionId>("attributes");

const navItems = computed<NavigationMenuItem[]>(() =>
  sections.map((section) => ({
    label: section.label,
    icon: section.icon,
    active: activeSection.value === section.id,
    onSelect: () => scrollToSection(section.id),
  })),
);

function scrollToSection(id: SettingsSectionId) {
  activeSection.value = id;
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function addSynonym() {
  form.value.synonyms.push({ word: "", synonyms: [] });
}

function removeSynonym(index: number) {
  form.value.synonyms.splice(index, 1);
}

function addFacetSortRow() {
  form.value.facetSortRows.push({ facet: "", sort: "alpha" });
}

function removeFacetSortRow(index: number) {
  form.value.facetSortRows.splice(index, 1);
}

function addFilterablePattern() {
  form.value.filterablePatterns.push({
    attributePatterns: [],
    facetSearch: false,
    filterEquality: true,
    filterComparison: false,
  });
}

function removeFilterablePattern(index: number) {
  form.value.filterablePatterns.splice(index, 1);
}

function addLocalizedRule() {
  form.value.localizedAttributes.push({ attributePatterns: [], locales: [] });
}

function removeLocalizedRule(index: number) {
  form.value.localizedAttributes.splice(index, 1);
}

function updateSearchCutoff(value: string | number | null | undefined) {
  form.value.searchCutoffMs =
    value === "" || value == null ? null : Number(value);
}

function resetRankingRules() {
  form.value.rankingRules = [...DEFAULT_RANKING_RULES];
}

function getScrollParent(element: HTMLElement | null): HTMLElement | null {
  let parent = element?.parentElement ?? null;

  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll") {
      return parent;
    }
    parent = parent.parentElement;
  }

  return null;
}

onMounted(() => {
  const firstSection = document.getElementById(sections[0].id);
  const scrollRoot = getScrollParent(firstSection);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id as SettingsSectionId;
        }
      }
    },
    {
      root: scrollRoot,
      rootMargin: "-15% 0px -65% 0px",
      threshold: 0,
    },
  );

  for (const section of sections) {
    const element = document.getElementById(section.id);
    if (element) {
      observer.observe(element);
    }
  }

  onUnmounted(() => observer.disconnect());
});
</script>

<template>
  <UPage
    :ui="{
      center: 'max-w-3xl',
    }"
  >
    <template #left>
      <UPageAside>
        <UNavigationMenu
          :items="navItems"
          orientation="vertical"
          color="neutral"
          variant="link"
          class="w-full"
          :ui="{
            link: 'px-0 py-2.5 text-sm',
            linkLeadingIcon: 'size-4',
          }"
        />
      </UPageAside>
    </template>

    <UPageHeader
      title="Index settings"
      description="Configure search behavior, relevance, and advanced features for this index."
    />

    <UPageBody>
      <UTheme
        :props="{
          card: {
            variant: 'subtle',
          },
        }"
      >
        <div class="mb-6 lg:hidden">
          <UFormField label="Section">
            <USelect
              :model-value="activeSection"
              :items="[...sections]"
              value-key="id"
              label-key="label"
              class="w-full"
              @update:model-value="scrollToSection($event as SettingsSectionId)"
            />
          </UFormField>
        </div>

        <div class="space-y-16">
          <SettingsSection
            id="attributes"
            :label="sections[0].label"
            :description="sections[0].description"
          >
            <UCard
              title="Search & display"
              description="Fields returned in search results and searched for query words."
            >
              <div class="space-y-4">
                <UFormField
                  label="Displayed attributes"
                  description="Use * for all fields."
                >
                  <UInputTags
                    v-model="form.displayedAttributes"
                    placeholder="Add attribute"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Searchable attributes"
                  description="Order reflects importance during search."
                >
                  <UInputTags
                    v-model="form.searchableAttributes"
                    placeholder="Add attribute"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </UCard>

            <UCard
              title="Filtering & sorting"
              description="Attributes usable as filters, facets, and sort keys."
              variant="subtle"
            >
              <div class="space-y-4">
                <UFormField label="Filterable attributes">
                  <UInputTags
                    v-model="form.filterableAttributes"
                    placeholder="Add attribute"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Sortable attributes">
                  <UInputTags
                    v-model="form.sortableAttributes"
                    placeholder="Add attribute"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Distinct attribute"
                  description="Field whose value must be unique in returned documents."
                  hint="Optional"
                >
                  <UInput
                    v-model="form.distinctAttribute"
                    placeholder="e.g. sku"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </UCard>

            <UCard
              title="Pattern-based filterable rules"
              description="Advanced rules with attribute patterns and feature flags."
              variant="subtle"
            >
              <div class="space-y-3">
                <UCard
                  v-for="(pattern, index) in form.filterablePatterns"
                  :key="index"
                  variant="outline"
                >
                  <template #header>
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-sm font-medium text-default">
                        Rule {{ index + 1 }}
                      </span>
                      <UButton
                        icon="i-lucide-trash-2"
                        color="error"
                        variant="ghost"
                        size="xs"
                        @click="removeFilterablePattern(index)"
                      />
                    </div>
                  </template>

                  <div class="space-y-3">
                    <UFormField label="Attribute patterns">
                      <UInputTags
                        v-model="pattern.attributePatterns"
                        placeholder="e.g. price_*"
                        class="w-full"
                      />
                    </UFormField>

                    <div class="flex flex-wrap gap-4">
                      <UCheckbox
                        v-model="pattern.filterEquality"
                        label="Equality filters"
                      />
                      <UCheckbox
                        v-model="pattern.filterComparison"
                        label="Comparison filters"
                      />
                      <UCheckbox
                        v-model="pattern.facetSearch"
                        label="Facet search"
                      />
                    </div>
                  </div>
                </UCard>

                <UButton
                  icon="i-lucide-plus"
                  label="Add pattern rule"
                  color="secondary"
                  variant="outline"
                  @click="addFilterablePattern"
                />
              </div>
            </UCard>
          </SettingsSection>

          <section id="ranking" class="scroll-mt-6 space-y-6">
            <div>
              <h2 class="text-lg font-semibold text-default">
                {{ sections[1].label }}
              </h2>
              <p class="mt-1 text-sm text-muted">
                {{ sections[1].description }}
              </p>
            </div>

            <UCard
              title="Ranking rules"
              description="Rules applied in order. Built-in rules or custom sort rules (attribute:asc)."
              variant="subtle"
            >
              <div class="space-y-2">
                <UInputTags
                  v-model="form.rankingRules"
                  placeholder="Add rule"
                  class="w-full"
                />
                <UButton
                  label="Reset to defaults"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click="resetRankingRules"
                />
              </div>
            </UCard>

            <UCard
              title="Tokens & dictionary"
              description="Words and characters excluded or treated specially during tokenization."
              variant="subtle"
            >
              <div class="space-y-4">
                <UFormField label="Stop words">
                  <UInputTags
                    v-model="form.stopWords"
                    placeholder="Add word"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Dictionary">
                  <UInputTags
                    v-model="form.dictionary"
                    placeholder="Add term"
                    class="w-full"
                  />
                </UFormField>

                <div class="grid gap-4 sm:grid-cols-2">
                  <UFormField label="Non-separator tokens">
                    <UInputTags
                      v-model="form.nonSeparatorTokens"
                      placeholder="e.g. @"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Separator tokens">
                    <UInputTags
                      v-model="form.separatorTokens"
                      placeholder="e.g. |"
                      class="w-full"
                    />
                  </UFormField>
                </div>
              </div>
            </UCard>

            <UCard
              title="Search behavior"
              description="Precision, prefix matching, and time limits for queries."
              variant="subtle"
            >
              <div class="space-y-4">
                <div class="grid gap-4 sm:grid-cols-2">
                  <UFormField label="Proximity precision">
                    <USelect
                      v-model="form.proximityPrecision"
                      :items="[...PROXIMITY_PRECISION_OPTIONS]"
                      value-key="value"
                      label-key="label"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField label="Prefix search">
                    <USelect
                      v-model="form.prefixSearch"
                      :items="[...PREFIX_SEARCH_OPTIONS]"
                      value-key="value"
                      label-key="label"
                      class="w-full"
                    />
                  </UFormField>
                </div>

                <UFormField
                  label="Search cutoff (ms)"
                  description="Maximum search duration. Leave empty for the default (1500 ms)."
                >
                  <UInput
                    :model-value="
                      form.searchCutoffMs == null
                        ? ''
                        : String(form.searchCutoffMs)
                    "
                    type="number"
                    min="0"
                    placeholder="1500"
                    class="w-full font-mono"
                    @update:model-value="updateSearchCutoff"
                  />
                </UFormField>
              </div>
            </UCard>
          </section>

          <SettingsSection
            id="typo"
            :label="sections[2].label"
            :description="sections[2].description"
          >
            <UCard
              title="Typo tolerance"
              description="Control when and where typos are allowed during search."
              variant="subtle"
            >
              <div class="space-y-4">
                <UFormField label="Enabled">
                  <USwitch v-model="form.typoEnabled" />
                </UFormField>

                <div class="grid gap-4 sm:grid-cols-2">
                  <UFormField label="Min length for 1 typo">
                    <UInput
                      v-model.number="form.typoOneTypo"
                      type="number"
                      min="0"
                      class="w-full font-mono"
                    />
                  </UFormField>

                  <UFormField label="Min length for 2 typos">
                    <UInput
                      v-model.number="form.typoTwoTypos"
                      type="number"
                      min="0"
                      class="w-full font-mono"
                    />
                  </UFormField>
                </div>

                <UFormField label="Disable on words">
                  <UInputTags
                    v-model="form.typoDisableOnWords"
                    placeholder="Add word"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Disable on attributes">
                  <UInputTags
                    v-model="form.typoDisableOnAttributes"
                    placeholder="Add attribute"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Disable on numbers">
                  <USwitch v-model="form.typoDisableOnNumbers" />
                </UFormField>
              </div>
            </UCard>
          </SettingsSection>

          <SettingsSection
            id="faceting"
            :label="sections[3].label"
            :description="sections[3].description"
          >
            <UCard
              title="Facet settings"
              description="Configure facet search and how facet values are sorted."
              variant="subtle"
            >
              <div class="space-y-4">
                <UFormField label="Facet search enabled">
                  <USwitch v-model="form.facetSearch" />
                </UFormField>

                <UFormField label="Max values per facet">
                  <UInput
                    v-model.number="form.maxValuesPerFacet"
                    type="number"
                    min="0"
                    class="w-full font-mono"
                  />
                </UFormField>

                <UFormField label="Sort facet values by">
                  <div class="space-y-3">
                    <div
                      v-for="(row, index) in form.facetSortRows"
                      :key="index"
                      class="flex items-end gap-2"
                    >
                      <UFormField label="Facet" class="flex-1">
                        <UInput
                          v-model="row.facet"
                          placeholder="* or genre"
                          class="w-full"
                        />
                      </UFormField>

                      <UFormField label="Sort" class="flex-1">
                        <USelect
                          v-model="row.sort"
                          :items="[...FACET_SORT_OPTIONS]"
                          value-key="value"
                          label-key="label"
                          class="w-full"
                        />
                      </UFormField>

                      <UButton
                        icon="i-lucide-trash-2"
                        color="error"
                        variant="ghost"
                        :disabled="form.facetSortRows.length === 1"
                        @click="removeFacetSortRow(index)"
                      />
                    </div>

                    <UButton
                      icon="i-lucide-plus"
                      label="Add facet sort rule"
                      variant="outline"
                      @click="addFacetSortRow"
                    />
                  </div>
                </UFormField>
              </div>
            </UCard>

            <UCard
              title="Pagination"
              description="Maximum number of results a search can return."
              variant="subtle"
            >
              <UFormField label="Max total hits">
                <UInput
                  v-model.number="form.maxTotalHits"
                  type="number"
                  min="0"
                  class="w-full font-mono"
                />
              </UFormField>
            </UCard>
          </SettingsSection>

          <SettingsSection
            id="synonyms"
            :label="sections[4].label"
            :description="sections[4].description"
          >
            <UCard variant="subtle">
              <div class="space-y-3">
                <UCard
                  v-for="(entry, index) in form.synonyms"
                  :key="index"
                  variant="outline"
                >
                  <template #header>
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-sm font-medium text-default">
                        Synonym group {{ index + 1 }}
                      </span>
                      <UButton
                        icon="i-lucide-trash-2"
                        color="error"
                        variant="ghost"
                        size="xs"
                        @click="removeSynonym(index)"
                      />
                    </div>
                  </template>

                  <div class="space-y-3">
                    <UFormField label="Word">
                      <UInput
                        v-model="entry.word"
                        placeholder="phone"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Synonyms">
                      <UInputTags
                        v-model="entry.synonyms"
                        placeholder="Add synonym"
                        class="w-full"
                      />
                    </UFormField>
                  </div>
                </UCard>

                <UEmpty
                  v-if="!form.synonyms.length"
                  icon="i-lucide-shuffle"
                  title="No synonyms"
                  description="Add synonym groups to treat words as equivalent during search."
                >
                  <UButton label="Add synonym group" @click="addSynonym" />
                </UEmpty>

                <UButton
                  v-else
                  icon="i-lucide-plus"
                  label="Add synonym group"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  @click="addSynonym"
                />
              </div>
            </UCard>
          </SettingsSection>

          <SettingsSection
            id="localization"
            :label="sections[5].label"
            :description="sections[5].description"
          >
            <UCard variant="subtle">
              <div class="space-y-3">
                <UCard
                  v-for="(rule, index) in form.localizedAttributes"
                  :key="index"
                  variant="outline"
                >
                  <template #header>
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-sm font-medium text-default">
                        Rule {{ index + 1 }}
                      </span>
                      <UButton
                        icon="i-lucide-trash-2"
                        color="error"
                        variant="ghost"
                        size="xs"
                        @click="removeLocalizedRule(index)"
                      />
                    </div>
                  </template>

                  <div class="space-y-3">
                    <UFormField label="Attribute patterns">
                      <UInputTags
                        v-model="rule.attributePatterns"
                        placeholder="e.g. *_ja"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Locales">
                      <UInputTags
                        v-model="rule.locales"
                        placeholder="e.g. jpn"
                        class="w-full"
                      />
                    </UFormField>
                  </div>
                </UCard>

                <UEmpty
                  v-if="!form.localizedAttributes.length"
                  icon="i-lucide-languages"
                  title="No localization rules"
                  description="Associate locales with attribute patterns for language-specific tokenization."
                >
                  <UButton label="Add rule" @click="addLocalizedRule" />
                </UEmpty>

                <UButton
                  v-else
                  icon="i-lucide-plus"
                  label="Add rule"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  @click="addLocalizedRule"
                />
              </div>
            </UCard>
          </SettingsSection>

          <SettingsSection
            id="advanced"
            :label="sections[6].label"
            :description="sections[6].description"
          >
            <UCard
              title="Embedders"
              description="AI embedder configuration for semantic and hybrid search."
              variant="subtle"
            >
              <UTextarea
                v-model="form.embeddersJson"
                :rows="10"
                class="font-mono text-sm w-full"
              />
            </UCard>

            <UCard
              title="Chat settings"
              description="Conversation settings for LLM-powered search."
              variant="subtle"
            >
              <UTextarea
                v-model="form.chatJson"
                :rows="8"
                class="font-mono text-sm w-full"
              />
            </UCard>
          </SettingsSection>
        </div>
      </UTheme>
    </UPageBody>
  </UPage>
</template>
