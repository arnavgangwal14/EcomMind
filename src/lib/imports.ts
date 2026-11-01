import { ApiError } from '@/lib/api'
import { processClientImport } from './clientImport'

/** One imported dataset (a CSV file or one sheet of a workbook), as stored on the server. */
export interface ImportBatch {
  id: string
  dataset: 'products' | 'sales' | 'returns' | 'supplier_quotes' | 'logistics' | 'mandate'
  datasetLabel: string
  fileName: string
  sheet: string | null
  source: 'import_page' | 'onboarding'
  status: 'completed' | 'failed'
  rowsTotal: number
  created: number
  updated: number
  unchanged: number
  failed: number
  imported: number
  errors: { row: number | null; message: string }[]
  createdAt: string
  duplicate: boolean
}

/**
 * Upload a CSV or XLSX file to the import service. The Import Data page and
 * onboarding both use this, so there is one import pipeline: the server parses,
 * validates and stores the rows and returns a summary per dataset.
 *
 * When static hosting or backend is offline, it seamlessly falls back to the
 * client-side CSV import engine.
 */
export async function uploadImport(file: File, opts: { dataset?: string; source?: 'import_page' | 'onboarding' } = {}): Promise<ImportBatch[]> {
  const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || ''
  const fullUrl = apiBase ? `${apiBase.replace(/\/$/, '')}/api/imports` : '/api/imports'

  // If live backend URL is provided or reachable, try sending to backend
  try {
    const form = new FormData()
    form.append('file', file)
    if (opts.dataset) form.append('dataset', opts.dataset)
    form.append('source', opts.source ?? 'import_page')

    const res = await fetch(fullUrl, {
      method: 'POST',
      body: form,
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })

    const text = await res.text().catch(() => '')
    let data: { batches?: ImportBatch[]; error?: { code?: string; message?: string } } | undefined
    try {
      data = text ? JSON.parse(text) : undefined
    } catch {
      // non-JSON response (e.g. static HTML)
    }

    if (res.ok && data?.batches) {
      return data.batches
    }

    if (res.status === 401) {
      window.dispatchEvent(new Event('ecommind:unauthorized'))
      throw new ApiError(401, 'unauthorized', 'Session expired. Please sign in again.')
    }

    // If static hosting returns 404, 405 Method Not Allowed, or HTML error page on API route,
    // we continue to client-side fallback below instead of throwing.
    if (res.status !== 404 && res.status !== 405 && !text.includes('<!DOCTYPE') && !text.includes('<html')) {
      if (!res.ok) {
        throw new ApiError(res.status, data?.error?.code ?? 'http_error', data?.error?.message ?? 'Import failed.')
      }
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) throw e
    // Network errors or static hosting: proceed to client-side parser
  }

  // Client-side parser fallback for CSV files
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.xlsx')) {
    throw new ApiError(422, 'xlsx_offline', 'Excel (.xlsx) requires a live backend. In web demo mode, please save your file as CSV (.csv) and upload.')
  }

  return await processClientImport(file, opts)
}

export function summarize(b: ImportBatch): string {
  if (b.duplicate) return `${b.fileName} was already imported on ${new Date(b.createdAt).toLocaleString('en-IN')}; nothing changed.`
  const parts = [`${b.created} new`, `${b.updated} updated`]
  if (b.unchanged) parts.push(`${b.unchanged} unchanged`)
  if (b.failed) parts.push(`${b.failed} skipped`)
  return `${b.datasetLabel}: ${parts.join(', ')} of ${b.rowsTotal} rows.`
}
