import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/db/store";
import { accountResponse } from "@/lib/account-http";

export const dynamic = "force-dynamic";
async function handle(request: Request) {
  const user = await getChatGPTUser();
  return accountResponse(request, { userId: user?.userId ?? null, database });
}
export const GET = handle;
export const POST = handle;
