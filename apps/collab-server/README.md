# Collaboration Server

A WebSocket server built with [Hocuspocus](https://tiptap.dev/docs/hocuspocus/introduction) for real-time collaborative editing with Tiptap.

## Features

- Real-time collaborative editing using Y.js CRDT
- WebSocket-based communication
- Support for multiple concurrent documents
- Connection status tracking
- User awareness (online users count)

## Getting Started

### Installation

Dependencies are managed at the monorepo root:

```bash
# From the repository root
pnpm install
```

### Development

Start the development server:

```bash
# From the repository root
turbo dev --filter=@app/collab-server

# Or from this directory
pnpm dev
```

The server will start on `ws://127.0.0.1:1234`

### Production

Build and run in production:

```bash
pnpm build
pnpm start
```

## Configuration

The server is configured in `src/index.ts`. Key configuration options:

- `port`: WebSocket server port (default: 1234)
- `onAuthenticate`: Handle client authentication
- `onCreateDocument`: Hook for new document creation
- `onChange`: Hook for document changes
- `onConnect`/`onDisconnect`: Connection lifecycle hooks

## Document Persistence

Currently, documents are stored in memory. To add persistence:

1. Uncomment the `onStoreDocument` and `onLoadDocument` hooks in `src/index.ts`
2. Implement your storage backend (database, file system, etc.)
3. Use `Y.encodeStateAsUpdate()` to serialize documents
4. Use `Y.applyUpdate()` to deserialize documents

## Authentication

The default setup allows all connections. To add authentication:

1. Update the `onAuthenticate` hook in `src/index.ts`
2. Integrate with your Better Auth setup
3. Validate tokens and return user data

Example:

```typescript
async onAuthenticate(data) {
  const { token } = data;

  // Validate token with your auth service
  const user = await validateToken(token);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return { user };
}
```

## Client Integration

The collaborative editor is available in the main app at `/collab`. See `apps/main/src/routes/collab.tsx` for implementation details.

## Architecture

- **Hocuspocus Server**: WebSocket server for real-time sync
- **Y.js**: CRDT library for conflict-free collaborative editing
- **Tiptap Collaboration Extension**: Editor integration
- **HocuspocusProvider**: Client-side provider for connecting to the server
