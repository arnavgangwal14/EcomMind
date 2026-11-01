/**
 * Client-side CSV parser and data import engine for EcomMind.
 *
 * Fully mirrors the Python backend (backend/app/services/imports.py):
 * - Robust RFC 4180 CSV parsing with quote escaping and BOM stripping
 * - Delimiter detection (comma, semicolon, tab)
 * - Header normalization and alias mapping (e.g. "Selling Price (INR)" -> "price")
 * - Automatic dataset detection (products, sales, returns, supplier_quotes, logistics, mandate)
 * - Number cleaning (stripping currency symbols, ₹, $, rs, commas, /-)
 * - Local storage persistence for user catalogues and import history
 */

import type { ApiProduct } from './api'
import type { ImportBatch } from './imports'
import { PRODUCTS } from '@/data/demo'

const ALIASES: Record<string, string> = {
  // Products
  product: 'name',
  product_name: 'name',
  item: 'name',
  item_name: 'name',
  title: 'name',
  description: 'name',
  item_code: 'sku',
  product_code: 'sku',
  sku_code: 'sku',
  barcode: 'sku',
  selling_price: 'price',
  sale_price: 'price',
  retail_price: 'price',
  mrp: 'price',
  listing_price: 'price',
  unit_cost: 'cost',
  cost_price: 'cost',
  purchase_price: 'cost',
  buy_price: 'cost',
  cogs: 'cost',
  inventory: 'stock',
  available_stock: 'stock',
  stock_quantity: 'stock',
  quantity_on_hand: 'stock',
  qty_on_hand: 'stock',
  on_hand: 'stock',
  in_stock: 'stock',
  category_name: 'category',
  department: 'category',
  avg_sales: 'avg_daily_sales',
  daily_sales: 'avg_daily_sales',
  average_daily_sales: 'avg_daily_sales',
  ads: 'avg_daily_sales',
  return_pct: 'return_rate',
  return_percentage: 'return_rate',
  returns_rate: 'return_rate',

  // Sales
  quantity: 'units',
  qty: 'units',
  units_sold: 'units',
  quantity_sold: 'units',
  volume: 'units',
  order_date: 'date',
  sale_date: 'date',
  sales_date: 'date',
  day: 'date',
  transaction_date: 'date',
  total_orders: 'orders',
  order_count: 'orders',
  no_of_orders: 'orders',
  sales: 'revenue',
  total_sales: 'revenue',
  gross_revenue: 'revenue',
  amount: 'revenue',
  order_value: 'revenue',

  // Returns
  pin: 'pincode',
  pin_code: 'pincode',
  postal_code: 'pincode',
  zip: 'pincode',
  zip_code: 'pincode',
  zipcode: 'pincode',
  return_count: 'returns',
  returned_units: 'returns',
  returned_orders: 'returns',
  total_returns: 'returns',
  rto: 'returns',
  rto_count: 'returns',
  rto_orders: 'returns',

  // Supplier quotes
  supplier_name: 'supplier',
  vendor: 'supplier',
  vendor_name: 'supplier',
  seller: 'supplier',
  price_per_unit: 'unit_price',
  quote: 'unit_price',
  quoted_price: 'unit_price',
  rate: 'unit_price',
  lead_time_days: 'delivery_days',
  lead_time: 'delivery_days',
  delivery_time: 'delivery_days',
  min_order_qty: 'moq',
  min_qty: 'moq',
  minimum_order_quantity: 'moq',
  available: 'available_qty',
  valid_till: 'valid_until',
  expiry: 'valid_until',
  validity: 'valid_until',

  // Logistics
  courier_name: 'courier',
  carrier: 'courier',
  logistics_partner: 'courier',
  delivery_partner: 'courier',
  provider: 'courier',
  cost_500g: 'cost_per_500g',
  rate_500g: 'cost_per_500g',
  rate_per_500g: 'cost_per_500g',
  cost_per_half_kg: 'cost_per_500g',
  shipping_rate: 'cost_per_500g',
  shipping_cost: 'cost_per_500g',
  eta: 'eta_days',
  estimated_days: 'eta_days',
  tat: 'eta_days',
  tat_days: 'eta_days',
  sla_days: 'eta_days',

  // Mandate
  budget: 'daily_budget',
  daily_spending_limit: 'daily_budget',
  max_order: 'max_order_value',
  max_order_limit: 'max_order_value',
  per_call_cost: 'max_per_call_cost',
  max_call_cost: 'max_per_call_cost',
}

export const DATASET_LABELS: Record<string, string> = {
  products: 'Products',
  sales: 'Sales history',
  returns: 'Returns by pincode',
  supplier_quotes: 'Supplier quotes',
  logistics: 'Logistics quotes',
  mandate: 'Seller mandate',
}

/**
 * Normalizes a header string according to the backend rules:
 * - lowercase and trim
 * - replace non-alphanumeric with '_'
 * - strip trailing currency notation ('_inr', '_rs', '_rupees')
 * - resolve against ALIASES map
 */
export function normHeader(h: string): string {
  let k = String(h || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  k = k.replace(/_(inr|rs|rupees)$/, '')
  return ALIASES[k] || k
}

/**
 * Parses numbers from cell values, stripping currency symbols and commas.
 */
export function cleanNum(val: unknown): number | null {
  if (val === null || val === undefined) return null
  let s = String(val).replace(/,/g, '').replace(/[₹$]/g, '').trim()
  s = s.replace(/^(rs\.?|inr)\s*/i, '').replace(/\s*\/-$/, '').trim()
  if (!s) return null
  const num = parseFloat(s)
  return isNaN(num) ? null : num
}

/**
 * Robust CSV parser that handles delimiters, quotes, newlines, and BOM.
 */
export function parseCsv(text: string): { headers: string[]; rawHeaders: string[]; rows: Record<string, string>[] } {
  // Strip UTF-8 BOM if present
  let clean = text.replace(/^\uFEFF/, '')

  // Detect delimiter from first non-empty line
  const firstLine = clean.split(/\r\n|\n|\r/)[0] || ''
  let delimiter = ','
  const commaCount = (firstLine.match(/,/g) || []).length
  const semiCount = (firstLine.match(/;/g) || []).length
  const tabCount = (firstLine.match(/\t/g) || []).length
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ';'
  else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t'

  const lines: string[][] = []
  let currentLine: string[] = []
  let currentVal = ''
  let inQuotes = false

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i]
    const nextChar = clean[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentVal += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        currentVal += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === delimiter) {
        currentLine.push(currentVal.trim())
        currentVal = ''
      } else if (char === '\r') {
        if (nextChar === '\n') i++
        currentLine.push(currentVal.trim())
        if (currentLine.some((c) => c !== '')) lines.push(currentLine)
        currentLine = []
        currentVal = ''
      } else if (char === '\n') {
        currentLine.push(currentVal.trim())
        if (currentLine.some((c) => c !== '')) lines.push(currentLine)
        currentLine = []
        currentVal = ''
      } else {
        currentVal += char
      }
    }
  }

  if (currentVal || currentLine.length > 0) {
    currentLine.push(currentVal.trim())
    if (currentLine.some((c) => c !== '')) lines.push(currentLine)
  }

  if (lines.length === 0) return { headers: [], rawHeaders: [], rows: [] }

  const rawHeaders = lines[0]
  const headers = rawHeaders.map(normHeader)

  const rows: Record<string, string>[] = []
  for (let r = 1; r < lines.length; r++) {
    const rowObj: Record<string, string> = {}
    const rData = lines[r]
    for (let c = 0; c < headers.length; c++) {
      const h = headers[c]
      if (h) {
        rowObj[h] = rData[c] ?? ''
      }
    }
    // Only include row if it has at least one non-empty value
    if (Object.values(rowObj).some((v) => v.trim() !== '')) {
      rows.push(rowObj)
    }
  }

  return { headers, rawHeaders, rows }
}

/**
 * Automatically detects dataset type from normalized headers and filename.
 */
export function detectDataset(headers: string[], fileName: string): ImportBatch['dataset'] {
  const hSet = new Set(headers)
  const fn = fileName.toLowerCase()

  if (hSet.has('sku') && (hSet.has('price') || hSet.has('cost') || hSet.has('stock') || hSet.has('name'))) {
    return 'products'
  }
  if (hSet.has('date') && (hSet.has('units') || hSet.has('orders') || hSet.has('revenue'))) {
    return 'sales'
  }
  if ((hSet.has('pincode') || hSet.has('pin')) && (hSet.has('returns') || hSet.has('orders'))) {
    return 'returns'
  }
  if (hSet.has('supplier') && (hSet.has('unit_price') || hSet.has('delivery_days') || hSet.has('price'))) {
    return 'supplier_quotes'
  }
  if (hSet.has('courier') && (hSet.has('cost_per_500g') || hSet.has('eta_days') || hSet.has('rate'))) {
    return 'logistics'
  }
  if (hSet.has('daily_budget') || hSet.has('max_order_value') || hSet.has('max_per_call_cost')) {
    return 'mandate'
  }

  // Filename heuristics
  if (fn.includes('product') || fn.includes('catalog') || fn.includes('inventory')) return 'products'
  if (fn.includes('sale')) return 'sales'
  if (fn.includes('return') || fn.includes('rto')) return 'returns'
  if (fn.includes('supplier') || fn.includes('vendor')) return 'supplier_quotes'
  if (fn.includes('courier') || fn.includes('logistic')) return 'logistics'
  if (fn.includes('mandate') || fn.includes('budget')) return 'mandate'

  return 'products'
}

function getProductIcon(name: string, cat: string): string {
  const t = (name + ' ' + cat).toLowerCase()
  if (t.includes('lamp') || t.includes('light')) return 'lamp'
  if (t.includes('phone') || t.includes('stand') || t.includes('holder')) return 'phone'
  if (t.includes('ear') || t.includes('audio') || t.includes('headphone') || t.includes('sound')) return 'headphones'
  if (t.includes('watch') || t.includes('band') || t.includes('fitness')) return 'watch'
  if (t.includes('mouse') || t.includes('keyboard') || t.includes('electronic') || t.includes('cable')) return 'cpu'
  if (t.includes('shirt') || t.includes('dress') || t.includes('apparel') || t.includes('cloth')) return 'shirt'
  if (t.includes('bag') || t.includes('pack') || t.includes('wallet')) return 'briefcase'
  return 'package'
}

/**
 * Retrieves the current catalogue of products from localStorage, or defaults to demo products.
 */
export function getUserProducts(): ApiProduct[] {
  const saved = localStorage.getItem('ecommind_user_products')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {
      // ignore
    }
  }

  // Default demo products
  return PRODUCTS.map((p) => ({
    sku: p.sku,
    name: p.name,
    category: p.category,
    price: p.price * 100, // paise
    cost: p.cost * 100,
    stock: p.stock,
    avgDailySales: p.avgDailySales,
    returnRate: p.returnRate,
    icon: p.icon,
    paused: !!p.paused,
    coverageDays: p.avgDailySales > 0 ? Math.round((p.stock / p.avgDailySales) * 10) / 10 : 999,
    status: p.stock === 0 ? 'Out of Stock' : p.stock < 15 ? 'Critical' : p.stock < 30 ? 'Low Stock' : 'In Stock',
    marginPct: Math.round(((p.price - p.cost) / p.price) * 1000) / 10,
  }))
}

/**
 * Saves products to localStorage and synchronizes state.
 */
export function saveUserProducts(products: ApiProduct[]): void {
  localStorage.setItem('ecommind_user_products', JSON.stringify(products))
}

/**
 * Retrieves past import batches from localStorage.
 */
export function getStoredImportBatches(): ImportBatch[] {
  const saved = localStorage.getItem('ecommind_import_history')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // ignore
    }
  }
  return []
}

export function saveImportBatch(batch: ImportBatch): void {
  const current = getStoredImportBatches()
  const filtered = current.filter((b) => b.id !== batch.id)
  filtered.unshift(batch)
  localStorage.setItem('ecommind_import_history', JSON.stringify(filtered.slice(0, 100)))
}

/**
 * Processes a client-side import for a CSV file.
 */
export async function processClientImport(
  file: File,
  opts: { dataset?: string; source?: 'import_page' | 'onboarding' } = {},
): Promise<ImportBatch[]> {
  const text = await file.text()
  const { headers, rows } = parseCsv(text)

  if (rows.length === 0) {
    const emptyBatch: ImportBatch = {
      id: 'imp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      dataset: (opts.dataset as ImportBatch['dataset']) || 'products',
      datasetLabel: DATASET_LABELS[opts.dataset || 'products'] || 'Products',
      fileName: file.name,
      sheet: null,
      source: opts.source ?? 'import_page',
      status: 'failed',
      rowsTotal: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      failed: 0,
      imported: 0,
      errors: [{ row: 1, message: 'File contains no valid data rows or empty headers.' }],
      createdAt: new Date().toISOString(),
      duplicate: false,
    }
    saveImportBatch(emptyBatch)
    return [emptyBatch]
  }

  const dataset = (opts.dataset as ImportBatch['dataset']) || detectDataset(headers, file.name)
  const datasetLabel = DATASET_LABELS[dataset] || 'Products'

  const errors: { row: number | null; message: string }[] = []
  let created = 0
  let updated = 0
  let unchanged = 0

  if (dataset === 'products') {
    const existing = getUserProducts()
    const productMap = new Map<string, ApiProduct>()
    for (const p of existing) productMap.set(p.sku.toUpperCase(), p)

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2 // 1-based, accounting for header
      const row = rows[i]

      // Extract SKU
      let sku = (row['sku'] || row['name'] || '').trim().toUpperCase()
      sku = sku.replace(/[^A-Z0-9_-]/g, '-').slice(0, 40)
      if (!sku) {
        errors.push({ row: rowNum, message: 'SKU is required' })
        continue
      }

      // Extract Name
      const name = (row['name'] || row['title'] || `Product ${sku}`).trim().slice(0, 160)

      // Extract Price (paise)
      const rawPrice = cleanNum(row['price'])
      if (rawPrice === null || rawPrice <= 0) {
        errors.push({ row: rowNum, message: `Product "${name}": valid price is required` })
        continue
      }
      const pricePaise = Math.round(rawPrice * 100)

      // Extract Cost (paise)
      const rawCost = cleanNum(row['cost'])
      const costPaise =
        rawCost !== null && rawCost >= 0 ? Math.round(rawCost * 100) : Math.round(pricePaise * 0.6)

      // Extract Stock
      const rawStock = cleanNum(row['stock'])
      const stock = rawStock !== null && rawStock >= 0 ? Math.floor(rawStock) : 0

      // Extract Category
      const category = (row['category'] || 'General').trim().slice(0, 80)

      // Extract Avg Daily Sales
      const rawAds = cleanNum(row['avg_daily_sales'])
      const avgDailySales =
        rawAds !== null && rawAds > 0
          ? Math.round(rawAds * 10) / 10
          : Math.max(1, Math.round((stock / 20) * 10) / 10)

      // Extract Return Rate
      const rawRr = cleanNum(row['return_rate'])
      const returnRate =
        rawRr !== null && rawRr >= 0 ? (rawRr > 1 ? rawRr / 100 : rawRr) : 0.05

      const coverageDays = avgDailySales > 0 ? Math.round((stock / avgDailySales) * 10) / 10 : 999
      const status =
        stock === 0 ? 'Out of Stock' : stock < 15 ? 'Critical' : stock < 30 ? 'Low Stock' : 'In Stock'
      const marginPct =
        pricePaise > 0 ? Math.round(((pricePaise - costPaise) / pricePaise) * 1000) / 10 : 0
      const icon = getProductIcon(name, category)

      const apiProd: ApiProduct = {
        sku,
        name,
        category,
        price: pricePaise,
        cost: costPaise,
        stock,
        avgDailySales,
        returnRate,
        icon,
        paused: false,
        coverageDays,
        status,
        marginPct,
      }

      if (productMap.has(sku)) {
        updated++
      } else {
        created++
      }
      productMap.set(sku, apiProd)
    }

    const updatedList = Array.from(productMap.values())
    saveUserProducts(updatedList)

    // Mark demo loaded and onboarded in active session
    const sessionStr = localStorage.getItem('ecommind_session')
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr)
        if (session.business) {
          session.business.demoLoaded = true
          session.business.onboarded = true
          localStorage.setItem('ecommind_session', JSON.stringify(session))
        }
      } catch {
        // ignore
      }
    }
  } else if (dataset === 'sales') {
    const sales = rows.map((r) => ({
      date: r['date'] || new Date().toISOString().split('T')[0],
      sku: (r['sku'] || '').toUpperCase(),
      units: cleanNum(r['units']) || 0,
      orders: cleanNum(r['orders']) || cleanNum(r['units']) || 0,
      revenue: cleanNum(r['revenue']) ? (cleanNum(r['revenue']) || 0) * 100 : undefined,
    }))
    localStorage.setItem('ecommind_sales_history', JSON.stringify(sales))
    created = sales.length
  } else if (dataset === 'returns') {
    const retList = rows.map((r) => ({
      pincode: (r['pincode'] || '110001').trim(),
      sku: (r['sku'] || '').toUpperCase(),
      orders: cleanNum(r['orders']) || 0,
      returns: cleanNum(r['returns']) || 0,
      city: r['city'] || 'Urban Area',
      returnRate:
        cleanNum(r['orders']) && cleanNum(r['returns'])
          ? Math.round(((cleanNum(r['returns']) || 0) / (cleanNum(r['orders']) || 1)) * 1000) / 1000
          : 0.1,
    }))
    localStorage.setItem('ecommind_returns', JSON.stringify(retList))
    created = retList.length
  } else if (dataset === 'supplier_quotes') {
    const quotes = rows.map((r) => ({
      supplier: r['supplier'] || 'Vendor',
      sku: (r['sku'] || '').toUpperCase(),
      unitPrice: (cleanNum(r['unit_price']) || 0) * 100,
      deliveryDays: cleanNum(r['delivery_days']) || 3,
      moq: cleanNum(r['moq']) || 50,
      availableQty: cleanNum(r['available_qty']) || 1000,
    }))
    localStorage.setItem('ecommind_supplier_quotes', JSON.stringify(quotes))
    created = quotes.length
  } else if (dataset === 'logistics') {
    const quotes = rows.map((r) => ({
      courier: r['courier'] || 'Courier Partner',
      costPer500g: (cleanNum(r['cost_per_500g']) || 45) * 100,
      etaDays: cleanNum(r['eta_days']) || 3,
      service: r['service'] || 'Standard Surface',
      rating: cleanNum(r['rating']) || 4.5,
    }))
    localStorage.setItem('ecommind_logistics', JSON.stringify(quotes))
    created = quotes.length
  } else if (dataset === 'mandate') {
    const mRow = rows[0]
    const mandate = {
      dailyBudget: (cleanNum(mRow?.['daily_budget']) || 75000) * 100,
      maxOrderValue: (cleanNum(mRow?.['max_order_value']) || 60000) * 100,
      maxPerCallCost: (cleanNum(mRow?.['max_per_call_cost']) || 10) * 100,
    }
    localStorage.setItem('ecommind_mandate', JSON.stringify(mandate))
    created = 1
  }

  const imported = created + updated
  const batch: ImportBatch = {
    id: 'imp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    dataset,
    datasetLabel,
    fileName: file.name,
    sheet: null,
    source: opts.source ?? 'import_page',
    status: imported > 0 ? 'completed' : 'failed',
    rowsTotal: rows.length,
    created,
    updated,
    unchanged,
    failed: errors.length,
    imported,
    errors: errors.slice(0, 50),
    createdAt: new Date().toISOString(),
    duplicate: false,
  }

  saveImportBatch(batch)
  return [batch]
}
