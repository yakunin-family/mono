# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a **pnpm monorepo** managed by **Turborepo** with the following workspace structure:

### Apps

- **`apps/main`** - Primary application using TanStack Start (React SSR framework) with Vite
- **`apps/backend`** - Convex backend for real-time database and serverless functions
- **`apps/www`** - Marketing/landing site built with Astro

### Packages

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

# Run a specific app
turbo dev --filter=main
turbo dev --filter=backend
turbo dev --filter=www

# Build all apps
pnpm build

# Build a specific app
turbo build --filter=main

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

### Main App Commands

```bash
cd apps/main

# Run tests
pnpm test

# Development server (port 3000)
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm serve
```

## Architecture Notes

### Main App (`apps/main`)

- **Framework**: TanStack Start (React SSR with file-based routing)
- **Routing**: TanStack Router with file-based routes in `src/routes/`
- **State/Data**: TanStack Query with Convex React Query integration (`@convex-dev/react-query`)
- **Authentication**: Better Auth via Convex (`@convex-dev/better-auth`)
- **Styling**: Tailwind CSS v4 (with `@tailwindcss/vite` plugin)
- **Forms**: TanStack Form
- **Editor**: Tiptap for rich text editing
- **Environment Variables**: Type-safe env vars using `@t3-oss/env-core` (defined in `src/env.ts`)
- **Path Aliases**: Configured via `vite-tsconfig-paths` plugin

Key configuration files:
- `vite.config.ts` - Vite + TanStack Start configuration
- `src/router.tsx` - Router setup
- `src/routeTree.gen.ts` - Auto-generated route tree (do not edit manually)

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

### Main App

Required environment variables in `apps/main/.env.local`:
- `VITE_CONVEX_URL` - Convex deployment URL
- `CONVEX_DEPLOYMENT` - Convex deployment name

### Backend

Required environment variables in `apps/backend/.env.local`:
- Convex deployment credentials (set via `npx convex init` or `npx convex dev`)

## Special Considerations

1. **TanStack Router**: Routes are file-based in `apps/main/src/routes/`. Route tree is auto-generated; restart dev server after adding routes.

2. **Convex Real-time**: Queries automatically subscribe to real-time updates. Mutations invalidate queries automatically.

3. **Workspace References**: Apps reference packages via `workspace:*` protocol. Changes to packages require rebuilding.

4. **Turborepo Caching**: Build outputs are cached. Use `turbo build --force` to bypass cache.

5. **Path Aliases**: The main app uses path aliases configured in `tsconfig.json`. Import from `@/` to reference `src/`.

6. **shadcn Components**: Must be installed from the app directory where they'll be used (typically `apps/main`), not from repo root.
