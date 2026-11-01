/**
 * Client-side mock and offline fallback engine for EcomMind.
 *
 * When deployed on static hosting (e.g. Vercel) without a running Python backend,
 * this intercepts failed API requests and provides fully functional mock responses,
 * allowing sign-in, demo explore, analytics, inventory, and agent simulations to run seamlessly.
 */

import { SUPPLIERS, LOGISTICS_QUOTES, SERVICE_AGENTS, SEED_ACTIVITY } from '@/data/demo'
import type { MeResponse, ApiProduct, ApiMandate, ApiEvent } from './api'
import { getUserProducts, saveUserProducts, getStoredImportBatches } from './clientImport'

export function getMockApiResponse<T>(path: string, opts: { method?: string; body?: unknown } = {}): T | undefined {
  // Normalize path without query params
  const cleanPath = path.split('?')[0]

  // 1. Authentication
  if (cleanPath === '/api/auth/session') {
    const saved = localStorage.getItem('ecommind_session')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return { authenticated: true, ...parsed } as T
      } catch {
        // ignore
      }
    }
    return { authenticated: false } as T
  }

  if (cleanPath === '/api/auth/login') {
    const body = (opts.body as { email?: string; password?: string }) || {}
    const email = body.email || 'aryan123@gmail.com'
    const namePart = email.split('@')[0] || 'Seller'
    const name = namePart.charAt(0).toUpperCase() + namePart.slice(1)

    const me: MeResponse = {
      user: {
        id: 1,
        name,
        email: email.trim(),
        emailVerified: true,
        isDemo: true,
      },
      business: {
        id: 1,
        name: `${name}’s Ecom Store`,
        category: 'Consumer Electronics & Audio',
        currency: 'INR',
        channel: 'Amazon India · Flipkart',
        onboarded: true,
        demoLoaded: true,
        agentStatus: 'active',
        plan: 'Growth Plan',
        location: {
          text: 'Mumbai, Maharashtra',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          verified: true,
        },
        gstinMasked: '27AABCU9603R1ZM',
        gstinStatus: 'Active',
      },
      verification: { mode: 'optional', providerConfigured: false },
    }
    localStorage.setItem('ecommind_session', JSON.stringify(me))
    return me as T
  }

  if (cleanPath === '/api/auth/demo') {
    const demoMe: MeResponse = {
      user: {
        id: 1,
        name: 'Aryan Khichar',
        email: 'aryan123@gmail.com',
        emailVerified: true,
        isDemo: true,
      },
      business: {
        id: 1,
        name: 'EcomMind Flagship Store',
        category: 'Consumer Electronics & Audio',
        currency: 'INR',
        channel: 'Amazon India · Flipkart · Meesho',
        onboarded: true,
        demoLoaded: true,
        agentStatus: 'active',
        plan: 'Growth Plan',
        location: {
          text: 'Jaipur, Rajasthan',
          city: 'Jaipur',
          state: 'Rajasthan',
          country: 'India',
          verified: true,
        },
        gstinMasked: '08AABCU9603R1ZM',
        gstinStatus: 'Active',
      },
      verification: { mode: 'optional', providerConfigured: false },
    }
    localStorage.setItem('ecommind_session', JSON.stringify(demoMe))
    return demoMe as T
  }

  if (cleanPath === '/api/auth/register') {
    const body = (opts.body as { name?: string; business?: string; email?: string; category?: string; gstin?: string; location?: string }) || {}
    const email = body.email || 'seller@gmail.com'
    const name = body.name || 'Seller'

    const me: MeResponse = {
      user: {
        id: 1,
        name,
        email: email.trim(),
        emailVerified: true,
        isDemo: true,
      },
      business: {
        id: 1,
        name: body.business || 'My EcomMind Store',
        category: body.category || 'General Electronics',
        currency: 'INR',
        channel: 'Amazon India',
        onboarded: true,
        demoLoaded: true,
        agentStatus: 'active',
        plan: 'Growth Plan',
        location: body.location ? { text: body.location, city: null, state: null, country: 'India', verified: true } : null,
        gstinMasked: body.gstin || '27AABCU9603R1ZM',
        gstinStatus: 'Active',
      },
      verification: { mode: 'optional', providerConfigured: false },
    }
    localStorage.setItem('ecommind_session', JSON.stringify(me))
    return me as T
  }

  if (cleanPath === '/api/auth/me') {
    const saved = localStorage.getItem('ecommind_session')
    if (saved) {
      try {
        return JSON.parse(saved) as T
      } catch {
        // ignore
      }
    }
    return getMockApiResponse<T>('/api/auth/demo')
  }

  if (cleanPath === '/api/auth/logout') {
    localStorage.removeItem('ecommind_session')
    return { success: true } as T
  }

  // 2. Catalog & Products
  if (cleanPath === '/api/products') {
    if (opts.method === 'POST' || (opts.body && opts.method !== 'GET')) {
      const b = (opts.body as Partial<ApiProduct>) || {}
      const current = getUserProducts()
      const price = b.price || 10000
      const cost = b.cost || Math.round(price * 0.6)
      const stock = b.stock ?? 0
      const avgDailySales = b.avgDailySales || 2.5
      const sku = (b.sku || `SKU-${Date.now()}`).toUpperCase().trim()
      const newProduct: ApiProduct = {
        sku,
        name: b.name || 'New Product',
        category: b.category || 'General',
        price,
        cost,
        stock,
        avgDailySales,
        returnRate: b.returnRate ?? 0.05,
        icon: b.icon || 'package',
        paused: !!b.paused,
        coverageDays: avgDailySales > 0 ? Math.round((stock / avgDailySales) * 10) / 10 : 999,
        status: stock === 0 ? 'Out of Stock' : stock < 15 ? 'Critical' : stock < 30 ? 'Low Stock' : 'In Stock',
        marginPct: price > 0 ? Math.round(((price - cost) / price) * 1000) / 10 : 0,
      }
      const existingIdx = current.findIndex((p) => p.sku === sku)
      if (existingIdx >= 0) current[existingIdx] = newProduct
      else current.unshift(newProduct)
      saveUserProducts(current)
      return { product: newProduct } as T
    }
    return { products: getUserProducts() } as T
  }

  // 3. Analytics
  if (cleanPath === '/api/analytics/summary') {
    const products = getUserProducts()
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0)
    const inventoryValuation = products.reduce((sum, p) => sum + p.stock * p.cost, 0)
    return {
      revenue: Math.max(148240000, inventoryValuation * 2),
      profit: Math.round(Math.max(148240000, inventoryValuation * 2) * 0.32),
      margin: 34.2,
      orders: Math.max(1420, totalStock * 3),
      ordersTrend: 12.4,
      revenueTrend: 18.2,
      avgOrderValue: 104400,
      returnLosses: 3420000,
      supplierSavings: 6840000,
    } as T
  }

  if (cleanPath === '/api/analytics/daily') {
    const series = []
    const now = Date.now()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000)
      const dateStr = d.toISOString().split('T')[0]
      const rev = 42000 + Math.floor(Math.sin(i * 0.4) * 8000 + (30 - i) * 600)
      series.push({
        date: dateStr,
        revenue: rev * 100,
        profit: Math.round(rev * 0.34) * 100,
        orders: Math.floor(rev / 1100),
      })
    }
    return { series } as T
  }

  if (cleanPath === '/api/analytics/inventory') {
    const products = getUserProducts().map((p) => ({
      sku: p.sku,
      name: p.name,
      stock: p.stock,
      cost: p.cost,
      price: p.price,
      valuation: p.stock * p.cost,
      coverageDays: p.coverageDays,
      status: p.status,
      reorderQty: Math.round(p.avgDailySales * 15),
      potentialRevenue: p.stock * p.price,
    }))
    return { products } as T
  }

  if (cleanPath === '/api/analytics/recommendations') {
    return {
      recommendations: [
        {
          id: 'REC-1',
          priority: 'High',
          sku: 'LED-005',
          title: 'Restock LED Desk Lamp Immediately',
          reason: 'Coverage is down to 4 days with Diwali surge approaching in 3 weeks.',
          impact: 'Reclaims ₹18,400 potential lost sales',
          impactValue: 1840000,
          action: 'Dispatch RFQ to Surat Electronics Wholesale',
        },
        {
          id: 'REC-2',
          priority: 'Medium',
          sku: 'PHN-003',
          title: 'Block High-Return Pincode 110006',
          reason: 'Return rate reached 38% over last 14 days, primarily COD orders.',
          impact: 'Saves ₹4,200 in return freight write-offs',
          impactValue: 420000,
          action: 'Enable mandatory OTP pre-verification',
        },
        {
          id: 'REC-3',
          priority: 'Low',
          sku: 'EAR-001',
          title: 'Increase Margin via +₹50 Repricing',
          reason: 'Amazon competitor raised price to ₹1,599; our sales velocity remains top 5%.',
          impact: '+3.4% Gross Margin expansion',
          impactValue: 950000,
          action: 'Autonomous repricing executed',
        },
      ],
    } as T
  }

  if (cleanPath === '/api/analytics/returns') {
    const custom = localStorage.getItem('ecommind_returns')
    if (custom) {
      try {
        const list = JSON.parse(custom)
        if (Array.isArray(list) && list.length > 0) {
          const totalOrders = list.reduce((s, r) => s + (r.orders || 0), 0)
          const totalReturns = list.reduce((s, r) => s + (r.returns || 0), 0)
          return {
            pincodes: list.map((r) => ({
              pincode: r.pincode,
              city: r.city || 'Urban Area',
              orders: r.orders || 0,
              returns: r.returns || 0,
              returnRate: r.orders ? Math.round((r.returns / r.orders) * 1000) / 1000 : 0.05,
              risk: (r.returns / (r.orders || 1)) > 0.25 ? 'High' : (r.returns / (r.orders || 1)) > 0.1 ? 'Medium' : 'Low',
            })),
            totalReturns,
            returnRate: totalOrders ? Math.round((totalReturns / totalOrders) * 1000) / 1000 : 0.08,
          } as T
        }
      } catch {
        // ignore
      }
    }
    return {
      pincodes: [
        { pincode: '110006', city: 'Delhi', orders: 120, returns: 45, returnRate: 0.38, risk: 'High' },
        { pincode: '700001', city: 'Kolkata', orders: 85, returns: 28, returnRate: 0.33, risk: 'High' },
        { pincode: '400001', city: 'Mumbai', orders: 340, returns: 14, returnRate: 0.04, risk: 'Low' },
        { pincode: '560001', city: 'Bengaluru', orders: 290, returns: 11, returnRate: 0.038, risk: 'Low' },
      ],
      totalReturns: 142,
      returnRate: 0.082,
    } as T
  }

  if (cleanPath === '/api/analytics/logistics') {
    const custom = localStorage.getItem('ecommind_logistics')
    if (custom) {
      try {
        const quotes = JSON.parse(custom)
        if (Array.isArray(quotes) && quotes.length > 0) {
          return {
            quotes: quotes.map((q, idx) => ({
              id: 'L-' + (idx + 1),
              courier: q.courier,
              costPer500g: q.costPer500g,
              etaDays: q.etaDays,
              service: q.service || 'Standard Surface',
              rating: q.rating || 4.5,
            })),
            recommended: 'L-1',
            method: 'Least-cost courier partner',
          } as T
        }
      } catch {
        // ignore
      }
    }
    return {
      quotes: LOGISTICS_QUOTES.map((q) => ({ ...q, costPer500g: q.costPer500g * 100 })),
      recommended: 'L-1',
      method: 'Least-cost 48hr delivery SLA',
    } as T
  }

  // 4. Activity & Events
  if (cleanPath === '/api/activity/events') {
    const items: ApiEvent[] = SEED_ACTIVITY.map((e, idx) => ({
      id: idx + 1,
      time: e.time,
      agent: e.agent,
      action: e.action,
      product: e.product || null,
      amount: e.amount ? e.amount * 100 : null,
      status: e.status,
      detail: e.detail || null,
      ref: null,
    }))
    return { items, total: items.length } as T
  }

  if (cleanPath === '/api/activity/overview') {
    return {
      executionsCount: 42,
      totalCost: 18400,
      savedHours: 18.5,
      activeAgents: 3,
    } as T
  }

  if (cleanPath === '/api/activity/transactions') {
    return {
      items: [
        {
          id: 'TXN-101',
          time: new Date().toISOString(),
          kind: 'topup',
          amount: 5000000,
          status: 'Completed',
          signature: '0x8f9c...4e21',
          memo: 'Wallet initial seed balance',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 15,
    } as T
  }

  if (cleanPath === '/api/activity/reports') {
    return {
      reports: [
        { id: 'REP-1', title: 'Monthly GST & Margin Reconciliation', rows: 184 },
        { id: 'REP-2', title: 'RTO Prevention Audit by Indian Pincode', rows: 92 },
      ],
      snapshot: {
        revenue: 148240000,
        agentSpend: 18400,
        highRiskPincodes: 14,
        inEscrow: 5550000,
      },
    } as T
  }

  // 5. Mandate
  if (cleanPath === '/api/mandate') {
    const custom = localStorage.getItem('ecommind_mandate')
    let base = {
      dailyBudget: 5000000,
      maxOrderValue: 2500000,
      maxPerCallCost: 1000,
    }
    if (custom) {
      try {
        const parsed = JSON.parse(custom)
        if (parsed.dailyBudget) base.dailyBudget = parsed.dailyBudget
        if (parsed.maxOrderValue) base.maxOrderValue = parsed.maxOrderValue
        if (parsed.maxPerCallCost) base.maxPerCallCost = parsed.maxPerCallCost
      } catch {
        // ignore
      }
    }
    const mandate: ApiMandate = {
      dailyBudget: base.dailyBudget,
      maxOrderValue: base.maxOrderValue,
      maxPerCallCost: base.maxPerCallCost,
      walletDailyLimit: 10000000,
      maxPriceChangePct: 15,
      minGrossMarginPct: 22,
      autoPauseReturnPct: 25,
      autoPurchasing: true,
      autoNegotiation: true,
      autoRepricing: true,
      approvalAboveLimit: true,
      agentsPaused: false,
      maxDiscountPct: 20,
      pricingMode: 'autonomous',
      autonomyLevel: 2,
    }
    return { mandate, today: { consumed: 840000 } } as T
  }

  // 6. Marketplaces & Orders
  if (cleanPath === '/api/marketplaces') {
    return {
      marketplaces: [
        { id: 'amazon', name: 'Amazon India', listings: 14, connected: true, status: 'Active' },
        { id: 'flipkart', name: 'Flipkart', listings: 9, connected: true, status: 'Active' },
        { id: 'meesho', name: 'Meesho', listings: 5, connected: true, status: 'Active' },
        { id: 'shopify', name: 'Shopify Store', listings: 12, connected: true, status: 'Active' },
      ],
    } as T
  }

  if (cleanPath === '/api/orders' || cleanPath === '/api/orders/summary') {
    return {
      orders: [],
      summary: {
        totalOrders: 1420,
        revenue: 148240000,
        returns: 114,
        averageValue: 104400,
      },
    } as T
  }

  // 7. Wallet
  if (cleanPath === '/api/wallet') {
    return {
      balance: 5000000,
      dailyLimit: 10000000,
      currency: 'INR',
      dailyConsumed: 840000,
    } as T
  }

  // 8. Suppliers & Service Agents
  if (cleanPath === '/api/suppliers') {
    const custom = localStorage.getItem('ecommind_supplier_quotes')
    if (custom) {
      try {
        const quotes = JSON.parse(custom)
        if (Array.isArray(quotes) && quotes.length > 0) {
          const map = new Map<string, any>()
          for (let i = 0; i < quotes.length; i++) {
            const q = quotes[i]
            const sName = q.supplier || 'Vendor Partner'
            if (!map.has(sName)) {
              map.set(sName, {
                id: `sup-${i + 1}`,
                name: sName,
                category: 'Wholesale & Components',
                rating: 4.8,
                verified: true,
                pincode: '400001',
                activeContracts: 1,
              })
            }
          }
          return { suppliers: Array.from(map.values()) } as T
        }
      } catch {
        // ignore
      }
    }
    return { suppliers: SUPPLIERS } as T
  }

  if (cleanPath === '/api/service-agents') {
    return {
      agents: SERVICE_AGENTS.map((a) => ({
        ...a,
        pricePerCall: a.pricePerCall * 100,
      })),
    } as T
  }

  // 9. Escrow
  if (cleanPath === '/api/escrows' || cleanPath === '/api/escrows/summary') {
    return {
      escrows: [],
      summary: {
        byStatus: {
          pending: { count: 0, amount: 0 },
          locked: { count: 1, amount: 5550000 },
          dispatched: { count: 0, amount: 0 },
          delivered: { count: 0, amount: 0 },
          released: { count: 3, amount: 14200000 },
          refunded: { count: 0, amount: 0 },
          cancelled: { count: 0, amount: 0 },
        },
        held: 5550000,
        heldCount: 1,
        awaitingFunds: 0,
        released: 14200000,
        refunded: 0,
        total: 19750000,
      },
    } as T
  }

  // 10. Negotiations
  if (cleanPath === '/api/negotiations') {
    return { negotiations: [] } as T
  }

  if (cleanPath === '/api/business/profile') {
    return {
      name: 'EcomMind Store',
      gstin: '27AABCU9603R1ZM',
      state: 'Maharashtra',
      city: 'Mumbai',
    } as T
  }

  if (cleanPath === '/api/business/onboarding') {
    const body = (opts.body as { business?: string; category?: string; currency?: string; channel?: string; businessType?: string; gstin?: string; location?: { text?: string } }) || {}
    const savedStr = localStorage.getItem('ecommind_session')
    let currentMe: MeResponse = getMockApiResponse<MeResponse>('/api/auth/demo')!
    if (savedStr) {
      try { currentMe = JSON.parse(savedStr) } catch { /* ignore */ }
    }
    const updatedBiz = {
      ...currentMe.business,
      id: currentMe.business?.id || 1,
      name: body.business || currentMe.business?.name || 'My EcomMind Store',
      category: body.category || currentMe.business?.category || 'General Electronics',
      currency: body.currency || 'INR',
      channel: body.channel || 'Amazon India',
      businessType: body.businessType || currentMe.business?.businessType || 'Retail',
      onboarded: true,
      demoLoaded: true,
      agentStatus: 'active' as const,
      plan: 'Growth Plan',
      gstinMasked: body.gstin || '27AABCU9603R1ZM',
      gstinStatus: 'Active',
      location: body.location?.text ? { text: body.location.text, city: null, state: null, country: 'India', verified: true } : currentMe.business?.location || null,
    }
    const updatedMe: MeResponse = {
      ...currentMe,
      business: updatedBiz,
    }
    localStorage.setItem('ecommind_session', JSON.stringify(updatedMe))
    return updatedMe as T
  }

  if (cleanPath === '/api/demo/load') {
    const sessionStr = localStorage.getItem('ecommind_session')
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr)
        if (session.business) session.business.demoLoaded = true
        localStorage.setItem('ecommind_session', JSON.stringify(session))
      } catch {
        // ignore
      }
    }
    return { success: true } as T
  }

  if (cleanPath === '/api/imports') {
    const batches = getStoredImportBatches()
    return {
      batches,
      datasets: [
        { key: 'products', label: 'Products', required: ['sku', 'name', 'price', 'cost', 'stock'], optional: ['category', 'avg_daily_sales'] },
        { key: 'sales', label: 'Sales history', required: ['date', 'sku', 'units'], optional: ['orders', 'revenue'] },
        { key: 'returns', label: 'Returns by pincode', required: ['pincode', 'sku', 'orders', 'returns'], optional: ['city'] },
        { key: 'supplier_quotes', label: 'Supplier quotes', required: ['supplier', 'sku', 'unit_price', 'delivery_days'], optional: ['moq', 'available_qty', 'valid_until'] },
        { key: 'logistics', label: 'Logistics quotes', required: ['courier', 'cost_per_500g', 'eta_days'], optional: ['service', 'rating', 'cod'] },
        { key: 'mandate', label: 'Seller mandate', required: ['daily_budget', 'max_order_value', 'max_per_call_cost'], optional: [] },
      ],
    } as T
  }

  return undefined
}
