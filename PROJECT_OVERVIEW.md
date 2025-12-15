# Smart Shift Tracker - Project Overview

## 📋 Table of Contents
1. [Project Description](#project-description)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Architecture Overview](#architecture-overview)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Core Functionality](#core-functionality)
7. [Database Schema](#database-schema)
8. [Getting Started](#getting-started)
9. [Project Structure](#project-structure)
10. [Security Features](#security-features)

---

## 🎯 Project Description

**Smart Shift Tracker** is a comprehensive, full-stack shift management platform designed to connect companies with part-time workers (promoters). The platform streamlines the entire shift lifecycle - from creation and assignment to time tracking, payment management, and performance reporting.

### Purpose
- **For Companies**: Create and manage shifts, find qualified promoters, track attendance and performance
- **For Promoters**: Find available shifts, track working hours, manage earnings, generate work certificates
- **For Admins**: Oversee the entire platform, manage users, generate reports, handle data management

### Business Value
The platform solves the complexity of managing temporary/part-time workforce by providing:
- Real-time shift availability and assignment
- Automated time tracking with geofencing
- Transparent payment tracking
- Certificate generation for work verification
- Multi-currency support for international operations
- Comprehensive reporting and analytics

---

## ✨ Key Features

### 1. **Multi-Role Dashboard System**
- **Promoter Dashboard**: View available shifts, track hours, monitor earnings
- **Company Dashboard**: Manage shifts, view assigned promoters, track shift performance
- **Admin Dashboard**: Platform-wide oversight, user management, system analytics

### 2. **Advanced Shift Management**
- Create shifts with detailed requirements (location, time, pay rate, description)
- Geofencing support for location-based check-ins
- Real-time shift status tracking (upcoming, ongoing, completed, cancelled)
- Shift assignment system with promoter capacity management
- Shift history and performance metrics

### 3. **Time Tracking & Attendance**
- Check-in/check-out functionality with timestamp recording
- Geofencing validation (optional) for location verification
- Automatic attendance via scheduled Edge Functions
- Time history with detailed logs
- Hours calculation and payment tracking

### 4. **Certificate Generation System**
- Promoters can purchase work certificates via Stripe integration
- PDF generation with QR codes for verification
- Public certificate verification endpoint
- Multiple certificate types (employment verification, time period certificates)
- Unique reference numbers for each certificate

### 5. **Messaging System**
- Direct messaging between users
- Real-time message updates via Supabase subscriptions
- Unread message notifications
- Message history and search

### 6. **Promoter Management**
- Detailed promoter profiles (personal info, work history, verification status)
- ID card and profile photo uploads
- Verification system (pending, approved, rejected)
- Unique code generation for each promoter
- Skills and experience tracking

### 7. **Financial Management**
- Multi-currency support based on user nationality
- Revenue tracking and reporting
- Payment history
- Earnings analytics

### 8. **Reporting & Analytics**
- Comprehensive reports for admins and companies
- Shift performance metrics
- Promoter attendance and productivity
- Revenue analytics
- Export capabilities (PDF reports via jsPDF)

### 9. **Security Features**
- CSRF protection via SecurityProvider
- Content Security Policy (CSP) headers
- Rate limiting (100 requests/minute)
- Row Level Security (RLS) on all database tables
- Secure file uploads with size and type validation
- Password reset functionality

### 10. **Real-Time Features**
- Live shift updates using Supabase realtime subscriptions
- Real-time notification badges
- Instant message delivery
- Live attendance tracking

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **Build Tool**: Vite 5.4.1
- **Routing**: React Router v6.26.2
- **Styling**: 
  - Tailwind CSS 3.4.11
  - Framer Motion 12.5.0 (animations)
  - shadcn/ui component library (60+ components)
- **Forms**: React Hook Form 7.53.0
- **Validation**: Zod 3.23.8
- **State Management**: React Context API + Custom Hooks
- **Charts**: Recharts 2.12.7
- **Notifications**: Sonner 1.5.0
- **Date Handling**: date-fns 3.6.0
- **QR Codes**: react-qr-code 2.0.15, qrcode 1.5.3
- **PDF Generation**: jsPDF 3.0.0, jspdf-autotable 5.0.2

### Backend
- **Database & Auth**: Supabase 2.81.1
  - PostgreSQL database
  - Authentication system
  - Row Level Security (RLS)
  - Realtime subscriptions
  - Storage buckets
- **Serverless Functions**: Supabase Edge Functions (Deno runtime)
  - auto-attendance
  - create-certificate-checkout
  - generate-unique-code
  - stripe-webhook
  - verify-certificate
- **Payment Processing**: Stripe (via Edge Functions)

### Development Tools
- **Linting**: ESLint 9.9.0
- **Package Manager**: npm (also supports bun)
- **IDE**: VS Code optimized (via Lovable)

---

## 🏗 Architecture Overview

### Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       React Application                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Context Providers (Nested)                │ │
│  │  1. ErrorProvider → 2. SecurityProvider → 3. AuthProvider│
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    React Router                        │ │
│  │   Public Routes | Protected Routes (Role-based)       │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              shadcn/ui Components                      │ │
│  │   60+ UI primitives + Custom Components               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐│
│  │ PostgreSQL │  │    Auth    │  │  Storage Buckets      ││
│  │  Database  │  │   System   │  │  - id_cards (5MB)     ││
│  │  + RLS     │  │            │  │  - profile_photos (2MB)││
│  └────────────┘  └────────────┘  └────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Edge Functions (Deno)                      ││
│  │  auto-attendance | certificate-checkout | stripe-webhook││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │           Realtime Subscriptions                        ││
│  │  Live updates for shifts, messages, notifications      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│              Stripe Payment Processing                       │
└─────────────────────────────────────────────────────────────┘
```

### Context Architecture
The application uses a nested provider pattern (order is critical):
1. **ErrorProvider**: Global error handling and reporting
2. **SecurityProvider**: CSRF tokens, CSP headers, rate limiting
3. **AuthProvider**: Session management, user authentication, role management

### Data Flow Pattern
1. **Component** → Calls custom hook (e.g., `useShifts`)
2. **Hook** → Queries Supabase directly using client
3. **Supabase** → Validates via RLS policies
4. **Database** → Returns data
5. **Realtime** → Subscribes to changes, auto-updates component

### Authentication Flow
```
User Login → Supabase Auth → Session Created → 
RPC call (get_user_role) → Fetch from user_roles table →
Format user object → Store in AuthContext → 
Route to role-specific dashboard
```

---

## 👥 User Roles & Permissions

### Role Hierarchy
The system implements three distinct roles via the `user_roles` table:

#### 1. **Admin** (Highest privileges)
- **Routes**: `/admin`, `/promoters`, `/reports`, `/revenue`, `/data-purge`
- **Capabilities**:
  - View all users, shifts, and data
  - Manage promoter verification status
  - Access comprehensive reports and analytics
  - Purge old data
  - Override company shift management
  - View platform-wide revenue

#### 2. **Company** (Mid-tier privileges)
- **Routes**: `/company`, `/shifts/create`, `/shifts/:id/edit`
- **Capabilities**:
  - Create and manage own shifts
  - Assign promoters to shifts
  - View assigned promoter details
  - Track shift attendance
  - Message promoters
  - View own company analytics

#### 3. **Promoter** (Basic privileges)
- **Routes**: `/time`, `/time-history`, `/certificates`
- **Capabilities**:
  - View available shifts
  - Apply for shifts (via assignment)
  - Check-in/check-out of shifts
  - Track own hours and earnings
  - Purchase and generate certificates
  - Message companies and admins
  - View own profile and history

### Role-Based Access Control (RBAC) Implementation
- **Database Level**: Row Level Security (RLS) policies on all tables
- **Application Level**: `ProtectedRoute` component checks user role
- **Security Functions**: `has_role()` and `get_user_role()` (security definer functions prevent RLS recursion)

---

## ⚙️ Core Functionality

### Shift Lifecycle

1. **Creation** (Company/Admin)
   - Fill shift details: title, description, location, date/time, pay rate
   - Optional: Add geofencing location for check-ins
   - Set promoter requirements and capacity
   - Status: Initially "upcoming"

2. **Assignment** (Admin/Company)
   - Search and select promoters
   - Assign to shift via `shift_assignments` table
   - Notify assigned promoters

3. **Execution** (Promoter)
   - View shift in dashboard
   - Navigate to shift location (if geofenced)
   - Check-in at shift start time
   - Work the shift
   - Check-out at shift end time

4. **Tracking** (System)
   - Time logs stored in `time_logs` table
   - Auto-attendance via Edge Function runs scheduled checks
   - Calculate hours worked
   - Update shift status (ongoing → completed)

5. **Completion** (System/Company)
   - Shift marked as "completed"
   - Hours finalized
   - Payment calculated and tracked
   - Available for reporting

### File Upload System
**Storage Buckets**:
- `id_cards`: 5MB limit, accepts JPG/PNG/PDF
- `profile_photos`: 2MB limit, accepts JPG/PNG/WEBP

**Upload Pattern**:
```typescript
const { data, error } = await supabase.storage
  .from('bucket_name')
  .upload(`${userId}/filename.ext`, file);
```

**Security**: RLS policies ensure users only access their own folder:
```sql
auth.uid()::text = (storage.foldername(name))[1]
```

### Real-Time Updates
**Pattern** used across components:
```typescript
const channel = supabase
  .channel('unique-channel-name')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'table_name' 
  }, handleChange)
  .subscribe();

// Cleanup
return () => { supabase.removeChannel(channel); };
```

**Examples**:
- Shift list auto-updates when new shifts created
- Message badge updates in real-time
- Notification counts refresh automatically

### Certificate Generation
1. **Purchase**: Promoter selects certificate type → Stripe checkout
2. **Payment**: Webhook validates payment via `stripe-webhook` Edge Function
3. **Generation**: 
   - Create record in `certificates` table
   - Generate unique reference number
   - Create PDF with QR code
   - Upload to storage
4. **Verification**: Public endpoint `/verify-certificate` checks reference number

---

## 🗄 Database Schema

### Core Tables

#### `profiles`
Stores user profile information
- `id` (UUID, PK, FK to auth.users)
- `full_name`, `email`, `nationality`, `age`, `phone_number`
- `gender` (enum: Male, Female, Other)
- `height`, `weight`, `is_student`, `address`
- `bank_details`, `id_card_url`, `profile_photo_url`
- `verification_status` (enum: pending, approved, rejected)
- `unique_code` (generated for promoters)
- `created_at`, `updated_at`

#### `user_roles`
Maps users to their roles (supports multi-role but typically one per user)
- `id` (UUID, PK)
- `user_id` (UUID, FK to auth.users)
- `role` (enum: admin, company, promoter)
- `created_at`
- Unique constraint on (user_id, role)

#### `shifts`
Stores shift information
- `id` (UUID, PK)
- `title`, `description`, `location`
- `start_time`, `end_time`, `hourly_rate`
- `status` (enum: upcoming, ongoing, completed, cancelled)
- `created_by` (UUID, FK to profiles)
- `created_at`, `updated_at`

#### `shift_locations`
Optional geofencing data for shifts
- `id` (UUID, PK)
- `shift_id` (UUID, FK to shifts)
- `latitude`, `longitude`, `radius`

#### `shift_assignments`
Links promoters to shifts
- `id` (UUID, PK)
- `shift_id` (UUID, FK to shifts)
- `promoter_id` (UUID, FK to profiles)
- `assigned_at`, `status`

#### `time_logs`
Records check-in/check-out times
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `shift_id` (UUID, FK to shifts)
- `check_in`, `check_out`
- `hours_worked`, `total_pay`
- `created_at`

#### `certificates`
Stores work certificates
- `id` (UUID, PK)
- `user_id` (UUID, FK to auth.users)
- `reference_number` (unique)
- `certificate_type`, `time_period`
- `pdf_url`, `issued_date`
- `created_at`

#### `messages`
Direct messaging between users
- `id` (UUID, PK)
- `sender_id`, `recipient_id` (UUIDs, FK to profiles)
- `content`, `is_read`
- `created_at`

### Security Functions

#### `has_role(user_id, role)`
Security definer function that checks if a user has a specific role.
Used in RLS policies to prevent recursion.

#### `get_user_role(user_id)`
Security definer function that returns a user's primary role.
Priority: admin > company > promoter

### RLS Policies
Every table has Row Level Security enabled with policies like:
- Users can view their own data
- Admins can view all data
- Companies can manage their own shifts
- Promoters can view assigned shifts

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (or Bun)
- npm or bun package manager
- Supabase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-shift-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   Create `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run all SQL migrations from `SUPABASE_SETUP_INSTRUCTIONS.md` in order
   - Deploy Edge Functions from `supabase/functions/`
   - Configure Stripe webhook in Supabase Edge Functions

5. **Run the development server**
   ```bash
   npm run dev
   # Application runs on http://localhost:8080
   ```

6. **Build for production**
   ```bash
   npm run build
   # or for development mode build
   npm run build:dev
   ```

### First-Time Setup Checklist
- [ ] Database migrations completed (see `SUPABASE_SETUP_INSTRUCTIONS.md`)
- [ ] Storage buckets created (`id_cards`, `profile_photos`)
- [ ] RLS policies enabled on all tables
- [ ] Edge Functions deployed
- [ ] Stripe webhook configured
- [ ] Environment variables set
- [ ] Test signup flow (see `TESTING_GUIDE.md`)

---

## 📁 Project Structure

```
smart-shift-tracker/
├── public/                      # Static assets
├── src/
│   ├── components/              # React components
│   │   ├── ui/                 # shadcn/ui components (60+)
│   │   ├── dashboard/          # Dashboard components
│   │   ├── admin/              # Admin-specific components
│   │   ├── promoters/          # Promoter management
│   │   ├── certificates/       # Certificate system
│   │   ├── messages/           # Messaging components
│   │   ├── notifications/      # Notification badges
│   │   ├── security/           # Security components
│   │   ├── devtools/           # Development tools
│   │   └── ProtectedRoute.tsx  # Route guard component
│   ├── context/                # React Context providers
│   │   ├── AuthContext.tsx     # Authentication state
│   │   ├── ErrorContext.tsx    # Error handling
│   │   └── SecurityContext.tsx # Security features
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuthState.ts     # Auth state management
│   │   ├── useAuthHooks.ts     # Auth methods
│   │   ├── useShifts.ts        # Shift data hooks
│   │   └── signup/             # Signup-related hooks
│   ├── integrations/
│   │   └── supabase/
│   │       └── client.ts       # Supabase client singleton
│   ├── lib/                    # Utility libraries
│   │   ├── utils.ts            # General utilities (cn helper)
│   │   └── countries.ts        # Country/currency mapping
│   ├── pages/                  # Route pages (25 pages)
│   │   ├── Index.tsx           # Landing page
│   │   ├── Login.tsx           # Login page
│   │   ├── Signup.tsx          # Signup page
│   │   ├── Dashboard.tsx       # Main dashboard router
│   │   ├── PromoterDashboard.tsx
│   │   ├── CompanyDashboard.tsx
│   │   ├── AdminOverview.tsx
│   │   ├── Shifts.tsx          # Shift listing
│   │   ├── CreateShift.tsx     # Shift creation
│   │   ├── TimeTracking.tsx    # Check-in/out
│   │   ├── Certificates.tsx    # Certificate management
│   │   ├── Messages.tsx        # Messaging
│   │   └── ...                 # Other pages
│   ├── types/
│   │   └── database.ts         # TypeScript enums and types
│   ├── utils/                  # Utility functions
│   │   ├── validation.ts       # Validation helpers
│   │   └── uniqueCodeGenerator.ts
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Application entry point
│   └── index.css               # Global styles
├── supabase/
│   ├── functions/              # Edge Functions (Deno)
│   │   ├── auto-attendance/
│   │   ├── create-certificate-checkout/
│   │   ├── generate-unique-code/
│   │   ├── stripe-webhook/
│   │   └── verify-certificate/
│   ├── migrations/             # Database migrations (60+ files)
│   └── config.toml             # Supabase configuration
├── .env                        # Environment variables (template)
├── package.json                # Dependencies and scripts
├── vite.config.ts              # Vite configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── README.md                   # Basic project info
├── SUPABASE_SETUP_INSTRUCTIONS.md  # Database setup guide
├── TESTING_GUIDE.md            # Testing procedures
└── PROJECT_OVERVIEW.md         # This file
```

### Key Files Explained

- **`App.tsx`**: Defines routing and provider hierarchy
- **`ProtectedRoute.tsx`**: Guards routes based on authentication and role
- **`AuthContext.tsx`**: Central authentication state management
- **`supabase/client.ts`**: Singleton Supabase client with auth persistence
- **`database.ts`**: TypeScript enums matching database types
- **`components/ui/`**: All shadcn/ui components (Button, Input, Dialog, etc.)

---

## 🔒 Security Features

### Authentication
- Supabase Auth with email/password
- Remember me functionality (localStorage vs sessionStorage)
- Password reset via email
- Session management with automatic refresh

### Authorization
- Role-Based Access Control (RBAC) at three levels:
  1. Database: RLS policies
  2. Application: ProtectedRoute component
  3. UI: Conditional rendering based on role

### Data Security
- Row Level Security (RLS) on all tables
- Security definer functions for role checks (prevents RLS recursion)
- File upload size limits (5MB ID cards, 2MB photos)
- File type validation (only images and PDFs)
- User can only access their own files in storage

### Application Security
- **CSRF Protection**: SecurityProvider generates and validates tokens
- **Content Security Policy (CSP)**: Headers set via SecurityProvider
- **Rate Limiting**: 100 requests per minute per user
- **Input Validation**: Forms validated via react-hook-form + zod
- **SQL Injection Prevention**: Parameterized queries via Supabase client
- **XSS Prevention**: React's built-in escaping + CSP headers

### API Security
- Edge Functions use service role key (not exposed to client)
- Stripe webhook signature verification
- Public endpoints are limited (certificate verification only)

### Best Practices
- No sensitive data in client-side code
- Environment variables for secrets
- HTTPS only in production
- Regular security audits via RLS policy reviews
- Error messages don't expose system details

---

## 📊 Code Statistics

- **Total Lines of Code**: ~4,625 lines (TypeScript/React)
- **Database Migrations**: 60+ SQL migration files
- **React Components**: 100+ components
- **Pages/Routes**: 25 pages
- **Edge Functions**: 6 serverless functions
- **UI Components**: 60+ shadcn/ui primitives
- **Custom Hooks**: 20+ hooks for business logic

---

## 🔄 Development Workflow

### Development
```bash
npm run dev          # Start development server (port 8080)
npm run build        # Production build
npm run build:dev    # Development mode build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Testing
See `TESTING_GUIDE.md` for comprehensive testing procedures including:
- Signup/login flows
- Role-based access
- File uploads
- Shift management
- Certificate generation
- Real-time features

### Database Migrations
Migrations are in `supabase/migrations/` and must be run in chronological order.
See `SUPABASE_SETUP_INSTRUCTIONS.md` for setup sequence.

---

## 🤝 Contributing

This project is built using [Lovable](https://lovable.dev), which means:
- Changes via Lovable are automatically committed to the repository
- You can also clone and work locally, pushing changes as usual
- The project structure follows React + Vite + TypeScript best practices
- Use shadcn/ui patterns for any new UI components
- Follow the existing Context + Hooks pattern for state management
- Always add RLS policies for new database tables

---

## 📝 Additional Resources

- **Supabase Documentation**: https://supabase.com/docs
- **shadcn/ui Documentation**: https://ui.shadcn.com
- **React Router v6**: https://reactrouter.com
- **Tailwind CSS**: https://tailwindcss.com
- **Stripe API**: https://stripe.com/docs

---

## 📞 Support

For issues or questions:
1. Check `TESTING_GUIDE.md` for common problems
2. Review `SUPABASE_SETUP_INSTRUCTIONS.md` for setup issues
3. Check browser console and Supabase logs for errors
4. Review the code comments in key files

---

## 📜 License

This project structure and documentation is part of the Smart Shift Tracker platform.

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Status**: Active Development
