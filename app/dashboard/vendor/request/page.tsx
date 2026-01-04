'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function VendorRequestPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    business_name: '',
    business_description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error: requestError } = await supabase
      .from('vendor_requests')
      .insert({
        user_id: user.id,
        business_name: formData.business_name,
        business_description: formData.business_description,
        status: 'pending',
      })

    if (requestError) {
      setError(requestError.message)
      setLoading(false)
    } else {
      alert('Vendor request submitted! Please wait for admin approval.')
      router.push('/')
    }
  }

  return (
    <div className="container-custom py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Request Vendor Access</h1>
        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-2">
              Business Name *
            </label>
            <input
              id="business_name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="business_description" className="block text-sm font-medium text-gray-700 mb-2">
              Business Description *
            </label>
            <textarea
              id="business_description"
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              value={formData.business_description}
              onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}

