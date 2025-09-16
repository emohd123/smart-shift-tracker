# 🚀 Fix Unique Codes Display - IMMEDIATE SOLUTION

## The Problem
The unique codes like `USR7JMF5` and `USRNEUHC` exist in user metadata but don't show in the promoter assignment dropdown because the `profiles` table is missing the `unique_code` column.

## The Solution (2 minutes)

### Step 1: Add the Missing Column
1. **Open Supabase Dashboard**
   - Go to: https://znjtryqrqxjghvvdlvdg.supabase.co
   - Login to your account

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run This SQL**
   ```sql
   -- Add unique_code column to profiles table
   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unique_code TEXT;

   -- Create unique index
   CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_code
   ON public.profiles(unique_code) WHERE unique_code IS NOT NULL;

   -- Update existing profiles with their actual unique codes
   UPDATE public.profiles 
   SET unique_code = 'USRNEUHC'
   WHERE email = 'promoter1@test.com' AND full_name = 'John Smith';

   UPDATE public.profiles 
   SET unique_code = 'USR7JMF5'
   WHERE email = 'promoter2@test.com' AND full_name = 'Sarah Wilson';

   UPDATE public.profiles 
   SET unique_code = 'USRB96Q6'
   WHERE email = 'company1@test.com' AND full_name = 'Test Company';

   -- Verify the updates
   SELECT 
     full_name,
     email,
     role,
     verification_status,
     unique_code
   FROM public.profiles 
   WHERE role IN ('part_timer', 'promoter', 'company_admin')
   ORDER BY role, full_name;
   ```

4. **Click "Run"**
   - You should see a results table showing the updated profiles
   - John Smith should show `USRNEUHC`
   - Sarah Wilson should show `USR7JMF5`

### Step 2: Test the Fix

1. **Go to your app**: [http://localhost:8082](http://localhost:8082)

2. **Login as Company**:
   - Email: `company1@test.com`
   - Password: `testpass123`

3. **Navigate to Shift Creation**:
   - Find the page where you create shifts
   - Look for "Assign Promoters" dropdown

4. **Check the Dropdown**:
   - Click on the promoter assignment dropdown
   - You should now see:
     - **John Smith (USRNEUHC)** ✅
     - **Sarah Wilson (USR7JMF5)** ✅

## What This Fixes

### Before Fix
- ❌ Promoters show without unique codes
- ❌ "Failed to load promoters data" error
- ❌ Companies can't identify promoters by code

### After Fix  
- ✅ Promoters show with unique codes: `USR7JMF5`, `USRNEUHC`
- ✅ Enhanced query works properly
- ✅ Companies can search and assign by unique code
- ✅ Full promoter information displays correctly

## Expected Results

When you open the promoter assignment dropdown, you should see:

```
👥 Available Promoters:
   ✅ John Smith (USRNEUHC)
      25 years • Test Country • promoter1@test.com
   
   ✅ Sarah Wilson (USR7JMF5)  
      25 years • Test Country • promoter2@test.com
```

## If It Still Doesn't Work

1. **Check Browser Console** (F12 → Console tab):
   - Look for "✅ Enhanced query succeeded!" message
   - Should show "2 records found"

2. **Verify Database Update**:
   - In Supabase Dashboard → Table Editor
   - Open `profiles` table
   - Check that `unique_code` column exists and has values

3. **Clear Browser Cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## Troubleshooting

- **"Column does not exist" error**: Run the SQL again
- **No promoters showing**: Check verification_status is 'approved'
- **Still see fallback query**: Clear browser cache and refresh

---

**This should fix the unique codes display immediately!** 🎯

The codes `USR7JMF5` and `USRNEUHC` will now appear properly in the promoter assignment dropdown.