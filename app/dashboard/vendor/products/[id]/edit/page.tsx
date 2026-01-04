'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadProductImage, deleteProductImage } from '@/lib/utils/upload'
import { ArrowLeft, Save, Upload, X, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ProductImage {
  id?: string
  file?: File
  preview?: string
  url: string
  isNew?: boolean
  toDelete?: boolean
}

interface ProductVariant {
  id?: string
  name: string
  sku: string
  price: string
  compare_at_price: string
  stock_quantity: string
  attributes: {
    color?: string
    size?: string
    storage?: string
    [key: string]: string | undefined
  }
  isNew?: boolean
  toDelete?: boolean
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [vendor, setVendor] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [images, setImages] = useState<ProductImage[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    sku: '',
    price: '',
    compare_at_price: '',
    stock_quantity: '0',
    is_active: true,
    is_featured: false,
  })

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get vendor
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!vendorData) {
        router.push('/dashboard/vendor')
        return
      }

      setVendor(vendorData)

      // Load product
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('vendor_id', vendorData.id)
        .single()

      if (!productData) {
        alert('Product not found or you do not have permission to edit it.')
        router.push('/dashboard/vendor')
        return
      }

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      setCategories(categoriesData || [])

      // Load product images
      const { data: imagesData } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order')

      if (imagesData) {
        setImages(
          imagesData.map((img) => ({
            id: img.id,
            url: img.image_url,
            isNew: false,
            toDelete: false,
          }))
        )
      }

      // Load product variants
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)

      if (variantsData) {
        setVariants(
          variantsData.map((variant) => ({
            id: variant.id,
            name: variant.name,
            sku: variant.sku || '',
            price: variant.price?.toString() || '',
            compare_at_price: variant.compare_at_price?.toString() || '',
            stock_quantity: variant.stock_quantity.toString(),
            attributes: variant.attributes || {},
            isNew: false,
            toDelete: false,
          }))
        )
      }

      // Set form data
      setFormData({
        name: productData.name,
        description: productData.description || '',
        category_id: productData.category_id || '',
        sku: productData.sku || '',
        price: productData.price.toString(),
        compare_at_price: productData.compare_at_price?.toString() || '',
        stock_quantity: productData.stock_quantity.toString(),
        is_active: productData.is_active,
        is_featured: productData.is_featured,
      })

      setLoading(false)
    }

    loadData()
  }, [productId, router])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`)
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImages((prev) => [
          ...prev,
          {
            file,
            preview: reader.result as string,
            url: reader.result as string,
            isNew: true,
            toDelete: false,
          },
        ])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = async (index: number) => {
    const image = images[index]

    // If it's an existing image, mark for deletion
    if (image.id && !image.isNew) {
      setImages((prev) =>
        prev.map((img, i) => (i === index ? { ...img, toDelete: true } : img))
      )
    } else {
      // If it's a new image, just remove it
      setImages((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const restoreImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, toDelete: false } : img))
    )
  }

  const addVariant = () => {
    setVariants([
      ...variants.filter((v) => !v.toDelete),
      {
        name: '',
        sku: '',
        price: '',
        compare_at_price: '',
        stock_quantity: '0',
        attributes: {},
        isNew: true,
        toDelete: false,
      },
    ])
  }

  const removeVariant = (index: number) => {
    const variant = variants[index]

    // If it's an existing variant, mark for deletion
    if (variant.id && !variant.isNew) {
      setVariants((prev) =>
        prev.map((v, i) => (i === index ? { ...v, toDelete: true } : v))
      )
    } else {
      // If it's a new variant, just remove it
      setVariants((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const restoreVariant = (index: number) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, toDelete: false } : v))
    )
  }

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    )
  }

  const updateVariantAttribute = (
    index: number,
    attributeKey: string,
    value: string
  ) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index
          ? {
              ...variant,
              attributes: { ...variant.attributes, [attributeKey]: value },
            }
          : variant
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setUploadingImages(true)

    const supabase = createClient()

    try {
      // Update product
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description || null,
          category_id: formData.category_id || null,
          sku: formData.sku || null,
          price: parseFloat(formData.price),
          compare_at_price: formData.compare_at_price
            ? parseFloat(formData.compare_at_price)
            : null,
          stock_quantity: parseInt(formData.stock_quantity),
          is_active: formData.is_active,
          is_featured: formData.is_featured,
        })
        .eq('id', productId)

      if (productError) {
        alert('Error updating product: ' + productError.message)
        setSaving(false)
        setUploadingImages(false)
        return
      }

      // Handle images
      const activeImages = images.filter((img) => !img.toDelete)

      // Delete marked images
      for (const image of images) {
        if (image.toDelete && image.id && !image.isNew) {
          try {
            await deleteProductImage(image.url)
            await supabase
              .from('product_images')
              .delete()
              .eq('id', image.id)
          } catch (error: any) {
            console.error('Error deleting image:', error)
          }
        }
      }

      // Upload new images
      const newImages = activeImages.filter((img) => img.isNew && img.file)
      const imageUrls: string[] = []

      for (let i = 0; i < newImages.length; i++) {
        try {
          const url = await uploadProductImage(
            newImages[i].file!,
            productId,
            images.length + i
          )
          imageUrls.push(url)
        } catch (error: any) {
          console.error('Error uploading image:', error)
          const errorMessage = error.message || 'Unknown error occurred'
          alert(`Error uploading image ${i + 1}:\n\n${errorMessage}\n\nPlease check your Supabase Storage setup.`)
          setSaving(false)
          setUploadingImages(false)
          return
        }
      }

      // Save new image records
      if (imageUrls.length > 0) {
        const existingImagesCount = activeImages.filter((img) => !img.isNew).length
        const imageRecords = imageUrls.map((url, index) => ({
          product_id: productId,
          image_url: url,
          alt_text: formData.name,
          sort_order: existingImagesCount + index,
        }))

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageRecords)

        if (imagesError) {
          console.error('Error saving image records:', imagesError)
        }
      }

      // Handle variants
      const activeVariants = variants.filter((v) => !v.toDelete)

      // Delete marked variants
      for (const variant of variants) {
        if (variant.toDelete && variant.id && !variant.isNew) {
          await supabase
            .from('product_variants')
            .delete()
            .eq('id', variant.id)
        }
      }

      // Update existing variants
      for (const variant of activeVariants) {
        if (variant.id && !variant.isNew) {
          await supabase
            .from('product_variants')
            .update({
              name: variant.name,
              sku: variant.sku || null,
              price: variant.price ? parseFloat(variant.price) : null,
              compare_at_price: variant.compare_at_price
                ? parseFloat(variant.compare_at_price)
                : null,
              stock_quantity: parseInt(variant.stock_quantity) || 0,
              attributes:
                Object.keys(variant.attributes).length > 0
                  ? variant.attributes
                  : null,
            })
            .eq('id', variant.id)
        }
      }

      // Create new variants
      const newVariants = activeVariants.filter((v) => v.isNew && v.name.trim() !== '')
      if (newVariants.length > 0) {
        const variantRecords = newVariants.map((variant) => ({
          product_id: productId,
          name: variant.name,
          sku: variant.sku || null,
          price: variant.price ? parseFloat(variant.price) : null,
          compare_at_price: variant.compare_at_price
            ? parseFloat(variant.compare_at_price)
            : null,
          stock_quantity: parseInt(variant.stock_quantity) || 0,
          attributes:
            Object.keys(variant.attributes).length > 0
              ? variant.attributes
              : null,
        }))

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantRecords)

        if (variantsError) {
          console.error('Error creating variants:', variantsError)
          alert('Product updated but variants failed: ' + variantsError.message)
        }
      }

      alert('Product updated successfully!')
      router.push('/dashboard/vendor')
    } catch (error: any) {
      alert('Error: ' + error.message)
      setSaving(false)
      setUploadingImages(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  const visibleImages = images.filter((img) => !img.toDelete)
  const visibleVariants = variants.filter((v) => !v.toDelete)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/vendor"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
                <p className="text-sm text-gray-500">Update product information</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Product Images
            </h2>
            <div className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-500 hover:text-red-600 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Upload More Images
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Upload multiple images. First image will be the main product image.
                </p>
              </div>

              {visibleImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => {
                    if (image.toDelete) return null

                    return (
                      <div
                        key={index}
                        className="relative group border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div className="aspect-square relative">
                          <Image
                            src={image.preview || image.url}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            Main
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Show deleted images with restore option */}
              {images.some((img) => img.toDelete) && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Deleted Images (click to restore):
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {images.map((image, index) => {
                      if (!image.toDelete) return null

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => restoreImage(index)}
                          className="relative w-20 h-20 border-2 border-red-300 rounded-lg overflow-hidden opacity-50 hover:opacity-100 transition-opacity"
                        >
                          <Image
                            src={image.url}
                            alt="Deleted"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                            <X className="w-6 h-6 text-red-600" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (Rs.) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compare at Price (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.compare_at_price}
                  onChange={(e) =>
                    setFormData({ ...formData, compare_at_price: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.stock_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, stock_quantity: e.target.value })
                }
              />
            </div>
          </div>

          {/* Product Variations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Product Variations
              </h2>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Variation
              </button>
            </div>

            {visibleVariants.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No variations added. Click "Add Variation" to create product variants.
              </p>
            ) : (
              <div className="space-y-4">
                {variants.map((variant, index) => {
                  if (variant.toDelete) return null

                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          Variation {index + 1}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Variation Name *
                          </label>
                          <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={variant.name}
                            onChange={(e) =>
                              updateVariant(index, 'name', e.target.value)
                            }
                            placeholder="e.g., Red - Large"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            SKU
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={variant.sku}
                            onChange={(e) =>
                              updateVariant(index, 'sku', e.target.value)
                            }
                            placeholder="e.g., PROD-001-RED-L"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price (Rs.)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={variant.price}
                            onChange={(e) =>
                              updateVariant(index, 'price', e.target.value)
                            }
                            placeholder="Leave empty to use product price"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stock Quantity *
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={variant.stock_quantity}
                            onChange={(e) =>
                              updateVariant(index, 'stock_quantity', e.target.value)
                            }
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Attributes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Attributes (Color, Size, Storage, etc.)
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <input
                              type="text"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              placeholder="Color (e.g., Red)"
                              value={variant.attributes.color || ''}
                              onChange={(e) =>
                                updateVariantAttribute(index, 'color', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              placeholder="Size (e.g., Large)"
                              value={variant.attributes.size || ''}
                              onChange={(e) =>
                                updateVariantAttribute(index, 'size', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              placeholder="Storage (e.g., 256GB)"
                              value={variant.attributes.storage || ''}
                              onChange={(e) =>
                                updateVariantAttribute(index, 'storage', e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Show deleted variants with restore option */}
            {variants.some((v) => v.toDelete) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Deleted Variations (click to restore):
                </p>
                <div className="flex gap-2 flex-wrap">
                  {variants.map((variant, index) => {
                    if (!variant.toDelete) return null

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => restoreVariant(index)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        {variant.name || `Variant ${index + 1}`}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Options</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Product is active</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) =>
                    setFormData({ ...formData, is_featured: e.target.checked })
                  }
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Feature this product</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex gap-4">
              <Link
                href="/dashboard/vendor"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || uploadingImages}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving || uploadingImages ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
