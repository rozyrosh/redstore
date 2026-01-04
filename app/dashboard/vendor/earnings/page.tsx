'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  DollarSign, TrendingUp, Clock, CheckCircle, 
  ArrowLeft, Calendar, Package, FileText
} from 'lucide-react'

interface EarningsStats {
  totalEarnings: number
  paidEarnings: number
  pendingEarnings: number
  thisMonth: number
  lastMonth: number
  thisYear: number
}

interface Payout {
  id: string
  order_id: string
  amount: number
  commission: number
  net_amount: number
  status: string
  paid_at: string | null
  created_at: string
  order: {
    order_number: string
    status: string
    created_at: string
  }
}

export default function VendorEarningsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [vendor, setVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<EarningsStats>({
    totalEarnings: 0,
    paidEarnings: 0,
    pendingEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    thisYear: 0,
  })
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [period, setPeriod] = useState<'all' | 'month' | 'year'>('all')

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Get vendor
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!vendorData) {
        router.push('/dashboard/vendor')
        return
      }

      setVendor(vendorData)

      // Load payouts
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false })

      if (payoutsError) {
        console.error('Error loading payouts:', payoutsError)
        setPayouts([])
      } else {
        // Load order information for each payout
        const payoutIds = (payoutsData || []).map(p => p.order_id)
        let ordersMap: Record<string, any> = {}
        
        if (payoutIds.length > 0) {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id, order_number, status, created_at')
            .in('id', payoutIds)
          
          if (ordersData) {
            ordersMap = ordersData.reduce((acc, order) => {
              acc[order.id] = order
              return acc
            }, {} as Record<string, any>)
          }
        }

        // Merge payout data with order information
        const payoutsWithOrders = (payoutsData || []).map(payout => ({
          ...payout,
          order: ordersMap[payout.order_id] || null
        }))
        
        setPayouts(payoutsWithOrders)
      }

      // Calculate stats (recalculate after setting payouts)
      const allPayouts = payoutsData || []
      if (allPayouts.length > 0) {
        const now = new Date()
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        const thisYearStart = new Date(now.getFullYear(), 0, 1)

        const totalEarnings = allPayouts.reduce((sum, p) => sum + Number(p.net_amount || 0), 0)
        const paidEarnings = allPayouts
          .filter(p => p.status === 'paid' || p.paid_at)
          .reduce((sum, p) => sum + Number(p.net_amount || 0), 0)
        const pendingEarnings = allPayouts
          .filter(p => p.status === 'pending' && !p.paid_at)
          .reduce((sum, p) => sum + Number(p.net_amount || 0), 0)

        const thisMonth = allPayouts
          .filter(p => new Date(p.created_at) >= thisMonthStart)
          .reduce((sum, p) => sum + Number(p.net_amount || 0), 0)

        const lastMonth = allPayouts
          .filter(p => {
            const date = new Date(p.created_at)
            return date >= lastMonthStart && date <= lastMonthEnd
          })
          .reduce((sum, p) => sum + Number(p.net_amount || 0), 0)

        const thisYear = allPayouts
          .filter(p => new Date(p.created_at) >= thisYearStart)
          .reduce((sum, p) => sum + Number(p.net_amount || 0), 0)

        setStats({
          totalEarnings,
          paidEarnings,
          pendingEarnings,
          thisMonth,
          lastMonth,
          thisYear,
        })
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  const filteredPayouts = payouts.filter(payout => {
    // Filter by status
    if (filter === 'paid' && (payout.status !== 'paid' && !payout.paid_at)) return false
    if (filter === 'pending' && (payout.status === 'paid' || payout.paid_at)) return false

    // Filter by period
    if (period === 'month') {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return new Date(payout.created_at) >= monthStart
    }
    if (period === 'year') {
      const now = new Date()
      const yearStart = new Date(now.getFullYear(), 0, 1)
      return new Date(payout.created_at) >= yearStart
    }

    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earnings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/vendor"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
                <p className="text-sm text-gray-500">View your earnings and payouts</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Back to Store
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  Rs. {stats.totalEarnings.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Earnings</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  Rs. {stats.paidEarnings.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Earnings</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  Rs. {stats.pendingEarnings.toLocaleString()}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  Rs. {stats.thisMonth.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Period Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Last Month</h3>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              Rs. {stats.lastMonth.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">This Year</h3>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              Rs. {stats.thisYear.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters and Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
              <div className="flex gap-3">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredPayouts.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Gross Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Net Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {payout.order?.order_number || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {new Date(payout.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        Rs. {Number(payout.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-red-600">
                        -Rs. {Number(payout.commission).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-green-600">
                        Rs. {Number(payout.net_amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payout.status === 'paid' || payout.paid_at
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {payout.status === 'paid' || payout.paid_at ? 'Paid' : 'Pending'}
                        </span>
                        {payout.paid_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Paid: {new Date(payout.paid_at).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">No earnings yet</p>
                <p className="text-sm text-gray-500">
                  Your earnings will appear here once you receive orders
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

