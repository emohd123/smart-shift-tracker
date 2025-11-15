# Testing Guide for Signup & Authentication

## Step 1: Run SQL Migrations

**IMPORTANT:** You must run the SQL scripts from `SUPABASE_SETUP_INSTRUCTIONS.md` in your Supabase SQL Editor first!

Go to your Supabase project → SQL Editor → Run each script in order (Steps 1-5).

## Step 2: Verify Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. You should see two buckets:
   - `id_cards` (5MB limit, allows JPG/PNG/PDF)
   - `profile_photos` (2MB limit, allows JPG/PNG/WEBP)
3. Check that RLS policies are enabled on both

## Step 3: Test Signup Flow

### Test Case 1: Complete Signup with Files
1. Navigate to the signup page
2. Fill in all required fields:
   - Full Name
   - Email
   - Password (min 6 characters)
   - Choose role (Promoter or Company)
3. Fill in personal details (optional fields)
4. Upload ID card (max 5MB)
5. Upload profile photo (max 2MB)
6. Click Submit
7. ✅ Expected: Success message, redirect to login page

### Test Case 2: Signup Without Files
1. Fill in only required fields (Step 1)
2. Skip file uploads (Step 3)
3. Click Submit
4. ✅ Expected: Success message, redirect to login page

### Test Case 3: Signup with Invalid Files
1. Try uploading a file > 5MB for ID card
2. ✅ Expected: Error message "File size must be less than 5MB"
3. Try uploading a TXT file
4. ✅ Expected: Error message about file type

### Test Case 4: Partial Upload Failure
1. Upload valid ID card
2. Upload invalid profile photo
3. ✅ Expected: Warning about partial upload, but account created

## Step 4: Test Login Flow

1. Use the email and password from signup
2. Click Login
3. ✅ Expected: Redirect to appropriate dashboard based on role:
   - Promoter → Promoter Dashboard
   - Company → Company Dashboard

## Step 5: Test Dashboard Access

### For Promoters:
1. After login, you should see:
   - Welcome message with your name
   - Dashboard stats (shifts, hours, earnings)
   - Upcoming shifts list
   - Certificate generation option
2. Click "View Shifts"
3. ✅ Expected: See available shifts (if any exist)

### For Companies:
1. After login, you should see:
   - Company dashboard
   - Create shift option
   - List of your created shifts
2. Click "Create Shift"
3. ✅ Expected: Shift creation form

## Step 6: Test Certificate Generation

1. From Promoter Dashboard, click "Generate Certificate"
2. Select certificate type
3. ✅ Expected: Certificate generation form with proper options

## Step 7: Test Profile Page

1. Navigate to Profile page
2. ✅ Expected: See your profile data:
   - Full name
   - Email
   - Role
   - Personal details (if provided)
   - Profile photo (if uploaded)
   - ID card status
3. Try updating profile details
4. ✅ Expected: Success message

## Common Issues & Solutions

### Issue: "Failed to fetch" during signup
**Solution:** Run the storage bucket SQL migration (Step 1)

### Issue: "Row level security policy violated"
**Solution:** Ensure all RLS policies were created correctly (check Step 3 in SQL instructions)

### Issue: Files not uploading
**Solution:** 
- Check Storage buckets exist in Supabase
- Verify RLS policies on storage.objects
- Check browser console for specific errors

### Issue: Profile data not saving
**Solution:** 
- Verify the handle_new_user trigger exists
- Check profiles table has all required columns
- Look for errors in Supabase logs

### Issue: Can't see shifts after login
**Solution:** 
- Verify shifts RLS policies are set correctly
- Check user_roles table has your role
- Ensure shifts table has data

## Success Criteria

✅ User can sign up with valid data  
✅ User receives appropriate success/error messages  
✅ Files upload to correct storage buckets  
✅ Profile is created in profiles table  
✅ User role is stored in user_roles table  
✅ User can login after signup  
✅ User is redirected to correct dashboard  
✅ Promoters can view shifts  
✅ Companies can create shifts  
✅ Users can generate certificates  
✅ Profile page displays all user data

## Monitoring & Debugging

### Check Supabase Logs
1. Go to Supabase Dashboard → Logs
2. Check for:
   - Authentication errors
   - Storage errors
   - Database errors
   - Function errors

### Check Browser Console
1. Open DevTools (F12)
2. Look for:
   - Network errors
   - Storage upload failures
   - Authentication errors

### Check Database
```sql
-- Check if user was created
select * from auth.users where email = 'your-email@example.com';

-- Check if profile was created
select * from profiles where email = 'your-email@example.com';

-- Check if role was assigned
select * from user_roles 
join auth.users on user_roles.user_id = users.id 
where users.email = 'your-email@example.com';

-- Check uploaded files
select * from storage.objects 
where bucket_id in ('id_cards', 'profile_photos')
order by created_at desc;
```
