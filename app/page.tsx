import HeroSection from '@/components/home/HeroSection'
import CategoryGrid from '@/components/home/CategoryGrid'
import FlashSale from '@/components/home/FlashSale'
import ProductCard from '@/components/products/ProductCard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch featured products
  const { data: products } = await supabase
    .from('products')
    .select('*, images:product_images(image_url), category:categories(name)')
    .eq('is_active', true)
    .eq('is_featured', true)
    .not('slug', 'is', null)
    .limit(6)
    .order('created_at', { ascending: false })

  return (
    <>
      <HeroSection />
      <CategoryGrid />
      <FlashSale />
      
      {/* Just For You Section */}
      <section className="py-10 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Just For You</h2>
          {products && products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No featured products yet.</p>
              <p className="text-sm text-gray-400">Products will appear here once added to the database.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
