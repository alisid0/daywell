import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/db/store";
import { foodResponse } from "@/lib/food-http";

export const dynamic = "force-dynamic";
async function handle(request: Request) {
  const user = await getChatGPTUser();
  return foodResponse(request, { userId: user?.userId ?? null, database });
}
export const GET = handle;
export const POST = handle;
