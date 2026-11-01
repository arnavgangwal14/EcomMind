/**
 * Client-side mock and offline fallback engine for EcomMind.
 *
 * When deployed on static hosting (e.g. Vercel) without a running Python backend,
 * this intercepts failed API requests and provides fully functional mock responses,
 * allowing sign-in, demo explore, analytics, inventory, and agent simulations to run seamlessly.
 */

import { PRODUCTS, SUPPLIERS, LOGISTICS_QUOTES, SERVICE_AGENTS, SEED_ACTIVITY } from '@/data/demo'
import type { MeResponse, ApiProduct, ApiMandate, ApiEvent } from './api'

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
    const apiProducts: ApiProduct[] = PRODUCTS.map((p) => ({
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
    return { products: apiProducts } as T
  }

  // 3. Analytics
  if (cleanPath === '/api/analytics/summary') {
    return {
      revenue: 148240000,
      profit: 46200000,
      margin: 34.2,
      orders: 1420,
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
    const products = PRODUCTS.map((p) => ({
      sku: p.sku,
      name: p.name,
      stock: p.stock,
      cost: p.cost * 100,
      price: p.price * 100,
      valuation: p.stock * p.cost * 100,
      coverageDays: p.avgDailySales > 0 ? Math.round((p.stock / p.avgDailySales) * 10) / 10 : 999,
      status: p.stock === 0 ? 'Out of Stock' : p.stock < 15 ? 'Critical' : p.stock < 30 ? 'Low Stock' : 'In Stock',
      reorderQty: p.avgDailySales * 15,
      potentialRevenue: p.stock * p.price * 100,
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
    const mandate: ApiMandate = {
      dailyBudget: 5000000,
      maxOrderValue: 2500000,
      maxPerCallCost: 1000,
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

  if (cleanPath === '/api/imports') {
    return { batches: [] } as T
  }

  return undefined
}
