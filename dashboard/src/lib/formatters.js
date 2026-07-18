export function formatDateTime(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString('en-GB', {
    timeZone: 'Europe/Istanbul',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatDuration(totalSeconds) {
  if (totalSeconds == null) return '—'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const parts = [hours, minutes, seconds].map((n) => String(n).padStart(2, '0'))
  return hours > 0 ? parts.join(':') : parts.slice(1).join(':')
}
