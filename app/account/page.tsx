import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import YourData from "./your-data";

export const dynamic = "force-dynamic";
export default async function AccountPage() {
  const user = await requireChatGPTUser("/account");
  return <YourData email={user.email} signOutHref={chatGPTSignOutPath("/")} />;
}
