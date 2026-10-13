import handler from "vinext/server/fetch-handler";
import { handlePublicCloudflareRequest } from "../lib/public-access";
import { servePrivateAssets } from "../lib/cloudflare-assets";
import { purgeExpiredAiReports } from "../lib/ai-report";
import { purgeExpiredSignIns } from "../lib/email-sign-in";

// The public app's entry point: email sign-in instead of Cloudflare Access (docs/sign-in.md).
// Like the private entry point, it never uses the local/Sites mock identity.
export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    return handlePublicCloudflareRequest(request, env, (identifiedRequest) =>
      servePrivateAssets(identifiedRequest, env.ASSETS, (dynamicRequest) =>
        handler.fetch(dynamicRequest, env, ctx)));
  },
  // Daily clean-up: AI reports after 90 days (docs/ai-reports.md); expired sign-in codes and sessions.
  scheduled(_controller: ScheduledController, env: Cloudflare.Env, ctx: ExecutionContext) {
    if (!env.DB) return;
    ctx.waitUntil(purgeExpiredAiReports(env.DB).catch(() => undefined));
    ctx.waitUntil(purgeExpiredSignIns(env.DB).catch(() => undefined));
  },
};
