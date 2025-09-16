# Smart Shift Tracker

An intelligent shift management and tracking system built with React, TypeScript, and Supabase.

## Features

- 🔐 **Authentication & Authorization** - Secure user management with role-based access
- 📅 **Shift Management** - Create, track, and manage work shifts
- 👥 **User Management** - Admin dashboard for managing promoters and companies
- 📊 **Analytics & Reporting** - Comprehensive reports and data visualization
- 💰 **Revenue Tracking** - Track earnings and financial metrics
- 📜 **Certificates** - Generate and verify work certificates
- 🕒 **Time Tracking** - Real-time shift tracking with GPS support
- 💬 **Messaging** - Internal communication system
- 🎓 **Training** - Training modules and certification system

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Radix UI (shadcn/ui)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Build Tool**: Vite
- **Charts**: Recharts
- **PDF Generation**: jsPDF
- **Routing**: React Router DOM
- **State Management**: React Query (TanStack Query)
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd smart-shift-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Update the environment variables with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:8080`

### Building for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── integrations/       # External service integrations
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the existing code style
3. Run tests and linting: `npm run lint`
4. Submit a pull request

## Environment Variables

See `.env.example` for all available environment variables.

## Database Schema

The application uses Supabase with the following main tables:
- `profiles` - User profiles and authentication data
- `shifts` - Shift information and scheduling
- `companies` - Company/client information
- `certificates` - Work certificates and verifications
- `time_entries` - Time tracking records

## License

This project is private and proprietary.

## Support

For support and questions, please contact the development team.
