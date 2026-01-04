# Smart Shift Tracker - Testing & Development Guide

## Current Status

The Smart Shift Tracker application is fully functional with all major features implemented:
- ✅ Unified Admin Dashboard (6 tabs)
- ✅ Company Dashboard with Promoter Browsing
- ✅ Shift Creation & Assignment System
- ✅ Contract Approval Workflow
- ✅ Time Tracking & Check-in
- ✅ Real-time Data Updates

**However**: The database is currently **empty** (no test accounts created yet). This is expected in a fresh development environment.

## Quick Start: Populate Test Data

### Option 1: Automated Seeding (Recommended)

Run the test data seeding script to create sample promoter and company accounts:

```bash
# Create test accounts automatically
node seed-test-data.js
```

This creates:
- **3 Promoter Accounts** (auto-approved for testing)
- **2 Company Accounts** (ready to assign shifts)

Test credentials will be printed to console.

### Option 2: Manual Signup

1. Start the dev server: `npm run dev`
2. Visit http://localhost:8080
3. Go to **Sign Up** page
4. Create promoter account (role: "Promoter")
5. Account will be marked as "Pending" until admin approves
6. Log in as admin to approve the account
7. Create company account (role: "Company")

## Testing Workflows

### 1️⃣ Admin Workflow

**Access Admin Dashboard:**
1. Log in with admin account (or self-created admin)
2. Click Admin Dashboard in navigation
3. Navigate 6 tabs: Overview, Users, Shifts, Revenue, Reports, System

**Admin Features to Test:**
- View system metrics and health checks
- Manage promoters (approve, reject, view details)
- Monitor shift assignments and payments
- View analytics and reports
- Perform data operations (purge, exports)

### 2️⃣ Company Workflow

**View Available Promoters:**
1. Log in with company account
2. Go to Company Dashboard
3. Scroll to "Available Promoters" section
4. Should see all approved promoters with contract status

**Create & Assign Shifts:**
1. Click "Create Shift" button
2. Fill shift details:
   - Job title and description
   - Date, time, location
   - Pay rate and currency
3. Select promoters to assign
4. Choose work hours for each promoter
5. Submit shift
6. Promoters receive contract notifications if company has active template

### 3️⃣ Promoter Workflow

**View & Join Shifts:**
1. Log in with promoter account
2. Go to Promoter Dashboard
3. View available shifts from companies
4. Join shifts (if contract approved)

**Time Tracking:**
1. Go to Time Tracking page
2. Check in to assigned shift
3. Check out when shift ends
4. View time history and earnings

## Database Diagnostics

### Check Database Status

```bash
# See how many records exist in each table
node check-db.js

# Output example:
# 📊 profiles: 5 records
# 📊 shifts: 8 records
# 📊 shift_assignments: 12 records
```

### Debug Promoter Loading

1. **Enable Developer Tools**:
   - Open browser DevTools (F12)
   - Look for "DevTools Panel" at bottom of page
   
2. **Test Database Connectivity**:
   - Click "DB" tab in DevTools Panel
   - Click "Test DB Connectivity" button
   - Check console for detailed logs

3. **Console Logging**:
   - Open browser console (F12 → Console)
   - Look for logs starting with `[BrowsePromoters]`
   - Traces RPC calls and fallback queries

## Common Issues & Solutions

### Issue: "No approved promoters available"

**This is normal if:**
- No accounts have been created yet (empty database)
- Promoter accounts exist but are "pending" (not approved by admin)

**Solution:**
1. Run `node seed-test-data.js` to create test data
2. Or manually create accounts and approve via admin dashboard

### Issue: BrowsePromotersCard Shows Empty List

**Debugging Steps:**
1. Check browser console (F12 → Console)
2. Look for errors with pattern: `[BrowsePromoters]`
3. Check if promoters exist: `node check-db.js`
4. Verify promoter has `verification_status='approved'`

### Issue: RPC Function Not Found

The `list_eligible_promoters()` RPC function hasn't been deployed yet. This is expected and handled by fallback code that queries the `profiles` table directly.

**Status:** Both approaches work - RPC when available, direct query as fallback.

## Development Environment

### Start Development Server
```bash
npm run dev
# Server runs on http://localhost:8080
```

### Build Production
```bash
npm run build
# Output in dist/
```

### Run Tests
```bash
npm test  # Run all tests
npx playwright test  # Run E2E tests
```

## Key Files for Testing

| File | Purpose |
|------|---------|
| `seed-test-data.js` | Auto-populate test accounts |
| `check-db.js` | Check database record counts |
| `src/components/devtools/DevToolsPanel.tsx` | Browser dev tools (DB tab) |
| `src/components/dashboard/company/BrowsePromotersCard.tsx` | Promoter list component |
| `src/components/shifts/form/usePromoters.ts` | Promoter loading hook |
| `TESTING_GUIDE.md` | Original testing documentation |

## Feature Status Checklist

- ✅ Admin Dashboard (unified 6-tab interface)
- ✅ Promoter listing (with fallback to direct query)
- ✅ Shift creation and assignment
- ✅ Contract notification system
- ✅ Time tracking and check-in
- ✅ Real-time updates
- ✅ Multi-currency support
- ✅ Role-based access control
- ✅ Enhanced error handling and logging
- ⏳ RPC function deployment (migration exists, not yet applied)

## Next Steps

1. **Seed test data**: `node seed-test-data.js`
2. **Log in with company account**: Test promoter browsing
3. **Create a shift**: Assign test promoters
4. **Check in as promoter**: Test time tracking
5. **View analytics**: Review admin dashboard
6. **Test contract flow**: Verify notifications

## Support & Documentation

- `PROJECT_OVERVIEW.md` - Architecture and design patterns
- `DEVELOPER_GUIDE.md` - Development best practices
- `TESTING_GUIDE.md` - Original testing procedures
- `SUPABASE_SETUP_INSTRUCTIONS.md` - Database setup details

---

**Last Updated**: Testing and Diagnostics System v1
**Status**: Development environment fully functional, awaiting test data
