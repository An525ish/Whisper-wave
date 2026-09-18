import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { getMediaDisplayName, getMediaKindFromFile } from '@/utils/fileFormat'
import type { MediaFile, PhotoFilter, SharedLink, SharedContentTab } from '@/components/profile/shared-content/types'

type UseSharedContentProps = {
  mediaFiles: MediaFile[]
  docFiles: MediaFile[]
  links: SharedLink[]
  initialTab: SharedContentTab
  onClose: () => void
}

export const useSharedContent = ({
  mediaFiles,
  docFiles,
  links,
  initialTab,
  onClose,
}: UseSharedContentProps) => {
  const [activeTab, setActiveTab] = useState<SharedContentTab>(initialTab)
  const [query, setQuery] = useState('')
  const [photoFilter, setPhotoFilter] = useState<PhotoFilter>('all')
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    setActiveTab(initialTab)
    setQuery('')
    setPhotoFilter('all')
  }, [initialTab])

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const filteredPhotos = useMemo(() => {
    const q = query.trim().toLowerCase()
    return mediaFiles.filter((file) => {
      const kind = getMediaKindFromFile(file)
      if (photoFilter !== 'all' && kind !== photoFilter) return false
      if (!q) return true
      return getMediaDisplayName(file).toLowerCase().includes(q)
    })
  }, [mediaFiles, query, photoFilter])

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return docFiles
    return docFiles.filter((file) => (file.name ?? '').toLowerCase().includes(q))
  }, [docFiles, query])

  const filteredLinks = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return links
    return links.filter((link) => link.host.toLowerCase().includes(q) || link.url.toLowerCase().includes(q))
  }, [links, query])

  const photoCounts = useMemo(() => mediaFiles.reduce(
    (acc, f) => {
      acc.all++;
      const kind = getMediaKindFromFile(f);
      if (kind === 'image') acc.image++;
      else if (kind === 'video') acc.video++;
      else if (kind === 'audio') acc.audio++;
      return acc;
    },
    { all: 0, image: 0, video: 0, audio: 0 },
  ), [mediaFiles])

  const copyLink = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }, [])

  const handleTabChange = (tab: SharedContentTab) => {
    setActiveTab(tab)
    setQuery('')
  }

  return {
    activeTab, setActiveTab: handleTabChange,
    query, setQuery,
    photoFilter, setPhotoFilter,
    entered,
    filteredPhotos, filteredDocs, filteredLinks,
    photoCounts,
    totalShared: mediaFiles.length + docFiles.length + links.length,
    copyLink,
  }
}
