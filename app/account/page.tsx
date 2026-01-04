'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
      setLoading(false)
    }

    loadUser()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return <div className="container-custom py-8">Loading...</div>
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-gray-900">{profile?.full_name || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-gray-900">{profile?.phone || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="text-gray-900 capitalize">{profile?.role || 'customer'}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Quick Links</h2>
            <div className="space-y-2">
              <Link href="/orders" className="block text-red-600 hover:text-red-700">
                My Orders
              </Link>
              <Link href="/account/addresses" className="block text-red-600 hover:text-red-700">
                Saved Addresses
              </Link>
              <Link href="/account/payment-methods" className="block text-red-600 hover:text-red-700">
                Payment Methods
              </Link>
              {profile?.role === 'customer' && (
                <Link href="/dashboard/vendor/request" className="block text-red-600 hover:text-red-700">
                  Become a Vendor
                </Link>
              )}
              {profile?.role === 'vendor' && (
                <Link href="/dashboard/vendor" className="block text-red-600 hover:text-red-700">
                  Vendor Dashboard
                </Link>
              )}
              {profile?.role === 'admin' && (
                <Link href="/dashboard/admin" className="block text-red-600 hover:text-red-700">
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Account Actions</h2>
            <div className="space-y-2">
              <button className="w-full btn-secondary">Edit Profile</button>
              <button className="w-full btn-secondary">Change Password</button>
              <button onClick={handleLogout} className="w-full btn-primary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

