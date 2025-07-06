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

```text
├── apps/
│   ├── frontend/          # Next.js todo calendar application
│   └── backend/           # NestJS API server
├── packages/
│   └── shared-config/     # Shared configuration files
├── turbo.json            # Turborepo configuration
└── package.json          # Root package.json with workspaces
```

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
