'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, Edit, Trash2, Package, ShoppingCart, TrendingUp, 
  BarChart3, Eye, LogOut, DollarSign
} from 'lucide-react'

type TabType = 'dashboard' | 'products' | 'orders' | 'analytics'

export default function VendorDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [vendor, setVendor] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
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

      setUser(user)

      // Check if user is a vendor
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!vendorData) {
        const { data: request } = await supabase
          .from('vendor_requests')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (!request) {
          router.push('/dashboard/vendor/request')
          return
        } else if (request.status === 'pending') {
          alert('Your vendor request is pending approval.')
          router.push('/')
          return
        } else if (request.status === 'rejected') {
          alert('Your vendor request was rejected.')
          router.push('/')
          return
        }
      }

      setVendor(vendorData)

      // Load products
      if (vendorData) {
        const { data: productsData } = await supabase
          .from('products')
          .select('*, category:categories(name)')
          .eq('vendor_id', vendorData.id)
          .order('created_at', { ascending: false })

        setProducts(productsData || [])
        
        // Calculate stats
        const activeProducts = productsData?.filter(p => p.is_active).length || 0
        
        // Load orders for this vendor
        const { data: ordersData } = await supabase
          .from('order_items')
          .select('order_id, subtotal, order:orders(total)')
          .eq('vendor_id', vendorData.id)

        const totalOrders = new Set(ordersData?.map(o => o.order_id)).size
        const totalRevenue = ordersData?.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) || 0

        setStats({
          totalProducts: productsData?.length || 0,
          activeProducts,
          totalOrders,
          totalRevenue,
        })
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      alert('Error deleting product: ' + error.message)
    } else {
      setProducts(products.filter(p => p.id !== productId))
      setStats(prev => ({
        ...prev,
        totalProducts: prev.totalProducts - 1,
        activeProducts: products.filter(p => p.id !== productId && p.is_active).length,
      }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor dashboard...</p>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return null
  }

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
    { id: 'products' as TabType, label: 'Products', icon: Package },
    { id: 'orders' as TabType, label: 'Orders', icon: ShoppingCart },
    { id: 'analytics' as TabType, label: 'Analytics', icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
              <p className="text-sm text-gray-500">{vendor.business_name}</p>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Back to Store
              </Link>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Vendor</p>
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-red-50 text-red-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
            <Link
              href="/dashboard/vendor/earnings"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
            >
              <DollarSign className="w-5 h-5" />
              <span>Earnings</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Products</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Package className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Products</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeProducts}</p>
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
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <TrendingUp className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/dashboard/vendor/products/new"
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-red-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Add New Product</p>
                      <p className="text-sm text-gray-500">Create a new product listing</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Manage Products</p>
                      <p className="text-sm text-gray-500">{stats.totalProducts} products</p>
                    </div>
                  </button>
                  <Link
                    href="/dashboard/vendor/earnings"
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">View Earnings</p>
                      <p className="text-sm text-gray-500">Rs. {stats.totalRevenue.toLocaleString()}</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Products</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your product listings</p>
                </div>
                <Link
                  href="/dashboard/vendor/products/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </Link>
              </div>
              <div className="overflow-x-auto">
                {products.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-500">{product.category?.name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900">Rs. {Number(product.price).toLocaleString()}</td>
                          <td className="px-6 py-4 text-gray-900">{product.stock_quantity}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Link
                                href={`/dashboard/vendor/products/${product.id}/edit`}
                                className="inline-block text-blue-600 hover:text-blue-700"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-700"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">No products yet</p>
                    <p className="text-sm text-gray-500 mb-4">Get started by adding your first product</p>
                    <Link
                      href="/dashboard/vendor/products/new"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Your First Product
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Orders</h2>
              <p className="text-gray-500">Order management coming soon...</p>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics</h2>
              <p className="text-gray-500">Analytics dashboard coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
