# Calendar Todo Monorepo

A Korean calendar-based todo application built with Next.js 15, TypeScript, and shadcn/ui components. This project uses Turborepo for efficient monorepo management.

## 🏗️ Project Structure

```
├── apps/
│   └── frontend/          # Next.js todo calendar application
├── packages/
│   └── shared-config/     # Shared configuration files
├── turbo.json            # Turborepo configuration
└── package.json          # Root package.json with workspaces
```

## ✨ Features

- **Full-screen Calendar**: Built with react-big-calendar and date-fns Korean localization
- **Dual Sidebar Layout**: Collapsible navigation sidebar + sliding todo management sidebar
- **Todo Management**: Date-specific todo creation, editing, and completion tracking
- **Settings Management**: Comprehensive settings with JSON editor and data export/import
- **Statistics Dashboard**: Usage analytics and completion rates
- **Responsive Design**: Modern UI with shadcn/ui components and Tailwind CSS
- **Local Storage**: Persistent data storage with automatic date serialization

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 10+

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd calendar-todo
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📝 Available Scripts

### Root Level Commands (Turborepo)

- `npm run dev` - Start all development servers using Turbo
- `npm run build` - Build all applications using Turbo
- `npm run lint` - Run ESLint on all packages using Turbo
- `npm run type-check` - Run TypeScript type checking on all packages using Turbo
- `npm run clean` - Clean cache files across all packages using Turbo

### Frontend App Commands (apps/frontend/)

- `npm run dev` - Start development server with Turbopack
- `npm run dev:stable` - Start development server on port 3000
- `npm run dev:fallback` - Start development server on port 3001
- `npm run build` - Build for production
- `npm run build:clean` - Clean build with .next removal
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean cache files

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui with Radix UI primitives
- **Calendar**: react-big-calendar with date-fns
- **Localization**: Korean (ko) locale support
- **Icons**: Lucide React
- **Monorepo**: Turborepo
- **Package Manager**: npm with workspaces

## 🎨 Key Components

- **CalendarView**: Full-screen calendar with Korean localization
- **TodoSidebar**: Sliding sidebar for date-specific todo management
- **Settings**: Comprehensive settings management with JSON editor
- **Statistics**: Usage analytics and completion tracking
- **Sidebar Navigation**: Collapsible navigation between home/settings

## 📊 Data Structure

```typescript
interface TodoItem {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
}

interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: TodoItem;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  // ... other settings
}
```

## 🔧 Development

### Adding New Apps

To add a new app to the monorepo:

1. Create a new directory in `apps/`
2. Add the app's `package.json`
3. Update the root `turbo.json` if needed
4. Install dependencies from the root: `npm install`

### Adding New Packages

To add a new shared package:

1. Create a new directory in `packages/`
2. Add the package's `package.json`
3. Reference it in other packages as needed

### Code Style

- Use TypeScript with strong typing
- Follow camelCase for variables/functions, PascalCase for components
- Use early returns over deep nesting
- Keep components focused on single responsibility
- Import order: React, external libs, internal modules

## 📁 File Structure

```
apps/frontend/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   │   ├── calendar/        # Calendar-related components
│   │   ├── todo/           # Todo management components
│   │   └── ui/             # shadcn/ui components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities
│   ├── services/           # Business logic
│   ├── types/              # TypeScript types
│   └── utils/              # Helper functions
├── components.json         # shadcn/ui configuration
├── next.config.ts          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## 🚀 Deployment

The frontend app can be deployed on any platform that supports Next.js:

- **Vercel**: Connect your repository for automatic deployments
- **Netlify**: Use the Next.js build command
- **Docker**: Use the provided Dockerfile (if available)

## 📄 License

This project is private and not licensed for public use.

## 🤝 Contributing

This is a private project. Please follow the existing code style and patterns when making changes.

## 📞 Support

For questions or issues, please refer to the `CLAUDE.md` file for detailed development guidelines and architecture information.
