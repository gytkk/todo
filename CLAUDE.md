# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

**CAUTION** Do not update this 'Critical Rules' section!!!

### Overall

- **NEVER use `npm` commands directly** - always use `pnpm` or `turbo` for development tools
- Always write unit tests first, then implement business logic
- Check lint errors and code style after you write code

### Code Style Guidelines

- Use TypeScript with strong typing; avoid `any` when possible
- Use camelCase for variables/functions, PascalCase for components/classes
- Imports: group React imports first, then external libs, then internal modules
- Error handling: prefer early returns over deep nesting
- Keep components focused on a single responsibility

## Project Overview

This is a Korean calendar-based todo application built with Next.js 15, TypeScript, and shadcn/ui components for the frontend, and NestJS for the backend API. The app features a custom-built calendar implementation with a collapsible sidebar navigation and comprehensive settings management, providing an intuitive and modern todo management experience with category support and robust backend API.

**Key Technologies:**
- **Frontend**: Next.js 15, React 19, TypeScript, shadcn/ui, Tailwind CSS
- **Backend**: NestJS, TypeScript, JWT Authentication, Swagger/OpenAPI
- **Database**: Redis with ioredis driver
- **Infrastructure**: Docker Compose for development environment
- **Testing**: Jest with coverage thresholds, React Testing Library
- **Development**: Turborepo monorepo, pnpm workspaces

## Monorepo Structure

This project uses Turborepo for monorepo management with the following structure:

```text
├── apps/
│   ├── frontend/          # Next.js todo calendar application
│   └── backend/           # NestJS API server with Redis integration
├── packages/
│   ├── shared-config/     # Shared configuration files (ESLint, TypeScript)
│   ├── shared-types/      # Shared TypeScript types between frontend/backend
│   └── ui/                # Shared UI components library (shadcn/ui)
├── z_plans/               # Implementation planning and TODO tracking
├── docker-compose.yml     # Redis and Redis Commander setup
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

- **NestJS API Server**: RESTful API server built with NestJS framework (`apps/backend/src/`)
- **Authentication Module**: Complete JWT-based authentication system (`apps/backend/src/auth/`)
  - **JWT Service**: Token generation and validation
  - **Password Service**: bcrypt-based password hashing
  - **Guards**: JWT and Local authentication guards
  - **Strategies**: Passport.js JWT and Local strategies
  - **Decorators**: Public route and current user decorators
- **User Management**: User profile and account management (`apps/backend/src/users/`)
- **Todo Management**: Complete todo CRUD with filtering and statistics (`apps/backend/src/todos/`)
- **User Settings**: Settings and category management (`apps/backend/src/user-settings/`)
- **Redis Integration**: Data persistence and caching layer (`apps/backend/src/redis/`)
  - **Redis Service**: Connection management and operations
  - **Repository Pattern**: User-scoped data isolation
  - **Base Repository**: Common repository functionality
- **Security & Documentation**:
  - **Helmet**: Security headers and CSP
  - **Swagger/OpenAPI**: API documentation at `/api`
  - **Exception Filters**: Global error handling
- **Main Application**: Bootstrap configuration with security middleware (`apps/backend/src/main.ts`)

#### Shared Packages

- **shared-types**: TypeScript type definitions shared between frontend and backend
  - **App Types**: Application settings, user info, categories (`packages/shared-types/src/app.ts`)
  - **Todo Types**: Todo items, calendar events, API interfaces (`packages/shared-types/src/todo.ts`)
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

- **Category Support**: Colored categories with customizable names and colors
- **Completion Tracking**: Mark todos as complete/incomplete
- **Date-based Organization**: Todos organized by calendar dates
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

- **Redis Database**: Primary data store with Docker containerization
- **User-Scoped Repositories**: Isolated data access per user
- **JWT Authentication**: Secure token-based authentication flow
- **Next.js API Routes**: Frontend-backend communication proxy
- **Type Safety**: Full TypeScript coverage with shared types
- **Migration Support**: Backward compatibility for settings upgrades
- **Error Handling**: Robust error boundaries and validation
- **Local Storage**: Client-side settings and temporary data persistence

### API Architecture

#### Backend API Endpoints (NestJS - Port 3001)

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
  - `PUT /todos/:id/toggle` - Toggle todo completion
  - `GET /todos/stats` - Get todo statistics
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
- **Backend API Integration**: Full NestJS API with Redis database
- **API Routes**: Next.js API routes acting as backend proxies with authentication
- **Docker Development Environment**: Redis and Redis Commander setup
- **Enhanced Testing**: Jest with coverage thresholds and comprehensive test suites

## Build and Testing Procedures

### Prerequisites

- Node.js (Latest LTS version recommended)
- pnpm package manager
- Turborepo CLI
- Docker and Docker Compose (for Redis)

### Infrastructure Setup

#### Redis Database Setup

```bash
# Start Redis and Redis Commander
docker-compose up -d

# View Redis data via web interface
open http://localhost:8081

# Redis connection details:
# Host: localhost
# Port: 6379
# Password: todoapp123 (configurable via REDIS_PASSWORD env var)
```

#### Backend API Documentation

```bash
# Start backend server
turbo dev --filter=backend

# Access Swagger API documentation
open http://localhost:3001/api
```

### Turbo Command Quick Reference

| Task | Command | Description |
|------|---------|-------------|
| Development | `turbo dev` | Start all development servers |
| Build | `turbo build` | Build all packages and apps |
| Lint | `turbo lint` | Run ESLint on all packages |
| Type Check | `turbo type-check` | Run TypeScript type checking |
| Test | `turbo test` | Run all tests |
| Coverage | `turbo test:cov --filter=backend` | Run tests with coverage report |
| E2E Test | `turbo test:e2e --filter=backend` | Run end-to-end tests |
| Clean | `turbo clean` | Clear all caches |
| Filtered | `turbo <command> --filter=<package>` | Run command on specific package |

**Important**: Always use `turbo` commands instead of `npm run` commands!

#### Common Filtered Commands

```bash
# Frontend only
turbo dev --filter=frontend
turbo build --filter=frontend
turbo lint --filter=frontend

# Backend only  
turbo dev --filter=backend
turbo build --filter=backend

# Shared types only
turbo build --filter=@calendar-todo/shared-types

# UI components only
turbo build --filter=@calendar-todo/ui
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

#### Build Commands

```bash
# Build all packages and apps
turbo build

# Build specific package/app
turbo build --filter=frontend
turbo build --filter=backend
turbo build --filter=@calendar-todo/shared-types
turbo build --filter=@calendar-todo/ui

# Build with dependencies
turbo build --filter=frontend...
```

#### Linting and Type Checking

```bash
# Run linting across all packages
turbo lint

# Run type checking (note: correct task name is 'type-check')
turbo type-check

# Lint specific package
turbo lint --filter=frontend

# Type check specific package
turbo type-check --filter=frontend
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
   turbo build --filter=@calendar-todo/shared-types
   ```

2. **Build Validation**

   ```bash
   turbo build --filter=frontend
   turbo build --filter=backend
   ```

3. **Code Quality**

   ```bash
   turbo lint
   turbo type-check
   ```

4. **Functionality Testing**

   ```bash
   turbo test
   turbo dev --filter=frontend  # Manual testing
   ```

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
  - Frontend: http://localhost:3000
  - Backend: http://localhost:3001
  - Redis Commander: http://localhost:8081
- **Module resolution**: Check import paths and package dependencies
- **Cache issues**: Clear turbo cache with `turbo clean`
- **Redis connection**: Ensure Docker is running and Redis container is healthy
- **Authentication issues**: Check JWT token validity and backend API connectivity

#### Database Issues

- **Redis connection failed**: Check if Docker is running and Redis container is up
  ```bash
  docker-compose ps
  docker-compose logs redis
  ```
- **Data persistence**: Redis data is stored in Docker volumes, survives container restarts
- **Authentication errors**: Verify Redis password matches environment configuration
- **Port conflicts**: Ensure ports 6379 (Redis) and 8081 (Redis Commander) are available

#### Testing Issues

- **Coverage thresholds**: Backend has minimum coverage requirements
  - Run `turbo test:cov --filter=backend` to check current coverage
  - Increase test coverage if below thresholds (19% branches, 28% functions, 37% lines, 38% statements)
- **Test isolation**: Each test should clean up its Redis data
- **E2E tests**: Require running Redis instance for backend integration tests

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

### Docker Management

```bash
# Start Redis services
docker-compose up -d

# Stop Redis services
docker-compose down

# View Redis logs
docker-compose logs redis

# Reset Redis data
docker-compose down -v
docker-compose up -d
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
