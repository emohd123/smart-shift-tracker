# ⚡ Quick Start: Get Smart Shift Tracker Running in 5 Minutes

## Step 1: Start the Dev Server (30 seconds)
```bash
npm run dev
```
Visit: http://localhost:8080

## Step 2: Populate Test Data (2 minutes)
In a new terminal:
```bash
node seed-test-data.js
```

Output will show test account credentials. Save these!

Example output:
```
✅ Test Credentials:
Promoters:
  Email: promoter1@test.com | Password: Test@123456
  Email: promoter2@test.com | Password: Test@123456

Companies:
  Email: company1@test.com | Password: Test@123456
```

## Step 3: Log In & Explore (2 minutes)

### As a Company User:
1. Go to http://localhost:8080/login
2. Email: `company1@test.com`
3. Password: `Test@123456`
4. Click "Company Dashboard"
5. **See "Available Promoters" section** with all 3 test promoters!
6. Click "Create Shift" to assign promoters

### As a Promoter User:
1. Go to http://localhost:8080/login
2. Email: `promoter1@test.com`
3. Password: `Test@123456`
4. Click "Promoter Dashboard"
5. View available shifts from companies
6. Go to "Time Tracking" to check in/out

### As an Admin User:
1. Go to http://localhost:8080/login
2. Email: `emohd123@gmail.com` (pre-created admin)
3. Password: (use your Supabase password)
4. Click "Admin Dashboard"
5. Explore 6 tabs: Overview, Users, Shifts, Revenue, Reports, System

## 🎯 What to Test

### Feature Checklist:

**Company Features:**
- [ ] View all approved promoters
- [ ] Create a new shift
- [ ] Assign promoters to shift
- [ ] View assigned promoters
- [ ] Send contract notifications
- [ ] Monitor shift assignments

**Promoter Features:**
- [ ] View available shifts
- [ ] Join shift
- [ ] Accept contract
- [ ] Time tracking (check-in/out)
- [ ] View time history
- [ ] See earnings

**Admin Features:**
- [ ] View system overview (Overview tab)
- [ ] Manage promoters (Users tab)
- [ ] Monitor shifts (Shifts tab)
- [ ] View revenue (Revenue tab)
- [ ] Check analytics (Reports tab)
- [ ] System admin tools (System tab)

## 📊 Database Status

Check current data:
```bash
node check-db.js
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "No promoters available" | Run `node seed-test-data.js` |
| Login fails | Check email/password from seed output |
| DevTools missing | Open DevTools (F12) at bottom of browser |
| Slow performance | Refresh page or restart dev server |

## 📚 Deep Dive Docs

- [Full Testing Guide](TESTING_AND_DEVELOPMENT.md) - Comprehensive testing
- [Issue Resolution](PROMOTER_ISSUE_RESOLVED.md) - Why empty state appears
- [Project Overview](PROJECT_OVERVIEW.md) - Architecture & design
- [Developer Guide](DEVELOPER_GUIDE.md) - Code patterns & conventions

## 🚀 Next Steps

1. **Seed test data**: `node seed-test-data.js`
2. **Test company workflow**: Create shift, assign promoters
3. **Test promoter workflow**: Check in, time tracking
4. **Test admin workflow**: View analytics, manage users
5. **Test end-to-end**: Full shift lifecycle from creation to payment

---

**Total Setup Time**: ~5 minutes ⏱️
**Everything Works**: ✅ Yes!
**Need Help**: Check troubleshooting section above
