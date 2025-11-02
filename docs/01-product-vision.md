# Product Vision

**Last Updated**: 2025-01-24
**Status**: Current
**Owner**: Product

## Overview

**Lexly** (working title) is a collaborative workspace designed specifically for language teachers and students conducting 1-on-1 or small group lessons. The platform replaces generic document editors (like Google Docs) with a purpose-built, real-time collaborative editing environment optimized for language learning workflows.

### Problem Statement

Private language teachers currently rely on Google Docs or PDFs to run their lessons, which creates several pain points:

- **Inconsistent formatting**: Exercises copied from different sources have mismatched fonts, highlighting, and styles
- **Unstructured content**: Exercises (translations, fill-ins, vocabulary tables) are just plain text without semantic structure
- **Poor homework tracking**: Comments are used to mark homework, but Google Docs' comment system is not designed for task management (wrong sorting, no filtering by section, etc.)
- **Limited collaboration**: Teachers can't see student viewport or cursor in real-time, making it hard to follow along
- **No exercise reusability**: Teachers manually recreate similar exercises for each lesson
- **Time-consuming material preparation**: Formatting and organizing materials takes unnecessary time

### Solution

A dedicated collaborative workspace for language lessons built around:

1. **Block-based structured editor** (using Tiptap/ProseMirror)
   - Custom exercise blocks: translation, fill-in-the-blank, multiple choice, tables, vocabulary lists
   - Consistent, beautiful formatting across all content
   - Keyboard-first navigation and editing

2. **Real-time collaboration**
   - Live cursors and viewport tracking for teacher and student
   - Instant synchronization of edits and answers
   - Multiplayer-aware by design

3. **AI-assisted content creation**
   - Paste messy materials → AI automatically converts to clean, structured blocks
   - Parse exercises from images (OCR + AI)
   - Generate exercises from source materials
   - **Note**: AI is a teacher-only tool, not directly accessible to students

4. **Exercise bank and template system**
   - Teachers can save and reuse their best exercises
   - Build up a personal library of teaching materials
   - Quick lesson assembly from pre-made components

5. **Homework management**
   - Mark any block as "homework" with a simple toggle
   - Students see a clear to-do list of assigned work
   - Track completion status

## Target Users

### Primary Users (Paying)
- **Independent language teachers**: 1-on-1 tutors and small group instructors
- **Small language schools**: Want cleaner digital lesson materials for their teachers

### Secondary Users (Free)
- **Students**: Join via teacher invitation, access shared lesson materials

## Business Model

### Pricing Strategy
- **Students**: Always free
- **Teachers**: Subscription-based

#### Proposed Tiers

| Tier | Price | Target Audience | Features |
|------|-------|----------------|----------|
| Free | €0/mo | Trial users | Limited students (1-2), basic editing, no AI |
| Basic | €9-15/mo | Individual tutors | Up to 10 students, basic exercise bank, manual editing |
| Pro | €25-40/mo | Power teachers | Unlimited students, AI formatting, advanced exercise bank, priority support |
| School | €99+/mo | Language academies | Multiple teachers, shared workspace, team collaboration, analytics |

### Revenue Model
- Recurring monthly/annual subscriptions
- Teachers own the subscription; students use for free
- Potential add-ons: premium AI features, advanced analytics, marketplace access

## User Experience Principles

### Design Values
1. **Speed**: Sub-100ms editor responsiveness, instant collaboration updates
2. **Simplicity**: Keyboard shortcuts for everything, minimal UI chrome
3. **Beauty**: Consistent typography, harmonious colors, delightful animations
4. **Reliability**: Autosave always works, offline graceful degradation
5. **Accessibility**: Keyboard navigation, screen reader support, proper ARIA labels

### Key Workflows

#### New Lesson (Teacher)
1. Dashboard → "New Lesson"
2. Select student (or create new)
3. Choose template or blank
4. Add blocks via slash commands or exercise bank
5. Mark homework blocks
6. Share link with student (or auto-invite)

#### Joining Lesson (Student)
1. Receive invite link via email
2. Click → auto-authenticated (if account exists)
3. See lesson in real-time
4. Complete exercises inline
5. See homework list in sidebar

#### AI Import (Teacher)
1. Copy messy exercise from PDF/website
2. Paste into lesson
3. AI modal: "Converting to structured blocks..."
4. Review generated blocks
5. Approve or edit
6. Blocks inserted at cursor

## Market & Competitive Analysis

### Target Market Size
- **Global private language tutoring**: ~€60-70B market
- **Online tutoring platforms**: Preply, iTalki, AmazingTalker (hundreds of thousands of teachers)
- **Addressable market**: ~15-20M private tutors worldwide
- **1% penetration**: 150K-200K potential paying teachers

### Competition

| Product | Strengths | Weaknesses | Differentiation |
|---------|-----------|------------|-----------------|
| Google Docs | Free, familiar, universal | Not structured, poor collaboration for lessons, no exercise logic | We: purpose-built, structured blocks, homework tracking |
| Notion | Structured, databases | No real-time collab, not designed for tutoring | We: live collaboration, tutor-specific UX |
| Genially/Interacty | Interactive content | Designed for 1-to-many classrooms, not 1-on-1 | We: 1-on-1 optimized, homework flow |
| Preply/iTalki | Marketplace, scheduling | Focus on logistics, not lesson content | We: integrate inside lessons, content-first |

### Unique Value Proposition
**"The only collaborative workspace designed specifically for 1-on-1 language tutoring"**

Key differentiators:
- Structured exercise blocks (not generic text)
- Real-time teacher-student collaboration
- AI-assisted material preparation (teacher tool, not student-facing)
- Homework management built-in
- Exercise bank for reusability
- Beautiful, consistent formatting

## Growth Strategy

### Acquisition Channels
1. **Teacher communities**: Reddit, Facebook groups, Discord servers
2. **Tutoring platforms**: Partnerships with Preply, iTalki (referral program)
3. **Content marketing**: Blog posts, YouTube tutorials (how to teach X)
4. **Word of mouth**: Referral program (teacher invites another teacher)
5. **SEO**: "best tools for language teachers", "google docs alternative for tutors"

### Conversion Funnel
1. **Awareness**: Teacher discovers via community/search
2. **Interest**: Visits landing page, sees demo video
3. **Trial**: Signs up for free tier (1-2 students)
4. **Activation**: Creates first lesson, invites student, experiences real-time editing
5. **Conversion**: Hits student limit, upgrades to Pro (€25/mo)
6. **Retention**: Uses exercise bank, saves time, becomes essential tool
7. **Referral**: Invites colleagues, shares in communities

### Retention Strategy
- Sticky product (exercise bank becomes valuable over time)
- Time-saving value proposition (justify subscription)
- Community features (shared templates, marketplace)
- Regular feature updates (communicated via in-app changelog)
- Excellent support (personal touch for early adopters)

## Success Metrics

### Key Performance Indicators (KPIs)

#### Acquisition
- Monthly signups (teachers)
- Signup sources (tracking which channels work)
- Landing page conversion rate

#### Activation
- % of teachers who create first lesson within 7 days
- % who invite at least one student
- % who experience real-time collaboration

#### Engagement
- Weekly active teachers (WAT)
- Lessons created per teacher per month
- Exercise bank usage (saves + insertions)
- Homework assignments per lesson

#### Revenue
- Free → Paid conversion rate
- Monthly Recurring Revenue (MRR)
- Average Revenue Per User (ARPU)
- Churn rate
- Customer Lifetime Value (LTV)

#### Product Quality
- Editor performance (p95 latency)
- Real-time sync success rate
- AI import success rate (% requiring manual fixes)
- User-reported bugs
- NPS (Net Promoter Score)

### North Star Metric
**Weekly Active Lessons**: Number of lessons with at least one teacher-student collaborative session per week

Rationale: This metric captures:
- User engagement (both teacher and student)
- Product value delivery (lessons happening)
- Growth (more lessons = more users)
- Retention (repeat lesson creation)

## Risk Assessment

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Real-time sync failures | High | Use battle-tested Y.js + Hocuspocus, implement offline mode, comprehensive testing |
| AI hallucinations/errors | Medium | Validation layer, teacher review flow, don't auto-apply |
| Editor performance issues | Medium | Lazy loading, virtual scrolling, performance budgets |
| Data loss | Critical | Auto-save every few seconds, Convex automatic backups, version history |

### Business Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Low teacher adoption | High | Early validation with real teachers, tight feedback loop |
| Pricing too high/low | Medium | A/B test pricing, gather WTP data, offer annual discounts |
| Y.js/Hocuspocus scaling costs | Medium | Self-hosted deployment, monitor costs closely, optimize infrastructure |
| Copyright issues (teachers uploading protected content) | Medium | Clear ToS, DMCA process, education about copyright |

### Market Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Large competitor enters space | Medium | Move fast, build community, focus on niche excellence |
| Tutoring platforms build similar features | Medium | Integration strategy, unique IP (exercise bank, AI), superior UX |
| Market too small | High | Early validation with TAM research, expand to other subjects if needed |

## Legal & Compliance (Germany-Specific)

### GDPR Compliance
- ✅ Privacy policy (Datenschutzerklärung)
- ✅ Terms of Service (AGB)
- ✅ Impressum (mandatory in Germany)
- ✅ Cookie consent (if using analytics/tracking)
- ✅ Data Processing Agreements with providers (Convex, Vercel, Hocuspocus hosting)
- ✅ EU hosting (Frankfurt region for all user data)
- ⚠️ Data export/deletion flows (must implement before launch)
- ⚠️ User data retention policies

### Content & Copyright
- Teachers are responsible for uploaded content
- Clear ToS: teachers must have rights to materials
- DMCA-compliant takedown process
- Education: link to OER (Open Educational Resources)

### Taxation
- VAT handling via Stripe Tax or Paddle (Merchant of Record)
- Kleinunternehmerregelung (no VAT) until €22k revenue
- Proper invoicing with tax identification number

---

**Related Documentation**:
- [Technical Architecture](./02-technical-architecture.md) - How we'll build this
- [Development Roadmap](./06-development-roadmap.md) - When features will be delivered
- [Implementation Guide](./05-implementation-guide.md) - How features are implemented
