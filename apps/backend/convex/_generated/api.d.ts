/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _generated_prompts from "../_generated_prompts.js";
import type * as accessControl from "../accessControl.js";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as documents from "../documents.js";
import type * as exerciseGeneration from "../exerciseGeneration.js";
import type * as functions from "../functions.js";
import type * as homework from "../homework.js";
import type * as http from "../http.js";
import type * as library from "../library.js";
import type * as spaceInvites from "../spaceInvites.js";
import type * as spaces from "../spaces.js";
import type * as teachers from "../teachers.js";
import type * as userProfiles from "../userProfiles.js";
import type * as validators_chat from "../validators/chat.js";
import type * as validators_exerciseGeneration from "../validators/exerciseGeneration.js";
import type * as validators_libraryAutoTag from "../validators/libraryAutoTag.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  _generated_prompts: typeof _generated_prompts;
  accessControl: typeof accessControl;
  auth: typeof auth;
  chat: typeof chat;
  documents: typeof documents;
  exerciseGeneration: typeof exerciseGeneration;
  functions: typeof functions;
  homework: typeof homework;
  http: typeof http;
  library: typeof library;
  spaceInvites: typeof spaceInvites;
  spaces: typeof spaces;
  teachers: typeof teachers;
  userProfiles: typeof userProfiles;
  "validators/chat": typeof validators_chat;
  "validators/exerciseGeneration": typeof validators_exerciseGeneration;
  "validators/libraryAutoTag": typeof validators_libraryAutoTag;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  persistentTextStreaming: {
    lib: {
      addChunk: FunctionReference<
        "mutation",
        "internal",
        { final: boolean; streamId: string; text: string },
        any
      >;
      createStream: FunctionReference<"mutation", "internal", {}, any>;
      getStreamStatus: FunctionReference<
        "query",
        "internal",
        { streamId: string },
        "pending" | "streaming" | "done" | "error" | "timeout"
      >;
      getStreamText: FunctionReference<
        "query",
        "internal",
        { streamId: string },
        {
          status: "pending" | "streaming" | "done" | "error" | "timeout";
          text: string;
        }
      >;
      setStreamStatus: FunctionReference<
        "mutation",
        "internal",
        {
          status: "pending" | "streaming" | "done" | "error" | "timeout";
          streamId: string;
        },
        any
      >;
    };
  };
};
