import type { ReactNode } from 'react'

export const highlightSnippet = (text: string, query: string): ReactNode => {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'ig'))
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded-sm bg-yellow/90 px-0.5 font-medium text-background">{part}</mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  )
}
