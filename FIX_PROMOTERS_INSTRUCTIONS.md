# 🚀 Fix Promoters Loading Issue - Step by Step Instructions

## Problem
Companies cannot assign promoters to shifts because of "Failed to load promoters data" error.

## Root Cause
The database `profiles` table is missing required columns (`age`, `nationality`, `phone_number`, `unique_code`, etc.) that the frontend expects.

## Solution Steps

### Step 1: Fix the Database Schema
1. **Open Supabase Dashboard**
   - Go to [https://znjtryqrqxjghvvdlvdg.supabase.co](https://znjtryqrqxjghvvdlvdg.supabase.co)
   - Login to your account

2. **Open SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click "New Query"

3. **Run the Database Fix**
   - Copy the entire contents of `MANUAL_DATABASE_FIX.sql`
   - Paste it into the SQL Editor
   - Click "Run" button

### Step 2: Verify the Fix
1. **Check the Query Results**
   - The SQL should run without errors
   - You should see a summary table showing:
     - Total profiles
     - Part-timer profiles  
     - Approved promoters
     - Profiles with unique codes

2. **Test in the Web App**
   - Go to your app at [http://localhost:8081](http://localhost:8081)
   - Login as a company user
   - Try to create a new shift
   - Check if promoters load in the assignment dropdown

### Step 3: Create Test Data (If Needed)
If you don't have any promoters to test with:

1. **Create a Part-timer Account**
   - Go to signup page
   - Register as a "Part-timer" 
   - Complete the signup process

2. **Approve the Promoter**
   - In Supabase Dashboard → Table Editor
   - Open the `profiles` table
   - Find the new user's record
   - Set `verification_status` to `'approved'`
   - Set `role` to `'part_timer'`

## What the Fix Does

✅ **Adds Missing Columns** to profiles table:
- `age`, `nationality`, `phone_number` 
- `unique_code`, `gender`, `address`
- `is_student`, `bank_details`
- `id_card_url`, `profile_photo_url`

✅ **Creates Database Indexes** for performance

✅ **Generates Unique Codes** for all existing users

✅ **Updates RLS Policies** for proper access control

✅ **Creates Auto-generation Triggers** for new profiles

## Expected Results

### Before Fix
- ❌ "Failed to load promoters data" error
- ❌ Empty promoter dropdown
- ❌ Console errors about missing columns

### After Fix  
- ✅ Promoters load successfully
- ✅ Rich promoter information displayed
- ✅ Unique codes visible for easy identification
- ✅ Proper error handling with retry options

## Troubleshooting

### If SQL Fails
- Check for typos when copying the SQL
- Make sure you're connected to the correct database
- Try running sections of the SQL one at a time

### If Promoters Still Don't Load
1. Check browser console for errors
2. Verify the `profiles` table has the new columns
3. Make sure at least one user has:
   - `role = 'part_timer'` or `role = 'promoter'`
   - `verification_status = 'approved'`

### If No Promoters Appear
- Create a test promoter account
- Set their `verification_status` to `'approved'` in the database
- Refresh the shift creation page

## Files Involved

- ✅ **Database Schema**: Fixed via `MANUAL_DATABASE_FIX.sql`
- ✅ **Frontend Hook**: Enhanced `usePromoters.ts` with better error handling
- ✅ **UI Component**: Improved `PromoterSelector.tsx` with error states
- ✅ **Integration**: Updated form components to handle errors

## Success Indicators

1. **Database Query Works**: The test query at the end of the SQL shows data
2. **Web App Loads Promoters**: Dropdown shows available promoters
3. **Error Handling Works**: Retry button appears if there are issues
4. **Assignment Works**: Can successfully assign promoters to shifts

---

**Need Help?** 
- Check the browser console for error messages
- Verify database connection in Supabase dashboard
- Ensure you ran the complete SQL script without errors