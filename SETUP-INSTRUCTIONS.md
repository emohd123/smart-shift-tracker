# 🚀 Smart Shift Tracker Database Setup Instructions

## ❌ **Current Issue**
```
Failed to create company: Could not find the table 'public.tenants'
```

## ✅ **Solution - Manual Database Setup Required**

### **STEP 1: Execute Database Setup Script**

1. **Open your Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/depeamhvogstuynlqudi/sql/new
   ```

2. **Copy the ENTIRE contents** of `QUICK-DATABASE-SETUP.sql` file

3. **Paste** into the SQL Editor

4. **Click the RUN button** 

### **STEP 2: Verify Setup Worked**

Run the verification script:
```bash
node test-database-after-setup.js
```

### **STEP 3: Test Company Signup**

Once verification passes, your company signup should work without the "table not found" error!

---

## 🔍 **What the Setup Script Creates**

✅ **Core Tables:**
- `public.tenants` - Company/organization data
- `public.tenant_memberships` - User-company relationships

✅ **Security Features:**
- Row Level Security (RLS) enabled
- Signup-friendly policies 
- Role-based access control

✅ **Performance Optimizations:**
- Database indexes for fast queries
- Automatic timestamp updates
- Utility functions for common operations

---

## 🎯 **Expected Results After Setup**

### **Before Setup:**
```
❌ Could not find table 'public.tenants'
❌ Company signup fails
❌ Multi-tenant features unavailable
```

### **After Setup:**
```
✅ All tables accessible
✅ Company signup works perfectly
✅ Multi-tenant architecture active
✅ Zero "table not found" errors
```

---

## 🚨 **If Setup Fails**

If you encounter issues:

1. **Check Supabase Dashboard** for error messages
2. **Verify you have admin access** to the project
3. **Try running the script in smaller sections**
4. **Contact support** if SQL execution fails

---

## 📧 **Need Help?**

- **Supabase Dashboard:** https://supabase.com/dashboard/project/depeamhvogstuynlqudi
- **SQL Editor:** https://supabase.com/dashboard/project/depeamhvogstuynlqudi/sql/new
- **Project Settings:** https://supabase.com/dashboard/project/depeamhvogstuynlqudi/settings/general

---

**🎉 Once setup is complete, your Smart Shift Tracker will be fully operational with zero database errors!**