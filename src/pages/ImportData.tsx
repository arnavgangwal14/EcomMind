import { useMemo, useRef, useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router'
import { AlertTriangle, ArrowRight, Check, Download, FileSpreadsheet, FileWarning, Loader2, Play, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useDataStore, useApiQuery } from '@/store/DataStore'
import { summarize, uploadImport, type ImportBatch } from '@/lib/imports'
import { downloadSampleRows } from './importSampleData'
import { cx, downloadCSV, formatDateTime, formatNum } from '@/lib/format'
import { PageHeader, PanelError, StatusBadge } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type DatasetKey = ImportBatch['dataset']

interface SlotDef {
  key: DatasetKey
  sampleKey: string
  label: string
  desc: string
  cols: string[]
  optional: string[]
}

const SLOTS: SlotDef[] = [
  { key: 'products', sampleKey: 'products', label: 'Products.csv', desc: 'Your catalogue with prices, cost and stock. Updates existing SKUs.', cols: ['sku', 'name', 'price', 'cost', 'stock'], optional: ['category', 'avg_daily_sales'] },
  { key: 'sales', sampleKey: 'sales', label: 'Sales_History.csv', desc: 'Daily units sold per SKU. Feeds analytics and forecasts.', cols: ['date', 'sku', 'units'], optional: ['orders', 'revenue'] },
  { key: 'returns', sampleKey: 'returns', label: 'Returns_By_Pincode.csv', desc: 'Orders and returns per pincode. Feeds return risk.', cols: ['pincode', 'sku', 'orders', 'returns'], optional: ['city'] },
  { key: 'supplier_quotes', sampleKey: 'suppliers', label: 'Supplier_Quotes.csv', desc: 'Your suppliers’ unit prices. Used for supplier recommendations.', cols: ['supplier', 'sku', 'unit_price', 'delivery_days'], optional: ['moq', 'available_qty', 'valid_until'] },
  { key: 'logistics', sampleKey: 'logistics', label: 'Logistics_Quotes.csv', desc: 'Courier costs and delivery times.', cols: ['courier', 'cost_per_500g', 'eta_days'], optional: ['service', 'rating', 'cod'] },
  { key: 'mandate', sampleKey: 'mandate', label: 'Seller_Mandate.csv', desc: 'Your autonomous spending limits (₹).', cols: ['daily_budget', 'max_order_value', 'max_per_call_cost'], optional: [] },
]

export default function ImportData() {
  const store = useDataStore()
  const navigate = useNavigate()
  const historyQ = useApiQuery<{ batches: ImportBatch[] }>('/api/imports?limit=100', ['products'])
  const history = useMemo(() => historyQ.data?.batches ?? [], [historyQ.data])
  const [target, setTarget] = useState<DatasetKey>('products')
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<ImportBatch[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const lastBy = useMemo(() => {
    const m: Partial<Record<DatasetKey, ImportBatch>> = {}
    for (const b of history) if (b.status === 'completed' && !m[b.dataset]) m[b.dataset] = b
    return m
  }, [history])
  const importedCount = SLOTS.filter((s) => lastBy[s.key]).length

  const afterImport = (batches: ImportBatch[]) => {
    setResults((prev) => [...batches, ...prev].slice(0, 12))
    store.invalidate('products', 'analytics', 'orders', 'mandate', 'suppliers', 'activity')
    historyQ.reload()
    for (const b of batches) {
      const fn = b.duplicate ? toast.info : b.status === 'failed' ? toast.error : b.failed ? toast.warning : toast.success
      fn(b.duplicate ? 'Already imported' : b.status === 'failed' ? `${b.datasetLabel}: nothing imported` : `${b.datasetLabel} imported`, {
        description: b.status === 'failed' ? (b.errors[0]?.message ?? 'No valid rows.') : summarize(b),
      })
    }
  }

  const handleFiles = async (files: FileList | File[]) => {
    if (busy) return
    setBusy(true)
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} exceeds the 10 MB limit`); continue }
        const lower = file.name.toLowerCase()
        if (!lower.endsWith('.csv') && !lower.endsWith('.xlsx')) { toast.error(`${file.name}: upload CSV or XLSX files only`); continue }
        try {
          afterImport(await uploadImport(file, { dataset: target }))
        } catch (e) {
          toast.error(`${file.name} failed`, { description: e instanceof Error ? e.message : 'Upload failed' })
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files)
  }

  const sampleFile = (s: SlotDef) => {
    const rows = downloadSampleRows(s.sampleKey)
    const cols = Object.keys(rows[0] ?? {})
    const esc = (v: string) => (v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v)
    const text = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(String(r[c] ?? ''))).join(','))].join('\n')
    return new File([text], s.label, { type: 'text/csv' })
  }

  const loadSamples = async () => {
    await handleFiles(SLOTS.map(sampleFile))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Business Data"
        subtitle="Upload your Indian e-commerce catalog, sales history, courier quotes, and supplier pricing to power autonomous recommendations."
        actions={
          <Button variant="outline" size="sm" onClick={loadSamples} disabled={busy} className="rounded-full font-bold text-xs">
            <Play className="h-3.5 w-3.5 mr-1" aria-hidden /> Import Sample Data for All
          </Button>
        }
      />
      {historyQ.error && <PanelError message={historyQ.error.message} onRetry={historyQ.reload} />}

      {/* Dataset Slots */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {SLOTS.map((s) => {
          const last = lastBy[s.key]
          return (
            <button
              key={s.key}
              onClick={() => setTarget(s.key)}
              className={cx(
                'card-surface p-5 text-left transition-all duration-200 cursor-pointer',
                target === s.key
                  ? 'border-[#7B2FE0] bg-[#BF8FFF]/15 dark:bg-[#7B2FE0]/20 ring-2 ring-[#7B2FE0]/25'
                  : 'hover:border-[#7B2FE0]/50 hover:bg-[#F2F6F6]/60 dark:hover:bg-white/5',
              )}
              aria-pressed={target === s.key}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cx('flex h-8 w-8 items-center justify-center rounded-xl', last ? 'bg-[#14B8A0]/15 text-[#14B8A0]' : 'bg-[#DCEDEA] dark:bg-white/10 text-[#7B2FE0]')}>
                    <FileSpreadsheet className="h-4 w-4" aria-hidden />
                  </div>
                  <span className="text-sm font-extrabold text-[#121A16] dark:text-white">{s.label}</span>
                </div>
                {last ? (
                  <StatusBadge label={`${formatNum(last.imported)} rows saved`} tone="success" />
                ) : (
                  <StatusBadge label={s.key === 'products' ? 'Start Here' : 'Optional'} tone="neutral" />
                )}
              </div>
              <p className="mt-2 text-xs font-medium text-[#3B4640] dark:text-muted-foreground">{s.desc}</p>
              <p className="mt-2.5 font-mono text-[10px] text-[#3B4640]/70 dark:text-muted-foreground/70 truncate">
                {s.cols.join(' · ')}{s.optional.length ? ` · (${s.optional.join(', ')})` : ''}
              </p>
              {last && (
                <p className="mt-2 text-[11px] font-semibold text-[#14B8A0]">
                  Last import {formatDateTime(last.createdAt)} · {last.fileName}
                </p>
              )}
            </button>
          )
        })}
      </div>

      {/* Frosted Frame: File Upload Zone */}
      <div className="frosted-frame">
        <div className="card-surface p-6 hatch-tr">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cx(
              'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-200',
              dragOver
                ? 'border-[#7B2FE0] bg-[#BF8FFF]/15'
                : 'border-[#C9D6D3] dark:border-white/15 bg-[#F2F6F6]/50 dark:bg-white/5',
            )}
          >
            {busy ? (
              <Loader2 className="mb-3.5 h-8 w-8 animate-spin text-[#7B2FE0] dark:text-[#BF8FFF]" aria-hidden />
            ) : (
              <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCEDEA] dark:bg-white/10 text-[#7B2FE0] dark:text-[#BF8FFF] shadow-xs">
                <Upload className="h-6 w-6" aria-hidden />
              </div>
            )}
            <p className="text-base font-extrabold text-[#121A16] dark:text-white">
              {busy ? 'Validating and Importing Rows…' : 'Drag & drop business spreadsheets here'}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-[#3B4640] dark:text-muted-foreground max-w-lg">
              Uploading to: <span className="text-[#7B2FE0] dark:text-[#BF8FFF] font-bold">{SLOTS.find((s) => s.key === target)?.label}</span> — or drop a multi-sheet XLSX file matching standard datasets.
            </p>
            <p className="mt-1 text-[11px] text-[#3B4640]/70 dark:text-muted-foreground/70">
              CSV or XLSX format · Max 10 MB per file · Duplicate rows automatically reconciled
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button size="sm" className="btn-glow border-0 text-white rounded-full px-5 py-2 font-bold" onClick={() => fileRef.current?.click()} disabled={busy}>
                <Upload className="h-3.5 w-3.5 mr-1" aria-hidden /> Browse Files
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full px-5 font-bold"
                onClick={() => {
                  const s = SLOTS.find((x) => x.key === target)!
                  const rows = downloadSampleRows(s.sampleKey)
                  const cols = Object.keys(rows[0] ?? {})
                  downloadCSV(`sample_${s.label}`, cols, rows.map((r) => cols.map((c) => r[c] ?? '')))
                  toast.success(`Sample ${s.label} downloaded`)
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1" aria-hidden /> Download Sample {SLOTS.find((x) => x.key === target)?.label}
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx"
              multiple
              className="sr-only"
              aria-label="Upload data files"
              onChange={(e) => {
                if (e.target.files) void handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>
        </div>
      </div>

      {/* Upload Results for current session */}
      {results.length > 0 && (
        <Card className="card-surface hatch-br overflow-hidden">
          <CardContent className="p-0">
            <div className="border-b border-[#C9D6D3]/60 dark:border-white/10 px-6 py-4">
              <h2 className="text-sm font-extrabold text-[#121A16] dark:text-white">Import Session Results</h2>
            </div>
            <ul className="divide-y divide-[#C9D6D3]/40 dark:divide-white/5">
              {results.map((b) => (
                <li key={`${b.id}-${b.duplicate}`} className="px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {b.status === 'failed' ? (
                        <FileWarning className="h-4 w-4 text-[#FF8A80]" aria-hidden />
                      ) : b.failed ? (
                        <AlertTriangle className="h-4 w-4 text-[#FF9A3D]" aria-hidden />
                      ) : (
                        <Check className="h-4 w-4 text-[#14B8A0]" aria-hidden />
                      )}
                      <span className="text-sm font-bold text-[#121A16] dark:text-white">{b.fileName}{b.sheet ? ` · ${b.sheet}` : ''}</span>
                      <span className="text-xs text-[#3B4640] dark:text-muted-foreground">→ {b.datasetLabel}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {b.duplicate ? (
                        <StatusBadge label="Already imported" tone="neutral" />
                      ) : (
                        <>
                          <StatusBadge label={`${b.created} new`} tone="success" />
                          <StatusBadge label={`${b.updated} updated`} tone="info" />
                          {b.unchanged > 0 && <StatusBadge label={`${b.unchanged} unchanged`} tone="neutral" />}
                          {b.failed > 0 && <StatusBadge label={`${b.failed} skipped`} tone="danger" />}
                        </>
                      )}
                    </div>
                  </div>
                  {b.errors.length > 0 && !b.duplicate && (
                    <ul className="mt-2.5 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-[#FF8A80]/30 bg-[#FF8A80]/10 p-3">
                      {b.errors.map((e, i) => (
                        <li key={i} className="text-[11px] font-medium text-[#FF8A80]">
                          {e.row ? `Row ${e.row}: ` : ''}{e.message}
                        </li>
                      ))}
                      {b.failed > b.errors.length && (
                        <li className="text-[11px] text-[#3B4640] dark:text-muted-foreground">
                          …and {b.failed - b.errors.length} more
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Import History Table */}
      <Card className="card-surface overflow-hidden hatch-br">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-[#C9D6D3]/60 dark:border-white/10 px-6 py-4">
            <h2 className="text-sm font-extrabold text-[#121A16] dark:text-white">Import History</h2>
            <span className="text-xs font-semibold text-[#3B4640]/80 dark:text-muted-foreground">Persistently synced with seller account</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#C9D6D3]/60 dark:border-white/10 hover:bg-transparent">
                  {['When', 'File', 'Dataset', 'From', 'Rows', 'New', 'Updated', 'Skipped', 'Status'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-[#3B4640]/80 dark:text-muted-foreground">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((b) => (
                  <TableRow key={b.id} className="border-b border-[#C9D6D3]/40 dark:border-white/5 hover:bg-[#F2F6F6]/50 dark:hover:bg-white/5">
                    <TableCell className="tabular whitespace-nowrap text-xs font-semibold text-[#3B4640] dark:text-muted-foreground">
                      {formatDateTime(b.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-56 truncate text-xs font-bold text-[#121A16] dark:text-white">
                      {b.fileName}{b.sheet ? ` · ${b.sheet}` : ''}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs font-semibold text-[#121A16] dark:text-white">
                      {b.datasetLabel}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-[#3B4640] dark:text-muted-foreground">
                      {b.source === 'onboarding' ? 'Onboarding' : 'Import page'}
                    </TableCell>
                    <TableCell className="tabular text-xs font-bold">{formatNum(b.rowsTotal)}</TableCell>
                    <TableCell className="tabular text-xs font-bold text-[#14B8A0]">{formatNum(b.created)}</TableCell>
                    <TableCell className="tabular text-xs font-bold text-[#23A6FF]">{formatNum(b.updated)}</TableCell>
                    <TableCell className={cx('tabular text-xs font-bold', b.failed ? 'text-[#FF8A80]' : 'text-[#3B4640]/70 dark:text-muted-foreground')}>
                      {formatNum(b.failed)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={b.status === 'completed' ? 'Saved' : 'Failed'}
                        tone={b.status === 'completed' ? (b.failed ? 'warning' : 'success') : 'danger'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {historyQ.data && history.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9} className="py-12 text-center text-xs font-semibold text-[#3B4640] dark:text-muted-foreground">
                      No imports yet. Click "Import sample data for all" to load the complete demo suite.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Completion Banner */}
      <div className="card-surface p-6 hatch-tr">
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-md', lastBy.products ? 'bg-[#14B8A0] text-white' : 'bg-[#DCEDEA] text-[#3B4640]')}>
              <Check className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#121A16] dark:text-white">
                {importedCount} of {SLOTS.length} datasets imported
              </h2>
              <p className="text-xs font-medium text-[#3B4640] dark:text-muted-foreground">
                Inventory, pricing, return risk and supplier recommendation models read your imported data straight away.
              </p>
            </div>
          </div>
          <Button className="btn-glow border-0 text-white rounded-full px-6 py-2.5 font-bold shadow-lg" onClick={() => navigate('/')}>
            Open my dashboard <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}
