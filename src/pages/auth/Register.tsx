import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useApp } from '@/store/AppContext'
import { ApiError } from '@/lib/api'
import { emailError } from '@/lib/validation/email'
import { getExpectedCheckDigit, gstinLiveError, normalizeGstin, SAMPLE_GSTINS, validateGstin } from '@/lib/validation/gstin'
import { LocationAutocomplete } from '@/components/LocationAutocomplete'
import type { PlaceValue } from '@/lib/place'
import { AuthShell } from './AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cx } from '@/lib/format'

const CATEGORIES = ['Electronics & Accessories', 'Fashion & Apparel', 'Home & Kitchen', 'Fitness & Sports', 'Beauty & Personal Care', 'Toys & Baby', 'Other']

export default function Register() {
  const { register } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', business: '', email: '', password: '', confirm: '', category: '', gstin: '' })
  const [location, setLocation] = useState<PlaceValue>({ text: '', placeId: null, sessionToken: null, verified: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => {
      const next = { ...f, [k]: v }
      // Re-check a field as the user edits it once it has been visited (instant feedback).
      if (touched[k]) setErrors((x) => ({ ...x, [k]: validateField(k, v, next) ?? '', form: '' }))
      return next
    })
  }

  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = (k: keyof typeof form, v: string, all = form): string | undefined => {
    switch (k) {
      case 'name': return v.trim().length < 2 ? 'Enter your full name.' : undefined
      case 'business': return v.trim().length < 2 ? 'Enter your business name.' : undefined
      case 'email': return emailError(v)
      case 'password': return v.length < 6 ? 'At least 6 characters.' : undefined
      case 'confirm': return v !== all.password ? 'Passwords do not match.' : undefined
      case 'category': return !v ? 'Select a category.' : undefined
      case 'gstin': {
        if (!v.trim()) return undefined
        const r = validateGstin(v)
        return r.ok ? undefined : r.message
      }
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    for (const k of Object.keys(form) as (keyof typeof form)[]) {
      const m = validateField(k, form[k])
      if (m) errs[k] = m
    }
    setErrors(errs)
    setTouched({ name: true, business: true, email: true, password: true, confirm: true, category: true, gstin: true })
    if (Object.keys(errs).length) return
    setLoading(true)
    try {
      await register({
        name: form.name.trim(),
        business: form.business.trim(),
        email: form.email.trim(),
        password: form.password,
        category: form.category,
        location: location.text ? location.text.trim() : undefined,
        gstin: form.gstin ? normalizeGstin(form.gstin) : undefined,
      })
      navigate('/onboarding')
    } catch (err) {
      if (err instanceof ApiError && err.field) setErrors({ [err.field]: err.message })
      else setErrors({ form: err instanceof ApiError ? err.message : 'Couldn’t create your account. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  const field = (id: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id} type={type} placeholder={placeholder} value={form[id]} onChange={(e) => set(id)(e.target.value)}
        onBlur={() => { setTouched((t) => ({ ...t, [id]: true })); if (form[id]) setErrors((x) => ({ ...x, [id]: validateField(id, form[id]) ?? '' })) }}
        aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `${id}-error` : undefined}
        autoComplete={id === 'email' ? 'email' : id === 'password' || id === 'confirm' ? 'new-password' : undefined}
      />
      {errors[id] ? <p id={`${id}-error`} className="text-xs text-danger">{errors[id]}</p>
        : id === 'email' ? <p className="text-xs text-muted-foreground">Only Gmail addresses (ending in @gmail.com) are accepted.</p> : null}
    </div>
  )

  return (
    <AuthShell>
      <div className="mb-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7B2FE0] dark:text-[#BF8FFF] hover:underline"
        >
          ← Back to Product Tour & Feature Overview
        </Link>
      </div>

      {/* Auth Mode Tabs */}
      <div className="mb-6 flex rounded-lg bg-secondary/40 p-1 border border-border/50">
        <Link
          to="/login"
          className="flex-1 rounded-md py-1.5 text-center text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
        >
          Sign In
        </Link>
        <Link
          to="/register"
          className="flex-1 rounded-md py-1.5 text-center text-xs font-semibold bg-background text-foreground shadow-xs transition-all"
        >
          Create Account
        </Link>
      </div>

      <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
      <p className="mt-1 text-sm text-muted-foreground">Set up your autonomous selling workspace in minutes.</p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        {field('name', 'Seller name', 'text', 'Aryan')}
        {field('business', 'Business name', 'text', 'UrbanNest Living')}
        {field('email', 'Email', 'email', 'aryan@gmail.com')}

        {/* Location Factor */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-location">City / Location <span className="font-normal text-muted-foreground">(type initials, e.g. &quot;b&quot; for Bengaluru)</span></Label>
          <LocationAutocomplete
            id="reg-location"
            value={location}
            onChange={(loc) => {
              setLocation(loc)
              setErrors((prev) => ({ ...prev, location: '' }))
            }}
            placeholder="Type city or initial (e.g. b for Bengaluru, m for Mumbai)"
          />
        </div>

        {/* Business GSTIN */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="reg-gstin">Business GSTIN <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <span className="text-[11px] text-muted-foreground">15 chars</span>
          </div>
          <Input
            id="reg-gstin"
            placeholder="e.g. 27AAPFU0939F1ZV"
            value={form.gstin}
            maxLength={20}
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase tracking-wide"
            onChange={(e) => {
              let v = normalizeGstin(e.target.value)
              const expected = getExpectedCheckDigit(v)
              if (v.length === 14 && expected) v = v + expected
              setForm((prev) => ({ ...prev, gstin: v }))
              setErrors((prev) => ({ ...prev, gstin: gstinLiveError(v) || '' }))
            }}
            onBlur={() => {
              if (!form.gstin) return
              const expected = getExpectedCheckDigit(form.gstin)
              let v = form.gstin
              if (expected && (v.length === 14 || (v.length === 15 && v[14] !== expected))) {
                v = v.slice(0, 14) + expected
                setForm((prev) => ({ ...prev, gstin: v }))
              }
              const r = validateGstin(v)
              setErrors((prev) => ({ ...prev, gstin: r.ok ? '' : r.message }))
            }}
            aria-invalid={!!errors.gstin}
          />
          {errors.gstin ? (
            <div className="space-y-1">
              <p className="text-xs text-danger">{errors.gstin}</p>
              {(() => {
                const exp = getExpectedCheckDigit(form.gstin)
                if (exp && form.gstin.length === 15 && form.gstin[14] !== exp) {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        const fixed = form.gstin.slice(0, 14) + exp
                        setForm((prev) => ({ ...prev, gstin: fixed }))
                        setErrors((prev) => ({ ...prev, gstin: '' }))
                      }}
                      className="inline-flex items-center gap-1 rounded bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-xs font-medium text-indigo-400 hover:bg-indigo-500/25 transition-colors"
                    >
                      Fix check digit to &quot;{exp}&quot;
                    </button>
                  )
                }
                return null
              })()}
            </div>
          ) : form.gstin && validateGstin(form.gstin).ok ? (
            <p className="text-xs text-success">Format looks valid.</p>
          ) : (
            <div className="pt-1 space-y-1">
              <span className="text-[11px] text-muted-foreground">Quick test GSTINs for major states:</span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_GSTINS.slice(0, 8).map((s) => (
                  <button
                    key={s.gstin}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, gstin: s.gstin }))
                      setErrors((prev) => ({ ...prev, gstin: '' }))
                    }}
                    className={cx(
                      'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono transition-colors border',
                      form.gstin === s.gstin
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-medium'
                        : 'border-border/60 bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <span className="font-semibold text-[10px] text-primary">{s.label}</span>
                    <span>{s.gstin}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field('password', 'Password', 'password', '••••••••')}
          {field('confirm', 'Confirm password', 'password', '••••••••')}
        </div>
        <div className="space-y-1.5">
          <Label>Business category</Label>
          <Select value={form.category} onValueChange={(v) => { setTouched((t) => ({ ...t, category: true })); set('category')(v); setErrors((x) => ({ ...x, category: '' })) }}>
            <SelectTrigger aria-invalid={!!errors.category}><SelectValue placeholder="Select a category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-xs text-danger">{errors.category}</p>}
        </div>
        {errors.form && <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">{errors.form}</p>}
        <Button type="submit" className="btn-glow h-10 w-full border-0 text-white" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-soft hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  )
}
