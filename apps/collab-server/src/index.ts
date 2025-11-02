import { Server } from "@hocuspocus/server";

const server = Server.configure({
  port: 1234,

  // Optional: Add authentication
  async onAuthenticate(data) {
    const { token } = data;

    // TODO: Implement your authentication logic here
    // For now, we'll allow all connections
    // You can integrate with your Better Auth setup later
    console.log("Authentication request:", { token });

    return {
      // Return user data that will be available in other hooks
      user: {
        id: token || "anonymous",
        name: token || "Anonymous User",
      },
    };
  },

  // Optional: Handle document creation
  async onCreateDocument(data) {
    console.log("Document created:", data.documentName);
  },

  // Optional: Handle document updates
  async onChange(data) {
    console.log("Document changed:", {
      document: data.documentName,
      connections: data.context.users?.size || 0,
    });
  },

  // Optional: Handle connection events
  async onConnect(data) {
    console.log("Client connected:", {
      document: data.documentName,
      socketId: data.socketId,
    });
  },

  async onDisconnect(data) {
    console.log("Client disconnected:", {
      document: data.documentName,
      socketId: data.socketId,
    });
  },

  // Optional: Persist documents to database
  // Uncomment and implement when ready to add persistence
  /*
  async onStoreDocument(data) {
    // Store the document in your database
    // data.document contains the Y.Doc
    // data.documentName is the document identifier
    const update = Y.encodeStateAsUpdate(data.document);
    // await db.saveDocument(data.documentName, update);
  },

  async onLoadDocument(data) {
    // Load the document from your database
    // const storedUpdate = await db.loadDocument(data.documentName);
    // if (storedUpdate) {
    //   Y.applyUpdate(data.document, storedUpdate);
    // }
    return data.document;
  },
  */
});

server.listen();

console.log("🚀 Hocuspocus server running on ws://127.0.0.1:1234");
