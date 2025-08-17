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

Korean calendar-based todo application with custom calendar implementation and comprehensive category management.

**Stack:**

- **Frontend**: Next.js 15, React 19, TypeScript, shadcn/ui, Tailwind CSS
- **Backend**: Fastify, JWT Auth, Swagger/OpenAPI, Prisma ORM
- **Database**: PostgreSQL 15 with Prisma Client
- **Development**: Turborepo monorepo, pnpm workspaces
- **Testing**: Jest with coverage thresholds, React Testing Library

## Project Structure

```text
├── apps/
│   ├── frontend/          # Next.js todo calendar application
│   └── backend/           # Fastify API server with PostgreSQL
├── packages/
│   ├── shared-config/     # Shared ESLint, TypeScript configs
│   ├── shared-types/      # Shared TypeScript types
│   └── ui/                # Shared UI components (shadcn/ui)
├── prisma/                # Database schema and migrations
└── docs/                  # Project documentation
```

## Development Commands

### Essential Commands

```bash
# Start all development servers
pnpm dev

# Type checking (recommended for validation)
turbo type-check

# Linting (recommended for validation)
turbo lint

# Run tests
turbo test

# Database setup
pnpx prisma db push
pnpx prisma generate
```

### Filtered Commands

```bash
# Frontend only
turbo dev --filter=frontend
turbo type-check --filter=frontend

# Backend only
turbo dev --filter=backend
turbo lint --filter=backend
```

## Key Features

- **Custom Calendar**: Self-built Korean calendar without external dependencies
- **Todo Management**: Events (fixed date) and tasks (moveable) with categories
- **Authentication**: JWT-based auth with registration/login
- **Category System**: Color-coded categories with full CRUD operations
- **PostgreSQL Integration**: Prisma ORM with type-safe database access

## Database Setup

```bash
# Initialize database
pnpx prisma migrate dev

# View database
pnpx prisma studio

# Health check
curl http://localhost:3001/health/database
```

## Pre-commit Checklist

1. `turbo type-check` - Type safety
2. `turbo lint` - Code quality  
3. `turbo test` - Functionality

## Common Issues

- **Port conflicts**: Frontend (3000), Backend (3001)
- **Cache issues**: Run `turbo clean`
- **Database issues**: Check PostgreSQL service and run `pnpx prisma generate`
- **Test coverage**: Backend requires minimum coverage (19% branches, 28% functions, 37% lines, 38% statements)

## Backend API Endpoints

**Authentication** (`/auth/*`)

- `POST /auth/register` - User registration
- `POST /auth/login` - User login with JWT token
- `POST /auth/refresh` - JWT token refresh

**User Management** (`/users/*`)

- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `PUT /users/change-password` - Change password

**Todo Management** (`/todos/*`)

- `GET /todos` - Get user todos with filtering
- `POST /todos` - Create new todo
- `PUT /todos/:id` - Update todo
- `DELETE /todos/:id` - Delete todo
- `PATCH /todos/:id/toggle` - Toggle todo completion
- `GET /todos/stats` - Get todo statistics
- `POST /todos/move-tasks` - Move incomplete tasks to new dates

**Settings & Categories** (`/user-settings/*`)

- `GET /user-settings` - Get user settings
- `PUT /user-settings` - Update user settings
- `GET /user-settings/categories` - Get user categories
- `POST /user-settings/categories` - Create category
- `PUT /user-settings/categories/:id` - Update category
- `DELETE /user-settings/categories/:id` - Delete category

## API Documentation

Backend Swagger docs available at: `http://localhost:3001/documentation`
