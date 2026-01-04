# RedStore Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     NEXT_PUBLIC_APP_URL=http://localhost:3000
     ```

3. **Set Up Database**
   - Go to your Supabase project → SQL Editor
   - Run these files in order:
     1. `supabase/schema.sql` - Creates all tables and triggers
     2. `supabase/rls.sql` - Sets up Row Level Security
     3. `supabase/seed.sql` - (Optional) Adds sample categories

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open http://localhost:3000

## Creating Your First Admin User

To create an admin user:

1. Sign up a new account through the app
2. Go to Supabase Dashboard → Table Editor → `users` table
3. Find your user and change `role` from `customer` to `admin`
4. Now you can access `/dashboard/admin` to approve vendor requests

## Features Implemented

✅ Authentication (Email/Password + Google OAuth)
✅ User Profiles (Auto-created on signup)
✅ Product Catalog
✅ Shopping Cart (Persistent with Zustand)
✅ Checkout Flow
✅ Demo Payment System
✅ Vendor Request System
✅ Vendor Dashboard
✅ Admin Panel (Vendor Approval)
✅ Row Level Security (RLS)
✅ Product Reviews & Ratings
✅ Category Navigation
✅ Responsive Design

## Next Steps

1. **Add Products**: Use the vendor dashboard or directly insert into the database
2. **Configure Google OAuth**: Set up OAuth in Supabase Dashboard
3. **Add Real Images**: Upload product images to Supabase Storage
4. **Implement PayHere**: Replace demo payment with PayHere integration

## Database Tables

All tables are created with:
- `created_at` and `updated_at` timestamps
- Proper foreign key relationships
- Row Level Security policies
- Indexes for performance

## Important Notes

- **Never store raw card data** - Only payment tokens
- **RLS is enabled** - Users can only access their own data
- **Auto user creation** - Trigger creates profile on auth signup
- **Default role** - All new users are 'customer' by default

## Troubleshooting

### Build Errors
- Make sure Tailwind CSS v3 is installed (not v4)
- Check that all environment variables are set

### Database Errors
- Ensure all SQL files are run in order
- Check RLS policies are applied
- Verify foreign key constraints

### Authentication Issues
- Check Supabase project settings
- Verify redirect URLs in Supabase Dashboard
- Ensure Google OAuth is configured if using it

