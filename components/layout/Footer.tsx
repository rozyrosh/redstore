import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white mt-12">
      {/* Newsletter Section */}
      <section className="bg-gray-100 py-8">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Stay Updated</h2>
            <p className="text-sm text-gray-600 mb-4">Get the latest deals and offers delivered to your inbox</p>
            <form className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <div className="container-custom py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Customer Care */}
          <div>
            <h3 className="font-bold text-base mb-3">Customer Care</h3>
            <ul className="space-y-1.5 text-sm text-gray-300">
              <li>
                <Link href="/help" className="hover:text-white hover:underline">Help Center</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white hover:underline">Contact Us</Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-white hover:underline">Track My Order</Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white hover:underline">Return Policy</Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white hover:underline">Shipping Info</Link>
              </li>
              <li>
                <Link href="/feedback" className="hover:text-white hover:underline">Feedback</Link>
              </li>
            </ul>
          </div>

          {/* About RedStore */}
          <div>
            <h3 className="font-bold text-base mb-3">About RedStore</h3>
            <ul className="space-y-1.5 text-sm text-gray-300">
              <li>
                <Link href="/about" className="hover:text-white hover:underline">About Us</Link>
              </li>
              <li>
                <Link href="/sustainability" className="hover:text-white hover:underline">Sustainability</Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-white hover:underline">Careers</Link>
              </li>
              <li>
                <Link href="/press" className="hover:text-white hover:underline">Press & News</Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-base mb-3">Legal</h3>
            <ul className="space-y-1.5 text-sm text-gray-300">
              <li>
                <Link href="/terms" className="hover:text-white hover:underline">Terms of Service</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white hover:underline">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/sitemap" className="hover:text-white hover:underline">Site Map</Link>
              </li>
              <li>
                <Link href="/ip" className="hover:text-white hover:underline">Intellectual Property</Link>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="font-bold text-base mb-3">Follow Us</h3>
            <div className="flex gap-3 mb-4">
              <Link href="https://facebook.com" target="_blank" className="hover:text-red-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="https://twitter.com" target="_blank" className="hover:text-red-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="https://instagram.com" target="_blank" className="hover:text-red-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="https://youtube.com" target="_blank" className="hover:text-red-400 transition-colors">
                <Youtube className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-sm text-gray-300 mb-2">Download our app</p>
            <div className="flex gap-2">
              <div className="bg-white text-slate-800 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1">
                <span>🍎</span>
                <span>App Store</span>
              </div>
              <div className="bg-white text-slate-800 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1">
                <span>▶</span>
                <span>Google Play</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>© 2024 RedStore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
