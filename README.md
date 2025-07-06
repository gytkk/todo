# Calendar Todo Monorepo

A Korean calendar-based todo application built with Next.js 15, TypeScript, and shadcn/ui components. This project uses Turborepo for efficient monorepo management.

## 🏗️ Project Structure

```text
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

### Backend App Commands (apps/backend/)

- `npm run build` - Build the NestJS application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with file watching
- `npm run start:debug` - Start in debug mode with file watching
- `npm run start:prod` - Start in production mode
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:debug` - Run tests in debug mode
- `npm run test:e2e` - Run end-to-end tests

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui with Radix UI primitives
- **Calendar**: react-big-calendar with date-fns
- **Localization**: Korean (ko) locale support
- **Icons**: Lucide React

### Backend

- **Framework**: NestJS with Express
- **Language**: TypeScript
- **Testing**: Jest with Supertest
- **Code Quality**: ESLint + Prettier
- **Build Tool**: SWC (Speedy Web Compiler)

### Development

- **Monorepo**: Turborepo
- **Package Manager**: npm with workspaces
- **Version Control**: Git with .gitignore for build artifacts

## 🎨 Key Components

### Frontend Components

- **CalendarView**: Full-screen calendar with Korean localization
- **TodoSidebar**: Sliding sidebar for date-specific todo management
- **Settings**: Comprehensive settings management with JSON editor
- **Statistics**: Usage analytics and completion tracking
- **Sidebar Navigation**: Collapsible navigation between home/settings

### Backend Components

- **NestJS API Server**: RESTful API with Express integration
- **Controllers**: Handle HTTP requests and route management
- **Services**: Business logic and data processing
- **Modules**: Dependency injection and application organization
- **Testing Suite**: Unit and E2E tests with Jest

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

### Full-Stack Development

- **Frontend**: Next.js app runs on port 3000 (development)
- **Backend**: NestJS API typically runs on port 3001 (configurable)
- **Turborepo**: Coordinates builds, tests, and development across both apps
- **Shared Types**: Consider adding shared TypeScript types in `packages/` for API contracts

### Code Style

- Use TypeScript with strong typing
- Follow camelCase for variables/functions, PascalCase for components
- Use early returns over deep nesting
- Keep components focused on single responsibility
- Import order: React, external libs, internal modules

## 📁 File Structure

```
apps/
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js app router
│   │   ├── components/          # React components
│   │   │   ├── calendar/        # Calendar-related components
│   │   │   ├── todo/           # Todo management components
│   │   │   └── ui/             # shadcn/ui components
│   │   ├── contexts/           # React contexts
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilities
│   │   ├── services/           # Business logic
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Helper functions
│   ├── components.json         # shadcn/ui configuration
│   ├── next.config.ts          # Next.js configuration
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   └── tsconfig.json          # TypeScript configuration
└── backend/
    ├── src/
    │   ├── app.controller.ts    # Main API controller
    │   ├── app.service.ts       # Business logic service
    │   ├── app.module.ts        # Root application module
    │   └── main.ts              # Application entry point
    ├── test/                   # E2E tests
    ├── nest-cli.json           # NestJS CLI configuration
    └── tsconfig.json          # TypeScript configuration
```

## 🚀 Deployment

### Frontend Deployment

The frontend app can be deployed on any platform that supports Next.js:

- **Vercel**: Connect your repository for automatic deployments
- **Netlify**: Use the Next.js build command
- **Docker**: Use the provided Dockerfile (if available)

### Backend Deployment

The backend API can be deployed on any platform that supports Node.js:

- **Railway**: Deploy NestJS applications with automatic scaling
- **Heroku**: Use the Node.js buildpack
- **Digital Ocean**: App Platform or Droplets
- **AWS**: EC2, ECS, or Lambda with serverless framework
- **Docker**: Containerized deployment

### Full-Stack Deployment

- **Turborepo**: Build all apps with `npm run build`
- **Environment Variables**: Configure separate environments for frontend and backend
- **API URLs**: Update frontend to point to deployed backend API
- **CORS**: Configure backend to allow frontend domain

## 📄 License

This project is private and not licensed for public use.

## 🤝 Contributing

This is a private project. Please follow the existing code style and patterns when making changes.

## 📞 Support

For questions or issues, please refer to the `CLAUDE.md` file for detailed development guidelines and architecture information.
