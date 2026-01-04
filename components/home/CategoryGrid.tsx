'use client'

import Link from 'next/link'
import { Laptop, Smartphone, Tv, Printer, Home, Heart, Lightbulb, Gift, Wrench } from 'lucide-react'

const categories = [
  { name: 'PC & Laptop Zone', slug: 'pc-laptop-zone', icon: Laptop, color: 'bg-blue-100 text-blue-600' },
  { name: 'Mobile Zone', slug: 'mobile-zone', icon: Smartphone, color: 'bg-green-100 text-green-600' },
  { name: 'TV & Entertainment Zone', slug: 'tv-entertainment-zone', icon: Tv, color: 'bg-purple-100 text-purple-600' },
  { name: 'Print & Office Zone', slug: 'print-office-zone', icon: Printer, color: 'bg-indigo-100 text-indigo-600' },
  { name: 'Home Appliance Zone', slug: 'home-appliance-zone', icon: Home, color: 'bg-orange-100 text-orange-600' },
  { name: 'Health & Wellness Zone', slug: 'health-wellness-zone', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  { name: 'Accessories Zone', slug: 'accessories-zone', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Deals Zone', slug: 'deals-zone', icon: Gift, color: 'bg-red-100 text-red-600' },
  { name: 'Service & Support Zone', slug: 'service-support-zone', icon: Wrench, color: 'bg-gray-100 text-gray-600' },
]

export default function CategoryGrid() {
  return (
    <section className="py-10 bg-white">
      <div className="container-custom">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Shop by Category</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="flex flex-col items-center hover:opacity-80 transition-opacity"
              >
                <div className={`${category.color} w-16 h-16 rounded-full flex items-center justify-center mb-2`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xs text-center text-gray-700 font-medium leading-tight">{category.name}</h3>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
