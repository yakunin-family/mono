import agent from "@convex-dev/agent/convex.config";
import betterAuth from "@convex-dev/better-auth/convex.config";
import persistentTextStreaming from "@convex-dev/persistent-text-streaming/convex.config.js";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(agent);
app.use(betterAuth);
app.use(persistentTextStreaming);

export default app;
