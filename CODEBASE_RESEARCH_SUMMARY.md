# Smart Shift Tracker - Codebase Research Summary

**Date:** January 4, 2026  
**Research Focus:** Create Shift, Online Contracts, Shift Data Structures, Payment Logic, Notifications

---

## 1. CREATE SHIFT PAGE

### Location & Structure
- **File:** [src/pages/CreateShift.tsx](src/pages/CreateShift.tsx)
- **Parent Layout:** `AppLayout` (title: "Create Shift")
- **Max Width:** 4xl container (mx-auto, max-w-4xl)

### Current Features
1. **Role-Based Access:**
   - Requires `isCompanyLike` role (company or admin users only)
   - Redirects to `/login` if not authenticated
   - Redirects to `/shifts` if insufficient permissions

2. **Contract Management Check:**
   - Displays contract status card for company users
   - Checks for active contract template (`company_contract_templates` table)
   - Shows "Manage Contract Template" or "Create Contract" button

3. **Form Implementation:**
   - Delegates to `<ShiftForm />` component
   - Located in [src/components/shifts/form/ShiftForm.tsx](src/components/shifts/form/ShiftForm.tsx)

### ShiftForm Component
- **File:** [src/components/shifts/form/ShiftForm.tsx](src/components/shifts/form/ShiftForm.tsx)

#### Form Fields:
1. **Basic Info:**
   - `title` (required) - Shift title
   - `location` (required) - Work location
   - (via `BasicInfoFields` component)

2. **Date & Time:**
   - `dateRange` (required) - Start/end dates
   - `startTime` (required) - Start time
   - `endTime` (required) - End time
   - (via `DateTimeFields` component)

3. **Payment:**
   - `payRate` (optional) - Pay amount
   - `payRateType` (optional) - Rate type (hourly, daily, monthly, fixed)
   - (via `PayRateField` component)

4. **Promoters (Create Mode Only):**
   - `selectedPromoterIds` - Array of promoter IDs to assign
   - (via `PromoterSelector` component)

#### Validation:
- Title required (non-empty trim)
- Location required (non-empty trim)
- Start date required
- Start time required
- End time required

#### Form States:
- `isEditMode` - Distinguishes create vs. edit flows
- `loading` - Submit operation state
- `loadingPromoters` - Promoter list load state
- `validationErrors` - Form validation errors array

#### Submission Logic
- **File:** [src/components/shifts/form/useShiftSubmission.ts](src/components/shifts/form/useShiftSubmission.ts)
- Calls `submitShift(formData, event)`

---

## 2. ONLINE CONTRACT FUNCTIONALITY

### Contract Management Page
- **File:** [src/pages/CompanyContract.tsx](src/pages/CompanyContract.tsx)
- **Route:** `/company/contract`
- **Access:** Company or Admin users only

#### Key Functions:

1. **Load Contract Template:**
   - Queries `company_contract_templates` table
   - Filters by `company_id` and `is_active = true`
   - Returns most recent version (order by `updated_at` DESC)

2. **Save/Update Contract:**
   - Creates new template if not exists
   - Updates existing template with new content
   - Auto-increments `version` field
   - Maintains `is_active` flag

3. **Publish/Unpublish:**
   - Toggles `is_active` status
   - Ensures only one active template per company (unique partial index)
   - Records timestamp in `updated_at`

#### Form Fields:
- `title` - Contract title (default: "Company Contract")
- `body` - Contract content (markdown format)
- Preview pane showing rendered markdown

### Contract Acceptance Dialog
- **File:** [src/components/contracts/ContractAcceptanceDialog.tsx](src/components/contracts/ContractAcceptanceDialog.tsx)

#### Dialog Props:
- `open` - Dialog visibility state
- `onOpenChange` - Handler for open/close
- `companyName` - Display company name
- `shift` - Shift object with details
- `contractTitle` - Contract title
- `contractBody` - Contract content
- `loading` - Save operation state
- `onAccept` - Callback with signature text

#### User Actions:
1. **Review Contract:** Scrollable markdown-rendered contract view
2. **Review Shift Details:** Card showing position, date, time, location, rate
3. **Accept Terms:** Checkbox to confirm reading and agreement
4. **Sign:** Text input for full name as digital signature (min 3 chars)
5. **Submit:** "Accept & Start Shift" button

#### Validation:
- Checkbox must be checked
- Signature must be >= 3 characters

---

## 3. SHIFT-RELATED DATA STRUCTURES

### 3.1 shifts Table
**Migration:** [supabase/migrations/20251115113612_7d656653-c600-4e84-8f07-7a5ee956e18e.sql](supabase/migrations/20251115113612_7d656653-c600-4e84-8f07-7a5ee956e18e.sql)

#### Columns:
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `title` | text | Shift title (required) |
| `description` | text | Optional details |
| `location` | text | Work location |
| `latitude` | numeric | Optional geo-coordinate |
| `longitude` | numeric | Optional geo-coordinate |
| `date` | date | Shift date (required) |
| `end_date` | date | Multi-day shift end date |
| `start_time` | time | Shift start time (required) |
| `end_time` | time | Shift end time (required) |
| `pay_rate` | numeric | Pay amount |
| `pay_rate_type` | text | 'hourly', 'daily', 'monthly', 'fixed' |
| `company_id` | uuid | References profiles(id) |
| `promoter_id` | uuid | (Legacy) single promoter assignment |
| `status` | text | 'upcoming', 'ongoing', 'completed', 'cancelled' |
| `is_paid` | boolean | Payment tracking flag |
| `manual_status_override` | boolean | Admin override flag |
| `override_status` | text | Manual status value |
| `created_at` | timestamptz | Auto timestamp |
| `updated_at` | timestamptz | Auto timestamp |

#### RLS Policies:
- Promoters: View own assigned shifts (via shift_assignments)
- Companies: View/create/update/delete own shifts
- Admins: View all shifts

### 3.2 shift_assignments Table
**Migration:** [supabase/migrations/20251115113654_9a059825-0f6d-4400-a5fa-67f39fb61cbf.sql](supabase/migrations/20251115113654_9a059825-0f6d-4400-a5fa-67f39fb61cbf.sql)

#### Columns:
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `shift_id` | uuid | References shifts(id) - ON DELETE CASCADE |
| `promoter_id` | uuid | References profiles(id) - ON DELETE CASCADE |
| `status` | text | 'pending', 'accepted', 'rejected', 'completed' |
| `scheduled_start_time` | timestamptz | Optional scheduled check-in time |
| `scheduled_end_time` | timestamptz | Optional scheduled check-out time |
| `auto_checkin_enabled` | boolean | Auto check-in flag |
| `auto_checkout_enabled` | boolean | Auto check-out flag |
| `approved_at` | timestamptz | Approval timestamp |
| `approved_by` | uuid | Approver profile ID |
| `certificate_approved` | boolean | Certificate approval flag |
| `created_at` | timestamptz | Auto timestamp |
| `updated_at` | timestamptz | Auto timestamp |
| **UNIQUE:** `(shift_id, promoter_id)` | - | One assignment per promoter per shift |

#### RLS Policies:
- Promoters: View own assignments; update own status
- Companies: View/manage assignments for own shifts
- Admins: Full access

### 3.3 company_contract_templates Table
**Migration:** [supabase/migrations/20251220180000_online_contracts_and_payments.sql](supabase/migrations/20251220180000_online_contracts_and_payments.sql)

#### Columns:
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `company_id` | uuid | References profiles(id) - ON DELETE CASCADE |
| `title` | text | Contract title (default: 'Company Contract') |
| `body_markdown` | text | Contract content (markdown format) |
| `version` | integer | Version number (default: 1) |
| `is_active` | boolean | Active/inactive flag (default: true) |
| `created_by` | uuid | Creator profile ID |
| `created_at` | timestamptz | Auto timestamp |
| `updated_at` | timestamptz | Auto timestamp (via trigger) |
| **UNIQUE INDEX:** `(company_id) WHERE is_active` | - | One active per company |

#### RLS Policies:
- Company/Admin: Manage own company templates
- Promoters: Read active templates only for companies where assigned shifts exist

### 3.4 company_contract_acceptances Table
**Migration:** [supabase/migrations/20251220180000_online_contracts_and_payments.sql](supabase/migrations/20251220180000_online_contracts_and_payments.sql)

#### Columns:
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `company_id` | uuid | References profiles(id) - ON DELETE CASCADE |
| `promoter_id` | uuid | References profiles(id) - ON DELETE CASCADE |
| `template_id` | uuid | References company_contract_templates(id) - ON DELETE RESTRICT |
| `signature_text` | text | Digital signature (full name) |
| `accepted_at` | timestamptz | Acceptance timestamp (default: now) |
| `accept_ip` | inet | IP address of acceptance |
| `accept_user_agent` | text | Browser user agent string |
| `created_at` | timestamptz | Auto timestamp |
| **UNIQUE:** `(company_id, promoter_id)` | - | Sign once per company per promoter |

#### RLS Policies:
- Promoters: Read own acceptances; insert own acceptance
- Companies/Admins: Read acceptances for own company

### 3.5 shift_assignment_payment_status Table
**Migration:** [supabase/migrations/20251220180000_online_contracts_and_payments.sql](supabase/migrations/20251220180000_online_contracts_and_payments.sql)
**Enhanced by:** [supabase/migrations/20260103100000_promoter_assignment_enhancements.sql](supabase/migrations/20260103100000_promoter_assignment_enhancements.sql)

#### Columns:
| Column | Type | Notes |
|--------|------|-------|
| `assignment_id` | uuid | Primary key, References shift_assignments(id) - ON DELETE CASCADE |
| `status` | text | 'scheduled' or 'paid' (required) |
| `amount` | numeric | Payment amount (added in v2) |
| `scheduled_at` | timestamptz | Scheduled payment date |
| `paid_at` | timestamptz | Actual payment date |
| `scheduled_by` | uuid | User who scheduled (auth.users(id)) |
| `paid_by` | uuid | User who processed payment (auth.users(id)) |
| `updated_by` | uuid | Last updater profile ID |
| `created_at` | timestamptz | Auto timestamp |
| `updated_at` | timestamptz | Auto timestamp (via trigger) |

#### RLS Policies:
- Read: Promoters (own assignments), Companies (own shifts), Admins (all)
- Insert/Update: Companies (own shifts), Admins (all)

---

## 4. PAYMENT-RELATED CODE

### Payment Calculation Utilities
- **File:** [src/components/shifts/utils/paymentCalculations.ts](src/components/shifts/utils/paymentCalculations.ts)

#### Key Functions:

1. **calculateWorkDuration(checkInTime, checkOutTime): number**
   - Calculates elapsed hours between check-in and check-out
   - Returns 0 if no check-out time
   - Formula: `(checkOut - checkIn) / (1000 * 60 * 60)`

2. **formatWorkDuration(hours): string**
   - Formats hours to readable string (e.g., "8h 30m")
   - Splits into whole hours and remaining minutes

3. **calculatePromoterPayment(timeLogs, payRate, payRateType): number**
   - Aggregates payment for single promoter
   - **Hourly:** `totalHours * payRate`
   - **Daily:** `(totalHours / 8) * payRate` (assumes 8-hour workday)
   - **Monthly:** `(totalHours / 160) * payRate` (assumes 160-hour month)
   - **Fixed:** Returns `payRate` as-is

4. **calculateTotalShiftPayment(allTimeLogs, payRate, payRateType): number**
   - Aggregates payment across all promoters
   - Uses `calculatePromoterPayment` for each promoter

5. **formatBHD(amount): string**
   - Formats amount as BHD currency: `"BHD {amount.toFixed(3)}"`

6. **calculateLiveEarnings(checkInTime, payRate, payRateType): object**
   - Calculates real-time earnings while promoter is checked in
   - Returns: `{ elapsedHours: number, currentEarnings: number }`
   - Same rate type logic as `calculatePromoterPayment`

#### Data Types:
```typescript
interface TimeLog {
  id?: string;
  check_in_time: string;
  check_out_time: string | null;
  total_hours: number | null;
  earnings: number | null;
}
```

### Payment Status Flow
- **Payment Creation:** Auto-created on shift assignment or explicitly set
- **Status Transitions:** scheduled → paid
- **Amount Tracking:** Stored in `shift_assignment_payment_status.amount`
- **Audit Trail:** `scheduled_by`, `paid_by`, `updated_at` fields

---

## 5. NOTIFICATION SYSTEM

### Notification Table
- **Table:** `notifications` (in database)
- **Type Schema:** [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts) (lines 451-481)

#### Columns:
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | References profiles(id) |
| `title` | text | Notification title |
| `message` | text | Notification content |
| `type` | text | Notification category |
| `read` | boolean | Read status flag |
| `created_at` | timestamptz | Auto timestamp |

#### Notification Types:
- `'contract_required'` - Contract acceptance required before shift
- `'security_audit'` - Security events (role changes)

### Contract Notifications Implementation
- **File:** [src/components/shifts/form/useShiftSubmission.ts](src/components/shifts/form/useShiftSubmission.ts) (lines 10-63)
- **Function:** `sendContractNotifications(companyId, promoterIds, shiftId, shiftTitle)`

#### Flow:
1. **Check Active Contract:** Query for `company_contract_templates` with `is_active = true`
2. **Filter Acceptances:** Get existing `company_contract_acceptances` records
3. **Identify Need:** Filter promoters who haven't yet accepted
4. **Create Notifications:**
   ```typescript
   {
     user_id: promoterId,
     title: 'Contract Acceptance Required',
     message: `Please review and accept the contract before starting shift: ${shiftTitle}`,
     type: 'contract_required',
     read: false
   }
   ```
5. **Insert:** Batch insert to `notifications` table
6. **Error Handling:** Logs but doesn't fail shift creation if notification fails

#### Triggers:
- **When Creating Shift with Promoters:** If company has active contract and promoter hasn't accepted
- **Called from:** [useShiftSubmission.ts line 179](src/components/shifts/form/useShiftSubmission.ts#L179)

### Notification UI Components
- **File:** [src/components/notifications/NotificationBadge.tsx](src/components/notifications/NotificationBadge.tsx)
- **File:** [src/components/notifications/UnreadMessagesBadge.tsx](src/components/notifications/UnreadMessagesBadge.tsx)

---

## 6. CONTRACT ACCEPTANCE GATING

### Time Tracking Integration
- **File:** [src/components/time/TimeTrackerWrapper.tsx](src/components/time/TimeTrackerWrapper.tsx)
- **Purpose:** Gate check-in on contract acceptance

#### Pre-Check-In Logic (lines 61-150):
1. **Load Company & Contract:**
   - Fetch `company_id` from shifts table
   - Query `company_contract_templates` (active)
   - Load template content (title, body_markdown)

2. **Check Acceptance:**
   - Query `company_contract_acceptances`
   - Check: `(company_id, promoter_id, accepted_at IS NOT NULL)`

3. **Gate Logic:**
   - If contract required and NOT accepted → Show `ContractAcceptanceDialog`
   - If accepted → Allow check-in

4. **On Accept:**
   - Record acceptance in `company_contract_acceptances`
   - Log signature, IP, user agent
   - Proceed with check-in

---

## 7. KEY INTEGRATION FLOWS

### Create Shift Flow
```
CreateShift Page
  ↓
ShiftForm Component
  ├─ Validate inputs
  ├─ Check user role (company)
  ├─ Check active contract (if assigning promoters)
  └─ useShiftSubmission.submitShift()
      ├─ Insert/Update shifts table
      ├─ Insert shift_assignments (if promoters selected)
      ├─ Call sendContractNotifications()
      │   ├─ Check company_contract_templates
      │   ├─ Query company_contract_acceptances
      │   └─ Insert notifications
      └─ Navigate to shift detail
```

### Contract Acceptance Flow
```
TimeTrackerWrapper (Pre-Check-In)
  ↓
loadCompanyAndContract()
  ├─ Fetch company_id from shifts
  ├─ Load company_contract_templates (active)
  ├─ Check company_contract_acceptances
  └─ If NOT accepted:
      ↓
      ContractAcceptanceDialog
        ├─ Display contract template
        ├─ Get signature input
        └─ On Accept:
            ├─ Insert company_contract_acceptances
            ├─ Record IP & user agent
            └─ Proceed with check-in
```

### Payment Lifecycle
```
Shift Created
  ↓
shift_assignments created
  ↓
shift_assignment_payment_status created (status: 'scheduled')
  ↓
After work (check-out logged)
  ↓
Admin/Company marks as 'paid'
  ↓
shift_assignment_payment_status updated (status: 'paid', paid_at: NOW)
```

---

## 8. SECURITY & RLS POLICIES

### Helper Functions
- **File:** [supabase/migrations/20251220180000_online_contracts_and_payments.sql](supabase/migrations/20251220180000_online_contracts_and_payments.sql)

#### `public.is_admin_like(_user_id uuid) → boolean`
- Returns true if user is admin or super_admin
- Used in multiple RLS policies

#### `public.has_contract_acceptance(_promoter_id uuid, _company_id uuid) → boolean`
- **Migration:** [supabase/migrations/20260103100000_promoter_assignment_enhancements.sql](supabase/migrations/20260103100000_promoter_assignment_enhancements.sql)
- Checks if promoter has signed company contract
- Can be used for payment gating

#### `public.has_active_contract_template(_company_id uuid) → boolean`
- Checks if company has published contract template
- Can gate shift creation or promoter visibility

#### `public.list_eligible_promoters() → TABLE`
- **Migration:** [supabase/migrations/20260103100000_promoter_assignment_enhancements.sql](supabase/migrations/20260103100000_promoter_assignment_enhancements.sql)
- Lists approved promoters available for assignment
- Called by companies browsing promoters

---

## 9. ERROR HANDLING & EDGE CASES

### Missing Table Handling
- **Function:** `isMissingTableError(error, tableName)` from `@/utils/supabaseErrors`
- **Usage:** Try-catch blocks set `schemaMissing` state
- **UI:** Warning card with migration instructions

### Non-Blocking Errors
- **Contract Notifications:** Logged but don't fail shift creation
- **Time Log Updates:** Gracefully handle partial failures
- **Payment Tracking:** Optional, doesn't block workflow

### Validation Layers
1. **Form Level:** Client-side validation in ShiftForm
2. **API Level:** RLS policies enforce access control
3. **Data Level:** Unique constraints, foreign keys, check constraints

---

## 10. SUMMARY TABLE

| Component | File | Purpose | Key Tables |
|-----------|------|---------|------------|
| Create Shift | src/pages/CreateShift.tsx | Shift creation entry point | shifts, shift_assignments |
| Shift Form | src/components/shifts/form/ShiftForm.tsx | Form UI & validation | shifts, profiles |
| Contract Management | src/pages/CompanyContract.tsx | Template creation/editing | company_contract_templates |
| Contract Acceptance | src/components/contracts/ContractAcceptanceDialog.tsx | Promoter signature flow | company_contract_acceptances |
| Time Tracking | src/components/time/TimeTrackerWrapper.tsx | Check-in/out with gating | time_logs, company_contract_acceptances |
| Payments | src/components/shifts/utils/paymentCalculations.ts | Payment math | shift_assignment_payment_status, time_logs |
| Notifications | useShiftSubmission.ts | Contract requirement alerts | notifications |

---

## 11. TECHNICAL NOTES

### Environment Assumptions
- **Database:** Supabase PostgreSQL
- **Client:** @supabase/supabase-js
- **UI Library:** shadcn/ui + React
- **Form Handling:** react-hook-form
- **Notifications:** sonner (toast notifications)

### Frontend Patterns
- **Hooks:** `useAuth`, `useNavigate`, `useTimeTracking`
- **Context:** AuthContext for user state
- **State Management:** Local state (useState) + React Context
- **Error Handling:** Toast notifications + ErrorContext

### Database Patterns
- **RLS:** All tables use Row Level Security
- **Triggers:** Auto-update `updated_at` timestamps
- **Indexes:** Unique indexes for data integrity
- **Security Definers:** Functions bypass RLS for controlled access

---

**End of Research Summary**
