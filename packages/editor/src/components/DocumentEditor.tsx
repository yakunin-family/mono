import { HocuspocusProvider } from "@hocuspocus/provider";
import type { Editor, JSONContent } from "@tiptap/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import * as Y from "yjs";

import { ConnectionStatus, EditorMode } from "@/types";

import { DocumentEditorInternal } from "./DocumentEditorInternal";

import type { LibraryItemWithMetadata } from "./LibraryDrawer";

export interface DocumentEditorHandle {
  getJSON: () => JSONContent | null;
  getEditor: () => Editor | null;
}

export interface DocumentEditorProps {
  convexClient: ConvexReactClient;
  queryClient: QueryClient;

  documentId: string;
  spaceId?: string;
  canEdit?: boolean;
  mode?: EditorMode;
  websocketUrl?: string;
  token?: string;
  userName?: string;
  userColor?: string;
  onStatusChange?: (status: ConnectionStatus) => void;
  onConnectedUsersChange?: (count: number) => void;
  onSaveExerciseToBank?: (title: string, content: string) => Promise<void>;
  onSaveGroupToLibrary?: (title: string, content: string) => Promise<void>;
  libraryItems?: LibraryItemWithMetadata[];
  isLoadingLibraryItems?: boolean;
  editorRef?: React.RefObject<DocumentEditorHandle | null>;
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

const EditorModeContext = createContext<EditorMode | undefined>(undefined);

export const useEditorMode = () => {
  const mode = useContext(EditorModeContext);
  if (mode === undefined) {
    throw new Error(
      "useEditorMode must be used within an EditorModeContext provider",
    );
  }

  return mode;
};

const Providers = (props: {
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  connection: ConnectionContextProps;
  mode: EditorMode;
  children: React.ReactNode;
}) => {
  return (
    <ConvexProvider client={props.convexClient}>
      <QueryClientProvider client={props.queryClient}>
        <ConnectionContext value={props.connection}>
          <EditorModeContext value={props.mode}>
            {props.children}
          </EditorModeContext>
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
  mode = "student",
  documentId,
  spaceId,
  websocketUrl = "ws://127.0.0.1:1234",
  token,
  userName = "Anonymous",
  userColor = "#999999",
  onStatusChange,
  onConnectedUsersChange,
  onSaveExerciseToBank,
  onSaveGroupToLibrary,
  libraryItems,
  isLoadingLibraryItems,
  editorRef,
}: DocumentEditorProps) => {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  // Expose editor methods via ref
  useImperativeHandle(
    editorRef,
    () => ({
      getJSON: () => editor?.getJSON() ?? null,
      getEditor: () => editor,
    }),
    [editor],
  );

  const handleEditorReady = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
  }, []);

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
      mode={mode}
    >
      <DocumentEditorInternal
        provider={provider}
        ydoc={ydoc}
        canEdit={canEdit}
        mode={mode}
        status={status}
        documentId={documentId}
        spaceId={spaceId}
        convexClient={convexClient}
        onSaveExerciseToBank={onSaveExerciseToBank}
        onSaveGroupToLibrary={onSaveGroupToLibrary}
        libraryItems={libraryItems}
        isLoadingLibraryItems={isLoadingLibraryItems}
        onEditorReady={handleEditorReady}
      />
    </Providers>
  );
};
