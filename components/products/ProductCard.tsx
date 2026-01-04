'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { Product } from '@/lib/types/database'

interface ProductCardProps {
  product: Product & {
    images?: Array<{ image_url: string }>
    category?: { name: string }
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const mainImage = product.images?.[0]?.image_url || '/placeholder-product.jpg'

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      id: `${product.id}-default`,
      product_id: product.id,
      name: product.name,
      image: mainImage,
      price: Number(product.price),
      quantity: 1,
      stock: product.stock_quantity,
    })
  }

  const discount = product.compare_at_price
    ? Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100)
    : 0

  const rating = Math.round(product.rating_average * 2) / 2 // Round to nearest 0.5

  // Generate slug if missing, or use product ID as fallback
  const productSlug = product.slug || product.id

  return (
    <Link href={`/products/${productSlug}`} className="card group">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded text-xs font-semibold z-10">
            -{discount}%
          </div>
        )}
        <button 
          className="absolute top-2 right-2 bg-white rounded-full p-1.5 hover:bg-red-50 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.preventDefault()}
        >
          <Heart className="w-3.5 h-3.5 text-gray-600" />
        </button>
        {mainImage && mainImage !== '/placeholder-product.jpg' ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm mb-1.5 line-clamp-2 text-gray-900">{product.name}</h3>
        <div className="flex items-center gap-1 mb-1.5">
          {[...Array(5)].map((_, i) => {
            const starValue = i + 1
            if (starValue <= rating) {
              return <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            } else if (starValue - 0.5 <= rating) {
              return <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />
            } else {
              return <Star key={i} className="w-3 h-3 text-gray-300" />
            }
          })}
          <span className="text-xs text-gray-500 ml-1">({product.rating_count || 0})</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base font-bold text-gray-900">Rs. {Number(product.price).toLocaleString()}</span>
          {product.compare_at_price && (
            <span className="text-xs text-gray-500 line-through">
              Rs. {Number(product.compare_at_price).toLocaleString()}
            </span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </Link>
  )
}
