import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import YourData from "./your-data";

export const dynamic = "force-dynamic";
export default async function AccountPage() {
  await requireChatGPTUser("/account");
  return <YourData signOutHref={chatGPTSignOutPath("/")} />;
}
