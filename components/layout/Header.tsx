'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Search, Home, ShoppingCart, User, Menu, MapPin } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const categories = [
  { name: 'All Categories', slug: '' },
  { name: 'PC & Laptop Zone', slug: 'pc-laptop-zone' },
  { name: 'Mobile Zone', slug: 'mobile-zone' },
  { name: 'TV & Entertainment Zone', slug: 'tv-entertainment-zone' },
  { name: 'Print & Office Zone', slug: 'print-office-zone' },
  { name: 'Home Appliance Zone', slug: 'home-appliance-zone' },
  { name: 'Health & Wellness Zone', slug: 'health-wellness-zone' },
  { name: 'Accessories Zone', slug: 'accessories-zone' },
  { name: 'Deals Zone', slug: 'deals-zone' },
  { name: 'Service & Support Zone', slug: 'service-support-zone' },
]

export default function Header() {
  const pathname = usePathname()
  const itemCount = useCartStore((state) => state.getItemCount())
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  return (
    <>
      {/* Top Bar */}
      <div className="bg-red-800 text-white text-xs py-2">
        <div className="container-custom flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <Link href="/app" className="hover:underline">Download App</Link>
            <span className="text-red-300">|</span>
            <Link href="/customer-service" className="hover:underline">Customer Service</Link>
            <span className="text-red-300">|</span>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Sri Lanka</span>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            {user ? (
              <Link href="/account" className="hover:underline">Account</Link>
            ) : (
              <>
                <Link href="/login" className="hover:underline">Login</Link>
                <span className="text-red-300">|</span>
                <Link href="/signup" className="hover:underline">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <Image
                src="/logo.webp"
                alt="RedStore Logo"
                width={180}
                height={60}
                className="h-14 md:h-16 w-auto"
                priority
              />
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative flex">
                <input
                  type="text"
                  placeholder="Search in RedStore"
                  className="w-full px-5 py-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
                <button className="px-6 bg-red-600 text-white rounded-r-md hover:bg-red-700 flex items-center transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-5 flex-shrink-0">
              <Link href="/" className="flex flex-col items-center gap-1 hover:text-red-600 transition-colors">
                <Home className="w-6 h-6" />
                <span className="text-xs font-medium">Home</span>
              </Link>
              <Link href="/cart" className="flex flex-col items-center gap-1 hover:text-red-600 transition-colors relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="text-xs font-medium">Cart</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {itemCount}
                  </span>
                )}
              </Link>
              <Link href="/account" className="flex flex-col items-center gap-1 hover:text-red-600 transition-colors">
                <User className="w-6 h-6" />
                <span className="text-xs font-medium">Account</span>
              </Link>
              <button
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <nav className="border-t border-gray-200 bg-gray-50 w-full">
          <div className="container-custom w-full">
            <div className="hidden md:flex justify-between items-center py-3 text-sm w-full">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={category.slug ? `/category/${category.slug}` : '/'}
                  className={`whitespace-nowrap hover:text-red-600 transition-colors flex-shrink-0 ${
                    pathname === `/category/${category.slug}` ? 'text-red-600 font-semibold' : 'text-gray-700'
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-2 space-y-1">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={category.slug ? `/category/${category.slug}` : '/'}
                    className="block px-4 py-2 hover:bg-gray-100 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </header>
    </>
  )
}
