export type SearchTaskStatus =
  | 'enqueued'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'

export type SearchTaskType =
  | 'documentAdditionOrUpdate'
  | 'documentEdition'
  | 'documentDeletion'
  | 'settingsUpdate'
  | 'indexCreation'
  | 'indexDeletion'
  | 'indexUpdate'
  | 'indexSwap'
  | 'taskCancelation'
  | 'taskDeletion'
  | 'dumpCreation'
  | 'snapshotCreation'
  | 'export'
  | 'upgradeDatabase'
  | 'indexCompaction'
  | 'networkTopologyChange'

export interface SearchEnqueuedTask {
  taskUid: number
  indexUid: string | null
  status: SearchTaskStatus
  type: SearchTaskType | string
  enqueuedAt: string
}

export interface SearchTaskError {
  message: string
  code: string
  type: string
  link: string
}

export interface SearchTask {
  uid: number
  batchUid: number | null
  indexUid: string | null
  status: SearchTaskStatus
  type: SearchTaskType | string
  canceledBy: number | null
  details: Record<string, unknown> | null
  error: SearchTaskError | null
  duration: string | null
  enqueuedAt: string
  startedAt: string | null
  finishedAt: string | null
  customMetadata?: string | null
}

export interface SearchTasksResponse {
  results: SearchTask[]
  total: number
  limit: number
  from: number | null
  next: number | null
}

export interface SearchTaskFilters {
  limit?: number
  from?: number
  reverse?: boolean
  batchUids?: number[]
  uids?: number[]
  canceledBy?: number[]
  types?: (SearchTaskType | string)[]
  statuses?: SearchTaskStatus[]
  indexUids?: string[]
  afterEnqueuedAt?: string
  beforeEnqueuedAt?: string
  afterStartedAt?: string
  beforeStartedAt?: string
  afterFinishedAt?: string
  beforeFinishedAt?: string
}

export const TASK_STATUSES: { label: string, value: SearchTaskStatus }[] = [
  { label: 'Enqueued', value: 'enqueued' },
  { label: 'Processing', value: 'processing' },
  { label: 'Succeeded', value: 'succeeded' },
  { label: 'Failed', value: 'failed' },
  { label: 'Canceled', value: 'canceled' }
]

export const TASK_TYPES: { label: string, value: SearchTaskType }[] = [
  { label: 'Document addition/update', value: 'documentAdditionOrUpdate' },
  { label: 'Document edition', value: 'documentEdition' },
  { label: 'Document deletion', value: 'documentDeletion' },
  { label: 'Settings update', value: 'settingsUpdate' },
  { label: 'Index creation', value: 'indexCreation' },
  { label: 'Index deletion', value: 'indexDeletion' },
  { label: 'Index update', value: 'indexUpdate' },
  { label: 'Index swap', value: 'indexSwap' },
  { label: 'Task cancelation', value: 'taskCancelation' },
  { label: 'Task deletion', value: 'taskDeletion' },
  { label: 'Dump creation', value: 'dumpCreation' },
  { label: 'Snapshot creation', value: 'snapshotCreation' },
  { label: 'Export', value: 'export' },
  { label: 'Upgrade database', value: 'upgradeDatabase' },
  { label: 'Index compaction', value: 'indexCompaction' },
  { label: 'Network topology change', value: 'networkTopologyChange' }
]

export interface SearchIndex {
  uid: string
  createdAt: string
  updatedAt: string
  primaryKey: string | null
}

export interface SearchPaginated<T> {
  results: T[]
  offset: number
  limit: number
  total: number
}

export interface SearchHealth {
  status: 'available'
}

export interface SearchVersion {
  commitSha: string
  commitDate: string
  pkgVersion: string
}

export interface IndexStats {
  numberOfDocuments: number
  isIndexing: boolean
  fieldDistribution: Record<string, number>
}

export interface SearchStats {
  databaseSize: number
  usedDatabaseSize: number
  lastUpdate: string | null
  indexes: Record<string, IndexStats>
}

export type SearchDocument = Record<string, unknown>

export interface SearchHit extends SearchDocument {
  _formatted?: Record<string, string>
}

export interface SearchResponse {
  hits: SearchHit[]
  query: string
  processingTimeMs: number
  limit: number
  offset: number
  estimatedTotalHits: number
  totalHits?: number
}

export type FilterableAttribute =
  | string
  | {
      attributePatterns: string[]
      features?: {
        facetSearch?: boolean
        filter?: {
          equality?: boolean
          comparison?: boolean
        }
      }
    }

export interface TypoSettings {
  enabled?: boolean | null
  minWordSizeForTypos?: {
    oneTypo?: number | null
    twoTypos?: number | null
  } | null
  disableOnWords?: string[] | null
  disableOnAttributes?: string[] | null
  disableOnNumbers?: boolean | null
}

export interface FacetingSettings {
  maxValuesPerFacet?: number | null
  sortFacetValuesBy?: Record<string, 'alpha' | 'count'> | null
}

export interface PaginationSettings {
  maxTotalHits?: number | null
}

export interface LocalizedAttributesRule {
  attributePatterns: string[]
  locales: string[]
}

export interface ForeignKey {
  foreignIndexUid: string
  fieldName: string
}

export interface IndexSettings {
  displayedAttributes?: string[] | null
  searchableAttributes?: string[] | null
  filterableAttributes?: FilterableAttribute[] | null
  sortableAttributes?: string[] | null
  rankingRules?: string[] | null
  stopWords?: string[] | null
  nonSeparatorTokens?: string[] | null
  separatorTokens?: string[] | null
  dictionary?: string[] | null
  synonyms?: Record<string, string[]> | null
  distinctAttribute?: string | null
  proximityPrecision?: 'byWord' | 'byAttribute' | null
  typoTolerance?: TypoSettings | null
  faceting?: FacetingSettings | null
  pagination?: PaginationSettings | null
  embedders?: Record<string, Record<string, unknown>> | null
  searchCutoffMs?: number | null
  localizedAttributes?: LocalizedAttributesRule[] | null
  facetSearch?: boolean | null
  prefixSearch?: 'indexingTime' | 'disabled' | null
  chat?: Record<string, unknown> | null
  foreignKeys?: ForeignKey[] | null
}

export type KeyAction = string

export interface ApiKey {
  uid: string
  key?: string
  name: string | null
  description: string | null
  actions: KeyAction[]
  indexes: string[]
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface KeyCreatePayload {
  name?: string
  description?: string
  actions: KeyAction[]
  indexes: string[]
  expiresAt?: string | null
}

export interface KeyUpdatePayload {
  name?: string
  description?: string
}

export const KEY_ACTIONS = [
  { label: 'All actions', value: '*' },
  { label: 'Search', value: 'search' },
  { label: 'Documents — add', value: 'documents.add' },
  { label: 'Documents — get', value: 'documents.get' },
  { label: 'Documents — delete', value: 'documents.delete' },
  { label: 'Indexes — create', value: 'indexes.create' },
  { label: 'Indexes — get', value: 'indexes.get' },
  { label: 'Indexes — update', value: 'indexes.update' },
  { label: 'Indexes — delete', value: 'indexes.delete' },
  { label: 'Indexes — swap', value: 'indexes.swap' },
  { label: 'Settings — get', value: 'settings.get' },
  { label: 'Settings — update', value: 'settings.update' },
  { label: 'Tasks — get', value: 'tasks.get' },
  { label: 'Tasks — cancel', value: 'tasks.cancel' },
  { label: 'Tasks — delete', value: 'tasks.delete' },
  { label: 'Stats — get', value: 'stats.get' },
  { label: 'Version', value: 'version' },
  { label: 'Keys — get', value: 'keys.get' },
  { label: 'Keys — create', value: 'keys.create' },
  { label: 'Keys — update', value: 'keys.update' },
  { label: 'Keys — delete', value: 'keys.delete' },
  { label: 'Dumps — create', value: 'dumps.create' },
  { label: 'Snapshots — create', value: 'snapshots.create' }
] 
