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
   npm install
   # or
   yarn install
   \`\`\`

3. **Start development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

4. **Open your browser**
   Navigate to `http://localhost:3000`

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

## 🌐 Deployment

This app is built as a static site and can be deployed to any static hosting service:

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically with zero configuration

### Netlify
1. Build the project: `npm run build`
2. Drag and drop the `dist` folder to Netlify
3. Your site is live!

### GitHub Pages
1. Build the project: `npm run build`
2. Push the `dist` folder contents to your `gh-pages` branch
3. Enable GitHub Pages in repository settings

### Other Hosting Services
The `dist` folder contains all static files and can be served by:
- Apache/Nginx
- AWS S3 + CloudFront
- Google Cloud Storage
- Any CDN or static hosting service

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

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

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

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the existing code style
4. **Test thoroughly**: Ensure all features work as expected
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes and their benefits

### Development Guidelines
- Use TypeScript for all new code
- Follow the existing component structure
- Add comments for complex logic
- Test on multiple browsers and screen sizes
- Ensure accessibility standards are met

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing React framework
- **Tailwind CSS**: For the utility-first CSS framework
- **Shadcn**: For the beautiful UI component library
- **React Markdown**: For excellent markdown rendering
- **Hello Pangea**: For the drag-and-drop functionality

## 📞 Support

If you encounter any issues or have questions:

1. **Check the Issues**: Look for existing solutions in the GitHub issues
2. **Create an Issue**: Report bugs or request features
3. **Discussions**: Join community discussions for help and ideas

## 🗺 Roadmap

### Upcoming Features
- [ ] Dark mode support
- [ ] Keyboard shortcuts
- [ ] Card templates
- [ ] Advanced search and filtering
- [ ] Card due dates and reminders
- [ ] Collaboration features
- [ ] Mobile app (PWA)
- [ ] Cloud sync options

### Version History
- **v1.0.0**: Initial release with core Kanban functionality
- **v1.1.0**: Added image support and multiple card types
- **v1.2.0**: Enhanced markdown support and export/import
- **v1.3.0**: Static site deployment and performance improvements

---

**Made with ❤️ for productivity enthusiasts and note-taking lovers**
