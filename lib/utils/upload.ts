/**
 * Utility functions for uploading images to Supabase Storage
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Upload a product image to Supabase Storage
 * @param file - The image file to upload
 * @param productId - The product ID
 * @param index - The image index for sorting
 * @returns The public URL of the uploaded image
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  index: number = 0
): Promise<string> {
  const supabase = createClient()

  // Check authentication first
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('You must be logged in to upload images. Please log in and try again.')
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${productId}/${Date.now()}-${index}.${fileExt}`

  // Try to find bucket (case-insensitive check)
  // Note: listBuckets() may fail if user doesn't have permission, so we'll try direct upload first
  let bucketName: string | null = null
  
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (!listError && buckets) {
      // Debug: Log all buckets
      console.log('Available buckets:', buckets.map(b => b.name))
      
      // Find bucket (case-insensitive)
      bucketName = buckets.find(bucket => 
        bucket.name.toLowerCase() === 'product-images'
      )?.name || null
    }
  } catch (err) {
    // If we can't list buckets, try common bucket name variations
    console.warn('Could not list buckets, trying common names:', err)
  }

  // If we couldn't find the bucket, try common variations
  const possibleBucketNames = ['product-images', 'PRODUCT-IMAGES', 'Product-Images']
  if (!bucketName) {
    // Try each possible bucket name
    for (const name of possibleBucketNames) {
      try {
        // Test if bucket exists by trying to get a public URL (doesn't require auth)
        const { error: testError } = await supabase.storage.from(name).list('', { limit: 1 })
        if (!testError) {
          bucketName = name
          break
        }
      } catch {
        // Continue to next name
      }
    }
  }

  // If still no bucket found, use the first possible name and let the error be clearer
  bucketName = bucketName || 'product-images'

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    // Provide more helpful error messages
    if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
      throw new Error(
        `Failed to upload image: Storage bucket "${bucketName}" not found or not accessible. ` +
        `Please ensure the bucket exists in Supabase Dashboard. ` +
        `If your bucket is named "PRODUCT-IMAGES" (uppercase), your storage policies must reference "PRODUCT-IMAGES" exactly (case-sensitive). ` +
        `Current bucket name in code: "${bucketName}". ` +
        `Check: Storage → Buckets → Verify bucket name matches your policies.`
      )
    }
    if (error.message.includes('new row violates row-level security') || error.message.includes('row-level security')) {
      throw new Error(
        `Failed to upload image: Permission denied. ` +
        `Your storage policies may not allow uploads, or the bucket name in policies doesn't match. ` +
        `Bucket name being used: "${bucketName}". ` +
        `Make sure your INSERT policy has: bucket_id = '${bucketName}' (exact case match).`
      )
    }
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path)

  return publicUrl
}

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - The URL of the image to delete
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  const supabase = createClient()

  // Find bucket name (case-insensitive)
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketName = buckets?.find(bucket => 
    bucket.name.toLowerCase() === 'product-images'
  )?.name

  if (!bucketName) {
    throw new Error('Storage bucket "product-images" not found')
  }

  // Extract path from URL (try both lowercase and uppercase)
  let urlParts = imageUrl.split('/product-images/')
  if (urlParts.length < 2) {
    urlParts = imageUrl.split('/PRODUCT-IMAGES/')
  }
  if (urlParts.length < 2) {
    throw new Error('Invalid image URL')
  }

  const filePath = urlParts[1]

  const { error } = await supabase.storage
    .from(bucketName)
    .remove([filePath])

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}

