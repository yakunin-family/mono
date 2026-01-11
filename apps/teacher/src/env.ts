import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    SERVER_URL: z.url().optional(),
    WORKOS_CLIENT_ID: z.string().startsWith("client_"),
    WORKOS_API_KEY: z.string().regex(/^sk_(test|live)_/),
    WORKOS_COOKIE_PASSWORD: z.string().min(32),
    WORKOS_REDIRECT_URI: z.url(),
  },

  clientPrefix: "VITE_",

  client: {
    VITE_CONVEX_URL: z.string().min(1),
  },

  runtimeEnv: {
    ...import.meta.env,
    ...process.env,
  },
  emptyStringAsUndefined: true,
});
