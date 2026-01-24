import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    SERVER_URL: z.url().optional(),
  },

  clientPrefix: "VITE_",

  client: {
    VITE_CONVEX_URL: z.string().min(1),
    VITE_CONVEX_SITE_URL: z.string().min(1),
    VITE_SITE_URL: z.string().url().optional(),
  },

  runtimeEnv: {
    ...import.meta.env,
    ...process.env,
  },
  emptyStringAsUndefined: true,
});
