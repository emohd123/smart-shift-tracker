# Go-Live Checklist for Smart Shift Tracker

This document outlines everything needed to deploy the application for others to test it.

## 🚨 Critical Requirements (Must Complete)

### 1. Environment Configuration

**Create `.env` file** (or `.env.local`) in project root:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

**Important**: 
- Never commit `.env` files to git
- Use production Supabase project credentials
- Verify keys are correct before deployment

**Verify environment variables are loaded**:
- Check `src/integrations/supabase/client.ts` uses `import.meta.env.VITE_SUPABASE_URL`
- Test connection in browser console: `window.location` should show correct URL

### 2. Database Setup

**Apply all migrations** (86 migration files):
```powershell
# Link to Supabase project
npx -y supabase@latest link --project-ref YOUR_PROJECT_REF

# Push all migrations
npx -y supabase@latest db push --linked --yes --password YOUR_DB_PASSWORD
```

**Verify critical tables exist**:
- ✅ `profiles` (with `user_roles` relationship)
- ✅ `shifts`
- ✅ `time_logs`
- ✅ `shift_assignments`
- ✅ `shift_ratings`
- ✅ `company_profiles`
- ✅ `notifications`
- ✅ `profile_change_requests` (newly added)
- ✅ `certificate_payments`
- ✅ `certificate_verifications`
- ✅ `contract_templates`
- ✅ `contract_acceptances`

**Verify RLS policies**:
- All tables have RLS enabled
- Policies allow appropriate access per role
- Test with different user roles

### 3. Storage Buckets

**Required buckets** (created via migrations or manually):
- ✅ `id_cards` - For promoter ID card uploads
- ✅ `profile_photos` - For user profile photos
- ✅ `company_logos` - For company logo uploads
- ✅ `company_documents` - For CR documents, business certificates
- ✅ `certificates` - For generated certificate PDFs

**Verify bucket policies**:
- Public read access for certificates (verification)
- Authenticated upload for user files
- Users can only access their own files

**Check in Supabase Dashboard**: Storage → Buckets

### 4. Edge Functions Deployment

**Deploy all Edge Functions**:
```powershell
# Deploy all functions
npx -y supabase@latest functions deploy --project-ref YOUR_PROJECT_REF

# Or deploy individually:
npx -y supabase@latest functions deploy verify-certificate
npx -y supabase@latest functions deploy stripe-webhook --no-verify-jwt
npx -y supabase@latest functions deploy auto-attendance --no-verify-jwt
npx -y supabase@latest functions deploy create-admin
npx -y supabase@latest functions deploy generate-certificate
npx -y supabase@latest functions deploy send-notification
```

**Verify functions are deployed**:
- Check Supabase Dashboard → Edge Functions
- Test endpoints if applicable

### 5. Secrets Configuration

**Set required secrets in Supabase**:
```powershell
# Stripe (if using payments)
npx -y supabase@latest secrets set STRIPE_SECRET_KEY=sk_live_...
npx -y supabase@latest secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Any other API keys needed
```

**Verify secrets are set**:
- Check Supabase Dashboard → Project Settings → Edge Functions → Secrets

### 6. Build Production Version

**Create production build**:
```bash
npm run build
```

**Verify build succeeds**:
- Check `dist/` folder is created
- No build errors in console
- All assets are generated

**Test production build locally**:
```bash
npm run preview
# Visit http://localhost:4173
```

### 7. Create Test Accounts

**Create test users for each role**:

**Admin Account**:
- Email: `admin@test.com`
- Password: (set secure password)
- Role: `admin` (set in `user_roles` table or via Edge Function)

**Company Account**:
- Email: `company@test.com`
- Password: (set secure password)
- Role: `company`
- Complete company profile (name, registration ID, etc.)

**Promoter Account**:
- Email: `promoter@test.com`
- Password: (set secure password)
- Role: `promoter`
- Upload ID card and profile photo
- Set verification status to `approved`

**Create via Supabase Dashboard** or use seed script:
```bash
npm run seed
```

### 8. Security Verification

**Check RLS policies**:
- ✅ Users can only see their own data
- ✅ Admins can see all data
- ✅ Companies can see their shifts and assigned promoters
- ✅ Promoters can see assigned shifts only

**Verify authentication**:
- ✅ Login works for all roles
- ✅ Logout clears session
- ✅ Protected routes redirect to login
- ✅ Role-based routing works correctly

**Check file upload security**:
- ✅ File size limits enforced (5MB ID cards, 2MB photos)
- ✅ File type validation (images/PDFs only)
- ✅ Users can't access other users' files

### 9. Error Handling Verification

**Test error scenarios**:
- ✅ Missing environment variables show helpful error
- ✅ Database connection failures handled gracefully
- ✅ Missing tables don't crash app (graceful degradation)
- ✅ Network errors show user-friendly messages
- ✅ Invalid file uploads rejected with clear messages

### 10. Performance Checks

**Verify**:
- ✅ Large data sets load efficiently (pagination works)
- ✅ Real-time subscriptions don't cause memory leaks
- ✅ Images are optimized/compressed
- ✅ Build size is reasonable (check `dist/` folder size)

## 📋 Pre-Deployment Testing

### Functional Testing

**Admin Flow**:
- [ ] Login as admin
- [ ] View admin dashboard
- [ ] Access promoters management
- [ ] Access companies management
- [ ] View reports & analytics
- [ ] Request profile changes from users
- [ ] Approve/reject user verifications

**Company Flow**:
- [ ] Login as company
- [ ] View company dashboard
- [ ] Create a shift
- [ ] Assign promoters to shift
- [ ] View shift analytics
- [ ] Upload company documents
- [ ] View profile change requests

**Promoter Flow**:
- [ ] Login as promoter
- [ ] View promoter dashboard
- [ ] Browse available shifts
- [ ] Apply to shifts
- [ ] Check in/out for shifts
- [ ] View time history
- [ ] Upload ID card and profile photo
- [ ] View profile change requests
- [ ] Mark requests as resolved

### Integration Testing

- [ ] Real-time updates work (shifts, messages, notifications)
- [ ] File uploads work (ID cards, photos, documents)
- [ ] Certificate generation works (if Stripe configured)
- [ ] Notifications are sent and received
- [ ] Profile change requests create notifications
- [ ] Bulk actions work (approve/reject multiple users)

### Cross-Browser Testing

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (if Mac available)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## 🌐 Deployment Options

### Option 1: Deploy via Lovable (Easiest)

1. Open [Lovable Project](https://lovable.dev/projects/40519eb3-740c-4168-b3f1-c76fd350524c)
2. Click **Share → Publish**
3. Share the generated URL with testers

**Pros**: 
- Easiest method
- Automatic deployments
- Built-in hosting

**Cons**:
- Limited customization
- Lovable branding

### Option 2: Deploy to Netlify

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy**:
   - Connect GitHub repo to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`

3. **Configure**:
   - Add custom domain (optional)
   - Set up redirects for SPA routing

**Pros**:
- Free tier available
- Custom domain support
- Easy CI/CD

### Option 3: Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set environment variables** in Vercel dashboard

**Pros**:
- Excellent performance
- Easy deployment
- Free tier available

### Option 4: Deploy to Traditional Hosting

1. Build: `npm run build`
2. Upload `dist/` folder contents to web server
3. Configure server to serve `index.html` for all routes (SPA routing)
4. Set environment variables on server

## 📝 Documentation for Testers

Create a **TESTER_GUIDE.md** with:

1. **How to Access**:
   - URL to application
   - Test account credentials (or signup instructions)

2. **What to Test**:
   - List of key features to test
   - Expected behaviors
   - How to report bugs

3. **Known Issues**:
   - List any known bugs or limitations
   - Workarounds if available

4. **Feedback Collection**:
   - How to report issues (GitHub issues, email, form, etc.)
   - What information to include (browser, steps to reproduce, screenshots)

## 🔍 Post-Deployment Monitoring

### Set Up Monitoring

1. **Error Tracking**:
   - Check browser console for errors
   - Monitor Supabase logs (Dashboard → Logs)
   - Set up error reporting (Sentry, LogRocket, etc.)

2. **Performance Monitoring**:
   - Monitor page load times
   - Check API response times
   - Monitor database query performance

3. **User Analytics** (Optional):
   - Set up Google Analytics or similar
   - Track user flows
   - Monitor feature usage

### Daily Checks

- [ ] Check Supabase logs for errors
- [ ] Verify all features still work
- [ ] Check storage usage
- [ ] Monitor database size
- [ ] Review user feedback

## ⚠️ Common Issues & Solutions

### Issue: "Missing VITE_SUPABASE_URL"
**Solution**: Ensure `.env` file exists and contains correct values. Restart dev server after creating `.env`.

### Issue: "Table doesn't exist" errors
**Solution**: Run `npx supabase db push` to apply all migrations.

### Issue: "RLS policy violation"
**Solution**: Check user role is set correctly in `user_roles` table. Verify RLS policies allow access.

### Issue: "File upload fails"
**Solution**: Verify storage buckets exist and policies allow uploads. Check file size/type limits.

### Issue: "Real-time subscriptions not working"
**Solution**: Verify Supabase Realtime is enabled for the table. Check subscription setup in code.

### Issue: "Edge Functions return 404"
**Solution**: Deploy Edge Functions using `npx supabase functions deploy`.

## ✅ Final Checklist Before Going Live

- [ ] All migrations applied successfully
- [ ] All Edge Functions deployed
- [ ] Storage buckets created and configured
- [ ] Environment variables set correctly
- [ ] Production build created successfully
- [ ] Test accounts created for all roles
- [ ] Security policies verified
- [ ] Error handling tested
- [ ] Cross-browser testing completed
- [ ] Documentation for testers created
- [ ] Deployment completed
- [ ] Application accessible via public URL
- [ ] Monitoring set up
- [ ] Backup plan in place

## 🎯 Quick Start for Testers

Once deployed, provide testers with:

1. **Application URL**: `https://your-app-url.com`
2. **Test Accounts**:
   ```
   Admin: admin@test.com / password
   Company: company@test.com / password
   Promoter: promoter@test.com / password
   ```
3. **Quick Test Scenarios**:
   - Sign up as new user
   - Login and explore dashboard
   - Create a shift (company)
   - Apply to shift (promoter)
   - Check in/out (promoter)
   - View reports (admin)

## 📞 Support & Troubleshooting

**For Testers**:
- Report issues via: [GitHub Issues / Email / Form]
- Include: Browser, steps to reproduce, screenshots

**For Developers**:
- Check `TESTING_GUIDE.md` for detailed testing procedures
- Review Supabase logs for backend errors
- Check browser console for frontend errors
- Verify environment variables are correct

---

## 🚀 Deployment Commands Summary

```bash
# 1. Set environment variables (create .env file)
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...

# 2. Link Supabase project
npx -y supabase@latest link --project-ref YOUR_PROJECT_REF

# 3. Apply migrations
npx -y supabase@latest db push --linked --yes --password YOUR_DB_PASSWORD

# 4. Deploy Edge Functions
npx -y supabase@latest functions deploy --project-ref YOUR_PROJECT_REF

# 5. Build for production
npm run build

# 6. Test production build locally
npm run preview

# 7. Deploy to hosting (choose one):
# - Lovable: Share → Publish
# - Netlify: Connect repo, set env vars, deploy
# - Vercel: vercel
# - Traditional: Upload dist/ folder
```

---

**Last Updated**: January 2025
**Status**: Ready for deployment after completing checklist items
