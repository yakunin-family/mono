# Technical Architecture

**Last Updated**: 2025-01-24
**Status**: Current
**Owner**: Engineering

## Overview

This document describes the technical architecture of Lexly, including current implementation, planned extensions, and rationale for technology choices.

## Current Stack (Implemented)

### Frontend

#### Marketing Site (`apps/www`)
- **Framework**: Astro (static site generation)
- **Purpose**: Landing page, pricing, marketing content
- **Hosting**: Vercel (static deployment)
- **Domain**: `lexly.io` (root domain)
- **CTA**: Login button redirects to `app.lexly.io/login`

#### Main App (`apps/main`)
- **Framework**: TanStack Start (primarily client-side React app)
- **Routing**: TanStack Router (file-based routing)
- **Rendering**: Minimal SSR (auth check only), mostly CSR for app performance
- **State Management**: TanStack Query + Convex React client
- **Styling**: Tailwind CSS v4
- **Forms**: TanStack Form
- **Editor**: Tiptap (configured, ready for block implementation)
- **UI Components**: shadcn/ui via `packages/ui`
- **Domain**: `app.lexly.io` (subdomain)

### Backend
- **Platform**: Convex (serverless backend with real-time capabilities)
- **Connection**: WebSocket (Convex client connects directly from browser)
- **Authentication**: Better Auth via Convex (`@convex-dev/better-auth`)
  - Email/password authentication configured
  - Non-verified email flow for MVP
  - Auth check happens server-side before page load (TanStack Start beforeLoad)
  - Session managed client-side after initial load
- **Database**: Convex (document database with automatic real-time subscriptions)

### Infrastructure
- **Monorepo**: pnpm + Turborepo
- **Hosting**:
  - Marketing site (`apps/www`): Vercel (static)
  - Main app (`apps/main`): Vercel (minimal SSR, mostly static)
- **Backend**: Convex Cloud (WebSocket connections from client)

## Planned Extensions

### Collaboration Architecture

**Recommended Approach: Y.js + Hocuspocus**

Based on detailed architectural analysis, the collaboration layer will use:

#### Y.js: CRDT Framework
- **Proven offline-first capability**: Operations work locally, sync when connected
- **Deterministic merge semantics**: Each operation has unique ID, conflicts impossible
- **Native ProseMirror integration**: Via `y-prosemirror` binding
- **Superior performance**: Compared to OT (Operational Transformation)
- **Mature ecosystem**: Battle-tested by Figma, Linear, and others

#### Hocuspocus: WebSocket Server
- **Built-in authentication**: JWT-based with extensible hooks
- **Extensible via hooks**:
  - `onAuthenticate`: Validate JWT and enforce permissions
  - `onConnect`: Track connections and presence
  - `onStoreDocument`: Persist Y.js updates to database
- **Persistence layer integration**: PostgreSQL, Redis, S3, or Convex
- **Horizontal scaling support**: Redis-based pub/sub for multi-instance
- **Self-hosted**: Cost-effective compared to managed services (€20-30/mo vs €180-400/mo)

### Document Strategy

Multi-document pattern for permission isolation:

```
lesson:<id>:content          // Shared lesson content
  - Teacher: read-write
  - Student: read-only

lesson:<id>:answers:<userId>  // Per-student answer document
  - Student: read-write (own answers only)
  - Teacher: read-only (for grading)

lesson:<id>:annotations       // Optional: teacher feedback/comments
  - Teacher: read-write
  - Student: read-only
```

**Rationale for separation**:
- Clean permission boundaries (students can't edit lesson structure)
- Independent Y.js documents with different access rules
- Teacher can grade without interfering with student work
- Easy backup and versioning per component
- Scales to group lessons (one answers doc per student)

### Permission Enforcement

Room-scoped JWT authentication flow:

1. **User authenticates** via Better Auth (source of truth)
2. **Frontend requests WebSocket token** from backend:
   ```http
   POST /api/collab/token?room=lesson:123:content
   Authorization: Bearer <session-token>
   ```
3. **Backend validates session** and checks ACL:
   - Is user enrolled in this lesson?
   - What role (teacher/student)?
   - Which documents can they access?
4. **Issues room-scoped JWT** (10min expiry):
   ```json
   {
     "sub": "user_id",
     "rooms": ["lesson:123:content", "lesson:123:answers:user_id"],
     "role": "student",
     "exp": 1640000000
   }
   ```
5. **Frontend connects** to Hocuspocus with JWT
6. **Hocuspocus validates token** in `onAuthenticate` hook:
   - Verify signature and expiration
   - Check `rooms` array includes requested document
   - Reject if forbidden

**Security considerations**:
- Short-lived tokens (10min) limit exposure
- Room-scoped (can't access other lessons)
- Better Auth session remains source of truth
- Token refresh handled automatically by frontend

### Custom Cursor Rendering

Using Y.js Awareness + ProseMirror decorations:

- **Off-viewport indicators**: Arrows pointing to remote users' positions
- **Avatar chips**: User name/color displayed above cursor
- **Morphing highlights**: When focused on exercise widgets, cursor becomes input highlight
- **Presence throttling**: Updates sent at 10-20 Hz to balance smoothness and bandwidth

### Offline Behavior

CRDTs handle network failures gracefully:

**Scenario**: User deletes text offline, another user inserts text online

1. Offline user: Delete operation marks character IDs as deleted (stored locally)
2. Online user: Insert operation creates new characters with unique IDs
3. On sync: Y.js merges operations deterministically
4. Result: Deleted characters removed, new characters preserved (different IDs)
5. No conflicts, no "last write wins" data loss

**Key insight**: Each character has unique ID tied to when it was created. Delete marks IDs as deleted; insert creates new IDs. Operations commute (order doesn't matter for final result).

## AI Integration

### Provider
- **Vercel AI SDK**: Unified interface for multiple models
- **AI Gateway** (optional): Rate limiting, caching, analytics

### Models
- **High accuracy**: GPT-4o or Claude Sonnet for complex parsing
- **Cost-effective**: GPT-4o-mini or Claude Haiku for simple tasks

### Use Cases
1. **Exercise parsing**: Detect exercise types, extract questions/answers
2. **OCR + structure extraction**: Parse images of exercises
3. **Exercise generation**: Create new exercises from vocabulary lists
4. **Mistake categorization** (future): Analyze student errors

### Constraints
- **JSON Schema / Function Calling**: Ensure reliable structured output
- **Validation layer**: Check against ProseMirror schema before insertion
- **Repair loop**: Retry malformed responses with error context
- **Provenance tracking**: Link generated blocks to source material
- **Privacy**: EU-only processing or anonymization for GDPR compliance

### Cost Management
- Use cheaper models for simple tasks
- Cache common transformations
- Batch processing when possible
- Teacher-initiated only (no automatic processing)

## Analytics

- **Provider**: PostHog (EU Cloud)
- **Capabilities**: Product analytics, session replay, feature flags
- **Privacy**: First-party tracking via reverse proxy (better accuracy, GDPR-friendly)

## Payments

- **Provider**: Stripe or Paddle/LemonSqueezy
- **Rationale for Paddle/LemonSqueezy**: Merchant of Record handles EU VAT complexity
- **Rationale for Stripe**: More flexible, better developer experience, but need to handle VAT ourselves

## Technology Choices: Rationale

### Why Astro (for Marketing)?
- **Static-first**: Fast builds, zero JavaScript by default
- **SEO optimized**: Perfect for marketing content (blog, landing pages)
- **Content collections**: Built-in support for blog posts, case studies
- **Component agnostic**: Can use React, Vue, or plain HTML as needed
- **Fast delivery**: Pre-rendered at build time, served from CDN

### Why TanStack Start (for App)?
- **Client-side optimized**: Minimal SSR overhead, mostly runs in browser for app-like performance
- **Auth-aware routing**: Server-side auth check in `beforeLoad`, then fully client-side
- **File-based routing**: Easy to scale, clear structure
- **Integrated ecosystem**: Works seamlessly with TanStack Query, Form, Router
- **Modern & type-safe**: Excellent developer experience, catches errors at compile time
- **Performance**: Optimized bundle splitting, lazy loading built-in
- **Separation of concerns**: Marketing (Astro) vs App (TanStack) keeps codebases focused

### Why Convex?
- **Real-time by default**: Queries automatically subscribe to updates (no manual invalidation)
- **WebSocket-based**: Direct browser → Convex connection, no HTTP middleware needed
- **TypeScript end-to-end**: Backend functions → client types generated automatically
- **Client-side friendly**: Call queries/mutations directly from React components
- **Serverless**: No infrastructure management, automatic scaling
- **Built-in features**: Auth, file storage, vector search (future)
- **Generous free tier**: 1M function calls/month, 1GB storage
- **Predictable pricing**: Based on usage, scales with product
- **Better Auth integration**: Official connector available

### Why Better Auth?
- **Modern, TypeScript-first**: Great DX, type-safe
- **Self-hosted**: No vendor lock-in, control over data
- **Convex integration**: Official adapter available
- **Extensible**: Easy to add passkeys, 2FA, magic links later
- **GDPR-friendly**: Deploy in EU, full control over data storage

### Why Tiptap/ProseMirror?
- **Industry-standard**: Used by Notion, GitLab, Confluence, etc.
- **Highly extensible**: Custom nodes, marks, plugins
- **Excellent TypeScript support**: Type-safe extension API
- **Battle-tested**: Years of production use, edge cases handled
- **Strong ecosystem**: Many community plugins and extensions
- **Collaboration-ready**: Y.js integration via `y-prosemirror`

### Why Y.js + Hocuspocus?

#### Y.js Advantages
- **Industry-proven CRDT**: Used by Figma, Linear, Jupyter
- **Offline-first by design**: Works locally, syncs when connected
- **Native ProseMirror integration**: `y-prosemirror` binding maintained by Y.js core team
- **Smaller bundle size**: ~60KB gzipped (vs Liveblocks ~150KB)
- **Open-source**: MIT license, strong community, no vendor lock-in

#### Hocuspocus Advantages
- **Full control**: Self-hosted, own infrastructure and data
- **Extensible**: Hooks for authentication, persistence, logging
- **Cost-effective**: €20-30/mo for Fly.io/Render vs €180-400/mo for Liveblocks
- **Battle-tested**: Used by GitBook, Gamma, and other production apps
- **Migration path**: Can switch to managed service later if needed

#### Trade-offs vs Managed Services (e.g., Liveblocks)
| Aspect | Y.js + Hocuspocus | Liveblocks |
|--------|-------------------|------------|
| Cost (MVP) | €20-30/mo | €180-400/mo |
| Setup complexity | Medium (Docker deploy) | Low (API keys) |
| Control | Full (self-hosted) | Limited (SaaS) |
| Customization | High (extensible hooks) | Medium (API) |
| Maintenance | Moderate (server updates) | None (managed) |
| GDPR compliance | Full control | Trust provider |

**Decision**: Start with Y.js + Hocuspocus for cost savings and learning. Can migrate to managed service if operations become burden.

## System Architecture Diagram

```
Marketing Flow:
┌──────────────────┐
│  lexly.io        │  Static Astro site on Vercel
│  (Marketing)     │  - Landing page
│                  │  - Pricing
│  [Login Button]  │  - Blog (future)
└────────┬─────────┘
         │ Redirects to app.lexly.io/login
         ▼

App Flow:
┌─────────────────────────────────────────────────────────────┐
│              app.lexly.io (User Browser)                     │
│  - TanStack Start app (mostly client-side React)            │
│  - Tiptap editor                                            │
│  - Y.js provider (HocuspocusProvider)                       │
│  - Convex React client (WebSocket)                          │
└────────────┬─────────────────────────────────┬──────────────┘
             │                                 │
             │ WSS (WebSocket)                │ WSS (WebSocket)
             │ - Convex queries/mutations     │ - Y.js updates
             │ - Real-time subscriptions      │ - Presence
             │ - Auth (Better Auth)           │ - Collaboration
             ▼                                 ▼
┌────────────────────────┐      ┌─────────────────────────────┐
│   Convex Cloud         │      │   Hocuspocus (Collab)       │
│  - Better Auth         │      │  - Y.js WebSocket server    │
│  - Structured data     │      │  - JWT auth via hooks       │
│  - Real-time queries   │      │  - EU region (Frankfurt)    │
│  - Exercise bank       │      │  - Fly.io or Render         │
│  - Homework/grading    │      └──────────────┬──────────────┘
│  - Y.js snapshots      │◄────────────────────┘
└────────────────────────┘         Persistence
                                   (HTTP to Convex)

Vercel Hosting:
┌────────────────────────┐
│   Vercel               │
│  - lexly.io (static)   │
│  - app.lexly.io (CSR)  │
│    └─ Minimal SSR for  │
│       auth check only  │
└────────────────────────┘
```

**Data flow**:
1. **Marketing**: User visits `lexly.io` → static Astro site served from Vercel
2. **Login redirect**: Login button redirects to `app.lexly.io/login`
3. **App load**: TanStack Start checks auth server-side (beforeLoad), then serves client-side React app
4. **Client connections**: Browser establishes two WebSocket connections:
   - Convex WebSocket: queries, mutations, real-time subscriptions (structured data)
   - Hocuspocus WebSocket: Y.js collaboration (document editing)
5. **Collaboration persistence**: Hocuspocus persists Y.js updates to Convex via HTTP
6. **Real-time sync**: Convex notifies all connected clients of data changes via WebSocket

---

**Related Documentation**:
- [Data Models](./03-data-models.md) - Database schemas
- [Deployment Guide](./04-deployment-guide.md) - How to deploy Hocuspocus
- [Implementation Guide](./05-implementation-guide.md) - Code examples
