"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { flushSync } from "react-dom"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Plus, ChevronDown, X, Download, Upload, Cloud, CloudOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { KanbanColumn } from "@/components/kanban-column"
import { TitleMarkdownRenderer } from "@/components/title-markdown-renderer"
import { imageService } from "@/lib/indexeddb-image-service"
import { clearImageCache } from "@/lib/image-utils"
import { firebaseSync } from "@/lib/firebase-sync"

// Update the Card interface to include the new lightBackground property
export interface Card {
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

export interface Column {
  id: string
  title: string
  color: string
  cards: Card[]
}

export interface Board {
  id: string
  title: string
  columns: Column[]
  order: number
  imagesMigrated?: boolean  // Track if images have been migrated to Firebase
}

const defaultBoards: Board[] = [
  {
    id: "zeroboard-showcase", 
    title: "🎨 **ZeroBoard** *Showcase*",
    order: 0,
    columns: [
      {
        id: "getting-started",
        title: "🚀 **Getting** *Started*",
        color: "bg-gray-100",
        cards: [
          {
            id: "welcome-card",
            title: "Welcome to ZeroBoard! 🎯",
            content: `# Welcome to Your Ultimate Kanban Experience!

**ZeroBoard** is a powerful, flexible Kanban board designed for *productivity enthusiasts* and *note-taking lovers*.

## ✨ **Key Features**
- **📝 Rich Markdown Support** - Full GitHub Flavored Markdown
- **🎨 Multiple Card Types** - Standard, collapsed, plain, light background
- **📊 Tables & Code** - Perfect for technical documentation
- **🖼️ Image Support** - Upload and embed images seamlessly
- **☁️ Firebase Sync** - Optional cloud synchronization
- **📱 Cross-Platform** - Web, desktop (Electron), mobile (iOS/Android)

## 🎮 **Interactive Elements**
- [x] Drag and drop cards between columns
- [x] Click titles and content to edit inline
- [x] Interactive checkboxes (try clicking!)
- [ ] Hover over this card to see control icons
- [ ] Try the different card modes with the toolbar icons

> **Pro Tip**: Explore all the example cards to discover ZeroBoard's full potential!

**Made with ❤️ for productivity and creativity**`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
            lightBackground: true,
          },
          // Add an example card with lightBackground enabled to the Personal Kanban Notes board
          // Add this card after the first card in the "life" column
          {
            id: "card-light-bg-example",
            title: "Light Background Example",
            content: `This card demonstrates the new light background option!

**Key Features:**
- Subtle light grey background
- Perfect for highlighting important cards
- Toggle with the # icon in the card header
- Works with all other card features

### Use Cases
- Important reminders
- Current focus items
- High priority tasks
- Special categories

Try hovering over this card's title to see the icons and toggle options.`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
            lightBackground: true,
          },
          {
            id: "card-11",
            title: "Call Mom",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "card-2",
            title: "Weekend Plans",
            content: `**Saturday:**
- [ ] Morning jog in the park
- [ ] Grocery shopping
- [ ] Visit the farmers market

**Sunday:**
- [ ] Brunch with friends
- [ ] Read a book
- [ ] Meal prep for the week

> Remember to check the weather forecast!`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "card-12",
            title: "Buy Birthday Gift",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "card-3",
            title: "Vacation Photo",
            content: `![Beach Sunset](/placeholder.svg?height=300&width=400)`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
        ],
      },
      {
        id: "work",
        title: "Work",
        color: "bg-gray-100",
        cards: [
          {
            id: "card-4",
            title: "Project Timeline",
            content: `Project Phases:

1. **Research & Planning** - Week 1-2
2. **Design & Prototyping** - Week 3-4
3. **Development** - Week 5-8
4. **Testing** - Week 9
5. **Deployment** - Week 10

> Note: Timeline subject to change based on client feedback

## Tasks
- [x] Initial research completed
- [x] Wireframes approved
- [ ] Backend API development
- [ ] Frontend implementation
- [ ] User testing`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "card-13",
            title: "Team Meeting @ 2pm",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "card-5",
            title: "Code Review Notes",
            content: `\`\`\`javascript
// TODO: Optimize this function
function processData(data) {
  return data
    .filter(item => item.active)
    .map(item => ({
      ...item,
      processed: true
    }));
}
\`\`\`

**Review Comments:**
- Consider using a more descriptive variable name
- Add error handling for edge cases
- Performance looks good overall`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "card-14",
            title: "Submit Expense Report",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          // Add this card to the end of the cards array in the "work" column
          {
            id: "card-table-only-example",
            title: "Table Only Card",
            content: `| Task | Priority | Status | Due Date |
|------|----------|--------|----------|
| API Integration | High | In Progress | Dec 15 |
| Database Migration | Medium | Pending | Dec 20 |
| UI Testing | High | Complete | Dec 10 |
| Documentation | Low | Not Started | Dec 25 |
| Code Review | Medium | In Progress | Dec 12 |`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
        ],
      },
      {
        id: "archived",
        title: "Archived",
        color: "bg-gray-100",
        cards: [
          {
            id: "card-6",
            title: "Old Project Ideas",
            content: `Brainstorming Session - March 2024:

**App Ideas**
1. **Recipe Organizer** - Store and categorize recipes
2. **Habit Tracker** - Daily habit monitoring
3. **Book Club Manager** - Organize reading groups

### Notes
- Focus on mobile-first design
- Consider offline functionality
- Research competitor apps

*These ideas were explored but put on hold for now.*`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "card-15",
            title: "Old Tax Documents",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "card-7",
            title: "Reference Image",
            content: `![Design Reference](/placeholder.svg?height=400&width=600)`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "card-16",
            title: "Previous Address",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "card-table-example",
            title: "Project Comparison Table",
            content: `Here's an example of how tables work in markdown:

## Project Options Comparison

| Feature | Option A | Option B | Option C |
|---------|----------|----------|----------|
| **Cost** | $5,000 | $7,500 | $3,200 |
| **Timeline** | 3 months | 2 months | 4 months |
| **Team Size** | 4 people | 6 people | 3 people |
| **Risk Level** | Low | Medium | High |
| **ROI** | 150% | 200% | 120% |

### Key Insights
- Option B offers the highest ROI but requires more resources
- Option C is most budget-friendly but takes longer
- Option A provides the best balance of cost and risk

**Recommendation**: Go with Option A for the pilot project.`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
        ],
      },
      {
        id: "complete",
        title: "Complete",
        color: "bg-gray-100",
        cards: [
          {
            id: "card-collapsed-1",
            title: "Recipe Collection",
            content: `![Homemade Pizza](/placeholder.svg?height=200&width=300&query=homemade+pizza+with+fresh+basil)

**Margherita Pizza Recipe**

### Ingredients
- 1 pizza dough ball
- 1/2 cup marinara sauce
- 8 oz fresh mozzarella
- Fresh basil leaves
- Extra virgin olive oil
- Salt and pepper

### Instructions
1. Preheat oven to 500°F
2. Roll out dough on floured surface
3. Spread sauce evenly, leaving 1-inch border
4. Add torn mozzarella pieces
5. Bake for 10-12 minutes until golden
6. Top with fresh basil and drizzle with olive oil

*Perfect for Friday night dinners!*`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: false,
          },
          {
            id: "card-collapsed-2",
            title: "Travel Memories",
            content: `![Mountain Landscape](/placeholder.svg?height=250&width=400&query=beautiful+mountain+landscape+sunset)

**Trip to Rocky Mountain National Park**

### Day 1 - Arrival
- Checked into cabin near Estes Park
- Evening walk around Bear Lake
- Amazing sunset views from the deck

### Day 2 - Hiking Adventure  
- **Trail**: Emerald Lake Trail (3.2 miles)
- **Highlights**: 
  - Crystal clear alpine lakes
  - Wildlife spotting (elk, chipmunks)
  - Breathtaking mountain vistas

### Day 3 - Photography
- Early morning shoot at Sprague Lake
- Captured reflection shots of the peaks
- Learned about long exposure techniques

**Rating**: ⭐⭐⭐⭐⭐
*Definitely coming back next summer!*`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: false,
          },
          {
            id: "card-collapsed-3",
            title: "Garden Progress",
            content: `![Vegetable Garden](/placeholder.svg?height=200&width=350&query=thriving+vegetable+garden+with+tomatoes+and+peppers)

**Summer Garden Update - Week 12**

### What's Growing Well
- **Tomatoes**: 6 plants producing heavily
- **Peppers**: Bell peppers ready for harvest
- **Herbs**: Basil, oregano, and thyme thriving
- **Lettuce**: Second succession planting successful

### This Week's Harvest
- 12 large tomatoes
- 8 bell peppers  
- 2 cups fresh basil
- Mixed salad greens

### Next Steps
- [ ] Start fall planting (carrots, radishes)
- [ ] Preserve excess tomatoes
- [ ] Plan winter garden layout
- [ ] Order seeds for next season

**Total yield so far**: 45 lbs of vegetables! 🥕🍅`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: false,
          },
          {
            id: "card-8",
            title: "Meeting Notes",
            content: `Team Meeting - June 4:

**Attendees**
- Sarah
- Michael
- Jennifer
- David

### Action Items
- [x] Update project timeline
- [x] Schedule follow-up meeting
- [x] Share meeting notes with team

### Decisions
1. Moving forward with Option B for the homepage design
2. Next release scheduled for June 15
3. Adding two new team members next month`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "card-17",
            title: "Dentist Appointment",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "card-9",
            title: "Workout Plan",
            content: `Week 1 - Completed ✅

**Monday - Upper Body**
- [x] Push-ups: 3 sets of 15
- [x] Pull-ups: 3 sets of 8
- [x] Planks: 3 sets of 60 seconds

### Wednesday - Lower Body
- [x] Squats: 3 sets of 20
- [x] Lunges: 3 sets of 12 each leg
- [x] Calf raises: 3 sets of 15

### Friday - Cardio
- [x] 30-minute run
- [x] 10-minute cool down stretch

Great week! Feeling stronger already.`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "card-18",
            title: "Car Maintenance",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "card-10",
            title: "Book Summary",
            content: `"Atomic Habits" by James Clear

**Key Takeaways**
1. **1% Better Every Day** - Small improvements compound over time
2. **Habit Stacking** - Link new habits to existing ones
3. **Environment Design** - Make good habits obvious, bad habits invisible
4. **Identity-Based Habits** - Focus on who you want to become

## Favorite Quote
> "You do not rise to the level of your goals. You fall to the level of your systems."

## Rating: ⭐⭐⭐⭐⭐

Highly recommend for anyone looking to build better habits!`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
        ],
      },
    ],
  },
  {
    id: "work-projects",
    title: "Work Projects",
    order: 1,
    columns: [
      {
        id: "backlog",
        title: "Backlog",
        color: "bg-gray-100",
        cards: [
          {
            id: "work-card-1",
            title: "User Authentication System",
            content: `Requirements:
- [ ] OAuth integration (Google, GitHub)
- [ ] Email/password login
- [ ] Password reset functionality
- [ ] Two-factor authentication

## Technical Notes
- Use NextAuth.js for implementation
- Store sessions in database
- Implement rate limiting

**Priority**: High
**Estimated effort**: 2 weeks`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "work-card-6",
            title: "Refactor Legacy Code",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "work-card-2",
            title: "API Documentation",
            content: `Tasks:
- [ ] Set up Swagger/OpenAPI
- [ ] Document all endpoints
- [ ] Add code examples
- [ ] Create interactive playground

## Endpoints to Document
1. Authentication endpoints
2. User management
3. Data CRUD operations
4. File upload/download

*Need to coordinate with backend team*`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "work-card-7",
            title: "Security Audit",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
        ],
      },
      {
        id: "in-progress",
        title: "In Progress",
        color: "bg-gray-100",
        cards: [
          {
            id: "work-card-3",
            title: "Dashboard Redesign",
            content: `Current Status:
Working on the new dashboard layout with improved UX.

## Completed
- [x] User research and interviews
- [x] Wireframes and mockups
- [x] Design system updates

## In Progress
- [ ] Component implementation
- [ ] Responsive design
- [ ] Performance optimization

## Figma Design
![Dashboard Mockup](/placeholder.svg?height=250&width=400)

**Deadline**: End of this week`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "work-card-8",
            title: "Database Migration",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "work-card-9",
            title: "Fix Critical Bug",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
        ],
      },
      {
        id: "review",
        title: "Review",
        color: "bg-gray-100",
        cards: [
          {
            id: "work-card-4",
            title: "Mobile App Performance",
            content: `Performance Improvements:

**Completed Optimizations**
- [x] Image lazy loading
- [x] Bundle size reduction (30% smaller)
- [x] Database query optimization
- [x] Caching implementation

### Results
- Load time: **2.1s → 0.8s**
- Bundle size: **1.2MB → 850KB**
- Lighthouse score: **78 → 94**

Ready for QA testing and stakeholder review.`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "work-card-10",
            title: "New Feature PR",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "work-card-11",
            title: "Documentation Updates",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
        ],
      },
      {
        id: "deployed",
        title: "Deployed",
        color: "bg-gray-100",
        cards: [
          {
            id: "work-card-5",
            title: "Customer Support Chat",
            content: `Feature Launch ✅

Successfully deployed the new customer support chat system.

### Features
- Real-time messaging
- File sharing
- Chat history
- Agent assignment
- Mobile responsive

### Metrics (First Week)
- **Response time**: Average 2.3 minutes
- **Customer satisfaction**: 4.7/5
- **Resolution rate**: 89%

Great feedback from both customers and support team!`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "work-card-12",
            title: "User Profile Update",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "work-card-13",
            title: "Payment Gateway Integration",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
        ],
      },
    ],
  },
  {
    id: "home-garden",
    title: "Home & Garden",
    order: 2,
    columns: [
      {
        id: "planning",
        title: "Planning",
        color: "bg-gray-100",
        cards: [
          {
            id: "home-card-1",
            title: "Spring Garden Layout",
            content: `Garden Plan for 2024:

**Vegetable Section**
- [ ] Tomatoes (4 plants)
- [ ] Peppers (3 plants)
- [ ] Lettuce (succession planting)
- [ ] Herbs (basil, oregano, thyme)

### Flower Beds
- [ ] Sunflowers along back fence
- [ ] Marigolds for pest control
- [ ] Zinnias for cutting garden

## Timeline
- **March**: Start seeds indoors
- **April**: Prepare soil, plant cool crops
- **May**: Plant warm season crops

![Garden Layout](/placeholder.svg?height=300&width=400)`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "home-card-6",
            title: "Paint Colors",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "home-card-2",
            title: "Kitchen Renovation Ideas",
            content: `Kitchen Upgrade Plans:

**Must-Have Changes**
- [ ] New countertops (quartz)
- [ ] Cabinet hardware update
- [ ] Backsplash installation
- [ ] Under-cabinet lighting

### Nice-to-Have
- [ ] Kitchen island
- [ ] New appliances
- [ ] Pantry organization

## Budget Estimate
- Countertops: $3,000-4,000
- Backsplash: $800-1,200
- Hardware: $200-400
- Lighting: $300-500

*Get quotes from 3 contractors*`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "home-card-7",
            title: "Furniture Shopping",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
        ],
      },
      {
        id: "in-progress-home",
        title: "In Progress",
        color: "bg-gray-100",
        cards: [
          {
            id: "home-card-3",
            title: "Bathroom Deep Clean",
            content: `Spring Cleaning Project:

**Completed**
- [x] Declutter medicine cabinet
- [x] Clean grout and tiles
- [x] Organize under-sink storage

### In Progress
- [ ] Replace shower curtain
- [ ] Deep clean exhaust fan
- [ ] Touch up paint

### Supplies Needed
- New shower curtain liner
- Grout sealer
- Touch-up paint (bathroom white)

**Target completion**: This weekend`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "home-card-8",
            title: "Fix Leaky Faucet",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "home-card-9",
            title: "Organize Garage",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
        ],
      },
      {
        id: "maintenance",
        title: "Maintenance",
        color: "bg-gray-100",
        cards: [
          {
            id: "home-card-4",
            title: "Monthly Home Tasks",
            content: `Regular Maintenance Schedule:

**Monthly Tasks**
- [x] Change HVAC filters
- [x] Test smoke detectors
- [ ] Clean garbage disposal
- [ ] Check for leaks

### Seasonal Tasks (Spring)
- [ ] Gutter cleaning
- [ ] Pressure wash deck
- [ ] Service lawn mower
- [ ] Trim bushes and trees

### Annual Tasks
- [ ] HVAC service
- [ ] Chimney inspection
- [ ] Water heater flush

*Set reminders in calendar*`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "home-card-10",
            title: "Lawn Care Schedule",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "home-card-11",
            title: "Filter Replacements",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
        ],
      },
      {
        id: "completed-home",
        title: "Completed",
        color: "bg-gray-100",
        cards: [
          {
            id: "home-card-5",
            title: "Living Room Refresh",
            content: `Room Makeover Complete! ✅

**What We Did**
- [x] New paint color (warm gray)
- [x] Rearranged furniture layout
- [x] Added new throw pillows
- [x] Hung artwork gallery wall
- [x] New area rug

### Results
The room feels so much more spacious and modern! The new layout creates better flow and the gallery wall is the perfect focal point.

**Total cost**: $650
**Time invested**: 2 weekends

![New Living Room](/placeholder.svg?height=250&width=400)

*Everyone loves the new look!*`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "home-card-12",
            title: "Window Cleaning",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "home-card-13",
            title: "Replace Doorbell",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
        ],
      },
    ],
  },
  {
    id: "learning",
    title: "Learning & Development",
    order: 3,
    columns: [
      {
        id: "want-to-learn",
        title: "Want to Learn",
        color: "bg-gray-100",
        cards: [
          {
            id: "learn-card-1",
            title: "Machine Learning Fundamentals",
            content: `Learning Goals:

**Core Concepts**
- [ ] Linear regression
- [ ] Classification algorithms
- [ ] Neural networks basics
- [ ] Data preprocessing

### Resources
- **Course**: Andrew Ng's ML Course (Coursera)
- **Book**: "Hands-On Machine Learning"
- **Practice**: Kaggle competitions

### Timeline
- **Weeks 1-4**: Theory and math foundations
- **Weeks 5-8**: Practical implementation
- **Weeks 9-12**: Real projects

*Start with Python and scikit-learn*`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "learn-card-6",
            title: "Photography Basics",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "learn-card-2",
            title: "Spanish Language",
            content: `Language Learning Plan:

**Goals**
- [ ] Conversational level in 6 months
- [ ] Focus on travel vocabulary
- [ ] Basic grammar mastery

### Methods
- **App**: Duolingo (daily practice)
- **Podcast**: SpanishPod101
- **Practice**: Language exchange partner
- **Immersion**: Spanish movies with subtitles

### Weekly Schedule
- Monday/Wednesday/Friday: 30 min lessons
- Tuesday/Thursday: Podcast listening
- Weekend: Conversation practice

¡Vamos a aprender español!`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "learn-card-7",
            title: "Guitar Lessons",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
        ],
      },
      {
        id: "currently-learning",
        title: "Currently Learning",
        color: "bg-gray-100",
        cards: [
          {
            id: "learn-card-3",
            title: "Advanced React Patterns",
            content: `Course Progress: 60% Complete

**Completed Modules**
- [x] Compound Components
- [x] Render Props
- [x] Higher-Order Components
- [x] Custom Hooks

### Currently Working On
- [ ] Context API patterns
- [ ] Performance optimization
- [ ] Testing strategies

### Practice Projects
1. **Component Library** - Building reusable components
2. **State Management** - Complex form handling
3. **Performance Demo** - Optimization techniques

**Course**: "Advanced React" by Kent C. Dodds
**Progress**: 12/20 modules complete`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "learn-card-8",
            title: "Data Visualization",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "learn-card-9",
            title: "Public Speaking",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
        ],
      },
      {
        id: "practice",
        title: "Practice",
        color: "bg-gray-100",
        cards: [
          {
            id: "learn-card-4",
            title: "Daily Coding Challenges",
            content: `Coding Practice Routine:

**Platforms**
- **LeetCode**: Algorithm problems
- **Codewars**: Fun challenges
- **HackerRank**: Interview prep

### This Week's Focus
- [ ] Array manipulation
- [ ] String algorithms
- [ ] Binary tree traversal

### Progress Tracking
- **Problems solved**: 47/100 (goal)
- **Streak**: 12 days
- **Difficulty**: Easy → Medium transition

### Recent Achievements
- [x] Solved "Two Sum" in O(n) time
- [x] Implemented binary search
- [x] Completed 5 string problems

*Consistency is key!*`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "learn-card-10",
            title: "Writing Exercises",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "learn-card-11",
            title: "Meditation Sessions",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
        ],
      },
      {
        id: "mastered",
        title: "Mastered",
        color: "bg-gray-100",
        cards: [
          {
            id: "learn-card-5",
            title: "TypeScript Fundamentals",
            content: `TypeScript Mastery Complete! 🎉

**Skills Acquired**
- [x] Type annotations and interfaces
- [x] Generics and utility types
- [x] Advanced type manipulation
- [x] Integration with React
- [x] Configuration and tooling

### Projects Built
1. **Type-safe API client** - Full CRUD operations
2. **React component library** - Strict typing
3. **Node.js backend** - Express with TypeScript

### Certification
**Certificate**: "TypeScript Deep Dive" course
**Score**: 95/100
**Date**: March 2024

Now using TypeScript in all new projects. The type safety and developer experience improvements are incredible!`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "learn-card-12",
            title: "HTML/CSS Basics",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
          {
            id: "learn-card-13",
            title: "Git Version Control",
            content: "",
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: true,
            plain: true,
          },
        ],
      },
    ],
  },
]

// Utility function to ensure boards are sorted by order and have order values
const ensureBoardOrder = (boards: Board[]): Board[] => {
  return boards
    .map((board, index) => ({
      ...board,
      order: board.order !== undefined ? board.order : index
    }))
    .sort((a, b) => a.order - b.order)
}

export default function KanbanBoard() {
  const [isLoading, setIsLoading] = useState(true)
  const [boards, setBoards] = useState<Board[]>([])
  const [currentBoardId, _setCurrentBoardId] = useState("zeroboard-showcase")
  
  // Wrap setCurrentBoardId with debugging
  const setCurrentBoardId = useCallback((newId: string) => {
    console.log(`🔥 setCurrentBoardId called: ${currentBoardId} -> ${newId}`)
    console.trace('Call stack:')
    _setCurrentBoardId(newId)
  }, [currentBoardId])
  const [currentBoardTitle, setCurrentBoardTitle] = useState("**Personal** *Kanban* Notes")
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false)
  const [boardTitleValue, setBoardTitleValue] = useState("")
  const [isTitleBarHovering, setIsTitleBarHovering] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [boardDeleteConfirming, setBoardDeleteConfirming] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [hoveredBoardId, setHoveredBoardId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showMobileTitleButtons, setShowMobileTitleButtons] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Firebase sync state - optional cloud sync
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncUser, setSyncUser] = useState<any>(null)
  const [showSyncSetup, setShowSyncSetup] = useState(false)
  const [isEnablingSync, setIsEnablingSync] = useState(false)
  const [syncReady, setSyncReady] = useState(false)
  const [showSyncDataModal, setShowSyncDataModal] = useState(false)
  const [syncModalData, setSyncModalData] = useState<{
    cloudBoards: number
    localBoards: number
    onConfirm: (useCloud: boolean) => void
  } | null>(null)
  const isEnablingSyncRef = useRef(false)
  
  // Refs for current state access in sync listener (to avoid closure issues)
  const syncReadyRef = useRef(false)
  const isFirebaseConnectedRef = useRef(false)
  const syncUserRef = useRef<any>(null)
  const autoSyncPendingRef = useRef(false)
  const isRealTimeSyncUpdateRef = useRef(false) // Track when boards are updated from Firebase real-time sync
  const initialSyncCompleteRef = useRef(false) // Track if initial sync setup is complete

  const currentBoard = (() => {
    const found = boards.find((board) => board.id === currentBoardId)
    const fallback = boards[0] || defaultBoards[0]
    const result = found || fallback
    
    if (!found && boards.length > 0) {
      console.log(`⚠️ Current board '${currentBoardId}' not found in boards:`, boards.map(b => b.id))
      console.log(`Using fallback board: ${result?.id}`)
    }
    
    return result
  })()

  // Load data from localStorage on mount
  useEffect(() => {
    console.log('🚀 localStorage loading useEffect triggered')
    const saved = localStorage.getItem("kanban-notes")
    if (saved) {
      try {
        const data = JSON.parse(saved)
        const loadedBoards = ensureBoardOrder(data.boards || defaultBoards)
        const loadedBoardId = data.currentBoardId || "personal"
        const loadedBoard = loadedBoards.find((board: Board) => board.id === loadedBoardId) || loadedBoards[0]
        
        console.log('📦 Loading from localStorage:', {
          boardCount: loadedBoards.length,
          loadedBoardId,
          currentTitle: loadedBoard.title
        })
        setBoards(loadedBoards)
        setCurrentBoardId(loadedBoardId)
        setCurrentBoardTitle(loadedBoard.title)
      } catch (error) {
        console.log('❌ Failed to load from localStorage, using default boards')
        setBoards(ensureBoardOrder(defaultBoards))
      }
    } else {
      console.log('📭 No localStorage data found, using default boards')
      setBoards(ensureBoardOrder(defaultBoards))
    }
    // Always set loading to false after checking localStorage
    setIsLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save to localStorage whenever boards or current board change
  useEffect(() => {
    // Only save if we have boards and we're not in loading state AND not enabling sync
    if (!isLoading && !isEnablingSync && !isEnablingSyncRef.current && boards.length > 0) {
      console.log('Auto-saving to localStorage:', {
        boardCount: boards.length, 
        boardIds: boards.map(b => b.id),
        currentBoardId,
        isEnablingSync,
        isEnablingSyncRef: isEnablingSyncRef.current
      })
      localStorage.setItem("kanban-notes", JSON.stringify({ boards, currentBoardId }))
    } else {
      console.log('Skipping localStorage save:', { 
        isLoading, 
        isEnablingSync, 
        isEnablingSyncRef: isEnablingSyncRef.current,
        boardsLength: boards.length 
      })
    }
  }, [boards, currentBoardId, isLoading, isEnablingSync])

  // Auto-sync to Firebase if connected (debounced to prevent overwhelming Firebase)
  useEffect(() => {
    // Skip auto-sync if this boards update is from real-time sync
    if (isRealTimeSyncUpdateRef.current) {
      console.log('Skipping auto-sync: boards updated from real-time sync')
      isRealTimeSyncUpdateRef.current = false // Reset flag
      return
    }
    
    if (isFirebaseConnected && !isLoading && !isEnablingSync && syncReady && boards.length > 0) {
      // Set pending flag to prevent real-time sync conflicts
      autoSyncPendingRef.current = true
      console.log('Auto-sync pending - blocking real-time sync updates')
      
      // Debounce auto-sync to prevent too many writes
      const syncTimeout = setTimeout(async () => {
        console.log('Auto-syncing boards to Firebase...')
        try {
          const syncCompleted = await firebaseSync.saveBoards(boards)
          
          if (syncCompleted) {
            console.log('Auto-sync completed successfully')
            // Clear pending flag only when sync actually happened
            autoSyncPendingRef.current = false
            console.log('Auto-sync pending flag cleared - real-time sync re-enabled')
          } else {
            console.log('Auto-sync was rate limited - keeping pending flag, will retry on next change')
            // Keep pending flag set so sync will be retried on next change
            // But add a safety timeout to prevent permanent blocking
            const timeoutDuration = initialSyncCompleteRef.current ? 10000 : 3000 // Shorter timeout during initial setup
            setTimeout(() => {
              if (autoSyncPendingRef.current) {
                console.log('Auto-sync timeout: Force clearing pending flag to prevent permanent blocking')
                autoSyncPendingRef.current = false
              }
            }, timeoutDuration)
            // autoSyncPendingRef.current stays true for now
          }
        } catch (error) {
          console.error('Auto-sync failed:', error)
          // Clear pending flag even on error to prevent permanent blocking
          autoSyncPendingRef.current = false
          console.log('Auto-sync failed - pending flag cleared to allow retries')
        }
      }, 1000) // Wait 1 second after last change before syncing

      return () => {
        clearTimeout(syncTimeout)
        // Clear pending flag if effect is cleaned up before timeout
        autoSyncPendingRef.current = false
      }
    }
  }, [boards, isFirebaseConnected, isLoading, isEnablingSync, syncReady])

  // Sync currentBoardId to Firebase separately (to avoid conflicts between clients)
  useEffect(() => {
    if (isFirebaseConnected && !isLoading && !isEnablingSync && syncReady) {
      // Debounce currentBoardId sync
      const syncTimeout = setTimeout(() => {
        console.log(`Syncing current board ID '${currentBoardId}' to Firebase...`)
        firebaseSync.saveCurrentBoardId(currentBoardId).catch(error => {
          console.error('Current board ID sync failed:', error)
        })
      }, 500) // Shorter delay for board switching

      return () => clearTimeout(syncTimeout)
    }
  }, [currentBoardId, isFirebaseConnected, isLoading, isEnablingSync, syncReady])

  // Update board title value when current board title changes
  useEffect(() => {
    setBoardTitleValue(currentBoardTitle)
  }, [currentBoardTitle])

  // Update document title when current board title changes
  useEffect(() => {
    // Strip markdown formatting and special characters from title for browser tab
    const stripMarkdown = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **text**
        .replace(/\*(.*?)\*/g, '$1')     // Remove italic *text*
        .replace(/`(.*?)`/g, '$1')       // Remove inline code `text`
        .replace(/#{1,6}\s?/g, '')       // Remove headers # text
        .replace(/[^\w\s]/g, '')         // Remove all special characters except letters, numbers, and spaces
        .replace(/\s+/g, ' ')            // Replace multiple spaces with single space
        .trim()
    }
    
    const cleanTitle = stripMarkdown(currentBoardTitle)
    document.title = `zeroboard - ${cleanTitle}`
  }, [currentBoardTitle])

  // Firebase sync initialization - optional cloud sync
  useEffect(() => {
    if (!firebaseSync.isAvailable()) {
      console.log('Firebase not available - sync disabled')
      return
    }

    // Set up auth state listener
    firebaseSync.onAuthChange(async (user) => {
      console.log('Firebase auth state changed:', { 
        hasUser: !!user, 
        uid: user?.uid, 
        isEnablingSync: isEnablingSyncRef.current 
      })
      
      // Update both state and refs for sync listener access
      setSyncUser(user)
      syncUserRef.current = user
      
      setIsFirebaseConnected(!!user)
      isFirebaseConnectedRef.current = !!user
      
      setIsSyncing(false)
      
      if (user && !isEnablingSyncRef.current) {
        // User is authenticated - auto-enable sync if they have cloud data
        try {
          console.log('Checking if user has existing cloud data...')
          const existingBoards = await firebaseSync.loadBoards()
          
          if (existingBoards.length > 0) {
            console.log(`Found ${existingBoards.length} existing boards - auto-enabling sync`)
            setSyncReady(true)
            syncReadyRef.current = true
            console.log('Auto-sync enabled for returning user')
          } else {
            console.log('No existing cloud data found - sync remains disabled')
          }
        } catch (error) {
          console.error('Failed to check for existing cloud data:', error)
        }
      } else if (!user && !isEnablingSyncRef.current) {
        // Only reset syncReady when user signs out AND we're not enabling sync
        // This prevents race conditions during the sign-in process
        setSyncReady(false)
        syncReadyRef.current = false
        console.log('User signed out, sync is no longer ready')
      }
    })

    // Set up boards sync listener - only for real-time updates, not initial setup
    firebaseSync.onBoardsChange((syncedBoards) => {
      // Use refs to get current state values (avoid closure issues)
      const currentSyncReady = syncReadyRef.current
      const currentIsEnablingSync = isEnablingSyncRef.current
      const currentIsFirebaseConnected = isFirebaseConnectedRef.current
      const currentSyncUser = syncUserRef.current
      const currentAutoSyncPending = autoSyncPendingRef.current
      
      console.log('Firebase sync listener triggered:', {
        syncedBoardsLength: syncedBoards.length,
        syncReady: currentSyncReady,
        isEnablingSync: currentIsEnablingSync,
        isFirebaseConnected: currentIsFirebaseConnected,
        hasUser: !!currentSyncUser,
        autoSyncPending: currentAutoSyncPending
      })
      
      // Only update from Firebase for real-time sync (after initial setup is complete)
      // Skip if auto-sync is pending to prevent overwriting local changes
      if (currentSyncReady && !currentIsEnablingSync && !currentAutoSyncPending && syncedBoards.length > 0) {
        console.log('Real-time sync: Updating boards from Firebase:', syncedBoards.map(b => b.id))
        
        // Use Firebase URLs directly for web (no CORS issues)
        console.log('Real-time sync: Using Firebase URLs directly for images')
        
        // Set flag to indicate this is a real-time sync update (not user change)
        isRealTimeSyncUpdateRef.current = true
        
        // Update current board if it exists in synced data
        const currentBoardIdAtTime = currentBoardId // Capture current value
        const syncedCurrentBoard = syncedBoards.find(b => b.id === currentBoardIdAtTime)
        
        // Use flushSync to ensure synchronized state updates for real-time sync too
        flushSync(() => {
          setBoards(ensureBoardOrder(syncedBoards))
          
          if (syncedCurrentBoard) {
            setCurrentBoardTitle(syncedCurrentBoard.title)
          } else if (syncedBoards.length > 0) {
            // Current board doesn't exist in sync, switch to first synced board
            console.log('Current board not found in sync, switching to first board')
            setCurrentBoardId(syncedBoards[0].id)
            setCurrentBoardTitle(syncedBoards[0].title)
          }
        })
        
        if (syncedCurrentBoard) {
          console.log('Current board found in sync, keeping it')
        }
      } else {
        const reason = !currentSyncReady ? 'sync not ready' 
                     : currentIsEnablingSync ? 'enabling sync'
                     : currentAutoSyncPending ? 'auto-sync pending' 
                     : 'no data'
        
        console.log('Ignoring Firebase sync update:', {
          reason,
          syncReady: currentSyncReady,
          isEnablingSync: currentIsEnablingSync,
          autoSyncPending: currentAutoSyncPending,
          syncedBoardsLength: syncedBoards.length
        })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track currentBoardId changes for debugging
  useEffect(() => {
    console.log(`📍 currentBoardId changed to: ${currentBoardId}`)
    console.trace('currentBoardId change stack trace:')
  }, [currentBoardId])

  // Detect and fix React state vs localStorage mismatches
  useEffect(() => {
    if (!isLoading && !isEnablingSync) {
      const saved = localStorage.getItem("kanban-notes")
      if (saved) {
        try {
          const data = JSON.parse(saved)
          const savedCurrentBoardId = data.currentBoardId
          
          if (savedCurrentBoardId && savedCurrentBoardId !== currentBoardId) {
            console.log(`🔧 MISMATCH DETECTED! React state: ${currentBoardId}, localStorage: ${savedCurrentBoardId}`)
            console.log('🔧 Fixing by reloading from localStorage...')
            
            // Fix the mismatch by updating React state to match localStorage
            setCurrentBoardId(savedCurrentBoardId)
            
            // Also update boards and title if needed
            if (data.boards) {
              const savedBoard = data.boards.find((b: Board) => b.id === savedCurrentBoardId)
              if (savedBoard) {
                setCurrentBoardTitle(savedBoard.title)
              }
            }
          }
        } catch (error) {
          console.log('🔧 Error checking localStorage mismatch:', error)
        }
      }
    }
  }, [currentBoardId, isLoading, isEnablingSync, setCurrentBoardId])

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 459)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Hide mobile title buttons when clicking outside
  useEffect(() => {
    if (isMobile && showMobileTitleButtons) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        if (!target.closest('.mobile-title-bar')) {
          setShowMobileTitleButtons(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isMobile, showMobileTitleButtons])

  // Add click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setBoardDeleteConfirming(null) // Reset any delete confirmation when closing dropdown
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleBoardTitleSave = () => {
    if (boardTitleValue.trim()) {
      const newTitle = boardTitleValue.trim()
      setBoards(
        boards.map((board) => (board.id === currentBoardId ? { ...board, title: newTitle } : board)),
      )
      setCurrentBoardTitle(newTitle) // Update the dedicated title state
    } else {
      setBoardTitleValue(currentBoardTitle) // Reset if empty
    }
    setIsEditingBoardTitle(false)
  }

  const handleBoardTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBoardTitleSave()
    } else if (e.key === "Escape") {
      setBoardTitleValue(currentBoardTitle)
      setIsEditingBoardTitle(false)
    }
  }

  const addBoard = () => {
    const timestamp = Date.now()
    const newBoard: Board = {
      id: `board-${timestamp}`,
      title: `New Board ${boards.length + 1}`,
      order: boards.length,
      columns: [
        {
          id: `column-${timestamp}-1`,
          title: "To Do",
          color: "bg-gray-100",
          cards: [],
        },
        {
          id: `column-${timestamp}-2`,
          title: "In Progress",
          color: "bg-gray-100",
          cards: [],
        },
        {
          id: `column-${timestamp}-3`,
          title: "Done",
          color: "bg-gray-100",
          cards: [],
        },
      ],
    }

    setBoards([...boards, newBoard])
    setCurrentBoardId(newBoard.id)
    setCurrentBoardTitle(newBoard.title)
    setIsDropdownOpen(false)
  }

  const exportBoards = async () => {
    try {
      // Get all stored images from IndexedDB
      const storedImages = await imageService.getAllImages()

      // Find all image references in board content to only export used images
      const usedImageIds = new Set<string>()
      boards.forEach(board => {
        board.columns.forEach(column => {
          column.cards.forEach(card => {
            // Find local image references in card content
            const localImageMatches = card.content.match(/local:([a-zA-Z0-9_]+)/g)
            if (localImageMatches) {
              localImageMatches.forEach(match => {
                const imageId = match.replace('local:', '')
                usedImageIds.add(imageId)
              })
            }
          })
        })
      })

      // Only export images that are actually used in the boards
      const exportImages: { [key: string]: any } = {}
      for (const imageId of usedImageIds) {
        const imageData = storedImages.find(img => img.id === imageId)
        if (imageData) {
          // Convert blob to base64 for export
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(imageData.blob)
          })

          exportImages[imageId] = {
            id: imageData.id,
            filename: imageData.filename,
            base64: base64,
            size: imageData.size,
            type: imageData.type,
            uploadedAt: imageData.uploadedAt
          }
        }
      }

      const dataToExport = {
        boards,
        currentBoardId,
        images: exportImages,
        exportDate: new Date().toISOString(),
        version: "3.0", // Increment version to indicate IndexedDB format
      }

      const dataStr = JSON.stringify(dataToExport, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })

      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `zeroboard-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      const imageCount = Object.keys(exportImages).length
      alert(`Export successful! Included ${boards.length} boards and ${imageCount} images.`)
      setIsDropdownOpen(false)
    } catch (error) {
      alert("Failed to export boards. Please try again.")
    }
  }

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)

        // Validate the imported data structure
        if (importedData.boards && Array.isArray(importedData.boards)) {
          // Validate that each board has the required structure
          const isValidData = importedData.boards.every(
            (board: any) => board.id && board.title && board.columns && Array.isArray(board.columns),
          )

          if (isValidData) {
            const loadedBoardId = importedData.currentBoardId || importedData.boards[0]?.id || "personal"
            const loadedBoard = importedData.boards.find((board: Board) => board.id === loadedBoardId) || importedData.boards[0]
            
            setBoards(importedData.boards)
            setCurrentBoardId(loadedBoardId)
            setCurrentBoardTitle(loadedBoard.title)
            
            // Handle images if they exist in the import
            let importedImageCount = 0
            if (importedData.images && typeof importedData.images === 'object') {
              try {
                const imageIds = Object.keys(importedData.images)
                
                // Import each image to IndexedDB
                for (const imageId of imageIds) {
                  const imageData = importedData.images[imageId]
                  if (imageData.base64) {
                    try {
                      // Convert base64 back to blob
                      const response = await fetch(imageData.base64)
                      const blob = await response.blob()

                      // Store in IndexedDB
                      await imageService.storeImage(
                        imageData.id,
                        imageData.filename,
                        blob,
                        imageData.type
                      )

                      importedImageCount++
                    } catch (error) {
                      // Continue with other images even if one fails
                    }
                  }
                }

                // Clear image cache after importing so components will re-load images
                if (importedImageCount > 0) {
                  clearImageCache()
                }
              } catch (error) {
                // Continue with board import even if images fail
              }
            }

            setIsDropdownOpen(false)
            
            // Show success message with image count
            const version = importedData.version || "1.0"
            if (importedImageCount > 0) {
              alert(`Import successful! Imported ${importedData.boards.length} boards and ${importedImageCount} images (format v${version}).`)
            } else {
              alert(`Import successful! Imported ${importedData.boards.length} boards (format v${version}).`)
            }
          } else {
            throw new Error("Invalid board data structure")
          }
        } else {
          throw new Error("Invalid file format")
        }
      } catch (error) {
        alert("Failed to import boards. Please check the file format and try again.")
      }
    }

    reader.readAsText(file)
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerImport = () => {
    fileInputRef.current?.click()
    setIsDropdownOpen(false)
  }

  // Firebase sync functions - optional cloud sync
  const enableFirebaseSync = async () => {
    if (!firebaseSync.isAvailable()) {
      alert('Firebase sync is not configured. Please configure Firebase to enable sync.')
      return
    }

    setIsSyncing(true)
    setIsEnablingSync(true)
    isEnablingSyncRef.current = true

    try {
      // Step 1: Critical - Authentication (must succeed)
      const user = await firebaseSync.signInWithGoogle()
      
      if (!user) {
        throw new Error('Authentication failed - no user returned')
      }

      console.log('=== USER AUTHENTICATION DEBUG ===')
      console.log('Authenticated user:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      })
      console.log('=====================================')
      
      // Step 2: Critical - Load existing boards (must succeed)
      const existingBoards = await firebaseSync.loadBoards()
      
      console.log('=== SYNC SETUP DEBUG ===')
      console.log('Existing cloud boards:', existingBoards)
      console.log('Existing cloud board details:', existingBoards.map(b => ({ 
        id: b.id, 
        title: b.title, 
        columnsCount: b.columns?.length || 0 
      })))
      console.log('Current local boards:', boards)
      console.log('Current local board details:', boards.map(b => ({ 
        id: b.id, 
        title: b.title, 
        columnsCount: b.columns?.length || 0 
      })))
      console.log('Are local boards default?', boards === defaultBoards || JSON.stringify(boards) === JSON.stringify(defaultBoards))
      console.log('========================')
      
      if (existingBoards.length === 0) {
        // No cloud data - migrate local boards to Firebase
        console.log('No cloud data found. Migrating local boards and images...', boards)
        
        // Step 3: Non-critical - Image migration (can fail gracefully)
        console.log('Starting initial migration process - disabling auto-sync temporarily')
        autoSyncPendingRef.current = true // Disable auto-sync during migration
        
        let migratedBoards = boards
        try {
          migratedBoards = await firebaseSync.migrateLocalBoards(boards)
          console.log('Image migration completed successfully')
        } catch (error) {
          console.warn('Image migration failed, but continuing with basic board sync:', error)
          // Save boards without image migration
          try {
            const saveCompleted = await firebaseSync.saveBoards(boards)
            if (!saveCompleted) {
              console.warn('Basic board sync was rate limited - boards will sync on next change')
            }
          } catch (saveError) {
            console.warn('Failed to save boards during migration fallback:', saveError)
          }
        }
        
        // Update local state with migrated boards
        setBoards(ensureBoardOrder(migratedBoards))
        
        console.log('Migration completed, verifying...')
        // Verify the migration worked
        try {
          const verifyBoards = await firebaseSync.loadBoards()
          console.log('Verification: Found', verifyBoards.length, 'boards in cloud after migration')
        } catch (error) {
          console.warn('Verification failed but migration likely succeeded:', error)
        }
        
        // Clear auto-sync pending flag after initial migration
        console.log('Initial migration complete - re-enabling auto-sync')
        autoSyncPendingRef.current = false
        
        toast.success('Sync enabled! Your local boards have been backed up to the cloud.')
      } else {
        // Cloud data exists - ask user what to do
        console.log('Found existing cloud data:', existingBoards.length, 'boards')
        console.log('Current local data:', boards.length, 'boards')
        
        // Show modal for user choice
        setSyncModalData({
          cloudBoards: existingBoards.length,
          localBoards: boards.length,
          onConfirm: async (useCloud: boolean) => {
            setShowSyncDataModal(false)
            setSyncModalData(null)
            await handleSyncDataChoice(useCloud, existingBoards)
          }
        })
        setShowSyncDataModal(true)
        return // Exit early, let modal handle the choice
      }
      
      // Step 8: Complete sync setup (for when no cloud data exists)
      setShowSyncSetup(false)
      isEnablingSyncRef.current = false
      setIsEnablingSync(false)
      setIsSyncing(false)
      setSyncReady(true)
      syncReadyRef.current = true
      initialSyncCompleteRef.current = true // Mark initial sync as complete
      console.log('Sync setup complete, real-time sync now enabled')
      
    } catch (error) {
      // Only show popup for critical errors (authentication, loading boards)
      console.error('Critical sync setup failed:', error)
      toast.error('Failed to enable sync. Please try again.')
      isEnablingSyncRef.current = false
      setIsSyncing(false)
      setIsEnablingSync(false)
    }
  }

  const handleSyncDataChoice = async (useCloud: boolean, existingBoards: Board[]) => {
    try {
      if (useCloud) {
        // Use cloud data
        console.log('=== LOADING CLOUD DATA ===')
        console.log('User chose cloud data, loading...', existingBoards)
        console.log('Before setBoards - current boards state:', boards.map(b => b.id))
        console.log('Cloud data being set:', existingBoards.map(b => b.id))
        
        // Step 4: Use Firebase URLs directly (no need to download for web)
        console.log('Using Firebase Storage URLs directly for web display...')
        let boardsWithImages = existingBoards
        
        // Step 5: Load current board ID before setting state (to avoid race conditions)
        let cloudCurrentBoardId = null
        try {
          cloudCurrentBoardId = await firebaseSync.loadCurrentBoardId()
          console.log('Loaded current board ID from Firebase:', cloudCurrentBoardId)
        } catch (error) {
          console.log('Could not load current board ID from Firebase:', error)
        }
        
        // Determine target board ID (declare in broader scope)
        let targetBoardId = "personal" // Default fallback
        
        if (existingBoards.length > 0) {
          // Use the cloud's current board if it exists in the loaded boards, otherwise use first board
          targetBoardId = cloudCurrentBoardId && existingBoards.find(b => b.id === cloudCurrentBoardId)
            ? cloudCurrentBoardId 
            : existingBoards[0].id
          
          const targetBoard = existingBoards.find(b => b.id === targetBoardId) || existingBoards[0]
          
          console.log(`Setting synchronized state: boards + currentBoardId from ${currentBoardId} to ${targetBoardId}`)
          
          // Use flushSync to ensure all state updates are applied synchronously
          // This prevents race conditions where boards update but currentBoardId hasn't been processed yet
          flushSync(() => {
            setBoards(ensureBoardOrder(boardsWithImages))
            _setCurrentBoardId(targetBoardId)
            setCurrentBoardTitle(targetBoard.title)
          })
          
          console.log(`Synchronized state update completed: ${targetBoard.id} - ${targetBoard.title}`)
          
          // Verify the state (should now be consistent)
          console.log('State verification after flushSync:', { 
            currentBoardId: targetBoardId, // Use the target value since state is now flushed
            expectedId: targetBoardId,
            boardsLength: boardsWithImages.length
          })
        } else {
          // Fallback for empty boards (shouldn't happen)
          flushSync(() => {
            setBoards(ensureBoardOrder(boardsWithImages))
          })
        }
        
        // Step 6: Non-critical - Save to localStorage (can fail gracefully)
        // Use the synchronized state values to ensure consistency
        try {
          const saveData = { 
            boards: boardsWithImages, 
            currentBoardId: targetBoardId 
          }
          localStorage.setItem("kanban-notes", JSON.stringify(saveData))
          console.log('💾 Manual save to localStorage after synchronized state update:', saveData)
          
          // Verify what was actually saved
          const verification = localStorage.getItem("kanban-notes")
          console.log('✅ localStorage verification:', JSON.parse(verification || '{}'))
        } catch (error) {
          console.warn('Failed to save to localStorage, but sync still works:', error)
        }
        
        console.log('========================')
        
        toast.success('Sync enabled! Your cloud data has been loaded.')
        
        // Refresh the page to ensure all cloud data renders correctly
        console.log('Refreshing page to ensure proper cloud data rendering...')
        setTimeout(() => {
          window.location.reload()
        }, 1000) // Give the toast time to show before refreshing
      } else {
        // Use local data - overwrite cloud
        console.log('User chose local data, migrating to cloud...', boards)
        
        // Step 7: Non-critical - Image migration (can fail gracefully)
        console.log('Starting migration process - disabling auto-sync temporarily')
        autoSyncPendingRef.current = true // Disable auto-sync during migration
        
        let migratedBoards = boards
        try {
          migratedBoards = await firebaseSync.migrateLocalBoards(boards)
          console.log('Image migration completed successfully')
        } catch (error) {
          console.warn('Image migration failed, but continuing with basic board sync:', error)
          // Save boards without image migration
          try {
            const saveCompleted = await firebaseSync.saveBoards(boards)
            if (!saveCompleted) {
              console.warn('Basic board sync was rate limited - boards will sync on next change')
            }
          } catch (saveError) {
            console.warn('Failed to save boards during migration fallback:', saveError)
          }
        }
        
        // Update local state with migrated boards
        setBoards(ensureBoardOrder(migratedBoards))
        
        // Clear auto-sync pending flag after migration
        console.log('Migration complete - re-enabling auto-sync')
        autoSyncPendingRef.current = false
        
        toast.success('Sync enabled! Your local data has been backed up to the cloud.')
      }
      
      // Step 8: Complete sync setup
      setShowSyncSetup(false)
      isEnablingSyncRef.current = false
      setIsEnablingSync(false)
      setIsSyncing(false)
      setSyncReady(true)
      syncReadyRef.current = true
      initialSyncCompleteRef.current = true // Mark initial sync as complete
      console.log('Sync setup complete, real-time sync now enabled')
      
    } catch (error) {
      console.error('Error in handleSyncDataChoice:', error)
      toast.error('Sync setup failed. Please try again.')
      isEnablingSyncRef.current = false
      setIsSyncing(false)
      setIsEnablingSync(false)
    }
  }

  const disableFirebaseSync = async () => {
    try {
      await firebaseSync.signOutUser()
      setSyncReady(false)
      syncReadyRef.current = false
      initialSyncCompleteRef.current = false // Reset initial sync flag
      setShowSyncSetup(false)
      toast.success('Sync disabled. Your boards remain stored locally.')
    } catch (error) {
      console.error('Failed to disable sync:', error)
    }
  }

  const switchBoard = (boardId: string) => {
    const targetBoard = boards.find((board) => board.id === boardId) || boards[0]
    setCurrentBoardId(boardId)
    setCurrentBoardTitle(targetBoard.title)
    setIsDropdownOpen(false)
    setBoardDeleteConfirming(null)
  }

  const handleDeleteBoardClick = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation() // Prevent switching to the board when clicking delete

    if (boardDeleteConfirming === boardId) {
      // Second click - actually delete the board
      if (boards.length > 1) {
        const newBoards = boards.filter((board) => board.id !== boardId)
        setBoards(newBoards)

        // If we're deleting the current board, switch to another one
        if (boardId === currentBoardId) {
          setCurrentBoardId(newBoards[0].id)
          setCurrentBoardTitle(newBoards[0].title)
        }
      } else {
        // Don't allow deleting the last board
        alert("Cannot delete the last board")
      }
      setBoardDeleteConfirming(null)
    } else {
      // First click - enter confirmation mode
      setBoardDeleteConfirming(boardId)
      // Reset confirmation after 3 seconds if not clicked again
      setTimeout(() => {
        setBoardDeleteConfirming(null)
      }, 3000)
    }
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination, type } = result

    // Handle column reordering
    if (type === 'COLUMN') {
      const newColumns = Array.from(currentBoard.columns)
      const [reorderedColumn] = newColumns.splice(source.index, 1)
      newColumns.splice(destination.index, 0, reorderedColumn)

      setBoards(boards.map((board) => 
        board.id === currentBoardId ? { ...board, columns: newColumns } : board
      ))
      return
    }

    // Handle card reordering/moving (existing logic)
    if (source.droppableId === destination.droppableId) {
      // Reordering within the same column
      const column = currentBoard.columns.find((col) => col.id === source.droppableId)
      if (!column) return

      const newCards = Array.from(column.cards)
      const [reorderedCard] = newCards.splice(source.index, 1)
      newCards.splice(destination.index, 0, reorderedCard)

      const newColumns = currentBoard.columns.map((col) =>
        col.id === source.droppableId ? { ...col, cards: newCards } : col,
      )

      setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
    } else {
      // Moving between columns
      const sourceColumn = currentBoard.columns.find((col) => col.id === source.droppableId)
      const destColumn = currentBoard.columns.find((col) => col.id === destination.droppableId)

      if (!sourceColumn || !destColumn) return

      const sourceCards = Array.from(sourceColumn.cards)
      const destCards = Array.from(destColumn.cards)
      const [movedCard] = sourceCards.splice(source.index, 1)
      destCards.splice(destination.index, 0, movedCard)

      const newColumns = currentBoard.columns.map((col) => {
        if (col.id === source.droppableId) {
          return { ...col, cards: sourceCards }
        }
        if (col.id === destination.droppableId) {
          return { ...col, cards: destCards }
        }
        return col
      })

      setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
    }
  }

  const addColumn = () => {
    const newColumn: Column = {
      id: `column-${Date.now()}`,
      title: `Column ${currentBoard.columns.length + 1}`,
      color: "bg-gray-100",
      cards: [],
    }

    const newColumns = [...currentBoard.columns, newColumn]
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const updateColumn = (columnId: string, updates: Partial<Column>) => {
    const newColumns = currentBoard.columns.map((col) => (col.id === columnId ? { ...col, ...updates } : col))
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const deleteColumn = (columnId: string) => {
    const newColumns = currentBoard.columns.filter((col) => col.id !== columnId)
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const addCard = (columnId: string, card: Omit<Card, "id" | "createdAt" | "updatedAt">) => {
    const newCard: Card = {
      ...card,
      id: `card-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const newColumns = currentBoard.columns.map((col) =>
      col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col,
    )
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const moveCard = (columnId: string, cardId: string, direction: 'up' | 'down') => {
    const newColumns = currentBoard.columns.map((col) => {
      if (col.id === columnId) {
        const cardIndex = col.cards.findIndex((card) => card.id === cardId)
        if (cardIndex === -1) return col
        
        const newCards = [...col.cards]
        
        if (direction === 'up' && cardIndex > 0) {
          // Move card up (swap with previous card)
          [newCards[cardIndex], newCards[cardIndex - 1]] = [newCards[cardIndex - 1], newCards[cardIndex]]
        } else if (direction === 'down' && cardIndex < newCards.length - 1) {
          // Move card down (swap with next card)
          [newCards[cardIndex], newCards[cardIndex + 1]] = [newCards[cardIndex + 1], newCards[cardIndex]]
        }
        
        return { ...col, cards: newCards }
      }
      return col
    })
    
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const moveColumn = (columnId: string, direction: 'up' | 'down') => {
    const columnIndex = currentBoard.columns.findIndex((col) => col.id === columnId)
    if (columnIndex === -1) return
    
    const newColumns = [...currentBoard.columns]
    
    if (direction === 'up' && columnIndex > 0) {
      // Move column up (swap with previous column)
      [newColumns[columnIndex], newColumns[columnIndex - 1]] = [newColumns[columnIndex - 1], newColumns[columnIndex]]
    } else if (direction === 'down' && columnIndex < newColumns.length - 1) {
      // Move column down (swap with next column)
      [newColumns[columnIndex], newColumns[columnIndex + 1]] = [newColumns[columnIndex + 1], newColumns[columnIndex]]
    }
    
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const updateCard = (columnId: string, cardId: string, updates: Partial<Card>) => {
    const newColumns = currentBoard.columns.map((col) =>
      col.id === columnId
        ? {
            ...col,
            cards: col.cards.map((card) =>
              card.id === cardId ? { ...card, ...updates, updatedAt: new Date().toISOString() } : card,
            ),
          }
        : col,
    )
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const deleteCard = (columnId: string, cardId: string) => {
    const newColumns = currentBoard.columns.map((col) =>
      col.id === columnId ? { ...col, cards: col.cards.filter((card) => card.id !== cardId) } : col,
    )
    setBoards(boards.map((board) => (board.id === currentBoardId ? { ...board, columns: newColumns } : board)))
  }

  const handleTitleBarClick = (e: React.MouseEvent) => {
    // Only trigger edit if we're not clicking on buttons
    const target = e.target as HTMLElement
    if (target.closest("button") || target.closest('[role="button"]')) {
      return
    }

    // Mobile behavior: first click shows buttons, second click edits
    if (isMobile) {
      if (!showMobileTitleButtons) {
        // First click: show buttons
        setShowMobileTitleButtons(true)
        return
      } else {
        // Second click: hide buttons and start editing
        setShowMobileTitleButtons(false)
        if (!isEditingBoardTitle) {
          setIsEditingBoardTitle(true)
        }
        return
      }
    }

    // Desktop behavior: immediate edit
    if (!isEditingBoardTitle) {
      setIsEditingBoardTitle(true)
    }
  }

  // Calculate the total width of all columns - recalculated on every render
  const columnsWidth = currentBoard.columns.length * 288 + (currentBoard.columns.length - 1) * 8 // 288px per column (w-72) + 8px gap between columns

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Show empty state if no boards available
  if (!boards || boards.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Initializing boards...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 mobile-container">
      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} style={{ display: "none" }} />

      <div className="flex justify-center overflow-x-auto mobile-wrapper">
        <div className="inline-block mobile-wrapper">
          {/* Board Title Bar - Width matches columns */}
          <div
            className="bg-gray-100 p-2 shadow-sm mb-2 flex items-center cursor-pointer mobile-title-bar"
            style={{ 
              width: `${columnsWidth}px`, 
              height: "36px"
            }}
            onMouseEnter={() => !isMobile && !isEditingBoardTitle && setIsTitleBarHovering(true)}
            onMouseLeave={() => {
              if (!isMobile && !isDropdownOpen) {
                setIsTitleBarHovering(false)
              }
              // Don't hide mobile buttons on mouse leave since mouse events can be unreliable on mobile
            }}
            onClick={handleTitleBarClick}
          >
            <div className="flex-1 min-w-0">
              {isEditingBoardTitle ? (
                <Input
                  value={boardTitleValue}
                  onChange={(e) => setBoardTitleValue(e.target.value)}
                  onBlur={handleBoardTitleSave}
                  onKeyDown={handleBoardTitleKeyDown}
                  className="text-xs font-normal h-6 px-1 py-0 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-gray-900 w-full my-1"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h1 className="font-normal hover:bg-gray-200 px-1 rounded text-sm text-zinc-700 h-6 flex items-center my-1" style={{ paddingTop: '4px', paddingBottom: '2px' }}>
                  <TitleMarkdownRenderer content={currentBoardTitle} />
                </h1>
              )}
            </div>

            {(isTitleBarHovering || isDropdownOpen || (isMobile && showMobileTitleButtons)) && !isEditingBoardTitle && (
              <div className="flex items-center gap-1 ml-2 h-8">
                {/* Add Column Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    addColumn()
                  }}
                  className="h-6 w-6 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded flex items-center justify-center"
                >
                  <Plus className="h-3 w-3" />
                </Button>

                {/* Custom Board Selector Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsDropdownOpen(!isDropdownOpen)
                    }}
                    className="h-6 w-6 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200 text-xs rounded flex items-center justify-center"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200">
                      {boards.map((board) => (
                        <div
                          key={board.id}
                          className={`relative flex items-center w-full px-4 py-2 text-xs ${
                            board.id === currentBoardId ? "bg-gray-100" : "hover:bg-gray-50"
                          }`}
                          onMouseEnter={() => setHoveredBoardId(board.id)}
                          onMouseLeave={() => {
                            setHoveredBoardId(null)
                            if (boardDeleteConfirming === board.id) {
                              setBoardDeleteConfirming(null)
                            }
                          }}
                        >
                          <button onClick={() => switchBoard(board.id)} className="text-left flex-1 truncate pr-6">
                            <TitleMarkdownRenderer content={board.title} />
                          </button>
                          {hoveredBoardId === board.id && board.id !== currentBoardId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteBoardClick(e, board.id)}
                              className={`absolute right-2 h-4 w-4 p-0 transition-colors duration-200 ${
                                boardDeleteConfirming === board.id
                                  ? "text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50"
                                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          addBoard()
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Board
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          exportBoards()
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export Boards
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          triggerImport()
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Import Boards
                      </button>
                      
                      {/* Firebase Sync Options */}
                      {firebaseSync.isAvailable() && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (isFirebaseConnected) {
                              disableFirebaseSync()
                            } else {
                              enableFirebaseSync()
                            }
                          }}
                          disabled={isSyncing}
                          className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center disabled:opacity-50"
                        >
                          {isSyncing ? (
                            <div className="h-3 w-3 mr-1 animate-spin border border-gray-400 border-t-transparent rounded-full" />
                          ) : isFirebaseConnected ? (
                            <CloudOff className="h-3 w-3 mr-1" />
                          ) : (
                            <Cloud className="h-3 w-3 mr-1" />
                          )}
                          {isSyncing ? 'Syncing...' : isFirebaseConnected ? 'Disable Sync' : 'Enable Sync'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {isMobile ? (
            // Mobile: No drag and drop - use up/down buttons instead
            <div className="flex gap-2 pb-4 min-w-fit mobile-columns-container">
              {currentBoard.columns.map((column, index) => (
                <div key={column.id} className="flex-shrink-0 w-72 min-w-[18rem] mobile-column">
                  <KanbanColumn
                    column={column}
                    onUpdateColumn={updateColumn}
                    onDeleteColumn={deleteColumn}
                    onAddCard={addCard}
                    onUpdateCard={updateCard}
                    onDeleteCard={deleteCard}
                    onMoveCardUp={(columnId, cardId) => moveCard(columnId, cardId, 'up')}
                    onMoveCardDown={(columnId, cardId) => moveCard(columnId, cardId, 'down')}
                    onMoveColumnUp={index > 0 ? () => moveColumn(column.id, 'up') : undefined}
                    onMoveColumnDown={index < currentBoard.columns.length - 1 ? () => moveColumn(column.id, 'down') : undefined}
                    canMoveUp={index > 0}
                    canMoveDown={index < currentBoard.columns.length - 1}
                    dragHandleProps={null}
                    isMobile={isMobile}
                  />
                </div>
              ))}
            </div>
          ) : (
            // Desktop: Full drag and drop functionality
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
                {(provided) => (
                  <div 
                    className="flex gap-2 pb-4 min-w-fit mobile-columns-container"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {currentBoard.columns.map((column, index) => (
                      <Draggable key={column.id} draggableId={column.id} index={index}>
                        {(provided, snapshot) => (
                          <div 
                            key={column.id} 
                            className={`flex-shrink-0 w-72 min-w-[18rem] mobile-column ${snapshot.isDragging ? 'opacity-70 rotate-2' : ''}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <KanbanColumn
                              column={column}
                              onUpdateColumn={updateColumn}
                              onDeleteColumn={deleteColumn}
                              onAddCard={addCard}
                              onUpdateCard={updateCard}
                              onDeleteCard={deleteCard}
                              dragHandleProps={provided.dragHandleProps}
                              isMobile={isMobile}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Sync Data Selection Modal */}
      <Dialog open={showSyncDataModal} onOpenChange={setShowSyncDataModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cloud Data Found</DialogTitle>
            <DialogDescription>
              We found existing data in the cloud. Choose which data to keep:
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {syncModalData?.cloudBoards || 0}
                </div>
                <div className="text-sm text-gray-600">Cloud Boards</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {syncModalData?.localBoards || 0}
                </div>
                <div className="text-sm text-gray-600">Local Boards</div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => syncModalData?.onConfirm(false)}
            >
              Keep Local Data
              <span className="text-xs text-gray-500 block">(Replace cloud)</span>
            </Button>
            <Button
              onClick={() => syncModalData?.onConfirm(true)}
            >
              Use Cloud Data
              <span className="text-xs text-gray-500 block">(Replace local)</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
