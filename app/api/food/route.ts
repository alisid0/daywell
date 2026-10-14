import { getChatGPTUser } from "@/app/chatgpt-auth";
import { allows, planBlocked } from "@/lib/plans";
import { database } from "@/db/store";
import { foodResponse } from "@/lib/food-http";

export const dynamic = "force-dynamic";
async function handle(request: Request) {
  const user = await getChatGPTUser();
  // Without a plan, people can still open what they saved, but not change it.
  if (request.method === "POST" && user && !allows(user.plan, "save")) return planBlocked("save");
  return foodResponse(request, { userId: user?.userId ?? null, database });
}
export const GET = handle;
export const POST = handle;
