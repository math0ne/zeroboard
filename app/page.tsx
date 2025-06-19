"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { DragDropContext } from "@hello-pangea/dnd"
import { Plus, ChevronDown, X, Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KanbanColumn } from "@/components/kanban-column"
import { TitleMarkdownRenderer } from "@/components/title-markdown-renderer"
import { imageService } from "@/lib/indexeddb-image-service"
import { clearImageCache } from "@/lib/image-utils"

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
}

const defaultBoards: Board[] = [
  {
    id: "personal",
    title: "**Personal** *Kanban* Notes",
    columns: [
      {
        id: "life",
        title: "**Life** *Tasks*",
        color: "bg-gray-100",
        cards: [
          {
            id: "card-1",
            title: "Welcome to Your Kanban Notes",
            content: `Welcome to your personal Kanban note-taking app! Here are some features:

**Markdown Support**
- **Bold text** and *italic text*
- \`inline code\` and code blocks
- Lists and checkboxes
- Markdown in titles: **bold** and *italic* text in board and column titles

**Task Lists**
- [x] Drag and drop cards between columns
- [x] Edit cards with markdown
- [x] Click on title to edit it
- [x] Click on content to edit it inline
- [x] Delete cards while editing
- [x] Toggle plain mode with the dash icon
- [x] Icons only appear on hover
- [ ] Click checkboxes to toggle them

Try hovering over this card's title to see the icons!`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
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

export default function KanbanBoard() {
  const [isLoading, setIsLoading] = useState(true)
  const [boards, setBoards] = useState<Board[]>(defaultBoards)
  const [currentBoardId, setCurrentBoardId] = useState("personal")
  const [currentBoardTitle, setCurrentBoardTitle] = useState("**Personal** *Kanban* Notes")
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false)
  const [boardTitleValue, setBoardTitleValue] = useState("")
  const [isTitleBarHovering, setIsTitleBarHovering] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [boardDeleteConfirming, setBoardDeleteConfirming] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [hoveredBoardId, setHoveredBoardId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentBoard = boards.find((board) => board.id === currentBoardId) || boards[0]

  // Load data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("kanban-notes")
    if (saved) {
      try {
        const data = JSON.parse(saved)
        const loadedBoards = data.boards || defaultBoards
        const loadedBoardId = data.currentBoardId || "personal"
        const loadedBoard = loadedBoards.find((board: Board) => board.id === loadedBoardId) || loadedBoards[0]
        
        setBoards(loadedBoards)
        setCurrentBoardId(loadedBoardId)
        setCurrentBoardTitle(loadedBoard.title)
      } catch (error) {
        console.error("Failed to load saved data:", error)
      }
    }
    // Always set loading to false after checking localStorage
    setIsLoading(false)
  }, [])

  // Save to localStorage whenever boards or current board change
  useEffect(() => {
    localStorage.setItem("kanban-notes", JSON.stringify({ boards, currentBoardId }))
  }, [boards, currentBoardId])


  // Update board title value when current board title changes
  useEffect(() => {
    console.log('currentBoardTitle changed to:', currentBoardTitle)
    setBoardTitleValue(currentBoardTitle)
  }, [currentBoardTitle])

  // Update document title when current board title changes
  useEffect(() => {
    // Strip markdown formatting from title for browser tab
    const stripMarkdown = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **text**
        .replace(/\*(.*?)\*/g, '$1')     // Remove italic *text*
        .replace(/`(.*?)`/g, '$1')       // Remove inline code `text`
        .replace(/#{1,6}\s?/g, '')       // Remove headers # text
        .trim()
    }
    
    const cleanTitle = stripMarkdown(currentBoardTitle)
    console.log('Setting document title to:', `zeroboard - ${cleanTitle}`, 'from currentBoardTitle:', currentBoardTitle)
    document.title = `zeroboard - ${cleanTitle}`
  }, [currentBoardTitle])

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
      console.error("Failed to export boards:", error)
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
                      console.warn(`Failed to import image ${imageId}:`, error)
                      // Continue with other images even if one fails
                    }
                  }
                }

                // Clear image cache after importing so components will re-load images
                if (importedImageCount > 0) {
                  clearImageCache()
                }
              } catch (error) {
                console.error("Error importing images:", error)
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
        console.error("Failed to import boards:", error)
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

    const { source, destination } = result

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

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} style={{ display: "none" }} />

      <div className="flex justify-center overflow-x-auto">
        <div className="inline-block">
          {/* Board Title Bar - Width matches columns */}
          <div
            className="bg-gray-100 p-2 rounded mb-2 flex items-center cursor-pointer"
            style={{ width: `${columnsWidth}px`, height: "36px" }}
            onMouseEnter={() => !isEditingBoardTitle && setIsTitleBarHovering(true)}
            onMouseLeave={() => !isDropdownOpen && setIsTitleBarHovering(false)}
            onClick={handleTitleBarClick}
          >
            <div className="flex-1 min-w-0">
              {isEditingBoardTitle ? (
                <Input
                  value={boardTitleValue}
                  onChange={(e) => setBoardTitleValue(e.target.value)}
                  onBlur={handleBoardTitleSave}
                  onKeyDown={handleBoardTitleKeyDown}
                  className="text-xs font-normal h-5 px-1 py-0 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-gray-900 w-full"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h1 className="font-normal hover:bg-gray-200 px-1 py-0.5 rounded text-sm text-zinc-700">
                  <TitleMarkdownRenderer content={currentBoardTitle} />
                </h1>
              )}
            </div>

            {(isTitleBarHovering || isDropdownOpen) && !isEditingBoardTitle && (
              <div className="flex items-center gap-1 ml-2">
                {/* Add Column Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    addColumn()
                  }}
                  className="h-6 w-6 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
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
                    className="h-6 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 text-xs"
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
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-2 pb-4 min-w-fit">
              {currentBoard.columns.map((column) => (
                <div key={column.id} className="flex-shrink-0 w-72 min-w-[18rem]">
                  <KanbanColumn
                    column={column}
                    onUpdateColumn={updateColumn}
                    onDeleteColumn={deleteColumn}
                    onAddCard={addCard}
                    onUpdateCard={updateCard}
                    onDeleteCard={deleteCard}
                  />
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      </div>
    </div>
  )
}
