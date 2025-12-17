# Developer Quick Reference Guide

## 🎯 Quick Start for Developers

This guide provides quick reference information for developers working on Smart Shift Tracker.

---

## 📋 Common Commands

```bash
# Development
npm run dev          # Start dev server (localhost:8080)
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run preview      # Preview production build

# Database (Supabase CLI)
supabase start       # Start local Supabase
supabase db push     # Push migrations
supabase functions deploy <function-name>
```

---

## 🔑 Key File Locations

### Configuration
- **Environment**: `.env.local` (create from `.env` template)
- **Vite Config**: `vite.config.ts`
- **TypeScript**: `tsconfig.json`, `tsconfig.app.json`
- **Tailwind**: `tailwind.config.ts`
- **ESLint**: `eslint.config.js`

### Core Application
- **Entry Point**: `src/main.tsx`
- **Root Component**: `src/App.tsx`
- **Auth Context**: `src/context/AuthContext.tsx`
- **Supabase Client**: `src/integrations/supabase/client.ts`
- **Type Definitions**: `src/types/database.ts`

### Routing
- **Route Guards**: `src/components/ProtectedRoute.tsx`
- **Pages**: `src/pages/` (25 page components)

---

## 🎨 Component Patterns

### Using shadcn/ui Components
```typescript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";

// Usage
<Button variant="default" size="lg">Click Me</Button>
<Input placeholder="Enter text" />
```

### Form Pattern with React Hook Form
```typescript
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";

const form = useForm({
  defaultValues: { name: "" }
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
        </FormItem>
      )}
    />
  </form>
</Form>
```

### Toast Notifications
```typescript
import { toast } from "sonner";

toast.success("Operation successful!");
toast.error("Something went wrong");
toast.loading("Processing...");
toast.info("Information message");
```

---

## 🔐 Authentication Patterns

### Using Auth Context
```typescript
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please login</div>;
  
  return <div>Welcome, {user?.name}!</div>;
}
```

### Checking User Roles
```typescript
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/database";

function AdminFeature() {
  const { user } = useAuth();
  
  if (user?.role !== UserRole.Admin) {
    return <div>Access denied</div>;
  }
  
  return <div>Admin content</div>;
}
```

---

## 💾 Database Query Patterns

### Basic Query
```typescript
import { supabase } from "@/integrations/supabase/client";

// Select all
const { data, error } = await supabase
  .from('shifts')
  .select('*');

// Select with filter
const { data, error } = await supabase
  .from('shifts')
  .select('*')
  .eq('status', 'upcoming')
  .order('start_time', { ascending: true });

// Select single record
const { data, error } = await supabase
  .from('shifts')
  .select('*')
  .eq('id', shiftId)
  .single();
```

### Insert
```typescript
const { data, error } = await supabase
  .from('shifts')
  .insert({
    title: 'New Shift',
    description: 'Shift description',
    start_time: new Date().toISOString(),
    created_by: userId
  })
  .select()
  .single();
```

### Update
```typescript
const { data, error } = await supabase
  .from('shifts')
  .update({ status: 'completed' })
  .eq('id', shiftId)
  .select()
  .single();
```

### Delete
```typescript
const { error } = await supabase
  .from('shifts')
  .delete()
  .eq('id', shiftId);
```

### Join Tables
```typescript
const { data, error } = await supabase
  .from('shifts')
  .select(`
    *,
    profiles:created_by (
      full_name,
      email
    ),
    shift_assignments (
      id,
      promoter:promoter_id (
        full_name,
        email
      )
    )
  `)
  .eq('id', shiftId)
  .single();
```

---

## 📡 Real-Time Subscriptions

### Basic Subscription Pattern
```typescript
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

useEffect(() => {
  const channel = supabase
    .channel('shifts-channel')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'shifts' 
      },
      (payload) => {
        console.log('Change received!', payload);
        // Update local state
        fetchShifts();
      }
    )
    .subscribe();

  // Cleanup
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### Listening for Specific Events
```typescript
// Listen only for inserts
.on('postgres_changes', { 
  event: 'INSERT', 
  schema: 'public', 
  table: 'shifts' 
}, handleInsert)

// Listen only for updates
.on('postgres_changes', { 
  event: 'UPDATE', 
  schema: 'public', 
  table: 'shifts' 
}, handleUpdate)

// Listen only for deletes
.on('postgres_changes', { 
  event: 'DELETE', 
  schema: 'public', 
  table: 'shifts' 
}, handleDelete)
```

---

## 📁 File Upload Pattern

### Upload to Storage
```typescript
import { supabase } from "@/integrations/supabase/client";

async function uploadFile(file: File, bucket: string, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
  
  return publicUrl;
}

// Usage
const idCardUrl = await uploadFile(file, 'id_cards', user.id);
```

### Validation Before Upload
```typescript
function validateFile(file: File, maxSizeMB: number, allowedTypes: string[]) {
  // Check size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File size must be less than ${maxSizeMB}MB`);
  }
  
  // Check type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type must be one of: ${allowedTypes.join(', ')}`);
  }
  
  return true;
}

// Usage
validateFile(file, 5, ['image/jpeg', 'image/png', 'application/pdf']);
```

---

## 🎣 Custom Hooks Pattern

### Creating a Custom Hook
```typescript
// src/hooks/useShifts.ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useShifts(status?: string) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShifts();
  }, [status]);

  async function fetchShifts() {
    try {
      setLoading(true);
      let query = supabase.from('shifts').select('*');
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setShifts(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { shifts, loading, error, refetch: fetchShifts };
}
```

### Using the Custom Hook
```typescript
import { useShifts } from "@/hooks/useShifts";

function ShiftList() {
  const { shifts, loading, error, refetch } = useShifts('upcoming');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {shifts.map(shift => (
        <div key={shift.id}>{shift.title}</div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

---

## 🛣 Navigation Patterns

### Using React Router
```typescript
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

function MyComponent() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get URL params
  const [searchParams] = useSearchParams(); // Get query params
  
  // Navigate to different routes
  navigate('/dashboard');
  navigate(`/shifts/${shiftId}`);
  navigate('/shifts', { state: { from: 'dashboard' } });
  navigate(-1); // Go back
  
  // Get query parameter
  const filter = searchParams.get('filter');
  
  return <div>Component</div>;
}
```

### Link Component
```typescript
import { Link } from "react-router-dom";

<Link to="/dashboard">Go to Dashboard</Link>
<Link to={`/shifts/${shift.id}`}>View Shift</Link>
```

---

## 🎨 Styling Patterns

### Using Tailwind Classes
```typescript
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-800">Title</h2>
  <Button className="bg-blue-500 hover:bg-blue-600">Action</Button>
</div>
```

### Using cn() Utility for Conditional Classes
```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class"
)}>
  Content
</div>
```

### Responsive Design
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
</div>
```

---

## ⚡ Performance Tips

### Lazy Loading Components
```typescript
import { lazy, Suspense } from "react";

const HeavyComponent = lazy(() => import("./HeavyComponent"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Memoization
```typescript
import { useMemo, useCallback } from "react";

// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Memoize callback functions
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

---

## 🐛 Debugging Tips

### Using DevTools Panel
```typescript
// DevTools panel is available in development mode
// Located at: src/components/devtools/DevToolsPanel.tsx
// Shows: Performance metrics, state, props, etc.
```

### Console Logging Patterns
```typescript
// Structured logging
console.log('[ShiftList] Fetching shifts for status:', status);
console.error('[ShiftList] Error fetching shifts:', error);

// Table logging for arrays
console.table(shifts);

// Group logging
console.group('Shift Details');
console.log('ID:', shift.id);
console.log('Title:', shift.title);
console.groupEnd();
```

### Checking Supabase Queries
```typescript
// Enable query logging
const { data, error } = await supabase
  .from('shifts')
  .select('*')
  .then(result => {
    console.log('Query result:', result);
    return result;
  });
```

---

## 🧪 Testing Patterns

### Testing Components
```typescript
// Manual testing checklist:
// 1. Test with loading state
// 2. Test with error state
// 3. Test with empty data
// 4. Test with actual data
// 5. Test user interactions
// 6. Test responsive design
```

### Testing Auth Flows
```typescript
// See TESTING_GUIDE.md for comprehensive auth testing procedures
// Key flows to test:
// - Signup (with/without files)
// - Login (remember me vs session)
// - Password reset
// - Role-based routing
// - Logout
```

---

## 🔒 Security Best Practices

### Never Expose Sensitive Data
```typescript
// ❌ Don't do this
console.log('Password:', password);
console.log('Token:', authToken);

// ✅ Do this
console.log('User authenticated');
```

### Validate User Input
```typescript
import { z } from "zod";

const shiftSchema = z.object({
  title: z.string().min(3).max(100),
  hourly_rate: z.number().positive(),
  start_time: z.string().datetime()
});

// Validate before submitting
const result = shiftSchema.safeParse(formData);
if (!result.success) {
  // Handle validation errors
}
```

### Use RLS Policies
```sql
-- Always ensure tables have RLS enabled
alter table shifts enable row level security;

-- Create appropriate policies
create policy "Users can view own shifts"
on shifts for select
using (created_by = auth.uid());
```

---

## 📦 Adding New Features

### Checklist for New Features
1. **Database Changes**
   - [ ] Create migration file in `supabase/migrations/`
   - [ ] Add RLS policies
   - [ ] Test migration locally

2. **Types**
   - [ ] Update `src/types/database.ts` if needed
   - [ ] Add type guards for enums

3. **Backend**
   - [ ] Create/update Supabase queries
   - [ ] Add Edge Function if needed
   - [ ] Test queries with RLS

4. **Frontend**
   - [ ] Create/update components
   - [ ] Add custom hooks if needed
   - [ ] Update routing if needed
   - [ ] Add to appropriate dashboard

5. **Testing**
   - [ ] Test all user roles
   - [ ] Test error states
   - [ ] Test responsive design
   - [ ] Update TESTING_GUIDE.md

6. **Documentation**
   - [ ] Update PROJECT_OVERVIEW.md
   - [ ] Add code comments
   - [ ] Update this guide if needed

---

## 🆘 Common Issues & Solutions

### Issue: "Failed to fetch" errors
**Solution**: Check Supabase URL and keys in `.env.local`

### Issue: RLS policy violations
**Solution**: Review policies in Supabase dashboard, ensure user has correct role

### Issue: File upload fails
**Solution**: Check bucket exists, RLS policies on storage.objects, file size/type

### Issue: Real-time not updating
**Solution**: Check channel subscription, ensure cleanup on unmount

### Issue: Type errors with Supabase
**Solution**: Regenerate types or add proper type assertions

---

## 📚 Additional Resources

- **Project Overview**: [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
- **Setup Guide**: [SUPABASE_SETUP_INSTRUCTIONS.md](SUPABASE_SETUP_INSTRUCTIONS.md)
- **Testing Guide**: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Supabase Docs**: https://supabase.com/docs
- **shadcn/ui Docs**: https://ui.shadcn.com
- **React Router Docs**: https://reactrouter.com
- **Tailwind Docs**: https://tailwindcss.com

---

**Last Updated**: December 2025
