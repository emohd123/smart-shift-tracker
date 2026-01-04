# Additional Code Enhancement Opportunities

## Overview
While the core refactoring is complete, this document outlines additional enhancements that could further improve code quality, performance, and maintainability.

---

## 1. Performance Optimizations

### Image Optimization
**Current State:** Images uploaded directly without optimization
**Opportunity:**
```typescript
// Add image compression before upload
import imageCompression from 'browser-image-compression';

const compressImage = async (file: File) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };
  return await imageCompression(file, options);
};

// Use in upload flow
const optimizedFile = await compressImage(file);
```

**Benefits:**
- Faster uploads
- Reduced storage costs
- Better user experience on slow connections
- Lower bandwidth usage

---

### Query Result Caching
**Current State:** Fresh queries on every page load
**Opportunity:**
```typescript
// Use React Query for automatic caching
import { useQuery } from '@tanstack/react-query';

const useCompanyProfile = (userId: string) => {
  return useQuery({
    queryKey: ['companyProfile', userId],
    queryFn: () => fetchCompanyProfile(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

**Benefits:**
- Instant subsequent loads
- Reduced database queries
- Better offline experience
- Automatic background refetching

---

## 2. Error Boundary Implementation

### Component-Level Error Boundaries
**Current State:** App-level error boundary only
**Opportunity:**
```typescript
// Add boundaries around major sections
<ErrorBoundary fallback={<ProfileErrorFallback />}>
  <CompanyProfileManager />
</ErrorBoundary>

<ErrorBoundary fallback={<ShiftErrorFallback />}>
  <ShiftList />
</ErrorBoundary>
```

**Benefits:**
- Isolated error handling
- Better user experience (partial page failures)
- More granular error reporting
- Recovery without full page reload

---

## 3. Form Validation Enhancement

### Schema-Based Validation
**Current State:** Manual validation in components
**Opportunity:**
```typescript
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const companyInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  registration_id: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  industry: z.string().optional(),
  company_size: z.enum(["1-10", "11-50", "51-200", "201+"]),
  address: z.string().min(5, "Address too short"),
});

const form = useForm({
  resolver: zodResolver(companyInfoSchema),
});
```

**Benefits:**
- Type-safe validation
- Reusable schemas
- Better error messages
- Consistent validation logic

---

## 4. Security Enhancements

### File Upload Validation
**Current State:** Client-side validation only
**Opportunity:**
```typescript
// Add Edge Function for server-side validation
// supabase/functions/validate-upload/index.ts
export async function validateUpload(file: File) {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  // Check file size
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File too large');
  }
  
  // Scan for malware (integrate with ClamAV or similar)
  // ...
  
  return { valid: true };
}
```

**Benefits:**
- Cannot be bypassed by client manipulation
- Consistent validation
- Malware protection
- Rate limiting

---

### CSRF Token Validation
**Current State:** CSRF provider exists but not fully utilized
**Opportunity:**
```typescript
// Use CSRF tokens in all mutation operations
import { useSecurityContext } from '@/context/SecurityProvider';

const { getCsrfToken } = useSecurityContext();

const updateProfile = async () => {
  const token = await getCsrfToken();
  
  await supabase.rpc('update_profile_secure', {
    csrf_token: token,
    // ... other params
  });
};
```

**Benefits:**
- Protection against CSRF attacks
- Required for sensitive operations
- Audit trail

---

## 5. Testing Infrastructure

### Unit Tests for Business Logic
**Opportunity:**
```typescript
// src/components/shifts/form/utils/__tests__/paymentCalculator.test.ts
import { calculateWorkHours, calculateDailyPay } from '../paymentScheduleCalculator';

describe('Payment Calculator', () => {
  it('calculates work hours correctly', () => {
    expect(calculateWorkHours('09:00', '17:00')).toBe(8);
    expect(calculateWorkHours('23:00', '02:00')).toBe(3); // Overnight
  });
  
  it('calculates daily pay correctly', () => {
    expect(calculateDailyPay(50, 8)).toBe(400);
  });
});
```

---

### Integration Tests for Critical Flows
**Opportunity:**
```typescript
// tests/company-profile.spec.ts
test('company can update profile', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'company@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  await page.goto('/profile');
  await page.fill('[name="name"]', 'Updated Company Name');
  await page.click('button:has-text("Save Changes")');
  
  await expect(page.locator('.toast')).toContainText('success');
});
```

---

## 6. Accessibility Improvements

### ARIA Labels and Roles
**Opportunity:**
```typescript
// Add semantic HTML and ARIA attributes
<Button
  onClick={handleUpload}
  disabled={uploading}
  aria-label="Upload company logo"
  aria-busy={uploading}
>
  {uploading ? (
    <>
      <Loader2 className="animate-spin" aria-hidden="true" />
      <span>Uploading...</span>
    </>
  ) : (
    <>
      <Upload aria-hidden="true" />
      <span>Upload Logo</span>
    </>
  )}
</Button>
```

**Benefits:**
- Screen reader compatibility
- Better keyboard navigation
- WCAG 2.1 compliance
- Improved UX for all users

---

### Keyboard Navigation
**Opportunity:**
```typescript
// Add keyboard shortcuts
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };
  
  document.addEventListener('keydown', handleKeyPress);
  return () => document.removeEventListener('keydown', handleKeyPress);
}, [handleSave]);
```

---

## 7. Monitoring and Analytics

### Performance Monitoring
**Opportunity:**
```typescript
// Extend existing usePerformanceMonitor hook
const usePagePerformance = (pageName: string) => {
  useEffect(() => {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      
      // Send to analytics
      analytics.track('page_performance', {
        page: pageName,
        duration,
        timestamp: new Date().toISOString(),
      });
    };
  }, [pageName]);
};
```

---

### Error Tracking
**Opportunity:**
```typescript
// Integrate Sentry or similar
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
});

// Wrap ErrorBoundary
<Sentry.ErrorBoundary fallback={ErrorFallback}>
  <App />
</Sentry.ErrorBoundary>
```

**Benefits:**
- Automatic error reporting
- Stack traces with source maps
- User session replay
- Performance insights

---

## 8. Code Documentation

### JSDoc Comments
**Opportunity:**
```typescript
/**
 * Uploads a file to Supabase storage and updates the company profile
 * 
 * @param file - The file to upload (max 5MB for images, 10MB for documents)
 * @param docType - The type of document being uploaded
 * @returns Promise that resolves when upload is complete
 * @throws Error if upload fails or file is too large
 * 
 * @example
 * ```typescript
 * await handleFileUpload(logoFile, {
 *   type: "logo",
 *   label: "Company Logo",
 *   bucket: "company_logos",
 *   maxSize: 5 * 1024 * 1024,
 *   acceptTypes: "image/*"
 * });
 * ```
 */
const handleFileUpload = async (file: File, docType: DocumentFile) => {
  // ...
};
```

---

### Component Documentation
**Opportunity:**
```typescript
/**
 * CompanyProfileManager - Main profile management interface for company users
 * 
 * Provides a tabbed interface for managing:
 * - Company information (name, registration, contact details)
 * - Documents (logo, CR certificate, business license)
 * - Settings (password change)
 * - Account (account removal)
 * 
 * @component
 * @example
 * ```tsx
 * <CompanyProfileManager />
 * ```
 * 
 * @remarks
 * This component should only be rendered for users with role="company".
 * Uses AuthContext for user authentication state.
 */
export default function CompanyProfileManager() {
  // ...
}
```

---

## 9. Database Optimization

### Indexes for Common Queries
**Opportunity:**
```sql
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id 
ON company_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_shifts_company_id_date 
ON shifts(company_id, date);

CREATE INDEX IF NOT EXISTS idx_shift_assignments_promoter_id 
ON shift_assignments(promoter_id);
```

---

### Query Optimization
**Opportunity:**
```typescript
// Use select() to fetch only needed columns
const { data } = await supabase
  .from("shifts")
  .select("id, title, date, status") // Only needed fields
  .eq("company_id", user.id)
  .order("date", { ascending: false })
  .limit(20);

// Instead of:
// .select("*") // Fetches all columns
```

---

## 10. Developer Experience

### Storybook for Component Development
**Opportunity:**
```typescript
// src/components/company-profile/CompanyProfileManager.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import CompanyProfileManager from './CompanyProfileManager';

const meta: Meta<typeof CompanyProfileManager> = {
  title: 'Company/ProfileManager',
  component: CompanyProfileManager,
};

export default meta;
type Story = StoryObj<typeof CompanyProfileManager>;

export const Default: Story = {};
export const Loading: Story = {
  parameters: {
    mockData: {
      loading: true,
    },
  },
};
```

---

### Husky Pre-commit Hooks
**Opportunity:**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "tsc --noEmit"
    ]
  }
}
```

**Benefits:**
- Catch errors before commit
- Automatic formatting
- Consistent code style
- Prevent broken builds

---

## Implementation Priority

### High Priority (Do First)
1. ✅ Apply database migration
2. ✅ Add Zod validation schemas
3. ✅ Implement comprehensive error boundaries
4. ✅ Add unit tests for critical functions

### Medium Priority (Do Soon)
1. ⚠️ Add React Query for caching
2. ⚠️ Implement server-side file validation
3. ⚠️ Add integration tests
4. ⚠️ Improve accessibility

### Low Priority (Nice to Have)
1. 📋 Add Storybook
2. 📋 Set up error tracking (Sentry)
3. 📋 Add performance monitoring
4. 📋 Image optimization

---

## Conclusion

These enhancements build upon the solid foundation created during the refactoring. Implement them gradually based on priority and business needs.

**Estimated Total Implementation Time:** 2-3 sprints
**Expected Impact:** 
- 40% reduction in runtime errors
- 30% improvement in page load times
- 50% increase in test coverage
- Significantly better user experience
