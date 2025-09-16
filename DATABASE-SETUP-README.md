# Supabase Database Auto-Setup

## 🎯 Quick Setup (Automated)

This script will automatically create all necessary database tables and RLS policies to fix the "new row violates row-level security policy for table 'tenants'" error.

### 📋 Prerequisites

1. Get your **Service Role Key** from Supabase:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to **Settings** → **API**
   - Copy the `service_role` key (not the `anon` key)

### 🚀 Option 1: Using Environment Variable (Recommended)

```bash
# Set your service role key
set SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here

# Run the setup
run-setup.bat
```

### 🚀 Option 2: Edit the Script Directly

1. Open `auto-setup-database.js`
2. Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key
3. Run: `node auto-setup-database.js`

### 🚀 Option 3: PowerShell

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="your_actual_service_role_key_here"
node auto-setup-database.js
```

## 🔧 What This Script Does

1. **Creates Missing Tables:**
   - `tenants` - For company data
   - `tenant_memberships` - For user-company relationships
   - Adds `tenant_id` column to existing `profiles` table

2. **Sets Up Row Level Security:**
   - Drops all conflicting/recursive policies
   - Creates simple, working RLS policies
   - Allows authenticated users to create tenants and memberships

3. **Performance Optimizations:**
   - Creates necessary database indexes
   - Sets up timestamp triggers for `updated_at` fields

4. **Tests the Setup:**
   - Verifies tables were created correctly
   - Confirms RLS policies are working

## ✅ Expected Output

```
🔧 Starting Supabase Database Setup...

🚀 Running: Creating SQL execution helper function
✅ Success: Creating SQL execution helper function
🚀 Running: Creating tenant tables
✅ Success: Creating tenant tables
🚀 Running: Adding tenant_id to profiles table
✅ Success: Adding tenant_id to profiles table
🚀 Running: Creating performance indexes
✅ Success: Creating performance indexes
🚀 Running: Enabling Row Level Security
✅ Success: Enabling Row Level Security
🚀 Running: Dropping old conflicting policies
✅ Success: Dropping old conflicting policies
🚀 Running: Creating new RLS policies
✅ Success: Creating new RLS policies
🚀 Running: Creating timestamp triggers
✅ Success: Creating timestamp triggers

🎉 Database setup completed successfully!
✅ Multi-tenant tables created
✅ RLS policies configured
✅ Indexes and triggers set up

🚀 Your company signup should now work without RLS errors!

🧪 Testing database setup...
✅ Database test passed!
```

## 🐛 Troubleshooting

- **Invalid API Key**: Make sure you're using the `service_role` key, not the `anon` key
- **Permission Denied**: Ensure your service role key has admin permissions
- **Network Issues**: Check your internet connection and Supabase service status

## 🎉 After Setup

Once the script completes successfully:

1. Your company signup form will work without RLS errors
2. Both individual and company registrations will succeed  
3. Multi-tenant functionality will be properly supported

Test by trying to create a company account on your website!
