const IMAGE_PATH = /\.(avif|bmp|gif|jpe?g|png|svg|webp)(\?.*)?$/i

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isImageUrl(value: string): boolean {
  if (!isHttpUrl(value)) {
    return false
  }

  try {
    return IMAGE_PATH.test(new URL(value).pathname)
  } catch {
    return false
  }
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function documentEntries(data: Record<string, unknown> | unknown[]): { key: string, value: unknown }[] {
  if (Array.isArray(data)) {
    return data.map((value, index) => ({ key: String(index), value }))
  }

  return Object.entries(data).map(([key, value]) => ({ key, value }))
}

const INTERNAL_FIELDS = /^_/

export interface PreviewField {
  key: string
  value: string
  formatted?: string
}

export function resolveDisplayedAttributeKeys(
  displayedAttributes: string[] | null | undefined,
  doc: Record<string, unknown>
): string[] {
  const configured = displayedAttributes ?? ['*']

  if (configured.includes('*')) {
    return Object.keys(doc).filter(key => !INTERNAL_FIELDS.test(key))
  }

  return configured.filter(key => !INTERNAL_FIELDS.test(key))
}

function formatPreviewValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value) ?? ''
}

export function buildPreviewFields(
  doc: Record<string, unknown>,
  formatted?: Record<string, unknown>,
  displayedAttributes?: string[] | null
): PreviewField[] {
  const keys = resolveDisplayedAttributeKeys(displayedAttributes, doc)

  return keys.map((key) => {
    const rawValue = doc[key]
    const formattedValue = formatted?.[key]
    const value = formatPreviewValue(rawValue)

    return {
      key,
      value: value.length > 120 ? `${value.slice(0, 120)}…` : value,
      formatted: formattedValue != null
        ? formatPreviewValue(formattedValue)
        : undefined
    }
  })
}

export function buildDocumentPreview(
  doc: Record<string, unknown>,
  formatted?: Record<string, unknown>,
  displayedAttributes?: string[] | null
): string {
  const fields = buildPreviewFields(doc, formatted, displayedAttributes)

  if (!fields.length) {
    return '{}'
  }

  return fields
    .map(field => `${field.key}: ${field.formatted ?? field.value}`)
    .join(' · ')
}

export function formatScalar(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null'
  }

  if (typeof value === 'string') {
    return value
  }

  return String(value)
}
