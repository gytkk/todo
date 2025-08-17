# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

**CAUTION** Do not update this 'Critical Rules' section!!!

### Overall

- **NEVER use `npm` commands directly** - always use `pnpm` or `turbo` for development tools
- **AVOID `turbo build` during development** - use `turbo dev` for hot-reload and `turbo type-check`/`turbo lint` for validation
- **DO NOT run development servers directly** - only describe commands for users to run themselves
- Always write unit tests first, then implement business logic
- Check lint errors and code style after you write code

### Code Style Guidelines

- Use TypeScript with strong typing; avoid `any` when possible
- Use camelCase for variables/functions, PascalCase for components/classes
- Imports: group React imports first, then external libs, then internal modules
- Error handling: prefer early returns over deep nesting
- Keep components focused on a single responsibility

## Project Overview

This is a Korean calendar-based todo application built with Next.js 15, TypeScript, and shadcn/ui components for the frontend, and Fastify for the backend API. The app features a custom-built calendar implementation with a collapsible sidebar navigation and comprehensive settings management, providing an intuitive and modern todo management experience with category support and robust PostgreSQL-backed API.

**Key Technologies:**

- **Frontend**: Next.js 15, React 19, TypeScript, shadcn/ui, Tailwind CSS
- **Backend**: Fastify, TypeScript, JWT Authentication, Swagger/OpenAPI, Prisma ORM
- **Database**: PostgreSQL 15 with Prisma Client
- **Infrastructure**: Local PostgreSQL via Prisma development server
- **Testing**: Jest with coverage thresholds, React Testing Library, PostgreSQL integration tests
- **Development**: Turborepo monorepo, pnpm workspaces

## Monorepo Structure

This project uses Turborepo for monorepo management with the following structure:

```text
├── apps/
│   ├── frontend/          # Next.js todo calendar application
│   └── backend/           # Fastify API server with PostgreSQL integration
├── packages/
│   ├── shared-config/     # Shared configuration files (ESLint, TypeScript)
│   ├── shared-types/      # Shared TypeScript types between frontend/backend
│   └── ui/                # Shared UI components library (shadcn/ui)
├── z_plans/               # Implementation planning and TODO tracking
├── prisma/                 # Database schema and migrations
├── docs/                   # Project documentation and setup guides
├── CLAUDE.md              # Documentation for Claude Code 
├── package.json           # Root package.json with workspaces
├── pnpm-lock.yaml         # Package manager lock file
├── pnpm-workspace.yaml    # Workspace configuration
├── README.md              # Project documentation
└── turbo.json             # Turborepo configuration
```

## Architecture

### Core Components

#### Frontend Components

- **App Router Pages**: Next.js 15 App Router with page-level routing
  - **Main Application**: Calendar and todo management (`apps/frontend/src/app/page.tsx`)
  - **Settings Page**: User preferences and category management (`apps/frontend/src/app/settings/page.tsx`)
  - **Statistics Page**: Analytics and reporting (`apps/frontend/src/app/statistics/page.tsx`)
  - **Authentication Pages**: Login, register, password reset (`apps/frontend/src/app/login/`, `apps/frontend/src/app/register/`, `apps/frontend/src/app/forgot-password/`)
- **Layout & Navigation**:
  - **App Layout**: Main application layout wrapper (`apps/frontend/src/components/AppLayout.tsx`)
  - **Page Header**: Common header component (`apps/frontend/src/components/common/PageHeader.tsx`)
  - **Sidebar Navigation**: Collapsible sidebar (`apps/frontend/src/components/sidebar.tsx`)
- **Custom Calendar Implementation**: Self-built calendar system with monthly and daily views
  - **CalendarView**: Main calendar orchestrator (`apps/frontend/src/components/calendar/CalendarView.tsx`)
  - **Custom Calendar**: Monthly grid view (`apps/frontend/src/components/calendar/custom/`)
  - **Daily View**: Detailed daily todo management (`apps/frontend/src/components/calendar/daily/`)
  - **Shared Components**: Common calendar components (`apps/frontend/src/components/calendar/shared/`)
- **Settings Management**: Comprehensive settings with category management (`apps/frontend/src/components/settings/`)
- **Category System**: Todo categorization with color coding (`apps/frontend/src/components/categories/`)
- **Todo Management**: Complete todo CRUD operations (`apps/frontend/src/components/todo/`)
- **Statistics**: Analytics and reporting (`apps/frontend/src/components/statistics/`)
- **Authentication**: Login forms and auth components (`apps/frontend/src/components/auth/`)
- **UI Components**: Local shadcn/ui components (`apps/frontend/src/components/ui/`)
- **Context & Hooks**: State management and custom hooks (`apps/frontend/src/contexts/`, `apps/frontend/src/hooks/`)
- **Services**: Business logic layer (`apps/frontend/src/services/`)
- **Utils**: Utility functions and helpers (`apps/frontend/src/utils/`, `apps/frontend/src/lib/`)
- **API Integration**: Next.js API routes for backend communication (`apps/frontend/src/app/api/`)
  - **Authentication Routes**: Login and registration proxies (`/api/auth/`)
  - **Todo Routes**: Todo CRUD and statistics (`/api/todos/`)
  - **Settings Routes**: User settings and category management (`/api/user-settings/`)

#### Backend Components

- **Fastify API Server**: RESTful API server built with Fastify framework (`apps/backend/src/`)
- **Authentication System**: Complete JWT-based authentication system (`apps/backend/src/services/auth.service.ts`)
  - **JWT Service**: Token generation and validation
  - **Password Service**: bcryptjs-based password hashing
  - **Auth Plugin**: Fastify JWT plugin integration
  - **Auth Routes**: Registration, login, and token refresh
- **User Management**: User profile and account management (`apps/backend/src/services/user.service.ts`)
- **PostgreSQL Integration**: Primary data store with Prisma ORM (`apps/backend/src/services/database.service.ts`)
  - **Database Service**: PostgreSQL connection management
  - **Prisma Schema**: Comprehensive relational data model
  - **Repository Pattern**: PostgreSQL-based repositories with type safety
  - **Migration System**: Automated schema migrations
- **Repository Layer**: (`apps/backend/src/repositories/postgres/`)
  - **User Repository**: User CRUD operations with authentication
  - **Category Repository**: Category management with user isolation
  - **Todo Repository**: Todo operations, statistics, and filtering
  - **UserSettings Repository**: User preferences and configuration
- **Security & Documentation**:
  - **Helmet**: Security headers and CSP
  - **Swagger/OpenAPI**: API documentation at `/documentation`
  - **Error Handling**: Global error handlers and validation
- **Plugins**: Fastify plugin architecture (`apps/backend/src/plugins/`)
  - **Database Plugin**: PostgreSQL connection plugin
  - **Auth Plugin**: JWT authentication middleware
  - **Security Plugin**: Helmet and CORS configuration
  - **Swagger Plugin**: API documentation setup
- **Main Application**: Fastify app builder with plugin system (`apps/backend/src/app.ts`)

#### Shared Packages

- **shared-types**: TypeScript type definitions shared between frontend and backend
  - **App Types**: Application settings, user info, categories (`packages/shared-types/src/app.ts`)
  - **Todo Types**: Todo items with todoType field, calendar events, API interfaces (`packages/shared-types/src/todo.ts`)
  - **Auth Types**: Authentication and user management (`packages/shared-types/src/auth.ts`)
- **shared-config**: Common configuration files for linting and TypeScript
- **ui**: Shared UI components library
  - **shadcn/ui Components**: Reusable UI components with Tailwind CSS styling
  - **Shared Hooks**: Common React hooks for UI functionality
  - **Shared Utilities**: Common utility functions and helpers
  - **Global Styles**: Shared CSS and styling configurations

## Key Features

### Calendar System

- **Custom Implementation**: Self-built calendar without external dependencies
- **Multiple Views**: Monthly grid and detailed daily views
- **Korean Localization**: Full Korean language support
- **Date Navigation**: Smooth navigation between months and days

### Todo Management

- **Todo Types**: Support for 'event' (fixed date) and 'task' (moveable) types
- **Category Support**: Colored categories with customizable names and colors
- **Completion Tracking**: Mark todos as complete/incomplete
- **Date-based Organization**: Todos organized by calendar dates
- **Date Movement**: Advanced task movement logic for incomplete tasks
- **Quick Actions**: Add, edit, delete todos with intuitive UI
- **Statistics**: Todo completion analytics and reporting
- **Filtering**: Category-based filtering and user-scoped data isolation

### Settings & Customization

- **User Profile**: Name, email, profile image management
- **Category Management**: Add, edit, delete, set default categories (1-10 limit)
- **Display Preferences**: Language, theme (light/dark/system), custom colors
- **Calendar Settings**: Date/time formats, timezone, week start day
- **Todo Behavior**: Auto-move incomplete todos, completion display options
- **Data Management**: Export/import, reset functionality

### Data Architecture

- **PostgreSQL Database**: Primary relational data store with local development setup
- **Prisma ORM**: Type-safe database access with automatic migrations
- **User-Scoped Data**: Isolated data access per user with foreign key constraints
- **JWT Authentication**: Secure token-based authentication flow
- **Next.js API Routes**: Frontend-backend communication proxy
- **Type Safety**: Full TypeScript coverage with shared types and Prisma client
- **Database Relations**: Comprehensive foreign key relationships with cascade delete
- **Transaction Support**: ACID-compliant transactions for data integrity
- **Migration System**: Automated schema versioning and updates
- **Error Handling**: Robust error boundaries and validation
- **Local Storage**: Client-side settings and temporary data persistence

### API Architecture

#### Backend API Endpoints (Fastify - Port 3001)

- **Authentication**: `/auth/*`
  - `POST /auth/register` - User registration
  - `POST /auth/login` - User login with JWT token
  - `POST /auth/refresh` - JWT token refresh
- **User Management**: `/users/*`
  - `GET /users/profile` - Get user profile
  - `PUT /users/profile` - Update user profile
  - `PUT /users/change-password` - Change password
- **Todo Management**: `/todos/*`
  - `GET /todos` - Get user todos with filtering
  - `POST /todos` - Create new todo
  - `PUT /todos/:id` - Update todo
  - `DELETE /todos/:id` - Delete todo
  - `DELETE /todos` - Delete all todos
  - `PATCH /todos/:id/toggle` - Toggle todo completion
  - `GET /todos/stats` - Get todo statistics
  - `POST /todos/move-tasks` - Move incomplete tasks to new dates
  - `GET /todos/tasks-due` - Get tasks due for movement
- **Settings & Categories**: `/user-settings/*`
  - `GET /user-settings` - Get user settings
  - `PUT /user-settings` - Update user settings
  - `GET /user-settings/categories` - Get user categories
  - `POST /user-settings/categories` - Create category
  - `PUT /user-settings/categories/:id` - Update category
  - `DELETE /user-settings/categories/:id` - Delete category
  - `GET /user-settings/categories/available-colors` - Get available colors

#### Frontend API Routes (Next.js - Port 3000)

- **Proxy Routes**: `/api/*` - All routes proxy to backend with authentication
- **Authentication Flow**: Automatic JWT token management
- **Error Handling**: Consistent error responses and user feedback

## Development Notes

### Recent Changes

- **Todo Type System**: Added 'event' and 'task' types for different todo behaviors
- **Task Movement Logic**: Implemented advanced date movement for incomplete tasks
- **Unified Todo Components**: Created unified components for consistent todo handling
- **Next.js 15 App Router**: Implemented page-level routing with App Router
- **React 19 Upgrade**: Updated to React 19 with latest features and hooks
- **Monorepo Structure**: Enhanced with shared UI components package
- **Page Header Simplification**: Removed navigation buttons from header
- **URL-based Routing**: TodoSidebar state managed via URL parameters for refresh resilience
- **Custom Calendar Implementation**: Self-built calendar without external dependencies
- **Settings Redesign**: Complete overhaul with comprehensive user preferences
- **Category System**: Full implementation with color coding and management
- **Type System Enhancement**: Expanded shared types for better consistency
- **Authentication Implementation**: Complete JWT-based authentication with registration/login
- **PostgreSQL Migration**: Complete migration from Redis to PostgreSQL
- **Prisma ORM Integration**: Type-safe database access with schema migrations
- **Fastify Framework**: Migration from NestJS to Fastify for improved performance
- **Repository Pattern**: PostgreSQL-based repositories with comprehensive CRUD operations
- **Database Relations**: Foreign key constraints and cascade delete operations
- **Integration Testing**: Comprehensive test suite for PostgreSQL operations
- **Performance Optimization**: Indexed queries and transaction support
- **Backend API Integration**: Full Fastify API with PostgreSQL database
- **API Routes**: Next.js API routes acting as backend proxies with authentication
- **Local Development Environment**: PostgreSQL with Prisma development server
- **Enhanced Testing**: Jest with coverage thresholds and PostgreSQL integration tests

## Build and Testing Procedures

### Prerequisites

- Node.js (Latest LTS version recommended)
- pnpm package manager
- Turborepo CLI
- PostgreSQL (for local development)

### Infrastructure Setup

#### Database Setup (PostgreSQL)

```bash
# Start local PostgreSQL development server
pnpx prisma db push

# Generate Prisma client
pnpx prisma generate

# Run database migrations
pnpx prisma migrate dev

# View database in Prisma Studio
pnpx prisma studio

# Database health check
curl http://localhost:3001/health/database
```

#### Backend API Documentation

```bash
# Start backend server
turbo dev --filter=backend

# Access Swagger API documentation
open http://localhost:3001/documentation
```

### Turbo Command Quick Reference

| Task | Command | Description |
|------|---------|-------------|
| Development | `pnpm dev` | Start all development servers |
| Build | `pnpm build` | Build all packages and apps |
| Lint | `pnpm lint` | Run ESLint on all packages |
| Type Check | `pnpm type-check` | Run TypeScript type checking |
| Test | `pnpm test` | Run all tests |
| Coverage | `pnpm test:cov` | Run tests with coverage report |
| Clean | `pnpm clean` | Clear all build outputs and caches |
| Format | `pnpm format` | Format code with Prettier |
| Quality Check | `pnpm quality` | Run lint + type-check |
| Quality Fix | `pnpm quality:fix` | Fix lint issues + type-check |

**Important**: Use `pnpm` commands for project-level operations. For filtered operations, use `turbo` directly.

#### Filtered Commands (Direct Turbo)

```bash
# Frontend only
turbo dev --filter=frontend
turbo build --filter=frontend
turbo lint --filter=frontend

# Backend only  
turbo dev --filter=backend
turbo build --filter=backend
turbo lint --filter=backend

# Specific packages
turbo build --filter=@calendar-todo/shared-types
turbo lint --filter=@calendar-todo/ui
```

### Development Commands

#### Start Development Servers

```bash
# Start all services (frontend + backend)
turbo dev

# Start only frontend
turbo dev --filter=frontend

# Start only backend
turbo dev --filter=backend
```

#### Development Validation Commands (Recommended)

```bash
# Run type checking across all packages
turbo type-check

# Run linting across all packages  
turbo lint

# Type check specific package
turbo type-check --filter=frontend
turbo type-check --filter=backend

# Lint specific package
turbo lint --filter=frontend
turbo lint --filter=backend
```

#### Build Commands (Avoid during development)

```bash
# Only build shared dependencies when needed
turbo build --filter=@calendar-todo/shared-types
turbo build --filter=@calendar-todo/ui

# Full builds (use only for production/deployment)
# turbo build  # Causes hot-reload issues during development
# turbo build --filter=frontend  # Use dev server instead
# turbo build --filter=backend   # Use dev server instead
```

#### Testing Commands

```bash
# Run all tests
turbo test

# Run tests with coverage (backend only)
turbo test:cov --filter=backend

# Run tests in watch mode
turbo test:watch --filter=backend
turbo test:watch --filter=frontend

# Run end-to-end tests
turbo test:e2e --filter=backend

# Run tests for specific package
turbo test --filter=frontend
turbo test --filter=backend

# Backend coverage thresholds:
# - Branches: 19%
# - Functions: 28% 
# - Lines: 37%
# - Statements: 38%
```

### Pre-commit Validation Checklist

Before committing changes, run the following commands in order:

1. **Type Safety Check**

   ```bash
   turbo type-check
   ```

2. **Code Quality**

   ```bash
   turbo lint
   ```

3. **Functionality Testing**

   ```bash
   turbo test
   turbo dev --filter=frontend  # Manual testing via development server
   ```

**Note**: `turbo build` is avoided during development due to hot-reload issues. Use development servers for real-time testing.

### Common Issues and Solutions

#### ESLint Errors

- **unused variables**: Remove or prefix with underscore (`_variable`)
- **any types**: Replace with proper TypeScript types
- **missing dependencies**: Add missing dependencies to useEffect/useMemo arrays

#### Build Failures

- **Type errors**: Check shared-types package compilation first
- **Import errors**: Verify file paths and exported types
- **Hydration errors**: Ensure server/client rendering consistency

#### Development Server Issues

- **Port conflicts**: Development server auto-assigns available ports
  - Frontend: <http://localhost:3000>
  - Backend: <http://localhost:3001>
- **Module resolution**: Check import paths and package dependencies
- **Cache issues**: Clear turbo cache with `turbo clean`
- **Database connection**: Ensure PostgreSQL is running and database is accessible
- **Authentication issues**: Check JWT token validity and backend API connectivity

#### Database Issues

- **PostgreSQL connection failed**: Check if PostgreSQL service is running locally

  ```bash
  # Check PostgreSQL service status
  pnpx prisma db pull
  pnpx prisma generate
  ```

- **Data persistence**: Local PostgreSQL data persists between development sessions
- **Migration issues**: Run Prisma migrations to sync schema

  ```bash
  pnpx prisma migrate dev
  pnpx prisma generate
  ```

- **Authentication errors**: Verify PostgreSQL credentials in environment configuration
- **Schema sync**: Use Prisma Studio to inspect database state

  ```bash
  pnpx prisma studio
  ```

#### Testing Issues

- **Coverage thresholds**: Backend has minimum coverage requirements
  - Run `turbo test:cov --filter=backend` to check current coverage
  - Increase test coverage if below thresholds (19% branches, 28% functions, 37% lines, 38% statements)
- **Test isolation**: Each test should clean up its PostgreSQL data
- **Integration tests**: Require running PostgreSQL instance for backend integration tests
- **Test database**: Uses separate `todoapp_test` database for isolated testing

### Turborepo Cache Management

```bash
# Clear all caches
turbo clean

# Force rebuild without cache
turbo build --force

# Check cache status
turbo run build --dry-run
```

### Package Management

```bash
# Install dependencies
pnpm install

# Add dependency to specific package
pnpm add <package> --filter=frontend
pnpm add <package> --filter=backend

# Add to shared packages
pnpm add <package> --filter=@calendar-todo/shared-types
pnpm add <package> --filter=@calendar-todo/ui
```

### Database Management

```bash
# Initialize and reset database
pnpx prisma migrate reset

# Apply pending migrations
pnpx prisma migrate dev

# Push schema changes without migration
pnpx prisma db push

# View database content
pnpx prisma studio

# Generate Prisma client after schema changes
pnpx prisma generate
```

### Deployment Preparation

1. **Full Clean Build**

   ```bash
   turbo clean
   pnpm install
   turbo build
   ```

2. **Production Validation**

   ```bash
   turbo lint
   turbo type-check
   turbo test
   ```

3. **Size Analysis** (Frontend)

   ```bash
   # Build and analyze frontend bundle size
   turbo build --filter=frontend
   # Note: Bundle analysis commands should use turbo if available,
   # otherwise use pnpm directly within the specific package directory
   ```
