# Development Roadmap

**Last Updated**: 2025-01-24
**Status**: Current
**Owner**: Product + Engineering

## Overview

This document outlines the feature development roadmap for Lexly, from MVP through launch and growth phases.

## Current Implementation Status

### Completed ✅

**Infrastructure**:
- [x] Monorepo setup with pnpm + Turborepo
- [x] TanStack Start app with file-based routing
- [x] Convex backend integration
- [x] Better Auth + Convex integration
- [x] shadcn/ui component library setup
- [x] TanStack Form integration
- [x] Tailwind CSS v4 configuration

**Authentication**:
- [x] Email/password authentication
- [x] Login/signup UI components
- [x] Protected routes
- [x] Auth state management via router context
- [x] Session handling

**Developer Experience**:
- [x] TypeScript configuration
- [x] ESLint + Prettier setup
- [x] Git hooks (Husky + lint-staged)
- [x] Environment variable validation

### In Progress 🚧

**Editor Foundation**:
- [ ] Tiptap editor basic configuration (70% complete)
- [ ] Editor UI chrome (toolbar, status bar)
- [ ] Keyboard shortcuts setup

## Feature Roadmap

### Phase 1: MVP (Months 1-3)

**Goal**: Functional 1-on-1 collaborative lesson platform with core exercise types

#### Milestone 1.1: Editor Foundation (Weeks 1-2)

**Tasks**:
- [ ] Complete Tiptap editor configuration
- [ ] Implement text block with rich formatting (bold, italic, highlights)
- [ ] Add slash commands for block insertion
- [ ] Create block drag-and-drop reordering
- [ ] Build inline toolbar
- [ ] Design block UI components (shadcn-based)

**Deliverables**:
- Working rich text editor
- Block insertion via slash commands
- Basic formatting toolbar

#### Milestone 1.2: Real-Time Collaboration (Weeks 3-5)

**Tasks**:
- [ ] Set up Y.js + Hocuspocus prototype
  - [ ] Create Hocuspocus server with authentication hooks
  - [ ] Implement JWT token minting endpoint in Convex
  - [ ] Deploy Hocuspocus to Fly.io for testing
- [ ] Integrate Y.js with Tiptap (y-prosemirror binding)
- [ ] Test multi-document strategy (content/answers separation)
- [ ] Implement permission enforcement (room-scoped JWTs)
- [ ] Add custom cursor rendering with Awareness
  - [ ] Avatar chips with user names/colors
  - [ ] Off-viewport indicators
- [ ] Build connection status indicator

**Deliverables**:
- Two users can edit same lesson simultaneously
- Teacher sees student cursor and vice versa
- Offline editing with sync on reconnect

#### Milestone 1.3: Lesson Management (Weeks 5-7)

**Tasks**:
- [ ] Create Convex schema for lessons, users, exercises
- [ ] Build lesson CRUD endpoints
- [ ] Create teacher dashboard UI
  - [ ] Lesson list
  - [ ] Student list
  - [ ] Create new lesson flow
- [ ] Create student workspace UI
  - [ ] Enrolled lessons list
  - [ ] Join lesson flow
- [ ] Implement lesson sharing (invite links)
- [ ] Add teacher/student role management

**Deliverables**:
- Teachers can create/edit/delete lessons
- Students can join lessons via invite link
- Role-based permissions enforced

#### Milestone 1.4: Core Exercise Blocks (Weeks 7-10)

**Tasks**:
- [ ] Implement cloze (fill-in-the-blank) exercise node
  - [ ] ProseMirror node definition
  - [ ] React NodeView component
  - [ ] Answer validation logic
- [ ] Implement translation exercise node
  - [ ] Multiple correct answers support
  - [ ] Hints system
- [ ] Implement multiple choice exercise node
  - [ ] Single/multi-select support
  - [ ] Shuffle options (optional)
- [ ] Implement vocabulary table node
  - [ ] Add/remove rows
  - [ ] Word + translation + example sentence

**Deliverables**:
- 4 core exercise types functional
- Exercises render correctly in lesson
- Basic answer validation

#### Milestone 1.5: Homework System (Weeks 10-12)

**Tasks**:
- [ ] Implement homework tagging functionality
  - [ ] Mark blocks as homework (toggle)
  - [ ] Set due dates
- [ ] Build student homework view
  - [ ] Homework list sidebar
  - [ ] Navigate to assigned blocks
  - [ ] Mark as done
- [ ] Build teacher homework tracking
  - [ ] See student completion status
  - [ ] Review submitted work
- [ ] Set up Y.js persistence layer (Convex integration)
  - [ ] Store updates in Convex
  - [ ] Periodic snapshots
  - [ ] Load documents on reconnect

**Deliverables**:
- Teachers can assign homework
- Students see homework list
- Completion tracking functional
- Data persists across sessions

#### Milestone 1.6: MVP Polish & Testing (Week 12)

**Tasks**:
- [ ] End-to-end testing with real teacher-student pairs
- [ ] Bug fixes and UX improvements
- [ ] Performance optimization (editor latency, sync speed)
- [ ] Error handling and retry logic
- [ ] Offline mode polish

**Deliverables**:
- Stable, usable MVP
- Feedback collected from pilot users
- Critical bugs resolved

**Success Criteria for Phase 1**:
- [ ] 3 pilot teacher-student pairs using product weekly
- [ ] <100ms editor latency (p95)
- [ ] <200ms collaboration sync (p95)
- [ ] Zero data loss incidents
- [ ] Positive feedback from pilots (would recommend to colleague)

---

### Phase 2: AI & Exercise Bank (Months 3-4)

**Goal**: Streamline teacher workflows with AI and reusable content

#### Milestone 2.1: Exercise Bank (Weeks 13-14)

**Tasks**:
- [ ] Create exercise bank schema in Convex
- [ ] Build "Save to bank" flow from lesson
- [ ] Build exercise bank UI
  - [ ] Grid view with previews
  - [ ] Filter by category, level, tags
  - [ ] Search functionality
- [ ] Implement exercise insertion from bank
- [ ] Add exercise versioning (semantic versions)

**Deliverables**:
- Teachers can save exercises to bank
- Teachers can insert exercises from bank
- Exercises versioned and tracked

#### Milestone 2.2: AI Import (Weeks 15-17)

**Tasks**:
- [ ] Set up Vercel AI SDK integration
- [ ] Build AI import endpoint
  - [ ] Detect exercise types
  - [ ] Extract questions/answers
  - [ ] Generate ProseMirror JSON
- [ ] Create AI import UI
  - [ ] Paste text modal
  - [ ] Preview generated blocks
  - [ ] Edit before inserting
- [ ] Add OCR support for images (optional)
- [ ] Implement validation layer (check against schema)

**Deliverables**:
- Teachers can paste messy text, get structured blocks
- AI correctly identifies exercise types (>80% accuracy)
- Validation prevents malformed blocks

#### Milestone 2.3: Exercise Generation (Week 18)

**Tasks**:
- [ ] Build vocabulary list → exercises generator
- [ ] Add exercise variation generator (same vocab, different format)
- [ ] Create batch generation UI

**Deliverables**:
- Generate multiple exercises from vocabulary list
- Mix of cloze, translation, multiple choice

**Success Criteria for Phase 2**:
- [ ] Teachers save avg 5+ exercises to bank per week
- [ ] AI import success rate >80% (minimal manual fixes needed)
- [ ] Teachers report time savings (survey: "saves >30min/week")

---

### Phase 3: Polish & Launch (Months 4-5)

**Goal**: Production-ready product with marketing presence

#### Milestone 3.1: Payments (Weeks 19-20)

**Tasks**:
- [ ] Integrate Stripe or Paddle
- [ ] Build subscription management UI
  - [ ] Select plan
  - [ ] Payment form
  - [ ] Manage subscription
- [ ] Implement tier limits (student count, AI usage)
- [ ] Add billing webhooks (subscription events)
- [ ] Create invoicing system

**Deliverables**:
- Teachers can subscribe to paid tiers
- Limits enforced based on tier
- Invoices sent automatically

#### Milestone 3.2: Onboarding (Week 21)

**Tasks**:
- [ ] Build onboarding flow
  - [ ] Welcome tour (highlight key features)
  - [ ] First lesson creation wizard
  - [ ] Invite first student flow
- [ ] Add tooltips and help text
- [ ] Create video walkthrough
- [ ] Build interactive demo (no signup required)

**Deliverables**:
- New users can create first lesson in <5 minutes
- Clear guidance throughout

#### Milestone 3.3: Marketing Site (Weeks 22-23)

**Tasks**:
- [ ] Build landing page (Astro in `apps/www`)
  - [ ] Hero with demo video
  - [ ] Feature highlights
  - [ ] Pricing table
  - [ ] Teacher testimonials
  - [ ] CTA (start free trial)
- [ ] Create blog infrastructure (optional)
- [ ] Add SEO optimization
  - [ ] Meta tags
  - [ ] Schema.org markup
  - [ ] Sitemap
- [ ] Set up analytics (PostHog)

**Deliverables**:
- Professional marketing site
- Clear value proposition
- SEO optimized

#### Milestone 3.4: Analytics & Monitoring (Week 24)

**Tasks**:
- [ ] Integrate PostHog
  - [ ] Track key events (signup, lesson created, homework assigned)
  - [ ] Set up funnels (signup → activation)
  - [ ] Enable session replay
- [ ] Set up error tracking (Sentry)
- [ ] Create admin dashboard
  - [ ] User stats
  - [ ] Feature usage
  - [ ] Revenue metrics
- [ ] Set up monitoring for Hocuspocus
  - [ ] Connection count
  - [ ] Latency metrics
  - [ ] Error rates

**Deliverables**:
- Product analytics operational
- Key metrics tracked
- Alerts for critical errors

#### Milestone 3.5: Public Beta Launch (Week 25)

**Tasks**:
- [ ] Security audit
- [ ] Performance optimization
- [ ] Final bug fixes
- [ ] Launch announcement
  - [ ] Product Hunt
  - [ ] Teacher communities (Reddit, Facebook)
  - [ ] Email to waitlist
- [ ] Monitor launch metrics

**Deliverables**:
- Public beta live
- 100+ signups in first week (goal)

**Success Criteria for Phase 3**:
- [ ] >100 teacher signups
- [ ] >10% activation rate (create first lesson)
- [ ] >5% free → paid conversion
- [ ] <5% churn in first month
- [ ] NPS score >40

---

### Phase 4: Growth Features (Months 6+)

**Goal**: Scale product and expand capabilities

#### Advanced Collaboration

**Features**:
- [ ] Following mode (teacher/student can follow each other's view)
- [ ] Live chat sidebar
- [ ] Voice/video call integration (third-party)
- [ ] Annotation system (teacher comments on student work)

#### Advanced Exercise Types

**Features**:
- [ ] Drag-and-drop exercises (reorder sentences)
- [ ] Matching exercises (word pairs)
- [ ] Image labeling (point-and-click)
- [ ] Audio playback (pronunciation exercises)
- [ ] Recording (student pronunciation)

#### Progress Tracking

**Features**:
- [ ] Student progress dashboard
- [ ] Exercise performance analytics
- [ ] Mistake categorization (grammar types, etc.)
- [ ] Progress reports (export PDF)

#### Exercise Marketplace

**Features**:
- [ ] Public exercise library
- [ ] Browse community exercises
- [ ] Like/rating system
- [ ] Revenue sharing (premium templates)
- [ ] Quality moderation

#### Platform Expansion

**Features**:
- [ ] Mobile/tablet optimization
- [ ] Pen input support (iPad)
- [ ] Multi-language UI (internationalization)
- [ ] Group lessons (>2 participants)
- [ ] Course structure (lesson sequences)

#### Integrations

**Features**:
- [ ] Preply/iTalki integration (sync students)
- [ ] Calendar integration (Google Calendar)
- [ ] Export to PDF/Word
- [ ] Import from popular textbooks

#### Team/School Features

**Features**:
- [ ] Multi-teacher accounts
- [ ] Shared exercise bank (team library)
- [ ] Student assignment (pool of students)
- [ ] Analytics for school admins
- [ ] Bulk student invites

## Next Steps (Immediate Priorities)

### Next 2 Weeks

1. **Complete Tiptap editor configuration**
   - Finish text block implementation
   - Add keyboard shortcuts
   - Build toolbar UI

2. **Set up Y.js + Hocuspocus prototype**
   - Create basic Hocuspocus server with auth hooks
   - Implement JWT token minting in Convex
   - Test multi-document strategy
   - Deploy to Fly.io for testing

3. **Create basic lesson CRUD**
   - Define Convex schema
   - Build API endpoints
   - Simple UI for lesson creation

4. **Design block UI components**
   - Exercise card wrapper
   - Answer input components
   - Validation indicators

### Next 1-2 Months

1. **Complete core block types**
   - Cloze (fill-in-the-blank)
   - Translation
   - Multiple choice
   - Vocabulary table

2. **Integrate Y.js with Tiptap**
   - y-prosemirror binding
   - Handle merge conflicts

3. **Implement custom cursors**
   - Avatar chips
   - Off-viewport indicators

4. **Build permission enforcement**
   - Room-scoped JWTs
   - Role-based access

5. **Implement homework tagging**
   - Mark blocks as homework
   - Due dates

6. **Build exercise bank foundation**
   - Save/reuse exercises
   - Search and filter

7. **Teacher/student role management**
   - Role assignment
   - Permission checks

8. **Set up Y.js persistence**
   - Store in Convex
   - Snapshot strategy

9. **Pilot with 2-3 real pairs**
   - Collect feedback
   - Fix critical bugs

## Dependencies & Blockers

### Critical Path

```
Tiptap editor → Custom blocks → Homework system → MVP launch
                    ↓
                Y.js integration → Collaboration → Persistence
```

**Blockers**:
- Hocuspocus deployment (need to choose provider and deploy)
- JWT key generation (need for token minting)
- Exercise node design (need to finalize data structure)

### External Dependencies

- Convex (managed service, no blocker)
- Vercel (managed service, no blocker)
- Fly.io/Render (need to set up account)
- Stripe/Paddle (need to register, verify business)

## Decision Log (ADRs)

### ADR-001: Use Y.js instead of Liveblocks
**Date**: 2025-01-24
**Status**: Accepted

**Context**: Need real-time collaboration for editor

**Decision**: Use Y.js + Hocuspocus (self-hosted) instead of Liveblocks (managed SaaS)

**Rationale**:
- Cost savings (€20-30/mo vs €180-400/mo)
- Full control over infrastructure and data
- GDPR compliance easier with EU hosting
- Learning opportunity

**Consequences**:
- Need to maintain Hocuspocus server
- More DevOps overhead
- Can migrate to managed service later if needed

### ADR-002: Convex for structured data, Y.js for collaboration
**Date**: 2025-01-24
**Status**: Accepted

**Context**: Need to store both structured data (users, lessons) and collaborative documents

**Decision**: Use Convex for structured data, Y.js binary format for real-time collaboration data

**Rationale**:
- Convex excellent for queries, real-time subscriptions
- Y.js optimized for CRDT operations, not queryable
- Clear separation of concerns

**Consequences**:
- Two data stores to maintain
- Need to keep metadata in sync
- Benefits outweigh complexity

---

**Related Documentation**:
- [Product Vision](./01-product-vision.md) - What we're building and why
- [Technical Architecture](./02-technical-architecture.md) - How we'll build it
- [Implementation Guide](./05-implementation-guide.md) - Code patterns and examples
