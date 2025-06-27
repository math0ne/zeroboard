// Default boards data for ZeroBoard
// This file contains the sample/demo boards that are loaded when the app starts

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

export const defaultBoards: Board[] = [
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
- **May**: Transplant warm season crops
- **June**: Succession plant lettuce

*Excited for the growing season!*`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "home-card-6",
            title: "Deck Staining",
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
            title: "Kitchen Renovation Plans",
            content: `Project Overview:
Planning a complete kitchen makeover for better functionality and modern aesthetics.

### Budget Breakdown
- **Cabinets**: $8,000 - $12,000
- **Countertops**: $2,500 - $4,000
- **Appliances**: $6,000 - $8,000
- **Flooring**: $1,500 - $2,500
- **Labor**: $5,000 - $7,000

## Design Ideas
- [ ] Quartz countertops
- [ ] Soft-close cabinet doors
- [ ] Subway tile backsplash
- [ ] Stainless steel appliances
- [ ] Under-cabinet LED lighting

**Target completion**: Fall 2024`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "home-card-7",
            title: "Replace Front Door",
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
            content: `Weekly Deep Clean Progress:

## Completed Tasks
- [x] Scrub shower and tub
- [x] Clean mirrors and fixtures
- [x] Mop floors with disinfectant
- [x] Replace toilet paper and towels

## Still To Do
- [ ] Organize medicine cabinet
- [ ] Clean exhaust fan
- [ ] Touch up grout
- [ ] Replace bath mat

**Time spent**: 2.5 hours so far
*Looking much better already!*`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "home-card-8",
            title: "Garage Organization",
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
            title: "Paint Guest Room",
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
            title: "Monthly Home Checklist",
            content: `Routine Maintenance - June 2024:

### HVAC System
- [x] Replace air filter
- [x] Check thermostat settings
- [ ] Clean air ducts (quarterly)

### Plumbing
- [x] Check for leaks under sinks
- [x] Test garbage disposal
- [ ] Flush water heater (annual)

### Electrical
- [x] Test GFCI outlets
- [x] Check smoke detector batteries
- [ ] Inspect outdoor outlets

### Exterior
- [ ] Clean gutters
- [ ] Inspect roof for damage
- [ ] Trim bushes away from house

**Next review**: July 15`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "home-card-10",
            title: "Seasonal Gutter Cleaning",
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
            title: "Annual Furnace Service",
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
            title: "Backyard Landscaping",
            content: `Project Completion Summary ✅

Successfully transformed the backyard into a beautiful outdoor living space.

### What Was Accomplished
- **New Patio**: 12x16 feet flagstone patio
- **Garden Beds**: Three raised beds with vegetables
- **Lighting**: Solar pathway lights and string lights
- **Seating**: Weather-resistant outdoor furniture
- **Water Feature**: Small fountain near seating area

### Project Stats
- **Duration**: 6 weeks
- **Total Cost**: $3,200
- **DIY vs Professional**: 70% DIY, 30% professional help

### Lessons Learned
- Plan irrigation before planting
- Invest in quality soil amendments
- String lights make a huge difference for ambiance

**Final Result**: Absolutely love spending time outside now!`,
            color: "white",
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collapsed: false,
            plain: false,
          },
          {
            id: "home-card-12",
            title: "Install New Ceiling Fans",
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
            title: "Basement Waterproofing",
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