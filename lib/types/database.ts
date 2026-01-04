// Database types for TypeScript
export type UserRole = 'customer' | 'vendor' | 'admin'
export type VendorRequestStatus = 'pending' | 'approved' | 'rejected'
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type PaymentProvider = 'demo' | 'payhere'

export interface User {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  image_url: string | null
  parent_id: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  user_id: string
  business_name: string
  business_description: string | null
  commission_rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  vendor_id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  sku: string | null
  price: number
  compare_at_price: number | null
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
  rating_average: number
  rating_count: number
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sku: string | null
  price: number | null
  compare_at_price: number | null
  stock_quantity: number
  attributes: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  variant_id: string | null
  image_url: string
  alt_text: string | null
  sort_order: number
  created_at: string
}

export interface CustomerAddress {
  id: string
  user_id: string
  full_name: string
  phone: string
  address_line_1: string
  address_line_2: string | null
  city: string
  district: string
  postal_code: string
  country: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string | null
  order_number: string
  status: OrderStatus
  subtotal: number
  tax: number
  shipping: number
  total: number
  shipping_address: Record<string, any>
  billing_address: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  vendor_id: string
  product_name: string
  product_image: string | null
  variant_name: string | null
  price: number
  quantity: number
  subtotal: number
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  user_id: string | null
  amount: number
  status: PaymentStatus
  provider: PaymentProvider
  payment_token: string | null
  transaction_id: string | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  order_id: string | null
  rating: number
  title: string | null
  comment: string | null
  is_verified_purchase: boolean
  created_at: string
  updated_at: string
}

