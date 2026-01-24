---
status: todo
priority: high
description: Configure Vite optimization for lucide-react to reduce cold start times
tags: [performance, bundle-size, vite]
---

# Configure Barrel File Optimization for lucide-react

Multiple files import icons from the `lucide-react` barrel file which loads 1,583 modules. Configure Vite's `optimizeDeps` or use direct imports to reduce cold start times by 200-800ms.

## Problem

Current imports:

```typescript
import { Plus, Search, Settings } from "lucide-react";
```

This imports from the barrel file (`lucide-react/dist/esm/lucide-react.js`) which re-exports all 1,583 icons. Vite needs to parse and transform all of them during development, causing:

- Slow cold starts (200-800ms added)
- Large dependency pre-bundling
- Memory overhead

## Solutions

### Option A: Direct Imports (Recommended)

Change all imports to use direct paths:

```typescript
// Before
import { Plus, Search, Settings } from "lucide-react";

// After
import Plus from "lucide-react/dist/esm/icons/plus";
import Search from "lucide-react/dist/esm/icons/search";
import Settings from "lucide-react/dist/esm/icons/settings";
```

Pros:

- Most effective optimization
- No configuration needed
- Tree-shaking guaranteed

Cons:

- More verbose imports
- Need to update all existing imports

### Option B: Vite Configuration

Add to `vite.config.ts`:

```typescript
export default defineConfig({
  optimizeDeps: {
    include: ["lucide-react"],
  },
});
```

Or use `vite-plugin-optimize-barrel-imports`:

```typescript
import optimizeBarrelImports from "vite-plugin-optimize-barrel-imports";

export default defineConfig({
  plugins: [
    optimizeBarrelImports({
      packages: ["lucide-react"],
    }),
  ],
});
```

Pros:

- No import changes needed
- One-time configuration

Cons:

- Plugin adds dependency
- May not be as effective as direct imports

### Option C: Create Icon Barrel

Create a local barrel that only exports used icons:

```typescript
// src/components/icons.ts
export { Plus, Search, Settings, User } from "lucide-react";
```

Then import from local file:

```typescript
import { Plus, Search } from "@/components/icons";
```

Pros:

- Clean imports
- Easy to track which icons are used

Cons:

- Need to maintain the file
- Still loads from barrel on development

## Recommendation

Start with **Option B** (Vite configuration) for quick wins, then evaluate if **Option A** (direct imports) is needed for further optimization.

## Acceptance Criteria

- [ ] Configure optimization in vite.config.ts OR convert to direct imports
- [ ] Verify bundle size reduction (use `vite-bundle-visualizer` or similar)
- [ ] Measure cold start time improvement
- [ ] Document the approach chosen in this task or in a separate doc
- [ ] Update CLAUDE.md if establishing a pattern for icon imports
