import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProductCard from '@/components/products/ProductCard'

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  // Get category
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!category) {
    notFound()
  }

  // Get products in this category
  const { data: products } = await supabase
    .from('products')
    .select('*, images:product_images(image_url), category:categories(name)')
    .eq('category_id', category.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
      {category.description && (
        <p className="text-gray-600 mb-8">{category.description}</p>
      )}

      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found in this category.</p>
        </div>
      )}
    </div>
  )
}

