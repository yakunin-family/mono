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

4. **Kebab-Case for All Files** - All file names must use kebab-case (lowercase with hyphens).
   - ❌ `MyComponent.tsx`, `userProfile.ts`, `API_utils.ts`
   - ✅ `my-component.tsx`, `user-profile.ts`, `api-utils.ts`
   - This applies to all files: components, utilities, hooks, types, tests, etc.
   - Exception: Framework-required files (e.g., `README.md`, `package.json`, config files like `tsconfig.json`)

5. **TanStack Form for All Forms** - All forms must use TanStack Form (`@tanstack/react-form`).
   - Never use uncontrolled forms or other form libraries (Formik, React Hook Form, etc.)
   - Leverage TanStack Form's built-in validation and type safety

6. **TanStack Table for All Tables** - All data tables must use TanStack Table (`@tanstack/react-table`).
   - Never use plain HTML tables or other table libraries for data display
   - Leverage TanStack Table's built-in sorting, filtering, and pagination features

7. **AI Gateway for All LLM Calls** - All AI/LLM interactions must use Vercel AI Gateway with the `ai` package.

   **Why**: AI Gateway provides a unified API to access hundreds of models through a single endpoint with built-in fallbacks, load balancing, and spend monitoring.

   **For TypeScript/Node.js**, use the `ai` package with provider-prefixed model strings:

   ```typescript
   // ✅ CORRECT - Simple string model with provider prefix
   import { generateText } from "ai";

   const result = await generateText({
     model: "anthropic/claude-opus-4.5", // or 'openai/gpt-5.2', 'google/gemini-2.5-flash', etc.
     prompt: "Hello!",
   });

   // ❌ WRONG - Never use @ai-sdk provider functions
   import { anthropic } from "@ai-sdk/anthropic";

   const result = await generateText({
     model: anthropic("claude-opus-4-5-20250414"), // Don't do this
     prompt: "Hello!",
   });
   ```

   **Model Naming**: Always use the provider-prefixed model format:
   - `anthropic/claude-opus-4.5`
   - `openai/gpt-4.5`
   - `google/gemini-2.5-flash`
   - `xai/grok-4`
   - Format: `provider/model-name` (simple string, not a function call)

   **Environment Variables**:
   - Set `AI_GATEWAY_API_KEY` with your API key (supports BYOK for provider keys)
   - Never hardcode provider-specific API keys in code

8. **TanStack Query for All Convex Data Fetching** - Always use TanStack Query wrappers (`@convex-dev/react-query`) for Convex queries and mutations in all frontend code (apps and packages).

   **Why**: Convex uses WebSocket subscriptions for real-time data. When data changes on the server, Convex automatically pushes updates to all subscribed clients — no polling, no manual cache invalidation needed.

   **For queries**, use `convexQuery` with TanStack Query's `useQuery`:

   ```typescript
   // ✅ CORRECT
   import { convexQuery } from "@convex-dev/react-query";
   import { useQuery } from "@tanstack/react-query";

   const { data, isPending, error } = useQuery(
     convexQuery(api.documents.getLesson, { lessonId }),
   );

   // ❌ WRONG - Don't use native Convex useQuery hook
   import { useQuery } from "convex/react";
   const data = useQuery(api.documents.getLesson, { lessonId });
   ```

   **For mutations**, use `useConvexMutation` with TanStack Query's `useMutation`:

   ```typescript
   // ✅ CORRECT
   import { useConvexMutation } from "@convex-dev/react-query";
   import { useMutation } from "@tanstack/react-query";

   const { mutate, isPending } = useMutation({
     mutationFn: useConvexMutation(api.documents.updateLesson),
   });
   ```

   **Alternative mutation pattern** (also acceptable) — using `useConvex()` for the client:

   ```typescript
   // ✅ ALSO CORRECT - useful when you need more control
   import { useConvex } from "convex/react";
   import { useMutation } from "@tanstack/react-query";

   const convex = useConvex();
   const mutation = useMutation({
     mutationFn: async (args) => {
       return await convex.mutation(api.documents.updateLesson, args);
     },
   });
   ```

   **NEVER manually invalidate queries**:

   ```typescript
   // ❌ WRONG - Convex auto-invalidates affected queries
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ["documents"] });
   };

   // ✅ CORRECT - Just let Convex handle it
   onSuccess: () => {
     // No invalidation needed - Convex pushes updates automatically
   };
   ```

   **Key behaviors to understand**:
   - `isPending` is only `true` during initial subscription setup
   - When Convex pushes updates, `data` is replaced directly (no loading state flicker)
   - `isStale` is always `false` (data is never stale with real-time subscriptions)
   - Retry/refetch options are ignored (Convex handles retries over WebSocket)

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
- **`packages/exercises`** - Exercise type taxonomy (16 types across Material, Assessment, Production categories) - _Note: Package defines types but doesn't export them yet_

### Tooling

- **`tooling/eslint`** - Shared ESLint configurations
- **`tooling/typescript-config`** - Shared TypeScript configurations
- **`tooling/project-management`** - Dashboard generator for project-management system

## Project Management

The **`project-management/`** folder is a markdown-first task tracking system with YAML frontmatter validation.

**When working with `project-management/**/\*.md`files, use the`/project-management` skill\*\* which provides frontmatter schemas, valid values, and workflow guidance.

**Quick reference:**

- Read `project-management/_views/dashboard.md` first to understand current state
- Check `project-management/_views/errors.md` for validation issues
- See `project-management/agents.md` for complete documentation

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
- **Authentication**: WorkOS AuthKit via Convex (shared session across apps)
- **Styling**: Tailwind CSS v4
- **Forms**: TanStack Form
- **Editor**: `@package/editor` package (shared collaborative editor)
- **Environment Variables**: Type-safe env vars using `@t3-oss/env-core`
- **Path Aliases**: `@/` references `src/`

**Role Switching**: When users have both teacher and student roles active, they can switch between apps. The RoleSwitcher component updates the user's `activeRole` in Convex and redirects to the appropriate app URL.

**Component Organization** (applies to both teacher and student apps):

Components are organized by their scope:

- **`src/components/`** - Shared components used across multiple routes (e.g., `app-shell.tsx`, `AuthGate.tsx`, `user-avatar.tsx`, sidebar components)
- **`src/spaces/<route-name>/`** - Route-specific components that are only used by a particular route

Route-specific components should be placed in a folder under `src/spaces/` that matches the route name:

- `src/routes/_protected/_app/index.tsx` → `src/spaces/home/`
- `src/routes/_protected/_app/spaces.$id.tsx` → `src/spaces/space-detail/`
- `src/routes/_protected/_app/library.tsx` → `src/spaces/library/`

Example structure:

```
src/
├── components/           # Shared across routes
│   ├── app-shell.tsx
│   ├── AuthGate.tsx
│   └── sidebar/
├── spaces/               # Route-specific components
│   ├── home/
│   │   ├── spaces-list.tsx
│   │   └── invites-list.tsx
│   └── space-detail/
│       └── create-lesson-dialog.tsx
└── routes/
    └── _protected/_app/
        ├── index.tsx     # Uses components from spaces/home/
        └── spaces.$id.tsx # Uses components from spaces/space-detail/
```

**Rule**: If a component is only used by one route, it belongs in `src/spaces/<route-name>/`. Only truly shared components belong in `src/components/`.

### Backend (`apps/backend`)

- **Platform**: Convex (serverless backend-as-a-service)
- **Schema**: Defined in `convex/schema.ts` using Convex validators (`v` from `convex/values`)
- **Functions**: Queries, mutations, and actions in `convex/` directory
- **Authentication**: WorkOS AuthKit integration via HTTP endpoints (`convex/http.ts`)
- **Development Logs**: The dev server logs are automatically saved to `convex-dev.log` for debugging purposes

**Important Convex Patterns**:

- All documents have `_id` and `_creationTime` system fields (automatically indexed)
- Use `v.id('tableName')` for foreign key references
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

**Error Handling with ConvexError**:

Use `ConvexError` from `convex/values` for all user-facing errors in Convex functions. This ensures error messages are always preserved and visible in logs/client.

```ts
import { ConvexError } from "convex/values";

// ✅ CORRECT - Use ConvexError with descriptive messages
if (!document) {
  throw new ConvexError("Document not found");
}
if (!hasAccess) {
  throw new ConvexError("Not authorized to access this document");
}

// ❌ WRONG - Never use tiny-invariant or similar assertion libraries
// They strip messages in production, making debugging impossible
invariant(document, "Document not found"); // Don't do this
```

Key points:

- Always use `ConvexError` for expected error conditions (auth, permissions, validation, not found)
- Use plain `Error` only for unexpected internal errors in actions
- Error messages should be clear and user-friendly
- Never use `tiny-invariant` or similar libraries that strip messages in production

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
  - `mode` - Editor mode: `'student'` | `'teacher-lesson'` | `'teacher-editor'`
  - `websocketUrl` - Optional WebSocket server URL (default: ws://127.0.0.1:1234)
  - `onStatusChange` - Callback for connection status changes
  - `onConnectedUsersChange` - Callback for active users count

#### Tiptap Extension Development

When developing custom Tiptap extensions, follow these type-safe patterns:

**1. Type-Safe Editor Storage**

Never use `as any` to access editor storage. Instead, use module augmentation:

```typescript
// ❌ WRONG - Violates no `as any` rule
const mode = (editor.storage as any).editorMode;

// ✅ CORRECT - Use module augmentation
declare module "@tiptap/core" {
  interface Storage {
    editorMode: EditorMode;
  }
}

export const MyExtension = Node.create({
  name: "myExtension",

  addStorage() {
    return {
      editorMode: "student" as EditorMode,
    };
  },

  // ... rest of extension
});

// Now TypeScript knows about storage.editorMode
const mode = editor.storage.editorMode; // ✅ Type-safe!
```

**2. Custom Node/Mark Pattern**

Follow this structure for custom nodes (see `Blank.ts` and `Exercise.ts` as examples):

```typescript
import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MyNodeView } from './MyNodeView';

export interface MyNodeAttributes {
  // Define all node attributes with proper types
  id: string;
  value: number;
}

// Module augmentation for type safety (if using storage)
declare module '@tiptap/core' {
  interface Storage {
    myCustomStorage: string;
  }
}

export const MyNode = Node.create({
  name: 'myNode',

  // For inline nodes (appear in text flow)
  inline: true,
  atom: true,

  // For block nodes (standalone blocks)
  // group: 'block',
  // content: 'block+',

  addStorage() {
    return {
      myCustomStorage: 'default',
    };
  },

  addAttributes() {
    return {
      id: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { 'data-id': attributes.id };
        },
      },
      value: {
        default: 0,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type='my-node']' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-type': 'my-node' }),
      0, // 0 means 'render content here' (for non-atom nodes)
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MyNodeView);
  },
});
```

**3. React NodeView Pattern**

```typescript
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import type { MyNodeAttributes } from './MyNode';

interface MyNodeViewProps extends NodeViewProps {
  node: NodeViewProps['node'] & { attrs: MyNodeAttributes };
}

export function MyNodeView(props: NodeViewProps) {
  const { node, editor, updateAttributes } = props as MyNodeViewProps;

  // Access storage (type-safe thanks to module augmentation)
  const customValue = editor.storage.myCustomStorage;

  // Access attributes
  const { id, value } = node.attrs;

  // Update attributes
  const handleUpdate = () => {
    updateAttributes({ value: value + 1 });
  };

  return (
    <NodeViewWrapper as='span' className='inline-block'>
      {/* Your component UI */}
    </NodeViewWrapper>
  );
}
```

**4. Key Patterns**

- **Inline vs Block**:
  - `inline: true, atom: true` - Inline element, no cursor inside (like Blank nodes)
  - `group: 'block', content: 'block+'` - Block element with nested content (like Exercise nodes)

- **Module Augmentation**:
  - Always augment `Storage` interface when adding storage
  - Never use `as any` to bypass TypeScript

- **Attribute Serialization**:
  - Use `parseHTML` and `renderHTML` for attribute persistence
  - Store data in `data-*` attributes for HTML serialization

- **React NodeViews**:
  - Use `NodeViewWrapper` with appropriate `as` prop (`'span'` for inline, `'div'` for block)
  - Type the props interface by extending `NodeViewProps`
  - Access `updateAttributes()` to modify node data

**5. Reference Examples**

- `packages/editor/src/extensions/Blank.ts` - Inline atomic node with storage
- `packages/editor/src/extensions/Exercise.ts` - Block node with content

### UI Package (`packages/ui`)

- Shared component library using **shadcn/ui**
- Components are built with `tsup` and consumed by apps via workspace references

**Adding new components:**

- **ALWAYS use shadcn CLI**: `cd packages/ui && pnpx shadcn@latest add <component>`
- **NEVER manually create component files** - the CLI generates properly configured components with correct imports and styles
- Export new components from `packages/ui/src/index.ts` after adding them

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

8. **shadcn Components**: Install using `cd packages/ui && pnpx shadcn@latest add <component>`. Always use the CLI, never manually create shadcn component files.

9. **Authentication**:
   - WorkOS AuthKit sessions are shared between apps (same domain in development)
   - Logging in to one app logs you into both
   - User profiles track both `isTeacherActive` and `isStudentActive` roles

10. **Backend Prompts**:

- AI prompts are stored as markdown files in `apps/backend/prompts/`
- The `pnpm build:prompts` script compiles them for use in Convex functions
- This runs automatically during `pnpm dev` - no manual build needed
- If you modify prompt files, the backend dev server will rebuild them automatically
