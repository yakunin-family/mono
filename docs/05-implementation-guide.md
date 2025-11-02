# Implementation Guide

**Last Updated**: 2025-01-24
**Status**: Current
**Owner**: Engineering

## Overview

This document provides code examples and implementation patterns for building Lexly's collaborative features. All examples are production-ready patterns used in similar systems.

## Table of Contents

1. [Hocuspocus Server Setup](#hocuspocus-server-setup)
2. [Token Minting Endpoint](#token-minting-endpoint)
3. [Frontend Y.js Integration](#frontend-yjs-integration)
4. [Custom Tiptap Nodes](#custom-tiptap-nodes)
5. [Testing Strategy](#testing-strategy)
6. [Common Patterns](#common-patterns)

## Hocuspocus Server Setup

Example Hocuspocus server with authentication and persistence:

```typescript
// apps/hocuspocus/src/server.ts
import { Server } from '@hocuspocus/server'
import { Database } from '@hocuspocus/extension-database'
import { Logger } from '@hocuspocus/extension-logger'
import * as jose from 'jose'

const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY! // EdDSA public key
const CONVEX_URL = process.env.CONVEX_URL!

const server = Server.configure({
  port: process.env.PORT || 3001,

  // JWT-based authentication
  async onAuthenticate({ token, documentName, requestHeaders, connection }) {
    try {
      // Verify JWT signature and expiration
      const { payload } = await jose.jwtVerify(
        token,
        await jose.importSPKI(JWT_PUBLIC_KEY, 'EdDSA')
      )

      // Extract claims
      const { sub: userId, rooms, role, org } = payload as {
        sub: string
        rooms: string[]
        role: 'teacher' | 'student'
        org: string
      }

      // Check if user is allowed to access this document
      if (!rooms.includes(documentName)) {
        throw new Error('User not authorized for this room')
      }

      // Parse document name to enforce permissions
      const match = documentName.match(
        /^lesson:([^:]+):(content|answers:([^:]+))$/
      )

      if (!match) {
        throw new Error('Invalid document name format')
      }

      const [, lessonId, docType, answersUserId] = match

      // Enforce permission rules
      if (docType === 'content') {
        // Content doc: teachers can write, students read-only
        connection.readOnly = role === 'student'
      } else if (docType.startsWith('answers:')) {
        // Answers doc: student can write own, teacher can read all
        if (role === 'student' && answersUserId !== userId) {
          throw new Error('Student cannot access another student\'s answers')
        }
        connection.readOnly = role === 'teacher'
      }

      // Store user context for logging
      connection.data = { userId, role, org, lessonId }

    } catch (err) {
      console.error('Authentication failed:', err)
      throw new Error(`Authentication failed: ${err.message}`)
    }
  },

  // Track connections for monitoring
  onConnect({ documentName, connection }) {
    const { userId, role } = connection.data
    console.log(`User ${userId} (${role}) connected to ${documentName}`)
  },

  onDisconnect({ documentName, connection }) {
    const { userId } = connection.data
    console.log(`User ${userId} disconnected from ${documentName}`)
  },

  extensions: [
    // Persistence to Convex
    new Database({
      fetch: async ({ documentName }) => {
        try {
          // Fetch latest snapshot + updates from Convex
          const snapshot = await fetchFromConvex(documentName)
          return snapshot || null
        } catch (err) {
          console.error('Failed to fetch document:', err)
          return null
        }
      },
      store: async ({ documentName, state }) => {
        try {
          // Store Y.js update to Convex
          await storeToConvex(documentName, state)
        } catch (err) {
          console.error('Failed to store document:', err)
          // Don't throw - allow client to continue working
        }
      },
    }),

    // Structured logging
    new Logger(),
  ],
})

server.listen()
console.log(`Hocuspocus server listening on port ${server.configuration.port}`)

// Helper functions
async function fetchFromConvex(documentName: string): Promise<Buffer | null> {
  const response = await fetch(`${CONVEX_URL}/api/yjs/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentName }),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`)
  }

  const data = await response.json()
  return data.snapshot ? Buffer.from(data.snapshot, 'base64') : null
}

async function storeToConvex(documentName: string, state: Buffer): Promise<void> {
  const response = await fetch(`${CONVEX_URL}/api/yjs/store`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentName,
      update: state.toString('base64'),
      sizeBytes: state.length,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to store: ${response.statusText}`)
  }
}
```

### Dockerfile for Hocuspocus

```dockerfile
# apps/hocuspocus/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build TypeScript
RUN pnpm build

# Expose WebSocket port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/server.js"]
```

## Token Minting Endpoint

Convex action to issue WebSocket JWTs:

```typescript
// apps/backend/convex/collab.ts
import { v } from 'convex/values'
import { action } from './_generated/server'
import { getAuthUserId } from '@convex-dev/better-auth/server'
import { internal } from './_generated/api'
import * as jose from 'jose'

const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY! // EdDSA private key
const JWT_KEY_ID = 'collab-v1'
const HOCUSPOCUS_URL = process.env.HOCUSPOCUS_URL || 'wss://collab.lexly.io'

export const getWsToken = action({
  args: {
    lessonId: v.id('lessons'),
  },
  handler: async (ctx, { lessonId }) => {
    // Authenticate user via Better Auth
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Not authenticated')
    }

    // Fetch user and lesson to determine permissions
    const user = await ctx.runQuery(internal.users.getById, { userId })
    const lesson = await ctx.runQuery(internal.lessons.getById, { lessonId })

    if (!user) {
      throw new Error('User not found')
    }

    if (!lesson) {
      throw new Error('Lesson not found')
    }

    // Check access: user must be teacher or enrolled student
    const hasAccess =
      lesson.teacherId === userId || lesson.studentId === userId

    if (!hasAccess) {
      throw new Error('Access denied to this lesson')
    }

    // Determine role and accessible documents
    const role = lesson.teacherId === userId ? 'teacher' : 'student'
    const rooms = [
      `lesson:${lessonId}:content`,
      `lesson:${lessonId}:answers:${userId}`,
    ]

    // Issue JWT with 10min expiration
    const token = await new jose.SignJWT({
      sub: userId,
      rooms,
      role,
      org: user.orgId || 'default',
      lessonId,
    })
      .setProtectedHeader({ alg: 'EdDSA', kid: JWT_KEY_ID })
      .setIssuer('lexly-api')
      .setAudience('lexly-collab')
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(await jose.importPKCS8(JWT_PRIVATE_KEY, 'EdDSA'))

    return {
      token,
      expiresIn: 600, // seconds
      wsUrl: HOCUSPOCUS_URL,
    }
  },
})
```

### Convex Y.js Persistence Endpoints

```typescript
// apps/backend/convex/yjs.ts
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'

// Fetch Y.js document (snapshot + updates)
export const fetch = httpAction(async (ctx, request) => {
  const { documentName } = await request.json()

  // Get latest snapshot
  const snapshot = await ctx.runQuery(internal.yjs.getLatestSnapshot, {
    documentName,
  })

  // Get updates since snapshot
  const updates = snapshot
    ? await ctx.runQuery(internal.yjs.getUpdatesSince, {
        documentName,
        since: snapshot.createdAt,
      })
    : []

  return new Response(
    JSON.stringify({
      snapshot: snapshot?.data || null,
      updates: updates.map((u) => u.data),
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
})

// Store Y.js update
export const store = httpAction(async (ctx, request) => {
  const { documentName, update, sizeBytes } = await request.json()

  // Insert update
  await ctx.runMutation(internal.yjs.insertUpdate, {
    documentName,
    update,
    sizeBytes,
  })

  // Check if we should create a snapshot
  const updateCount = await ctx.runQuery(internal.yjs.getUpdateCountSinceLastSnapshot, {
    documentName,
  })

  if (updateCount >= 100) {
    await ctx.runMutation(internal.yjs.createSnapshot, {
      documentName,
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

## Frontend Y.js Integration

Example React component connecting to Hocuspocus:

```typescript
// apps/main/src/components/CollaborativeEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import { useEffect, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useConvex } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useSession } from '@/lib/auth-client'

interface CollaborativeEditorProps {
  lessonId: string
}

export function CollaborativeEditor({ lessonId }: CollaborativeEditorProps) {
  const convex = useConvex()
  const { data: session } = useSession()
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  // Fetch WebSocket token with auto-refresh
  const { data: wsAuth, refetch: refetchToken } = useQuery({
    queryKey: ['ws-token', lessonId],
    queryFn: async () => {
      const result = await convex.action(api.collab.getWsToken, { lessonId })
      return result
    },
    // Refresh token before expiry (8 min before 10 min expiry)
    refetchInterval: 8 * 60 * 1000,
    // Keep refetching even when window not focused
    refetchIntervalInBackground: true,
  })

  // Initialize Y.js document and provider
  useEffect(() => {
    if (!wsAuth) return

    const ydoc = new Y.Doc()

    const hocuspocusProvider = new HocuspocusProvider({
      url: wsAuth.wsUrl,
      name: `lesson:${lessonId}:content`,
      document: ydoc,
      token: wsAuth.token,

      onStatus: ({ status: newStatus }) => {
        setStatus(newStatus)
      },

      onAuthenticationFailed: ({ reason }) => {
        console.error('WebSocket auth failed:', reason)
        // Token might be expired, refresh it
        refetchToken()
      },

      onSynced: () => {
        console.log('Document synced with server')
      },

      // Reconnect with exponential backoff
      maxAttempts: 10,
      delay: 1000,
      timeout: 30000,
    })

    setProvider(hocuspocusProvider)

    return () => {
      hocuspocusProvider.destroy()
      ydoc.destroy()
    }
  }, [wsAuth, lessonId, refetchToken])

  // Initialize Tiptap editor with collaboration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Y.js handles undo/redo
      }),
      Collaboration.configure({
        document: provider?.document,
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: session?.user?.name || 'Anonymous',
          color: getUserColor(session?.user?.id || ''),
        },
      }),
    ],
    editable: session?.user?.role === 'teacher',
    immediatelyRender: false,
  }, [provider, session])

  return (
    <div className="border rounded-lg">
      {/* Status indicator */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/50">
        <StatusIndicator status={status} />
        <span className="text-xs text-muted-foreground">
          {status === 'connected' && 'Connected'}
          {status === 'connecting' && 'Connecting...'}
          {status === 'disconnected' && 'Disconnected - Reconnecting...'}
        </span>
      </div>

      {/* Editor */}
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function StatusIndicator({ status }: { status: string }) {
  const colors = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500 animate-pulse',
    disconnected: 'bg-red-500 animate-pulse',
  }

  return (
    <div className={`w-2 h-2 rounded-full ${colors[status] || colors.connecting}`} />
  )
}

function getUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  ]
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}
```

## Custom Tiptap Nodes

### Cloze Exercise Node

```typescript
// apps/main/src/extensions/ClozeExercise.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ClozeExerciseView } from './ClozeExerciseView'

export interface ClozeExerciseAttrs {
  instanceId: string
  exerciseId: string
  exerciseVersion: number
  snapshot: {
    kind: 'cloze'
    promptHtml: string
    blanks: Array<{
      id: string
      hint?: string
      correctAnswers: string[]
    }>
  }
}

export const ClozeExercise = Node.create({
  name: 'clozeExercise',
  group: 'block',
  atom: true, // Cannot be split by cursor
  draggable: true,

  addAttributes() {
    return {
      instanceId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-instance-id'),
        renderHTML: (attributes) => ({
          'data-instance-id': attributes.instanceId,
        }),
      },
      exerciseId: {
        default: null,
      },
      exerciseVersion: {
        default: 1,
      },
      snapshot: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="cloze-exercise"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'cloze-exercise',
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ClozeExerciseView)
  },

  addCommands() {
    return {
      insertClozeExercise:
        (attrs: ClozeExerciseAttrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          })
        },
    }
  },
})
```

### Cloze Exercise View Component

```typescript
// apps/main/src/extensions/ClozeExerciseView.tsx
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useState } from 'react'
import { Input } from '@mono/ui'
import { cn } from '@/lib/utils'

export function ClozeExerciseView({ node, updateAttributes }: NodeViewProps) {
  const { instanceId, snapshot } = node.attrs
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const handleAnswerChange = (blankId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [blankId]: value }))
    // TODO: Store answers in separate Y.js answers document
  }

  const checkAnswer = (blankId: string): boolean => {
    const blank = snapshot.blanks.find((b) => b.id === blankId)
    if (!blank) return false

    const userAnswer = answers[blankId]?.trim().toLowerCase()
    return blank.correctAnswers.some(
      (correct) => correct.toLowerCase() === userAnswer
    )
  }

  return (
    <NodeViewWrapper className="cloze-exercise">
      <div className="border rounded-lg p-4 space-y-4">
        {/* Prompt */}
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: snapshot.promptHtml }}
        />

        {/* Blanks */}
        <div className="space-y-3">
          {snapshot.blanks.map((blank) => (
            <div key={blank.id} className="flex items-center gap-3">
              <span className="text-sm font-medium w-12">{blank.id}:</span>
              <Input
                value={answers[blank.id] || ''}
                onChange={(e) => handleAnswerChange(blank.id, e.target.value)}
                placeholder={blank.hint || 'Your answer...'}
                className={cn(
                  'flex-1',
                  answers[blank.id] &&
                    (checkAnswer(blank.id)
                      ? 'border-green-500 focus-visible:ring-green-500'
                      : 'border-red-500 focus-visible:ring-red-500')
                )}
              />
              {answers[blank.id] && (
                <span className="text-xs">
                  {checkAnswer(blank.id) ? '✓' : '✗'}
                </span>
              )}
            </div>
          ))}
        </div>

        {blank.hint && (
          <div className="text-xs text-muted-foreground">
            Hint: {blank.hint}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
```

## Testing Strategy

### Unit Tests

```typescript
// apps/main/src/extensions/__tests__/ClozeExercise.test.ts
import { describe, it, expect } from 'vitest'
import { createEditor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { ClozeExercise } from '../ClozeExercise'

describe('ClozeExercise', () => {
  it('should insert cloze exercise node', () => {
    const editor = createEditor({
      extensions: [StarterKit, ClozeExercise],
      content: '',
    })

    editor.commands.insertClozeExercise({
      instanceId: 'test-instance',
      exerciseId: 'test-exercise',
      exerciseVersion: 1,
      snapshot: {
        kind: 'cloze',
        promptHtml: '<p>Test ___ blank</p>',
        blanks: [
          {
            id: 'b1',
            correctAnswers: ['test'],
          },
        ],
      },
    })

    const json = editor.getJSON()
    expect(json.content[0].type).toBe('clozeExercise')
    expect(json.content[0].attrs.instanceId).toBe('test-instance')
  })
})
```

### Integration Tests

```typescript
// apps/main/src/__tests__/collaboration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'

describe('Y.js Collaboration', () => {
  let doc1: Y.Doc
  let doc2: Y.Doc
  let provider1: HocuspocusProvider
  let provider2: HocuspocusProvider

  beforeAll(async () => {
    doc1 = new Y.Doc()
    doc2 = new Y.Doc()

    provider1 = new HocuspocusProvider({
      url: 'ws://localhost:3001',
      name: 'test-doc',
      document: doc1,
    })

    provider2 = new HocuspocusProvider({
      url: 'ws://localhost:3001',
      name: 'test-doc',
      document: doc2,
    })

    // Wait for sync
    await new Promise((resolve) => {
      provider1.on('synced', resolve)
    })
  })

  afterAll(() => {
    provider1.destroy()
    provider2.destroy()
    doc1.destroy()
    doc2.destroy()
  })

  it('should sync changes between two clients', async () => {
    const text1 = doc1.getText('shared')
    const text2 = doc2.getText('shared')

    text1.insert(0, 'Hello ')

    // Wait for sync
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(text2.toString()).toBe('Hello ')

    text2.insert(6, 'World')

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(text1.toString()).toBe('Hello World')
  })
})
```

## Common Patterns

### Handling Token Refresh

```typescript
// Auto-refresh token before expiry
const useAutoRefreshToken = (lessonId: string) => {
  const { data, refetch } = useQuery({
    queryKey: ['ws-token', lessonId],
    queryFn: () => convex.action(api.collab.getWsToken, { lessonId }),
    refetchInterval: 8 * 60 * 1000, // 8 minutes
  })

  useEffect(() => {
    if (!data) return

    // Set up timer to refresh 30s before expiry
    const refreshAt = data.expiresIn * 1000 - 30000
    const timer = setTimeout(() => refetch(), refreshAt)

    return () => clearTimeout(timer)
  }, [data, refetch])

  return data
}
```

### Offline Indicator

```typescript
// Show offline/online status
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

### Presence Awareness

```typescript
// Track remote users
const usePresence = (provider: HocuspocusProvider | null) => {
  const [users, setUsers] = useState<Array<{ name: string; color: string }>>([])

  useEffect(() => {
    if (!provider) return

    const updateUsers = () => {
      const states = provider.awareness.getStates()
      const userList = Array.from(states.values())
        .map((state: any) => state.user)
        .filter(Boolean)
      setUsers(userList)
    }

    provider.awareness.on('change', updateUsers)
    updateUsers()

    return () => {
      provider.awareness.off('change', updateUsers)
    }
  }, [provider])

  return users
}
```

---

**Related Documentation**:
- [Technical Architecture](./02-technical-architecture.md) - System design
- [Data Models](./03-data-models.md) - Schemas and structures
- [Deployment Guide](./04-deployment-guide.md) - How to deploy
