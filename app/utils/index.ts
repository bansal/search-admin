export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / 1024 ** index

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function formatDuration(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?$/)
  if (!match) {
    return value
  }

  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  const parts: string[] = []

  if (hours) {
    parts.push(`${hours}h`)
  }
  if (minutes) {
    parts.push(`${minutes}m`)
  }
  if (seconds || !parts.length) {
    parts.push(
      seconds < 1
        ? `${Math.round(seconds * 1000)}ms`
        : `${seconds.toFixed(seconds < 10 ? 2 : 1)}s`
    )
  }

  return parts.join(' ')
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export function parseJsonInput<T = unknown>(value: string): T {
  try {
    return JSON.parse(value) as T
  } catch {
    throw new Error('Invalid JSON')
  }
}
