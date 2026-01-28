import { httpRouter } from "convex/server";

import { authComponent, createAuth } from "./auth";
import * as evalHelpers from "./evalHelpers";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({
  path: "/eval/run",
  method: "POST",
  handler: evalHelpers.runAgentEval,
});

export default http;
