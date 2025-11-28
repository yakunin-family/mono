# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style Guidelines

**CRITICAL RULES - NEVER VIOLATE THESE:**

1. **No `as any` casts** - The use of `as any` type assertions is **strictly forbidden** unless explicitly approved by the user. Always find properly typed solutions.
   - ❌ `const foo = bar as any`
   - ✅ `const foo = bar as SpecificType` (with proper type)
   - ✅ Use proper type narrowing, type guards, or interface design instead

2. **Type Safety First** - Always maintain strong typing throughout the codebase. If a type conflict arises, solve it with proper TypeScript patterns, not by weakening types.

3. **No Meta-Comments** - Do not add comments that are only relevant during code writing. Comments must provide lasting value.
   - ❌ `// Type-safe props!` - Meta-commentary about what you just did
   - ❌ `// Now fully typed - no assertions needed!` - Temporary context
   - ❌ `// Type the NodeView props to ensure...` - Obvious from the code
   - ✅ `// Note: Using intersection type because ReactNodeViewRenderer requires standard NodeViewProps` - Explains WHY
   - ✅ `// HACK: Workaround for Tiptap issue #1234` - Documents technical debt
   - ✅ Complex business logic explanations that clarify non-obvious behavior
   - **Rule of thumb:** If the comment won't be useful to someone reading the code in 6 months, don't write it.

## Repository Structure

This is a **pnpm monorepo** managed by **Turborepo** with the following workspace structure:

### Apps

- **`apps/teacher`** - Teacher-facing application using TanStack Start
- **`apps/student`** - Student-facing application using TanStack Start
- **`apps/backend`** - Convex backend for real-time database and serverless functions
- **`apps/www`** - Marketing/landing site built with Astro
- **`apps/collab-server`** - Hocuspocus WebSocket server for real-time collaboration

### Packages

- **`packages/editor`** - Shared Tiptap-based collaborative document editor
- **`packages/ui`** - Shared React component library (using shadcn/ui)
- **`packages/exercises`** - Exercise type taxonomy (16 types across Material, Assessment, Production categories) - *Note: Package defines types but doesn't export them yet*

### Tooling

- **`tooling/eslint`** - Shared ESLint configurations
- **`tooling/typescript-config`** - Shared TypeScript configurations

## Project Management: Initiatives Folder

The **`initiatives/`** folder serves as a lightweight project management system similar to Jira, organizing large features and complex work into structured epics with discrete tasks.

### Structure

```
initiatives/
├── initiative-name/
│   ├── README.md                    # Initiative overview (epic)
│   ├── task-0-description.md        # Individual task
│   ├── task-1-description.md
│   ├── task-2-description.md
│   └── ...
```

### When to Use Initiatives

Use the initiatives folder when:
- A feature request requires multiple discrete implementation steps
- Work involves coordinating changes across multiple apps or packages
- The scope is large enough to benefit from upfront planning
- Dependencies between tasks need to be clearly documented
- You want to track progress incrementally with checkboxes

**Example scenarios:**
- Adding a new collaborative editor feature with backend, frontend, and UI changes
- Implementing a new authentication flow across teacher and student apps
- Building a complex feature like interactive blanks, quizzes, or grading systems

**When NOT to use:**
- Single-file changes or small bug fixes
- Straightforward features with obvious implementation
- Quick updates that don't need task breakdown

### Initiative README.md Format

Each initiative folder contains a `README.md` with:

1. **Title and Overview** - Brief description of the feature/epic
2. **Problem** - What issue this initiative solves
3. **Solution** - High-level approach
4. **Tasks** - Ordered list linking to individual task files
5. **Dependencies** - Required packages, commands, or prerequisites
6. **Key Files** - Files to be created or modified
7. **Technical Approach** - Architecture decisions and patterns
8. **Success Criteria** - Checkboxes for tracking completion
9. **Future Enhancements** - Out-of-scope ideas for later

**Example:**
```markdown
# Interactive Blanks Initiative

## Overview
Transform fill-in-the-blank exercises into interactive Tiptap nodes.

## Tasks
0. **[Update Backend Prompt](./task-0-update-backend-prompt.md)** - ⚠️ START HERE
1. **[Blank Node Foundation](./task-1-blank-node-foundation.md)** - Core node
2. **[Parsing Logic](./task-2-parsing-logic.md)** - Text to nodes

## Success Criteria
- [x] Task 0 complete
- [ ] Task 1 complete
- [ ] Task 2 complete
```

### Task File Format

Individual task files (`task-N-description.md`) should contain:
- Clear, actionable description of what needs to be done
- Specific files to create or modify
- Code examples or implementation guidance
- Acceptance criteria

**Naming convention:** `task-{number}-{short-description}.md`
- Numbers start at 0 and indicate execution order
- Use kebab-case for descriptions
- Examples: `task-0-schema-updates.md`, `task-3-student-mode.md`

### Working with Initiatives

**When planning large work:**
1. Create a new folder in `initiatives/` with a descriptive name
2. Write the `README.md` with overview, tasks, and success criteria
3. Create individual task files for each discrete step
4. Reference task files from the README in execution order
5. Update checkboxes in README as tasks complete

**When Claude suggests breaking down work:**
If you describe a large feature or complex change, Claude may suggest creating an initiative to properly plan and track the work. This ensures nothing is missed and progress is visible.

## Development Workflow

This is a **pnpm monorepo** managed by **Turborepo**. All commands should be run from the **repository root** unless otherwise specified.

**Running commands**:
- Run `pnpm run` at root to see all available scripts
- Common patterns: `pnpm dev`, `pnpm build`, `pnpm check-types`, `pnpm lint`
- Run specific apps: `pnpm dev:teacher`, `pnpm dev:student`, `pnpm dev:backend`
- Use Turborepo filters: `turbo run <task> --filter=<package>` for selective execution
- Check individual `package.json` files in each app/package for specific commands

**Backend note**: The backend requires `pnpm build:prompts` before development, which is automatically run during `pnpm dev`. Generated prompts are built from markdown files in `apps/backend/prompts/`.

**TypeScript Project References**: This monorepo uses TypeScript project references for proper type resolution across packages. Every TypeScript package/app must be referenced in the root `tsconfig.json` references array. When adding a new package or app with TypeScript, ensure it's added to the project references.

## Architecture Notes

### Teacher App (`apps/teacher`)

- **Framework**: TanStack Start (React SSR with file-based routing)
- **Purpose**: Teacher-facing application for creating and managing educational content, organizing students, and sharing collaborative documents with full editing capabilities

### Student App (`apps/student`)

- **Framework**: TanStack Start (React SSR with file-based routing)
- **Purpose**: Student-facing learning interface for accessing assigned documents and engaging with educational content in a collaborative environment with limited editing permissions

### Shared Architecture (Both Apps)

- **Routing**: TanStack Router with file-based routes in `src/routes/`
- **State/Data**: TanStack Query with Convex React Query integration
- **Authentication**: Better Auth via Convex (shared session across apps)
- **Styling**: Tailwind CSS v4
- **Forms**: TanStack Form
- **Editor**: `@package/editor` package (shared collaborative editor)
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
}).index("userId", ["userId"]);
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

### Exercises Package (`packages/exercises`)

- **Purpose**: Centralized repository for exercise type definitions
- **Status**: In-progress - defines types but doesn't export them yet
- **Contents**: 16 exercise types across 3 categories:
  - Material Providers (4 types): text-passage, audio-clip, video-content, image-prompt
  - Assessment Types (4 types): multiple-choice, true-false, fill-blanks, sequencing
  - Production Types (8 types): short-answer, summary-writing, opinion-writing, discussion-prompt, description-writing, dictation, role-play, sentence-completion
- **Current Usage**: Backend references exercise types as strings, not yet using this package
- **Future**: Will serve as type-safe shared reference once exports are added

## Git Workflow

- **Package manager**: pnpm (required, enforced via `packageManager` field)
- **Node version**: >= 18
- **Pre-commit hooks**: Configured but temporarily disabled before MVP. Will be enabled post-MVP to enforce formatting on `.md` and `.json` files via Prettier.

## Environment Setup

**Web Apps** (teacher, student, www):
- Environment variables are managed through Vercel
- Pull environment variables locally using `vercel env pull`
- See Vercel dashboard for configuration

**Backend** (Convex):
- Local development only requires Convex deployment ID
- Set up via `npx convex dev` (auto-configures on first run)
- Code executes on Convex servers - no app-level env vars needed in codebase

**Collab Server**:
- No environment variables configured yet (not deployed)

**Note**: Teacher and student apps share the same Convex backend and authentication system.

## CI/CD and Deployment

**Approach**: This repository uses Turborepo's affected detection to optimize CI/CD. Only changed apps are checked, tested, and deployed.

**CI Workflow**:
- Runs lint and type-checking only on affected packages
- Uses Turborepo remote caching via Vercel for faster builds
- See `.github/workflows/ci.yml` for implementation

**Deployments**:
- **Web Apps** (teacher, student, www): Vercel Git Integration (automatic on push)
  - Configuration in each app's `vercel.json`
- **Convex Backend**: GitHub Actions deployment when backend/frontend apps change
  - See `.github/workflows/deploy-convex.yml`
  - Requires `CONVEX_DEPLOY_KEY` secret
- **Collab Server**: Build workflow exists, deployment platform not yet configured
  - See `.github/workflows/deploy-collab-server.yml`

**GitHub Secrets Required**:
- `TURBO_TOKEN`, `TURBO_TEAM` - Remote caching
- `CONVEX_DEPLOY_KEY` - Backend deployment
- Platform-specific secrets when collab server deployment is configured

**Benefits of Affected Detection**:
- Faster CI (only check what changed)
- Reduced costs
- Quicker PR feedback

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
   - Both apps use `@package/editor` package for document viewing/editing
   - Same editor component, different permissions (canEdit prop)
   - Real-time collaboration works across both apps via Hocuspocus WebSocket server

4. **Convex Real-time**:
   - Queries automatically subscribe to real-time updates
   - Mutations invalidate queries automatically
   - Both apps connect to the same Convex deployment

5. **Workspace References**:
   - Apps reference packages via `workspace:*` protocol
   - Changes to `@package/editor` or `@package/ui` require rebuilding affected apps

6. **Turborepo Caching**: Build outputs are cached. Use `turbo build --force` to bypass cache.

7. **Path Aliases**: Both apps use path aliases configured in `tsconfig.json`. Import from `@/` to reference `src/`.

8. **shadcn Components**: Must be installed from the app directory where they'll be used (`apps/teacher` or `apps/student`), not from repo root.

9. **Authentication**:
   - Better Auth sessions are shared between apps (same domain in development)
   - Logging in to one app logs you into both
   - User profiles track both `isTeacherActive` and `isStudentActive` roles

10. **Backend Prompts**:
   - AI prompts are stored as markdown files in `apps/backend/prompts/`
   - The `pnpm build:prompts` script compiles them for use in Convex functions
   - This runs automatically during `pnpm dev` - no manual build needed
   - If you modify prompt files, the backend dev server will rebuild them automatically
