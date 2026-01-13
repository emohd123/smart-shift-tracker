# Tester Guide - Smart Shift Tracker

Welcome! This guide will help you test the Smart Shift Tracker application.

## 🌐 Accessing the Application

**Application URL**: [Your deployed URL here]

## 👤 Test Accounts

Use these accounts to test different user roles:

### Admin Account
- **Email**: `admin@test.com`
- **Password**: [Set secure password]
- **Role**: Full system access

### Company Account
- **Email**: `company@test.com`
- **Password**: [Set secure password]
- **Role**: Can create and manage shifts

### Promoter Account
- **Email**: `promoter@test.com`
- **Password**: [Set secure password]
- **Role**: Can apply to shifts and track time

## 🧪 What to Test

### 1. Authentication & Access

**Test Sign Up**:
- [ ] Create a new account (choose role: Promoter or Company)
- [ ] Verify email confirmation (if enabled)
- [ ] Complete profile setup

**Test Login**:
- [ ] Login with each test account
- [ ] Verify correct dashboard loads based on role
- [ ] Test logout functionality

**Test Access Control**:
- [ ] Try accessing admin routes as non-admin (should redirect)
- [ ] Verify role-based navigation works

### 2. Admin Features

**User Management**:
- [ ] View all promoters in "Promoters & Companies Management"
- [ ] Filter promoters by status (All, Pending, Inactive)
- [ ] Search for specific promoters
- [ ] View promoter details
- [ ] Approve/reject promoter verification
- [ ] Request profile changes from promoters
- [ ] View change requests tab in promoter details

**Company Management**:
- [ ] View all companies
- [ ] Filter companies by status
- [ ] View company details
- [ ] Request profile changes from companies
- [ ] Approve/reject company verification

**Reports & Analytics**:
- [ ] View Reports & Analytics page
- [ ] Check different date ranges (7d, 30d, 90d, All, Custom)
- [ ] View Shifts tab with charts and data
- [ ] View Promoters tab with statistics
- [ ] View Companies tab with signup trends
- [ ] View Time Tracking tab
- [ ] View Ratings tab
- [ ] Export data (CSV/JSON)

**Dashboard**:
- [ ] View admin dashboard overview
- [ ] Click on metric cards to see detailed breakdowns
- [ ] Verify all metrics display correctly
- [ ] Check certificate revenue breakdown

### 3. Company Features

**Shift Management**:
- [ ] Create a new shift
- [ ] Edit an existing shift
- [ ] Assign promoters to shift
- [ ] View shift details
- [ ] View shift analytics

**Company Profile**:
- [ ] View company profile
- [ ] Update company information
- [ ] Upload company logo
- [ ] Upload CR document
- [ ] Upload business certificate
- [ ] View profile change requests (if any)

**Dashboard**:
- [ ] View company dashboard
- [ ] Check shift statistics
- [ ] View recent activity

### 4. Promoter Features

**Shift Browsing**:
- [ ] View available shifts
- [ ] Filter shifts by location, date, etc.
- [ ] Apply to shifts
- [ ] View applied shifts

**Time Tracking**:
- [ ] Check in for an assigned shift
- [ ] Check out from shift
- [ ] View time history
- [ ] Verify hours are calculated correctly
- [ ] View earnings

**Profile Management**:
- [ ] View profile page
- [ ] Update personal information
- [ ] Upload ID card
- [ ] Upload profile photo
- [ ] View profile change requests
- [ ] Mark requests as "In Progress"
- [ ] Mark requests as "Resolved"

**Dashboard**:
- [ ] View promoter dashboard
- [ ] Check upcoming shifts
- [ ] View earnings summary
- [ ] View performance stats

### 5. Profile Change Requests (New Feature)

**As Admin**:
- [ ] Open promoter/company detail view
- [ ] Click "Request Changes" button
- [ ] Select request type and field
- [ ] Write a message
- [ ] Submit request
- [ ] Verify notification is sent

**As User (Promoter/Company)**:
- [ ] Receive notification about change request
- [ ] View request in profile page
- [ ] Mark request as "In Progress"
- [ ] Update profile accordingly
- [ ] Mark request as "Resolved"
- [ ] View resolved requests (collapsed)

**Bulk Requests**:
- [ ] Select multiple promoters/companies
- [ ] Use bulk action "Request Changes"
- [ ] Verify requests created for all selected users
- [ ] Verify notifications sent to all

### 6. Real-Time Features

**Test Real-Time Updates**:
- [ ] Open app in two browser windows (different roles)
- [ ] Create a shift in one window
- [ ] Verify it appears in other window
- [ ] Send a message
- [ ] Verify it appears in real-time
- [ ] Create a profile change request
- [ ] Verify notification appears immediately

### 7. File Uploads

**Test File Uploads**:
- [ ] Upload ID card (image or PDF)
- [ ] Upload profile photo (image)
- [ ] Upload company logo (image)
- [ ] Upload CR document (PDF)
- [ ] Upload business certificate (PDF)
- [ ] Verify files are viewable
- [ ] Test file preview modal
- [ ] Test file download

**Test File Validation**:
- [ ] Try uploading file that's too large (should fail)
- [ ] Try uploading wrong file type (should fail)
- [ ] Verify error messages are clear

### 8. Error Handling

**Test Error Scenarios**:
- [ ] Try accessing page without login (should redirect)
- [ ] Try accessing admin page as promoter (should redirect)
- [ ] Test with slow internet connection
- [ ] Test with invalid form data
- [ ] Verify error messages are user-friendly

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **What you were trying to do**
2. **What happened instead**
3. **Steps to reproduce**:
   - Step 1: ...
   - Step 2: ...
   - Step 3: ...
4. **Browser and version** (e.g., Chrome 120, Firefox 121)
5. **Screenshots** (if applicable)
6. **Console errors** (if any):
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Copy error messages

**Report bugs via**:
- GitHub Issues: [Link]
- Email: [Email]
- Form: [Link]

## ✅ Testing Checklist Summary

**Critical Paths** (Must work):
- [ ] Login/Logout
- [ ] Role-based access
- [ ] Create shift (Company)
- [ ] Apply to shift (Promoter)
- [ ] Check in/out (Promoter)
- [ ] View reports (Admin)
- [ ] Profile change requests (Admin → User)

**Important Features**:
- [ ] File uploads
- [ ] Real-time updates
- [ ] Notifications
- [ ] Data export
- [ ] Search and filters

**Nice to Have**:
- [ ] Certificate generation (if Stripe configured)
- [ ] Messaging system
- [ ] Advanced analytics

## 💡 Tips for Testing

1. **Test with different browsers** if possible
2. **Test on mobile devices** (responsive design)
3. **Test with slow internet** to check loading states
4. **Try edge cases** (empty data, very long text, special characters)
5. **Test error scenarios** (wrong password, network errors)
6. **Verify data persistence** (refresh page, data should remain)

## ❓ Common Questions

**Q: I can't login**
- Check you're using correct email/password
- Try clearing browser cache/cookies
- Check browser console for errors

**Q: I don't see expected data**
- Verify you're logged in with correct role
- Check if data exists in database
- Try refreshing the page

**Q: File upload fails**
- Check file size (max 5MB for ID cards, 2MB for photos)
- Check file type (images: jpg, png, gif, webp | Documents: PDF)
- Check browser console for specific error

**Q: Real-time updates not working**
- Check internet connection
- Verify Supabase Realtime is enabled
- Check browser console for subscription errors

## 📞 Need Help?

If you encounter issues or have questions:
- Check this guide first
- Review browser console for errors
- Contact: [Support contact info]

---

**Thank you for testing Smart Shift Tracker!** 🎉

Your feedback helps make the application better for everyone.
