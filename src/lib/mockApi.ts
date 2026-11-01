/**
 * Client-side mock and offline fallback engine for EcomMind.
 *
 * When deployed on static hosting (e.g. Vercel) without a running Python backend,
 * this intercepts failed API requests and provides fully functional mock responses,
 * allowing sign-in, demo explore, analytics, inventory, and agent simulations to run seamlessly.
 */

import { SUPPLIERS, LOGISTICS_QUOTES, SERVICE_AGENTS, SEED_ACTIVITY } from '@/data/demo'
import type { MeResponse, ApiProduct, ApiMandate, ApiEvent, ApiRFQ, ApiNegotiation, ApiNegotiationMessage } from './api'
import { getUserProducts, saveUserProducts, getStoredImportBatches } from './clientImport'

function getInitialNegotiations(): ApiNegotiation[] {
  return [
    {
      id: 'neg-101',
      rfqId: 'rfq-101',
      supplierId: 'sup-1',
      supplierName: 'Apex Traders (agent-sup-1)',
      sku: 'EAR-001',
      productName: 'Noise-Cancelling Earbuds Pro',
      quantity: 150,
      status: 'agreed',
      statusLabel: 'Deal agreed',
      latestSupplierPrice: 68000,
      latestBuyerPrice: 68000,
      agreedUnitPrice: 68000,
      supplierDeliveryDays: 4,
      rounds: 3,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      rfq: {
        id: 'rfq-101',
        supplierId: 'sup-1',
        supplierName: 'Apex Traders (agent-sup-1)',
        sku: 'EAR-001',
        productName: 'Noise-Cancelling Earbuds Pro',
        quantity: 150,
        targetUnitPrice: 65000,
        deliveryLocation: 'Bhiwandi Fulfillment Hub, Maharashtra',
        deliveryDays: 5,
        status: 'agreed',
        statusLabel: 'Deal agreed',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      messages: [
        {
          id: 1,
          sender: 'ecommind',
          kind: 'rfq',
          unitPrice: 65000,
          text: 'RFQ submitted for 150 units of Noise-Cancelling Earbuds Pro. Target unit price ₹650.00 with 5-day delivery to Bhiwandi.',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        {
          id: 2,
          sender: 'supplier',
          kind: 'offer',
          unitPrice: 72000,
          text: 'Apex Traders Agent countered at ₹720.00/unit based on component supply availability.',
          createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        },
        {
          id: 3,
          sender: 'ecommind',
          kind: 'counter',
          unitPrice: 68000,
          text: 'EcomMind autonomous counter-offer: ₹680.00/unit with volume commitment and immediate 50% milestone escrow release.',
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        },
        {
          id: 4,
          sender: 'supplier',
          kind: 'accept',
          unitPrice: 68000,
          text: 'Offer accepted at ₹680.00/unit! Delivery scheduled within 4 business days.',
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
      ],
      escrow: {
        id: 'esc-101',
        status: 'locked',
        statusLabel: 'Funds locked in escrow',
        amount: 10200000,
        statusNote: '50% release upon dispatch, 50% upon quality verification',
      },
    },
  ]
}

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

  if (cleanPath === '/api/agent/status') {
    if (opts.method === 'PUT' || (opts.body && opts.method !== 'GET')) {
      const b = (opts.body as { status?: string }) || {}
      const st = (b.status as 'active' | 'paused') || 'active'
      const sessionStr = localStorage.getItem('ecommind_session')
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr)
          if (session.business) {
            session.business.agentStatus = st
            localStorage.setItem('ecommind_session', JSON.stringify(session))
          }
        } catch {
          // ignore
        }
      }
      return { status: st, success: true } as T
    }
    return { status: 'active' } as T
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
      days: 30,
      revenue: Math.max(148240000, inventoryValuation * 2),
      orders: Math.max(1420, totalStock * 3),
      units: Math.max(1850, totalStock * 4),
      profit: Math.round(Math.max(148240000, inventoryValuation * 2) * 0.32),
      avgOrderValue: 104400,
      grossMarginPct: 34.2,
      deltas: {
        revenue: 14.8,
        orders: 12.4,
        units: 11.2,
        profit: 18.5,
      },
      productCount: products.length || 5,
      needsAttention: products.filter((p) => p.stock < 15).length,
      inventoryValue: inventoryValuation || 2500000,
      activeAgents: 3,
      agentsDiscovered: 7,
      walletBalance: 5000000,
      budget: {
        daily: 5000000,
        consumedToday: 840000,
      },
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

  if (cleanPath === '/api/analytics/products') {
    const prods = getUserProducts()
    const productSales = prods.map((p) => {
      const units = Math.max(12, Math.round(p.avgDailySales * 30))
      const revenue = units * p.price
      const profit = units * (p.price - p.cost)
      return {
        sku: p.sku,
        name: p.name,
        category: p.category,
        icon: p.icon,
        units,
        orders: Math.round(units * 0.82),
        revenue,
        profit,
        marginPct: p.marginPct,
      }
    })
    const catMap = new Map<string, number>()
    for (const ps of productSales) {
      catMap.set(ps.category, (catMap.get(ps.category) || 0) + ps.revenue)
    }
    const categories = Array.from(catMap.entries()).map(([name, revenue]) => ({ name, revenue }))
    return { products: productSales, categories } as T
  }

  if (cleanPath === '/api/analytics/wallet-daily') {
    const series = []
    const now = Date.now()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000)
      const dateStr = d.toISOString().split('T')[0]
      series.push({
        date: dateStr,
        amount: Math.round((480 + Math.sin(i) * 110) * 100),
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
    const prods = getUserProducts()
    const byProduct = prods.map((p) => ({
      sku: p.sku,
      name: p.name,
      returnRate: p.returnRate ?? 0.05,
    }))

    const custom = localStorage.getItem('ecommind_returns')
    if (custom) {
      try {
        const list = JSON.parse(custom)
        if (Array.isArray(list) && list.length > 0) {
          const totalOrders = list.reduce((s, r) => s + (r.orders || 0), 0)
          const totalReturns = list.reduce((s, r) => s + (r.returns || 0), 0)
          const pincodes = list.map((r) => {
            const pProd = prods.find((p) => p.sku === r.sku)
            return {
              pincode: r.pincode,
              city: r.city || 'Urban Area',
              sku: r.sku,
              productName: pProd?.name || r.sku,
              orders: r.orders || 0,
              returns: r.returns || 0,
              returnRate: r.orders ? Math.round((r.returns / r.orders) * 1000) / 1000 : 0.05,
              risk: (r.returns / (r.orders || 1)) > 0.25 ? 'High' : (r.returns / (r.orders || 1)) > 0.1 ? 'Medium' : 'Low',
            }
          })
          const highRisk = pincodes.filter((p) => p.returnRate >= 0.2)
          const ovr = totalOrders ? Math.round((totalReturns / totalOrders) * 1000) / 1000 : 0.08
          return {
            overallReturnRate: ovr,
            returnRate: ovr,
            totalReturns,
            pincodes,
            highRisk,
            byProduct,
          } as T
        }
      } catch {
        // ignore
      }
    }
    const defaultPincodes = [
      { pincode: '110006', city: 'Delhi', sku: 'PHN-003', productName: 'Wireless Fast Charger Stand', orders: 120, returns: 45, returnRate: 0.38, risk: 'High' },
      { pincode: '700001', city: 'Kolkata', sku: 'EAR-001', productName: 'Noise-Cancelling Earbuds Pro', orders: 85, returns: 28, returnRate: 0.33, risk: 'High' },
      { pincode: '400001', city: 'Mumbai', sku: 'WAT-002', productName: 'Smart Fitness Tracker Watch', orders: 340, returns: 14, returnRate: 0.04, risk: 'Low' },
      { pincode: '560001', city: 'Bengaluru', sku: 'LED-005', productName: 'Adjustable LED Desk Lamp', orders: 290, returns: 11, returnRate: 0.038, risk: 'Low' },
    ]
    const highRisk = defaultPincodes.filter((p) => p.returnRate >= 0.2)
    return {
      overallReturnRate: 0.082,
      returnRate: 0.082,
      totalReturns: 142,
      pincodes: defaultPincodes,
      highRisk,
      byProduct,
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

  if (cleanPath === '/api/activity/executions') {
    return {
      items: [
        { id: 1, time: new Date().toISOString(), agent: 'Supplier Discovery Agent', function: 'discover_quotes', durationMs: 420, cost: 25, status: 'success' },
        { id: 2, time: new Date(Date.now() - 3600000).toISOString(), agent: 'Price Optimiser Agent', function: 'reprice_listing', durationMs: 180, cost: 15, status: 'success' },
        { id: 3, time: new Date(Date.now() - 7200000).toISOString(), agent: 'Escrow Settlement Agent', function: 'verify_milestone', durationMs: 310, cost: 20, status: 'success' },
      ],
      total: 3,
      page: 1,
      pageSize: 20,
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
        { id: 'amazon', name: 'Amazon India', channel: 'amazon', channelName: 'Amazon India', listings: 14, revenue: 8420000, commissionPct: 15, pendingOrders: 2, connection: 'connected', connectionNote: 'Syncing live', status: 'Active' },
        { id: 'flipkart', name: 'Flipkart', channel: 'flipkart', channelName: 'Flipkart', listings: 9, revenue: 5120000, commissionPct: 13.5, pendingOrders: 1, connection: 'connected', connectionNote: 'Syncing live', status: 'Active' },
        { id: 'meesho', name: 'Meesho', channel: 'meesho', channelName: 'Meesho', listings: 5, revenue: 1284000, commissionPct: 0, pendingOrders: 0, connection: 'connected', connectionNote: 'Syncing live', status: 'Active' },
        { id: 'shopify', name: 'Shopify Store', channel: 'shopify', channelName: 'Shopify Storefront', listings: 12, revenue: 4200000, commissionPct: 2.5, pendingOrders: 0, connection: 'connected', connectionNote: 'Syncing live', status: 'Active' },
      ],
    } as T
  }

  if (cleanPath === '/api/orders' || cleanPath === '/api/orders/summary') {
    return {
      orders: [],
      summary: {
        orders: 1420,
        units: 1850,
        grossRevenue: 148240000,
        commission: 19400000,
        unitsDelivered: 1720,
        netProfit: 47436800,
        netMarginPct: 32.0,
      },
    } as T
  }

  if (cleanPath === '/api/listings') {
    const prods = getUserProducts()
    const listings = prods.flatMap((p, idx) => [
      {
        id: `lst_amz_${p.sku}`,
        channel: 'amazon',
        channelName: 'Amazon India',
        sku: p.sku,
        productName: p.name,
        title: p.name,
        price: p.price,
        mrp: Math.round(p.price * 1.25),
        stock: p.stock,
        status: p.stock === 0 ? 'out_of_stock' : 'active',
        listingStatus: 'active',
        ordersCount: Math.max(10, Math.round(p.avgDailySales * 18)),
        unitsSold: Math.max(12, Math.round(p.avgDailySales * 22)),
        revenue: Math.max(12, Math.round(p.avgDailySales * 22)) * p.price,
      },
      {
        id: `lst_fk_${p.sku}`,
        channel: 'flipkart',
        channelName: 'Flipkart',
        sku: p.sku,
        productName: p.name,
        title: p.name,
        price: Math.round(p.price * 0.98),
        mrp: Math.round(p.price * 1.25),
        stock: p.stock,
        status: p.stock === 0 ? 'out_of_stock' : idx % 3 === 0 ? 'paused' : 'active',
        listingStatus: idx % 3 === 0 ? 'paused' : 'active',
        ordersCount: Math.max(6, Math.round(p.avgDailySales * 10)),
        unitsSold: Math.max(8, Math.round(p.avgDailySales * 12)),
        revenue: Math.max(8, Math.round(p.avgDailySales * 12)) * Math.round(p.price * 0.98),
      },
    ])
    return { listings } as T
  }

  if (cleanPath === '/api/stock-movements') {
    const prods = getUserProducts()
    const movements = prods.slice(0, 8).map((p, i) => ({
      id: i + 1,
      sku: p.sku,
      productName: p.name,
      delta: i % 2 === 0 ? -(12 + i * 2) : 25 + i * 5,
      resultingStock: p.stock,
      kind: i % 2 === 0 ? 'sale' : 'restock',
      channel: i % 2 === 0 ? 'Amazon India' : null,
      reason: i % 2 === 0 ? 'Order fulfilment' : 'Supplier delivery milestone released',
      createdAt: new Date(Date.now() - i * 3600000 * 5).toISOString(),
    }))
    return { movements } as T
  }

  if (cleanPath === '/api/price-history') {
    return { changes: [] } as T
  }

  if (cleanPath === '/api/approvals') {
    return { approvals: [], pendingCount: 0 } as T
  }

  if (cleanPath.startsWith('/api/approvals/') && cleanPath.endsWith('/approve')) {
    return { success: true } as T
  }

  if (cleanPath.startsWith('/api/approvals/') && cleanPath.endsWith('/reject')) {
    return { success: true } as T
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

  if (cleanPath === '/api/wallet/topups') {
    const body = (opts.body as { amount?: number }) || {}
    const amount = body.amount || 500000
    return { success: true, balance: 10000000, added: amount } as T
  }

  // 8. Suppliers & Service Agents
  if (cleanPath === '/api/suppliers') {
    const custom = localStorage.getItem('ecommind_supplier_quotes')
    if (custom) {
      try {
        const quotesList = JSON.parse(custom)
        if (Array.isArray(quotesList) && quotesList.length > 0) {
          const map = new Map<string, any>()
          for (let i = 0; i < quotesList.length; i++) {
            const q = quotesList[i]
            const sName = q.supplier || 'Vendor Partner'
            if (!map.has(sName)) {
              map.set(sName, {
                id: `sup-${map.size + 1}`,
                name: sName,
                agentId: `agent-sup-${map.size + 1}`,
                location: 'Mumbai, Maharashtra',
                rating: 4.8,
                reviews: 24,
                verified: true,
                autoRespond: true,
                catalogue: [],
                quotes: [],
              })
            }
            const s = map.get(sName)
            const sku = q.sku || 'PROD-001'
            if (!s.catalogue.includes(sku)) s.catalogue.push(sku)
            s.quotes.push({
              id: `q-${i + 1}`,
              supplierId: s.id,
              sku,
              unitPrice: q.unitPrice || 45000,
              deliveryDays: q.deliveryDays || 3,
              moq: q.moq || 50,
              available: q.availableQty || q.available || 500,
              validTill: new Date(Date.now() + 30 * 86400000).toISOString(),
            })
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
    const savedNegsStr = localStorage.getItem('ecommind_negotiations')
    if (savedNegsStr) {
      try {
        const parsed = JSON.parse(savedNegsStr)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { negotiations: parsed } as T
        }
      } catch {}
    }
    const initial = getInitialNegotiations()
    try { localStorage.setItem('ecommind_negotiations', JSON.stringify(initial)) } catch {}
    return { negotiations: initial } as T
  }

  if (cleanPath.startsWith('/api/negotiations/') && cleanPath.endsWith('/counter')) {
    const negId = cleanPath.replace('/api/negotiations/', '').replace('/counter', '')
    const body = (opts.body as { unitPrice?: number }) || {}
    const newPrice = body.unitPrice || 150000
    const savedNegsStr = localStorage.getItem('ecommind_negotiations')
    let parsed: ApiNegotiation[] = savedNegsStr ? JSON.parse(savedNegsStr) : getInitialNegotiations()
    const n = parsed.find((x) => x.id === negId)
    if (n) {
      n.latestBuyerPrice = newPrice
      n.rounds += 1
      n.updatedAt = new Date().toISOString()
      n.messages = n.messages || []
      n.messages.push({
        id: n.messages.length + 1,
        sender: 'seller',
        kind: 'counter',
        unitPrice: newPrice,
        text: `Counter-offer updated to ₹${(newPrice / 100).toLocaleString('en-IN')}/unit.`,
        createdAt: new Date().toISOString(),
      })
      const supplierCounter = Math.round(newPrice * 1.02)
      n.latestSupplierPrice = supplierCounter
      n.messages.push({
        id: n.messages.length + 1,
        sender: 'supplier',
        kind: 'offer',
        unitPrice: supplierCounter,
        text: `${n.supplierName.split('—')[0].trim()} countered: bulk price revised to ₹${(supplierCounter / 100).toLocaleString('en-IN')}/unit.`,
        createdAt: new Date().toISOString(),
      })
      try { localStorage.setItem('ecommind_negotiations', JSON.stringify(parsed)) } catch {}
      return n as T
    }
  }

  if (cleanPath.startsWith('/api/negotiations/') && cleanPath.endsWith('/accept')) {
    const negId = cleanPath.replace('/api/negotiations/', '').replace('/accept', '')
    const savedNegsStr = localStorage.getItem('ecommind_negotiations')
    let parsed: ApiNegotiation[] = savedNegsStr ? JSON.parse(savedNegsStr) : getInitialNegotiations()
    const n = parsed.find((x) => x.id === negId)
    if (n) {
      const agreed = n.latestSupplierPrice || n.latestBuyerPrice || 160000
      n.status = 'agreed'
      n.statusLabel = 'Deal agreed'
      n.agreedUnitPrice = agreed
      n.updatedAt = new Date().toISOString()
      n.messages = n.messages || []
      n.messages.push({
        id: n.messages.length + 1,
        sender: 'ecommind',
        kind: 'accept',
        unitPrice: agreed,
        text: `Deal accepted at ₹${(agreed / 100).toLocaleString('en-IN')}/unit. Escrow order initiated.`,
        createdAt: new Date().toISOString(),
      })
      n.escrow = {
        id: `esc_${Date.now()}`,
        status: 'locked',
        statusLabel: 'Funds locked in escrow',
        amount: agreed * n.quantity,
        statusNote: '50% release upon dispatch, 50% upon quality verification',
      }
      try { localStorage.setItem('ecommind_negotiations', JSON.stringify(parsed)) } catch {}
      return n as T
    }
  }

  if (cleanPath.startsWith('/api/negotiations/') && cleanPath.endsWith('/cancel')) {
    const negId = cleanPath.replace('/api/negotiations/', '').replace('/cancel', '')
    const savedNegsStr = localStorage.getItem('ecommind_negotiations')
    let parsed: ApiNegotiation[] = savedNegsStr ? JSON.parse(savedNegsStr) : getInitialNegotiations()
    const n = parsed.find((x) => x.id === negId)
    if (n) {
      n.status = 'cancelled'
      n.statusLabel = 'Cancelled'
      n.updatedAt = new Date().toISOString()
      n.messages = n.messages || []
      n.messages.push({
        id: n.messages.length + 1,
        sender: 'seller',
        kind: 'decline',
        unitPrice: null,
        text: 'Negotiation cancelled by buyer.',
        createdAt: new Date().toISOString(),
      })
      try { localStorage.setItem('ecommind_negotiations', JSON.stringify(parsed)) } catch {}
      return n as T
    }
  }

  if (cleanPath.startsWith('/api/negotiations/')) {
    const negId = cleanPath.replace('/api/negotiations/', '')
    const savedNegsStr = localStorage.getItem('ecommind_negotiations')
    if (savedNegsStr) {
      try {
        const parsed: ApiNegotiation[] = JSON.parse(savedNegsStr)
        const found = parsed.find((x) => x.id === negId)
        if (found) return found as T
      } catch {}
    }
    const initial = getInitialNegotiations()
    const found = initial.find((x) => x.id === negId) || initial[0]
    return found as T
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

  // 11. Google Places & Autocomplete
  if (cleanPath === '/api/places/config') {
    return { enabled: false, verificationRequired: false } as T
  }

  if (cleanPath === '/api/places/autocomplete') {
    return { suggestions: [] } as T
  }

  if (cleanPath.startsWith('/api/places/details')) {
    return {
      formattedAddress: 'Mumbai, Maharashtra, India',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      verified: true,
    } as T
  }

  // 12. RFQs & Product Intelligence
  if (cleanPath === '/api/rfqs') {
    if (opts.body) {
      const b = opts.body as {
        supplierId?: string
        sku?: string
        quantity?: number
        targetUnitPrice?: number | null
        deliveryLocation?: string
        deliveryDays?: number
      }
      const rfqId = `rfq_${Date.now()}`
      const negId = `neg_${Date.now()}`

      // Find supplier name
      let sName = 'BharatSource'
      const customSuppliers = localStorage.getItem('ecommind_supplier_quotes')
      if (customSuppliers) {
        try {
          const list = JSON.parse(customSuppliers)
          const found = list.find((x: any, idx: number) => `sup-${idx + 1}` === b.supplierId || x.supplier === b.supplierId)
          if (found?.supplier) sName = found.supplier
        } catch {}
      }
      if (sName === 'BharatSource' && b.supplierId) {
        const supMatch = SUPPLIERS.find((s) => s.id === b.supplierId)
        if (supMatch) sName = supMatch.name
      }

      // Find product name
      const prods = getUserProducts()
      const prodMatch = prods.find((p) => p.sku === b.sku)
      const pName = prodMatch?.name || (b.sku ? `Product ${b.sku}` : 'Catalog Item')

      const target = b.targetUnitPrice || 165000
      const quotePrice = Math.round(target * 1.03)

      const rfq: ApiRFQ = {
        id: rfqId,
        supplierId: b.supplierId || 'sup-1',
        supplierName: sName,
        sku: b.sku || 'SKU0001',
        productName: pName,
        quantity: b.quantity || 10,
        targetUnitPrice: b.targetUnitPrice ?? null,
        deliveryLocation: b.deliveryLocation || 'Mumbai, Maharashtra',
        deliveryDays: b.deliveryDays || 5,
        status: 'sent',
        statusLabel: 'Quotation requested',
        createdAt: new Date().toISOString(),
      }

      const messages: ApiNegotiationMessage[] = [
        {
          id: 1,
          sender: 'ecommind',
          kind: 'rfq',
          unitPrice: b.targetUnitPrice ?? null,
          text: `RFQ issued for ${b.quantity} units of ${pName}. Target price: ${b.targetUnitPrice ? `₹${(b.targetUnitPrice / 100).toLocaleString('en-IN')}/unit` : 'Supplier catalogue rate'}. Requested delivery in ${b.deliveryDays || 5} days to ${b.deliveryLocation || 'Mumbai'}.`,
          createdAt: new Date(Date.now() - 10000).toISOString(),
        },
        {
          id: 2,
          sender: 'supplier',
          kind: 'offer',
          unitPrice: quotePrice,
          text: `Offer received from ${sName.split('—')[0].trim()} agent: ₹${(quotePrice / 100).toLocaleString('en-IN')}/unit with dispatch commitment in ${b.deliveryDays || 5} days.`,
          createdAt: new Date().toISOString(),
        },
      ]

      const negotiation: ApiNegotiation = {
        id: negId,
        rfqId,
        supplierId: b.supplierId || 'sup-1',
        supplierName: sName,
        sku: b.sku || 'SKU0001',
        productName: pName,
        quantity: b.quantity || 10,
        status: 'negotiation_in_progress',
        statusLabel: 'Negotiation in progress',
        latestSupplierPrice: quotePrice,
        latestBuyerPrice: b.targetUnitPrice ?? target,
        agreedUnitPrice: null,
        supplierDeliveryDays: b.deliveryDays || 5,
        rounds: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rfq,
        messages,
        escrow: null,
      }

      try {
        const existing = localStorage.getItem('ecommind_negotiations')
        const list: ApiNegotiation[] = existing ? JSON.parse(existing) : getInitialNegotiations()
        list.unshift(negotiation)
        localStorage.setItem('ecommind_negotiations', JSON.stringify(list))
      } catch {}

      return { rfq, negotiation } as T
    }

    return { rfqs: [] } as T
  }

  if (cleanPath.startsWith('/api/products/') && cleanPath.endsWith('/intelligence')) {
    const rawSku = cleanPath.replace('/api/products/', '').replace('/intelligence', '')
    const targetSku = decodeURIComponent(rawSku).toUpperCase()
    const prods = getUserProducts()
    const product = prods.find((p) => p.sku.toUpperCase() === targetSku) || prods[0] || {
      sku: 'EAR-001',
      name: 'Noise-Cancelling Earbuds Pro',
      price: 145000,
      cost: 72000,
      stock: 35,
      avgDailySales: 4.2,
      category: 'Audio',
      marginPct: 50.3,
      icon: 'headphones',
    }

    const now = Date.now()
    const series = []
    // 14 days actual history
    for (let i = 14; i >= 1; i--) {
      const d = new Date(now - i * 86400000).toISOString().split('T')[0]
      const actual = Math.max(1, Math.round(product.avgDailySales + Math.sin(i * 0.7) * 2))
      series.push({ date: d, actual })
    }
    // 7 days predicted forecast
    for (let i = 0; i < 7; i++) {
      const d = new Date(now + i * 86400000).toISOString().split('T')[0]
      const predicted = Math.max(1, Math.round((product.avgDailySales + Math.sin(i * 0.5) * 1.5) * 10) / 10)
      series.push({ date: d, predicted })
    }

    const demand7 = Math.round(product.avgDailySales * 7)
    const demand30 = Math.round(product.avgDailySales * 30)
    const recommendedStock = Math.round(product.avgDailySales * 25)
    const reorderQty = Math.max(0, recommendedStock - product.stock)

    const basePrice = product.price || 145000
    const competitors = [
      { channel: 'Amazon India', price: Math.round(basePrice * 1.04) },
      { channel: 'Flipkart', price: Math.round(basePrice * 0.98) },
      { channel: 'Meesho', price: Math.round(basePrice * 1.02) },
    ]
    const lowestCompetitor = Math.min(...competitors.map((c) => c.price))
    const suggestedPrice = Math.round(lowestCompetitor * 1.01)

    return {
      product,
      forecast: {
        series,
        demand7,
        demand30,
        recommendedStock,
        reorderQty,
        confidencePct: 92,
        method: 'Seasonal-naive demand forecast with festival trend weighting',
      },
      pricing: {
        competitors,
        lowestCompetitor,
        suggestedPrice,
        marginNowPct: product.marginPct || 35.0,
        marginAtSuggestedPct: Math.round(((suggestedPrice - product.cost) / suggestedPrice) * 1000) / 10,
        marginFloor: Math.round(product.cost * 1.25),
        limitedBy: null,
        reason: 'Optimal buy-box competitive price 1% above Flipkart baseline.',
      },
      supplierCount: 3,
      bestPrice: Math.round(product.cost * 0.92),
      leadTimeDays: 2,
      recommendation: 'Optimal supplier locked.',
    } as T
  }

  if (cleanPath === '/api/products/prices' || (cleanPath.startsWith('/api/products/') && cleanPath.endsWith('/price'))) {
    return { success: true } as T
  }

  if (cleanPath.startsWith('/api/service-agents/') && cleanPath.endsWith('/calls')) {
    return { success: true } as T
  }

  return undefined
}
