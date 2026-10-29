import { useActiveMessageDatesQuery, useChatDetailsQuery, useJumpToDateMutation, useSearchMessagesQuery } from '.'
import { useAuthStore } from '@/features/auth'
import { getFirstName } from '@/shared/utils/helpers'
import dayjs from 'dayjs'
import { useEffect, useEffectEvent, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type {
  SearchMode, FromFilter, FromOption,
  ChatDetailsResponse,
} from '../types/chat'
import type { ChatMemberObject, JumpDateResponse, SearchResponse } from '../types/local'

const dayBounds = (isoDate: string) => ({
  dateFrom: dayjs(isoDate).startOf('day').toISOString(),
  dateTo: dayjs(isoDate).endOf('day').toISOString(),
})

interface Params {
  chatId?: string
  open: boolean
  onClose: () => void
  onJumpToMessage: (messageId: string, query: string, options?: { closeSearch?: boolean }) => void
}

export const useChatSearch = ({ chatId, open, onClose, onJumpToMessage }: Params) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const user = useAuthStore((s) => s.user)

  const [entered, setEntered] = useState(false)
  const [mode, setMode] = useState<SearchMode>('messages')
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState<FromFilter>('anyone')
  const [selectedDate, setSelectedDate] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [dateJumpNote, setDateJumpNote] = useState<string | null>(null)
  const jumpDateMutation = useJumpToDateMutation()

  const { data: chatDetails } = useChatDetailsQuery({ id: chatId, populate: true }, { skip: !open || !chatId })
  const chatData = (chatDetails as ChatDetailsResponse | undefined)?.data
  const isGroup = Boolean(chatData?.groupChat)
  const peerName = chatData?.name ?? 'Them'
  const peerAvatar = Array.isArray(chatData?.avatar) ? chatData?.avatar[0] : chatData?.avatar

  const members = useMemo(() => {
    const list = chatData?.members ?? []
    const selfId = user?._id ? String(user._id) : ''
    return list
      .filter((m): m is ChatMemberObject => typeof m === 'object' && m !== null)
      .map((m) => ({ _id: m._id ? String(m._id) : '', name: m.name ?? 'Member', avatar: m.avatar }))
      .filter((m) => m._id && m._id !== selfId)
  }, [chatData?.members, user?._id])

  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => setEntered(true))
    return () => { cancelAnimationFrame(id); setEntered(false) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = prevOverflow; document.removeEventListener('keydown', onKeyDown) }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => { if (mode !== 'date') inputRef.current?.focus() }, 80)
    return () => clearTimeout(timer)
  }, [open, mode])

  useEffect(() => {
    if (!open) return
    return () => { setMode('messages'); setDraft(''); setQuery(''); setFrom('anyone'); setSelectedDate(''); setActiveIndex(-1); setDateJumpNote(null) }
  }, [open])

  useEffect(() => {
    const timer = setTimeout(() => setQuery(draft.trim()), 260)
    return () => clearTimeout(timer)
  }, [draft])

  const scope = mode === 'media' ? 'media' : mode === 'links' ? 'links' : 'all'
  const senderId = from !== 'anyone' && from !== 'me' && from !== 'others' ? from : undefined
  const fromParam = from === 'me' || from === 'others' ? from : ('anyone' as const)
  const searchEnabled = open && mode !== 'date' && (mode === 'media' || mode === 'links' ? true : query.length >= 1)

  const { data, isFetching, isError } = useSearchMessagesQuery(
    { chatId, q: query, scope, from: senderId ? 'anyone' : fromParam, senderId },
    { enabled: searchEnabled },
  )

  const presetActiveRange = useMemo(() => ({
    dateFrom: dayjs().subtract(30, 'day').startOf('day').toISOString(),
    dateTo: dayjs().endOf('day').toISOString(),
  }), [])

  const { data: presetActiveDatesResult, isFetched: presetDatesFetched } = useActiveMessageDatesQuery(
    { chatId, dateFrom: presetActiveRange.dateFrom, dateTo: presetActiveRange.dateTo },
    { enabled: open && mode === 'date' && Boolean(chatId) },
  )

  const presetActiveSet = useMemo(() => new Set(presetActiveDatesResult?.dates ?? []), [presetActiveDatesResult?.dates])

  const rawHits = (data as SearchResponse | undefined)?.data
  const hits = useMemo(() => [...(rawHits ?? [])].reverse(), [rawHits])

  const total = hits.length

  // Any change to the search inputs invalidates the active hit and the date-jump note.
  const searchKey = `${query}|${mode}|${from}|${selectedDate}|${open}`
  const [prevSearchKey, setPrevSearchKey] = useState(searchKey)
  if (prevSearchKey !== searchKey) {
    setPrevSearchKey(searchKey)
    setActiveIndex(-1)
    setDateJumpNote(null)
  }

  const clearJumpTarget = useEffectEvent(() => { if (open) onJumpToMessage('', '') })
  useEffect(() => { clearJumpTarget() }, [query, mode, from, selectedDate, open])

  const handleJumpToSelectedDate = async () => {
    if (!chatId || !selectedDate) return
    setDateJumpNote(null)
    const bounds = dayBounds(selectedDate)
    try {
      const res = (await jumpDateMutation.mutateAsync({ chatId, dateFrom: bounds.dateFrom, dateTo: bounds.dateTo })) as JumpDateResponse
      const target = res.data
      if (!target?._id) { setDateJumpNote('No messages on or after this day'); return }
      onJumpToMessage(target._id, '', { closeSearch: true })
      setDateJumpNote(target.exactDay ? `Jumped · ${dayjs(selectedDate).format('D MMM YYYY')}` : `No messages on ${dayjs(selectedDate).format('D MMM YYYY')}`)
    } catch {
      setDateJumpNote("Couldn't jump to that day")
    }
  }

  const jumpToHit = (index: number, options?: { closeSearch?: boolean }) => {
    const hit = hits[index]
    if (!hit) return
    setActiveIndex(index)
    onJumpToMessage(hit._id, mode === 'messages' ? query : '', options)
  }

  const jumpRelative = (delta: number) => {
    if (total === 0) return
    let next: number
    if (activeIndex < 0) { next = delta >= 0 ? total - 1 : 0 }
    else { next = activeIndex + delta; if (next < 0) next = total - 1; if (next >= total) next = 0 }
    jumpToHit(next)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); jumpRelative(1); return }
    if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); jumpRelative(-1); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); jumpRelative(1) }
    if (e.key === 'ArrowUp') { e.preventDefault(); jumpRelative(-1) }
  }

  const handleModeChange = (newMode: SearchMode) => {
    setMode(newMode)
    if (newMode === 'date') setQuery('')
  }

  const fromOptions = useMemo<FromOption[]>(() => {
    const myAvatar = typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url
    if (!isGroup) {
      return [
        { id: 'anyone', label: 'Anyone', tone: 'all' },
        { id: 'me', label: 'You', tone: 'self', avatar: myAvatar },
        { id: 'others', label: getFirstName(peerName) || 'Them', tone: 'peer', avatar: peerAvatar },
      ]
    }
    return [
      { id: 'anyone', label: 'Anyone', tone: 'all' },
      { id: 'me', label: 'You', tone: 'self', avatar: myAvatar },
      ...members.slice(0, 6).map((m) => ({ id: m._id, label: getFirstName(m.name), tone: 'peer' as const, avatar: m.avatar })),
    ]
  }, [isGroup, members, peerAvatar, peerName, user?.avatar])

  return {
    inputRef, entered, mode, draft, setDraft, query, from, setFrom, selectedDate, setSelectedDate,
    activeIndex, dateJumpNote, hits, total, isFetching, isError, searchEnabled,
    isGroup, fromOptions, presetActiveSet, presetDatesFetched,
    jumpRelative, jumpToHit, handleKeyDown, handleModeChange, handleJumpToSelectedDate,
    jumping: jumpDateMutation.isPending,
    userId: user?._id ? String(user._id) : '',
  }
}
