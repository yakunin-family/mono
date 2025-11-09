import { api } from "@mono/backend";
import { Server } from "@hocuspocus/server";
import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import * as Y from "yjs";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Initialize Convex client
const convexUrl = process.env.CONVEX_URL;
if (!convexUrl) {
  console.error("CONVEX_URL environment variable is not set");
  process.exit(1);
}

// Store authentication tokens per connection
const connectionTokens = new Map<string, string>();

const server = Server.configure({
  port: 1234,

  // Authentication hook
  async onAuthenticate(data) {
    const { token, documentName, socketId } = data;

    if (!token) {
      console.error("Authentication failed: No token provided");
      throw new Error("Authentication token required");
    }

    try {
      // Create a temporary authenticated client to verify access
      const authClient = new ConvexHttpClient(convexUrl);
      authClient.setAuth(token);

      // Verify the user can access this document
      // This will throw if auth is invalid or user lacks access
      const document = await authClient.query(api.documents.getDocument, {
        documentId: documentName,
      });

      // Store token for this connection
      connectionTokens.set(socketId, token);

      console.log("Authentication successful:", {
        document: documentName,
        socketId: socketId,
        owner: document.owner,
      });

      return {
        user: {
          id: document.owner,
          name: document.owner,
        },
      };
    } catch (error) {
      console.error("Authentication failed:", error);
      throw new Error("Access denied to this document");
    }
  },

  // Handle document creation
  async onCreateDocument(data) {
    console.log("Document created:", {
      documentName: data.documentName,
      socketId: data.socketId,
    });
  },

  // Handle document updates
  async onChange(data) {
    console.log("Document changed:", {
      document: data.documentName,
      connections: data.context.users?.size || 0,
    });
  },

  // Handle connection events
  async onConnect(data) {
    console.log("Client connected:", {
      document: data.documentName,
      socketId: data.socketId,
      user: data.context?.user,
    });
  },

  async onDisconnect(data) {
    console.log("Client disconnected:", {
      document: data.documentName,
      socketId: data.socketId,
    });

    // Clean up stored token
    connectionTokens.delete(data.socketId);
  },

  // Persist documents to database
  async onStoreDocument(data) {
    try {
      // Get the auth token for this connection
      const token = connectionTokens.get(data.socketId);

      if (!token) {
        console.error("No auth token for connection:", data.socketId);
        return;
      }

      // Store the document in Convex
      const update = Y.encodeStateAsUpdate(data.document);

      console.log("Storing document:", {
        documentName: data.documentName,
        size: update.length,
        socketId: data.socketId,
      });

      // Create authenticated client for this request
      const authClient = new ConvexHttpClient(convexUrl);
      authClient.setAuth(token);

      // Convert Uint8Array to ArrayBuffer
      const arrayBuffer = update.buffer.slice(
        update.byteOffset,
        update.byteOffset + update.byteLength,
      ) as ArrayBuffer;

      await authClient.mutation(api.documents.saveDocumentContent, {
        documentId: data.documentName,
        content: arrayBuffer,
      });

      console.log("Document stored successfully:", data.documentName);
    } catch (error) {
      console.error("Error storing document:", error);
      // Don't throw - we don't want to crash the server
    }
  },

  async onLoadDocument(data) {
    try {
      console.log("Loading document:", data.documentName);

      // Get the auth token for this connection
      const token = connectionTokens.get(data.socketId);

      if (!token) {
        console.warn("No auth token for connection, loading empty document");
        return data.document;
      }

      // Create authenticated client for this request
      const authClient = new ConvexHttpClient(convexUrl);
      authClient.setAuth(token);

      // Load the document from Convex
      const content = await authClient.query(api.documents.loadDocumentContent, {
        documentId: data.documentName,
      });

      if (content) {
        console.log("Document loaded from database:", {
          documentName: data.documentName,
          size: content.byteLength,
        });
        Y.applyUpdate(data.document, new Uint8Array(content));
      } else {
        console.log("No stored content for document:", data.documentName);
      }
    } catch (error) {
      console.error("Error loading document:", error);
      // Don't throw - return empty document if load fails
    }

    return data.document;
  },
});

server.listen();

console.log("🚀 Hocuspocus server running on ws://127.0.0.1:1234");
