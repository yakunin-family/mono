# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a **pnpm monorepo** managed by **Turborepo** with the following workspace structure:

### Apps

- **`apps/teacher`** - Teacher-facing application (port 3000) using TanStack Start
- **`apps/student`** - Student-facing application (port 3001) using TanStack Start
- **`apps/backend`** - Convex backend for real-time database and serverless functions
- **`apps/www`** - Marketing/landing site built with Astro
- **`apps/collab-server`** - Hocuspocus WebSocket server for real-time collaboration (port 1234)

### Packages

- **`packages/editor`** - Shared Tiptap-based collaborative document editor
- **`packages/ui`** - Shared React component library (using shadcn/ui)
- **`packages/eslint`** - Shared ESLint configurations
- **`packages/typescript-config`** - Shared TypeScript configurations

## Development Commands

All commands should be run from the **repository root** unless otherwise specified.

### Core Commands

```bash
# Install dependencies
pnpm install

# Run all apps in development mode
pnpm dev

# Run specific apps
pnpm dev:teacher      # Teacher app on port 3000
pnpm dev:student      # Student app on port 3001
pnpm dev:backend      # Convex backend
turbo dev --filter=www

# Build all apps
pnpm build

# Build specific apps
pnpm build:teacher
pnpm build:student
turbo build --filter=www

# Type checking
pnpm check-types

# Linting
pnpm lint

# Code formatting
pnpm format
```

### Backend-Specific Commands

The Convex backend (`apps/backend`) requires separate commands:

```bash
cd apps/backend

# Start Convex dev server
pnpm dev  # or: convex dev

# Deploy to production
pnpm deploy  # or: convex deploy

# Generate TypeScript types from schema
pnpm codegen  # or: convex codegen
```

### App-Specific Commands

```bash
# Teacher app
cd apps/teacher
pnpm dev    # Port 3000
pnpm build
pnpm test

# Student app
cd apps/student
pnpm dev    # Port 3001
pnpm build
pnpm test
```

## Architecture Notes

### Teacher App (`apps/teacher`)

- **Framework**: TanStack Start (React SSR with file-based routing)
- **Port**: 3000 (localhost:3000)
- **Purpose**: Teacher dashboard, document creation, student management
- **Features**:
  - Create and manage documents
  - Add and manage students via invite links
  - Share documents with students
  - Full document editing capabilities
  - Role switching to student app (if user has both roles)

**Key Routes**:
- `/` - Teacher dashboard
- `/document/:id` - Document editor (full edit access)
- `/teacher/subscribe` - Teacher activation/subscription
- `/login`, `/signup` - Authentication

### Student App (`apps/student`)

- **Framework**: TanStack Start (React SSR with file-based routing)
- **Port**: 3001 (localhost:3001)
- **Purpose**: Student learning interface
- **Features**:
  - View assigned documents
  - Collaborative document viewing/editing (limited)
  - Student onboarding via invite links
  - Role switching to teacher app (if user has both roles)

**Key Routes**:
- `/` - Student dashboard
- `/document/:id` - Document viewer (limited edit access)
- `/join/:token` - Student onboarding via teacher invite
- `/login` - Authentication

### Shared Architecture (Both Apps)

- **Routing**: TanStack Router with file-based routes in `src/routes/`
- **State/Data**: TanStack Query with Convex React Query integration
- **Authentication**: Better Auth via Convex (shared session across apps)
- **Styling**: Tailwind CSS v4
- **Forms**: TanStack Form
- **Editor**: `@mono/editor` package (shared collaborative editor)
- **Environment Variables**: Type-safe env vars using `@t3-oss/env-core`
- **Path Aliases**: `@/` references `src/`

**Role Switching**: When users have both teacher and student roles active, they can switch between apps. The RoleSwitcher component updates the user's `activeRole` in Convex and redirects to the appropriate app URL.

### Backend (`apps/backend`)

- **Platform**: Convex (serverless backend-as-a-service)
- **Schema**: Defined in `convex/schema.ts` using Convex validators (`v` from `convex/values`)
- **Functions**: Queries, mutations, and actions in `convex/` directory
- **Authentication**: Better Auth integration via HTTP endpoints (`convex/http.ts`)

**Important Convex Patterns**:
- All documents have `_id` and `_creationTime` system fields (automatically indexed)
- Use `v.id("tableName")` for foreign key references
- Indexes must be explicitly defined (except for system fields)
- Use `v.optional()` for optional fields
- Complex types use `v.union()` and `v.object()`

Example schema pattern:
```ts
defineTable({
  userId: v.id("users"),
  status: v.union(v.literal("active"), v.literal("inactive")),
  metadata: v.optional(v.object({ key: v.string() })),
}).index("userId", ["userId"])
```

### Document Editor Package (`packages/editor`)

- **Purpose**: Shared collaborative rich-text editor used by both teacher and student apps
- **Built with**:
  - Tiptap (extensible rich-text editor framework)
  - Hocuspocus (WebSocket-based collaboration provider)
  - Yjs (CRDT for real-time collaboration)
- **Exports**:
  - `DocumentEditor` - Main editor component with toolbar
  - `DocumentEditorToolbar` - Standalone toolbar component
- **Props**:
  - `documentId` - Unique document identifier for collaboration
  - `canEdit` - Boolean to control edit permissions
  - `websocketUrl` - Optional WebSocket server URL (default: ws://127.0.0.1:1234)
  - `onStatusChange` - Callback for connection status changes
  - `onConnectedUsersChange` - Callback for active users count

### UI Package (`packages/ui`)

- Shared component library using **shadcn/ui**
- Add new shadcn components: `pnpx shadcn@latest add <component>`
- Components are built with `tsup` and consumed by apps via workspace references

## Git Workflow

- **Pre-commit hooks**: Husky + lint-staged configured
- **Staged files**: Only `.md` and `.json` files are auto-formatted via Prettier on commit
- **Package manager**: pnpm (required, enforced via `packageManager` field)
- **Node version**: >= 18

## Environment Setup

### Teacher App

Required environment variables in `apps/teacher/.env.local`:
- `VITE_CONVEX_URL` - Convex deployment URL
- `CONVEX_DEPLOYMENT` - Convex deployment name

### Student App

Required environment variables in `apps/student/.env.local`:
- `VITE_CONVEX_URL` - Convex deployment URL (same as teacher app)
- `CONVEX_DEPLOYMENT` - Convex deployment name (same as teacher app)

**Note**: Both apps share the same Convex backend and authentication system.

### Backend

Required environment variables in `apps/backend/.env.local`:
- Convex deployment credentials (set via `npx convex init` or `npx convex dev`)

## CI/CD and Deployment

This repository uses **GitHub Actions** with **Turborepo's affected detection** to optimize CI/CD pipelines. Only changed apps are checked, tested, and deployed.

### GitHub Actions Workflows

**1. CI Workflow** (`.github/workflows/ci.yml`)
- **Triggers**: Pull requests and pushes to main
- **Purpose**: Quality checks on affected apps only
- **Steps**:
  - Runs `turbo run lint --filter='[HEAD^1]'` (lint only affected)
  - Runs `turbo run check-types --filter='[HEAD^1]'` (type-check only affected)
  - Runs `turbo run test --filter='[HEAD^1]'` (test only affected)
- **Optimization**: Uses Turborepo remote caching via Vercel

**2. Convex Deployment** (`.github/workflows/deploy-convex.yml`)
- **Triggers**: Pushes to main when backend, teacher, or student apps are affected
- **Purpose**: Deploy Convex backend to production
- **Steps**:
  - Checks if backend/teacher/student changed
  - Deploys via `convex deploy --cmd 'pnpm run codegen'`
  - Requires `CONVEX_DEPLOY_KEY` secret

**3. Collab Server Deployment** (`.github/workflows/deploy-collab-server.yml`)
- **Triggers**: Pushes to main when collab-server is affected
- **Purpose**: Build and deploy WebSocket collaboration server
- **Steps**:
  - Checks if collab-server changed
  - Builds via `turbo run build --filter=collab-server`
  - Deployment step (customizable for Railway/Render/Fly.io)
- **Note**: Deployment step needs to be configured based on chosen platform

### Deployment Strategy

**Vercel Apps** (teacher, student, www):
- **Method**: Vercel Git Integration (automatic)
- **Build**: Handled by Vercel using `vercel.json` configuration
- **Environment**: Each app has `vercel.json` with proper build commands
- **Deploy**: Automatic on every push to main
- **Preview**: Automatic preview deployments on pull requests

**Convex Backend**:
- **Method**: GitHub Actions with Convex CLI
- **Trigger**: Deployed when backend, teacher, or student apps change
- **Reason**: Backend must stay in sync with frontend apps
- **Deploy**: Via `convex deploy` command in CI

**Collab Server**:
- **Method**: GitHub Actions + chosen hosting platform
- **Trigger**: Deployed when collab-server code changes
- **Platforms**: Supports Railway, Render, Fly.io, or custom
- **Deploy**: Requires platform-specific configuration

### Required GitHub Secrets

Add these secrets in GitHub repository settings (Settings → Secrets and variables → Actions):

**For Turborepo Remote Caching:**
- `TURBO_TOKEN` - Vercel token for remote cache ([get token](https://vercel.com/account/tokens))
- `TURBO_TEAM` - Vercel team slug (found in Vercel dashboard URL)

**For Convex Deployment:**
- `CONVEX_DEPLOY_KEY` - Convex deploy key ([get from dashboard](https://dashboard.convex.dev))

**For Collab Server Deployment** (choose based on platform):
- Railway: `RAILWAY_TOKEN`
- Render: `RENDER_DEPLOY_HOOK_URL`
- Fly.io: `FLY_API_TOKEN`
- Custom: Platform-specific credentials

### Turborepo Affected Detection

The CI/CD pipelines use Turborepo's `--filter='[HEAD^1]'` flag to run tasks only on affected apps:

```bash
# Only lint apps that changed since last commit
turbo run lint --filter='[HEAD^1]'

# Only build affected apps
turbo run build --filter='[HEAD^1]'

# Check which apps are affected (dry run)
turbo run build --filter='[HEAD^1]' --dry=json
```

**Benefits:**
- Faster CI runs (only check what changed)
- Reduced compute costs
- Quicker feedback on PRs
- Remote caching speeds up repeated builds

### Vercel Configuration

Each Vercel app has a `vercel.json` file configuring monorepo builds:

**Teacher & Student** (`apps/teacher/vercel.json`, `apps/student/vercel.json`):
```json
{
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=<app>",
  "outputDirectory": ".vinxi/output/public",
  "installCommand": "pnpm install --frozen-lockfile"
}
```

**Marketing Site** (`apps/www/vercel.json`):
```json
{
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=www",
  "outputDirectory": "dist",
  "framework": "astro"
}
```

### Setting Up Deployments

**1. Vercel Setup:**
- Connect GitHub repository to Vercel
- Import each app separately (teacher, student, www)
- Vercel auto-detects monorepo and uses `vercel.json` config
- Set environment variables in Vercel dashboard for each app

**2. Convex Setup:**
- Get deploy key from [Convex dashboard](https://dashboard.convex.dev)
- Add `CONVEX_DEPLOY_KEY` to GitHub secrets
- Backend will auto-deploy on app changes

**3. Turborepo Cache Setup:**
- Get Vercel token from [account settings](https://vercel.com/account/tokens)
- Add `TURBO_TOKEN` and `TURBO_TEAM` to GitHub secrets
- Remote caching will work for all CI runs

**4. Collab Server Setup:**
- Choose hosting platform (Railway, Render, Fly.io, etc.)
- Uncomment appropriate deployment section in `.github/workflows/deploy-collab-server.yml`
- Add platform-specific secrets to GitHub
- Configure environment variables on hosting platform

## Special Considerations

1. **Separate Apps Architecture**:
   - Teacher and student apps are completely separate deployments
   - They share the same Convex backend and authentication
   - Role switching redirects between apps (localhost:3000 ↔ localhost:3001)
   - In production, these would be separate subdomains (e.g., teach.example.com and learn.example.com)

2. **TanStack Router**:
   - Routes are file-based in `apps/teacher/src/routes/` and `apps/student/src/routes/`
   - Route tree is auto-generated; restart dev server after adding routes

3. **Shared Editor**:
   - Both apps use `@mono/editor` package for document viewing/editing
   - Same editor component, different permissions (canEdit prop)
   - Real-time collaboration works across both apps via Hocuspocus WebSocket server

4. **Convex Real-time**:
   - Queries automatically subscribe to real-time updates
   - Mutations invalidate queries automatically
   - Both apps connect to the same Convex deployment

5. **Workspace References**:
   - Apps reference packages via `workspace:*` protocol
   - Changes to `@mono/editor` or `@mono/ui` require rebuilding affected apps

6. **Turborepo Caching**: Build outputs are cached. Use `turbo build --force` to bypass cache.

7. **Path Aliases**: Both apps use path aliases configured in `tsconfig.json`. Import from `@/` to reference `src/`.

8. **shadcn Components**: Must be installed from the app directory where they'll be used (`apps/teacher` or `apps/student`), not from repo root.

9. **Authentication**:
   - Better Auth sessions are shared between apps (same domain in development)
   - Logging in to one app logs you into both
   - User profiles track both `isTeacherActive` and `isStudentActive` roles
