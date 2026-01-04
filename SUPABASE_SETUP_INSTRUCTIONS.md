# Supabase Database Setup Instructions

## Your Supabase Project Details
- **Project URL**: https://shzjqsjbhehzsjiepqxt.supabase.co
- **API Key**: sb_publishable_RD-GUzVOBAEYjjg2xleyEA_Ylq4uB7Q

## Step-by-Step Database Setup

### 1. Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: `shzjqsjbhehzsjiepqxt`
3. Click on **SQL Editor** in the left sidebar

### 2. Run Schema File
1. Open the file: `supabase/schema.sql` from this project
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for "Success. No rows returned" message

### 3. Run RLS Policies File
1. Open the file: `supabase/rls.sql` from this project
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run**
5. Wait for "Success. No rows returned" message

### 4. (Optional) Run Seed Data
1. Open the file: `supabase/seed.sql` from this project
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run**

### 5. Verify Setup
1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - users
   - vendors
   - vendor_requests
   - categories
   - products
   - product_variants
   - product_images
   - orders
   - order_items
   - payments
   - reviews
   - carts
   - wishlists
   - customer_addresses
   - customer_payment_methods
   - payouts

### 6. Create Your First Admin User
1. Sign up through the app at http://localhost:3000/signup
2. Go to Supabase Dashboard → **Table Editor** → `users` table
3. Find your user (by email)
4. Click on the row to edit
5. Change `role` from `customer` to `admin`
6. Save

Now you can access `/dashboard/admin` to approve vendor requests!

## Important Notes

⚠️ **Run SQL files in this order:**
1. `schema.sql` first (creates all tables)
2. `rls.sql` second (sets up security)
3. `seed.sql` last (optional, adds sample data)

✅ **After setup:**
- The app will automatically create user profiles when users sign up
- All new users default to 'customer' role
- RLS policies ensure users can only access their own data
- Vendors can request access, admins approve them

## Troubleshooting

**If you get errors:**
- Make sure you run `schema.sql` before `rls.sql`
- Check that all tables were created successfully
- Verify RLS is enabled on all tables (should be automatic)

**If authentication doesn't work:**
- Check that the trigger `on_auth_user_created` was created
- Verify the `users` table has the correct structure
- Make sure your API keys are correct in `.env.local`

