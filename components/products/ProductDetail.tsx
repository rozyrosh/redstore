'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Star, Heart, ShoppingCart, Minus, Plus } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { Product } from '@/lib/types/database'

interface ProductDetailProps {
  product: Product & {
    images?: Array<{ image_url: string; alt_text?: string }>
    variants?: Array<{ id: string; name: string; price: number; stock_quantity: number; attributes: any }>
    category?: { name: string; slug: string }
    vendor?: { business_name: string; id: string }
  }
  reviews: Array<any>
}

export default function ProductDetail({ product, reviews }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)

  const images = product.images || []
  const mainImage = images[selectedImage]?.image_url || '/placeholder-product.jpg'
  const selectedVariantData = product.variants?.find((v) => v.id === selectedVariant)
  const price = selectedVariantData?.price || product.price
  const stock = selectedVariantData?.stock_quantity || product.stock_quantity

  const handleAddToCart = () => {
    addItem({
      id: selectedVariant ? `${product.id}-${selectedVariant}` : `${product.id}-default`,
      product_id: product.id,
      variant_id: selectedVariant || undefined,
      name: product.name,
      image: mainImage,
      price: Number(price),
      quantity,
      stock,
    })
  }

  const discount = product.compare_at_price
    ? Math.round(((Number(product.compare_at_price) - Number(price)) / Number(product.compare_at_price)) * 100)
    : 0

  return (
    <div className="container-custom py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-6">
        <div className="flex items-center gap-2">
          <a href="/" className="hover:text-red-600">Home</a>
          <span>/</span>
          {product.category && (
            <>
              <a href={`/category/${product.category.slug}`} className="hover:text-red-600">
                {product.category.name}
              </a>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900">{product.name}</span>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden border border-gray-200">
            {images.length > 0 ? (
              <Image
                src={mainImage}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400">No Image Available</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index 
                      ? 'border-red-600 ring-2 ring-red-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={image.image_url}
                    alt={image.alt_text || `${product.name} - Image ${index + 1}`}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {discount > 0 && (
            <span className="inline-block bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold mb-3">
              Save {discount}%
            </span>
          )}
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => {
                const rating = product.rating_average || 0
                return (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : i < rating
                        ? 'fill-yellow-200 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                )
              })}
            </div>
            <span className="text-gray-600 text-sm">
              ({product.rating_count || 0} {product.rating_count === 1 ? 'review' : 'reviews'})
            </span>
            {product.category && (
              <>
                <span className="text-gray-300">|</span>
                <a 
                  href={`/category/${product.category.slug}`}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  {product.category.name}
                </a>
              </>
            )}
          </div>

          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-3xl lg:text-4xl font-bold text-gray-900">
                Rs. {Number(price).toLocaleString()}
              </span>
              {product.compare_at_price && Number(product.compare_at_price) > Number(price) && (
                <span className="text-xl text-gray-500 line-through">
                  Rs. {Number(product.compare_at_price).toLocaleString()}
                </span>
              )}
            </div>
            {product.vendor && (
              <p className="text-sm text-gray-600">
                Sold by: <span className="font-medium text-gray-900">{product.vendor.business_name}</span>
              </p>
            )}
            {stock > 0 ? (
              <p className="text-sm text-green-600 font-medium mt-2">
                ✓ In Stock ({stock} available)
              </p>
            ) : (
              <p className="text-sm text-red-600 font-medium mt-2">
                ✗ Out of Stock
              </p>
            )}
          </div>

          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Select Variant
              </label>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((variant) => {
                  const variantPrice = variant.price || price
                  const variantStock = variant.stock_quantity || 0
                  const isSelected = selectedVariant === variant.id
                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariant(variant.id)
                        setQuantity(1)
                      }}
                      disabled={variantStock === 0}
                      className={`px-4 py-2.5 border-2 rounded-lg font-medium transition-all ${
                        isSelected
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : variantStock === 0
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 hover:border-red-400 hover:bg-red-50 text-gray-700'
                      }`}
                    >
                      <div className="text-left">
                        <div>{variant.name}</div>
                        {variantPrice !== Number(price) && (
                          <div className="text-xs mt-0.5">Rs. {Number(variantPrice).toLocaleString()}</div>
                        )}
                        {variantStock === 0 && (
                          <div className="text-xs mt-0.5 text-red-500">Out of Stock</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">Quantity</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  disabled={quantity >= stock}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-gray-600">
                {stock > 0 ? `${stock} available` : 'Out of stock'}
              </span>
            </div>
          </div>

          <div className="flex gap-4 mb-8">
            <button 
              onClick={handleAddToCart}
              disabled={stock === 0}
              className="flex-1 btn-primary flex items-center justify-center gap-2 h-12 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              {stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <button className="p-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Heart className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {product.description && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Product Description</h2>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                {product.description}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Customer Reviews ({reviews.length})
        </h2>
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-gray-900">
                        {review.user?.full_name || 'Anonymous'}
                      </span>
                      {review.is_verified_purchase && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                          ✓ Verified Purchase
                        </span>
                      )}
                    </div>
                    {review.title && (
                      <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>
                    )}
                    {review.comment && (
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-3">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-2">No reviews yet.</p>
            <p className="text-sm text-gray-500">Be the first to review this product!</p>
          </div>
        )}
      </div>
    </div>
  )
}

