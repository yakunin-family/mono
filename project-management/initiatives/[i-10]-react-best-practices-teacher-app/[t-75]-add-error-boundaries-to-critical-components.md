---
status: todo
priority: medium
description: Add React Error Boundaries around critical sections for better error resilience
tags: [error-handling, ux]
---

# Add Error Boundaries to Critical Components

The app lacks React Error Boundaries. Add error boundaries around critical sections like the DocumentEditor and route layouts to improve resilience and user experience when errors occur.

## Problem

Currently, if an error occurs in a component:

1. The entire app crashes
2. User sees React's default error screen
3. No way to recover without full page refresh
4. Poor user experience

## Solution

### 1. Create Reusable ErrorBoundary Component

```typescript
// src/components/error-boundary.tsx
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    // Log to error tracking service
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 text-center">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 2. Wrap DocumentEditor

The editor is a complex component with many dependencies (Tiptap, Yjs, Hocuspocus). Errors here shouldn't crash the whole page:

```typescript
<ErrorBoundary
  fallback={<EditorErrorFallback onRetry={...} />}
  onError={(error) => trackError("editor", error)}
>
  <DocumentEditor ... />
</ErrorBoundary>
```

### 3. Add to Route Layouts

Add a high-level error boundary in the app layout to catch unexpected errors:

```typescript
// _protected/_app.tsx
function AppLayout() {
  return (
    <ErrorBoundary fallback={<AppErrorFallback />}>
      <AppShell>
        <Outlet />
      </AppShell>
    </ErrorBoundary>
  );
}
```

## Acceptance Criteria

- [ ] Create reusable ErrorBoundary component in `src/components/`
- [ ] Wrap DocumentEditor with error boundary
- [ ] Add fallback UI for error states (styled appropriately)
- [ ] Add error boundary to app layout for catch-all protection
- [ ] Include "Try again" functionality where appropriate
- [ ] Consider adding error logging/tracking hook
