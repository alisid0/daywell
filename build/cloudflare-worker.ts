import handler from "vinext/server/fetch-handler";
import { handlePrivateCloudflareRequest } from "../lib/cloudflare-access";
import { servePrivateAssets } from "../lib/cloudflare-assets";
import { purgeExpiredAiReports } from "../lib/ai-report";

// Separate entry point: owned hosting never uses the local/Sites mock identity.
export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    return handlePrivateCloudflareRequest(request, env, (authenticatedRequest) =>
      servePrivateAssets(authenticatedRequest, env.ASSETS, (dynamicRequest) =>
        handler.fetch(dynamicRequest, env, ctx)));
  },
  // Daily clean-up: reports of AI replies are kept for 90 days (docs/ai-reports.md).
  scheduled(_controller: ScheduledController, env: Cloudflare.Env, ctx: ExecutionContext) {
    if (env.DB) ctx.waitUntil(purgeExpiredAiReports(env.DB).catch(() => undefined));
  },
};
