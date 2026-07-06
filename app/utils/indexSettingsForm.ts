import type {
  FilterableAttribute,
  IndexSettings,
  LocalizedAttributesRule
} from '~/types/search'

export interface SynonymRow {
  word: string
  synonyms: string[]
}

export interface FacetSortRow {
  facet: string
  sort: 'alpha' | 'count'
}

export interface FilterablePatternRow {
  attributePatterns: string[]
  facetSearch: boolean
  filterEquality: boolean
  filterComparison: boolean
}

export interface LocalizedAttributesRow {
  attributePatterns: string[]
  locales: string[]
}

export interface SettingsFormState {
  displayedAttributes: string[]
  searchableAttributes: string[]
  filterableAttributes: string[]
  filterablePatterns: FilterablePatternRow[]
  sortableAttributes: string[]
  rankingRules: string[]
  stopWords: string[]
  nonSeparatorTokens: string[]
  separatorTokens: string[]
  dictionary: string[]
  synonyms: SynonymRow[]
  distinctAttribute: string
  proximityPrecision: 'byWord' | 'byAttribute'
  facetSearch: boolean
  prefixSearch: 'indexingTime' | 'disabled'
  searchCutoffMs: number | null
  typoEnabled: boolean
  typoOneTypo: number
  typoTwoTypos: number
  typoDisableOnWords: string[]
  typoDisableOnAttributes: string[]
  typoDisableOnNumbers: boolean
  maxValuesPerFacet: number
  facetSortRows: FacetSortRow[]
  maxTotalHits: number
  localizedAttributes: LocalizedAttributesRow[]
  embeddersJson: string
  chatJson: string
}

export const DEFAULT_RANKING_RULES = [
  'words',
  'typo',
  'proximity',
  'attributeRank',
  'sort',
  'wordPosition',
  'exactness'
]

export const PROXIMITY_PRECISION_OPTIONS = [
  { label: 'By word', value: 'byWord' },
  { label: 'By attribute', value: 'byAttribute' }
] as const

export const PREFIX_SEARCH_OPTIONS = [
  { label: 'Indexing time', value: 'indexingTime' },
  { label: 'Disabled', value: 'disabled' }
] as const

export const FACET_SORT_OPTIONS = [
  { label: 'Alphanumeric', value: 'alpha' },
  { label: 'Count', value: 'count' }
] as const

function parseFilterablePattern(attribute: Exclude<FilterableAttribute, string>): FilterablePatternRow {
  return {
    attributePatterns: attribute.attributePatterns,
    facetSearch: attribute.features?.facetSearch ?? false,
    filterEquality: attribute.features?.filter?.equality ?? true,
    filterComparison: attribute.features?.filter?.comparison ?? false
  }
}

function toFilterablePattern(row: FilterablePatternRow): FilterableAttribute {
  return {
    attributePatterns: row.attributePatterns,
    features: {
      facetSearch: row.facetSearch,
      filter: {
        equality: row.filterEquality,
        comparison: row.filterComparison
      }
    }
  }
}

function parseFacetSortRows(
  sortFacetValuesBy: Record<string, 'alpha' | 'count'> | null | undefined
): FacetSortRow[] {
  if (!sortFacetValuesBy) {
    return [{ facet: '*', sort: 'alpha' }]
  }

  return Object.entries(sortFacetValuesBy).map(([facet, sort]) => ({ facet, sort }))
}

function toFacetSortMap(rows: FacetSortRow[]): Record<string, 'alpha' | 'count'> {
  return Object.fromEntries(rows.map(row => [row.facet, row.sort]))
}

function parseSynonyms(synonyms: Record<string, string[]> | null | undefined): SynonymRow[] {
  if (!synonyms) {
    return []
  }

  return Object.entries(synonyms).map(([word, values]) => ({
    word,
    synonyms: values
  }))
}

function toSynonyms(rows: SynonymRow[]): Record<string, string[]> {
  return Object.fromEntries(
    rows
      .filter(row => row.word.trim())
      .map(row => [row.word.trim(), row.synonyms])
  )
}

function parseLocalizedAttributes(
  rules: LocalizedAttributesRule[] | null | undefined
): LocalizedAttributesRow[] {
  return (rules ?? []).map(rule => ({
    attributePatterns: rule.attributePatterns,
    locales: rule.locales
  }))
}

function toLocalizedAttributes(rows: LocalizedAttributesRow[]): LocalizedAttributesRule[] {
  return rows
    .filter(row => row.attributePatterns.length && row.locales.length)
    .map(row => ({
      attributePatterns: row.attributePatterns,
      locales: row.locales
    }))
}

function parseJsonObject(value: Record<string, unknown> | null | undefined): string {
  return JSON.stringify(value ?? {}, null, 2)
}

function parseJsonField<T extends Record<string, unknown>>(json: string): T | undefined {
  const value = JSON.parse(json) as T
  return Object.keys(value).length > 0 ? value : undefined
}

export function settingsToFormState(settings: IndexSettings): SettingsFormState {
  const filterable = settings.filterableAttributes ?? []
  const typo = settings.typoTolerance

  return {
    displayedAttributes: settings.displayedAttributes ?? ['*'],
    searchableAttributes: settings.searchableAttributes ?? ['*'],
    filterableAttributes: filterable.filter((attribute): attribute is string => typeof attribute === 'string'),
    filterablePatterns: filterable
      .filter((attribute): attribute is Exclude<FilterableAttribute, string> => typeof attribute !== 'string')
      .map(parseFilterablePattern),
    sortableAttributes: settings.sortableAttributes ?? [],
    rankingRules: settings.rankingRules ?? [...DEFAULT_RANKING_RULES],
    stopWords: settings.stopWords ?? [],
    nonSeparatorTokens: settings.nonSeparatorTokens ?? [],
    separatorTokens: settings.separatorTokens ?? [],
    dictionary: settings.dictionary ?? [],
    synonyms: parseSynonyms(settings.synonyms),
    distinctAttribute: settings.distinctAttribute ?? '',
    proximityPrecision: settings.proximityPrecision ?? 'byWord',
    facetSearch: settings.facetSearch ?? true,
    prefixSearch: settings.prefixSearch ?? 'indexingTime',
    searchCutoffMs: settings.searchCutoffMs ?? null,
    typoEnabled: typo?.enabled ?? true,
    typoOneTypo: typo?.minWordSizeForTypos?.oneTypo ?? 5,
    typoTwoTypos: typo?.minWordSizeForTypos?.twoTypos ?? 9,
    typoDisableOnWords: typo?.disableOnWords ?? [],
    typoDisableOnAttributes: typo?.disableOnAttributes ?? [],
    typoDisableOnNumbers: typo?.disableOnNumbers ?? false,
    maxValuesPerFacet: settings.faceting?.maxValuesPerFacet ?? 100,
    facetSortRows: parseFacetSortRows(settings.faceting?.sortFacetValuesBy),
    maxTotalHits: settings.pagination?.maxTotalHits ?? 1000,
    localizedAttributes: parseLocalizedAttributes(settings.localizedAttributes),
    embeddersJson: parseJsonObject(settings.embedders),
    chatJson: parseJsonObject(settings.chat)
  }
}

export function formStateToSettings(state: SettingsFormState): IndexSettings {
  const filterableAttributes: FilterableAttribute[] = [
    ...state.filterableAttributes,
    ...state.filterablePatterns
      .filter(row => row.attributePatterns.length)
      .map(toFilterablePattern)
  ]

  const synonyms = toSynonyms(state.synonyms)
  const embedders = parseJsonField<Record<string, Record<string, unknown>>>(state.embeddersJson)
  const chat = parseJsonField<Record<string, unknown>>(state.chatJson)

  return {
    displayedAttributes: state.displayedAttributes,
    searchableAttributes: state.searchableAttributes,
    filterableAttributes,
    sortableAttributes: state.sortableAttributes,
    rankingRules: state.rankingRules,
    stopWords: state.stopWords,
    nonSeparatorTokens: state.nonSeparatorTokens,
    separatorTokens: state.separatorTokens,
    dictionary: state.dictionary,
    synonyms: Object.keys(synonyms).length ? synonyms : {},
    distinctAttribute: state.distinctAttribute.trim() || null,
    proximityPrecision: state.proximityPrecision,
    facetSearch: state.facetSearch,
    prefixSearch: state.prefixSearch,
    searchCutoffMs: state.searchCutoffMs,
    typoTolerance: {
      enabled: state.typoEnabled,
      minWordSizeForTypos: {
        oneTypo: state.typoOneTypo,
        twoTypos: state.typoTwoTypos
      },
      disableOnWords: state.typoDisableOnWords,
      disableOnAttributes: state.typoDisableOnAttributes,
      disableOnNumbers: state.typoDisableOnNumbers
    },
    faceting: {
      maxValuesPerFacet: state.maxValuesPerFacet,
      sortFacetValuesBy: toFacetSortMap(state.facetSortRows)
    },
    pagination: {
      maxTotalHits: state.maxTotalHits
    },
    localizedAttributes: toLocalizedAttributes(state.localizedAttributes),
    ...(embedders ? { embedders } : {}),
    ...(chat ? { chat } : {})
  }
}

export function settingsSnapshot(settings: IndexSettings): string {
  return JSON.stringify(formStateToSettings(settingsToFormState(settings)))
}

export function formStateSnapshot(state: SettingsFormState): string {
  return JSON.stringify(formStateToSettings(state))
}

export function createEmptyFormState(): SettingsFormState {
  return settingsToFormState({})
}
