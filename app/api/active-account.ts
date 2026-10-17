import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/db/store";
import { accountAccessResponse } from "@/lib/account-lifecycle";
export function activeAccountRoute(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Please sign in." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    const denied = await accountAccessResponse(database(), user.userId);
    if (denied) return denied;
    return handler(request);
  };
}
