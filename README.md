# ZeroBoard

A lightweight Kanban board application for personal note-taking and project management. Built with Next.js, featuring full markdown support, drag-and-drop functionality, and optional Firebase cloud sync.

![ZeroBoard Screenshot](/placeholder.svg?height=400&width=800&query=kanban+board+interface+with+cards+and+columns)

## ✨ Features

- **Multiple Kanban Boards** - Create and manage multiple boards for different projects
- **Drag & Drop** - Intuitive card movement between columns and reordering
- **Rich Markdown Support** - Full GitHub Flavored Markdown with interactive checkboxes
- **Image Support** - Upload and embed images directly in cards
- **Flexible Card Types** - Standard, image-only, table-only, collapsed, and plain modes
- **Local Storage** - All data persists locally in your browser by default
- **Optional Cloud Sync** - Enable Firebase sync for multi-device access
- **Export/Import** - Backup and restore your boards with JSON export/import
- **Static Deployment** - Deploy anywhere as a static site - no server required

## 🚀 Quick Start

### Prerequisites
- Node.js 18.18 or later
- npm, yarn, or pnpm package manager

### Installation

1. **Clone the project**
   ```bash
   git clone <repository-url>
   cd zeroboard
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Start development server**
   ```bash
   yarn dev
   ```

### Building for Production

```bash
# Build static files
yarn build

# Serve the built files
yarn start
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service.

## ☁️ Firebase Cloud Sync (Optional)

ZeroBoard works completely offline by default, but you can optionally enable Firebase sync for multi-device access.

### Setup Firebase Sync

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Google provider)
   - Enable Firestore Database
   - Enable Storage

2. **Configure Environment**
   Create `.env.local` with your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

3. **Enable Sync**
   - Open the board dropdown menu
   - Click "Enable Sync"
   - Sign in with Google
   - Choose to keep local data or use cloud data

### Sync Features
- **Real-time sync** between multiple devices
- **Image synchronization** via Firebase Storage
- **Conflict resolution** with user choice dialogs
- **Automatic backup** of all boards and images
- **Works offline** - sync resumes when online

## ⌨️ Keyboard Shortcuts

### Card Editing
| Shortcut | Action | Context |
|----------|--------|---------|
| `Enter` | Save changes and exit edit mode | When editing card titles |
| `Escape` | Cancel changes and revert | When editing titles or content |
| `Ctrl/Cmd + Enter` | Save changes and exit edit mode | When editing card content |

### Modal Navigation
| Shortcut | Action | Context |
|----------|--------|---------|
| `Escape` | Close modal | Any modal window |
| `Escape` | Cancel editing (if editing) | Card modal with active editor |
| `Ctrl/Cmd + Enter` | Save content changes | When editing in card modal |

### Column Management
| Shortcut | Action | Context |
|----------|--------|---------|
| `Enter` | Save column title | When editing column titles |
| `Escape` | Cancel title changes | When editing column titles |

### Board Management
| Shortcut | Action | Context |
|----------|--------|---------|
| `Enter` | Save board title | When editing board titles |
| `Escape` | Cancel title changes | When editing board titles |

### Desktop App (Electron) Shortcuts
#### File Operations
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | Create new board |
| `Ctrl/Cmd + O` | Import board from file |
| `Ctrl/Cmd + S` | Export current board |

#### Standard Editing
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + X` | Cut |
| `Ctrl/Cmd + C` | Copy |
| `Ctrl/Cmd + V` | Paste |
| `Ctrl/Cmd + A` | Select all |

#### View Controls
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + R` | Reload application |
| `Ctrl/Cmd + Shift + R` | Force reload |
| `F12` / `Cmd + Option + I` | Toggle developer tools |
| `Ctrl/Cmd + 0` | Reset zoom |
| `Ctrl/Cmd + =` | Zoom in |
| `Ctrl/Cmd + -` | Zoom out |
| `F11` / `Cmd + Ctrl + F` | Toggle fullscreen |

## 📁 Quick File Reference

### Core Application Files
- `/app/page.tsx` - Main kanban board application component with state management and drag-and-drop
- `/app/layout.tsx` - Root HTML layout and metadata configuration
- `/app/globals.css` - Global CSS styles and Tailwind imports
- `/components/note-card.tsx` - Individual card component with editing, collapsing, and multiple display modes
- `/components/kanban-column.tsx` - Column component managing cards and drag-and-drop zones
- `/components/markdown-renderer.tsx` - Markdown rendering with syntax highlighting and interactive features
- `/components/title-markdown-renderer.tsx` - Markdown renderer for titles and headers with bold/italic support

### Firebase Integration Files
- `/lib/firebase-config.ts` - Firebase configuration and initialization
- `/lib/firebase-sync.ts` - Firebase sync service for boards and authentication
- `/lib/firebase-image-sync.ts` - Firebase Storage service for image synchronization

### Image Management Files
- `/components/image-manager.tsx` - Image management interface for IndexedDB stored images
- `/components/image-modal.tsx` - Full-screen image viewer modal component
- `/components/image-upload-modal.tsx` - Image upload interface with drag-and-drop support
- `/components/image-upload.tsx` - Core image upload functionality with IndexedDB integration
- `/lib/indexeddb-image-service.ts` - IndexedDB service for image storage, retrieval, and management
- `/lib/image-utils.ts` - Image processing utilities, caching, and markdown image extraction

### Configuration Files
- `/next.config.mjs` - Next.js configuration for static export and Electron compatibility
- `/tailwind.config.ts` - Tailwind CSS configuration with custom theme and shadcn/ui setup
- `/tsconfig.json` - TypeScript compiler configuration and path mappings
- `/components.json` - Shadcn/ui component library configuration
- `/package.json` - Project dependencies, scripts, and Electron build configuration
- `/electron.js` - Electron main process for desktop application window management

### Utility Files
- `/lib/utils.ts` - General utility functions including Tailwind CSS class merging
- `/components/theme-provider.tsx` - Theme context provider for application theming

## 🛠 Built With

- **Next.js 15** - React framework with static export capability
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful, accessible UI components
- **React Markdown** - Markdown rendering with GitHub Flavored Markdown
- **Hello Pangea DnD** - Drag and drop functionality
- **Firebase** (Optional) - Authentication, Firestore, and Storage for cloud sync
- **IndexedDB** - Local image storage
- **Electron** - Desktop application wrapper

## 🎨 Data Models

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
  titleHidden?: boolean
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
  order: number
  imagesMigrated?: boolean
}
```

## 📝 Development Commands

```bash
# Development
yarn dev              # Start development server
yarn build            # Build for production
yarn start            # Serve built files
yarn lint             # Run ESLint

# Electron (Desktop App)
yarn electron         # Run Electron app
yarn electron-dev     # Development mode with hot reload
yarn electron-build   # Build desktop distributables
```

---

**Made with ❤️ for productivity enthusiasts and note-taking lovers**