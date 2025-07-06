# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

**CAUTION** Do not update this 'Critical Rules' section!!!

### Overall

- Always scan the entire module directory before making changes
- Do not use `npm` command directly, and use `turbo` or `pnpm` instead
  - Do not use `npm run build` or `npm run dev` commands to check changes because it breaks running development server

### Planning

- When you plan a new implementation, write a todo list under the directory `z_plans` as a markdown file
- If you complete any todo item in a markdown file under the directory `z_plans`, you have to update the todo item to mark it completed

### Code Style Guidelines

- Use TypeScript with strong typing; avoid `any` when possible
- Use camelCase for variables/functions, PascalCase for components/classes
- Imports: group React imports first, then external libs, then internal modules
- Error handling: prefer early returns over deep nesting
- Keep components focused on a single responsibility

## Project Overview

This is a Korean calendar-based todo application built with Next.js 15, TypeScript, and shadcn/ui components for the frontend, and NestJS for the backend API. The app features a full-screen react-big-calendar with a collapsible sidebar navigation and settings management, providing an intuitive and modern todo management experience with a robust backend API.

## Monorepo Structure

This project uses Turborepo for monorepo management with the following structure:

```
├── apps/
│   ├── frontend/          # Next.js todo calendar application
│   └── backend/           # NestJS API server
├── packages/
│   └── shared-config/     # Shared configuration files
├── turbo.json            # Turborepo configuration
└── package.json          # Root package.json with workspaces
```

## Development Commands

### Root Level Commands (run from repository root)

- `npm run dev` - Start all development servers using Turbo
- `npm run build` - Build all applications using Turbo
- `npm run start` - Start all production servers using Turbo
- `npm run start:dev` - Start all development servers using Turbo
- `npm run start:prod` - Start all production servers using Turbo
- `npm run lint` - Run ESLint on all packages using Turbo
- `npm run type-check` - Run TypeScript type checking on all packages using Turbo
- `npm run format` - Format code across all packages using Turbo
- `npm run test` - Run tests across all packages using Turbo
- `npm run test:e2e` - Run e2e tests across all packages using Turbo
- `npm run clean` - Clean cache files across all packages using Turbo
- `npm run dev:restart` - Kill dev process, clean cache, and restart

### Frontend App Commands (run from apps/frontend/)

- `npm run dev` - Start development server with Turbopack (Do not run this command after applying changes, as it breaks running dev server)
- `npm run dev:stable` - Start development server on port 3000
- `npm run dev:fallback` - Start development server on port 3001
- `npm run build` - Build for production (Do not run this command after applying changes, as it breaks running dev server)
- `npm run build:clean` - Clean build with .next removal
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean cache files

### Backend App Commands (run from apps/backend/)

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

## Architecture

### Core Components

#### Frontend Components

- **Main Application**: Single-page application with calendar and todo management (`apps/frontend/src/app/page.tsx`)
- **Sidebar Navigation**: Collapsible sidebar with home/settings navigation (`apps/frontend/src/components/sidebar.tsx`)
- **Calendar Integration**: Uses `react-big-calendar` with date-fns localizer for full-screen calendar display
- **Settings Management**: Comprehensive settings page with JSON editor (`apps/frontend/src/components/settings.tsx`)
- **Navigation Bar**: Simple header with app title (`apps/frontend/src/components/navbar.tsx`)
- **UI Components**: shadcn/ui components with Tailwind CSS styling
- **Todo Sidebar**: Sliding sidebar for date-specific todo management

#### Backend Components

- **NestJS API Server**: RESTful API server built with NestJS framework (`apps/backend/src/`)
- **App Controller**: Main application controller handling API routes (`apps/backend/src/app.controller.ts`)
- **App Service**: Business logic and data processing (`apps/backend/src/app.service.ts`)
- **App Module**: Main application module with dependency injection (`apps/backend/src/app.module.ts`)
- **Main Entry Point**: Application bootstrap and configuration (`apps/backend/src/main.ts`)

### Data Structure

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
  timeFormat: '12h' | '24h';
  weekStart: 'sunday' | 'monday' | 'saturday';
  defaultView: 'month' | 'week' | 'day';
  showWeekends: boolean;
  autoBackup: boolean;
  backupInterval: 'daily' | 'weekly' | 'monthly';
}
```

### Key Features

- Dual sidebar layout: collapsible navigation sidebar + sliding todo sidebar
- Full-screen calendar view using react-big-calendar
- Date-specific todo management (opens on date selection)
- Todo events displayed directly on calendar with completion status
- Korean locale support using date-fns/locale
- Month/Week/Day view switching
- Local storage persistence with date serialization
- Comprehensive settings management with JSON editor
- Data export/import functionality
- Usage statistics and analytics
- Responsive design with modern UI

### Component Structure

#### Frontend Structure

- **Main Application** (`apps/frontend/src/app/page.tsx`): Handles all calendar logic, todo management, and main layout
- **Sidebar Navigation** (`apps/frontend/src/components/sidebar.tsx`): Left sidebar with collapsible navigation between home/settings
- **Settings Page** (`apps/frontend/src/components/settings.tsx`): Comprehensive settings with multiple sections and JSON editor
- **Navigation Bar** (`apps/frontend/src/components/navbar.tsx`): Simple top navigation bar
- **UI Components** (`apps/frontend/src/components/ui/`): shadcn/ui components following design system patterns
- **Utils** (`apps/frontend/src/lib/utils.ts`): Utility functions for styling and common operations

#### Backend Structure

- **Controllers** (`apps/backend/src/*.controller.ts`): Handle HTTP requests and responses
- **Services** (`apps/backend/src/*.service.ts`): Business logic and data processing
- **Modules** (`apps/backend/src/*.module.ts`): Organize application components with dependency injection
- **Tests** (`apps/backend/src/*.spec.ts`): Unit tests for controllers and services
- **E2E Tests** (`apps/backend/test/`): End-to-end integration tests

### Layout Design

- **Dual Sidebar Layout**:
  - Left navigation sidebar (collapsible, 64px collapsed / 256px expanded)
  - Right todo sidebar (384px width, slides in from right on date selection)
- **Full-screen Calendar**: Takes up remaining viewport with navigation bar at top
- **Dynamic Layout**: Main content adjusts based on navigation sidebar state
- **No Layout Shift**: Fixed positioning prevents movement when sidebars open/close
- **Interactive UX**: Click empty calendar space to close todo sidebar, click dates to open

### Styling

- Tailwind CSS 4 with custom configuration
- shadcn/ui "new-york" style variant with custom components
- CSS variables enabled for theming
- Korean text optimized with Geist font family
- react-big-calendar CSS imports for calendar styling
- Custom event styling for completed/incomplete todos
- Responsive design with mobile considerations

### State Management

- React useState for component-level state
- localStorage persistence for todos and app settings
- Page-level state management for navigation between home/settings
- Sidebar state management for expanded/collapsed states

## Important Implementation Details

### Calendar Integration

- Uses `dateFnsLocalizer` from react-big-calendar with Korean locale
- Todos converted to calendar events with completion status indicators
- Event colors: Gray for completed, light gray for incomplete todos
- Supports month, week, and day views with Korean labels
- Click handling for date selection and event interaction

### Todo Management

- Todos are filtered by date using `format(date, "yyyy-MM-dd")` comparison
- localStorage data requires date parsing on load due to JSON serialization
- Todo sidebar opens automatically when date/event is selected
- CRUD operations: Create, Read, Update (toggle completion), Delete
- Statistics tracking: completion rates, recent activity

### Settings Management

- Comprehensive settings system with multiple categories
- JSON editor for advanced configuration
- Real-time validation and error handling
- Settings persistence in localStorage
- Data export/import functionality
- App settings separate from todo data

### Navigation & Layout

- Two-tier navigation: main sidebar for pages, todo sidebar for date-specific tasks
- Collapsible main sidebar with state persistence
- Fixed positioning to prevent layout shifts
- Responsive behavior for different screen sizes

### Event Handling

- `onSelectSlot`: Opens todo sidebar and sets selected date
- `onSelectEvent`: Opens todo sidebar and sets selected date from event
- Click detection on calendar background elements closes todo sidebar
- Sidebar toggle buttons for navigation control
- Page routing between home and settings views

### Data Persistence

- **Todos**: Stored in localStorage as "calendar-todos" with date serialization
- **Settings**: Stored in localStorage as "app-settings"
- **Export/Import**: JSON file format for data portability
- **Error Recovery**: Settings validation and fallback to defaults

### Planning System

- **z_plans/**: Directory for implementation planning documents
- **Markdown Planning**: Structured todo lists for feature implementation
- **Progress Tracking**: Manual completion marking in planning documents

### Monorepo Benefits

- **Code Sharing**: Shared configurations and utilities across multiple apps
- **Dependency Management**: Centralized dependency management with workspaces
- **Build Pipeline**: Efficient build and development workflows with Turborepo
- **Scalability**: Easy addition of new apps (mobile, desktop, etc.) in the future
- **Full-Stack Development**: Frontend and backend in a single repository with coordinated development
- **Unified CI/CD**: Single pipeline for building, testing, and deploying all applications

This architecture provides a scalable foundation for a comprehensive calendar-based todo management application with modern UX patterns, robust data management, full-stack TypeScript development, and monorepo structure for future expansion.
