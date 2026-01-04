'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart-store'
import { createClient } from '@/lib/supabase/client'
import { CustomerAddress } from '@/lib/types/database'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const [user, setUser] = useState<any>(null)
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    district: '',
    postal_code: '',
    country: 'Sri Lanka',
    is_default: false,
  })
  const [paymentMethod, setPaymentMethod] = useState<'demo' | 'demo'>('demo')
  const [savePaymentMethod, setSavePaymentMethod] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        loadAddresses()
      }
    })
  }, [])

  const loadAddresses = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('customer_addresses')
      .select('*')
      .order('is_default', { ascending: false })
    
    if (data) {
      setAddresses(data)
      const defaultAddress = data.find((a) => a.is_default)
      if (defaultAddress) {
        setSelectedAddress(defaultAddress.id)
      }
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress && !showNewAddress) {
      alert('Please select or add an address')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      let addressId = selectedAddress
      
      // If new address, save it first
      if (showNewAddress) {
        if (user) {
          const { data: newAddr, error } = await supabase
            .from('customer_addresses')
            .insert({
              ...newAddress,
              user_id: user.id,
            })
            .select()
            .single()
          
          if (error) throw error
          if (newAddr) addressId = newAddr.id
        }
      }

      const address = showNewAddress ? newAddress : addresses.find((a) => a.id === selectedAddress)
      if (!address) throw new Error('Address not found')

      const subtotal = getTotal()
      const shipping = 500
      const tax = subtotal * 0.1
      const total = subtotal + shipping + tax

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          status: 'pending',
          subtotal,
          tax,
          shipping,
          total,
          shipping_address: address,
          billing_address: address,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Get product vendor IDs
      const productIds = items.map((item) => item.product_id)
      const { data: products } = await supabase
        .from('products')
        .select('id, vendor_id')
        .in('id', productIds)

      const productVendorMap = new Map(products?.map((p) => [p.id, p.vendor_id]) || [])

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        vendor_id: productVendorMap.get(item.product_id) || '',
        product_name: item.name,
        product_image: item.image,
        variant_name: null,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Process payment
      const { processDemoPayment } = await import('@/lib/payments/demo-payment')
      const paymentResult = await processDemoPayment(total, order.id, savePaymentMethod)

      if (!paymentResult.success) {
        throw new Error('Payment failed')
      }

      // Save payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          user_id: user?.id || null,
          amount: total,
          status: 'completed',
          provider: 'demo',
          payment_token: paymentResult.payment_token || null,
          transaction_id: paymentResult.transaction_id,
        })

      if (paymentError) throw paymentError

      // Update order status
      await supabase
        .from('orders')
        .update({ status: 'processing' })
        .eq('id', order.id)

      // Save payment method if requested
      if (savePaymentMethod && paymentResult.payment_token && user) {
        await supabase
          .from('customer_payment_methods')
          .insert({
            user_id: user.id,
            provider: 'demo',
            payment_token: paymentResult.payment_token,
            is_default: true,
          })
      }

      clearCart()
      router.push(`/orders/${order.id}/success`)
    } catch (error: any) {
      alert(error.message || 'Failed to place order')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  const subtotal = getTotal()
  const shipping = 500
  const tax = subtotal * 0.1
  const total = subtotal + shipping + tax

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Address Selection */}
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
            {user && addresses.length > 0 && (
              <div className="space-y-2 mb-4">
                {addresses.map((address) => (
                  <label key={address.id} className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={selectedAddress === address.id}
                      onChange={(e) => {
                        setSelectedAddress(e.target.value)
                        setShowNewAddress(false)
                      }}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold">{address.full_name}</p>
                      <p className="text-sm text-gray-600">
                        {address.address_line_1}, {address.city}, {address.district}
                      </p>
                      {address.is_default && (
                        <span className="text-xs text-red-600">Default</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowNewAddress(!showNewAddress)}
              className="text-red-600 hover:text-red-700"
            >
              {showNewAddress ? 'Cancel' : '+ Add New Address'}
            </button>

            {showNewAddress && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="px-3 py-2 border rounded"
                    value={newAddress.full_name}
                    onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    className="px-3 py-2 border rounded"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Address Line 1"
                  className="w-full px-3 py-2 border rounded"
                  value={newAddress.address_line_1}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line_1: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  className="w-full px-3 py-2 border rounded"
                  value={newAddress.address_line_2}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line_2: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    className="px-3 py-2 border rounded"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="District"
                    className="px-3 py-2 border rounded"
                    value={newAddress.district}
                    onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Postal Code"
                    className="px-3 py-2 border rounded"
                    value={newAddress.postal_code}
                    onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newAddress.is_default}
                    onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                  />
                  <span className="text-sm">Set as default address</span>
                </label>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Payment Method</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="demo"
                  checked={paymentMethod === 'demo'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'demo')}
                />
                <div>
                  <p className="font-semibold">Demo Payment</p>
                  <p className="text-sm text-gray-600">For testing purposes only</p>
                </div>
              </label>
            </div>
            {user && (
              <label className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  checked={savePaymentMethod}
                  onChange={(e) => setSavePaymentMethod(e.target.checked)}
                />
                <span className="text-sm">Save payment method for next time</span>
              </label>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Rs. {shipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>Rs. {tax.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

