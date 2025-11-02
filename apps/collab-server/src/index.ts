import { Server } from "@hocuspocus/server";

const server = Server.configure({
  port: 1234,

  // Authentication hook
  async onAuthenticate(data) {
    const { token } = data;

    // TODO: Integrate with Convex to verify lesson access
    // For now, we'll allow all connections for development
    //
    // Production implementation should:
    // 1. Verify the auth token with Better Auth/Convex
    // 2. Get the user ID from the token
    // 3. Extract lesson ID from data.documentName
    // 4. Query Convex to check if user can access the lesson:
    //    - Check if user is the teacher who owns the lesson
    //    - OR check if user is a student with lessonAccess record
    // 5. Reject connection if access denied
    //
    // Example:
    // const userId = await verifyAuthToken(token);
    // const lessonId = data.documentName;
    // const hasAccess = await checkLessonAccess(userId, lessonId);
    // if (!hasAccess) {
    //   throw new Error("Access denied to this lesson");
    // }

    console.log("Authentication request:", {
      token: token ? "present" : "none",
      document: data.documentName,
    });

    return {
      user: {
        id: token || "anonymous",
        name: token || "Anonymous User",
      },
    };
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
  },

  // Optional: Persist documents to database
  // Uncomment and implement when ready to add persistence
  /*
  async onStoreDocument(data) {
    // Store the document in your database
    // data.document contains the Y.Doc
    // data.documentName is the document identifier (lesson ID)
    const update = Y.encodeStateAsUpdate(data.document);
    // await convex.mutation(api.lessons.saveLessonContent, {
    //   lessonId: data.documentName,
    //   content: Array.from(update),
    // });
  },

  async onLoadDocument(data) {
    // Load the document from your database
    // const stored = await convex.query(api.lessons.getLessonContent, {
    //   lessonId: data.documentName,
    // });
    // if (stored?.content) {
    //   Y.applyUpdate(data.document, new Uint8Array(stored.content));
    // }
    return data.document;
  },
  */
});

server.listen();

console.log("🚀 Hocuspocus server running on ws://127.0.0.1:1234");
