# ZeroBoard

A powerful, lightweight Kanban board application designed for personal note-taking and project management. Built with Next.js and featuring full markdown support, drag-and-drop functionality, and local storage persistence.

![ZeroBoard Screenshot](/placeholder.svg?height=400&width=800&query=kanban+board+interface+with+cards+and+columns)

## ✨ Features

### 🎯 Core Functionality
- **Multiple Kanban Boards**: Create and manage multiple boards for different projects
- **Drag & Drop**: Intuitive card movement between columns and reordering within columns
- **Real-time Editing**: Click-to-edit titles and content with instant updates
- **Local Storage**: All data persists locally in your browser - no server required

### 📝 Rich Content Support
- **Full Markdown Support**: Write notes with headers, lists, code blocks, tables, and more
- **Interactive Checkboxes**: Click checkboxes in markdown to toggle completion status
- **Image Support**: Upload and embed images directly in your cards
- **Table Rendering**: Beautiful table display with automatic formatting
- **Code Syntax**: Support for inline code and code blocks

### 🎨 Flexible Card Types
- **Standard Cards**: Regular cards with title and markdown content
- **Image-Only Cards**: Cards that display only images for visual organization
- **Table-Only Cards**: Cards optimized for displaying data tables
- **Collapsed Cards**: Minimize cards to show only titles for better organization
- **Plain Mode**: Remove borders and shadows for a minimal look
- **Light Background**: Highlight important cards with subtle background color

### 🔧 Advanced Features
- **Board Management**: Create, rename, and delete boards with confirmation
- **Column Customization**: Add, rename, and delete columns as needed
- **Export/Import**: Backup and restore your boards with JSON export/import
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Static Deployment**: Deploy anywhere as a static site - no server required

## 🚀 Quick Start

### Prerequisites
- Node.js 18.18 or later
- npm, yarn, or pnpm package manager

### Installation

1. **Clone or download the project**
   \`\`\`bash
   git clone <repository-url>
   cd zeroboard
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   yarn install
   \`\`\`

3. **Start development server**
   \`\`\`bash
   yarn dev
   \`\`\`

### Building for Production

\`\`\`bash
# Build static files
npm run build
# or
yarn build

# Serve the built files
npm start
# or
yarn start
\`\`\`

The built files will be in the `dist` directory, ready for deployment to any static hosting service.

## 📖 Usage Guide

### Getting Started
1. **First Launch**: The app comes with sample boards and cards to help you understand the features
2. **Create Your First Board**: Click the dropdown arrow in the title bar and select "Add Board"
3. **Add Columns**: Hover over the title bar and click the "+" button to add columns
4. **Create Cards**: Click the "+" button in any column header to add a new card

### Working with Cards

#### Creating and Editing Cards
- **New Card**: Click the "+" button in a column header
- **Edit Title**: Click on any card title to edit it inline
- **Edit Content**: Click on the card content area to open the markdown editor
- **Save Changes**: Press `Ctrl/Cmd + Enter` or click outside the editor

#### Card Features
- **Drag & Drop**: Drag cards between columns or reorder within columns
- **Collapse**: Click the chevron icon to minimize cards to title-only view
- **Plain Mode**: Click the dash icon to remove card styling
- **Light Background**: Click the hash icon to highlight cards
- **Add Images**: Click the image icon to upload and insert images
- **Delete**: Click the X icon twice to confirm deletion

#### Markdown Support
\`\`\`markdown
# Headers
**Bold text** and *italic text*
\`inline code\` and code blocks
- [x] Completed tasks
- [ ] Pending tasks

| Tables | Are | Supported |
|--------|-----|-----------|
| Data   | 123 | ✓         |
\`\`\`

### Managing Boards
- **Switch Boards**: Click the dropdown arrow in the title bar
- **Rename Board**: Click on the board title to edit it
- **Add Board**: Use the dropdown menu to create new boards
- **Delete Board**: Hover over a board in the dropdown and click the X icon
- **Export Data**: Use the dropdown menu to download your boards as JSON
- **Import Data**: Use the dropdown menu to restore boards from a JSON file

### Image Management
- **Upload Images**: Click the image icon in any card or use the drag-and-drop interface
- **View Images**: Click on any image to open it in full-screen mode
- **Image Library**: Access uploaded images through the image manager
- **Local Storage**: Images are stored locally in your browser

## 🛠 Technical Details

### Built With
- **Next.js 15**: React framework with static export capability
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Beautiful, accessible UI components
- **React Markdown**: Markdown rendering with GitHub Flavored Markdown
- **Hello Pangea DnD**: Drag and drop functionality
- **Lucide React**: Beautiful, consistent icons

### Architecture
- **Client-Side Only**: No server required, runs entirely in the browser
- **Local Storage**: Data persistence without external dependencies
- **Static Export**: Generates static HTML/CSS/JS files for deployment
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Component-Based**: Modular React components for maintainability

### Storage Limits
- **Local Storage**: ~5-10MB depending on browser
- **Images**: Stored as base64, recommended max 500KB per image
- **Boards**: No practical limit on number of boards or cards

## 🎨 Customization

### Themes
The app uses a clean, minimal design that's easy to customize:
- Modify `tailwind.config.ts` for color schemes
- Update `globals.css` for global styles
- Components use Tailwind classes for easy theming

### Adding Features
The modular architecture makes it easy to extend:
- Add new card types in `note-card.tsx`
- Extend markdown support in `markdown-renderer.tsx`
- Add new board layouts in the main `page.tsx`


---

## 📁 Project File Structure

This section provides a comprehensive map of all major files in the ZeroBoard project, their functions, and key methods.

### Quick File Reference

**Core Application Files:**
- `/app/page.tsx` - Main kanban board application component with state management and drag-and-drop
- `/app/layout.tsx` - Root HTML layout and metadata configuration
- `/app/globals.css` - Global CSS styles and Tailwind imports
- `/components/note-card.tsx` - Individual card component with editing, collapsing, and multiple display modes
- `/components/kanban-column.tsx` - Column component managing cards and drag-and-drop zones
- `/components/markdown-renderer.tsx` - Markdown rendering with syntax highlighting and interactive features
- `/components/title-markdown-renderer.tsx` - Markdown renderer for titles and headers with bold/italic support
- `/components/image-manager.tsx` - Image management interface for IndexedDB stored images
- `/components/image-modal.tsx` - Full-screen image viewer modal component
- `/components/image-upload-modal.tsx` - Image upload interface with drag-and-drop support
- `/components/image-upload.tsx` - Core image upload functionality with IndexedDB integration
- `/components/theme-provider.tsx` - Theme context provider for application theming
- `/lib/indexeddb-image-service.ts` - IndexedDB service for image storage, retrieval, and management
- `/lib/image-utils.ts` - Image processing utilities, caching, and markdown image extraction
- `/lib/utils.ts` - General utility functions including Tailwind CSS class merging
- `/next.config.mjs` - Next.js configuration for static export and Electron compatibility
- `/tailwind.config.ts` - Tailwind CSS configuration with custom theme and shadcn/ui setup
- `/tsconfig.json` - TypeScript compiler configuration and path mappings
- `/components.json` - Shadcn/ui component library configuration
- `/package.json` - Project dependencies, scripts, and Electron build configuration
- `/electron.js` - Electron main process for desktop application window management

### Core Application Files

#### `/app/page.tsx` - Main Application Component
**Purpose**: The heart of the application containing all board management, state handling, and drag-and-drop functionality.

**Key Functions:**
- `KanbanBoard()` - Main React component managing the entire application state
- `handleDragEnd(result)` - Handles card movement between columns and reordering within columns
- `exportBoards()` - Exports all boards and images to JSON format with IndexedDB integration
- `handleImportFile(event)` - Imports boards from JSON files, including image restoration to IndexedDB
- `addBoard()` - Creates new kanban boards with default column structure
- `addColumn()` - Adds new columns to the current board
- `addCard(columnId, card)` - Creates new cards in specified columns
- `updateCard(columnId, cardId, updates)` - Updates existing cards with new content or properties
- `deleteCard(columnId, cardId)` - Removes cards from columns
- `switchBoard(boardId)` - Changes the active board being displayed
- `handleBoardTitleSave()` - Saves board title changes with markdown support

**State Management:**
- `boards` - Array of all kanban boards
- `currentBoardId` - ID of currently active board
- `currentBoardTitle` - Title of current board (supports markdown)
- Uses localStorage for persistence

#### `/app/layout.tsx` - Application Layout
**Purpose**: Defines the root HTML structure and metadata for the application.

#### `/app/globals.css` - Global Styles
**Purpose**: Contains global CSS styles, including Tailwind CSS imports and custom styling.

### Component Files

#### `/components/note-card.tsx` - Individual Card Component
**Purpose**: Renders individual kanban cards with editing capabilities, multiple display modes, and interactive features.

**Key Functions:**
- `NoteCard(props)` - Main card component with editing, collapsing, and various display modes
- `toggleCollapse()` - Minimizes/expands cards to show only titles
- `togglePlain()` - Removes/adds borders and shadows for minimal look
- `toggleLightBackground()` - Highlights cards with subtle background color
- `handleCheckboxToggle(index)` - Toggles markdown checkboxes within card content
- `handleDeleteClick()` - Implements two-click delete confirmation for cards
- `startEditingContent(e)` - Switches card to edit mode for content modification
- `handleImageSelected(imageId, filename)` - Adds selected images to card content
- `AsyncImageOnlyCard` - Specialized component for image-only cards with IndexedDB loading
- `AsyncCollapsedImageCard` - Handles collapsed image cards with async image loading

**Card Types Supported:**
- Standard cards with title and markdown content
- Image-only cards displaying just images
- Table-only cards optimized for data display
- Collapsed cards showing only titles
- Light background cards for highlighting

#### `/components/kanban-column.tsx` - Column Component
**Purpose**: Manages individual kanban columns including cards, drag-and-drop zones, and column operations.

**Key Functions:**
- `KanbanColumn(props)` - Main column component with card management
- `handleAddCard()` - Creates new blank cards in edit mode
- `handleTitleSave()` - Saves column title changes
- `handleDeleteClick()` - Two-click confirmation for column deletion
- Integrates with drag-and-drop using `@hello-pangea/dnd`

#### `/components/markdown-renderer.tsx` - Markdown Display Component
**Purpose**: Renders markdown content with syntax highlighting, interactive features, and multiple display modes.

**Key Functions:**
- `MarkdownRenderer(props)` - Main markdown rendering component with customizable modes
- `CodeBlock({language, children})` - Custom syntax highlighter for code blocks with tokenization
- `ImageOnlyRenderer({content, collapsedImageHeight, onImageClick})` - Specialized renderer for image-only cards
- `ImageWithExpand({src, alt, onImageClick})` - Image component with expand button and async loading
- `tokenizeCode()` - Syntax highlighting tokenizer supporting multiple programming languages

**Features:**
- GitHub Flavored Markdown support via `remark-gfm`
- Interactive checkboxes that trigger callbacks
- Custom syntax highlighting for code blocks
- Image expansion with modal support
- Table rendering with proper styling
- Support for collapsed image cards

#### `/components/title-markdown-renderer.tsx` - Title Markdown Renderer
**Purpose**: Renders markdown in titles and column headers with bold/italic support.

#### `/components/image-manager.tsx` - Image Management Interface
**Purpose**: Provides interface for managing stored images in IndexedDB.

**Key Functions:**
- `ImageManager({onImageSelect, showSelector})` - Main image management component
- `loadImages()` - Retrieves all images from IndexedDB and creates display URLs
- `deleteImage(imageId)` - Removes images from IndexedDB storage
- `copyImageMarkdown(image)` - Copies markdown syntax for images to clipboard
- `downloadImage(image)` - Downloads images from IndexedDB to local filesystem
- `formatFileSize(bytes)` - Converts bytes to human-readable file sizes

#### `/components/image-modal.tsx` - Full-Screen Image Viewer
**Purpose**: Displays images in full-screen modal overlay.

#### `/components/image-upload-modal.tsx` - Image Upload Interface
**Purpose**: Handles image upload with drag-and-drop and file selection.

#### `/components/image-upload.tsx` - Image Upload Component
**Purpose**: Core image upload functionality with IndexedDB storage.

#### `/components/theme-provider.tsx` - Theme Management
**Purpose**: Provides theme context for the application (currently supports light mode).

### Library Files

#### `/lib/indexeddb-image-service.ts` - Image Storage Service
**Purpose**: Handles all IndexedDB operations for image storage and retrieval.

**Key Functions:**
- `IndexedDBImageService` - Main service class for image operations
- `init()` - Initializes IndexedDB database and object stores
- `storeImage(id, filename, blob, type)` - Stores image blobs in IndexedDB
- `getImage(id)` - Retrieves image data by ID
- `getAllImages()` - Gets all stored images sorted by upload date
- `deleteImage(id)` - Removes images from storage
- `getImageAsDataURL(id)` - Converts stored blobs to data URLs for display
- `getStorageUsage()` - Returns current storage usage statistics

**Database Schema:**
- Database: `zeroboard-images`
- Store: `images` with indexes on `uploadedAt` and `filename`
- Stores complete image metadata including size, type, and timestamps

#### `/lib/image-utils.ts` - Image Utility Functions
**Purpose**: Utility functions for image handling, caching, and markdown processing.

**Key Functions:**
- `getImageUrlFromMarkdown(markdown)` - Extracts image URLs and alt text from markdown
- `resolveImageUrl(src)` - Resolves local image references to data URLs
- `getCachedImageUrl(src)` - Retrieves resolved URLs from cache
- `clearImageCache()` - Clears all image caches and increments cache version
- `isImageOnlyContent(content)` - Checks if markdown contains only an image
- `isTableOnlyContent(content)` - Checks if markdown contains only a table
- `startsWithImage(content)` - Checks if markdown starts with an image
- `createImageErrorElement(message)` - Creates error elements for failed image loads

**Caching System:**
- `imageUrlCache` - Maps image IDs to data URLs
- `resolvedUrlCache` - Maps source URLs to resolved URLs
- `cacheVersion` - Tracks cache invalidation for component re-renders

#### `/lib/utils.ts` - General Utilities
**Purpose**: Contains utility functions including class name merging for Tailwind CSS.

### Configuration Files

#### `/next.config.mjs` - Next.js Configuration
**Purpose**: Configures Next.js for static export and Electron compatibility.

**Key Settings:**
- `output: 'export'` - Enables static site generation
- `assetPrefix: '.'` - Uses relative paths for Electron compatibility
- `distDir: 'dist'` - Sets build output directory
- `images.unoptimized: true` - Disables image optimization for static export

#### `/tailwind.config.ts` - Tailwind CSS Configuration
**Purpose**: Configures Tailwind CSS with custom colors and shadcn/ui integration.

#### `/tsconfig.json` - TypeScript Configuration
**Purpose**: TypeScript compiler options and path mappings.

#### `/components.json` - Shadcn/UI Configuration
**Purpose**: Configuration for shadcn/ui component library integration.

#### `/package.json` - Project Dependencies
**Purpose**: Defines project dependencies, scripts, and Electron build configuration.

**Key Scripts:**
- `dev` - Starts Next.js development server
- `build` - Builds static export for production
- `electron` - Runs Electron app
- `electron-dev` - Concurrent development mode
- `electron-build` - Builds Electron distributables

#### `/electron.js` - Electron Main Process
**Purpose**: Electron application entry point and window management.

**Key Functions:**
- `createWindow()` - Creates main application window with security settings
- `createMenu()` - Sets up application menu with keyboard shortcuts
- Handles file protocol loading for static assets
- Implements security measures preventing external navigation

### Data Models

#### Core Interfaces (defined in `/app/page.tsx`)

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

### Storage Architecture

1. **localStorage**: Stores board data, current board selection
2. **IndexedDB**: Stores image blobs with metadata via `IndexedDBImageService`
3. **Memory Caches**: Image URL caching for performance optimization
4. **Export Format**: JSON with embedded base64 images for portability

### Key Dependencies

- **Next.js 15**: React framework with static export
- **@hello-pangea/dnd**: Drag and drop functionality
- **react-markdown**: Markdown rendering with GitHub flavored markdown
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: UI component library
- **Lucide React**: Icon library
- **Electron**: Desktop application wrapper

This architecture provides a robust, offline-first note-taking application with rich multimedia support and cross-platform compatibility.

---

**Made with ❤️ for productivity enthusiasts and note-taking lovers**
