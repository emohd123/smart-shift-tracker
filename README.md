# Smart Shift Tracker 🚀

A comprehensive full-stack shift management platform connecting companies with part-time workers (promoters), featuring real-time tracking, multi-role dashboards, and automated attendance management.

## 📚 Documentation

**👉 [Read the Complete Project Overview](PROJECT_OVERVIEW.md)** - Comprehensive guide covering architecture, features, and implementation details
**👉 [Supabase MCP (Cursor) Full Access Setup](MCP_SUPABASE_FULL_ACCESS_SETUP.md)** - Enable write access safely (Windows-focused)

### Quick Links
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)

## Project info

**URL**: https://lovable.dev/projects/40519eb3-740c-4168-b3f1-c76fd350524c

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/40519eb3-740c-4168-b3f1-c76fd350524c) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 🎯 Key Features

- **Multi-Role System**: Separate dashboards for Admins, Companies, and Promoters
- **Shift Management**: Create, assign, and track shifts with geofencing support
- **Time Tracking**: Automated check-in/check-out with real-time attendance monitoring
- **Certificate Generation**: Work certificates with QR code verification via Stripe
- **Messaging System**: Direct messaging with real-time updates
- **Multi-Currency**: Support for international operations
- **Real-Time Updates**: Live shift status and notifications via Supabase subscriptions
- **Comprehensive Reporting**: Analytics and reports for all user roles

## 💻 Technology Stack

### Frontend
- **React 18.3** + **TypeScript 5.5** + **Vite 5.4**
- **Tailwind CSS** + **shadcn/ui** (60+ components)
- **React Router v6** + **Framer Motion**
- **React Hook Form** + **Zod** validation

### Backend
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Edge Functions** (Deno runtime)
- **Stripe** payment integration
- **Row Level Security (RLS)** on all tables

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (or Bun)
- Supabase account
- Stripe account (for payment features)

### Installation

1. **Clone and install**
   ```bash
   git clone <YOUR_GIT_URL>
   cd smart-shift-tracker
   npm install
   ```

2. **Configure environment**
   Create a local env file (recommended: `.env.local` or `.env`). **Do not commit it**:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

3. **Set up database**
   - Follow `BACKEND_SETUP.md` (uses `supabase/migrations/` + `supabase/functions/`)

4. **Start development**
   ```bash
   npm run dev
   # App runs on http://localhost:8080
   ```

5. **Test the application**
   - See `TESTING_GUIDE.md` for comprehensive testing procedures

### Build for Production
```bash
npm run build        # Production build
npm run preview      # Preview production build
```

## 📁 Project Structure

```
smart-shift-tracker/
├── src/
│   ├── components/        # React components (100+)
│   │   ├── ui/           # shadcn/ui components
│   │   ├── dashboard/    # Dashboard components
│   │   └── ...
│   ├── pages/            # Route pages (25 pages)
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utility libraries
│   └── types/            # TypeScript types
├── supabase/
│   ├── functions/        # Edge Functions
│   └── migrations/       # Database migrations (60+)
├── PROJECT_OVERVIEW.md   # 📘 Complete documentation
├── BACKEND_SETUP.md
└── TESTING_GUIDE.md
```

## 👥 User Roles

### Admin
Full platform access, user management, reports, analytics, data purge

### Company  
Create shifts, manage promoters, track attendance, view analytics

### Promoter
View shifts, check-in/out, track hours, generate certificates, view earnings

## 🔒 Security Features

- Row Level Security (RLS) on all database tables
- CSRF protection via SecurityProvider
- Rate limiting (100 req/min)
- Secure file uploads with validation
- Password reset functionality
- Role-based route guards

## 📊 Key Metrics

- **4,625** lines of TypeScript/React code
- **60+** database migrations
- **100+** React components
- **25** pages/routes
- **6** Edge Functions
- **3** user roles with granular permissions

## 🤝 Contributing

Changes can be made via:
- **Lovable**: Visit the [project](https://lovable.dev/projects/40519eb3-740c-4168-b3f1-c76fd350524c) and start prompting
- **Local IDE**: Clone, edit, and push changes
- **GitHub**: Edit files directly or use Codespaces

## 📝 Additional Documentation

- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Complete technical documentation
- **[BACKEND_SETUP.md](BACKEND_SETUP.md)** - Supabase migrations + Edge Functions setup/deploy
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing procedures

## 🚀 Deployment

### Via Lovable
Simply open [Lovable](https://lovable.dev/projects/40519eb3-740c-4168-b3f1-c76fd350524c) and click on Share → Publish.

### Custom Domain
For custom domains, we recommend using Netlify. Visit [Custom domains guide](https://docs.lovable.dev/tips-tricks/custom-domain/) for details.

## 📞 Support

- Check documentation files for detailed guides
- Review browser console and Supabase logs for errors
- See `TESTING_GUIDE.md` for troubleshooting common issues

---

**Built with ❤️ using Lovable, React, TypeScript, and Supabase**


<!-- AUTO-DEPLOY-ENABLED: GitHub Actions auto-deploy configured -->
