'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Check, X, Users, ShoppingCart, Tag, Settings, Ban, CheckCircle, 
  TrendingUp, DollarSign, Package, Activity, BarChart3, 
  AlertCircle, Eye, Edit, Trash2, Plus, Search, Filter, LogOut
} from 'lucide-react'
import Link from 'next/link'

type TabType = 'dashboard' | 'vendor-requests' | 'vendors' | 'categories' | 'orders' | 'users' | 'commissions'

export default function AdminPanel() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [vendorRequests, setVendorRequests] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingRequests: 0,
    activeProducts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/')
        return
      }

      setUser(user)
      await loadDashboardStats()
      await loadTabData('dashboard')
      setLoading(false)
    }

    loadData()
  }, [router])

  const loadDashboardStats = async () => {
    const supabase = createClient()
    
    const [usersRes, vendorsRes, ordersRes, requestsRes, productsRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('vendors').select('id', { count: 'exact' }),
      supabase.from('orders').select('id, total', { count: 'exact' }),
      supabase.from('vendor_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true),
    ])

    const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0

    setStats({
      totalUsers: usersRes.count || 0,
      totalVendors: vendorsRes.count || 0,
      totalOrders: ordersRes.count || 0,
      totalRevenue,
      pendingRequests: requestsRes.count || 0,
      activeProducts: productsRes.count || 0,
    })
  }

  const loadTabData = async (tab: TabType) => {
    const supabase = createClient()
    
    switch (tab) {
      case 'vendor-requests':
        const { data: requests } = await supabase
          .from('vendor_requests')
          .select('*, user:users(full_name, email)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
        setVendorRequests(requests || [])
        break

      case 'vendors':
        // First get vendors
        const { data: vendorsData, error: vendorsError } = await supabase
          .from('vendors')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (vendorsError) {
          console.error('Error loading vendors:', vendorsError)
          alert(`Error loading vendors: ${vendorsError.message}`)
          setVendors([])
          break
        }

        // Then get user info for each vendor
        if (vendorsData && vendorsData.length > 0) {
          const userIds = vendorsData.map(v => v.user_id)
          const { data: usersData } = await supabase
            .from('users')
            .select('id, full_name, email, role')
            .in('id', userIds)

          // Merge user data with vendor data
          const vendorsWithUsers = vendorsData.map(vendor => ({
            ...vendor,
            user: usersData?.find(u => u.id === vendor.user_id) || null
          }))
          
          console.log('Vendors loaded:', vendorsWithUsers)
          setVendors(vendorsWithUsers)
        } else {
          setVendors([])
        }
        break

      case 'categories':
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true })
        setCategories(categoriesData || [])
        break

      case 'orders':
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*, user:users(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(100)
        setOrders(ordersData || [])
        break

      case 'users':
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        setAllUsers(usersData || [])
        break
    }
  }

  useEffect(() => {
    if (!loading && activeTab !== 'dashboard') {
      loadTabData(activeTab)
    }
  }, [activeTab, loading])

  // Debug: Log vendors when they change
  useEffect(() => {
    if (activeTab === 'vendors') {
      console.log('Current vendors state:', vendors)
    }
  }, [vendors, activeTab])

  const handleApproveVendor = async (requestId: string, userId: string, businessName: string, businessDescription: string) => {
    const supabase = createClient()

    const { error: vendorError } = await supabase
      .from('vendors')
      .insert({
        user_id: userId,
        business_name: businessName,
        business_description: businessDescription,
        is_active: true,
      })

    if (vendorError) {
      alert('Error: ' + vendorError.message)
      return
    }

    await supabase.from('vendor_requests').update({ status: 'approved' }).eq('id', requestId)
    await supabase.from('users').update({ role: 'vendor' }).eq('id', userId)

    // Refresh both vendor requests and vendors list
    loadTabData('vendor-requests')
    loadTabData('vendors')
    loadDashboardStats()
    
    alert('Vendor approved successfully!')
  }

  const handleRejectVendor = async (requestId: string) => {
    const supabase = createClient()
    await supabase.from('vendor_requests').update({ status: 'rejected' }).eq('id', requestId)
    loadTabData('vendor-requests')
    loadDashboardStats()
  }

  const handleSuspendVendor = async (vendorId: string, isActive: boolean) => {
    const supabase = createClient()
    await supabase.from('vendors').update({ is_active: !isActive }).eq('id', vendorId)
    loadTabData('vendors')
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    const supabase = createClient()
    await supabase.from('users').update({ role: newRole }).eq('id', userId)
    loadTabData('users')
    loadDashboardStats()
  }

  const handleUpdateCommission = async (vendorId: string, commissionRate: number) => {
    const supabase = createClient()
    await supabase.from('vendors').update({ commission_rate: commissionRate }).eq('id', vendorId)
    loadTabData('vendors')
  }

  const handleToggleCategory = async (categoryId: string, isActive: boolean) => {
    const supabase = createClient()
    await supabase.from('categories').update({ is_active: !isActive }).eq('id', categoryId)
    loadTabData('categories')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
    { id: 'vendor-requests' as TabType, label: 'Vendor Requests', icon: AlertCircle, badge: stats.pendingRequests },
    { id: 'vendors' as TabType, label: 'Vendors', icon: Users },
    { id: 'categories' as TabType, label: 'Categories', icon: Tag },
    { id: 'orders' as TabType, label: 'Orders', icon: ShoppingCart },
    { id: 'users' as TabType, label: 'Users', icon: Users },
    { id: 'commissions' as TabType, label: 'Commissions', icon: DollarSign },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Manage your marketplace</p>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Back to Store
              </Link>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.push('/')
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-[73px]">
          <nav className="p-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-red-50 text-red-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && tab.badge > 0 && (
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        All time
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalVendors}</p>
                      <p className="text-xs text-gray-500 mt-1">Active sellers</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Package className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
                      <p className="text-xs text-gray-500 mt-1">All time</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <ShoppingCart className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">Rs. {stats.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        All time
                      </p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <DollarSign className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingRequests}</p>
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Needs attention
                      </p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Products</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeProducts}</p>
                      <p className="text-xs text-gray-500 mt-1">In marketplace</p>
                    </div>
                    <div className="bg-indigo-100 p-3 rounded-lg">
                      <Activity className="w-8 h-8 text-indigo-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('vendor-requests')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Review Requests</p>
                      <p className="text-sm text-gray-500">{stats.pendingRequests} pending</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">View Orders</p>
                      <p className="text-sm text-gray-500">{stats.totalOrders} total</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Users className="w-5 h-5 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Manage Users</p>
                      <p className="text-sm text-gray-500">{stats.totalUsers} users</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Vendor Requests Tab */}
          {activeTab === 'vendor-requests' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Vendor Requests</h2>
                  <p className="text-sm text-gray-500 mt-1">Approve or reject vendor applications</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6">
                {vendorRequests.length > 0 ? (
                  <div className="space-y-4">
                    {vendorRequests.map((request) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{request.business_name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Requested by: <span className="font-medium">{request.user?.full_name || request.user?.email}</span>
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(request.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                            <p className="text-gray-700 mt-4 leading-relaxed">{request.business_description}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleApproveVendor(request.id, request.user_id, request.business_name, request.business_description)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectVendor(request.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900">All caught up!</p>
                    <p className="text-sm text-gray-500 mt-1">No pending vendor requests.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vendors Tab */}
          {activeTab === 'vendors' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Manage Vendors</h2>
                  <p className="text-sm text-gray-500 mt-1">View and manage all vendors</p>
                </div>
                <button
                  onClick={() => loadTabData('vendors')}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                {vendors.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Business</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Owner</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Commission</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {vendors.map((vendor) => (
                        <tr key={vendor.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{vendor.business_name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">{vendor.user?.full_name || vendor.user?.email || 'N/A'}</p>
                          </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              defaultValue={vendor.commission_rate}
                              onBlur={(e) => handleUpdateCommission(vendor.id, parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                              step="0.01"
                              min="0"
                              max="100"
                            />
                            <span className="text-sm text-gray-600">%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {vendor.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleSuspendVendor(vendor.id, vendor.is_active)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              vendor.is_active
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                          >
                            {vendor.is_active ? (
                              <>
                                <Ban className="w-4 h-4" />
                                Suspend
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Activate
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">No vendors found</p>
                    <p className="text-sm text-gray-500">Approved vendor requests will appear here.</p>
                    <button
                      onClick={() => loadTabData('vendors')}
                      className="mt-4 text-sm text-red-600 hover:text-red-700"
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Manage Categories</h2>
                  <p className="text-sm text-gray-500 mt-1">Organize product categories</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Slug</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{category.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{category.slug}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleCategory(category.id, category.is_active)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            {category.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {categories.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No categories found. Run seed.sql to add categories.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">All Orders</h2>
                  <p className="text-sm text-gray-500 mt-1">View and manage orders</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order #</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{order.order_number}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{order.user?.full_name || order.user?.email || 'Guest'}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">Rs. {Number(order.total).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            <Eye className="w-4 h-4 inline mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No orders found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Manage Users</h2>
                  <p className="text-sm text-gray-500 mt-1">View and manage user accounts</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{user.full_name || 'Not set'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{user.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                          >
                            <option value="customer">Customer</option>
                            <option value="vendor">Vendor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            <Eye className="w-4 h-4 inline mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allUsers.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No users found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Commissions Tab */}
          {activeTab === 'commissions' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Commission Management</h2>
                <p className="text-sm text-gray-600">
                  Manage commission rates for vendors. Commission rates can be adjusted individually in the Vendors section.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Default Commission Rate</h3>
                <p className="text-sm text-blue-700">
                  The default commission rate for new vendors is <strong>10%</strong>. You can adjust individual vendor commission rates in the "Vendors" section.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('vendors')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Go to Manage Vendors
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
