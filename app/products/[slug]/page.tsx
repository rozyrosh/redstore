import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProductDetail from '@/components/products/ProductDetail'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  // `params` may be a Promise in some Next.js versions; await it to be safe.
  const resolved = await params

  if (!resolved?.slug) {
    return {
      title: 'Product Not Found',
    }
  }

  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, description')
    .eq('slug', resolved.slug)
    .eq('is_active', true)
    .single()

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  return {
    title: product.name,
    description: product.description || undefined,
  }
}

// Helper function to generate slug from name (must match ProductCard logic)
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  // `params` can be a Promise in some Next.js versions — resolve it first.
  const { slug } = await params
  const supabase = await createClient()

  // Ensure slug exists
  if (!slug) {
    notFound()
  }

  // Try to find product by slug first
  let { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      images:product_images(*),
      variants:product_variants(*),
      category:categories(name, slug),
      vendor:vendors(business_name, id)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  // If not found by slug, try by ID (in case slug is actually an ID)
  if (!product && !error && slug && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
    const { data: productById } = await supabase
      .from('products')
      .select(`
        *,
        images:product_images(*),
        variants:product_variants(*),
        category:categories(name, slug),
        vendor:vendors(business_name, id)
      `)
      .eq('id', slug)
      .eq('is_active', true)
      .maybeSingle()
    
    if (productById) {
      product = productById
    }
  }

  // If still not found, try case-insensitive slug match or match by generated slug from name
  if (!product && !error && slug) {
    const { data: allProducts } = await supabase
      .from('products')
      .select(`
        *,
        images:product_images(*),
        variants:product_variants(*),
        category:categories(name, slug),
        vendor:vendors(business_name, id)
      `)
      .eq('is_active', true)
    
    if (allProducts) {
      // Try matching by database slug first (case-insensitive)
      product = allProducts.find(
        p => p.slug?.toLowerCase() === slug.toLowerCase()
      ) || null

      // If still not found, try matching by generating slug from product name
      if (!product) {
        product = allProducts.find(
          p => generateSlug(p.name) === slug.toLowerCase()
        ) || null
      }
    }
  }

  if (error) {
    console.error('Error fetching product:', error)
  }

  if (!product) {
    // Debug: Log what we tried to find
    console.error('Product not found for slug:', slug)
    const { data: debugProducts } = await supabase
      .from('products')
      .select('id, name, slug, is_active')
      .limit(10)
    console.error('Sample products in DB:', debugProducts)
    // In development show a helpful debug page instead of a 404 so it's
    // easier to diagnose why the product wasn't found (missing env, no
    // products seeded, slug mismatch, etc.). In production keep the
    // existing 404 behavior.
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="container-custom py-20">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <p className="mb-4">No product matched the requested slug: <strong>{slug}</strong></p>
          <p className="mb-6 text-sm text-gray-600">This debug view is shown because the app is running in development mode. Check the Supabase connection and product slugs in your database.</p>
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Supabase query error (if any)</h2>
            <pre className="bg-gray-100 p-3 rounded overflow-auto"><code>{JSON.stringify(error || null, null, 2)}</code></pre>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Sample products (first 10)</h2>
            <pre className="bg-gray-100 p-3 rounded overflow-auto"><code>{JSON.stringify(debugProducts || [], null, 2)}</code></pre>
          </div>
        </div>
      )
    }
    notFound()
  }

  // Fetch reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      user:users(full_name, email)
    `)
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <ProductDetail product={product as any} reviews={reviews || []} />
  )
}

