# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Korean calendar-based todo application built with Next.js 15, TypeScript, and shadcn/ui components. The app features a full-screen react-big-calendar with a sliding sidebar for todo management, providing an intuitive and modern todo management experience.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture

### Core Components
- **Calendar Integration**: Uses `react-big-calendar` with date-fns localizer for full-screen calendar display
- **Navigation**: shadcn/ui navigation menu with Korean locale support
- **State Management**: React useState with localStorage persistence for todos
- **UI Components**: shadcn/ui components with Tailwind CSS styling
- **Sidebar**: Sliding sidebar for todo management that appears on date selection

### Data Structure
```typescript
interface TodoItem {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: TodoItem;
}
```

### Key Features
- Full-screen calendar view using react-big-calendar
- Sliding sidebar for todo management (opens on date selection)
- Todo events displayed directly on calendar with completion status
- Korean locale support using date-fns/locale
- Month/Week/Day view switching
- Local storage persistence with date serialization
- Responsive design with modern UI

### Component Structure
- Main page (`src/app/page.tsx`) handles all todo logic and calendar integration
- Navigation bar (`src/components/navbar.tsx`) with shadcn/ui navigation menu
- UI components located in `src/components/ui/` following shadcn/ui patterns
- Uses "@" path alias for imports (`@/components`, `@/lib`)

### Layout Design
- **Full-screen Calendar**: Takes up entire viewport with navigation bar at top
- **Sliding Sidebar**: 384px width sidebar that slides in from right on date selection
- **No Layout Shift**: Fixed title positioning prevents movement when sidebar opens/closes
- **Interactive UX**: Click empty calendar space to close sidebar, click dates to open

### Styling
- Tailwind CSS 4 with custom configuration
- shadcn/ui "new-york" style variant
- CSS variables enabled for theming
- Korean text optimized with Geist font family
- react-big-calendar CSS imports for calendar styling
- Custom event styling for completed/incomplete todos

## Important Implementation Details

### Calendar Integration
- Uses `dateFnsLocalizer` from react-big-calendar with Korean locale
- Todos converted to calendar events with completion status indicators
- Event colors: Blue for incomplete, Green for completed todos
- Supports month, week, and day views with Korean labels

### Todo Management
- Todos are filtered by date using `format(date, "yyyy-MM-dd")` comparison
- localStorage data requires date parsing on load due to JSON serialization
- Sidebar opens automatically when date/event is selected
- Click handlers differentiate between calendar slots and empty space

### UI/UX Details
- Sidebar slides in/out with 300ms CSS transitions
- Fixed title positioning using invisible placeholder Badge to prevent layout shift
- Calendar click detection using react-big-calendar CSS classes
- Responsive sidebar with minimum width constraints

### Event Handling
- `onSelectSlot`: Opens sidebar and sets selected date
- `onSelectEvent`: Opens sidebar and sets selected date from event
- Click detection on calendar background elements closes sidebar
- Proper event bubbling prevention for smooth interactions
