import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, MapPin } from 'lucide-react'
import { api } from '@/lib/api'
import { cx } from '@/lib/format'
import type { PlaceValue } from '@/lib/place'
import { searchCities, type CityData } from '@/data/cities'

interface Suggestion {
  placeId: string
  primary: string
  secondary: string
  description: string
  cityData?: CityData
}
interface Details { placeId: string; formattedAddress: string; lat: number | null; lng: number | null; city: string | null; state: string | null; country: string | null }
interface PlacesConfig { enabled: boolean; verificationRequired: boolean }

const DEBOUNCE_MS = 300

const newSessionToken = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`

export function LocationAutocomplete({
  id, value, onChange, error, placeholder = 'Start typing your city (e.g. Bengaluru, Mumbai)',
}: {
  id: string
  value: PlaceValue
  onChange: (v: PlaceValue) => void
  error?: string
  placeholder?: string
}) {
  const listId = useId()
  const [config, setConfig] = useState<PlacesConfig | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [active, setActive] = useState(-1)
  const [providerError, setProviderError] = useState<string | null>(null)
  const [searched, setSearched] = useState('')
  const session = useRef<string>(newSessionToken())
  const abort = useRef<AbortController | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const skipNext = useRef(false)

  useEffect(() => {
    api<PlacesConfig>('/api/places/config').then(setConfig).catch(() => setConfig({ enabled: false, verificationRequired: false }))
  }, [])

  const enabled = !!config?.enabled
  const query = value.text

  useEffect(() => {
    if (skipNext.current) { skipNext.current = false; return }
    clearTimeout(timer.current)
    abort.current?.abort()
    const q = query.trim()
    if (q.length < 1 || value.verified) { setSuggestions([]); setLoading(false); return }

    // Instant local Indian cities search (e.g. typing "b" shows all cities with initial "b")
    const localMatches = searchCities(q)
    const localSuggestions: Suggestion[] = localMatches.map((c) => ({
      placeId: `city:${c.city.toLowerCase()}`,
      primary: c.city,
      secondary: `${c.state}, ${c.country}`,
      description: `${c.city}, ${c.state}, ${c.country}`,
      cityData: c,
    }))

    if (!enabled) {
      setSuggestions(localSuggestions)
      setActive(localSuggestions.length ? 0 : -1)
      setSearched(q)
      setOpen(true)
      setLoading(false)
      return
    }

    setSuggestions(localSuggestions)
    setActive(localSuggestions.length ? 0 : -1)
    setOpen(true)
    if (q.length < 2) return

    setLoading(true)
    timer.current = setTimeout(async () => {
      const ctrl = new AbortController()
      abort.current = ctrl
      try {
        const res = await api<{ suggestions: Suggestion[] }>('/api/places/autocomplete', {
          query: { q, sessionToken: session.current }, signal: ctrl.signal,
        })
        const combined = [...localSuggestions]
        const seen = new Set(localSuggestions.map((x) => x.primary.toLowerCase()))
        for (const s of res.suggestions) {
          if (!seen.has(s.primary.toLowerCase())) {
            seen.add(s.primary.toLowerCase())
            combined.push(s)
          }
        }
        setSuggestions(combined)
        setActive(combined.length ? 0 : -1)
        setProviderError(null)
        setSearched(q)
        setOpen(true)
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
        setProviderError(null)
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer.current)
  }, [query, enabled, value.verified])

  useEffect(() => () => { abort.current?.abort(); clearTimeout(timer.current) }, [])

  const select = async (s: Suggestion) => {
    setOpen(false)
    setSuggestions([])
    skipNext.current = true
    if (s.cityData) {
      onChange({
        text: `${s.cityData.city}, ${s.cityData.state}`,
        placeId: s.placeId,
        sessionToken: null,
        formattedAddress: `${s.cityData.city}, ${s.cityData.state}, ${s.cityData.country}`,
        city: s.cityData.city,
        state: s.cityData.state,
        country: s.cityData.country,
        verified: true,
      })
      return
    }
    setResolving(true)
    const token = session.current
    try {
      const d = await api<Details>(`/api/places/details/${encodeURIComponent(s.placeId)}`, { query: { sessionToken: token } })
      onChange({ text: d.formattedAddress || s.description, placeId: d.placeId, sessionToken: token, formattedAddress: d.formattedAddress,
        lat: d.lat, lng: d.lng, city: d.city, state: d.state, country: d.country, verified: true })
    } catch {
      onChange({ text: s.description, placeId: s.placeId, sessionToken: token, verified: true })
    } finally {
      setResolving(false)
      session.current = newSessionToken()
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length) { setOpen(true); e.preventDefault() }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % suggestions.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1)) }
    else if (e.key === 'Enter') { if (active >= 0) { e.preventDefault(); void select(suggestions[active]) } }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  const status = useMemo(() => {
    if (resolving) return { tone: 'muted', text: 'Confirming location…' }
    if (value.verified) return { tone: 'ok', text: [value.city, value.state, value.country].filter(Boolean).join(', ') || 'Location confirmed' }
    if (providerError && value.text.trim().length >= 1) return { tone: 'warn', text: providerError }
    if (value.text.trim().length >= 1 && !value.verified) return { tone: 'muted', text: 'Pick a city to confirm your location.' }
    return null
  }, [resolving, value, providerError])

  const showList = open && value.text.trim().length >= 1 && !value.verified && (suggestions.length > 0 || loading || !!providerError)

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
      <input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={!!error}
        aria-describedby={`${id}-status`}
        autoComplete="off"
        placeholder={placeholder}
        value={value.text}
        onChange={(e) => {
          onChange({ text: e.target.value, placeId: null, sessionToken: null, verified: false })
          setOpen(true)
        }}
        onFocus={() => { if (suggestions.length || value.text.trim().length >= 1) setOpen(true) }}
        onBlur={() => {
          const q = value.text.trim().toLowerCase()
          if (!value.verified && q.length >= 2) {
            const match = suggestions.find(
              (s) => s.primary.toLowerCase() === q || s.description.toLowerCase().startsWith(q),
            )
            if (match) void select(match)
          }
          setTimeout(() => setOpen(false), 200)
        }}
        onKeyDown={onKeyDown}
        className={cx(
          'h-9 w-full rounded-md border bg-transparent pl-9 pr-9 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          error ? 'border-danger' : 'border-input',
        )}
      />
      <span className="absolute right-3 top-2.5" aria-hidden>
        {loading || resolving ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          : value.verified ? <CheckCircle2 className="h-4 w-4 text-success" /> : null}
      </span>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-2xl backdrop-blur-md"
        >
          {loading && suggestions.length === 0 && <li className="px-3 py-2.5 text-xs text-muted-foreground">Searching…</li>}
          {!loading && providerError && <li className="flex items-center gap-2 px-3 py-2.5 text-xs text-warning"><AlertCircle className="h-3.5 w-3.5" aria-hidden />{providerError}</li>}
          {!loading && !providerError && suggestions.length === 0 && searched && (
            <li className="px-3 py-2.5 text-xs text-muted-foreground">No cities match “{searched}”. Try typing another city initial or name.</li>
          )}
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); void select(s) }}
              onPointerDown={(e) => { e.preventDefault(); void select(s) }}
              onClick={(e) => { e.preventDefault(); void select(s) }}
              onMouseEnter={() => setActive(i)}
              className={cx('cursor-pointer px-3 py-2 text-sm transition-colors', i === active ? 'bg-secondary' : 'hover:bg-secondary/70')}
            >
              <span className="font-medium">{s.primary}</span>
              {s.secondary && <span className="block truncate text-xs text-muted-foreground">{s.secondary}</span>}
            </li>
          ))}
          {suggestions.length > 0 && (
            <li className="px-3 pt-1.5 pb-1 text-right text-[10px] text-muted-foreground/70 border-t border-border/40 mt-1">
              {enabled ? 'Powered by Google & India Cities' : 'India Cities Database (500+ Cities)'}
            </li>
          )}
        </ul>
      )}

      <p id={`${id}-status`} className={cx('mt-1 text-xs', error ? 'text-danger' : status?.tone === 'ok' ? 'text-success' : status?.tone === 'warn' ? 'text-warning' : 'text-muted-foreground')}>
        {error ?? status?.text ?? ''}
      </p>
    </div>
  )
}
