import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useState, useMemo } from "react";
import * as Y from "yjs";

import { DocumentEditorInternal } from "./DocumentEditorInternal";

export interface DocumentEditorProps {
  documentId: string;
  canEdit?: boolean;
  websocketUrl?: string;
  token?: string;
  userName?: string;
  userColor?: string;
  onStatusChange?: (
    status: "connecting" | "connected" | "disconnected",
  ) => void;
  onConnectedUsersChange?: (count: number) => void;
  onCreateGeneration?: (
    promptText: string,
    model: string,
  ) => Promise<{ generationId: string; streamId: string }>;
}

/**
 * DocumentEditor handles initialization of Y.Doc and HocuspocusProvider,
 * then renders the internal editor component when everything is ready.
 *
 * This component maintains the same public API for consumers while hiding
 * the complexity of initialization internally.
 */
export function DocumentEditor({
  documentId,
  canEdit = true,
  websocketUrl = "ws://127.0.0.1:1234",
  token,
  userName = "Anonymous",
  userColor = "#999999",
  onStatusChange,
  onConnectedUsersChange,
  onCreateGeneration,
}: DocumentEditorProps) {
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);

  // Create Y.Doc that persists across renders
  const ydoc = useMemo(() => new Y.Doc(), []);

  // Initialize provider
  useEffect(() => {
    const newProvider = new HocuspocusProvider({
      url: websocketUrl,
      name: documentId,
      document: ydoc,
      token: token,
      onStatus: ({ status }) => {
        setStatus(status);
        onStatusChange?.(status);
      },
      onAwarenessUpdate: ({ states }) => {
        onConnectedUsersChange?.(states.length);
      },
      onSynced: () => {
        // Only set provider after initial sync is complete
        // This ensures Y.Doc and awareness are fully initialized
        // before CollaborationCursor tries to use them
        setProvider(newProvider);
      },
    });

    // Set user info in awareness for cursor tracking
    newProvider.setAwarenessField("user", {
      name: userName,
      color: userColor,
    });

    return () => {
      newProvider.destroy();
      setProvider(null);
    };
  }, [
    documentId,
    websocketUrl,
    token,
    userName,
    userColor,
    ydoc,
    onStatusChange,
    onConnectedUsersChange,
  ]);

  // Wait for provider to be initialized before rendering the editor
  if (!provider) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  return (
    <DocumentEditorInternal
      provider={provider}
      ydoc={ydoc}
      userName={userName}
      userColor={userColor}
      canEdit={canEdit}
      status={status}
      onCreateGeneration={onCreateGeneration}
    />
  );
}
