import { httpRouter } from "convex/server";

import { authComponent, createAuth } from "./auth";
import * as evalHelpers from "./evalHelpers";
import * as evalSetup from "./evalSetup";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({
  path: "/eval/run",
  method: "POST",
  handler: evalHelpers.runAgentEval,
});

http.route({
  path: "/eval/setup",
  method: "POST",
  handler: evalSetup.setupEvalEnvironment,
});

http.route({
  path: "/eval/cleanup",
  method: "POST",
  handler: evalSetup.cleanupEvalEnvironment,
});

export default http;
