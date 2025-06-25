# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZeroBoard is a lightweight Kanban board application for personal note-taking and project management. It's built as a static Next.js app that runs entirely client-side with local storage persistence - no server required.

## Key Architecture

- **Client-only static app**: Built with Next.js static export (`output: 'export'`)
- **Local storage persistence**: All data stored in browser localStorage 
- **Component structure**: Main app logic in `app/page.tsx`, card components in `components/note-card.tsx`
- **UI library**: Uses shadcn/ui components with Radix UI primitives and Tailwind CSS
- **Drag & drop**: Implemented with @hello-pangea/dnd library
- **Markdown support**: Uses react-markdown with remark-gfm for GitHub flavored markdown

## Core Data Models

```typescript
interface Card {
  id: string
  title: string
  content: string
  color: string
  tags: string[]
  createdAt: string
  updatedAt: string
  collapsed?: boolean
  plain?: boolean
  lightBackground?: boolean
}

interface Column {
  id: string
  title: string
  color: string
  cards: Card[]
}

interface Board {
  id: string
  title: string
  columns: Column[]
}
```

## Development Commands

```bash
# Start development server
yarn dev

# Build for production (static export)
yarn build

# Serve built files locally
yarn serve

# Lint code
yarn lint
```

## Component Architecture

- **Main app**: `app/page.tsx` - Contains board management, drag/drop logic, and data persistence
- **Card component**: `components/note-card.tsx` - Handles card rendering, editing, and different display modes
- **Column component**: `components/kanban-column.tsx` - Manages column display and card lists
- **Markdown renderers**: `components/markdown-renderer.tsx` and `components/title-markdown-renderer.tsx`
- **Image handling**: `components/image-*.tsx` files handle image upload, display, and management

## Special Features

- **Card types**: Standard, image-only, table-only, collapsed, plain mode, light background
- **Image support**: Base64 storage in localStorage with upload modal and full-screen viewer
- **Interactive markdown**: Clickable checkboxes in rendered markdown
- **Export/import**: JSON backup and restore functionality
- **Multi-board support**: Multiple boards with dropdown switcher

## Build Configuration

The app uses Next.js with special configuration for static export:
- `output: 'export'` for static site generation
- `distDir: 'dist'` for build output
- `images.unoptimized: true` for static image handling
- TypeScript and ESLint errors ignored during builds for deployment flexibility