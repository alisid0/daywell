import handler from "vinext/server/fetch-handler";
import { handlePrivateCloudflareRequest } from "../lib/cloudflare-access";
import { servePrivateAssets } from "../lib/cloudflare-assets";

// Separate entry point: owned hosting never uses the local/Sites mock identity.
export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    return handlePrivateCloudflareRequest(request, env, (authenticatedRequest) =>
      servePrivateAssets(authenticatedRequest, env.ASSETS, (dynamicRequest) =>
        handler.fetch(dynamicRequest, env, ctx)));
  },
};
