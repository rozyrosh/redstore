# Supabase Storage Setup for Product Images

## Step 1: Create Storage Bucket

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **Storage** in the left sidebar
4. Click **New bucket**
5. Configure the bucket:
   - **Name**: `product-images`
   - **Public bucket**: ✅ **Enable** (check this box)
   - **File size limit**: Leave default or set to 5MB (recommended)
   - **Allowed MIME types**: Leave empty or add: `image/jpeg, image/png, image/webp, image/gif`
6. Click **Create bucket**

## Step 2: Set Up Storage Policies (RLS)

After creating the bucket, you need to set up Row Level Security policies for the storage bucket.

1. Go to **Storage** → **Policies** → Select `product-images` bucket
2. Click **New Policy**
3. Create policies for:

### Policy 1: Allow Public Read Access
- **Policy name**: `Public read access`
- **Allowed operation**: `SELECT`
- **Policy definition**: 
  ```sql
  true
  ```
- **Description**: Allow anyone to view product images

### Policy 2: Allow Authenticated Users to Upload
- **Policy name**: `Authenticated users can upload`
- **Allowed operation**: `INSERT`
- **Policy definition**:
  ```sql
  auth.role() = 'authenticated'
  ```
- **Description**: Allow authenticated users to upload images

### Policy 3: Allow Vendors to Update/Delete Their Images
- **Policy name**: `Vendors can manage their images`
- **Allowed operation**: `UPDATE, DELETE`
- **Policy definition**:
  ```sql
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM products 
    WHERE vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  )
  ```
- **Description**: Allow vendors to update/delete images for their own products

## Alternative: Simple Policy (For Testing)

If the above policies are too complex, you can use a simpler approach for development:

1. Go to **Storage** → **Policies** → `product-images`
2. Click **New Policy** → **For full customization**
3. Use this SQL for all operations (SELECT, INSERT, UPDATE, DELETE):
   ```sql
   auth.role() = 'authenticated'
   ```

⚠️ **Note**: This simpler policy allows any authenticated user to manage all images. Use the more specific policies above for production.

## Step 3: Verify Setup

1. Try uploading a product image through the vendor dashboard
2. Check that the image appears in the Storage bucket
3. Verify the image URL is accessible publicly

## Troubleshooting

### Error: "new row violates row-level security policy"
- Make sure you've created the storage policies as described above
- Check that the bucket is set to **Public**

### Error: "Bucket not found"
- Verify the bucket name is exactly `product-images` (case-sensitive)
- Make sure you're using the correct Supabase project

### Images not displaying
- Check that the bucket is set to **Public**
- Verify the image URLs are correct
- Check browser console for CORS errors

## Production Recommendations

For production, consider:
1. **Image optimization**: Compress images before upload
2. **CDN**: Use Supabase CDN or integrate with Cloudflare/CloudFront
3. **File size limits**: Enforce maximum file sizes (e.g., 2MB)
4. **Image formats**: Convert to WebP for better performance
5. **Backup**: Regularly backup your storage bucket

