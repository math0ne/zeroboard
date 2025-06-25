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

## 🚀 Quick Start

### Prerequisites

- Node.js 20.0 or later
- npm, yarn, or pnpm package manager

### Installation

1. **Clone the project**

   ```bash
   git clone <repository-url>
   cd zeroboard
   yarn install
   yarn dev
   ```

### Building for Production

```bash
yarn build
yarn start
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service.

## 📱 Mobile Apps (iOS & Android)

ZeroBoard can be built as native mobile applications using Capacitor.

### Prerequisites for Mobile Development

- **For iOS**: Xcode 14+ (macOS only)
- **For Android**: Android Studio with Android SDK

### Mobile Development Setup

1. **Add mobile platforms** (first time only)

   ```bash
   # Add Android platform
   yarn cap:add-android

   # Add iOS platform (macOS only)
   yarn cap:add-ios
   ```

2. **Build and run on device/simulator**

   ```bash
   # Android
   yarn cap:run-android

   # iOS (macOS only)
   yarn cap:run-ios
   ```

3. **Open in native IDEs for advanced development**

   ```bash
   # Open Android Studio
   yarn cap:open-android

   # Open Xcode (macOS only)
   yarn cap:open-ios
   ```

### Mobile Build Commands

```bash
# Sync web build with mobile platforms
yarn cap:sync

# Build for production
yarn cap:build-android    # Build Android APK/Bundle
yarn cap:build-ios        # Build iOS app
```

## 🖥 Desktop Apps (Electron)

ZeroBoard can be built as native desktop applications for macOS and Windows using Electron.

### Prerequisites for Desktop Development

- **Node.js 20.0+** with Yarn package manager
- **For macOS builds**: macOS with Xcode Command Line Tools
- **For Windows builds**: Windows with Visual Studio Build Tools or cross-compilation setup

### Desktop Development Commands

```bash
# Run in development mode (with hot reload)
yarn electron-dev

# Run the built web app in Electron
yarn electron

# Build desktop apps for current platform
yarn electron-build

# Build for specific platforms
yarn electron-build-mac     # Build macOS .dmg
yarn electron-build-win     # Build Windows .exe
yarn electron-build-all     # Build for both macOS and Windows
```

### Desktop Build Output

After building, you'll find the desktop apps in the `dist-electron/` directory:

- **macOS**: `.dmg` installer files for both Intel (`x64`) and Apple Silicon (`arm64`)
- **Windows**: `.exe` installer with NSIS setup wizard

### Building for Distribution

The desktop builds are automatically configured for distribution:

- **Code signing** ready (set `CSC_IDENTITY_AUTO_DISCOVERY=false` to disable)
- **Auto-updater** configured for GitHub releases
- **NSIS installer** for Windows with custom install directory option
- **DMG packaging** for macOS with both Intel and Apple Silicon support

### Desktop Build Configuration

The Electron build configuration is in `package.json` under the `build` section:

```json
{
  "build": {
    "appId": "com.zeroboard.app",
    "productName": "ZeroBoard",
    "directories": {
      "output": "dist-electron"
    },
    "mac": {
      "category": "public.app-category.productivity",
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        }
      ]
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ]
    }
  }
}
```

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

| Shortcut           | Action                          | Context                        |
| ------------------ | ------------------------------- | ------------------------------ |
| `Enter`            | Save changes and exit edit mode | When editing card titles       |
| `Escape`           | Cancel changes and revert       | When editing titles or content |
| `Ctrl/Cmd + Enter` | Save changes and exit edit mode | When editing card content      |
| `Ctrl/Cmd + B`     | Toggle bold text                | When editing card content      |
| `Ctrl/Cmd + I`     | Toggle italic text              | When editing card content      |

### Desktop App (Electron) Shortcuts

#### File Operations

| Shortcut       | Action                 |
| -------------- | ---------------------- |
| `Ctrl/Cmd + N` | Create new board       |
| `Ctrl/Cmd + O` | Import board from file |
| `Ctrl/Cmd + S` | Export current board   |

## 📁 Quick File Reference

- `/app/page.tsx` - Main kanban board application component with state management and drag-and-drop
- `/app/layout.tsx` - Root HTML layout and metadata configuration
- `/app/globals.css` - Global CSS styles and Tailwind imports
- `/components/note-card.tsx` - Individual card component with editing, collapsing, and multiple display modes
- `/components/kanban-column.tsx` - Column component managing cards and drag-and-drop zones
- `/components/markdown-renderer.tsx` - Markdown rendering with syntax highlighting and interactive features
- `/components/title-markdown-renderer.tsx` - Markdown renderer for titles and headers with bold/italic support
- `/lib/firebase-config.ts` - Firebase configuration and initialization
- `/lib/firebase-sync.ts` - Firebase sync service for boards and authentication
- `/lib/firebase-image-sync.ts` - Firebase Storage service for image synchronization
- `/components/image-manager.tsx` - Image management interface for IndexedDB stored images
- `/components/image-modal.tsx` - Full-screen image viewer modal component
- `/components/image-upload-modal.tsx` - Image upload interface with drag-and-drop support
- `/components/image-upload.tsx` - Core image upload functionality with IndexedDB integration
- `/lib/indexeddb-image-service.ts` - IndexedDB service for image storage, retrieval, and management
- `/lib/image-utils.ts` - Image processing utilities, caching, and markdown image extraction
- `/next.config.mjs` - Next.js configuration for static export and Electron compatibility
- `/tailwind.config.ts` - Tailwind CSS configuration with custom theme and shadcn/ui setup
- `/tsconfig.json` - TypeScript compiler configuration and path mappings
- `/components.json` - Shadcn/ui component library configuration
- `/package.json` - Project dependencies, scripts, and build configurations
- `/electron.js` - Electron main process for desktop application window management
- `/capacitor.config.ts` - Capacitor configuration for mobile app builds
- `/lib/utils.ts` - General utility functions including Tailwind CSS class merging
- `/components/theme-provider.tsx` - Theme context provider for application theming
