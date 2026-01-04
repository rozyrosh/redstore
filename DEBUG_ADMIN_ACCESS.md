# Debugging Admin Access Issues

## Problem
When accessing `/dashboard/admin`, you're being redirected to the home page.

## Possible Causes

### 1. User Profile Not Found
- The user might not exist in the `public.users` table
- The trigger might not have run when you signed up

**Solution:**
- Go to Supabase Dashboard → Table Editor → `users` table
- Check if your user exists (by email)
- If not, manually create it:
  ```sql
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    'your-auth-user-id-from-auth-users-table',
    'your-email@example.com',
    'Your Name',
    'admin'
  );
  ```

### 2. Role Not Set to 'admin'
- Your role might still be 'customer'

**Solution:**
- Go to Supabase Dashboard → Table Editor → `users` table
- Find your user
- Change `role` from `customer` to `admin`
- Save

### 3. Database Not Set Up
- The `users` table might not exist
- RLS policies might be blocking access

**Solution:**
- Make sure you've run `supabase/schema.sql`
- Make sure you've run `supabase/rls.sql`
- Check that the `users` table exists in Supabase

### 4. Session/Cookie Issues
- Your session might have expired
- Cookies might not be set correctly

**Solution:**
- Log out and log back in
- Clear browser cookies and try again
- Check browser console for errors

## Quick Check Steps

1. **Check if you're logged in:**
   - Go to `/account`
   - If you see your profile, you're logged in
   - Check what role is displayed

2. **Check database:**
   - Open Supabase Dashboard
   - Go to Table Editor → `users`
   - Find your user by email
   - Verify `role` is set to `admin`

3. **Check browser console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Try accessing `/dashboard/admin`
   - Look for error messages or console.log outputs

4. **Manual Role Update:**
   ```sql
   -- In Supabase SQL Editor, run:
   UPDATE public.users 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```

## Testing

After fixing, try:
1. Log out completely
2. Log back in
3. Go to `/dashboard/admin`
4. Check browser console for any errors

If still not working, check the browser console - the updated code now logs debug information.

