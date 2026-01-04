import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function OrderSuccessPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single()

  return (
    <div className="container-custom py-16">
      <div className="max-w-2xl mx-auto text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">Order Placed Successfully!</h1>
        {order && (
          <>
            <p className="text-gray-600 mb-2">Order Number: {order.order_number}</p>
            <p className="text-gray-600 mb-8">Total: Rs. {Number(order.total).toLocaleString()}</p>
          </>
        )}
        <div className="flex gap-4 justify-center">
          <Link href="/orders" className="btn-primary">
            View Orders
          </Link>
          <Link href="/" className="btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

