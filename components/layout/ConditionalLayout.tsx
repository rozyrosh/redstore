'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/dashboard/admin')
  const isVendorRoute = pathname?.startsWith('/dashboard/vendor')

  if (isAdminRoute || isVendorRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {children}
      </main>
      <Footer />
    </>
  )
}

