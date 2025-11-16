import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useState, useMemo, createContext, useContext } from "react";
import * as Y from "yjs";

import { DocumentEditorInternal } from "./DocumentEditorInternal";
import { ConnectionStatus } from "@/types";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export interface DocumentEditorProps {
  convexClient: ConvexReactClient;
  queryClient: QueryClient;

  documentId: string;
  canEdit?: boolean;
  websocketUrl?: string;
  token?: string;
  userName?: string;
  userColor?: string;
  onStatusChange?: (status: ConnectionStatus) => void;
  onConnectedUsersChange?: (count: number) => void;
  onCreateGeneration?: (
    promptText: string,
    model: string,
  ) => Promise<{ generationId: string; streamId: string }>;
}

interface ConnectionContextProps {
  provider: HocuspocusProvider;
  ydoc: Y.Doc;
  status: ConnectionStatus;
}

const ConnectionContext = createContext<ConnectionContextProps | undefined>(
  undefined,
);

export const useConnection = () => {
  const connection = useContext(ConnectionContext);
  if (!connection) {
    throw new Error(
      "useConnection must be used within a ConnectionContext provider",
    );
  }

  return connection;
};

const Providers = (props: {
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  connection: ConnectionContextProps;
  children: React.ReactNode;
}) => {
  return (
    <ConvexProvider client={props.convexClient}>
      <QueryClientProvider client={props.queryClient}>
        <ConnectionContext value={props.connection}>
          {props.children}
        </ConnectionContext>
      </QueryClientProvider>
    </ConvexProvider>
  );
};

/**
 * DocumentEditor handles initialization of Y.Doc and HocuspocusProvider,
 * then renders the internal editor component when everything is ready.
 *
 * This component maintains the same public API for consumers while hiding
 * the complexity of initialization internally.
 */
export const DocumentEditor = ({
  convexClient,
  queryClient,
  canEdit = true,
  documentId,
  websocketUrl = "ws://127.0.0.1:1234",
  token,
  userName = "Anonymous",
  userColor = "#999999",
  onStatusChange,
  onCreateGeneration,
  onConnectedUsersChange,
}: DocumentEditorProps) => {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
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
    <Providers
      queryClient={queryClient}
      convexClient={convexClient}
      connection={{ provider, ydoc, status }}
    >
      <DocumentEditorInternal
        provider={provider}
        ydoc={ydoc}
        userName={userName}
        userColor={userColor}
        canEdit={canEdit}
        status={status}
        convexClient={convexClient}
        onCreateGeneration={onCreateGeneration}
      />
    </Providers>
  );
};
