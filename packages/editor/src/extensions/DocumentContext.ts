import { Extension } from "@tiptap/core";

export interface DocumentContextOptions {
  documentId?: string;
  spaceId?: string;
}

export interface DocumentContextStorage {
  documentId?: string;
  spaceId?: string;
}

declare module "@tiptap/core" {
  interface Storage {
    documentContext: DocumentContextStorage;
  }
}

export const DocumentContext = Extension.create<DocumentContextOptions>({
  name: "documentContext",

  addStorage() {
    return {
      documentId: this.options.documentId,
      spaceId: this.options.spaceId,
    };
  },

  addOptions() {
    return {
      documentId: undefined,
      spaceId: undefined,
    };
  },

  onCreate() {
    this.storage.documentId = this.options.documentId;
    this.storage.spaceId = this.options.spaceId;
  },
});
