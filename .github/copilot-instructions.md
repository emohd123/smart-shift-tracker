# Smart Shift Tracker - AI Agent Instructions

## Project Overview
A full-stack shift management platform built with React/TypeScript + Supabase for managing promoters, companies, and shift scheduling with real-time features.

**Tech Stack**: Vite + React 18 + TypeScript + Supabase + shadcn/ui + TailwindCSS + React Router v6

## Architecture

### Role-Based Access Control (RBAC)
Three distinct user roles with separate dashboards:
- **Admin**: Full system access (`/admin`, `/promoters`, `/reports`, `/revenue`, `/data-purge`)
- **Company**: Shift creation/management (`/company`, `/shifts/create`)
- **Promoter**: Time tracking, shift applications (`/time`, `/time-history`)

**Key Pattern**: Role checks use `user_roles` table via security definer functions (`has_role`, `get_user_role`) to avoid RLS recursion. See `src/components/ProtectedRoute.tsx` for route guards.

### Context Architecture
Three nested providers in `App.tsx` (order matters):
1. **ErrorProvider** - Global error handling
2. **SecurityProvider** - CSRF tokens, CSP headers, rate limiting (100 req/min)
3. **AuthProvider** - Session management, user state

**Auth Flow**: `AuthContext` → `useAuthState` hook → Supabase session → RPC for role → formatted user object

### Data Layer Patterns

#### Supabase Integration
- **Client**: `@/integrations/supabase/client` (singleton with auth persistence)
- **Type Safety**: Auto-generated types in `src/types/database.ts` with enum guards
- **Direct Queries**: No query library - use Supabase client directly with `.from().select()` pattern
- **RLS**: All tables use Row Level Security; bypass with service role key in Edge Functions

#### Realtime Subscriptions
Standard pattern across components:
```typescript
const channel = supabase
  .channel('unique-channel-name')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'table_name' }, handleChange)
  .subscribe();

return () => { supabase.removeChannel(channel); };
```
Examples: `src/components/dashboard/PromoterDashboard.tsx`, `src/components/notifications/NotificationBadge.tsx`

### UI Component System

#### shadcn/ui Convention
- All UI primitives in `src/components/ui/` (60+ components)
- Import pattern: `@/components/ui/{component}`
- Custom theme: Uses `cn()` utility (`lib/utils.ts`) for conditional classes
- Form handling: `react-hook-form` + shadcn Form components (no zod resolvers found)

#### Toast Notifications
- Library: `sonner` (not shadcn's useToast)
- Pattern: `import { toast } from "sonner"` → `toast.success()`, `toast.error()`
- Global: `<Toaster richColors />` in `App.tsx`

### File Upload & Storage
- **Buckets**: `id_cards` (5MB), `profile_photos` (2MB)
- **Pattern**: Upload via `supabase.storage.from(bucket).upload(path, file)`
- **Security**: RLS policies enforce users only access own folder: `auth.uid()::text = (storage.foldername(name))[1]`
- See `src/hooks/signup/useSignupFileUpload.ts`

### Edge Functions (Deno)
Located in `supabase/functions/`:
- **auto-attendance**: Scheduled task for check-in/out automation
- **create-certificate-checkout**: Stripe integration
- **generate-unique-code**: Unique code generation for promoters
- **stripe-webhook**: Payment webhook handling
- **verify-certificate**: Certificate validation

**Pattern**: Use service role key, enable CORS, return JSON with proper headers

## Development Workflows

### Setup & Running
```powershell
# Install dependencies (uses bun lockfile but npm works)
npm i

# Development server (port 8080)
npm run dev

# Build (production)
npm run build

# Build (development mode)
npm run build:dev
```

### Environment Variables
Required in `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### Database Setup
**CRITICAL**: Run SQL migrations from `SUPABASE_SETUP_INSTRUCTIONS.md` in order:
1. Storage buckets + RLS policies
2. User roles system (`app_role` enum, `user_roles` table)
3. Security definer functions (`has_role`, `get_user_role`)
4. Remaining migrations in `supabase/migrations/` (chronological order)

**Testing**: Use `TESTING_GUIDE.md` for signup/auth flow validation

### Debugging Tools
- **DevToolsPanel**: Development mode only (`src/components/devtools/DevToolsPanel.tsx`)
- **Error Boundary**: Wraps app, shows stack traces in dev (`src/components/ui/error-boundary.tsx`)
- **Performance Monitoring**: `usePerformanceMonitor` hook tracks component render times

## Code Conventions

### Import Aliases
Always use `@/` for src imports (configured in `vite.config.ts`):
```typescript
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
```

### Type Patterns
- Enums in `src/types/database.ts`: `UserRole`, `ShiftStatus`, `VerificationStatus`, `GenderType`
- Type guards: `isValidUserRole()`, `isValidShiftStatus()`, etc.
- User type: Defined in `AuthContext`, not Supabase's User type

### State Management
- **No Redux/Zustand**: React Context + hooks
- **Custom Hooks**: Located in `src/hooks/` organized by feature (auth, shifts, messages, etc.)
- **Local Storage**: Shift forms use localStorage for location data temporarily

### Form Validation
- Uses `react-hook-form` with controlled components
- No zod schemas detected - validation may be manual or inline
- Pattern: `const form = useForm()` → `<Form {...form}>` → `<FormField>`

### Error Handling
- Global: `ErrorContext` + `ErrorProvider`
- Toast notifications for user-facing errors
- Console logging for debugging (frequent `console.log`, `console.error`)

## Key Features to Understand

### Shift Assignment System
1. Companies/admins create shifts (`src/pages/CreateShift.tsx`)
2. Shifts stored in `shifts` table with optional `shift_locations` (geofencing)
3. Promoters assigned via `shift_assignments` table
4. Time tracking in `time_logs` table (check-in/out)
5. Auto-attendance via Edge Function (runs on schedule)

### Certificate Generation
- Promoters can purchase certificates (`src/pages/Certificates.tsx`)
- Stripe integration via Edge Functions
- QR code verification endpoint: `/verify-certificate`

### Messaging System
- Direct messages between users (`src/pages/Messages.tsx`)
- Real-time updates via Supabase subscriptions
- Unread count badge (`src/components/notifications/UnreadMessagesBadge.tsx`)

### Multi-Currency Support
- `useCurrency` hook fetches nationality from user profile
- Maps country to currency code (see `src/lib/countries.ts`)
- Displays amounts in user's local currency

## Common Patterns

### Loading States
```typescript
const [loading, setLoading] = useState(true);
// ... fetch data
setLoading(false);

// UI: {loading ? <Skeleton /> : <Content />}
```

### Protected Actions
Check user role before sensitive operations:
```typescript
const { user } = useAuth();
if (user?.role !== UserRole.Admin) {
  toast.error("Permission denied");
  return;
}
```

### Supabase Queries
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*, related_table(*)')
  .eq('column', value)
  .single(); // or .maybeSingle() to allow null

if (error) throw error;
```

### Navigation
```typescript
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
navigate('/path'); // or navigate(-1) for back
```

## Critical Notes
- **RLS Bypass**: Use Edge Functions with service role key for admin operations
- **CSRF Protection**: `SecurityProvider` generates tokens; validate in sensitive operations
- **Auth State**: Always check `loading` before rendering protected content
- **Realtime Cleanup**: Always unsubscribe from channels in useEffect cleanup
- **File Size Limits**: Enforce in UI before upload (5MB ID cards, 2MB photos)
- **Environment**: Check `process.env.NODE_ENV` for dev-only features
