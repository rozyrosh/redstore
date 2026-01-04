'use client'

import { Zap } from 'lucide-react'

export default function FlashSale() {
  return (
    <section className="bg-red-600 text-white py-4">
      <div className="container-custom">
        <div className="flex items-center justify-center gap-2">
          <Zap className="w-5 h-5" />
          <h3 className="text-lg font-bold uppercase">Flash Sale</h3>
          <span className="text-sm">Up to 70% off on selected items - Limited time only!</span>
        </div>
      </div>
    </section>
  )
}
